

import React, { useState, useMemo, useContext, useEffect } from 'react';
import { Header } from './Header';
import { CategoryFilter } from './CategoryFilter';
import { FeaturedItems } from './FeaturedItems';
import { DirectoryItemList } from './ToolList';
import { DirectoryItemModal } from './ToolDetailModal';
import { useDebounce } from '../hooks/useDebounce';
import { useFavorites } from '../hooks/useFavorites';
import { Category, DirectoryItem, ResearchItem, NewsItem, InvestmentItem, JobItem, GithubRepositoryItem } from '../types';
import { LanguageContext } from '../i18n/LanguageContext';
import { KnowledgeBaseContext } from '../context/KnowledgeBaseContext';
import { NetworkBackground } from './NetworkBackground';


// A robust helper to safely convert any value to a valid Category enum value.
const toCategory = (input: unknown): Category => {
  let c = input as any;

  // If a DOM event accidentally gets passed
  if (c && typeof c === 'object' && 'target' in c && c.target?.value) {
    c = c.target.value;
  }

  // Accept direct enum value (e.g., 'All', 'Emerging Tech')
  if (Object.values(Category as any).includes(c)) {
    return c as Category;
  }

  // Accept enum KEY (e.g., "All", "Technologies")
  if (typeof c === 'string' && (Category as any)[c] !== undefined) {
    return (Category as any)[c] as Category;
  }

  // Last resort
  return Category.All;
};

const getItemDate = (item: DirectoryItem): Date | null => {
    try {
        let dateStr: string | undefined;
        if (item.category === Category.Research) dateStr = (item as ResearchItem).details.publishedDate;
        else if (item.category === Category.News) dateStr = (item as NewsItem).details.publishedDate;
        else if (item.category === Category.Investments) dateStr = (item as InvestmentItem).details.date;
        else if (item.category === Category.Jobs) dateStr = (item as JobItem).details.postedDate;
        else if (item.category === Category.GithubRepository) dateStr = (item as GithubRepositoryItem).details.lastUpdate;
        
        if (dateStr) {
            const date = new Date(dateStr);
            return isNaN(date.getTime()) ? null : date;
        }
    } catch (e) {
        return null;
    }
    return null;
};

interface DirectoryPageProps {
    initialCategory?: Category;
    scrollToExplore?: boolean;
    onScrollComplete?: () => void;
    userInterests: string[];
}

export const DirectoryPage: React.FC<DirectoryPageProps> = ({ initialCategory = Category.All, scrollToExplore, onScrollComplete, userInterests }) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Use the robust `toCategory` resolver for state management
  const [selectedCategory, setSelectedCategoryInternal] = useState<Category>(() => toCategory(initialCategory));
  const setSelectedCategory = (c: unknown) => {
      setSelectedCategoryInternal(toCategory(c));
  };

  const [timeFilter, setTimeFilter] = useState<'all' | '24h' | 'week' | 'month'>('all');
  const [sortOrder, setSortOrder] = useState<'relevance' | 'newest' | 'oldest'>('relevance');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  const [selectedItem, setSelectedItem] = useState<DirectoryItem | null>(null);
  const { t } = useContext(LanguageContext);
  const { isReady, getDirectoryItems, getRecommendedItems } = useContext(KnowledgeBaseContext);
  const { favorites, toggleFavorite } = useFavorites();

  const allDirectoryItems = useMemo(() => (isReady ? getDirectoryItems() : []), [isReady, getDirectoryItems]);
  
  // Ensure the category is updated if the initial prop changes
  useEffect(() => {
    setSelectedCategory(initialCategory);
  }, [initialCategory]);

  useEffect(() => {
    if (scrollToExplore) {
        const element = document.getElementById('explore-directory-section');
        if (element) {
            setTimeout(() => {
                 element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
        }
        if (onScrollComplete) {
            onScrollComplete();
        }
    }
  }, [scrollToExplore, onScrollComplete]);
  
  useEffect(() => {
      if (initialCategory === selectedCategory && selectedCategory === Category.All) return;

      if (selectedCategory === Category.All) {
          window.scrollTo({ top: 0, behavior: 'smooth' });
          return;
      }
      
      const element = document.getElementById('explore-directory-section');
      if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
  }, [selectedCategory, initialCategory]);


  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const categories = useMemo(() => {
    const vals = Object.values(Category).filter(v => typeof v === 'string');
    return [Category.All, ...vals.filter(v => v !== Category.All)];
  }, []);

  // Apply a 50-item limit per category to the entire dataset, preserving the shuffled order
  const limitedDirectoryItems = useMemo(() => {
    const categoryCounts: Record<string, number> = {};
    const limitedItems: DirectoryItem[] = [];

    for (const item of allDirectoryItems) {
        const category = item.category;
        const currentCount = categoryCounts[category] || 0;
        if (currentCount < 50) {
            limitedItems.push(item);
            categoryCounts[category] = currentCount + 1;
        }
    }
    return limitedItems;
  }, [allDirectoryItems]);
  
  const featuredItems = useMemo(() => {
    if (!isReady) return [];
    return getRecommendedItems(userInterests, 20);
  }, [isReady, userInterests, getRecommendedItems]);

  const showFeatured = debouncedSearchTerm.trim() === '' && !showFavoritesOnly;

  const filteredItems = useMemo(() => {
    const term = debouncedSearchTerm.toLowerCase().trim();
    const now = new Date();
  
    // Use all items if searching or viewing favorites to ensure we find them even if they are outside the initial limit
    const sourceItems = (term || showFavoritesOnly) ? allDirectoryItems : limitedDirectoryItems;

    let items = sourceItems.filter(item => {
      const itemCat = toCategory(item.category);
      const categoryMatch =
        selectedCategory === Category.All || itemCat === selectedCategory;
      if (!categoryMatch) return false;
  
      if (term) {
        const titleHit = item.title?.toLowerCase().includes(term);
        const descHit  = item.description?.toLowerCase().includes(term);
        const tagsHit  = Array.isArray(item.tags) && item.tags.some(t => t?.toLowerCase().includes(term));
        if (!(titleHit || descHit || tagsHit)) return false;
      }

      // Time filter
      if (timeFilter !== 'all') {
          const date = getItemDate(item);
          if (!date) return false; 
          
          const diffTime = Math.abs(now.getTime() - date.getTime());
          const diffDays = diffTime / (1000 * 60 * 60 * 24);
          
          if (timeFilter === '24h' && diffDays > 1) return false;
          if (timeFilter === 'week' && diffDays > 7) return false;
          if (timeFilter === 'month' && diffDays > 30) return false;
      }

      // Favorites filter
      if (showFavoritesOnly && !favorites.has(item.id)) {
          return false;
      }

      return true;
    });

    items.sort((a, b) => {
        if (sortOrder === 'newest' || sortOrder === 'oldest') {
            const dateA = getItemDate(a);
            const dateB = getItemDate(b);
            
            if (!dateA && !dateB) return 0;
            if (!dateA) return 1; // Items without date go to bottom
            if (!dateB) return -1;
            
            return sortOrder === 'newest' 
                ? dateB.getTime() - dateA.getTime() 
                : dateA.getTime() - dateB.getTime();
        }

        const aPriority = a.pinPriority ?? Infinity;
        const bPriority = b.pinPriority ?? Infinity;
        
        if (aPriority !== bPriority) {
            return aPriority - bPriority;
        }
        return 0; // Keep original relative order for items with the same priority
    });
    
    return items;
  }, [debouncedSearchTerm, selectedCategory, limitedDirectoryItems, timeFilter, sortOrder, showFavoritesOnly, favorites]);

  const mainListItems = useMemo(() => {
    if (showFeatured) {
        const featuredIds = new Set(featuredItems.map(item => item.id));
        return filteredItems.filter(item => !featuredIds.has(item.id));
    }
    return filteredItems;
  }, [filteredItems, featuredItems, showFeatured]);

  return (
    <>
      <NetworkBackground />
      <div className="relative container mx-auto px-4 py-8">
        <Header searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {showFeatured && (
            <FeaturedItems 
                items={featuredItems} 
                onSelect={setSelectedItem} 
                favorites={favorites}
                onToggleFavorite={toggleFavorite}
            />
          )}
          
          <section id="explore-directory-section">
            <h2 className="text-3xl sm:text-4xl font-bold text-center text-white mb-4">{t('directory.exploreTitle')}</h2>
            <CategoryFilter
              categories={categories}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
            />
            
            <div className="flex flex-wrap justify-center gap-4 mb-8">
                <div className="flex items-center gap-2 bg-slate-800/50 rounded-lg p-1 border border-slate-700">
                    <span className="text-xs text-slate-400 font-medium px-2">Time:</span>
                    {(['all', '24h', 'week', 'month'] as const).map((filter) => (
                        <button
                            key={filter}
                            onClick={() => setTimeFilter(filter)}
                            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                                timeFilter === filter
                                    ? 'bg-sky-600 text-white shadow-sm'
                                    : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                            }`}
                        >
                            {filter === 'all' ? 'All Time' : filter === '24h' ? 'Last 24h' : filter === 'week' ? 'Last Week' : 'Last Month'}
                        </button>
                    ))}
                </div>

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

                <div className="flex items-center gap-2 bg-slate-800/50 rounded-lg p-1 border border-slate-700">
                    <span className="text-xs text-slate-400 font-medium px-2">Sort:</span>
                    {(['relevance', 'newest', 'oldest'] as const).map((order) => (
                        <button
                            key={order}
                            onClick={() => setSortOrder(order)}
                            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                                sortOrder === order
                                    ? 'bg-sky-600 text-white shadow-sm'
                                    : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                            }`}
                        >
                            {order.charAt(0).toUpperCase() + order.slice(1)}
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
                items={mainListItems} 
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