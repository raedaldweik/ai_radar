import React, { useContext, useMemo, useState } from 'react';
import {
  Category,
  DirectoryItem,
  NewsItem,
  ResearchItem,
  StartupItem,
  InvestmentItem,
  GithubRepositoryItem,
} from '../../types';
import { LanguageContext } from '../../i18n/LanguageContext';
import { getInterestTags } from '../../utils/interests';
import { INTEREST_KEYWORDS } from '../../utils/recommendation-keywords';
import { ArrowRightIcon } from '../icons/ArrowRightIcon';
import { MAX_WATCHLIST_ITEMS } from '../../data/alerts-config';

interface WatchlistFeedProps {
  allItems: DirectoryItem[];
  userInterests: string[];
  favorites: Set<string>;
  onToggleFavorite: (id: string) => void;
  onSelect: (item: DirectoryItem) => void;
  onNavigateToDirectory: () => void;
  onPickInterests: () => void;
}

const WATCHLIST_CATEGORIES: Category[] = [
  Category.News,
  Category.Research,
  Category.Startups,
  Category.Investments,
  Category.GithubRepository,
];

const keywordsForInterest = (interest: string): Set<string> => {
  const set = new Set<string>();
  const tagSet = getInterestTags([interest]);
  tagSet.forEach(t => set.add(t.toLowerCase()));
  const bodyKw = INTEREST_KEYWORDS[interest];
  if (bodyKw) bodyKw.forEach(k => set.add(k.toLowerCase()));
  set.add(interest.toLowerCase());
  return set;
};

const scoreItemForInterest = (item: DirectoryItem, keywords: Set<string>): number => {
  let score = 0;
  const title = item.title.toLowerCase();
  keywords.forEach(k => { if (title.includes(k)) score += 3; });
  item.tags.forEach(tag => { if (keywords.has(tag.toLowerCase())) score += 2; });
  const desc = item.description.toLowerCase();
  keywords.forEach(k => { if (desc.includes(k)) score += 1; });
  return score;
};

const getItemDate = (item: DirectoryItem): number => {
  switch (item.category) {
    case Category.News:        return new Date((item as NewsItem).details.publishedDate).getTime() || 0;
    case Category.Research:    return new Date((item as ResearchItem).details.publishedDate).getTime() || 0;
    case Category.Investments: return new Date((item as InvestmentItem).details.date).getTime() || 0;
    default: return 0;
  }
};

const getItemMeta = (item: DirectoryItem, t: (k: string, opts?: any) => any): string => {
  switch (item.category) {
    case Category.News:        return (item as NewsItem).details.source;
    case Category.Research: {
      const r = item as ResearchItem;
      return r.details.authors[0] + (r.details.authors.length > 1 ? ` +${r.details.authors.length - 1}` : '');
    }
    case Category.Startups: {
      const s = item as StartupItem;
      return `${t('modal.founded')} ${s.details.foundedYear}`;
    }
    case Category.Investments: {
      const inv = item as InvestmentItem;
      return `${inv.details.amount} · ${inv.details.round}`;
    }
    case Category.GithubRepository: {
      const g = item as GithubRepositoryItem;
      return `★ ${g.details.stars.toLocaleString()}`;
    }
    default: return '';
  }
};

const categoryDot = (cat: Category): string => {
  switch (cat) {
    case Category.News:             return 'bg-sky-400';
    case Category.Research:         return 'bg-purple-400';
    case Category.Startups:         return 'bg-emerald-400';
    case Category.Investments:      return 'bg-amber-400';
    case Category.GithubRepository: return 'bg-pink-400';
    default:                        return 'bg-slate-400';
  }
};

const StarIcon: React.FC<{ active: boolean; className?: string }> = ({ active, className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill={active ? '#fbbf24' : 'none'}
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke={active ? '#fbbf24' : 'currentColor'}
    className={className}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
    />
  </svg>
);

export const WatchlistFeed: React.FC<WatchlistFeedProps> = ({
  allItems,
  userInterests,
  favorites,
  onToggleFavorite,
  onSelect,
  onNavigateToDirectory,
  onPickInterests,
}) => {
  const { t } = useContext(LanguageContext);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [starredOnly, setStarredOnly] = useState(false);

  const watchableItems = useMemo(
    () => allItems.filter(i => WATCHLIST_CATEGORIES.includes(i.category)),
    [allItems]
  );

  const itemsByInterest = useMemo(() => {
    const map: Record<string, DirectoryItem[]> = {};
    if (userInterests.length === 0) return map;
    userInterests.forEach(interest => {
      const kws = keywordsForInterest(interest);
      const scored = watchableItems
        .map(item => ({ item, score: scoreItemForInterest(item, kws) }))
        .filter(s => s.score > 0)
        .sort((a, b) => {
          if (b.score !== a.score) return b.score - a.score;
          return getItemDate(b.item) - getItemDate(a.item);
        })
        .map(s => s.item);
      map[interest] = scored;
    });
    return map;
  }, [watchableItems, userInterests]);

  const allWatchlistItems = useMemo(() => {
    const seen = new Set<string>();
    const out: DirectoryItem[] = [];
    const lists = userInterests.map(i => itemsByInterest[i] || []);
    let added = true;
    let cursor = 0;
    while (added && out.length < MAX_WATCHLIST_ITEMS * 2) {
      added = false;
      for (const list of lists) {
        const item = list[cursor];
        if (item && !seen.has(item.id)) {
          seen.add(item.id);
          out.push(item);
          added = true;
        }
      }
      cursor += 1;
    }
    return out;
  }, [itemsByInterest, userInterests]);

  const visibleItems = useMemo(() => {
    let base: DirectoryItem[];
    if (activeTab === 'all') base = allWatchlistItems;
    else base = itemsByInterest[activeTab] || [];
    if (starredOnly) base = base.filter(i => favorites.has(i.id));
    return base.slice(0, MAX_WATCHLIST_ITEMS);
  }, [activeTab, allWatchlistItems, itemsByInterest, starredOnly, favorites]);

  // ---- Empty state when no interests ----
  if (userInterests.length === 0) {
    return (
      <section className="bg-white/[0.04] backdrop-blur-lg border border-white/10 rounded-xl overflow-hidden flex flex-col h-full">
        <header className="px-4 py-3 border-b border-white/10 flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-sky-500/10 text-sky-400 shrink-0">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </span>
          <h3 className="font-bold text-slate-100 text-base">{t('dashboardV2.watchlistTitle')}</h3>
        </header>
        <div className="p-6 text-center flex-1 flex flex-col items-center justify-center">
          <p className="text-slate-300 font-semibold mb-1.5 text-sm">
            {t('dashboardV2.watchlistEmptyTitle')}
          </p>
          <p className="text-slate-400 text-xs mb-4 max-w-xs leading-relaxed">
            {t('dashboardV2.watchlistEmptyDescription')}
          </p>
          <button
            onClick={onPickInterests}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            {t('dashboardV2.watchlistPickInterests')}
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-white/[0.04] backdrop-blur-lg border border-white/10 rounded-xl overflow-hidden flex flex-col h-full">
      {/* Section header */}
      <header className="px-4 py-3 border-b border-white/10 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-sky-500/10 text-sky-400 shrink-0">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </span>
          <h3 className="font-bold text-slate-100 text-base">
            {t('dashboardV2.watchlistTitle')}
          </h3>
          <span className="text-[10px] font-medium text-slate-400 bg-slate-700/40 border border-slate-600/40 rounded-full px-2 py-0.5 tabular-nums">
            {visibleItems.length}
          </span>
        </div>
        <button
          onClick={() => setStarredOnly(s => !s)}
          className={`shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium transition-all border
            ${starredOnly
              ? 'bg-amber-500/15 text-amber-300 border-amber-500/40'
              : 'bg-transparent text-slate-400 border-white/10 hover:border-white/20 hover:text-slate-200'
            }`}
          aria-pressed={starredOnly}
        >
          <StarIcon active={starredOnly} className="w-3 h-3" />
          {t('dashboardV2.starredShort')}
        </button>
      </header>

      {/* Tabs */}
      <div className="px-4 py-2 border-b border-white/5 flex items-center gap-1.5 overflow-x-auto scrollbar-thin">
        <button
          onClick={() => setActiveTab('all')}
          className={`shrink-0 px-2.5 py-1 rounded text-[11px] font-medium transition-all
            ${activeTab === 'all'
              ? 'bg-sky-500/15 text-sky-300 ring-1 ring-sky-500/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
        >
          {t('dashboardV2.tabAll')}
          <span className={`ms-1.5 text-[10px] tabular-nums ${activeTab === 'all' ? 'text-sky-400' : 'text-slate-500'}`}>
            {allWatchlistItems.length}
          </span>
        </button>
        {userInterests.map(interest => {
          const count = (itemsByInterest[interest] || []).length;
          const active = activeTab === interest;
          return (
            <button
              key={interest}
              onClick={() => setActiveTab(interest)}
              className={`shrink-0 px-2.5 py-1 rounded text-[11px] font-medium transition-all
                ${active
                  ? 'bg-sky-500/15 text-sky-300 ring-1 ring-sky-500/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
            >
              {interest}
              <span className={`ms-1.5 text-[10px] tabular-nums ${active ? 'text-sky-400' : 'text-slate-500'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* List */}
      {visibleItems.length === 0 ? (
        <div className="p-6 text-center text-slate-400 text-xs flex-1 flex items-center justify-center">
          {starredOnly
            ? t('dashboardV2.watchlistNoStarred')
            : t('dashboardV2.watchlistNoMatches')}
        </div>
      ) : (
        <ul className="divide-y divide-white/5 overflow-y-auto flex-1 max-h-[520px] scrollbar-thin">
          {visibleItems.map(item => {
            const isFav = favorites.has(item.id);
            const meta = getItemMeta(item, t);
            return (
              <li
                key={item.id}
                onClick={() => onSelect(item)}
                className="group px-4 py-2.5 hover:bg-white/[0.04] cursor-pointer transition-colors flex items-start gap-2.5"
                role="button"
                aria-label={`Open ${item.title}`}
              >
                <span className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${categoryDot(item.category)}`} />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5 text-[11px] text-slate-400">
                    <span className="font-bold uppercase tracking-wider text-[9px] text-slate-500">
                      {t(`categories.${item.category.replace(' ', '')}`)}
                    </span>
                    {meta && (
                      <>
                        <span className="text-slate-600">·</span>
                        <span className="truncate" title={meta}>{meta}</span>
                      </>
                    )}
                  </div>
                  <h4 className="text-sm leading-snug text-slate-100 line-clamp-2 group-hover:text-white transition-colors">
                    {item.title}
                  </h4>
                </div>

                <button
                  onClick={e => {
                    e.stopPropagation();
                    onToggleFavorite(item.id);
                  }}
                  className="shrink-0 p-1 rounded hover:bg-white/5 transition-colors"
                  aria-label={isFav ? 'Unstar' : 'Star'}
                >
                  <StarIcon
                    active={isFav}
                    className={`w-4 h-4 transition-colors ${isFav ? 'text-amber-400' : 'text-slate-600 group-hover:text-slate-400'}`}
                  />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {/* Footer */}
      <footer className="px-4 py-2.5 border-t border-white/5 flex items-center justify-end">
        <button
          onClick={onNavigateToDirectory}
          className="inline-flex items-center gap-1 text-[11px] text-sky-400 font-semibold hover:text-sky-300 transition-colors group"
        >
          {t('dashboardV2.exploreDirectory')}
          <ArrowRightIcon className="w-3 h-3 transition-transform group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5 rtl:rotate-180" />
        </button>
      </footer>
    </section>
  );
};
