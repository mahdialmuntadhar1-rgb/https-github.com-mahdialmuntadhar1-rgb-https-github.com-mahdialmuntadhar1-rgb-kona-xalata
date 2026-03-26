import {
  doc,
  getDoc,
  setDoc,
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import type { Post, User, BusinessPostcard } from '../types';
import { fetchBusinesses } from './businesses';
import { fetchLatestPosts, } from './feed';
import { supabaseRest } from './supabase';

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
    if (!auth.currentUser) return null;

    const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));

    if (userDoc.exists()) {
      const userData = userDoc.data() as User;
      if (!userData.role) {
        userData.role = role;
      }
      return userData;
    }

    const newUser: User = {
      id: auth.currentUser.uid,
      name: auth.currentUser.displayName || email.split('@')[0],
      email: auth.currentUser.email || email,
      avatar: auth.currentUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${auth.currentUser.uid}`,
      role,
      businessId: role === 'owner' ? `b_${auth.currentUser.uid}` : undefined,
    };

    await setDoc(doc(db, 'users', auth.currentUser.uid), newUser);
    return newUser;
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
