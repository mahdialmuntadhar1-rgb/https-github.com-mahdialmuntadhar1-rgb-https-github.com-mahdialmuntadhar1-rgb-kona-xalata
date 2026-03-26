import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { translations } from '../constants';

type Language = 'en' | 'ar' | 'ku';
type Direction = 'ltr' | 'rtl';

interface TranslationContextType {
    lang: Language;
    dir: Direction;
    t: (key: string) => string;
    setLang: (lang: Language) => void;
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

export const TranslationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [lang, setLangState] = useState<Language>('en');

    useEffect(() => {
        const savedLang = localStorage.getItem('iraq-compass-lang') as Language;
        if (savedLang && ['en', 'ar', 'ku'].includes(savedLang)) {
            setLangState(savedLang);
        }
    }, []);

    const dir = lang === 'ar' || lang === 'ku' ? 'rtl' : 'ltr';

    useEffect(() => {
        document.documentElement.lang = lang;
        document.documentElement.dir = dir;
    }, [lang, dir]);

    const setLang = (newLang: Language) => {
        setLangState(newLang);
        localStorage.setItem('iraq-compass-lang', newLang);
    };

    const t = useCallback((key: string): string => {
        const keys = key.split('.');
        let result: any = translations[lang];
        for (const k of keys) {
            result = result?.[k];
            if (result === undefined) {
                // Fallback to English if translation is missing
                let fallbackResult: any = translations.en;
                for (const fk of keys) {
                    fallbackResult = fallbackResult?.[fk];
                }
                return fallbackResult || key;
            }
        }
        return result || key;
    }, [lang]);

    // FIX: Replaced JSX with React.createElement to be compatible with a .ts file extension.
    // This resolves parsing errors where TypeScript was misinterpreting JSX syntax.
    return React.createElement(TranslationContext.Provider, { value: { lang, dir, t, setLang } }, children);
};

export const useTranslations = (): TranslationContextType => {
    const context = useContext(TranslationContext) as TranslationContextType | undefined;
    if (!context) {
        throw new Error('useTranslations must be used within a TranslationProvider');
    }
    return context;
};
