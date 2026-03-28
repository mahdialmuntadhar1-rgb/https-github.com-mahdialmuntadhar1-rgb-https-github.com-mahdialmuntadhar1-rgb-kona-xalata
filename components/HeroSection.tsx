import React from 'react';
import { heroSlides } from '../constants';
import { useTranslations } from '../hooks/useTranslations';
import { motion, AnimatePresence } from 'motion/react';

interface HeroSectionProps {
    onAction: (action: 'explore_city' | 'view_businesses' | 'trending' | 'join_owner') => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onAction }) => {
    const [activeSlide, setActiveSlide] = React.useState(0);
    const { t } = useTranslations();

    React.useEffect(() => {
        const timer = setInterval(() => {
            setActiveSlide(prev => (prev + 1) % heroSlides.length);
        }, 6000);
        return () => clearInterval(timer);
    }, []);

    return (
        <section className="relative h-[70vh] md:h-[85vh] w-full overflow-hidden flex flex-col justify-center items-center">
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeSlide}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1 }}
                    className="absolute inset-0 w-full h-full"
                >
                    <img
                        src={heroSlides[activeSlide].image}
                        alt={t(heroSlides[activeSlide].titleKey)}
                        className="absolute inset-0 w-full h-full object-cover scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-dark-bg/40 via-dark-bg/60 to-dark-bg"></div>
                </motion.div>
            </AnimatePresence>

            <div className="relative z-10 container mx-auto px-4 text-center">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeSlide}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="max-w-4xl mx-auto"
                    >
                        <h1 className="text-5xl lg:text-8xl font-bold mb-6 text-white tracking-tight leading-tight">
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-secondary to-accent">
                                {t(heroSlides[activeSlide].titleKey)}
                            </span>
                        </h1>
                        <p className="text-xl md:text-2xl text-white/80 mb-10 max-w-2xl mx-auto font-light leading-relaxed">
                            {t(heroSlides[activeSlide].subtitleKey)}
                        </p>
                        <div className="flex flex-wrap gap-4 justify-center">
                            <button onClick={() => onAction('explore_city')} className="px-8 py-4 rounded-full bg-primary text-white font-semibold hover:shadow-glow-primary transition-all duration-300 transform hover:scale-105">
                                {t('hero.cta.exploreCity')}
                            </button>
                            <button onClick={() => onAction('view_businesses')} className="px-8 py-4 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white font-semibold hover:bg-white/20 transition-all duration-300">
                                {t('hero.cta.viewBusinesses')}
                            </button>
                            <button onClick={() => onAction('trending')} className="px-8 py-4 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white font-semibold hover:bg-white/20 transition-all duration-300">
                                {t('hero.cta.seeTrending')}
                            </button>
                            <button onClick={() => onAction('join_owner')} className="px-8 py-4 rounded-full bg-secondary/80 backdrop-blur-md border border-secondary/60 text-white font-semibold hover:bg-secondary transition-all duration-300">
                                {t('hero.cta.joinOwner')}
                            </button>
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>

            <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-20 flex gap-3 items-center">
                {heroSlides.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => setActiveSlide(index)}
                        className={`group relative h-1.5 transition-all duration-500 rounded-full overflow-hidden ${activeSlide === index ? 'w-12 bg-primary' : 'w-6 bg-white/20 hover:bg-white/40'}`}
                        aria-label={`Go to slide ${index + 1}`}
                    >
                        {activeSlide === index && (
                            <motion.div
                                initial={{ x: '-100%' }}
                                animate={{ x: '0%' }}
                                transition={{ duration: 6, ease: 'linear' }}
                                className="absolute inset-0 bg-white/30"
                            />
                        )}
                    </button>
                ))}
            </div>
        </section>
    );
};
