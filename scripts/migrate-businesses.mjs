import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { randomUUID } from 'node:crypto';
import admin from 'firebase-admin';

const BATCH_SIZE = 500;

function parseArgs(argv) {
  const args = { file: null, collection: 'businesses' };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if ((token === '--file' || token === '-f') && argv[i + 1]) {
      args.file = argv[i + 1];
      i += 1;
    } else if ((token === '--collection' || token === '-c') && argv[i + 1]) {
      args.collection = argv[i + 1];
      i += 1;
    }
  }

  if (!args.file) {
    throw new Error('Missing required argument: --file <path-to-businesses-json>');
  }

  return args;
}

function validateBusiness(record) {
  if (!record || typeof record !== 'object') return false;
  if (!record.governorate || typeof record.governorate !== 'string') return false;
  if (!record.category || typeof record.category !== 'string') return false;
  return true;
}

function normalizeBusiness(record) {
  const id = String(record.id || record.businessId || randomUUID());
  return {
    ...record,
    id,
    governorate: String(record.governorate).trim(),
    category: String(record.category).trim(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };
}

function chunk(array, size) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

async function loadBusinesses(filePath) {
  const absolutePath = path.resolve(filePath);
  const raw = await fs.readFile(absolutePath, 'utf8');
  const parsed = JSON.parse(raw);

  if (!Array.isArray(parsed)) {
    throw new Error('Input JSON must be an array of business records.');
  }

  return parsed;
}

function initializeFirebaseAdmin() {
  if (admin.apps.length) {
    return admin.app();
  }

  return admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}

async function uploadBusinesses({ businesses, collection }) {
  initializeFirebaseAdmin();
  const db = admin.firestore();

  const validBusinesses = [];
  const invalidBusinesses = [];

  for (const record of businesses) {
    if (validateBusiness(record)) {
      validBusinesses.push(normalizeBusiness(record));
    } else {
      invalidBusinesses.push(record);
    }
  }

  const batches = chunk(validBusinesses, BATCH_SIZE);

  for (let index = 0; index < batches.length; index += 1) {
    const writeBatch = db.batch();
    const currentChunk = batches[index];

    for (const business of currentChunk) {
      const docRef = db.collection(collection).doc(String(business.id));
      writeBatch.set(docRef, business, { merge: true });
    }

    await writeBatch.commit();
    console.log(`Committed batch ${index + 1}/${batches.length} (${currentChunk.length} records).`);
  }

  console.log(`Upload complete. Valid records: ${validBusinesses.length}. Invalid records skipped: ${invalidBusinesses.length}.`);

  if (invalidBusinesses.length > 0) {
    const invalidPath = path.resolve('scripts', 'invalid-businesses.json');
    await fs.writeFile(invalidPath, JSON.stringify(invalidBusinesses, null, 2), 'utf8');
    console.log(`Wrote skipped records to ${invalidPath}`);
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const businesses = await loadBusinesses(args.file);
  await uploadBusinesses({ businesses, collection: args.collection });
}

main().catch((error) => {
  console.error('Migration failed:', error.message);
  process.exitCode = 1;
});
