import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { Story } from '../types';
import { Briefcase, Users, ShieldCheck, Plus } from './icons';
import { StoryViewer } from './StoryViewer';
import { useTranslations } from '../hooks/useTranslations';
import { mockData } from '../services/mockData';

interface CommunityStoriesProps {
  selectedGovernorate: string;
}

export const CommunityStories: React.FC<CommunityStoriesProps> = ({ selectedGovernorate }) => {
  const [stories, setStories] = useState<Story[]>([]);
  const [activeStory, setActiveStory] = useState<Story | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { t } = useTranslations();

  useEffect(() => {
    const fetchStories = async () => {
      setIsLoading(true);
      try {
        const data = await api.getStories(selectedGovernorate);
        setStories(data.length > 0 ? data : mockData.stories(selectedGovernorate));
      } catch (error) {
        console.error('Error fetching stories:', error);
        setStories(mockData.stories(selectedGovernorate));
      } finally {
        setIsLoading(false);
      }
    };
    void fetchStories();
  }, [selectedGovernorate]);

  if (isLoading) {
    return (
      <div className="py-16 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <section className="py-16" data-section="stories">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-white mb-8 text-center">{t('stories.communityTitle')}</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {stories.length === 0 ? (
            <div className="col-span-full py-12 flex flex-col items-center justify-center text-center opacity-50">
              <Plus className="w-12 h-12 text-white/20 mb-4" />
              <p className="text-white/60 text-sm">{t('stories.noStories') || 'No stories shared yet.'}</p>
            </div>
          ) : (
            stories.map((story) => (
              <div key={story.id} onClick={() => setActiveStory(story)} className="cursor-pointer group">
                <div className="relative aspect-[9/16] rounded-2xl overflow-hidden border border-transparent group-hover:border-primary transition-colors">
                  <img src={story.thumbnail} alt={story.userName} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <div className="absolute bottom-3 start-3 end-3">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-full border-2 border-white"><img src={story.avatar} alt={story.userName} className="w-full h-full rounded-full" /></div>
                      <span className="text-white text-sm font-medium truncate">{story.userName}</span>
                    </div>
                    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs text-white ${story.type === 'business' ? 'bg-primary/80' : 'bg-secondary/80'}`}>
                      {story.type === 'business' ? <Briefcase className="w-3 h-3" /> : <Users className="w-3 h-3" />}
                      <span>{t(`stories.${story.type}`)}</span>
                    </div>
                  </div>
                  {story.aiVerified && <div className="absolute top-3 end-3 w-8 h-8 rounded-full bg-secondary flex items-center justify-center"><ShieldCheck className="w-5 h-5 text-dark-bg" /></div>}
                  {story.isLive && (
                    <div className="absolute top-3 start-3 px-2 py-1 rounded-full bg-red-500 flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                      <span className="text-white text-[10px] font-bold uppercase tracking-wider">{t('stories.latestStatus')}</span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
          <div className="aspect-[9/16] rounded-2xl backdrop-blur-xl bg-white/5 border-2 border-dashed border-white/20 flex flex-col items-center justify-center gap-3 hover:bg-white/10 hover:border-primary/50 transition-all cursor-not-allowed opacity-70">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center"><Plus className="w-6 h-6 text-white" /></div>
            <span className="text-white/80 text-sm font-medium">{t('stories.addYours')} ({t('common.comingSoon')})</span>
          </div>
        </div>
      </div>
      {activeStory && <StoryViewer story={activeStory} onClose={() => setActiveStory(null)} />}
    </section>
  );
};
