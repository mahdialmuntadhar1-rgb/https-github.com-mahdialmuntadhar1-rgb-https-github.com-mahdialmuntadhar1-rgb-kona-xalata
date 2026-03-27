// services/api.ts
import type { Business, Post, User, BusinessPostcard } from "../types";
import { hasSupabaseEnv, querySupabase } from "./supabase";
import { supabase } from "../src/lib/supabase";
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

function getErrorMessage(error: unknown, fallback: string): string {
  if (!error) return fallback;
  if (typeof error === "string") return error;
  if (typeof error === "object") {
    const maybeMessage = (error as { message?: string }).message;
    if (maybeMessage) return maybeMessage;
  }
  return fallback;
}

function normalizeRole(role: unknown): User["role"] {
  if (role === "owner" || role === "admin") return role;
  return "user";
}

function buildNameFromAuth(authUser: { email?: string; user_metadata?: Record<string, any> }): string {
  const metadata = authUser.user_metadata || {};
  const fullName = metadata.full_name || metadata.name;
  if (typeof fullName === "string" && fullName.trim()) return fullName.trim();

  if (authUser.email) {
    const localPart = authUser.email.split("@")[0] || "Iraq Compass User";
    return localPart.replace(/[._-]+/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
  }

  return "Iraq Compass User";
}

function mapProfileRowToUser(row: Record<string, any>, authUser: { id: string; email?: string; user_metadata?: Record<string, any> }, fallbackRole: "user" | "owner"): User {
  const role = normalizeRole(row.role ?? fallbackRole);
  const avatar = row.avatar_url ?? row.avatar ?? authUser.user_metadata?.avatar_url ?? authUser.user_metadata?.picture ?? `https://i.pravatar.cc/150?u=${authUser.id}`;

  return {
    id: String(row.id ?? authUser.id),
    name: row.name ?? buildNameFromAuth(authUser),
    email: row.email ?? authUser.email ?? "",
    avatar,
    role,
    businessId: row.business_id ?? row.businessId ?? undefined,
  };
}

export const api = {
  /**
   * Business directory: Supabase REST paging (offset + limit).
   * Loads ~1000 rows progressively (20 per page), no UI distortion.
   */
  async getBusinesses(
    params: {
      category?: string;
      ratingMin?: number;
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
      // Keep fallback empty; do not silently switch to any alternate backend.
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

    if (typeof params.ratingMin === "number" && params.ratingMin > 0) {
      filters.push(`rating=gte.${params.ratingMin}`);
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

  subscribeToPosts(_callback: (posts: Post[]) => void) {
    // MVP containment: provide a static empty feed and avoid hanging loading states.
    _callback([]);
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

  async getCurrentProfile() {
    const { data } = await supabase.auth.getSession();
    const authUser = data.session?.user;
    if (!authUser) return null;

    return this.getOrCreateProfile(authUser, "user");
  },

  async getOrCreateProfile(authUser: any, requestedRole: "user" | "owner" = "user") {
    if (!authUser?.id) {
      return null as User | null;
    }

    const fallbackUser = mapProfileRowToUser({ role: requestedRole }, authUser, requestedRole);

    if (!hasSupabaseEnv) {
      return fallbackUser;
    }

    const { data: existingProfile, error: selectError } = await supabase.select("profiles", {
      filters: [{ key: "id", op: "eq", value: authUser.id }],
      single: true,
    });

    if (selectError) {
      console.warn("Failed to fetch profile; using session-backed fallback profile.", selectError);
      return fallbackUser;
    }

    if (existingProfile) {
      return mapProfileRowToUser(existingProfile as Record<string, any>, authUser, requestedRole);
    }

    const profilePayload = {
      id: authUser.id,
      name: buildNameFromAuth(authUser),
      email: authUser.email ?? "",
      avatar_url: authUser.user_metadata?.avatar_url ?? authUser.user_metadata?.picture ?? `https://i.pravatar.cc/150?u=${authUser.id}`,
      role: requestedRole,
    };

    const { data: createdProfile, error: insertError } = await supabase.insert("profiles", profilePayload, true);

    if (insertError) {
      console.warn("Failed to create profile row; using session-backed fallback profile.", insertError);
      return fallbackUser;
    }

    return mapProfileRowToUser((createdProfile as Record<string, any>) || profilePayload, authUser, requestedRole);
  },

  async upsertPostcard(_postcard: BusinessPostcard) {
    return { success: false };
  },

  async getPostcards(_governorate?: string) {
    return [] as BusinessPostcard[];
  },

  async updateProfile(userId: string, data: Partial<User>) {
    if (!userId) {
      return { success: false, error: "Missing user id." };
    }

    if (!hasSupabaseEnv) {
      return { success: false, error: "Supabase environment variables are missing." };
    }

    const payload: Record<string, unknown> = {};
    if (typeof data.name === "string") payload.name = data.name.trim();
    if (typeof data.email === "string") payload.email = data.email.trim();
    if (typeof data.avatar === "string") payload.avatar_url = data.avatar;

    if (!Object.keys(payload).length) {
      return { success: false, error: "No profile fields to update." };
    }

    const { error } = await supabase.update("profiles", payload, [{ key: "id", value: userId }]);
    if (error) {
      return { success: false, error: getErrorMessage(error, "Failed to update profile.") };
    }

    return { success: true };
  },
};
