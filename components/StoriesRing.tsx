import React from 'react';
import { stories } from '../constants';
import { useTranslations } from '../hooks/useTranslations';
import { Check, Plus } from './icons';

const AddStoryButton = () => {
    const { t } = useTranslations();
    return (
        <div className="flex-shrink-0">
            <div className="relative w-20 h-20 rounded-full p-0.5 bg-white/20">
                <div className="w-full h-full rounded-full backdrop-blur-xl bg-dark-bg/80 flex items-center justify-center cursor-not-allowed border-2 border-dashed border-white/30 opacity-70">
                    <Plus className="w-8 h-8 text-white/50" />
                </div>
            </div>
            <p className="text-xs text-white/80 text-center mt-2 max-w-[80px] truncate">{t('stories.add')} • Soon</p>
        </div>
    );
}

export const StoriesRing: React.FC = () => {
    return (
        <div className="relative -mt-12 z-20">
            <div className="container mx-auto px-4">
                <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                    <div className="flex items-center">
                        <span className="text-[10px] uppercase tracking-wider px-2 py-1 rounded-full border border-secondary/50 text-secondary bg-secondary/10">Stories Beta</span>
                    </div>
                    {stories.map((story) => (
                        <div key={story.id} className="flex-shrink-0">
                            <div className={`relative w-20 h-20 rounded-full p-0.5 ${story.viewed ? 'bg-white/20' : 'bg-gradient-to-tr from-primary via-accent to-secondary'}`}>
                                <div className="w-full h-full rounded-full backdrop-blur-xl bg-dark-bg/80 flex items-center justify-center cursor-pointer hover:scale-110 transition-transform p-1">
                                    <img 
                                        src={story.avatar} 
                                        alt={story.name}
                                        className="w-full h-full rounded-full object-cover"
                                    />
                                    {story.verified && (
                                        <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-secondary flex items-center justify-center border-2 border-dark-bg">
                                            <Check className="w-4 h-4 text-dark-bg" />
                                        </div>
                                    )}
                                </div>
                            </div>
                            <p className="text-xs text-white/80 text-center mt-2 max-w-[80px] truncate">
                                {story.name}
                            </p>
                        </div>
                    ))}
                    <AddStoryButton />
                </div>
            </div>
        </div>
    );
};
