import React, { createContext, useState, useEffect, useCallback } from 'react';
import en from './locales/en';
import ar from './locales/ar';

type Language = 'en' | 'ar';

interface LanguageContextType {
  lang: Language;
  setLanguage: (lang: Language) => void;
  // FIX: Allow for interpolation options in the `t` function to fix type error.
  t: (key: string, options?: { returnObjects?: boolean; [key: string]: any; }) => any;
}

export const LanguageContext = createContext<LanguageContextType>({
  lang: 'en',
  setLanguage: () => {},
  t: () => '',
});

const translations = { en, ar };

// Helper to get nested keys
const getNestedTranslation = (obj: any, key: string): any => {
    return key.split('.').reduce((o, i) => (o ? o[i] : undefined), obj);
}

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLang] = useState<Language>('en');

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }, [lang]);

  const setLanguage = (newLang: Language) => {
    setLang(newLang);
  };
  
  const t = useCallback((key: string, options?: { returnObjects?: boolean; [key: string]: any; }) => {
    let translation = getNestedTranslation(translations[lang], key);
    if (options?.returnObjects) {
      return translation || [];
    }

    if (typeof translation === 'string' && options) {
      Object.keys(options).forEach(optionKey => {
        if (optionKey !== 'returnObjects') {
          translation = translation.replace(new RegExp(`{{${optionKey}}}`, 'g'), options[optionKey]);
        }
      });
    }
    
    return translation || key;
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};