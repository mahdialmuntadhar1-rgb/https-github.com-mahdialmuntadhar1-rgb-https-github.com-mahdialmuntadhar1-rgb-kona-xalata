import {
    collection,
    getDocs,
    query,
    where,
    limit,
    orderBy,
    serverTimestamp,
    doc,
    setDoc,
    getDocFromServer,
    Timestamp
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, auth, functions } from '../firebase';
import type { Business, Post, User, BusinessPostcard } from '../types';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}



interface JourneyResponse {
  waypoints: Array<{
    name: string;
    address: string;
  }>;
}

interface TaglineResponse {
  tagline: string;
}

interface EnsureUserProfileInput {
  preferredRole: 'user' | 'owner';
  displayName?: string;
  photoURL?: string;
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  code?: string;
}

async function reportClientError(
  error: unknown,
  operationType: OperationType,
  path: string | null,
  source: 'firestore' | 'cloud-function'
) {
  if (!auth.currentUser) {
    return;
  }

  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : undefined;
  const code = typeof error === 'object' && error !== null && 'code' in error
    ? String((error as { code?: string }).code)
    : undefined;

  try {
    const call = httpsCallable<
      {
        operation: OperationType;
        path: string | null;
        code?: string;
        message: string;
        stack?: string;
        source: string;
        severity: 'ERROR';
      },
      { logged: boolean }
    >(functions, 'reportClientError');

    await call({
      operation: operationType,
      path,
      code,
      message,
      stack,
      source,
      severity: 'ERROR'
    });
  } catch (loggingError) {
    console.error('Failed to report client error:', loggingError);
  }
}

async function handleApiError(error: unknown, operationType: OperationType, path: string | null, source: 'firestore' | 'cloud-function') {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    code: typeof error === 'object' && error !== null && 'code' in error ? String((error as { code?: string }).code) : undefined,
    operationType,
    path
  };

  console.error('API Error:', errInfo);
  await reportClientError(error, operationType, path, source);
}

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
testConnection();

const DEFAULT_PAGE_SIZE = 50;

const sanitizeCaption = (value: unknown) => (typeof value === 'string' ? value.trim() : '');

const isSafeHttpUrl = (value: unknown) => {
  if (typeof value !== 'string') {
    return false;
  }

  try {
    const parsed = new URL(value.trim());
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

export const api = {

    async generateJourney(queryText: string): Promise<JourneyResponse> {
      try {
        const call = httpsCallable<{ query: string }, JourneyResponse>(functions, 'generateJourney');
        const result = await call({ query: queryText });
        return result.data;
      } catch (error) {
        await handleApiError(error, OperationType.WRITE, 'generateJourney', 'cloud-function');
        throw error;
      }
    },

    async generateBusinessTagline(input: { businessName: string; city: string; reviews: string }): Promise<TaglineResponse> {
      try {
        const call = httpsCallable<typeof input, TaglineResponse>(functions, 'generateBusinessTagline');
        const result = await call(input);
        return result.data;
      } catch (error) {
        await handleApiError(error, OperationType.WRITE, 'generateBusinessTagline', 'cloud-function');
        throw error;
      }
    },

    async getBusinesses(params: { category?: string; city?: string; rating?: number; limit?: number; page?: number } = {}) {
        const path = 'businesses';
        try {
            const pageSize = Math.max(1, params.limit || DEFAULT_PAGE_SIZE);
            const page = Math.max(1, params.page || 1);
            const minRating = params.rating && params.rating > 0 ? params.rating : undefined;
            const normalizedCity = params.city?.trim().toLowerCase() || '';

            let q = query(collection(db, path));

            if (params.category && params.category !== 'all') {
                q = query(q, where('category', '==', params.category));
            }

            if (minRating !== undefined) {
                q = query(q, where('rating', '>=', minRating), orderBy('rating', 'desc'), orderBy('name'));
            } else {
                q = query(q, orderBy('name'));
            }

            // NOTE: city filtering remains client-side because Firestore cannot do case-insensitive contains
            // without a dedicated normalized/searchable field and additional indexes.
            // We fetch matching documents first, then paginate after city filtering to keep `total` accurate.
            const snapshot = await getDocs(q);
            let data = snapshot.docs.map((docSnapshot) => ({ id: docSnapshot.id, ...docSnapshot.data() } as Business));
            if (normalizedCity) {
                data = data.filter((business) => (business.city || '').toLowerCase().includes(normalizedCity));
            }

            const total = data.length;
            const startIndex = (page - 1) * pageSize;
            const paginatedData = data.slice(startIndex, startIndex + pageSize);

            return {
                data: paginatedData,
                total
            };
        } catch (error) {
            await handleApiError(error, OperationType.GET, path, 'firestore');
            return { data: [], total: 0 };
        }
    },

    async getPosts() {
        const path = 'posts';
        try {
            const q = query(collection(db, path), orderBy('createdAt', 'desc'), limit(20));
            const snapshot = await getDocs(q);
            return snapshot.docs.map((docSnapshot) => {
                const data = docSnapshot.data();
                return {
                    id: docSnapshot.id,
                    ...data,
                    createdAt: data.createdAt ? (data.createdAt as Timestamp).toDate() : new Date()
                } as Post;
            });
        } catch (error) {
            await handleApiError(error, OperationType.GET, path, 'firestore');
            return [];
        }
    },

    async createPost(postData: Partial<Post>) {
        const path = 'posts';
        if (!auth.currentUser) {
            return { success: false, error: 'You must be signed in to create a post.' };
        }

        const sanitizedCaption = sanitizeCaption(postData.caption);
        if (!sanitizedCaption) {
            return { success: false, error: 'Caption is required.' };
        }

        if (postData.imageUrl && !isSafeHttpUrl(postData.imageUrl)) {
            return { success: false, error: 'Image URL must be valid http/https.' };
        }

        try {
            const postRef = doc(collection(db, path));
            await setDoc(postRef, {
                ...postData,
                caption: sanitizedCaption,
                imageUrl: (postData.imageUrl || '').trim(),
                id: postRef.id,
                createdAt: serverTimestamp(),
                likes: 0
            });

            return { success: true, id: postRef.id };
        } catch (error) {
            await handleApiError(error, OperationType.WRITE, path, 'firestore');
            return { success: false, error: 'Failed to create post. Please try again.' };
        }
    },

    async login(email: string, preferredRole: 'user' | 'owner' = 'user') {
        if (!auth.currentUser) return null;

        const path = 'ensureUserProfile';
        try {
            const call = httpsCallable<EnsureUserProfileInput, User>(functions, 'ensureUserProfile');
            const result = await call({
                preferredRole,
                displayName: auth.currentUser.displayName || email.split('@')[0],
                photoURL: auth.currentUser.photoURL || undefined
            });
            return result.data;
        } catch (error) {
            await handleApiError(error, OperationType.WRITE, path, 'cloud-function');
            return null;
        }
    },

    async upsertPostcard(postcard: BusinessPostcard) {
        const path = 'business_postcards';
        try {
            const docId = `${postcard.title}_${postcard.city}`.replace(/\s+/g, '_').toLowerCase();
            const docRef = doc(db, path, docId);

            await setDoc(docRef, {
                ...postcard,
                updatedAt: serverTimestamp()
            }, { merge: true });

            return { success: true, id: docId };
        } catch (error) {
            await handleApiError(error, OperationType.WRITE, path, 'firestore');
            return { success: false };
        }
    },

    async getPostcards(governorate?: string) {
        const path = 'business_postcards';
        try {
            let q = query(collection(db, path), orderBy('updatedAt', 'desc'));
            if (governorate && governorate !== 'all') {
                q = query(q, where('governorate', '==', governorate));
            }
            const snapshot = await getDocs(q);
            return snapshot.docs.map((docSnapshot) => {
                const data = docSnapshot.data();
                return {
                    id: docSnapshot.id,
                    ...data,
                    updatedAt: data.updatedAt ? (data.updatedAt as Timestamp).toDate() : undefined
                } as BusinessPostcard;
            });
        } catch (error) {
            await handleApiError(error, OperationType.GET, path, 'firestore');
            return [];
        }
    }
};
