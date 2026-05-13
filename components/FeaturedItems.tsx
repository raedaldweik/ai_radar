import React, { useContext } from 'react';
import type { DirectoryItem } from '../types';
import { ExternalLinkIcon } from './icons/ExternalLinkIcon';
import { LanguageContext } from '../i18n/LanguageContext';

interface FeaturedItemsProps {
  items: DirectoryItem[];
  onSelect: (item: DirectoryItem) => void;
  favorites?: Set<string>;
  onToggleFavorite?: (id: string) => void;
}

const getWebsiteUrl = (item: DirectoryItem): string => {
    switch (item.category) {
        case 'Startups': return (item as any).details.websiteUrl;
        case 'Research': return (item as any).details.paperUrl;
        case 'Jobs': return (item as any).details.applyUrl;
        case 'News': return (item as any).details.articleUrl;
        case 'Emerging Tech': return (item as any).details.websiteUrl;
        case 'Investments': return (item as any).details.companyUrl;
        case 'Github Repository': return (item as any).details.repoUrl;
        default: return '#';
    }
}

export const FeaturedItems: React.FC<FeaturedItemsProps> = ({ items, onSelect, favorites, onToggleFavorite }) => {
  const { t } = useContext(LanguageContext);

  const handleFavoriteClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (onToggleFavorite) {
      onToggleFavorite(id);
    }
  };

  return (
    <section className="mb-16">
      <h2 className="text-3xl sm:text-4xl font-bold text-center text-slate-100 mb-8">{t('directory.featuredTitle')}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {items.map(item => (
          <div
            key={item.id}
            onClick={() => onSelect(item)}
            className="bg-slate-800/70 backdrop-blur-lg rounded-xl overflow-hidden shadow-lg hover:shadow-sky-500/30 transition-all duration-300 ease-in-out transform hover:scale-105 hover:-translate-y-2 cursor-pointer group border border-slate-700/60 hover:border-sky-400/70 relative"
            role="button"
            aria-label={`View details for featured item ${item.title}`}
          >
            <div className="relative overflow-hidden">
              <img className="w-full h-56 object-cover group-hover:scale-110 transition-transform duration-500 ease-in-out" src={item.imageUrl} alt={item.title} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              
              {onToggleFavorite && (
                <button
                    onClick={(e) => handleFavoriteClick(e, item.id)}
                    className="absolute top-2 left-2 p-2 rounded-full bg-black/40 hover:bg-black/60 transition-colors z-20"
                    aria-label={favorites?.has(item.id) ? "Remove from favorites" : "Add to favorites"}
                >
                    <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill={favorites?.has(item.id) ? "#fbbf24" : "none"}
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke={favorites?.has(item.id) ? "#fbbf24" : "currentColor"}
                    className="w-6 h-6 text-white"
                    >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                    />
                    </svg>
                </button>
              )}

              <div className="absolute bottom-0 start-0 p-6">
                 <span className="inline-block bg-sky-600 text-white text-xs font-semibold px-2 py-1 rounded-full mb-2">
                  {t(`categories.${item.category.replace(' ', '')}`)}
                </span>
                <h3 className="font-bold text-2xl text-slate-100">
                  {item.title}
                </h3>
              </div>
            </div>
            <div className="p-6">
              <p className="text-slate-400 text-base mb-4">{item.description}</p>
               <a
                href={getWebsiteUrl(item)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-2 text-sky-400 font-semibold hover:text-sky-300 transition-colors"
              >
                {t('common.learnMore')}
                <ExternalLinkIcon className="w-4 h-4" />
              </a>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};