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
import { businesses as mockBusinesses } from '../constants';
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

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    code: typeof error === 'object' && error !== null && 'code' in error ? String((error as { code?: string }).code) : undefined,
    operationType,
    path
  };

  console.error('Firestore Error:', errInfo);
  throw new Error(errInfo.error);
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

export const api = {

    async generateJourney(queryText: string): Promise<JourneyResponse> {
        const call = httpsCallable<{ query: string }, JourneyResponse>(functions, 'generateJourney');
        const result = await call({ query: queryText });
        return result.data;
    },

    async generateBusinessTagline(input: { businessName: string; city: string; reviews: string }): Promise<TaglineResponse> {
        const call = httpsCallable<typeof input, TaglineResponse>(functions, 'generateBusinessTagline');
        const result = await call(input);
        return result.data;
    },

    async getBusinesses(params: { category?: string; city?: string; limit?: number; page?: number } = {}) {
        const path = 'businesses';
        try {
            let q = query(collection(db, path), orderBy('name'));

            if (params.category && params.category !== 'all') {
                q = query(q, where('category', '==', params.category));
            }

            const pageSize = params.limit || 50;
            q = query(q, limit(pageSize));

            const snapshot = await getDocs(q);
            let data = snapshot.docs.map((docSnapshot) => ({ id: docSnapshot.id, ...docSnapshot.data() } as Business));

            if (params.city) {
                const cityQuery = params.city.trim().toLowerCase();
                data = data.filter((business) => (business.city || '').toLowerCase().includes(cityQuery));
            }

            if (data.length === 0) {
                return {
                    data: mockBusinesses.slice(0, pageSize),
                    total: mockBusinesses.length
                };
            }

            return {
                data,
                total: data.length
            };
        } catch (error) {
            handleFirestoreError(error, OperationType.GET, path);
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
            handleFirestoreError(error, OperationType.GET, path);
            return [];
        }
    },

    async createPost(postData: Partial<Post>) {
        const path = 'posts';
        try {
            const postRef = doc(collection(db, path));
            await setDoc(postRef, {
                ...postData,
                id: postRef.id,
                createdAt: serverTimestamp(),
                likes: 0
            });

            return { success: true, id: postRef.id };
        } catch (error) {
            handleFirestoreError(error, OperationType.WRITE, path);
            return { success: false };
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
            handleFirestoreError(error, OperationType.WRITE, path);
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
            handleFirestoreError(error, OperationType.WRITE, path);
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
            handleFirestoreError(error, OperationType.GET, path);
            return [];
        }
    }
};
