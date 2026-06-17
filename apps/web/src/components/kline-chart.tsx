'use client';

import { useEffect, useRef } from 'react';
import { createChart, CandlestickSeries, type IChartApi, type UTCTimestamp } from 'lightweight-charts';
import { apiClient } from '@/lib/api-client';
import type { Kline } from '@exchange/shared';

export const KlineChart = ({ symbol, interval }: { symbol: string; interval: string }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height: 320,
      layout: { background: { color: '#1e2329' }, textColor: '#eaecef' },
      grid: { vertLines: { color: '#2b3139' }, horzLines: { color: '#2b3139' } },
    });
    const series = chart.addSeries(CandlestickSeries, {
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderVisible: false,
      wickUpColor: '#22c55e',
      wickDownColor: '#ef4444',
    });
    chartRef.current = chart;

    const load = async () => {
      const klines = await apiClient<Kline[]>(
        `/markets/${symbol}/klines?interval=${interval}&limit=100`,
      );
      series.setData(
        klines.map((k) => ({
          time: Math.floor(k.openTime / 1000) as UTCTimestamp,
          open: parseFloat(k.open),
          high: parseFloat(k.high),
          low: parseFloat(k.low),
          close: parseFloat(k.close),
        })),
      );
    };
    load();

    const handleResize = () => {
      if (containerRef.current) chart.applyOptions({ width: containerRef.current.clientWidth });
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [symbol, interval]);

  return <div ref={containerRef} className="w-full" />;
};
