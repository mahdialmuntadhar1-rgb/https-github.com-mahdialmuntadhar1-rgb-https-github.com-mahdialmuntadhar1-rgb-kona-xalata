import { 
    collection, 
    getDocs, 
    query, 
    where, 
    limit, 
    orderBy, 
    addDoc, 
    serverTimestamp, 
    doc, 
    getDoc, 
    setDoc,
    getDocFromServer,
    Timestamp,
    onSnapshot
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { hasSupabaseEnv, querySupabase } from './supabase';
import { supabase } from '../src/lib/supabase';
import type { Business, Post, User, BusinessPostcard } from '../types';

export const api = {
  async getBusinesses(params: {
    category?: string;
    city?: string;
    governorate?: string;
    lastId?: string;
    limit?: number;
    featuredOnly?: boolean;
  } = {}) {
    const pageSize = params.limit || 20;

    const filters: Array<{ key: string; op: 'eq' | 'ilike' | 'gt'; value: string | number | boolean }> = [];

    if (params.category && params.category !== 'all') {
      filters.push({ key: 'category', op: 'eq', value: params.category });
    }


type BusinessDataSource = 'live' | 'fallback';
let businessDataSource: BusinessDataSource = hasSupabaseEnv ? 'live' : 'fallback';

function mapSupabaseBusiness(row: Record<string, any>): Business {
  return {
    id: row.id,
    name: row.name || row.title || 'Unnamed business',
    nameAr: row.name_ar || row.nameAr,
    nameKu: row.name_ku || row.nameKu,
    coverImage: row.cover_image || row.coverImage,
    imageUrl: row.image_url || row.imageUrl || row.hero_image,
    category: row.category || row.category_tag || 'other',
    rating: Number(row.rating ?? 0),
    reviewCount: Number(row.review_count ?? row.reviewCount ?? 0),
    reviews: Number(row.review_count ?? row.reviewCount ?? 0),
    distance: row.distance,
    city: row.city,
    governorate: row.governorate,
    isFeatured: Boolean(row.is_featured ?? row.isFeatured ?? false),
    isPremium: Boolean(row.is_premium ?? row.isPremium ?? false),
    isVerified: Boolean(row.is_verified ?? row.isVerified ?? false),
    status: row.status,
    phone: row.phone,
    address: row.address,
    website: row.website,
    description: row.description,
  };
}

export const api = {
    async getBusinesses(params: { category?: string; city?: string; governorate?: string; offset?: number; limit?: number; featuredOnly?: boolean } = {}) {
        const path = 'businesses';
        const pageSize = params.limit || 20;
        const offset = params.offset || 0;

        if (hasSupabaseEnv) {
            const filters: string[] = [];

            if (params.category && params.category !== 'all') {
                filters.push(`or=category.eq.${params.category},category_tag.eq.${params.category}`);
            }

            if (params.governorate && params.governorate !== 'all') {
                filters.push(`governorate=eq.${params.governorate}`);
            }

            if (params.featuredOnly) {
                filters.push('is_featured=eq.true');
            }

            if (params.city?.trim()) {
                filters.push(`city=ilike.*${encodeURIComponent(params.city.trim())}*`);
            }

            const { data, error, count } = await querySupabase(path, {
                select: 'id,name,name_ar,name_ku,cover_image,image_url,hero_image,category,category_tag,rating,review_count,distance,city,governorate,is_featured,is_premium,is_verified,status,phone,address,website,description',
                orderBy: 'name',
                ascending: true,
                offset,
                limit: pageSize,
                filters,
            });

            if (!error) {
                businessDataSource = 'live';
                const mapped = (data || []).map((row) => mapSupabaseBusiness(row as Record<string, any>));
                const nextOffset = offset + mapped.length;
                return {
                    data: mapped,
                    hasMore: typeof count === 'number' ? nextOffset < count : mapped.length === pageSize,
                    nextOffset,
                    totalCount: count ?? undefined,
                    source: businessDataSource,
                };
            }

            // Supabase is configured but request failed: surface the error for visibility.
            throw new Error(`Supabase query failed: ${error}`);
        }

        // Fallback path: Firestore for environments without Supabase variables.
        businessDataSource = 'fallback';

        try {
            let q: any;
            const searchStr = params.city?.trim();

            if (searchStr) {
                q = query(
                    collection(db, path),
                    where('city', '>=', searchStr),
                    where('city', '<=', searchStr + '\uf8ff'),
                    orderBy('city'),
                    orderBy('name')
                );
            } else {
                q = query(collection(db, path), orderBy('name'));
            }

            if (params.category && params.category !== 'all') {
                q = query(q, where('category', '==', params.category));
            }

            if (params.governorate && params.governorate !== 'all') {
                q = query(q, where('governorate', '==', params.governorate));
            }

            if (params.featuredOnly) {
                q = query(q, where('isFeatured', '==', true));
            }

            q = query(q, limit(offset + pageSize));

            const snapshot = await getDocs(q);
            const allData = snapshot.docs.map((docItem) => {
                const d = docItem.data() as any;
                return {
                    id: docItem.id,
                    ...d,
                    isVerified: d.isVerified ?? d.verified ?? false,
                } as Business;
            });

            const paged = allData.slice(offset, offset + pageSize);
            const nextOffset = offset + paged.length;

            return {
                data: paged,
                hasMore: allData.length > nextOffset,
                nextOffset,
                source: businessDataSource,
            };
        } catch (error) {
            handleFirestoreError(error, OperationType.GET, path);
            return { data: [], hasMore: false, nextOffset: offset, source: businessDataSource };
        }
    },

    getBusinessDataSourceStatus() {
        return {
            envOk: hasSupabaseEnv,
            dataSource: businessDataSource,
        } as const;
    },

    /**
     * Real-time subscription for the social feed.
     * Real-time is used here because social feeds are dynamic and users expect to see
     * new posts, likes, and updates immediately without refreshing.
     */
    subscribeToPosts(callback: (posts: Post[]) => void) {
        const path = 'posts';
        const q = query(collection(db, path), orderBy('createdAt', 'desc'), limit(50));
        
        return onSnapshot(q, (snapshot) => {
            const postsMap = new Map<string, Post>();
            
            snapshot.docs.forEach(doc => {
                const data = doc.data();
                const post = { 
                    id: doc.id, 
                    ...data,
                    createdAt: data.createdAt ? (data.createdAt as Timestamp).toDate() : new Date()
                } as Post;
                postsMap.set(post.id, post);
            });
            
            // Convert map back to array and ensure order is maintained (Map preserves insertion order)
            callback(Array.from(postsMap.values()));
        }, (error) => {
            handleFirestoreError(error, OperationType.GET, path);
        });
    },

    /**
     * One-time fetch for deals.
     * One-time fetch is used because deals are relatively static listings that don't
     * change frequently enough to justify the overhead of a real-time connection.
     */
    async getDeals() {
        const path = 'deals';
        try {
            const q = query(collection(db, path), orderBy('createdAt', 'desc'), limit(10));
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
        } catch (error) {
            handleFirestoreError(error, OperationType.GET, path);
            return [];
        }
    },

    /**
     * One-time fetch for stories.
     * Stories are fetched once on load to provide a stable browsing experience.
     */
    async getStories() {
        const path = 'stories';
        try {
            const q = query(collection(db, path), orderBy('createdAt', 'desc'), limit(20));
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
        } catch (error) {
            handleFirestoreError(error, OperationType.GET, path);
            return [];
        }
    },

    /**
     * One-time fetch for events.
     * Events are scheduled items; real-time updates are not critical for a general directory view.
     */
    async getEvents(params: { category?: string; governorate?: string } = {}) {
        const path = 'events';
        try {
            let q = query(collection(db, path), orderBy('date', 'asc'));
            if (params.category && params.category !== 'all') {
                q = query(q, where('category', '==', params.category));
            }
            if (params.governorate && params.governorate !== 'all') {
                q = query(q, where('governorate', '==', params.governorate));
            }
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    date: data.date ? (data.date as Timestamp).toDate() : new Date()
                } as any;
            });
        } catch (error) {
            handleFirestoreError(error, OperationType.GET, path);
            return [];
        }
    },

    async createPost(postData: Partial<Post>) {
        const path = 'posts';
        try {
            const docRef = await addDoc(collection(db, path), {
                ...postData,
                createdAt: serverTimestamp(),
                likes: 0
            });
            return { success: true, id: docRef.id };
        } catch (error) {
            handleFirestoreError(error, OperationType.WRITE, path);
            return { success: false };
        }
    },

    async getOrCreateProfile(firebaseUser: any, requestedRole: 'user' | 'owner' = 'user') {
        if (!firebaseUser) return null;
        
        const path = `users/${firebaseUser.uid}`;
        try {
            const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
            
            // Check if this is the admin email for bootstrapping
            const isAdminEmail = firebaseUser.email === 'safaribosafar@gmail.com';
            
            if (userDoc.exists()) {
                const userData = userDoc.data() as User;
                
                // If it's the admin email, ensure they have the admin role in the DB
                if (isAdminEmail && userData.role !== 'admin') {
                    const updatedUser = { ...userData, role: 'admin' as any };
                    await setDoc(doc(db, 'users', firebaseUser.uid), updatedUser, { merge: true });
                    return updatedUser;
                }
                
                return userData;
            } else {
                // New user creation
                const newUser: User = {
                    id: firebaseUser.uid,
                    name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
                    email: firebaseUser.email || '',
                    avatar: firebaseUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${firebaseUser.uid}`,
                    role: isAdminEmail ? 'admin' as any : requestedRole,
                    businessId: requestedRole === 'owner' ? `b_${firebaseUser.uid}` : undefined
                };
                await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
                return newUser;
            }
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
            return snapshot.docs.map(doc => {
                const data = doc.data();
                return { 
                    id: doc.id, 
                    ...data,
                    updatedAt: data.updatedAt ? (data.updatedAt as Timestamp).toDate() : undefined
                } as BusinessPostcard;
            });
        } catch (error) {
            handleFirestoreError(error, OperationType.GET, path);
            return [];
        }
    },

    async updateProfile(userId: string, data: Partial<User>) {
        const path = `users/${userId}`;
        try {
            await setDoc(doc(db, 'users', userId), {
                ...data,
                updatedAt: serverTimestamp()
            }, { merge: true });
            return { success: true };
        } catch (error) {
            handleFirestoreError(error, OperationType.WRITE, path);
            return { success: false };
    if (params.city?.trim()) {
      filters.push({ key: 'city', op: 'ilike', value: `%${params.city.trim()}%` });
    }

    if (params.governorate && params.governorate !== 'all') {
      filters.push({ key: 'governorate', op: 'eq', value: params.governorate });
    }

    if (params.featuredOnly) {
      filters.push({ key: 'isFeatured', op: 'eq', value: true });
    }

    if (params.lastId) {
      filters.push({ key: 'id', op: 'gt', value: params.lastId });
    }

    const { data, error } = await supabase.select('businesses', {
      filters,
      order: { column: 'id', ascending: true },
      limit: pageSize,
    });

    if (error) {
      console.error('Supabase getBusinesses error:', error);
      throw error;
    }

    const businesses = ((data as any[]) || []).map((row: any) => ({
      ...row,
      id: row.id,
      isVerified: row.isVerified ?? false,
    })) as Business[];

    const lastId = businesses.length > 0 ? String(businesses[businesses.length - 1].id) : undefined;

    return {
      data: businesses,
      lastId,
      hasMore: businesses.length === pageSize,
    };
  },

  subscribeToPosts(callback: (posts: Post[]) => void) {
    let active = true;

    const pull = async () => {
      const { data, error } = await supabase.select('posts', {
        order: { column: 'createdAt', ascending: false },
        limit: 50,
      });

      if (!active) return;

      if (error) {
        console.error('Supabase posts fetch error:', error);
        return;
      }

      const posts = ((data as any[]) || []).map((post) => ({
        ...post,
        createdAt: post.createdAt ? new Date(post.createdAt) : new Date(),
      })) as Post[];

      callback(posts);
    };

    pull();
    const timer = window.setInterval(pull, 5000);

    return () => {
      active = false;
      window.clearInterval(timer);
    };
  },

  async getDeals() {
    const { data, error } = await supabase.select('deals', {
      order: { column: 'createdAt', ascending: false },
      limit: 10,
    });

    if (error) {
      console.error('Supabase getDeals error:', error);
      return [];
    }

    return (data as any[]) || [];
  },

  async getStories() {
    const { data, error } = await supabase.select('stories', {
      order: { column: 'createdAt', ascending: false },
      limit: 20,
    });

    if (error) {
      console.error('Supabase getStories error:', error);
      return [];
    }

    return (data as any[]) || [];
  },

  async getEvents(params: { category?: string; governorate?: string } = {}) {
    const filters: Array<{ key: string; op: 'eq' | 'ilike' | 'gt'; value: string | number | boolean }> = [];

    if (params.category && params.category !== 'all') {
      filters.push({ key: 'category', op: 'eq', value: params.category });
    }

    if (params.governorate && params.governorate !== 'all') {
      filters.push({ key: 'governorate', op: 'eq', value: params.governorate });
    }

    const { data, error } = await supabase.select('events', {
      filters,
      order: { column: 'date', ascending: true },
    });

    if (error) {
      console.error('Supabase getEvents error:', error);
      return [];
    }

    return ((data as any[]) || []).map((event) => ({
      ...event,
      date: event.date ? new Date(event.date) : new Date(),
    }));
  },

  async createPost(postData: Partial<Post>) {
    const { data, error } = await supabase.insert(
      'posts',
      {
        ...postData,
        createdAt: new Date().toISOString(),
        likes: postData.likes ?? 0,
      },
      true,
    );

    if (error) {
      console.error('Supabase createPost error:', error);
      return { success: false };
    }

    return { success: true, id: (data as any)?.id };
  },

  async getOrCreateProfile(authUser: any, requestedRole: 'user' | 'owner' = 'user') {
    if (!authUser) return null;

    const isAdminEmail = authUser.email === 'safaribosafar@gmail.com';

    const { data: existingUser, error: fetchError } = await supabase.select('users', {
      filters: [{ key: 'id', op: 'eq', value: authUser.id }],
      single: true,
    });

    if (fetchError) {
      console.error('Supabase getOrCreateProfile fetch error:', fetchError);
      return null;
    }

    if (existingUser) {
      const current = existingUser as User;

      if (isAdminEmail && current.role !== 'admin') {
        const { error: updateError } = await supabase.update(
          'users',
          { role: 'admin' },
          [{ key: 'id', value: authUser.id }],
        );

        if (updateError) {
          console.error('Supabase admin update error:', updateError);
          return current;
        }

        return { ...current, role: 'admin' as const };
      }

      return current;
    }

    const newUser: User = {
      id: authUser.id,
      name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User',
      email: authUser.email || '',
      avatar: authUser.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${authUser.id}`,
      role: isAdminEmail ? 'admin' : requestedRole,
      businessId: requestedRole === 'owner' ? `b_${authUser.id}` : undefined,
    };

    const { data, error } = await supabase.insert('users', newUser, true);

    if (error) {
      console.error('Supabase getOrCreateProfile insert error:', error);
      return null;
    }

    return data as User;
  },

  async upsertPostcard(postcard: BusinessPostcard) {
    const docId = `${postcard.title}_${postcard.city}`.replace(/\s+/g, '_').toLowerCase();

    const { error } = await supabase.upsert(
      'business_postcards',
      {
        ...postcard,
        id: docId,
        updatedAt: new Date().toISOString(),
      },
      'id',
    );

    if (error) {
      console.error('Supabase upsertPostcard error:', error);
      return { success: false };
    }

    return { success: true, id: docId };
  },

  async getPostcards(governorate?: string) {
    const filters: Array<{ key: string; op: 'eq' | 'ilike' | 'gt'; value: string | number | boolean }> = [];

    if (governorate && governorate !== 'all') {
      filters.push({ key: 'governorate', op: 'eq', value: governorate });
    }

    const { data, error } = await supabase.select('business_postcards', {
      filters,
      order: { column: 'updatedAt', ascending: false },
    });

    if (error) {
      console.error('Supabase getPostcards error:', error);
      return [];
    }

    return ((data as any[]) || []).map((postcard) => ({
      ...postcard,
      updatedAt: postcard.updatedAt ? new Date(postcard.updatedAt) : undefined,
    })) as BusinessPostcard[];
  },

  async updateProfile(userId: string, data: Partial<User>) {
    const { error } = await supabase.update(
      'users',
      { ...data, updatedAt: new Date().toISOString() },
      [{ key: 'id', value: userId }],
    );

    if (error) {
      console.error('Supabase updateProfile error:', error);
      return { success: false };
    }

    return { success: true };
  },
};
