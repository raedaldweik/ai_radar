import React, { useContext, useState, useRef, useEffect, useMemo } from 'react';
import { LanguageContext } from '../../i18n/LanguageContext';

interface Series {
  name: string;
  data: number[];
}

interface AITrendsChartProps {
  data: {
    labels: string[];
    series: Series[];
  };
}

const colors = ['#38bdf8', '#9B5DE5'];
const gradientColors = ['#38bdf8', '#9B5DE5'];

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

export const AITrendsChart: React.FC<AITrendsChartProps> = ({ data }) => {
  const { t } = useContext(LanguageContext);
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [animatedIndex, setAnimatedIndex] = useState<number>(0);
  const [isAnimating, setIsAnimating] = useState<boolean>(true);

  const cumulativeSeries = useMemo(() => {
    return data.series.map(s => {
        return s.data.reduce((acc, value) => {
            const lastValue = acc.length > 0 ? acc[acc.length - 1] : 0;
            acc.push(lastValue + value);
            return acc;
        }, [] as number[]);
    });
  }, [data.series]);

  const currentIndex = hoveredIndex ?? animatedIndex;
  
  // Create animated counters for each series
  const animatedCounts = data.series.map((_, i) => {
      const target = cumulativeSeries[i][currentIndex] || 0;
      // eslint-disable-next-line react-hooks/rules-of-hooks
      return useAnimatedCounter(target, isAnimating ? 800 : 300);
  });

  useEffect(() => {
    if (!isAnimating) return;
    const animationInterval = setInterval(() => {
        setAnimatedIndex(prevIndex => (prevIndex + 1) % data.labels.length);
    }, 2500);
    return () => clearInterval(animationInterval);
  }, [isAnimating, data.labels.length]);

  const width = 800;
  const height = 320;
  const margin = { top: 20, right: 20, bottom: 50, left: 40 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const allValues = data.series.flatMap(s => s.data);
  const maxY = Math.max(...allValues, 0);
  const yAxisMax = Math.ceil(maxY / 10) * 10;

  const xScale = (index: number) => margin.left + (index / (data.labels.length - 1)) * innerWidth;
  const yScale = (value: number) => margin.top + innerHeight - (value / yAxisMax) * innerHeight;
  
  const yAxisLabels = Array.from({ length: 6 }, (_, i) => Math.round(yAxisMax / 5 * i));

  const createPath = (seriesData: number[]) => {
    return seriesData
      .map((value, i) => `${i === 0 ? 'M' : 'L'} ${xScale(i)} ${yScale(value)}`)
      .join(' ');
  };
  
  const createAreaPath = (seriesData: number[]) => {
    const linePath = createPath(seriesData);
    return `${linePath} L ${xScale(seriesData.length - 1)} ${height - margin.bottom} L ${xScale(0)} ${height - margin.bottom} Z`;
  };

  const handleMouseMove = (event: React.MouseEvent<SVGSVGElement>) => {
    setIsAnimating(false);
    if (!svgRef.current) return;
    const svg = svgRef.current;
    const point = svg.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    
    const { x: svgX } = point.matrixTransform(svg.getScreenCTM()?.inverse());

    const indexRatio = (svgX - margin.left) / innerWidth;
    let index = Math.round(indexRatio * (data.labels.length - 1));
    index = Math.max(0, Math.min(data.labels.length - 1, index));

    if (svgX >= margin.left && svgX <= width - margin.right) {
      setHoveredIndex(index);
    } else {
      setHoveredIndex(null);
    }
  };

  const handleMouseLeave = () => {
    setIsAnimating(true);
    setHoveredIndex(null);
  };
  
  const renderTooltip = () => {
    if (hoveredIndex === null) return null;

    const xPos = xScale(hoveredIndex);
    const tooltipWidth = 160;
    const tooltipHeight = 60;
    const tooltipPadding = 10;
    
    let finalX = xPos + 20;
    if (finalX + tooltipWidth > width - margin.right) {
      finalX = xPos - tooltipWidth - 20;
    }

    const yPoints = data.series.map(s => yScale(s.data[hoveredIndex]));
    const highestY = Math.min(...yPoints);
    let finalY = highestY - tooltipHeight - 15;
    
    if (finalY < margin.top) {
      finalY = margin.top + 5;
    }

    return (
        <g transform={`translate(${finalX}, ${finalY})`} className="pointer-events-none transition-transform duration-100 ease-out">
            <rect
                width={tooltipWidth}
                height={tooltipHeight}
                rx="6"
                ry="6"
                fill="rgba(30, 41, 59, 0.7)"
                stroke="rgba(255, 255, 255, 0.1)"
                strokeWidth="1"
            />
            <text x={tooltipPadding} y={tooltipPadding + 12} fontSize="12" fill="#e2e8f0" fontWeight="bold" className="fill-slate-200">
                {data.labels[hoveredIndex]}
            </text>
            {data.series.map((series, i) => (
                <g key={series.name} transform={`translate(${tooltipPadding}, ${tooltipPadding + 16 + (i + 1) * 14})`}>
                    <circle r="4" fill={colors[i % colors.length]} style={{ filter: `drop-shadow(0 0 3px ${colors[i % colors.length]})` }} />
                    <text x="10" y="4" fontSize="12" fill="white">
                        {`${t(`charts.${series.name.replace(/ /g, '')}`)}: `}
                        <tspan fontWeight="bold">{series.data[hoveredIndex]}</tspan>
                    </text>
                </g>
            ))}
        </g>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-start mb-4 flex-shrink-0">
        <div>
            <h3 className="text-xl font-bold text-slate-100">{t('dashboard.aiTrendsTitle')}</h3>
            <div className="mt-2 h-px w-16 bg-sky-400/80"></div>
        </div>
        <div className="flex gap-6">
            {data.series.map((series, i) => (
                <div key={series.name} className="flex flex-col items-center">
                    <div className="text-xs font-medium text-slate-400 uppercase tracking-wider whitespace-nowrap">
                        {t('charts.cumulative')} {t(`charts.${series.name.replace(/ /g, '')}`)}
                    </div>
                    <div className="flex items-baseline justify-center gap-2 mt-1">
                        <span className="text-2xl font-extrabold text-white tabular-nums" style={{ textShadow: `0 0 10px ${colors[i % colors.length]}40`, color: colors[i % colors.length] }}>
                            {animatedCounts[i]}
                        </span>
                        <span className="text-sm font-medium text-slate-400">
                            {data.labels[currentIndex]}
                        </span>
                    </div>
                </div>
            ))}
        </div>
      </div>

      <div className="flex-grow relative w-full min-h-[320px]">
        <svg
            ref={svgRef}
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-full cursor-crosshair absolute top-0 left-0"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
        >
            <defs>
            {data.series.map((series, i) => (
                <linearGradient key={series.name} id={`gradient-${i}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={gradientColors[i % gradientColors.length]} stopOpacity={0.4} />
                <stop offset="100%" stopColor={gradientColors[i % gradientColors.length]} stopOpacity={0} />
                </linearGradient>
            ))}
            </defs>
            <style>{`
            .line-path, .area-path {
                animation: dash 1.5s ease-out forwards;
            }
            .line-path {
                stroke-dasharray: 1000;
                stroke-dashoffset: 1000;
            }
            .area-path {
                opacity: 0;
                animation: fadein 1.5s ease-out forwards;
            }
            @keyframes dash {
                to { stroke-dashoffset: 0; }
            }
            @keyframes fadein {
                to { opacity: 1; }
            }
            `}</style>

            {yAxisLabels.map(label => (
            <g key={label}>
                <line 
                x1={margin.left} 
                x2={width - margin.right} 
                y1={yScale(label)} 
                y2={yScale(label)} 
                stroke="rgba(255, 255, 255, 0.1)" 
                strokeWidth="0.5" 
                strokeDasharray="2,5"
                />
                <text x={margin.left - 8} y={yScale(label) + 4} textAnchor="end" fontSize="12" fill="rgba(255, 255, 255, 0.4)">
                {label}
                </text>
            </g>
            ))}
            
            {data.labels.map((label, i) => (
            <text key={label} x={xScale(i)} y={height - margin.bottom + 15} textAnchor="middle" fontSize="12" fill="rgba(255, 255, 255, 0.4)">
                {label}
            </text>
            ))}

            {data.series.map((series, i) => (
            <g key={series.name}>
                <path
                d={createAreaPath(series.data)}
                fill={`url(#gradient-${i})`}
                className="area-path"
                style={{ animationDelay: `${i * 0.2}s` }}
                />
                <path
                d={createPath(series.data)}
                fill="none"
                stroke={colors[i % colors.length]}
                strokeWidth="3"
                className="line-path"
                style={{ animationDelay: `${i * 0.2}s`, filter: `drop-shadow(0 0 4px ${colors[i % colors.length]})` }}
                />
                {/* Highlight current segment */}
                {currentIndex > 0 && (
                     <path
                     d={`M ${xScale(currentIndex - 1)} ${yScale(series.data[currentIndex - 1])} L ${xScale(currentIndex)} ${yScale(series.data[currentIndex])}`}
                     fill="none"
                     stroke={colors[i % colors.length]}
                     strokeWidth="8"
                     strokeLinecap="round"
                     style={{ filter: `drop-shadow(0 0 12px ${colors[i % colors.length]})`, opacity: 1 }}
                   />
                )}
            </g>
            ))}

            <g transform={`translate(${margin.left}, ${height - margin.bottom + 30})`}>
            {data.series.map((series, i) => (
                <g key={series.name} transform={`translate(${i * 180}, 0)`}>
                <rect x="0" y="-10" width="12" height="12" fill={colors[i % colors.length]} rx="2" style={{ filter: `drop-shadow(0 0 5px ${colors[i % colors.length]})` }} />
                <text x="20" y="0" fill="white" fontSize="14">{t(`charts.${series.name.replace(/ /g, '')}`)}</text>
                </g>
            ))}
            </g>
            
            {hoveredIndex !== null && (
                <g className="pointer-events-none">
                    <line
                    x1={xScale(hoveredIndex)}
                    y1={margin.top}
                    x2={xScale(hoveredIndex)}
                    y2={height - margin.bottom}
                    stroke="rgba(129, 207, 255, 0.5)"
                    strokeWidth="1"
                    strokeDasharray="3,3"
                    />
                    {data.series.map((series, i) => (
                    <circle
                        key={`dot-${i}`}
                        cx={xScale(hoveredIndex)}
                        cy={yScale(series.data[hoveredIndex])}
                        r="4"
                        fill={colors[i % colors.length]}
                        stroke="#0f172a"
                        strokeWidth="2"
                    />
                    ))}
                </g>
            )}
            
            {renderTooltip()}
        </svg>
      </div>
    </div>
  );
};
