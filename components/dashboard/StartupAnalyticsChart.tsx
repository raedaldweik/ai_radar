import React, { useContext, useState, useRef, useEffect, useMemo } from 'react';
import { LanguageContext } from '../../i18n/LanguageContext';

interface ChartData {
  labels: string[];
  values: number[];
}

interface StartupAnalyticsChartProps {
  data: ChartData;
}

const useAnimatedCounter = (target: number, duration = 800) => {
    const [count, setCount] = useState(target);
    const previousTargetRef = useRef(target);
    const frameRef = useRef<number | null>(null);

    useEffect(() => {
        const previousTarget = previousTargetRef.current;
        if (previousTarget === target && count === target) {
            return;
        }

        let startTimestamp: number | null = null;
        const step = (timestamp: number) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = timestamp - startTimestamp;
            const percentage = Math.min(progress / duration, 1);
            
            const newCount = Math.round(previousTarget + (target - previousTarget) * percentage);
            setCount(newCount);

            if (progress < duration) {
                frameRef.current = requestAnimationFrame(step);
            } else {
                previousTargetRef.current = target;
                if(count !== target) setCount(target);
            }
        };

        if (frameRef.current) {
            cancelAnimationFrame(frameRef.current);
        }
        frameRef.current = requestAnimationFrame(step);

        return () => {
            if (frameRef.current) {
                cancelAnimationFrame(frameRef.current);
            }
            previousTargetRef.current = target;
        };
    }, [target, duration, count]);

    return count;
};

const Bar: React.FC<{ x: number, y: number, width: number, height: number, isHighlighted: boolean }> = ({ x, y, width, height, isHighlighted }) => {
  const perspective = 6;
  
  const baseColor = 'rgba(56, 189, 248, 0.7)'; // sky-400
  const sideColor = 'rgba(14, 165, 233, 0.7)'; // sky-500
  const topColor = 'rgba(125, 211, 252, 0.7)'; // sky-300
  const strokeColor = 'rgba(15, 23, 42, 0.3)';

  const highlightColor = 'rgba(125, 211, 252, 0.95)';
  const highlightSideColor = 'rgba(56, 189, 248, 0.95)';
  const highlightTopColor = 'rgba(224, 242, 254, 0.95)';

  const finalFrontColor = isHighlighted ? highlightColor : baseColor;
  const finalSideColor = isHighlighted ? highlightSideColor : sideColor;
  const finalTopColor = isHighlighted ? highlightTopColor : topColor;
  const finalGlowColor = isHighlighted ? highlightColor.replace('0.95', '1') : 'transparent';

  const frontPath = `M ${x},${y + height} L ${x},${y} L ${x + width},${y} L ${x + width},${y + height} Z`;
  const topPath = `M ${x},${y} L ${x + perspective},${y - perspective} L ${x + width + perspective},${y - perspective} L ${x + width},${y} Z`;
  const sidePath = `M ${x + width},${y + height} L ${x + width},${y} L ${x + width + perspective},${y - perspective} L ${x + width + perspective},${y + height - perspective} Z`;
  
  return (
    <g 
      style={{
        transition: 'all 0.3s ease-out',
        filter: isHighlighted ? `drop-shadow(0 0 12px ${finalGlowColor})` : 'none',
      }}
    >
      {height > 0 && <path d={topPath} fill={finalTopColor} stroke={strokeColor} strokeWidth="0.5" />}
      <path d={sidePath} fill={finalSideColor} stroke={strokeColor} strokeWidth="0.5" />
      <path d={frontPath} fill={finalFrontColor} stroke={strokeColor} strokeWidth="0.5" />
    </g>
  );
};

export const StartupAnalyticsChart: React.FC<StartupAnalyticsChartProps> = ({ data }) => {
  const { t } = useContext(LanguageContext);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [animatedIndex, setAnimatedIndex] = useState<number>(0);
  const [isAnimating, setIsAnimating] = useState<boolean>(true);

  const cumulativeValues = useMemo(() => {
    return data.values.reduce((acc, value) => {
      const lastValue = acc.length > 0 ? acc[acc.length - 1] : 0;
      acc.push(lastValue + value);
      return acc;
    }, [] as number[]);
  }, [data.values]);
  
  const currentIndex = hoveredIndex ?? animatedIndex;
  const targetCount = cumulativeValues[currentIndex] || 0;
  const animatedCount = useAnimatedCounter(targetCount, isAnimating ? 800 : 300);

  useEffect(() => {
    if (!isAnimating) return;
    const animationInterval = setInterval(() => {
        setAnimatedIndex(prevIndex => (prevIndex + 1) % data.labels.length);
    }, 2500);
    return () => clearInterval(animationInterval);
  }, [isAnimating, data.labels.length]);

  const svgWidth = 800;
  const svgHeight = 320;
  const margin = { top: 20, right: 10, bottom: 30, left: 50 };
  const innerWidth = svgWidth - margin.left - margin.right;
  const innerHeight = svgHeight - margin.top - margin.bottom;

  const maxValue = Math.ceil(Math.max(...data.values, 0) / 50) * 50;
  const yScale = (value: number) => innerHeight - (value / maxValue) * innerHeight;
  const barWidth = innerWidth / data.labels.length * 0.6;
  const barSpacing = innerWidth / data.labels.length * 0.4;

  const yAxisTicks = 5;
  const yAxisLabels = Array.from({ length: yAxisTicks + 1 }, (_, i) => {
      const value = Math.round((maxValue / yAxisTicks) * i);
      const yPos = yScale(value);
      return (
          <g key={i} transform={`translate(0, ${yPos})`}>
              <line x1="-5" y1="0" x2={innerWidth} y2="0" stroke="rgba(255, 255, 255, 0.1)" strokeWidth="0.5" />
              <text x="-10" y="4" textAnchor="end" fontSize="12" fill="rgba(255, 255, 255, 0.5)">
                  {value}
              </text>
          </g>
      );
  });

  return (
     <div 
      className="h-full flex flex-col"
      onMouseLeave={() => { setIsAnimating(true); setHoveredIndex(null); }}
     >
        <div className="flex justify-between items-start mb-4 flex-shrink-0">
            <div>
                <h3 className="text-xl font-bold text-slate-100">{t('dashboard.startupAnalyticsTitle')}</h3>
                <div className="mt-2 h-px w-16 bg-sky-400/80"></div>
            </div>
            <div className="flex flex-col items-center">
                <div className="text-lg font-medium text-white uppercase tracking-wider whitespace-nowrap">
                    {t('charts.cumulativeStartupsCreated')}
                </div>
                <div className="flex items-baseline justify-center gap-2 mt-1">
                    <span className="text-4xl font-extrabold text-white tabular-nums" style={{ textShadow: '0 0 10px rgba(255,255,255,0.3)' }}>
                        {animatedCount}
                    </span>
                    <span className="text-lg font-medium text-slate-300">
                        {data.labels[currentIndex]}
                    </span>
                </div>
            </div>
        </div>
        
        <div className="flex-grow relative w-full">
            <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="absolute top-0 left-0 w-full h-full" preserveAspectRatio="xMidYMid meet">
                <g transform={`translate(${margin.left}, ${margin.top})`}>
                    {yAxisLabels}
                    {data.values.map((value, i) => {
                        const x = i * (barWidth + barSpacing) + barSpacing / 2;
                        const y = yScale(value);
                        const barHeight = innerHeight - y;
                        const isHighlighted = i === currentIndex;
                        return (
                            <g 
                              key={i}
                              onMouseEnter={() => { setIsAnimating(false); setHoveredIndex(i); }}
                              style={{ cursor: 'pointer' }}
                            >
                              <Bar 
                                  x={x}
                                  y={y}
                                  width={barWidth}
                                  height={barHeight < 0 ? 0 : barHeight}
                                  isHighlighted={isHighlighted}
                               />
                               <text 
                                  x={x + barWidth / 2} 
                                  y={innerHeight + 20} 
                                  textAnchor="middle" 
                                  fontSize="12" 
                                  fill={isHighlighted ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.5)'}
                                  fontWeight={isHighlighted ? 'bold' : 'normal'}
                               >
                                  {data.labels[i]}
                               </text>
                            </g>
                        );
                    })}
                </g>
            </svg>
        </div>
     </div>
  );
};