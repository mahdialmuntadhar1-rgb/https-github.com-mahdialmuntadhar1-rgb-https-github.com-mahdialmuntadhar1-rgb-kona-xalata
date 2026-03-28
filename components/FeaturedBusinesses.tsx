import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { Business } from '../types';
import { Crown, Star, MapPin, ChevronRight, ChevronLeft } from './icons';
import { useTranslations } from '../hooks/useTranslations';
import { GlassCard } from './GlassCard';
import { motion } from 'motion/react';
import { mockData, governorateDisplayName } from '../services/mockData';

interface FeaturedBusinessesProps {
  selectedGovernorate: string;
  onExploreBusinesses: (city: string) => void;
}

export const FeaturedBusinesses: React.FC<FeaturedBusinessesProps> = ({ selectedGovernorate, onExploreBusinesses }) => {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { t, lang } = useTranslations();
  const scrollRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchFeatured = async () => {
      setIsLoading(true);
      try {
        const result = await api.getBusinesses({ featuredOnly: true, limit: 10, governorate: selectedGovernorate });
        const fallback = mockData.featuredBusinesses(selectedGovernorate);
        setBusinesses(result.data.length > 0 ? result.data : fallback);
      } catch (error) {
        console.error('Error fetching featured businesses:', error);
        setBusinesses(mockData.featuredBusinesses(selectedGovernorate));
      } finally {
        setIsLoading(false);
      }
    };
    void fetchFeatured();
  }, [selectedGovernorate]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollTo = direction === 'left' ? scrollLeft - clientWidth : scrollLeft + clientWidth;
      scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  if (isLoading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <p className="text-white/40 font-medium animate-pulse">{t('featured.loading') || 'Finding premium spots...'}</p>
      </div>
    );
  }

  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent pointer-events-none" />
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-secondary/10 rounded-full blur-3xl pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="flex items-end justify-between mb-12">
          <div className="text-start">
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-4 tracking-tight">
              {t('featured.title')}
            </h2>
            <p className="text-white/50 text-lg max-w-xl">
              {(t('featured.subtitle') || 'Discover hand-picked premium experiences across Iraq.').replace('{governorate}', t(`governorates.${selectedGovernorate}`) || governorateDisplayName(selectedGovernorate))}
            </p>
          </div>
          <div className="hidden md:flex gap-3">
            <button onClick={() => scroll('left')} className="p-3 rounded-full bg-white/5 border border-white/10 text-white hover:bg-primary hover:border-primary transition-all duration-300">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button onClick={() => scroll('right')} className="p-3 rounded-full bg-white/5 border border-white/10 text-white hover:bg-primary hover:border-primary transition-all duration-300">
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div ref={scrollRef} className="flex gap-8 overflow-x-auto pb-8 scrollbar-hide snap-x snap-mandatory">
          {businesses.length === 0 ? (
            <div className="w-full py-20 flex flex-col items-center justify-center text-center backdrop-blur-xl bg-white/5 rounded-3xl border border-white/10">
              <Crown className="w-16 h-16 text-white/10 mb-6" />
              <h3 className="text-white font-bold text-xl mb-2">{t('featured.noFeaturedTitle') || 'No Featured Listings'}</h3>
              <p className="text-white/40 text-base max-w-xs mx-auto">{t('featured.noFeatured') || "We're currently curating new premium spots for you."}</p>
            </div>
          ) : (
            businesses.map((business, index) => {
              const displayName = lang === 'ar' && business.nameAr ? business.nameAr : lang === 'ku' && business.nameKu ? business.nameKu : business.name;
              const displayImage = business.coverImage || business.imageUrl || 'https://picsum.photos/seed/placeholder/600/400';
              const isPremium = business.isPremium || business.isFeatured;

              return (
                <motion.div key={business.id} initial={{ opacity: 0, x: 50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: index * 0.1 }} className="flex-shrink-0 w-85 snap-center">
                  <GlassCard className="p-0 overflow-hidden group border-white/10 hover:border-primary/30 transition-all duration-500 hover:shadow-glow-primary/20">
                    <div className="relative h-56 overflow-hidden">
                      <img src={displayImage} alt={displayName} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" referrerPolicy="no-referrer" />
                      <div className="absolute inset-0 bg-gradient-to-t from-dark-bg/90 via-dark-bg/20 to-transparent" />
                      <div className="absolute top-4 left-4 flex gap-2">
                        {isPremium && (
                          <div className="px-3 py-1.5 rounded-full bg-accent/90 backdrop-blur-md text-white text-xs font-bold flex items-center gap-1.5 shadow-lg">
                            <Crown className="w-3.5 h-3.5" />
                            {t('featured.premium')}
                          </div>
                        )}
                      </div>
                      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                        <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-2 py-1 rounded-lg border border-white/10"><Star className="w-4 h-4 text-accent fill-accent" /><span className="text-white font-bold text-sm">{business.rating}</span></div>
                        <div className={`px-3 py-1 rounded-full backdrop-blur-md text-xs font-bold border border-white/10 ${business.status?.toLowerCase() === 'open' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                          {business.status ? t(`featured.${business.status.toLowerCase()}`) : t('featured.open')}
                        </div>
                      </div>
                    </div>

                    <div className="p-6">
                      <div className="mb-6">
                        <h3 className="text-white font-bold text-2xl mb-2 group-hover:text-primary transition-colors">{displayName}</h3>
                        <div className="flex items-center gap-2 text-white/40 text-sm">
                          <MapPin className="w-4 h-4 text-primary" />
                          <span>{t(`governorates.${business.governorate}`) || governorateDisplayName(business.governorate)}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <button onClick={() => onExploreBusinesses(business.city || governorateDisplayName(business.governorate))} className="px-5 py-3 rounded-xl bg-gradient-to-r from-primary to-secondary text-white font-bold text-sm hover:shadow-glow-primary transition-all duration-300 transform active:scale-95">
                          {t('actions.exploreNow')}
                        </button>
                        <button onClick={() => onExploreBusinesses(business.city || governorateDisplayName(business.governorate))} className="px-5 py-3 rounded-xl backdrop-blur-xl bg-white/5 border border-white/10 text-white font-bold text-sm hover:bg-white/10 transition-all duration-300 transform active:scale-95">
                          {t('actions.details')}
                        </button>
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
};
