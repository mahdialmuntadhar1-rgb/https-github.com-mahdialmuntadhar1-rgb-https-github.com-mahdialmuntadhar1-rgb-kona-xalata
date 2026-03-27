import React from 'react';
import type { Event } from '../types';
import { Sparkles, MapPin, Clock, Users } from './icons';
import { useTranslations } from '../hooks/useTranslations';
import { GlassCard } from './GlassCard';

export const PersonalizedEvents: React.FC = () => {
  const previewEvents: Event[] = [
    {
      id: 1,
      image: 'https://picsum.photos/seed/event-preview-1/800/600',
      title: 'Baghdad Community Night (Preview)',
      aiRecommended: true,
      date: new Date('2026-06-15T19:00:00Z'),
      venue: 'Al Mansour District',
      attendees: 0,
      price: 0,
    },
    {
      id: 2,
      image: 'https://picsum.photos/seed/event-preview-2/800/600',
      title: 'Local Makers Showcase (Preview)',
      date: new Date('2026-07-05T16:30:00Z'),
      venue: 'Erbil Art Hall',
      attendees: 0,
      price: 0,
    },
  ];
  const { t } = useTranslations();

  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-white mb-3 text-center">
          {t('events.personalizedTitle')}
        </h2>
        <p className="text-center text-sm text-white/70 mb-8">
          <span className="font-semibold text-primary">Beta preview:</span> Event recommendations and RSVP actions are disabled for MVP.
        </p>
        <div className="flex justify-center gap-3 mb-8 overflow-x-auto scrollbar-hide">
          {['forYou', 'trending', 'nearYou', 'friendsGoing'].map((tab) => (
            <button
              key={tab}
              disabled
              className="flex-shrink-0 px-6 py-3 rounded-full backdrop-blur-xl border transition-all duration-200 bg-white/5 border-white/10 text-white/60 cursor-not-allowed"
            >
              {t(`events.tabs.${tab}`)}
            </button>
          ))}
        </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in-grid">
            <style>{`
                @keyframes fade-in-grid {
                    from { opacity: 0; transform: translateY(1rem); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in-grid { animation: fade-in-grid 0.5s ease-in-out forwards; }
            `}</style>
              {previewEvents.map((event) => (
                <GlassCard key={event.id} className="group relative overflow-hidden hover:shadow-glow-primary hover:-translate-y-2 text-start p-0">
                  <div className="relative h-56 overflow-hidden">
                    <img src={event.image} alt={event.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    {event.aiRecommended && (
                      <div className="absolute top-3 start-3 px-3 py-1 rounded-full bg-gradient-to-r from-primary to-secondary backdrop-blur-sm flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-white" />
                        <span className="text-white text-xs font-medium">{t('events.aiPick')}</span>
                      </div>
                    )}
                    <div className="absolute top-3 end-3 backdrop-blur-xl bg-white/20 rounded-xl p-2 text-center min-w-[60px]">
                      <div className="text-white font-bold text-lg">{event.date.getDate()}</div>
                      <div className="text-white/80 text-xs uppercase">{event.date.toLocaleString('default', { month: 'short' })}</div>
                    </div>
                  </div>
                  <div className="p-5">
                    <h3 className="text-white font-semibold text-lg mb-2 line-clamp-2">{event.title}</h3>
                    <div className="space-y-2 text-sm text-white/60 mb-4">
                      <div className="flex items-center gap-2"><MapPin className="w-4 h-4" />{event.venue}</div>
                      <div className="flex items-center gap-2"><Clock className="w-4 h-4" />{event.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      <div className="flex items-center gap-2"><Users className="w-4 h-4" />{event.attendees} {t('events.going')} • Preview</div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div><span className="text-secondary font-bold text-xl">{event.price === 0 ? t('events.free') : `${event.price.toLocaleString()} IQD`}</span></div>
                      <button disabled className="px-4 py-2 rounded-xl bg-gradient-to-r from-primary to-secondary text-white font-medium text-sm transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed">{t('events.viewDetails')} • Coming Soon</button>
                    </div>
                  </div>
                </GlassCard>
              ))}
          </div>
      </div>
    </section>
  );
};
