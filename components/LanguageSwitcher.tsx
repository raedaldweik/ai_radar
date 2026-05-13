import React, { useContext } from 'react';
import { LanguageContext } from '../i18n/LanguageContext';

export const LanguageSwitcher: React.FC = () => {
    const { lang, setLanguage } = useContext(LanguageContext);

    const toggleLanguage = () => {
        const newLang = lang === 'en' ? 'ar' : 'en';
        setLanguage(newLang);
    };

    return (
        <button
            onClick={toggleLanguage}
            className="px-3 py-2 rounded-md text-sm font-medium transition-colors bg-sky-600 text-white hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-slate-900"
            aria-label={`Switch to ${lang === 'en' ? 'Arabic' : 'English'}`}
        >
            {lang === 'en' ? 'العربية' : 'English'}
        </button>
    );
};
