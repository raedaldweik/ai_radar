import React from 'react';

interface KPIData {
    value: number | string;
    change: string;
    period: string; // Already translated
}

interface KPIProps {
    title: string; // Already translated
    data: KPIData;
}

export const KPI: React.FC<KPIProps> = ({ title, data }) => {
    const isPositive = data.change.startsWith('+');

    return (
        <div className="bg-white/5 backdrop-blur-lg p-6 rounded-xl shadow-lg border border-white/10">
            <h4 className="text-sm font-medium text-slate-400 uppercase tracking-wider">{title}</h4>
            <div className="mt-2 flex items-baseline justify-between">
                <p className="text-3xl font-bold text-slate-100">{data.value}</p>
                <span className={`text-sm font-semibold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                    {data.change}
                </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">{data.period}</p>
        </div>
    );
}