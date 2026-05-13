import React, { useState, useContext } from 'react';
import { EmergingTech } from '../types';
import { LanguageContext } from '../i18n/LanguageContext';
import { TrendingUpIcon } from './icons/TrendingUpIcon';
import { FundingIcon } from './icons/FundingIcon';

interface EmergingTechCardProps {
    item: EmergingTech;
}

const TrendLineChart: React.FC<{ data: number[] }> = ({ data }) => {
    const width = 300;
    const height = 48; // Increased height for better visual
    if (!data || data.length < 2) return <div className="w-full h-12 bg-white/5 rounded-md" />;

    const maxVal = Math.max(...data, 100);
    const minVal = 0;
    const range = maxVal > minVal ? maxVal - minVal : 1;

    let pathD = `M 0,${height - (data[0] / range) * height}`;
    for (let i = 0; i < data.length - 1; i++) {
        const x1 = (i / (data.length - 1)) * width;
        const y1 = height - (data[i] / range) * height;
        const x2 = ((i + 1) / (data.length - 1)) * width;
        const y2 = height - (data[i + 1] / range) * height;

        const cx1 = x1 + (x2 - x1) / 2;
        const cy1 = y1;
        const cx2 = x1 + (x2 - x1) / 2;
        const cy2 = y2;
        pathD += ` C ${cx1},${cy1} ${cx2},${cy2} ${x2},${y2}`;
    }

    return (
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-12" preserveAspectRatio="none">
             <defs>
                <linearGradient id="trendGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style={{stopColor: 'rgba(56, 189, 248, 0.2)'}} />
                    <stop offset="100%" style={{stopColor: 'rgba(56, 189, 248, 0)'}} />
                </linearGradient>
            </defs>
            <path d={pathD} fill="none" stroke="#38bdf8" strokeWidth="2" style={{ filter: 'drop-shadow(0 0 4px rgba(56, 189, 248, 0.7))' }}/>
            <path d={`${pathD} L ${width},${height} L 0,${height} Z`} fill="url(#trendGradient)" />
        </svg>
    );
};


type ActiveTab = 'happening' | 'matters' | 'insight';

export const EmergingTechCard: React.FC<EmergingTechCardProps> = ({ item }) => {
    const { t } = useContext(LanguageContext);
    const [activeTab, setActiveTab] = useState<ActiveTab>('happening');

    const renderTabContent = () => {
        const contentClass = "text-slate-100 text-sm animate-fade-in";
        switch (activeTab) {
            case 'happening':
                return <p className={contentClass}>{item.whats_happening}</p>;
            case 'matters':
                return <p className={contentClass}>{item.why_it_matters}</p>;
            case 'insight':
                return (
                    <div className={`${contentClass} italic`}>
                        <p className="border-s-2 border-sky-400 ps-3">
                           "{item.key_insight}"
                        </p>
                    </div>
                );
            default:
                return null;
        }
    };
    
    const TabButton: React.FC<{tab: ActiveTab, label: string}> = ({ tab, label }) => (
        <button
            onClick={() => setActiveTab(tab)}
            className={`flex-1 px-3 py-2 text-xs font-semibold rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-slate-900 ${
                activeTab === tab 
                ? 'bg-sky-500/20 text-sky-300' 
                : 'text-slate-200 hover:bg-white/10 hover:text-white'
            }`}
        >
            {label}
        </button>
    );

    return (
        <div className="bg-slate-900/80 backdrop-blur-2xl rounded-xl shadow-lg hover:shadow-sky-500/20 transition-all duration-300 ease-in-out transform hover:scale-[1.03] hover:-translate-y-1 group border border-white/10 hover:border-sky-400/70 p-6 h-full flex flex-col">
            
            <header className="flex justify-between items-start mb-4">
                <div className="flex-1">
                     <h3 className="text-2xl font-bold text-white group-hover:text-sky-400 transition-colors duration-300">{item.name}</h3>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                        {item.tags.map(tag => (
                            <span key={tag} className="bg-sky-500/10 text-sky-400 text-[10px] font-semibold px-2 py-0.5 rounded">{tag}</span>
                        ))}
                    </div>
                </div>
                <div className="text-end ps-4 flex-shrink-0">
                    <div className="text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-br from-sky-400 to-sky-600 drop-shadow-[0_0_8px_rgba(56,189,248,0.3)]">{item.score}</div>
                    <div className="text-xs font-semibold text-slate-200 tracking-widest mt-1">{t('emergingTech.score')}</div>
                </div>
            </header>

            <section className="my-4 p-4 rounded-lg bg-white/5 border border-white/10">
                <div className="flex justify-between items-center text-xs text-slate-200 mb-2">
                    <span>{t('emergingTech.trendHistory')}</span>
                    <span>12 {t('emergingTech.months')}</span>
                </div>
                <TrendLineChart data={item.trend_history_data} />
                <div className="mt-3 grid grid-cols-3 gap-3 text-center">
                    <div className="flex flex-col items-center justify-center">
                        <span className="flex items-center gap-1 text-sm font-bold text-white">
                            <TrendingUpIcon className="w-4 h-4 text-green-400" />
                            {item.trend_3m}
                        </span>
                        <span className="text-[10px] text-slate-300 uppercase">3M Trend</span>
                    </div>
                    <div className="flex flex-col items-center justify-center">
                        <span className="flex items-center gap-1 text-sm font-bold text-white">
                            <TrendingUpIcon className="w-4 h-4 text-green-400" />
                            {item.trend_12m}
                        </span>
                        <span className="text-[10px] text-slate-300 uppercase">12M Trend</span>
                    </div>
                    <div className="flex flex-col items-center justify-center">
                        <span className="flex items-center gap-1 text-sm font-bold text-white">
                           <FundingIcon className="w-4 h-4 text-teal-400" />
                           {item.funding}
                        </span>
                         <span className="text-[10px] text-slate-300 uppercase">{t('emergingTech.funding')}</span>
                    </div>
                </div>
            </section>

            <section className="mt-auto space-y-3">
                <div className="flex items-center gap-2 bg-slate-800/50 p-1 rounded-lg border border-white/10">
                   <TabButton tab="happening" label={t('emergingTech.whatsHappening')} />
                   <TabButton tab="matters" label={t('emergingTech.whyItMatters')} />
                   <TabButton tab="insight" label={t('emergingTech.keyInsight')} />
                </div>
                <div className="p-3 bg-slate-800/30 rounded-lg min-h-[6.5rem] flex items-center">
                    {renderTabContent()}
                </div>
            </section>
        </div>
    );
};