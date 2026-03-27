// services/api.ts
import type { Business, Post, User, BusinessPostcard } from "../types";
import { hasSupabaseEnv, querySupabase } from "../src/lib/supabase";

/**
 * Data source status for the small debug chip in the UI.
 */
type BusinessDataSource = "live" | "fallback";
let businessDataSource: BusinessDataSource = hasSupabaseEnv ? "live" : "fallback";

function isSchemaMismatchError(errorMessage: string): boolean {
  const normalized = errorMessage.toLowerCase();
  return (
    normalized.includes("column") &&
    normalized.includes("does not exist")
  );
}

function mapSupabaseBusiness(row: Record<string, any>): Business {
  return {
    id: row.id,
    name: row.name || row.title || "Unnamed business",
    nameAr: row.name_ar ?? row.nameAr,
    nameKu: row.name_ku ?? row.nameKu,
    coverImage: row.cover_image ?? row.coverImage,
    imageUrl: row.image_url ?? row.imageUrl ?? row.hero_image,
    category: row.category ?? row.category_tag ?? "other",
    rating: Number(row.rating ?? 0),
    reviewCount: Number(row.review_count ?? row.reviewCount ?? 0),
    reviews: Number(row.review_count ?? row.reviewCount ?? 0),
    distance: row.distance,
    city: row.city,
    governorate: row.governorate,
    isFeatured: Boolean(row.is_featured ?? row.isFeatured ?? false),
    isPremium: Boolean(row.is_premium ?? row.isPremium ?? false),

    // IMPORTANT: never read "verified" column; only use isVerified if it exists, otherwise false
    isVerified: Boolean(row.is_verified ?? row.isVerified ?? false),

    status: row.status,
    phone: row.phone,
    address: row.address,
    website: row.website,
    description: row.description,
  } as Business;
}

export const api = {
  /**
   * Business directory: Supabase REST paging (offset + limit).
   * Loads ~1000 rows progressively (20 per page), no UI distortion.
   */
  async getBusinesses(
    params: {
      category?: string;
      city?: string;
      governorate?: string;
      offset?: number;
      limit?: number;
      featuredOnly?: boolean;
    } = {},
  ) {
    const path = "businesses";
    const pageSize = params.limit ?? 20;
    const offset = params.offset ?? 0;

    if (!hasSupabaseEnv) {
      businessDataSource = "fallback";
      // We intentionally do NOT fallback to Firebase anymore.
      return { data: [] as Business[], hasMore: false, nextOffset: offset, totalCount: undefined, source: businessDataSource };
    }

    const filters: string[] = [];

    if (params.category && params.category !== "all") {
      // support category or category_tag
      filters.push(`or=category.eq.${encodeURIComponent(params.category)},category_tag.eq.${encodeURIComponent(params.category)}`);
    }

    if (params.governorate && params.governorate !== "all") {
      filters.push(`governorate=eq.${encodeURIComponent(params.governorate)}`);
    }

    if (params.featuredOnly) {
      filters.push("is_featured=eq.true");
    }

    if (params.city?.trim()) {
      filters.push(`city=ilike.*${encodeURIComponent(params.city.trim())}*`);
    }

    const { data, error, count } = await querySupabase(path, {
      select:
        "id,name,name_ar,name_ku,cover_image,image_url,hero_image,category,category_tag,rating,review_count,distance,city,governorate,is_featured,is_premium,status,phone,address,website,description",
      orderBy: "name",
      ascending: true,
      offset,
      limit: pageSize,
      filters,
    });

    if (error) {
      // If Supabase env exists but query fails, DO NOT silently fallback.
      if (isSchemaMismatchError(error)) {
        throw new Error(
          "Directory data is temporarily unavailable due to a database schema mismatch. Please contact support or try again later.",
        );
      }
      throw new Error(`Supabase query failed: ${error}`);
    }

    businessDataSource = "live";
    const mapped = (data ?? []).map((row) => mapSupabaseBusiness(row as Record<string, any>));
    const nextOffset = offset + mapped.length;

    return {
      data: mapped,
      hasMore: typeof count === "number" ? nextOffset < count : mapped.length === pageSize,
      nextOffset,
      totalCount: count ?? undefined,
      source: businessDataSource,
    };
  },

  getBusinessDataSourceStatus() {
    return { envOk: hasSupabaseEnv, dataSource: businessDataSource } as const;
  },

  // --- Below are minimal safe implementations so the app compiles.
  // If your UI uses these sections, we can expand them later. For publish/testing, businesses is the priority.

  subscribeToPosts(_callback: (posts: Post[]) => void) {
    // No realtime/agents. Return a no-op unsubscribe.
    return () => {};
  },

  async getDeals() {
    return [];
  },

  async getStories() {
    return [];
  },

  async getEvents(_params: { category?: string; governorate?: string } = {}) {
    return [];
  },

  async createPost(_postData: Partial<Post>) {
    return { success: false };
  },

  async getOrCreateProfile(_authUser: any, _requestedRole: "user" | "owner" = "user") {
    // Supabase auth/profile wiring exists elsewhere after your merge; keep this safe.
    return null as User | null;
  },

  async upsertPostcard(_postcard: BusinessPostcard) {
    return { success: false };
  },

  async getPostcards(_governorate?: string) {
    return [] as BusinessPostcard[];
  },

  async updateProfile(_userId: string, _data: Partial<User>) {
    return { success: false };
  },
};
