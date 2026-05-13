import React from 'react';
import { TechItem, IconName } from '../../types';
import { ChipIcon } from '../icons/ChipIcon';
import { CodeIcon } from '../icons/CodeIcon';
import { LightBulbIcon } from '../icons/LightBulbIcon';

interface EmergingTechGridProps {
    items: TechItem[];
    onTechClick: (item: TechItem) => void;
}

const iconMap: Record<IconName, React.FC<{className?: string}>> = {
    ChipIcon,
    CodeIcon,
    LightBulbIcon,
};

export const EmergingTechGrid: React.FC<EmergingTechGridProps> = ({ items, onTechClick }) => {
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {items.map(item => {
                const IconComponent = iconMap[item.icon];
                return (
                    <button 
                        key={item.name} 
                        onClick={() => onTechClick(item)}
                        className="bg-white/10 backdrop-blur-md border border-white/10 p-4 rounded-xl group transition-colors flex flex-col items-center text-center cursor-pointer focus:outline-none focus:ring-2 focus:ring-sky-500 hover:bg-sky-400/20"
                    >
                        <div className="bg-white/5 group-hover:bg-white/10 transition-colors p-3 rounded-full mb-3">
                            <IconComponent className="w-6 h-6 text-sky-400 drop-shadow-[0_0_4px_rgba(56,189,248,0.7)]" />
                        </div>
                        <h5 className="font-bold text-md text-slate-100 mb-1">{item.name}</h5>
                        <p className="text-slate-400 text-xs flex-grow">{item.description.substring(0, 60)}...</p>
                    </button>
                )
            })}
        </div>
    );
};