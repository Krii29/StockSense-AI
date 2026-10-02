import { useEffect, useRef } from 'react';
import { createChart, CandlestickSeries } from 'lightweight-charts';
import { fetchStockHistory } from '../../services/api';

export default function StockChart({ symbol, market }) {
  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height: 320,
      layout: { background: { color: 'transparent' }, textColor: '#94a3b8' },
      grid: {
        vertLines: { color: 'rgba(148,163,184,0.08)' },
        horzLines: { color: 'rgba(148,163,184,0.08)' },
      },
      timeScale: { borderColor: 'rgba(148,163,184,0.2)' },
      rightPriceScale: { borderColor: 'rgba(148,163,184,0.2)' },
    });

    const series = chart.addSeries(CandlestickSeries, {
      upColor: '#34d399',
      downColor: '#fb7185',
      borderVisible: false,
      wickUpColor: '#34d399',
      wickDownColor: '#fb7185',
    });

    chartRef.current = chart;
    seriesRef.current = series;

    const handleResize = () => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth });
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadHistory = async () => {
      try {
        const data = await fetchStockHistory(symbol, market, '6mo', '1d');
        if (cancelled || !seriesRef.current) return;
        const candles = data.candles.map((c) => ({
          time: c.time,
          open: c.open,
          high: c.high,
          low: c.low,
          close: c.close,
        }));
        seriesRef.current.setData(candles);
        chartRef.current?.timeScale().fitContent();
      } catch {
        // silently ignore — no history available for this symbol
      }
    };

    if (symbol) loadHistory();
    return () => {
      cancelled = true;
    };
  }, [symbol, market]);

  return (
    <div className="p-6 bg-slate-900/80 border border-cyan-400/15 rounded-2xl shadow-lg shadow-slate-950/20">
      <h3 className="font-bold text-white flex items-center gap-2 mb-4">
        <span>📉</span> Price History (6 months)
      </h3>
      <div ref={containerRef} className="w-full" />
    </div>
  );
}