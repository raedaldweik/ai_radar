import React, { useContext, useMemo } from 'react';
import { Category, NewsItem, DirectoryItem } from '../../types';
import { LanguageContext } from '../../i18n/LanguageContext';
import { ArrowRightIcon } from '../icons/ArrowRightIcon';

interface TopNewsGridProps {
  newsItems: NewsItem[];
  excludeIds: Set<string>;
  favorites: Set<string>;
  onToggleFavorite: (id: string) => void;
  onSelect: (item: DirectoryItem) => void;
  onViewAll: () => void;
  maxItems?: number;
}

const formatDate = (iso: string, lang: string): string => {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(lang === 'ar' ? 'ar-AE' : 'en-US', {
    month: 'short',
    day: 'numeric',
    year: d.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
  });
};

const StarToggle: React.FC<{
  active: boolean;
  onClick: (e: React.MouseEvent) => void;
}> = ({ active, onClick }) => (
  <button
    onClick={onClick}
    className="absolute top-3 end-3 p-1.5 rounded-full bg-slate-900/40 hover:bg-slate-900/70 backdrop-blur transition-colors z-10"
    aria-label={active ? 'Remove from favorites' : 'Add to favorites'}
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill={active ? '#fbbf24' : 'none'}
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke={active ? '#fbbf24' : 'currentColor'}
      className={`w-4 h-4 ${active ? 'text-amber-400' : 'text-slate-400 hover:text-slate-200'}`}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
      />
    </svg>
  </button>
);

export const TopNewsGrid: React.FC<TopNewsGridProps> = ({
  newsItems,
  excludeIds,
  favorites,
  onToggleFavorite,
  onSelect,
  onViewAll,
  maxItems = 6,
}) => {
  const { t, lang } = useContext(LanguageContext);

  const items = useMemo(() => {
    return newsItems
      .filter(n => !excludeIds.has(n.id))
      .slice() // copy
      .sort((a, b) => {
        const tA = new Date(a.details.publishedDate).getTime() || 0;
        const tB = new Date(b.details.publishedDate).getTime() || 0;
        return tB - tA;
      })
      .slice(0, maxItems);
  }, [newsItems, excludeIds, maxItems]);

  if (items.length === 0) return null;

  return (
    <section className="mb-12" aria-labelledby="top-news-heading">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 id="top-news-heading" className="text-2xl font-bold text-slate-100">
            {t('dashboardV2.topNewsTitle')}
          </h2>
          <p className="text-sm text-slate-400 mt-1">{t('dashboardV2.topNewsSubtitle')}</p>
        </div>
        <button
          onClick={onViewAll}
          className="hidden sm:inline-flex items-center gap-1.5 text-sky-400 font-semibold hover:text-sky-300 transition-colors text-sm group"
        >
          {t('dashboardV2.viewAllNews')}
          <ArrowRightIcon className="w-4 h-4 transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1 rtl:rotate-180" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map(item => {
          const isFav = favorites.has(item.id);
          return (
            <article
              key={item.id}
              onClick={() => onSelect(item)}
              className="group relative bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-5 cursor-pointer transition-all duration-300 hover:border-sky-400/40 hover:bg-white/[0.07] hover:-translate-y-0.5 hover:shadow-[0_0_25px_-12px_rgba(56,189,248,0.4)]"
              role="button"
              aria-label={`Read ${item.title}`}
            >
              <StarToggle
                active={isFav}
                onClick={e => {
                  e.stopPropagation();
                  onToggleFavorite(item.id);
                }}
              />

              <div className="flex items-center gap-2 mb-3 pe-8">
                <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded">
                  {t('categories.News')}
                </span>
                <span className="text-xs text-slate-400 truncate" title={item.details.source}>
                  {item.details.source}
                </span>
              </div>

              <h3 className="font-semibold text-slate-100 leading-snug line-clamp-3 mb-3 group-hover:text-white transition-colors">
                {item.title}
              </h3>

              <p className="text-sm text-slate-400 line-clamp-2 mb-4">
                {item.description}
              </p>

              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  {formatDate(item.details.publishedDate, lang)}
                </span>
                <span className="text-xs text-sky-400 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                  {t('dashboardV2.readMore')} →
                </span>
              </div>
            </article>
          );
        })}
      </div>

      {/* Mobile-only "view all" */}
      <div className="mt-4 text-center sm:hidden">
        <button
          onClick={onViewAll}
          className="text-sky-400 font-semibold hover:text-sky-300 transition-colors text-sm inline-flex items-center gap-1"
        >
          {t('dashboardV2.viewAllNews')} →
        </button>
      </div>
    </section>
  );
};
