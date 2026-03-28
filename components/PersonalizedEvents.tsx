import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { Event } from '../types';
import { Sparkles, MapPin, Clock, Users, Calendar } from './icons';
import { useTranslations } from '../hooks/useTranslations';
import { GlassCard } from './GlassCard';

interface PersonalizedEventsProps {
  selectedGovernorate: string;
}

export const PersonalizedEvents: React.FC<PersonalizedEventsProps> = ({ selectedGovernorate }) => {
  const [activeTab, setActiveTab] = useState('forYou');
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeEvent, setActiveEvent] = useState<Event | null>(null);
  const { t } = useTranslations();

  useEffect(() => {
    const fetchEvents = async () => {
      setIsLoading(true);
      try {
        // Map tabs to categories if needed, or just fetch all for now
        const categoryMap: Record<string, string | undefined> = {
          'forYou': undefined,
          'trending': 'entertainment',
          'nearYou': 'food',
          'friendsGoing': 'business'
        };
        const data = await api.getEvents({ category: categoryMap[activeTab], governorate: selectedGovernorate });
        setEvents(data);
      } catch (error) {
        console.error('Error fetching events:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchEvents();
  }, [activeTab, selectedGovernorate]);

  return (
    <section id="trending-events" className="py-16">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-white mb-8 text-center">
          {t('events.personalizedTitle')}
        </h2>
        <div className="flex justify-center gap-3 mb-8 overflow-x-auto scrollbar-hide">
          {['forYou', 'trending', 'nearYou', 'friendsGoing'].map((tab) => (
            <button
              key={tab}
              className={`flex-shrink-0 px-6 py-3 rounded-full backdrop-blur-xl border transition-all duration-200 ${activeTab === tab ? 'bg-primary border-primary text-white shadow-glow-primary' : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'}`}
              onClick={() => setActiveTab(tab)}
            >
              {t(`events.tabs.${tab}`)}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="py-16 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div key={activeTab} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in-grid">
            <style>{`
                @keyframes fade-in-grid {
                    from { opacity: 0; transform: translateY(1rem); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in-grid { animation: fade-in-grid 0.5s ease-in-out forwards; }
            `}</style>
            {events.length === 0 ? (
              <div className="col-span-full py-12 flex flex-col items-center justify-center text-center opacity-50">
                <Calendar className="w-12 h-12 text-white/20 mb-4" />
                <p className="text-white/60 text-sm">{t('events.noEvents') || "No events found for this category."}</p>
              </div>
            ) : (
              events.map((event) => (
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
                    <h3 className="text-white font-semibold text-lg mb-2 line-clamp-2">{event.titleKey ? t(event.titleKey) : event.title}</h3>
                    <div className="space-y-2 text-sm text-white/60 mb-4">
                      <div className="flex items-center gap-2"><MapPin className="w-4 h-4" />{event.venueKey ? t(event.venueKey) : (event.venue || event.location)}</div>
                      <div className="flex items-center gap-2"><Clock className="w-4 h-4" />{event.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      <div className="flex items-center gap-2"><Users className="w-4 h-4" />{event.attendees} {t('events.going')}</div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div><span className="text-secondary font-bold text-xl">{event.price === 0 ? t('events.free') : `${event.price.toLocaleString()} IQD`}</span></div>
                      <button onClick={() => setActiveEvent(event)} className="px-4 py-2 rounded-xl bg-gradient-to-r from-primary to-secondary text-white font-medium text-sm hover:shadow-glow-primary transition-all duration-200">{t('events.viewDetails')}</button>
                    </div>
                  </div>
                </GlassCard>
              ))
            )}
          </div>
        )}
      </div>
      {activeEvent && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={() => setActiveEvent(null)}>
          <div className="max-w-lg w-full rounded-2xl bg-dark-bg border border-white/10 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <img src={activeEvent.image} alt={activeEvent.title} className="w-full h-56 object-cover" />
            <div className="p-5">
              <h3 className="text-white text-2xl font-bold mb-2">{activeEvent.titleKey ? t(activeEvent.titleKey) : activeEvent.title}</h3>
              <p className="text-white/70">{activeEvent.venueKey ? t(activeEvent.venueKey) : activeEvent.venue}</p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
