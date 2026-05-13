import React, { useState, useMemo, useContext, useEffect } from 'react';
import { Header } from './Header';
import { FeaturedItems } from './FeaturedItems';
import { DirectoryItemList } from './ToolList';
import { DirectoryItemModal } from './ToolDetailModal';
import { useDebounce } from '../hooks/useDebounce';
import { useFavorites } from '../hooks/useFavorites';
import { Category, DirectoryItem, LearningItem } from '../types';
import { LanguageContext } from '../i18n/LanguageContext';
import { KnowledgeBaseContext } from '../context/KnowledgeBaseContext';
import { NetworkBackground } from './NetworkBackground';

export const LearningPage: React.FC<{ userInterests: string[] }> = ({ userInterests }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<'All' | 'Beginner' | 'Intermediate' | 'Advanced'>('All');
  const [selectedPlatform, setSelectedPlatform] = useState<'All' | 'Coursera' | 'Udemy'>('All');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [selectedItem, setSelectedItem] = useState<DirectoryItem | null>(null);

  const { t } = useContext(LanguageContext);
  const { isReady, getDirectoryItems, getRecommendedItems } = useContext(KnowledgeBaseContext);
  const { favorites, toggleFavorite } = useFavorites();

  const allLearningItems = useMemo(() => {
    if (!isReady) return [];
    return getDirectoryItems().filter(item => item.category === Category.Learning) as LearningItem[];
  }, [isReady, getDirectoryItems]);

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const featuredItems = useMemo(() => {
    if (!isReady) return [];
    return getRecommendedItems(userInterests, 6, Category.Learning);
  }, [isReady, userInterests, getRecommendedItems]);

  const showFeatured = debouncedSearchTerm.trim() === '' && !showFavoritesOnly && selectedLevel === 'All' && selectedPlatform === 'All';

  const filteredItems = useMemo(() => {
    const term = debouncedSearchTerm.toLowerCase().trim();
  
    return allLearningItems.filter(item => {
      // Search filter
      if (term) {
        const titleHit = item.title?.toLowerCase().includes(term);
        const descHit  = item.description?.toLowerCase().includes(term);
        const instructorHit = item.details.instructor.toLowerCase().includes(term);
        const tagsHit  = Array.isArray(item.tags) && item.tags.some(t => t?.toLowerCase().includes(term));
        if (!(titleHit || descHit || tagsHit || instructorHit)) return false;
      }

      // Level filter
      if (selectedLevel !== 'All' && item.details.level !== selectedLevel) {
          return false;
      }

      // Platform filter
      if (selectedPlatform !== 'All' && item.details.platform !== selectedPlatform) {
          return false;
      }

      // Favorites filter
      if (showFavoritesOnly && !favorites.has(item.id)) {
          return false;
      }

      return true;
    });
  }, [debouncedSearchTerm, allLearningItems, selectedLevel, selectedPlatform, showFavoritesOnly, favorites]);

  return (
    <>
      <NetworkBackground />
      <div className="relative container mx-auto px-4 py-8">
         <div className="mb-12 text-center relative z-10">
            <h1 className="text-4xl sm:text-6xl font-extrabold text-white mb-4 tracking-tight">
                {t('learning.headerTitle')}
            </h1>
            <p className="text-lg sm:text-xl text-slate-300 max-w-3xl mx-auto font-medium">
                {t('learning.headerSubtitle')}
            </p>
            
            <div className="mt-8 max-w-2xl mx-auto relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-sky-400 to-sky-600 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative flex items-center bg-slate-900 border border-slate-700/50 rounded-full shadow-2xl transition-all duration-300 group-hover:border-sky-500/50">
                    <div className="pl-6 text-sky-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    </div>
                    <input
                        type="text"
                        placeholder={t('learning.searchPlaceholder')}
                        className="w-full bg-transparent border-none focus:ring-0 text-white py-4 px-4 text-lg placeholder-slate-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>
        </div>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {showFeatured && (
            <FeaturedItems 
                items={featuredItems} 
                onSelect={setSelectedItem} 
                favorites={favorites}
                onToggleFavorite={toggleFavorite}
            />
          )}
          
          <section id="explore-learning-section">
            <h2 className="text-3xl sm:text-4xl font-bold text-center text-white mb-8">{t('learning.exploreTitle')}</h2>
            
            <div className="flex flex-wrap justify-center gap-4 mb-8">
                {/* Favorites Toggle */}
                <div className="flex items-center gap-2 bg-slate-800/50 rounded-lg p-1 border border-slate-700">
                    <button
                        onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1 ${
                            showFavoritesOnly
                                ? 'bg-amber-500 text-white shadow-sm'
                                : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                        }`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                            <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                        </svg>
                        Favorites
                    </button>
                </div>

                {/* Level Filter */}
                <div className="flex items-center gap-2 bg-slate-800/50 rounded-lg p-1 border border-slate-700">
                    <span className="text-xs text-slate-400 font-medium px-2">Level:</span>
                    {(['All', 'Beginner', 'Intermediate', 'Advanced'] as const).map((level) => (
                        <button
                            key={level}
                            onClick={() => setSelectedLevel(level)}
                            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                                selectedLevel === level
                                    ? 'bg-sky-600 text-white shadow-sm'
                                    : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                            }`}
                        >
                            {level}
                        </button>
                    ))}
                </div>

                {/* Platform Filter */}
                <div className="flex items-center gap-2 bg-slate-800/50 rounded-lg p-1 border border-slate-700">
                    <span className="text-xs text-slate-400 font-medium px-2">Platform:</span>
                    {(['All', 'Coursera', 'Udemy'] as const).map((platform) => (
                        <button
                            key={platform}
                            onClick={() => setSelectedPlatform(platform)}
                            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                                selectedPlatform === platform
                                    ? 'bg-indigo-600 text-white shadow-sm'
                                    : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                            }`}
                        >
                            {platform}
                        </button>
                    ))}
                </div>
            </div>

            {!isReady ? (
               <div className="text-center py-16">
                  <h3 className="text-2xl font-semibold text-white mb-2">{t('directory.loading')}</h3>
                  <p className="text-slate-400">{t('directory.loadingMessage')}</p>
              </div>
            ) : (
                <DirectoryItemList 
                items={filteredItems} 
                onSelectItem={setSelectedItem} 
                favorites={favorites}
                onToggleFavorite={toggleFavorite}
              />
            )}
          </section>
        </main>
        <DirectoryItemModal item={selectedItem} onClose={() => setSelectedItem(null)} />
      </div>
    </>
  );
};
