
import React, { useState, useEffect, useContext } from 'react';
import { EmergingTech } from '../types';
import { LanguageContext } from '../i18n/LanguageContext';
import { parseEmergingTechCsv } from '../services/csv-parser';
import { EmergingTechCard } from './EmergingTechCard';
import { NetworkBackground } from './NetworkBackground';

export const EmergingTechPage: React.FC = () => {
    const [techItems, setTechItems] = useState<EmergingTech[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { lang, t } = useContext(LanguageContext);

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            try {
                const items = await parseEmergingTechCsv(lang);
                setTechItems(items);
            } catch (error) {
                console.error("Failed to load emerging tech data:", error);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, [lang]);

    return (
        <>
            <NetworkBackground />
            <div className="relative container mx-auto px-4 py-8">
                <header className="py-12 text-center">
                    <h1 className="text-5xl md:text-7xl font-extrabold text-slate-100 mb-4" style={{ textShadow: '0 0 20px rgba(56, 189, 248, 0.3)' }}>
                        {t('emergingTech.headerTitle')}
                    </h1>
                    <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto">
                        {t('emergingTech.headerSubtitle')}
                    </p>
                </header>
                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {isLoading ? (
                        <div className="text-center py-16">
                            <h3 className="text-2xl font-semibold text-white mb-2">{t('emergingTech.loading')}</h3>
                            <p className="text-slate-400">{t('emergingTech.loadingMessage')}</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {techItems.map((item, index) => (
                                 <div 
                                    key={item.id} 
                                    className="animate-fade-in" 
                                    style={{ animationDelay: `${index * 50}ms`, opacity: 0 }}
                                >
                                    <EmergingTechCard item={item} />
                                </div>
                            ))}
                        </div>
                    )}
                </main>
            </div>
        </>
    );
};