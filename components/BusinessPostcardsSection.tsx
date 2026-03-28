import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import type { BusinessPostcard } from '../types';
import { useTranslations } from '../hooks/useTranslations';
import { MapPin, Star } from './icons';

interface Props {
  selectedGovernorate: string;
}

export const BusinessPostcardsSection: React.FC<Props> = ({ selectedGovernorate }) => {
  const { t } = useTranslations();
  const [items, setItems] = useState<BusinessPostcard[]>([]);
  const [active, setActive] = useState<BusinessPostcard | null>(null);

  useEffect(() => {
    const load = async () => {
      const data = await api.getPostcards(selectedGovernorate);
      setItems(data);
    };
    void load();
  }, [selectedGovernorate]);

  return (
    <section id="postcards" className="py-16">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-white mb-8 text-center">{t('postcards.title')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((card) => (
            <button key={card.id || card.title} onClick={() => setActive(card)} className="text-start rounded-2xl overflow-hidden bg-white/5 border border-white/10 hover:border-primary/40 transition-all">
              <img src={card.hero_image} alt={card.title} className="w-full h-44 object-cover" />
              <div className="p-4 space-y-2">
                <h3 className="text-white font-semibold">{card.title}</h3>
                <div className="text-white/60 text-sm flex items-center gap-2"><MapPin className="w-4 h-4" />{card.neighborhood}, {card.city}</div>
                <div className="text-white/60 text-sm">{card.phone}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {active && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={() => setActive(null)}>
          <div className="max-w-xl w-full bg-dark-bg border border-white/15 rounded-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <img src={active.hero_image} alt={active.title} className="w-full h-56 object-cover" />
            <div className="p-5">
              <h3 className="text-2xl text-white font-bold mb-2">{active.title}</h3>
              <p className="text-white/70 mb-4">{active.postcard_content}</p>
              <div className="flex items-center gap-2 text-accent mb-4"><Star className="w-4 h-4" />{active.rating} ({active.review_count})</div>
              <a href={active.google_maps_url} target="_blank" rel="noreferrer" className="inline-block px-4 py-2 rounded-xl bg-primary text-white">{t('actions.viewOnMap')}</a>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
