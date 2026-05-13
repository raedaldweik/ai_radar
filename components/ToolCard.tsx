import React, { useContext } from 'react';
import { DirectoryItem, Category } from '../types';
import { LanguageContext } from '../i18n/LanguageContext';

interface DirectoryItemCardProps {
  item: DirectoryItem;
  onSelect: (item: DirectoryItem) => void;
  isFavorite?: boolean;
  onToggleFavorite?: (id: string) => void;
}

const categoryColorMap: Record<Category, string> = {
  [Category.All]: 'bg-slate-700 text-slate-300',
  [Category.Research]: 'bg-sky-500/10 text-sky-400',
  [Category.Startups]: 'bg-emerald-500/10 text-emerald-400',
  [Category.Jobs]: 'bg-yellow-500/10 text-yellow-400',
  [Category.News]: 'bg-rose-500/10 text-rose-400',
  [Category.Technologies]: 'bg-indigo-500/10 text-indigo-400',
  [Category.Investments]: 'bg-teal-500/10 text-teal-400',
  [Category.GithubRepository]: 'bg-purple-500/10 text-purple-400',
};

export const DirectoryItemCard: React.FC<DirectoryItemCardProps> = ({ item, onSelect, isFavorite, onToggleFavorite }) => {
  const { t } = useContext(LanguageContext);
  const categoryClass = categoryColorMap[item.category] || categoryColorMap[Category.All];

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleFavorite) {
      onToggleFavorite(item.id);
    }
  };

  return (
    <div
      className="bg-slate-800/70 backdrop-blur-lg rounded-xl overflow-hidden shadow-lg hover:shadow-sky-500/20 transition-all duration-300 ease-in-out transform hover:scale-[1.03] hover:-translate-y-1 cursor-pointer group border border-slate-700/60 hover:border-sky-400/70 relative"
      onClick={() => onSelect(item)}
      role="button"
      aria-label={`View details for ${item.title}`}
    >
      <div className="overflow-hidden relative">
        <img className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500 ease-in-out" src={item.imageUrl} alt={item.title} />
        {onToggleFavorite && (
          <button
            onClick={handleFavoriteClick}
            className="absolute top-2 left-2 p-2 rounded-full bg-black/40 hover:bg-black/60 transition-colors z-10"
            aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill={isFavorite ? "#fbbf24" : "none"}
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke={isFavorite ? "#fbbf24" : "currentColor"}
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
      </div>
      <div className="p-6">
        <span className={`inline-block ${categoryClass} text-xs font-semibold px-2 py-1 rounded-full mb-2`}>
          {t(`categories.${item.category.replace(' ', '')}`)}
        </span>
        <h3 className="font-bold text-xl mb-2 text-slate-100 group-hover:text-sky-400 transition-colors duration-300">
          {item.title}
        </h3>
        <p className="text-slate-100 text-base">{item.description}</p>
      </div>
    </div>
  );
};