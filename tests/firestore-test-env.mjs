import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import fs from 'node:fs/promises';
import path from 'node:path';

const projectId = process.env.FIREBASE_PROJECT_ID || 'iraq-compass-rules-test';

export async function setupTestEnvironment() {
  const rulesPath = path.resolve('firestore.rules');
  const rules = await fs.readFile(rulesPath, 'utf8');

  const testEnv = await initializeTestEnvironment({
    projectId,
    firestore: {
      rules,
      host: process.env.FIRESTORE_EMULATOR_HOST?.split(':')[0] || '127.0.0.1',
      port: Number(process.env.FIRESTORE_EMULATOR_HOST?.split(':')[1] || 8080),
    },
  });

  return testEnv;
}

export async function clearTestData(testEnv) {
  await testEnv.clearFirestore();
}

export async function teardownTestEnvironment(testEnv) {
  await testEnv.cleanup();
}

export { assertFails, assertSucceeds };
