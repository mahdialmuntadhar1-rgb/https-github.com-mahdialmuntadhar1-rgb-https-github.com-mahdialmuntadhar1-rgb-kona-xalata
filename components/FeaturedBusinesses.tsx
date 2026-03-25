import React, { useEffect, useState } from 'react';
import type { Business } from '../types';
import { Crown, Star, MapPin, Clock } from './icons';
import { useTranslations } from '../hooks/useTranslations';
import { GlassCard } from './GlassCard';
import { getBusinessName } from '../src/lib/utils';
import { getVerifiedBusinesses } from '../src/lib/supabase';

export const FeaturedBusinesses: React.FC = () => {
  const { t } = useTranslations();
  const [featuredBusinesses, setFeaturedBusinesses] = useState<Business[]>([]);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFeaturedBusinesses = async () => {
      const { data, error } = await getVerifiedBusinesses({ page: 0, pageSize: 50 });

      if (error || !data) {
        console.error('Failed to fetch featured businesses:', error);
        setFetchError(error?.message || 'Failed to load featured businesses from Supabase.');
        return;
      }

      setFetchError(null);

      const normalizedBusinesses: Business[] = data.slice(0, 12).map((business) => ({
        id: business.id,
        name: business.name,
        category: business.category || 'business_services',
        rating: 5,
        city: business.city ?? undefined,
        governorate: business.governorate ?? undefined,
        address: business.address ?? undefined,
        phone: business.phone ?? undefined,
        verified: business.verified ?? undefined,
        imageUrl: business.postcard?.image_url || business.location?.image_url || undefined,
        isFeatured: true,
      }));

      setFeaturedBusinesses(normalizedBusinesses);
    };

    fetchFeaturedBusinesses();
  }, []);

  return (
    <section className="py-16 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
      <div className="container mx-auto px-4 relative z-10">
        <h2 className="text-3xl font-bold text-white mb-8 text-center">
          {t('featured.title')}
        </h2>
        {fetchError && (
          <GlassCard className="mb-6 p-4 border border-red-400/40 bg-red-500/10">
            <p className="text-red-200 text-sm">{fetchError}</p>
          </GlassCard>
        )}
        <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory">
          {featuredBusinesses.map((business) => {
            const displayName = getBusinessName(business.name);
            const displayImage = business.coverImage || business.imageUrl || business.image || 'https://picsum.photos/seed/placeholder/600/400';
            const isPremium = business.isPremium || business.isFeatured;
            
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
                    <h3 className="text-white font-semibold text-lg mb-1 business-name">{displayName}</h3>
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
                  <button className="px-4 py-2 rounded-xl bg-gradient-to-r from-primary to-secondary text-white font-medium text-sm hover:shadow-glow-primary transition-all duration-200">
                    {t('actions.book')}
                  </button>
                  <button className="px-4 py-2 rounded-xl backdrop-blur-xl bg-white/10 border border-white/20 text-white font-medium text-sm hover:bg-white/20 transition-all duration-200">
                    {t('actions.details')}
                  </button>
                </div>
              </div>
            </GlassCard>
          )})}
        </div>
      </div>
    </section>
  );
};
