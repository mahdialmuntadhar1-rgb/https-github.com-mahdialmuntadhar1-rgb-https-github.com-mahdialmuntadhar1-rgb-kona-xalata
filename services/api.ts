import type { Post, User, BusinessPostcard } from '../types';
import { fetchBusinesses } from './businesses';
import { fetchLatestPosts, } from './feed';
import { supabase, supabaseRest } from './supabase';

function normalizeUserRole(role: unknown): User['role'] {
  return role === 'owner' || role === 'admin' ? role : 'user';
}

export const api = {
  fetchBusinesses,

  async getPosts() {
    return fetchLatestPosts(20);
  },

  async createPost(postData: Partial<Post>) {
    await supabaseRest('posts', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({
        business_id: postData.businessId,
        business_name: postData.businessName,
        business_avatar: postData.businessAvatar,
        caption: postData.caption,
        image_url: postData.imageUrl,
        likes: 0,
        verified: postData.verified ?? false,
      }),
    });

    return { success: true };
  },

  async login(email: string, role: 'user' | 'owner') {
    const { data: userData } = await supabase.auth.getUser();
    const authUser = userData.user;

    if (!authUser) return null;

    const existingRole = normalizeUserRole(authUser.user_metadata?.role);
    if (!authUser.user_metadata?.role || (role === 'owner' && existingRole !== 'owner' && existingRole !== 'admin')) {
      await supabase.auth.updateUser({
        data: {
          role,
        },
      });
    }

    const finalRole = role === 'owner' ? 'owner' : existingRole;

    const user: User = {
      id: authUser.id,
      name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || email.split('@')[0],
      email: authUser.email || email,
      avatar: authUser.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${authUser.id}`,
      role: finalRole,
      businessId: finalRole === 'owner' ? `b_${authUser.id}` : undefined,
    };

    return user;
  },

  async upsertPostcard(postcard: BusinessPostcard) {
    await supabaseRest('business_postcards', {
      method: 'POST',
      headers: {
        Prefer: 'resolution=merge-duplicates,return=representation',
      },
      body: JSON.stringify({
        title: postcard.title,
        city: postcard.city,
        neighborhood: postcard.neighborhood,
        governorate: postcard.governorate,
        category_tag: postcard.category_tag,
        phone: postcard.phone,
        website: postcard.website,
        instagram: postcard.instagram,
        hero_image: postcard.hero_image,
        image_gallery: postcard.image_gallery,
        postcard_content: postcard.postcard_content,
        google_maps_url: postcard.google_maps_url,
        rating: postcard.rating,
        review_count: postcard.review_count,
        verified: postcard.verified,
      }),
    });

    return { success: true };
  },

  async getPostcards(governorate?: string) {
    const params = new URLSearchParams();
    params.set('select', '*');
    params.set('order', 'updated_at.desc');
    if (governorate && governorate !== 'all') {
      params.set('governorate', `eq.${governorate}`);
    }

    const rows = await supabaseRest<any[]>(`business_postcards?${params.toString()}`);
    return rows.map((row) => ({
      id: row.id,
      ...row,
      updatedAt: row.updated_at ? new Date(row.updated_at) : undefined,
    } as BusinessPostcard));
  },
};
