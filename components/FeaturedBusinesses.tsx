import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { Business } from '../types';
import { Crown, Star, MapPin, Clock } from './icons';
import { useTranslations } from '../hooks/useTranslations';
import { GlassCard } from './GlassCard';

export const FeaturedBusinesses: React.FC = () => {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { t, lang } = useTranslations();

  useEffect(() => {
    const fetchFeatured = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const featuredResult = await api.getBusinesses({ featuredOnly: true, limit: 10 });
        setBusinesses(featuredResult.data);
      } catch (error) {
        console.warn('Featured filter failed, retrying with safe fallback:', error);
        try {
          const fallbackResult = await api.getBusinesses({ limit: 40 });
          const safelyFeatured = fallbackResult.data
            .filter((business) => business.isFeatured || business.isPremium)
            .slice(0, 10);
          setBusinesses(safelyFeatured);
          if (safelyFeatured.length === 0) {
            setError(t('featured.noFeatured') || 'No featured businesses are currently flagged in the database.');
          }
        } catch (fallbackError) {
          console.error('Error fetching featured businesses:', fallbackError);
          setError(
            fallbackError instanceof Error && fallbackError.message
              ? fallbackError.message
              : t('directory.errorLoading') || 'Failed to load businesses. Please try again.',
          );
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchFeatured();
  }, []);

  if (isLoading) {
    return (
      <div className="py-16 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <section className="py-16 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
      <div className="container mx-auto px-4 relative z-10">
        <h2 className="text-3xl font-bold text-white mb-8 text-center">
          {t('featured.title')}
        </h2>
        {error && (
          <div className="mb-6 rounded-xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-100 text-center">
            {error}
          </div>
        )}
        <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory">
          {businesses.length === 0 ? (
            <div className="w-full py-12 flex flex-col items-center justify-center text-center opacity-50">
              <Crown className="w-12 h-12 text-white/20 mb-4" />
              <p className="text-white/60 text-sm">{t('featured.noFeatured') || "No featured businesses at the moment."}</p>
            </div>
          ) : (
            businesses.map((business) => {
            const displayName = lang === 'ar' && business.nameAr ? business.nameAr : 
                                 lang === 'ku' && business.nameKu ? business.nameKu : 
                                 business.name;
            const displayImage = business.coverImage || business.imageUrl || business.image || 'https://picsum.photos/seed/placeholder/600/400';
            const isPremium = business.isPremium || business.isFeatured;
            const websiteUrl = business.website
              ? /^https?:\/\//i.test(business.website)
                ? business.website
                : `https://${business.website}`
              : null;
            
            return (
            <GlassCard
              key={business.id}
              className="flex-shrink-0 w-80 snap-center overflow-hidden group hover:shadow-glow-primary p-0"
            >
              <div className="relative h-48 overflow-hidden">
                <img
                  src={displayImage}
                  alt={displayName}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
                {isPremium && (
                  <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-gradient-to-r from-accent to-primary text-white text-xs font-semibold flex items-center gap-1">
                    <Crown className="w-3 h-3" />
                    {t('featured.premium')}
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-dark-bg/80 via-transparent to-transparent" />
              </div>
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="text-start">
                    <h3 className="text-white font-semibold text-lg mb-1">{displayName}</h3>
                    <p className="text-white/60 text-sm">{t(`categories.${business.category}`)}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-accent fill-accent" />
                    <span className="text-white font-medium">{business.rating}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm text-white/60 mb-4">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {business.distance || '1.2'} km
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {business.status || 'Open'}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {websiteUrl ? (
                    <a
                      href={websiteUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-primary to-secondary text-white font-medium text-sm hover:shadow-glow-primary transition-all duration-200 text-center"
                    >
                      {t('actions.details')}
                    </a>
                  ) : (
                    <button
                      disabled
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-primary/60 to-secondary/60 text-white/70 font-medium text-sm cursor-not-allowed"
                    >
                      {t('directory.viewProfile')} ({t('directory.unavailable') || 'Unavailable'})
                    </button>
                  )}
                  {business.phone ? (
                    <a
                      href={`tel:${business.phone}`}
                      className="px-4 py-2 rounded-xl backdrop-blur-xl bg-white/10 border border-white/20 text-white font-medium text-sm hover:bg-white/20 transition-all duration-200 text-center"
                    >
                      {t('directory.contact')}
                    </a>
                  ) : (
                    <button
                      disabled
                      className="px-4 py-2 rounded-xl backdrop-blur-xl bg-white/10 border border-white/20 text-white/60 font-medium text-sm cursor-not-allowed"
                    >
                      {t('directory.contact')} ({t('directory.unavailable') || 'Unavailable'})
                    </button>
                  )}
                </div>
              </div>
            </GlassCard>
          )}))}
        </div>
      </div>
    </section>
  );
};
