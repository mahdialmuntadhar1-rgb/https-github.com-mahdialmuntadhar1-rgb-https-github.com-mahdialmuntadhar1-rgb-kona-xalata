import type { User as SupabaseAuthUser } from '@supabase/supabase-js';
import { supabase } from './supabase';
import type { Business, Post, User, BusinessPostcard } from '../types';

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
}

function handleSupabaseError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: SupabaseErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path,
  };

  console.error('Supabase Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

const toDate = (value: any): Date => {
  if (!value) return new Date();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date() : date;
};


const governorateValueMap: Record<string, string> = {
  baghdad: 'Baghdad',
  basra: 'Basra',
  erbil: 'Erbil',
  sulaymaniyah: 'Sulaymaniyah',
  dohuk: 'Dohuk',
  nineveh: 'Nineveh',
  anbar: 'Al Anbar',
  babil: 'Babil',
  karbala: 'Karbala',
  najaf: 'Najaf',
  qadisiyyah: 'Al-Qādisiyyah',
  wasit: 'Wasit',
  maysan: 'Maysan',
  dhi_qar: 'Dhi Qar',
  muthanna: 'Al Muthanna',
  diyala: 'Diyala',
  kirkuk: 'Kirkuk',
  salah_al_din: 'Salah al-Din',
};

const resolveGovernorateFilter = (value?: string) => {
  if (!value || value === 'all') return undefined;
  return governorateValueMap[value.toLowerCase()] || value;
};

const categoryValueMap: Record<string, string[]> = {
  food_drink: ['food_drink', 'Food & Drink'],
  shopping: ['shopping', 'Shopping'],
  events_entertainment: ['events_entertainment', 'Events & Entertainment'],
  hotels_stays: ['hotels_stays', 'Hotels & Stays'],
  culture_heritage: ['culture_heritage', 'Culture & Heritage'],
  business_services: ['business_services', 'Business Services'],
  health_wellness: ['health_wellness', 'Health & Wellness'],
  transport_mobility: ['transport_mobility', 'Transport & Mobility'],
  public_essential: ['public_essential', 'Public & Essential'],
};

const resolveCategoryFilter = (value?: string) => {
  if (!value || value === 'all') return undefined;
  return categoryValueMap[value] || [value];
};
export const api = {
  async getBusinesses(params: {
    category?: string;
    city?: string;
    governorate?: string;
    rating?: number;
    lastDoc?: number;
    limit?: number;
    featuredOnly?: boolean;
  } = {}) {
    const path = 'businesses';

    try {
      const pageSize = params.limit || 20;
      const offset = params.lastDoc || 0;
      const end = offset + pageSize - 1;

      let query = supabase
        .from(path)
        .select('*', { count: 'exact' })
        .order('name', { ascending: true })
        .range(offset, end);

      const categoryFilter = resolveCategoryFilter(params.category);
      if (categoryFilter) {
        query = query.in('category', categoryFilter);
      }

      const governorateFilter = resolveGovernorateFilter(params.governorate);
      if (governorateFilter) {
        query = query.eq('governorate', governorateFilter);
      }

      if (params.featuredOnly) {
        query = query.eq('isFeatured', true);
      }

      const searchStr = params.city?.trim();
      if (searchStr) {
        query = query.ilike('city', `%${searchStr}%`);
      }

      if (params.rating && params.rating > 0) {
        query = query.gte('rating', params.rating);
      }

      const { data, error, count } = await query;
      if (error) throw error;

      const mapped = (data || []).map((row: any) => ({
        ...row,
        isVerified: row.isVerified ?? false,
      })) as Business[];

      const nextOffset = mapped.length === pageSize ? offset + mapped.length : undefined;
      const hasMore = typeof count === 'number' ? offset + mapped.length < count : mapped.length === pageSize;

      return {
        data: mapped,
        lastDoc: nextOffset,
        hasMore,
      };
    } catch (error) {
      handleSupabaseError(error, OperationType.GET, path);
      return { data: [], hasMore: false, lastDoc: undefined };
    }
  },

  subscribeToPosts(callback: (posts: Post[]) => void) {
    const path = 'posts';

    const fetchPosts = async () => {
      try {
        const { data, error } = await supabase
          .from(path)
          .select('*')
          .order('createdAt', { ascending: false })
          .limit(50);

        if (error) throw error;

        const posts = (data || []).map((row: any) => ({
          ...row,
          createdAt: toDate(row.createdAt),
          isVerified: row.isVerified ?? false,
          likes: row.likes ?? 0,
        })) as Post[];

        callback(posts);
      } catch (error) {
        handleSupabaseError(error, OperationType.GET, path);
      }
    };

    void fetchPosts();

    const channel = supabase
      .channel('public:posts')
      .on('postgres_changes', { event: '*', schema: 'public', table: path }, () => {
        void fetchPosts();
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  },

  async getDeals() {
    const path = 'deals';

    try {
      const { data, error } = await supabase
        .from(path)
        .select('*')
        .order('createdAt', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data || [];
    } catch (error) {
      handleSupabaseError(error, OperationType.GET, path);
      return [];
    }
  },

  async getStories() {
    const path = 'stories';

    try {
      const { data, error } = await supabase
        .from(path)
        .select('*')
        .order('createdAt', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data || [];
    } catch (error) {
      handleSupabaseError(error, OperationType.GET, path);
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

      const governorateFilter = resolveGovernorateFilter(params.governorate);
      if (governorateFilter) {
        query = query.eq('governorate', governorateFilter);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map((row: any) => ({
        ...row,
        date: toDate(row.date),
      }));
    } catch (error) {
      handleSupabaseError(error, OperationType.GET, path);
      return [];
    }
  },

  async createPost(postData: Partial<Post>, authorRole?: User['role']) {
    const path = 'posts';

    try {
      if (authorRole && !['owner', 'admin'].includes(authorRole)) {
        throw new Error('Only business owners can create posts.');
      }

      const { data, error } = await supabase
        .from(path)
        .insert({
          ...postData,
          createdAt: new Date().toISOString(),
          likes: postData.likes ?? 0,
        })
        .select('id')
        .single();

      if (error) throw error;
      return { success: true, id: data?.id };
    } catch (error) {
      handleSupabaseError(error, OperationType.WRITE, path);
      return { success: false };
    }
  },

  async getOrCreateProfile(authUser: SupabaseAuthUser | null, requestedRole: 'user' | 'owner' = 'user') {
    if (!authUser) return null;

    const path = `users/${authUser.id}`;

    try {
      const adminEmail = 'safaribosafar@gmail.com';
      const isAdminEmail = authUser.email === adminEmail && Boolean(authUser.email_confirmed_at);

      const { data: existingUser, error: selectError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      if (selectError) throw selectError;

      if (existingUser) {
        if (isAdminEmail && existingUser.role !== 'admin') {
          const { data: updatedUser, error: updateError } = await supabase
            .from('users')
            .update({ role: 'admin' })
            .eq('id', authUser.id)
            .select('*')
            .single();

          if (updateError) throw updateError;
          return updatedUser as User;
        }

        return existingUser as User;
      }

      const displayName = (authUser.user_metadata?.full_name as string | undefined)
        || (authUser.user_metadata?.name as string | undefined)
        || authUser.email?.split('@')[0]
        || 'User';

      const avatarUrl = (authUser.user_metadata?.avatar_url as string | undefined)
        || `https://api.dicebear.com/7.x/avataaars/svg?seed=${authUser.id}`;

      const newUser: User = {
        id: authUser.id,
        name: displayName,
        email: authUser.email || '',
        avatar: avatarUrl,
        role: isAdminEmail ? 'admin' : requestedRole,
        businessId: requestedRole === 'owner' ? `b_${authUser.id}` : undefined,
      };

      const { data: createdUser, error: insertError } = await supabase
        .from('users')
        .insert(newUser)
        .select('*')
        .single();

      if (insertError) throw insertError;
      return createdUser as User;
    } catch (error) {
      handleSupabaseError(error, OperationType.WRITE, path);
      return null;
    }
  },

  async upsertPostcard(postcard: BusinessPostcard) {
    const path = 'business_postcards';

    try {
      const docId = `${postcard.title}_${postcard.city}`.replace(/\s+/g, '_').toLowerCase();

      const payload = {
        ...postcard,
        id: postcard.id || docId,
        updatedAt: new Date().toISOString(),
      };

      const { error } = await supabase.from(path).upsert(payload, { onConflict: 'id' });
      if (error) throw error;

      return { success: true, id: payload.id };
    } catch (error) {
      handleSupabaseError(error, OperationType.WRITE, path);
      return { success: false };
    }
  },

  async getPostcards(governorate?: string) {
    const path = 'business_postcards';

    try {
      let query = supabase.from(path).select('*').order('updatedAt', { ascending: false });

      const governorateFilter = resolveGovernorateFilter(governorate);
      if (governorateFilter) {
        query = query.eq('governorate', governorateFilter);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map((row: any) => ({
        ...row,
        verified: row.verified ?? false,
        updatedAt: row.updatedAt ? toDate(row.updatedAt) : undefined,
      })) as BusinessPostcard[];
    } catch (error) {
      handleSupabaseError(error, OperationType.GET, path);
      return [];
    }
  },

  async updateProfile(userId: string, data: Partial<User>) {
    const path = `users/${userId}`;

    try {
      const { error } = await supabase
        .from('users')
        .update({
          ...data,
          updatedAt: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      handleSupabaseError(error, OperationType.WRITE, path);
      return { success: false };
    }
  },
};
