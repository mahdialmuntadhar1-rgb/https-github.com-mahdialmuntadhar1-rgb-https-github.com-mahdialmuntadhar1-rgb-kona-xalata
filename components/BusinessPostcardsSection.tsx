import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import type { BusinessPostcard } from '../types';
import { useTranslations } from '../hooks/useTranslations';
import { GlassCard } from './GlassCard';
import { MapPin, Star } from './icons';
import { mockData } from '../services/mockData';

interface BusinessPostcardsSectionProps {
  selectedGovernorate: string;
  onViewBusiness: (city: string) => void;
}

export const BusinessPostcardsSection: React.FC<BusinessPostcardsSectionProps> = ({ selectedGovernorate, onViewBusiness }) => {
  const [postcards, setPostcards] = useState<BusinessPostcard[]>([]);
  const [selected, setSelected] = useState<BusinessPostcard | null>(null);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslations();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const realData = await api.getPostcards(selectedGovernorate);
        setPostcards(realData.length > 0 ? realData : mockData.postcards(selectedGovernorate));
      } catch {
        setPostcards(mockData.postcards(selectedGovernorate));
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [selectedGovernorate]);

  if (loading) {
    return <div className="py-12 flex items-center justify-center"><div className="w-8 h-8 border-4 border-secondary/50 border-t-secondary rounded-full animate-spin" /></div>;
  }

  return (
    <section className="container mx-auto px-4 py-12">
      <h2 className="text-3xl font-bold text-white mb-8">{t('postcards.title')}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {postcards.map((card) => (
          <button key={card.id} onClick={() => setSelected(card)} className="text-start">
            <GlassCard className="p-0 overflow-hidden border-white/10 hover:border-primary/40 transition-all">
              <img src={card.hero_image} alt={card.title} className="w-full h-48 object-cover" />
              <div className="p-5 space-y-3">
                <h3 className="text-white text-xl font-bold">{card.title}</h3>
                <p className="text-white/70 text-sm line-clamp-2">{card.postcard_content}</p>
                <div className="flex items-center justify-between text-xs text-white/60">
                  <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{card.neighborhood}, {card.city}</span>
                  <span className="flex items-center gap-1"><Star className="w-4 h-4 text-accent fill-accent" />{card.rating}</span>
                </div>
              </div>
            </GlassCard>
          </button>
        ))}
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="max-w-lg w-full backdrop-blur-xl bg-dark-bg/95 border border-white/20 rounded-3xl p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-white text-2xl font-bold mb-2">{selected.title}</h3>
            <p className="text-white/70 mb-4">{selected.postcard_content}</p>
            <p className="text-white/60 text-sm mb-4">{selected.neighborhood}, {selected.city}</p>
            <div className="flex gap-3">
              <button onClick={() => onViewBusiness(selected.city)} className="flex-1 px-4 py-3 rounded-xl bg-primary text-white font-semibold">{t('postcards.viewInDirectory')}</button>
              <a href={selected.google_maps_url} target="_blank" rel="noreferrer" className="flex-1 px-4 py-3 rounded-xl bg-white/10 text-white font-semibold text-center">{t('postcards.openMap')}</a>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
