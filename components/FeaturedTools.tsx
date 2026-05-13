import React, { useContext } from 'react';
import type { DirectoryItem } from '../types';
import { ExternalLinkIcon } from './icons/ExternalLinkIcon';
import { LanguageContext } from '../i18n/LanguageContext';

interface FeaturedItemsProps {
  items: DirectoryItem[];
  onSelect: (item: DirectoryItem) => void;
}

const getWebsiteUrl = (item: DirectoryItem): string => {
    switch (item.category) {
        case 'Startups': return item.details.websiteUrl;
        case 'Research': return item.details.paperUrl;
        case 'Jobs': return item.details.applyUrl;
        case 'News': return item.details.articleUrl;
        case 'Emerging Tech': return item.details.websiteUrl;
        case 'Investments': return item.details.companyUrl;
        case 'Github Repository': return item.details.repoUrl;
        default: return '#';
    }
}

export const FeaturedItems: React.FC<FeaturedItemsProps> = ({ items, onSelect }) => {
  const { t } = useContext(LanguageContext);

  return (
    <section className="mb-16">
      <h2 className="text-3xl sm:text-4xl font-bold text-center text-slate-100 mb-8">{t('directory.featuredTitle')}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {items.map(item => (
          <div
            key={item.id}
            onClick={() => onSelect(item)}
            className="bg-slate-800/70 backdrop-blur-lg rounded-xl overflow-hidden shadow-lg hover:shadow-sky-500/30 transition-all duration-300 ease-in-out transform hover:scale-105 hover:-translate-y-2 cursor-pointer group border border-slate-700/60 hover:border-sky-400/70"
            role="button"
            aria-label={`View details for featured item ${item.title}`}
          >
            <div className="relative overflow-hidden">
              <img className="w-full h-56 object-cover group-hover:scale-110 transition-transform duration-500 ease-in-out" src={item.imageUrl} alt={item.title} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
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
              <p className="text-slate-100 text-base mb-4">{item.description}</p>
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