import type { RealtimeChannel } from '../src/lib/supabase';
import { supabase } from './supabase';
import type { Business, Post, User, BusinessPostcard } from '../types';
import { logger } from './logger';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface SupabaseErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string;
    email?: string;
  };
}

async function handleSupabaseError(error: unknown, operationType: OperationType, path: string | null) {
  const { data } = await supabase.auth.getUser();
  const errInfo: SupabaseErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: data.user?.id,
      email: data.user?.email,
    },
    operationType,
    path,
  };
  logger.error('Supabase request failed', errInfo);
  throw new Error(`Database operation failed (${operationType})`);
}

const toDate = (value: string | Date | null | undefined) => (value ? new Date(value) : new Date());

export const api = {
  async getBusinesses(params: { category?: string; city?: string; governorate?: string; lastDoc?: number; limit?: number; featuredOnly?: boolean; ratingMin?: number } = {}) {
    const path = 'businesses';
    try {
      const limit = params.limit || 20;
      const offset = params.lastDoc || 0;
      let query = supabase
        .from('businesses')
        .select('*', { count: 'exact' })
        .order('name')
        .range(offset, offset + limit - 1);

      if (params.category && params.category !== 'all') {
        query = query.eq('category', params.category);
      }

      if (params.governorate && params.governorate !== 'all') {
        query = query.eq('governorate', params.governorate);
      }

      if (params.city?.trim()) {
        const q = params.city.trim().replace(/,/g, ' ');
        query = query.or(`city.ilike.%${q}%,name.ilike.%${q}%`);
      }

      if (params.featuredOnly) {
        query = query.eq('isFeatured', true);
      }

      if (params.ratingMin && params.ratingMin > 0) {
        query = query.gte('rating', params.ratingMin);
      }

      const { data, error, count } = await query;

      if (error) {
        throw error;
      }

      let normalized = (data || []).map((business: any) => ({
        ...business,
        isVerified: business.isVerified ?? business.verified ?? false,
      })) as Business[];
      const totalCount = count ?? normalized.length;

      return {
        data: normalized,
        lastDoc: offset + normalized.length,
        hasMore: offset + normalized.length < totalCount,
        totalCount,
      };
    } catch (error) {
      logger.error('Supabase businesses request failed', {
        error: error instanceof Error ? error.message : String(error),
        operationType: OperationType.GET,
        path,
      });
      return { data: [], lastDoc: 0, hasMore: false, totalCount: 0 };
    }
  },

  subscribeToPosts(callback: (posts: Post[]) => void) {
    const path = 'posts';
    let channel: RealtimeChannel | null = null;
    const postMap = new Map<string, Post>();

    const loadPosts = async () => {
      const { data, error } = await supabase.from(path).select('*').order('createdAt', { ascending: false }).limit(50);
      if (error) {
        await handleSupabaseError(error, OperationType.GET, path);
        return;
      }

      const normalized = (data || []).map((post: any) => ({
          ...post,
          createdAt: toDate(post.createdAt),
      })) as Post[];

      postMap.clear();
      normalized.forEach((post) => postMap.set(post.id, post));
      callback(Array.from(postMap.values()).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
    };

    void loadPosts();

    channel = supabase
      .channel(`posts-feed-${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: path }, (payload) => {
        const eventType = payload.eventType;
        const newRecord = payload.new as Post | undefined;
        const oldRecord = payload.old as Post | undefined;

        if (eventType === 'DELETE' && oldRecord?.id) {
          postMap.delete(oldRecord.id);
        }

        if ((eventType === 'INSERT' || eventType === 'UPDATE') && newRecord?.id) {
          postMap.set(newRecord.id, {
            ...newRecord,
            createdAt: toDate((newRecord as any).createdAt),
          });
        }

        callback(Array.from(postMap.values()).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
      })
      .subscribe();

    return () => {
      if (channel) {
        void supabase.removeChannel(channel);
      }
    };
  },

  async getDeals() {
    const path = 'deals';
    try {
      const { data, error } = await supabase.from(path).select('*').order('createdAt', { ascending: false }).limit(10);
      if (error) throw error;
      return data || [];
    } catch (error) {
      await handleSupabaseError(error, OperationType.GET, path);
      return [];
    }
  },

  async getStories() {
    const path = 'stories';
    try {
      const { data, error } = await supabase.from(path).select('*').order('createdAt', { ascending: false }).limit(20);
      if (error) throw error;
      return data || [];
    } catch (error) {
      await handleSupabaseError(error, OperationType.GET, path);
      return [];
    }
  },

  async getEvents(params: { category?: string; governorate?: string } = {}) {
    const path = 'events';
    try {
      let query = supabase.from(path).select('*').order('date', { ascending: true });

      if (params.category && params.category !== 'all') {
        query = query.eq('category', params.category);
      }
      if (params.governorate && params.governorate !== 'all') {
        query = query.eq('governorate', params.governorate);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map((event: any) => ({
        ...event,
        date: toDate(event.date),
      }));
    } catch (error) {
      await handleSupabaseError(error, OperationType.GET, path);
      return [];
    }
  },

  async createPost(postData: Partial<Post>) {
    const path = 'posts';
    try {
      const { data, error } = await supabase
        .from(path)
        .insert({ ...postData, createdAt: new Date().toISOString(), likes: 0 })
        .select('id')
        .single();
      if (error) throw error;
      return { success: true, id: data.id };
    } catch (error) {
      await handleSupabaseError(error, OperationType.WRITE, path);
      return { success: false };
    }
  },

  async getOrCreateProfile(authUser: any, requestedRole: 'user' | 'owner' = 'user') {
    if (!authUser) return null;

    const path = `users/${authUser.id}`;
    try {
      const { data: existingUser, error } = await supabase.from('users').select('*').eq('id', authUser.id).maybeSingle();
      if (error) throw error;

      if (existingUser) {
        return existingUser as User;
      }

      const newUser: User = {
        id: authUser.id,
        name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User',
        email: authUser.email || '',
        avatar: authUser.user_metadata?.avatar_url || `https://www.gravatar.com/avatar/${authUser.id}?d=identicon`,
        role: requestedRole,
        businessId: requestedRole === 'owner' ? `b_${authUser.id}` : undefined,
      };

      const { data: insertedUser, error: insertError } = await supabase.from('users').insert(newUser).select('*').single();
      if (insertError) throw insertError;
      return insertedUser as User;
    } catch (error) {
      await handleSupabaseError(error, OperationType.WRITE, path);
      return null;
    }
  },

  async upsertPostcard(postcard: BusinessPostcard) {
    const path = 'business_postcards';
    try {
      const docId = `${postcard.title}_${postcard.city}`.replace(/\s+/g, '_').toLowerCase();
      const { error } = await supabase.from(path).upsert({ ...postcard, id: docId, updatedAt: new Date().toISOString() });
      if (error) throw error;
      return { success: true, id: docId };
    } catch (error) {
      await handleSupabaseError(error, OperationType.WRITE, path);
      return { success: false };
    }
  },

  async getPostcards(governorate?: string) {
    const path = 'business_postcards';
    try {
      let query = supabase.from(path).select('*').order('updatedAt', { ascending: false });
      if (governorate && governorate !== 'all') {
        query = query.eq('governorate', governorate);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map((postcard: any) => ({
        ...postcard,
        updatedAt: postcard.updatedAt ? new Date(postcard.updatedAt) : undefined,
      })) as BusinessPostcard[];
    } catch (error) {
      await handleSupabaseError(error, OperationType.GET, path);
      return [];
    }
  },

  async updateProfile(userId: string, data: Partial<User>) {
    const path = `users/${userId}`;
    try {
      const { error } = await supabase
        .from('users')
        .update({ ...data, updatedAt: new Date().toISOString() } as any)
        .eq('id', userId);
      if (error) throw error;
      return { success: true };
    } catch (error) {
      await handleSupabaseError(error, OperationType.WRITE, path);
      return { success: false };
    }
  },
};
