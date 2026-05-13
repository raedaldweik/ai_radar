import React, { useContext, useMemo } from 'react';
import { NewsItem, DirectoryItem } from '../../types';
import { LanguageContext } from '../../i18n/LanguageContext';
import { ArrowRightIcon } from '../icons/ArrowRightIcon';

interface TopNewsListProps {
  newsItems: NewsItem[];
  excludeIds: Set<string>;
  favorites: Set<string>;
  onToggleFavorite: (id: string) => void;
  onSelect: (item: DirectoryItem) => void;
  onViewAll: () => void;
  maxItems?: number;
}

const formatRelative = (iso: string, lang: string): string => {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const diffMs = Date.now() - d.getTime();
  const minutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const isAr = lang === 'ar';
  if (minutes < 60) return isAr ? `${minutes}د` : `${minutes}m`;
  if (hours < 24) return isAr ? `${hours}س` : `${hours}h`;
  if (days < 30) return isAr ? `${days}ي` : `${days}d`;
  return isAr ? `${Math.floor(days / 30)}شهر` : `${Math.floor(days / 30)}mo`;
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

export const TopNewsList: React.FC<TopNewsListProps> = ({
  newsItems,
  excludeIds,
  favorites,
  onToggleFavorite,
  onSelect,
  onViewAll,
  maxItems = 8,
}) => {
  const { t, lang } = useContext(LanguageContext);

  const items = useMemo(() => {
    return newsItems
      .filter(n => !excludeIds.has(n.id))
      .slice()
      .sort((a, b) => {
        const tA = new Date(a.details.publishedDate).getTime() || 0;
        const tB = new Date(b.details.publishedDate).getTime() || 0;
        return tB - tA;
      })
      .slice(0, maxItems);
  }, [newsItems, excludeIds, maxItems]);

  return (
    <section className="bg-white/[0.04] backdrop-blur-lg border border-white/10 rounded-xl overflow-hidden flex flex-col h-full">
      {/* Section header */}
      <header className="px-4 py-3 border-b border-white/10 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-sky-500/10 text-sky-400 shrink-0">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          </span>
          <h3 className="font-bold text-slate-100 text-base">
            {t('dashboardV2.topNewsTitle')}
          </h3>
          <span className="text-[10px] font-medium text-slate-400 bg-slate-700/40 border border-slate-600/40 rounded-full px-2 py-0.5 tabular-nums">
            {items.length}
          </span>
        </div>
        <button
          onClick={onViewAll}
          className="text-[11px] text-sky-400 font-semibold hover:text-sky-300 transition-colors inline-flex items-center gap-1 group shrink-0"
        >
          {t('dashboardV2.viewAll')}
          <ArrowRightIcon className="w-3 h-3 transition-transform group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5 rtl:rotate-180" />
        </button>
      </header>

      {/* List */}
      {items.length === 0 ? (
        <div className="p-6 text-center text-slate-400 text-sm">
          {t('dashboardV2.noItems')}
        </div>
      ) : (
        <ul className="divide-y divide-white/5 overflow-y-auto flex-1 max-h-[520px] scrollbar-thin">
          {items.map(item => {
            const isFav = favorites.has(item.id);
            return (
              <li
                key={item.id}
                onClick={() => onSelect(item)}
                className="group px-4 py-3 hover:bg-white/[0.04] cursor-pointer transition-colors flex items-start gap-3"
                role="button"
                aria-label={`Read ${item.title}`}
              >
                {/* dot */}
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-sky-400/60 group-hover:bg-sky-400 shrink-0 transition-colors"></span>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5 text-[11px] text-slate-400">
                    <span className="truncate font-medium" title={item.details.source}>
                      {item.details.source}
                    </span>
                    <span className="text-slate-600">·</span>
                    <span className="tabular-nums shrink-0">
                      {formatRelative(item.details.publishedDate, lang)}
                    </span>
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
    </section>
  );
};
