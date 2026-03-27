// components/BusinessDirectory.tsx
import React, { useEffect, useState } from "react";
import { categories } from "../constants";
import { api } from "../services/api";
import type { Business } from "../types";
import { ArrowLeft, CheckCircle, Grid3x3, List, MapPin, Star } from "./icons";
import { GlassCard } from "./GlassCard";
import { useTranslations } from "../hooks/useTranslations";

interface BusinessCardProps {
  business: Business;
  viewMode: "grid" | "list";
}

const BusinessCard: React.FC<BusinessCardProps> = ({ business, viewMode }) => {
  const { t, lang } = useTranslations();

  const displayName =
    lang === "ar" && business.nameAr
      ? business.nameAr
      : lang === "ku" && business.nameKu
        ? business.nameKu
        : business.name || "Unnamed business";

  const displayImage =
    business.imageUrl ||
    business.image ||
    business.coverImage ||
    "https://picsum.photos/seed/placeholder/400/300";

  const displayReviews = business.reviewCount ?? business.reviews ?? 0;
  const rating = Number.isFinite(Number(business.rating)) ? Number(business.rating) : 0;
  const websiteUrl = business.website
    ? /^https?:\/\//i.test(business.website)
      ? business.website
      : `https://${business.website}`
    : null;
  const contactHref = business.phone ? `tel:${business.phone}` : null;

  // IMPORTANT: do NOT read business.verified (Supabase column may not exist).
  const isVerified = business.isVerified ?? false;

  if (viewMode === "list") {
    return (
      <GlassCard className="p-4 flex gap-4 text-start rtl:text-right">
        <img
          src={displayImage}
          alt={displayName}
          className="w-24 h-24 rounded-xl object-cover flex-shrink-0"
        />
        <div className="flex-1">
          <h3 className="text-white font-semibold text-lg mb-1">{displayName}</h3>
          <p className="text-white/60 text-sm mb-2">
            {t(categories.find((c) => c.id === business.category)?.nameKey || business.category)}
          </p>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-accent fill-accent" />
              <span className="text-white">{rating.toFixed(1)}</span>
            </div>
            <div className="flex items-center gap-1 text-white/60">
              <MapPin className="w-4 h-4" />
              {business.distance || "1.2"} km
            </div>
          </div>
        </div>
        <div className="flex flex-col justify-center gap-2">
          {websiteUrl ? (
            <a
              href={websiteUrl}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-primary to-secondary text-white font-medium text-sm text-center"
            >
              {t("directory.viewProfile") || "Visit Website"}
            </a>
          ) : (
            <button
              disabled
              title="No business profile is available yet."
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-primary/60 to-secondary/60 text-white/70 font-medium text-sm cursor-not-allowed"
            >
              {t("directory.viewProfile") || "Profile unavailable"}
            </button>
          )}
          {contactHref ? (
            <a
              href={contactHref}
              className="px-4 py-2 rounded-xl backdrop-blur-xl bg-white/10 border border-white/20 text-white font-medium text-sm text-center"
            >
              {t("directory.contact")}
            </a>
          ) : (
            <button
              disabled
              title="No public phone number is available."
              className="px-4 py-2 rounded-xl backdrop-blur-xl bg-white/10 border border-white/20 text-white/60 font-medium text-sm cursor-not-allowed"
            >
              {t("directory.contact")} ({t("directory.unavailable") || "Unavailable"})
            </button>
          )}
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="overflow-hidden group text-start p-0">
      <div className="relative h-48 overflow-hidden">
        <img
          src={displayImage}
          alt={displayName}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        {isVerified && (
          <div className="absolute top-3 end-3 w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-dark-bg" />
          </div>
        )}
      </div>
      <div className="p-5">
        <h3 className="text-white font-semibold text-lg mb-2">{displayName}</h3>
        <p className="text-white/60 text-sm mb-3">
          {t(categories.find((c) => c.id === business.category)?.nameKey || business.category)}
        </p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 text-accent fill-accent" />
            <span className="text-white font-medium">{rating.toFixed(1)}</span>
            <span className="text-white/60 text-sm">({displayReviews})</span>
          </div>
          <div className="flex items-center gap-1 text-white/60 text-sm">
            <MapPin className="w-4 h-4" />
            {business.distance || "1.2"} km
          </div>
        </div>
        {websiteUrl ? (
          <a
            href={websiteUrl}
            target="_blank"
            rel="noreferrer"
            className="block w-full mt-4 py-3 rounded-xl bg-gradient-to-r from-primary to-secondary text-white font-semibold hover:shadow-glow-primary transition-all text-center"
          >
            {t("directory.viewProfile")}
          </a>
        ) : (
          <button
            disabled
            title="No business profile is available yet."
            className="w-full mt-4 py-3 rounded-xl bg-gradient-to-r from-primary/60 to-secondary/60 text-white/70 font-semibold cursor-not-allowed"
          >
            {t("directory.viewProfile")} ({t("directory.unavailable") || "Unavailable"})
          </button>
        )}
      </div>
    </GlassCard>
  );
};

interface BusinessDirectoryProps {
  initialFilter?: { categoryId?: string; city?: string; governorate?: string };
  onBack?: () => void;
}

type GetBusinessesResult = {
  data: Business[];
  hasMore: boolean;
  nextOffset: number;
};

export const BusinessDirectory: React.FC<BusinessDirectoryProps> = ({ initialFilter, onBack }) => {
  const [filters, setFilters] = useState({
    category: initialFilter?.categoryId || "all",
    rating: 0,
    city: initialFilter?.city || "",
    governorate: initialFilter?.governorate || "all",
  });

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [pageSize] = useState(20);

  const [businessesData, setBusinessesData] = useState<Business[]>([]);
  const [offset, setOffset] = useState(0);

  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslations();

  useEffect(() => {
    setFilters({
      category: initialFilter?.categoryId || "all",
      rating: 0,
      city: initialFilter?.city || "",
      governorate: initialFilter?.governorate || "all",
    });
    setOffset(0);
  }, [initialFilter]);

  const fetchBusinesses = async (isLoadMore = false) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = (await api.getBusinesses({
        category: filters.category,
        ratingMin: filters.rating,
        city: filters.city,
        governorate: filters.governorate,
        offset: isLoadMore ? offset : 0,
        limit: pageSize,
      })) as GetBusinessesResult;

      setBusinessesData((prev) => (isLoadMore ? [...prev, ...result.data] : result.data));
      setOffset(result.nextOffset);
      setHasMore(result.hasMore);
    } catch (err) {
      console.error("Error fetching businesses:", err);
      const message =
        err instanceof Error && err.message
          ? err.message
          : t("directory.errorLoading") || "Failed to load businesses. Please try again.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setOffset(0);
    fetchBusinesses(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, pageSize]);

  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-center relative mb-8">
          {onBack && (
            <button
              onClick={onBack}
              className="absolute start-0 flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-xl bg-white/10 hover:bg-white/20 border border-white/20 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden md:inline">{t("header.backToHome")}</span>
            </button>
          )}
          <h2 className="text-3xl font-bold text-white text-center">{t("directory.title")}</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1 space-y-4 text-start rtl:text-right">
            <GlassCard className="p-6">
              <h3 className="text-white font-semibold mb-4 flex items-center justify-between">
                {t("directory.filters")}
                <button
                  onClick={() =>
                    setFilters({ category: "all", rating: 0, city: "", governorate: "all" })
                  }
                  className="text-xs text-secondary hover:text-secondary/80"
                >
                  {t("directory.reset")}
                </button>
              </h3>

              <div className="mb-6">
                <label className="block text-white/80 text-sm mb-2">
                  {t("directory.city") || "City"}
                </label>
                <input
                  type="text"
                  value={filters.city}
                  onChange={(e) => setFilters({ ...filters, city: e.target.value })}
                  placeholder={t("directory.cityPlaceholder") || "Search by city..."}
                  className="w-full px-4 py-3 rounded-xl backdrop-blur-xl bg-white/10 border border-white/20 text-white outline-none focus:border-primary transition-colors"
                />
              </div>

              <div className="mb-6">
                <label className="block text-white/80 text-sm mb-2">
                  {t("directory.category")}
                </label>
                <select
                  value={filters.category}
                  onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl backdrop-blur-xl bg-white/10 border border-white/20 text-white outline-none appearance-none bg-no-repeat bg-right-4"
                  style={{
                    backgroundImage:
                      'url("data:image/svg+xml,%3csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3e%3cpath stroke=\'%239ca3af\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'M6 8l4 4 4-4\'/%3e%3c/svg%3e")',
                    backgroundPosition: "left 0.75rem center",
                    backgroundSize: "1.5em 1.5em",
                  }}
                >
                  <option value="all" className="bg-dark-bg">
                    {t("directory.allCategories")}
                  </option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id} className="bg-dark-bg">
                      {t(category.nameKey)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-white/80 text-sm mb-2 block">
                  {t("directory.minimumRating")}
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      onClick={() => setFilters({ ...filters, rating })}
                      className={`flex-1 aspect-square rounded-xl flex items-center justify-center transition-all duration-200 ${
                        filters.rating >= rating
                          ? "bg-gradient-to-br from-accent to-primary"
                          : "backdrop-blur-xl bg-white/10 hover:bg-white/20"
                      }`}
                    >
                      <Star
                        className={`w-5 h-5 ${
                          filters.rating >= rating ? "text-white fill-white" : "text-white/50"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
            </GlassCard>
          </div>

          <div className="lg:col-span-3">
            <div className="flex items-center justify-between mb-6">
              <p className="text-white/80">
                {businessesData.length}{" "}
                {hasMore
                  ? t("directory.businessesShown") || "businesses loaded so far"
                  : t("directory.businessesFound") || "businesses found"}
              </p>
              <div className="flex items-center gap-2 backdrop-blur-xl bg-white/10 border border-white/20 rounded-xl p-1">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded-lg transition-all ${
                    viewMode === "grid" ? "bg-primary" : "hover:bg-white/10"
                  }`}
                >
                  <Grid3x3 className="w-5 h-5 text-white" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 rounded-lg transition-all ${
                    viewMode === "list" ? "bg-primary" : "hover:bg-white/10"
                  }`}
                >
                  <List className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>

            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                <p className="text-white/40 text-sm animate-pulse">
                  {t("directory.loading") || "Searching for local businesses..."}
                </p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
                  <ArrowLeft className="w-8 h-8 text-red-400 rotate-180" />
                </div>
                <h3 className="text-white font-semibold text-lg mb-2">
                  {t("directory.errorTitle") || "Oops! Something went wrong"}
                </h3>
                <p className="text-white/60 text-sm mb-6 max-w-xs mx-auto">{error}</p>
                <button
                  onClick={() => fetchBusinesses(false)}
                  className="px-6 py-2 rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-all"
                >
                  {t("directory.retry") || "Try Again"}
                </button>
              </div>
            ) : businessesData.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                  <MapPin className="w-8 h-8 text-white/20" />
                </div>
                <h3 className="text-white font-semibold text-lg mb-2">
                  {t("directory.noResultsTitle") || "No businesses found"}
                </h3>
                <p className="text-white/60 text-sm max-w-xs mx-auto">
                  {t("directory.noResultsDesc") ||
                    "We couldn't find any businesses matching your current filters. Try adjusting your search."}
                </p>
                <p className="text-white/40 text-xs mt-3">
                  {(t("directory.activeFilters") || "Active filters") +
                    `: ${filters.category !== "all" ? filters.category : "all categories"}, ` +
                    `${filters.city ? `city contains "${filters.city}"` : "all cities"}, ` +
                    `${filters.rating > 0 ? `rating ≥ ${filters.rating}` : "all ratings"}`}
                </p>
              </div>
            ) : (
              <div
                className={
                  viewMode === "grid"
                    ? "grid grid-cols-1 sm:grid-cols-2 gap-6"
                    : "space-y-4"
                }
              >
                {businessesData.map((business) => (
                  <BusinessCard key={business.id} business={business} viewMode={viewMode} />
                ))}
              </div>
            )}

            {hasMore && (
              <div className="mt-12 flex items-center justify-center">
                <button
                  disabled={isLoading}
                  onClick={() => fetchBusinesses(true)}
                  className="px-8 py-3 rounded-xl bg-gradient-to-r from-primary to-secondary text-white font-semibold hover:shadow-glow-primary disabled:opacity-50 transition-all"
                >
                  {isLoading ? t("directory.loading") : t("directory.loadMore") || "Load More"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
