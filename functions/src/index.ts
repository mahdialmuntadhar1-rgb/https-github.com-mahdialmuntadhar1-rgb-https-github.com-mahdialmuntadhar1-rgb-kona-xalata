import { initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { HttpsError, onCall } from 'firebase-functions/https';
import { defineSecret } from 'firebase-functions/params';

initializeApp();

const GEMINI_API_KEY = defineSecret('GEMINI_API_KEY');
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 10;


const db = getFirestore();

type UserRole = 'user' | 'owner' | 'admin';

type UserProfile = {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: UserRole;
  businessId?: string;
  createdAt?: FieldValue;
  updatedAt?: FieldValue;
};

type RateLimitBucket = {
  count: number;
  windowStart: number;
};

const rateLimitStore = new Map<string, RateLimitBucket>();

export function consumeRateLimit(key: string, now: number = Date.now()): boolean {
  const bucket = rateLimitStore.get(key);

  if (!bucket || now - bucket.windowStart >= RATE_LIMIT_WINDOW_MS) {
    rateLimitStore.set(key, { count: 1, windowStart: now });
    return true;
  }

  if (bucket.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }

  bucket.count += 1;
  rateLimitStore.set(key, bucket);
  return true;
}

function sanitizeText(input: string, maxLength: number): string {
  return input.replace(/\s+/g, ' ').trim().slice(0, maxLength);
}

function ensureAuthenticated(uid?: string): string {
  if (!uid) {
    throw new HttpsError('unauthenticated', 'Authentication required');
  }

  return uid;
}

async function generateGeminiText(apiKey: string, prompt: string): Promise<string> {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          parts: [{ text: prompt }]
        }
      ]
    })
  });

  if (!response.ok) {
    throw new HttpsError('internal', 'Model request failed');
  }

  const payload = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };

  return payload.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
}

export const generateJourney = onCall(
  { secrets: [GEMINI_API_KEY] },
  async (request) => {
    const uid = ensureAuthenticated(request.auth?.uid);

    if (!consumeRateLimit(`journey:${uid}`)) {
      throw new HttpsError('resource-exhausted', 'Rate limit exceeded. Please wait before retrying.');
    }

    const query = sanitizeText(String(request.data?.query ?? ''), 300);
    if (!query) {
      throw new HttpsError('invalid-argument', 'A journey query is required.');
    }

    const raw = await generateGeminiText(
      GEMINI_API_KEY.value(),
      `Create a concise Iraq travel itinerary for: "${query}". Return only strict JSON with schema: {"waypoints":[{"name":"string","address":"string"}]}`
    );

    let parsed: { waypoints?: Array<{ name?: string; address?: string }> };

    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = { waypoints: [] };
    }

    const waypoints = (parsed.waypoints ?? [])
      .slice(0, 12)
      .map((point) => ({
        name: sanitizeText(String(point.name ?? ''), 120),
        address: sanitizeText(String(point.address ?? ''), 200)
      }))
      .filter((point) => point.name && point.address);

    return { waypoints };
  }
);

export const generateBusinessTagline = onCall(
  { secrets: [GEMINI_API_KEY] },
  async (request) => {
    const uid = ensureAuthenticated(request.auth?.uid);

    if (!consumeRateLimit(`tagline:${uid}`)) {
      throw new HttpsError('resource-exhausted', 'Rate limit exceeded. Please wait before retrying.');
    }

    const businessName = sanitizeText(String(request.data?.businessName ?? ''), 120);
    const city = sanitizeText(String(request.data?.city ?? ''), 120);
    const reviews = sanitizeText(String(request.data?.reviews ?? ''), 2000);

    if (!businessName || !city) {
      throw new HttpsError('invalid-argument', 'Business name and city are required.');
    }

    const responseText = await generateGeminiText(
      GEMINI_API_KEY.value(),
      `Write one short business tagline (max 15 words) for ${businessName} in ${city}. Use these reviews for context: ${reviews}. No emojis.`
    );

    const tagline = sanitizeText(responseText, 140);

    return {
      tagline: tagline || `${businessName} in ${city}`
    };
  }
);


export const upsertUserProfile = onCall(async (request) => {
  const uid = ensureAuthenticated(request.auth?.uid);

  const preferredRoleRaw = sanitizeText(String(request.data?.preferredRole ?? 'user'), 20).toLowerCase();
  const preferredRole: UserRole = preferredRoleRaw === 'owner' ? 'owner' : 'user';

  const authToken = request.auth?.token as Record<string, unknown> | undefined;
  const isAdmin = authToken?.admin === true;

  const email = sanitizeText(String(request.auth?.token?.email ?? request.data?.email ?? ''), 200);
  if (!email) {
    throw new HttpsError('invalid-argument', 'A valid email is required.');
  }

  const name = sanitizeText(String(request.data?.name ?? request.auth?.token?.name ?? email.split('@')[0]), 120);
  const avatar = sanitizeText(
    String(
      request.data?.avatar ??
        request.auth?.token?.picture ??
        `https://api.dicebear.com/7.x/avataaars/svg?seed=${uid}`
    ),
    400
  );

  const profileRef = db.collection('users').doc(uid);
  const existingSnapshot = await profileRef.get();

  if (!existingSnapshot.exists) {
    const role: UserRole = isAdmin ? 'admin' : preferredRole;
    const profile: UserProfile = {
      id: uid,
      name,
      email,
      avatar,
      role,
      businessId: role === 'owner' ? `b_${uid}` : undefined,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    };

    await profileRef.set(profile);
    return { ...profile, createdAt: undefined, updatedAt: undefined };
  }

  const existing = existingSnapshot.data() as UserProfile;
  const profile: UserProfile = {
    id: uid,
    name: existing.name || name,
    email: existing.email || email,
    avatar: existing.avatar || avatar,
    role: isAdmin ? 'admin' : (existing.role || 'user'),
    businessId: existing.businessId,
    updatedAt: FieldValue.serverTimestamp()
  };

  await profileRef.set(profile, { merge: true });

  return {
    id: profile.id,
    name: profile.name,
    email: profile.email,
    avatar: profile.avatar,
    role: profile.role,
    businessId: profile.businessId
  };
});
