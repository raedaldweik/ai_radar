import React, { useContext } from 'react';
import { SearchIcon } from './icons/SearchIcon';
import { LanguageContext } from '../i18n/LanguageContext';

interface HeaderProps {
    searchTerm: string;
    setSearchTerm: (term: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ searchTerm, setSearchTerm }) => {
  const { t } = useContext(LanguageContext);

  return (
    <header className="py-12 text-center">
      <h1 className="text-5xl md:text-7xl font-extrabold text-slate-100 mb-4" style={{ textShadow: '0 0 20px rgba(56, 189, 248, 0.3)' }}>
        {t('directory.headerTitle')}
      </h1>
      <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-8">
        {t('directory.headerSubtitle')}
      </p>
      <div className="relative max-w-lg mx-auto">
        <div className="absolute inset-y-0 start-0 ps-3 flex items-center pointer-events-none">
          <SearchIcon className="h-5 w-5 text-slate-400" />
        </div>
        <input
          type="text"
          placeholder={t('directory.searchPlaceholder')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full ps-10 pe-4 py-3 bg-white/5 text-white border border-white/10 rounded-full focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all backdrop-blur-lg"
          aria-label={t('directory.searchPlaceholder')}
        />
      </div>
    </header>
  );
};