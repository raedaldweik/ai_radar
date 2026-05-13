import React, { useState, useContext, useMemo } from 'react';
import {
  Category,
  DirectoryItem,
  NewsItem,
  LearningItem,
} from '../types';
import { LanguageContext } from '../i18n/LanguageContext';
import { KnowledgeBaseContext } from '../context/KnowledgeBaseContext';
import { useFavorites } from '../hooks/useFavorites';
import { getInterestTags } from '../utils/interests';
import { NetworkBackground } from './NetworkBackground';
import { DirectoryItemModal } from './ToolDetailModal';

import { AlertsBanner } from './dashboard/AlertsBanner';
import { TopNewsList } from './dashboard/TopNewsList';
import { WatchlistFeed } from './dashboard/WatchlistFeed';
import { RecommendedCourses } from './dashboard/RecommendedCourses';

import {
  MAX_RECOMMENDED_COURSES,
} from '../data/alerts-config';

interface DashboardPageProps {
  onNavigateToDirectory: (
    category: Category,
    options?: { scrollToExplore?: boolean }
  ) => void;
  onPickInterests?: () => void;
  userInterests: string[];
  profileName?: string;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onNavigateToDirectory,
  onPickInterests,
  userInterests,
  profileName,
}) => {
  const { t, lang } = useContext(LanguageContext);
  const { isReady, getDirectoryItems, getRecommendedItems } =
    useContext(KnowledgeBaseContext);
  const { favorites, toggleFavorite } = useFavorites();
  const [selectedItem, setSelectedItem] = useState<DirectoryItem | null>(null);

  const allItems = useMemo<DirectoryItem[]>(
    () => (isReady ? getDirectoryItems() : []),
    [isReady, getDirectoryItems]
  );

  const newsItems = useMemo<NewsItem[]>(
    () => allItems.filter((i): i is NewsItem => i.category === Category.News),
    [allItems]
  );

  const recommendedCourses = useMemo<LearningItem[]>(() => {
    if (!isReady) return [];
    const recs = getRecommendedItems(
      userInterests,
      MAX_RECOMMENDED_COURSES,
      Category.Learning
    );
    return recs as LearningItem[];
  }, [isReady, userInterests, getRecommendedItems]);

  const interestTags = useMemo(
    () => getInterestTags(userInterests),
    [userInterests]
  );

  // IDs that AlertsBanner is likely to show — used to dedupe Top News
  const alertIds = useMemo(() => {
    if (newsItems.length === 0) return new Set<string>();

    const pinnedFirst = [...newsItems]
      .filter(n => n.isPinned)
      .sort((a, b) => (a.pinPriority || 99) - (b.pinPriority || 99));

    const candidates = [
      ...pinnedFirst,
      ...newsItems
        .filter(n => !n.isPinned)
        .sort(
          (a, b) =>
            (new Date(b.details.publishedDate).getTime() || 0) -
            (new Date(a.details.publishedDate).getTime() || 0)
        ),
    ];

    return new Set(candidates.slice(0, 3).map(n => n.id));
  }, [newsItems]);

  if (!isReady) {
    return (
      <>
        <NetworkBackground />
        <div className="relative container mx-auto px-4 py-24 text-center">
          <h3 className="text-2xl font-semibold text-white mb-2">
            {t('directory.loading')}
          </h3>
          <p className="text-slate-400">{t('directory.loadingMessage')}</p>
        </div>
      </>
    );
  }

  const greeting = profileName
    ? t('dashboardV2.greetingWithName').replace('{{name}}', profileName)
    : t('dashboardV2.greeting');

  const now = new Date();
  const lastUpdated = now.toLocaleTimeString(
    lang === 'ar' ? 'ar-AE' : 'en-US',
    { hour: '2-digit', minute: '2-digit' }
  );

  return (
    <>
      <NetworkBackground />
      <div className="relative container mx-auto px-4 py-6 max-w-[1400px]">
        {/* ============== HERO (compact, single block) ============== */}
        <header className="mb-5 pb-5 border-b border-white/10">
          <div className="flex items-baseline justify-between gap-4 flex-wrap mb-3">
            <h1 className="text-xl md:text-2xl font-bold text-slate-100 tracking-tight">
              {greeting}
            </h1>
            <div className="inline-flex items-center gap-1.5 text-[11px] text-slate-500">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400"></span>
              </span>
              <span>
                {t('dashboardV2.lastUpdated')} {lastUpdated}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] uppercase tracking-widest font-bold text-slate-500">
              {userInterests.length > 0 ? t('dashboardV2.watching') : t('dashboardV2.notWatching')}
            </span>
            {userInterests.map(interest => (
              <span
                key={interest}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-sky-500/10 text-sky-300 border border-sky-500/30 text-xs font-medium"
              >
                <span className="w-1 h-1 rounded-full bg-sky-400"></span>
                {interest}
              </span>
            ))}
            {onPickInterests && (
              <button
                onClick={onPickInterests}
                className="text-[11px] text-slate-400 hover:text-sky-300 transition-colors px-1.5 py-0.5 underline-offset-2 hover:underline"
              >
                {userInterests.length > 0 ? t('dashboardV2.editInterests') : t('dashboardV2.watchlistPickInterests')}
              </button>
            )}
          </div>
        </header>

        {/* ============== ALERTS (3 compact cards) ============== */}
        <AlertsBanner
          newsItems={newsItems}
          userInterestTags={interestTags}
          onSelect={setSelectedItem}
        />

        {/* ============== BENTO ROW: Watchlist (60%) + Top News (40%) ============== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-6">
          <div className="lg:col-span-7 min-h-[600px]">
            <WatchlistFeed
              allItems={allItems}
              userInterests={userInterests}
              favorites={favorites}
              onToggleFavorite={toggleFavorite}
              onSelect={setSelectedItem}
              onNavigateToDirectory={() =>
                onNavigateToDirectory(Category.All, { scrollToExplore: true })
              }
              onPickInterests={() => onPickInterests && onPickInterests()}
            />
          </div>
          <div className="lg:col-span-5 min-h-[600px]">
            <TopNewsList
              newsItems={newsItems}
              excludeIds={alertIds}
              favorites={favorites}
              onToggleFavorite={toggleFavorite}
              onSelect={setSelectedItem}
              onViewAll={() => onNavigateToDirectory(Category.News, { scrollToExplore: true })}
              maxItems={10}
            />
          </div>
        </div>

        {/* ============== COURSES (4-up compact) ============== */}
        <RecommendedCourses
          items={recommendedCourses}
          onSelect={setSelectedItem}
          onViewAll={() => onNavigateToDirectory(Category.Learning, { scrollToExplore: true })}
        />

        {/* ============== FOOTER (slim) ============== */}
        <footer className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between flex-wrap gap-2 text-[11px] text-slate-500">
          <span>
            <span className="font-semibold text-slate-400">{t('dashboardV2.dataSources')}:</span>{' '}
            arXiv · Crunchbase · GitHub · LinkedIn · TechCrunch · Coursera · Udemy
          </span>
          <span className="font-medium tracking-wider uppercase">{t('common.appName')}</span>
        </footer>

        <DirectoryItemModal item={selectedItem} onClose={() => setSelectedItem(null)} />
      </div>
    </>
  );
};
