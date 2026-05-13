import React, { useContext } from 'react';
import { TrendingUpIcon } from '../icons/TrendingUpIcon';
import type { JobRole } from '../../types';
import { LanguageContext } from '../../i18n/LanguageContext';

interface JobMarketGridProps {
    data: { topRoles: JobRole[] };
    onRoleClick: (role: JobRole) => void;
}

export const JobMarketGrid: React.FC<JobMarketGridProps> = ({ data, onRoleClick }) => {
    const { t } = useContext(LanguageContext);
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {data.topRoles.map(item => (
                <button 
                    key={item.role} 
                    onClick={() => onRoleClick(item)}
                    className="bg-white/5 backdrop-blur-lg p-4 rounded-xl shadow-lg border border-white/10 hover:border-sky-400 transition-colors text-start flex flex-col focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                    <h5 className="font-bold text-md text-slate-100">{item.role}</h5>
                    <p className="text-sky-400 font-mono text-lg my-1">{item.salary}</p>
                    <div className="mt-auto">
                        <p className="flex items-center gap-1 text-green-400 text-sm font-semibold">
                            <TrendingUpIcon className="w-4 h-4" />
                            {item.growth} {t('dashboard.postings')}
                        </p>
                        <p className="text-xs text-slate-500">{t('kpi.vsLastMonth')}</p>
                    </div>
                </button>
            ))}
        </div>
    );
};