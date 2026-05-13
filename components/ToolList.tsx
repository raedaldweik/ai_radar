import React, { useContext } from 'react';
import type { DirectoryItem } from '../types';
import { DirectoryItemCard } from './ToolCard';
import { LanguageContext } from '../i18n/LanguageContext';

interface DirectoryItemListProps {
  items: DirectoryItem[];
  onSelectItem: (item: DirectoryItem) => void;
  favorites?: Set<string>;
  onToggleFavorite?: (id: string) => void;
}

export const DirectoryItemList: React.FC<DirectoryItemListProps> = ({ items, onSelectItem, favorites, onToggleFavorite }) => {
  const { t } = useContext(LanguageContext);
  
  if (items.length === 0) {
    return (
        <div className="text-center py-16">
            <h3 className="text-2xl font-semibold text-white mb-2">{t('directory.noItemsFound')}</h3>
            <p className="text-slate-400">{t('directory.noItemsMessage')}</p>
        </div>
    )
  }
  
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
      {items.map((item, index) => (
        <div 
          key={item.id} 
          className="animate-fade-in" 
          style={{ animationDelay: `${index * 50}ms`, opacity: 0 }}
        >
          <DirectoryItemCard 
            item={item} 
            onSelect={onSelectItem} 
            isFavorite={favorites?.has(item.id)}
            onToggleFavorite={onToggleFavorite}
          />
        </div>
      ))}
    </div>
  );
};