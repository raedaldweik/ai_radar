import React, { useContext } from 'react';
import { Category } from '../types';
import { LanguageContext } from '../i18n/LanguageContext';

interface CategoryFilterProps {
  categories: Category[];
  selectedCategory: Category;
  onSelectCategory: (category: Category) => void;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
}) => {
  const { t } = useContext(LanguageContext);
  
  return (
    <div className="flex flex-wrap justify-center gap-2 sm:gap-4 my-8">
      {categories.map((category) => (
        <button
          key={category}
          onClick={() => onSelectCategory(category)}
          className={`px-4 py-2 text-sm sm:text-base font-medium rounded-full transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-slate-900 ${
            selectedCategory === category
              ? 'bg-sky-600 text-white shadow-[0_0_15px_rgba(56,189,248,0.5)]'
              : 'bg-white/5 backdrop-blur-lg text-slate-300 hover:bg-white/10 border border-white/10'
          }`}
        >
          {t(`categories.${category.replace(' ', '')}`)}
        </button>
      ))}
    </div>
  );
};