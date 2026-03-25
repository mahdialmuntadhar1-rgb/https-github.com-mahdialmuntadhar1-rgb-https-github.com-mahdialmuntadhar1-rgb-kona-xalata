import React, { useState } from 'react';
import { Navigation, Mic, Trash2, Sparkles } from './icons';
import { useTranslations } from '../hooks/useTranslations';
import { GlassCard } from './GlassCard';
import { api } from '../services/api';

interface Waypoint {
  name: string;
  address: string;
}

const InteractiveMap: React.FC = () => (
    <div className="w-full h-full bg-dark-bg flex items-center justify-center text-white/50">
        <div className="text-center">
            <Navigation className="w-16 h-16 mx-auto mb-4 text-secondary/50" />
            <p>Interactive Map Placeholder</p>
        </div>
    </div>
);

const WaypointSkeleton: React.FC = () => (
    <div className="flex items-center gap-3 p-3 rounded-xl backdrop-blur-xl bg-white/10 animate-pulse">
        <div className="w-8 h-8 rounded-full bg-white/10 flex-shrink-0"></div>
        <div className="flex-1 space-y-2">
            <div className="h-4 w-3/4 bg-white/10 rounded"></div>
            <div className="h-3 w-1/2 bg-white/10 rounded"></div>
        </div>
    </div>
);

export const CityGuide: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [journeyPoints, setJourneyPoints] = useState<Waypoint[]>([]);
  const { t, lang, setLang } = useTranslations();
  
  const removeWaypoint = (index: number) => {
      setJourneyPoints(points => points.filter((_, i) => i !== index));
  }
  
  const handleGenerateJourney = async () => {
      if (!searchQuery.trim()) return;

      setIsLoading(true);
      setError(null);
      setJourneyPoints([]);
      
      try {
        const plan = await api.generateJourney(searchQuery);
        setJourneyPoints(plan.waypoints || []);
      } catch (e) {
          console.error("Failed to generate journey:", e);
          setError(t('cityGuide.generateError'));
      } finally {
          setIsLoading(false);
      }
  }

  return (
    <section className="py-16 bg-dark-bg">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-white mb-8 text-center">{t('cityGuide.title')}</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <GlassCard className="overflow-hidden h-[600px] shadow-soft p-0">
              <InteractiveMap />
            </GlassCard>
          </div>
          <div className="space-y-4">
            <GlassCard className="p-6 text-start rtl:text-right">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2"><Navigation className="w-5 h-5 text-secondary" /> {t('cityGuide.planJourney')}</h3>
              <div className="relative mb-4">
                <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={t('cityGuide.searchPlaces')} className="w-full pl-4 pr-24 py-3 rounded-xl backdrop-blur-xl bg-white/10 border border-white/20 text-white placeholder:text-white/50 outline-none focus:border-primary transition-colors" />
                <div className="absolute end-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <button onClick={handleGenerateJourney} disabled={isLoading} className="px-3 py-2 rounded-lg bg-gradient-to-r from-primary to-secondary text-white font-semibold hover:shadow-glow-primary transition-all flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-wait">
                        {isLoading ? (
                            <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin"></div>
                        ) : (
                           <Sparkles className="w-4 h-4" />
                        )}
                       <span className="hidden sm:inline">{isLoading ? t('cityGuide.generating') : t('cityGuide.generateJourney')}</span>
                    </button>
                </div>
              </div>
              
              <div className="space-y-2">
                <p className="text-white/60 text-xs mb-2">{t('cityGuide.trySaying')}:</p>
                {['a historical tour of baghdad', 'أفضل المطاعم في أربيل', 'گەشتێکی یەک ڕۆژە لە سلێمانی'].map((command, i) => (<button key={i} onClick={() => setSearchQuery(command)} className="w-full text-start rtl:text-right px-3 py-2 rounded-lg backdrop-blur-xl bg-white/5 hover:bg-white/10 text-white/70 text-xs transition-all">"{command}"</button>))}
              </div>
            </GlassCard>
            <GlassCard className="p-6">
              <h3 className="text-white font-semibold mb-4 text-start rtl:text-right">{t('cityGuide.yourJourney')}</h3>
              {isLoading && (
                  <div className="space-y-3">
                      <WaypointSkeleton />
                      <WaypointSkeleton />
                      <WaypointSkeleton />
                  </div>
              )}
              {error && <p className="text-red-400 text-sm text-center py-8">{error}</p>}

              {!isLoading && !error && journeyPoints.length === 0 && (
                  <p className="text-white/60 text-sm text-center py-8">{t('cityGuide.addWaypoints')}</p>
              )}
              
              {!isLoading && !error && journeyPoints.length > 0 && (
                <div className="space-y-3">
                  {journeyPoints.map((point, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 rounded-xl backdrop-blur-xl bg-white/10">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex-shrink-0 flex items-center justify-center text-white font-bold text-sm">{index + 1}</div>
                      <div className="flex-1 text-start rtl:text-right"><p className="text-white font-medium text-sm truncate">{point.name}</p><p className="text-white/60 text-xs truncate">{point.address}</p></div>
                      <button onClick={() => removeWaypoint(index)} className="w-8 h-8 rounded-full backdrop-blur-xl bg-white/10 hover:bg-red-500/20 flex items-center justify-center transition-all flex-shrink-0"><Trash2 className="w-4 h-4 text-white/70" /></button>
                    </div>
                  ))}
                </div>
              )}
              {journeyPoints.length > 0 && !isLoading && (<button className="w-full mt-4 py-3 rounded-xl bg-gradient-to-r from-primary to-secondary text-white font-semibold hover:shadow-glow-primary transition-all">{t('cityGuide.startNavigation')}</button>)}
            </GlassCard>
          </div>
        </div>
      </div>
    </section>
  );
};