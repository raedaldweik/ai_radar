import React, { useEffect, useRef, useContext, useCallback } from 'react';
import { LanguageContext } from '../../i18n/LanguageContext';

declare const google: any;

interface ChartDataItem {
    name: string;
    value: number;
    color: string;
}

interface SourceDistributionChartProps {
    data: ChartDataItem[];
}

export const SourceDistributionChart: React.FC<SourceDistributionChartProps> = ({ data }) => {
    const chartRef = useRef<HTMLDivElement>(null);
    const { t } = useContext(LanguageContext);
    const chartInstance = useRef<any>(null);

    const drawChart = useCallback(() => {
        if (!google || !google.visualization || !chartRef.current) {
            return;
        }

        const chartData = [
            ['Source', 'Distribution'],
            ...data.map(item => [t(`charts.${item.name.replace(/ /g, '')}`), item.value])
        ];

        const dataTable = google.visualization.arrayToDataTable(chartData);

        const options = {
            is3D: true,
            backgroundColor: 'transparent',
            legend: {
                position: 'bottom',
                maxLines: 3,
                textStyle: { color: '#cbd5e1' } // slate-300
            },
            titleTextStyle: {
                color: '#f8fafc' // slate-50
            },
            pieSliceTextStyle: {
                color: '#0f172a' // slate-900
            },
            colors: data.map(item => item.color),
            chartArea: { left: 10, top: 20, width: '90%', height: '60%' },
            pieSliceBorderColor: 'transparent',
            tooltip: {
                textStyle: { color: '#0f172a' } // slate-900
            },
        };

        if (!chartInstance.current) {
            chartInstance.current = new google.visualization.PieChart(chartRef.current);
        }
        
        chartInstance.current.draw(dataTable, options);
    }, [data, t]);

    useEffect(() => {
        const loadAndDraw = () => {
            if (typeof google !== 'undefined' && google.charts) {
                google.charts.load('current', { 'packages': ['corechart'] });
                google.charts.setOnLoadCallback(drawChart);
            }
        };

        if (typeof google !== 'undefined' && google.charts) {
            loadAndDraw();
        } else {
            const script = document.querySelector('script[src="https://www.gstatic.com/charts/loader.js"]');
            if(script) {
                const onLoad = () => {
                    loadAndDraw();
                    script.removeEventListener('load', onLoad);
                };
                script.addEventListener('load', onLoad);
            }
        }
    }, [drawChart]);

    useEffect(() => {
        let timeoutId: ReturnType<typeof setTimeout>;
        const handleResize = () => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                if (chartInstance.current) {
                    drawChart();
                }
            }, 150);
        };

        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
            clearTimeout(timeoutId);
        };
    }, [drawChart]);

    return (
        <div ref={chartRef} className="w-full h-80" />
    );
};