import { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, CandlestickSeries, HistogramSeries, LineSeries } from 'lightweight-charts';
import { calculateSMA, calculateRSI } from '../../utils/indicators';

export default function StockChart({ data = [], symbol = "NIFTY 50", range = '1M', onRangeChange, indices = [] }) {
  const chartContainerRef = useRef();
  const chartRef = useRef();
  const candlestickSeriesRef = useRef();
  const volumeSeriesRef = useRef();
  const sma20SeriesRef = useRef();
  const sma50SeriesRef = useRef();
  const rsiSeriesRef = useRef();

  const [showSMA, setShowSMA] = useState(true);
  const [showRSI, setShowRSI] = useState(false);

  // Create the chart ONCE when the component mounts
  useEffect(() => {
    if (!chartContainerRef.current) return;

    chartRef.current = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 460,
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#94a3b8',
      },
      grid: {
        vertLines: { color: 'rgba(26, 35, 51, 0.5)' },
        horzLines: { color: 'rgba(26, 35, 51, 0.5)' },
      },
      rightPriceScale: {
        borderColor: '#1a2333',
        scaleMargins: { top: 0.1, bottom: 0.3 }, // leave room at the bottom for volume
      },
      timeScale: {
        borderColor: '#1a2333',
        timeVisible: true,
        secondsVisible: false,
      },
      crosshair: {
        mode: 1, // Magnet mode
        vertLine: { color: '#1eb7ff', width: 0.5, labelBackgroundColor: '#152033' },
        horzLine: { color: '#1eb7ff', width: 0.5, labelBackgroundColor: '#152033' },
      },
    });

    // Candlesticks
    candlestickSeriesRef.current = chartRef.current.addSeries(CandlestickSeries, {
      upColor: '#00c853',
      downColor: '#ff3b3b',
      borderVisible: false,
      wickUpColor: '#00c853',
      wickDownColor: '#ff3b3b',
    });

    // Volume (own bottom pane, doesn't overlap candles)
    volumeSeriesRef.current = chartRef.current.addSeries(HistogramSeries, {
      color: '#1eb7ff88',
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume',
    });
    chartRef.current.priceScale('volume').applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    });

    // SMA overlays (sit on the same price scale as candles)
    sma20SeriesRef.current = chartRef.current.addSeries(LineSeries, {
      color: '#f5a623',
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: false,
      title: 'SMA 20',
    });
    sma50SeriesRef.current = chartRef.current.addSeries(LineSeries, {
      color: '#ab47bc',
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: false,
      title: 'SMA 50',
    });

    // RSI (own bottom pane, hidden until toggled on)
    rsiSeriesRef.current = chartRef.current.addSeries(LineSeries, {
      color: '#1eb7ff',
      lineWidth: 2,
      priceScaleId: 'rsi',
      priceLineVisible: false,
      lastValueVisible: false,
      visible: false,
      title: 'RSI 14',
    });
    chartRef.current.priceScale('rsi').applyOptions({
      scaleMargins: { top: 0.85, bottom: 0 },
      visible: false,
    });
    rsiSeriesRef.current.createPriceLine({ price: 70, color: '#ff3b3b55', lineWidth: 1, lineStyle: 2, axisLabelVisible: true, title: 'Overbought' });
    rsiSeriesRef.current.createPriceLine({ price: 30, color: '#00c85355', lineWidth: 1, lineStyle: 2, axisLabelVisible: true, title: 'Oversold' });

    const handleResize = () => {
      chartRef.current.applyOptions({ width: chartContainerRef.current.clientWidth });
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chartRef.current.remove();
      chartRef.current = null;
    };
  }, []); // empty array = runs once, not on every data change

  // Push new data into the EXISTING chart whenever data changes
  useEffect(() => {
    if (!candlestickSeriesRef.current || !volumeSeriesRef.current) return;
    const candlesticks = data.candlesticks || [];
    candlestickSeriesRef.current.setData(candlesticks);
    volumeSeriesRef.current.setData(data.volume || []);
    sma20SeriesRef.current.setData(calculateSMA(candlesticks, 20));
    sma50SeriesRef.current.setData(calculateSMA(candlesticks, 50));
    rsiSeriesRef.current.setData(calculateRSI(candlesticks, 14));
    chartRef.current.timeScale().fitContent();
  }, [data]);

  // Toggle SMA overlay visibility without recomputing/refetching
  useEffect(() => {
    sma20SeriesRef.current?.applyOptions({ visible: showSMA });
    sma50SeriesRef.current?.applyOptions({ visible: showSMA });
  }, [showSMA]);

  // Toggle RSI pane visibility, reflowing the layout to give/reclaim its space
  useEffect(() => {
    if (!chartRef.current) return;
    rsiSeriesRef.current?.applyOptions({ visible: showRSI });
    chartRef.current.priceScale('rsi').applyOptions({ visible: showRSI });
    if (showRSI) {
      chartRef.current.priceScale('right').applyOptions({ scaleMargins: { top: 0.05, bottom: 0.45 } });
      chartRef.current.priceScale('volume').applyOptions({ scaleMargins: { top: 0.65, bottom: 0.25 } });
      chartRef.current.priceScale('rsi').applyOptions({ scaleMargins: { top: 0.85, bottom: 0 } });
    } else {
      chartRef.current.priceScale('right').applyOptions({ scaleMargins: { top: 0.1, bottom: 0.3 } });
      chartRef.current.priceScale('volume').applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } });
    }
  }, [showRSI]);

  return (
    <div className="bg-[#152033] p-6 rounded-3xl border border-[#1a2333]">
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div>
          <h2 className="text-xl font-semibold text-white">Market Overview</h2>
          <p className="text-xs text-gray-500 uppercase tracking-widest">{symbol}</p>
        </div>
        <div className="flex items-center gap-1.5 p-1 bg-[#0a1221] rounded-xl border border-[#1a2333]">
          {['1D', '1W', '1M', '3M', '1Y', '5Y'].map((item) => (
            <button
              key={item}
              onClick={() => onRangeChange?.(item)}
              className={`px-4 py-2 text-xs font-medium rounded-lg transition-colors ${item === range ? 'bg-[#1eb7ff] text-[#0a1221]' : 'text-gray-400 hover:text-white'}`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {/* Indicator toggles */}
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => setShowSMA(v => !v)}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${showSMA ? 'bg-[#f5a62322] border-[#f5a623] text-[#f5a623]' : 'border-[#1a2333] text-gray-400 hover:text-white'}`}
        >
          <span className="w-2 h-2 rounded-full bg-[#f5a623]" /> SMA 20/50
        </button>
        <button
          onClick={() => setShowRSI(v => !v)}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${showRSI ? 'bg-[#1eb7ff22] border-[#1eb7ff] text-[#1eb7ff]' : 'border-[#1a2333] text-gray-400 hover:text-white'}`}
        >
          <span className="w-2 h-2 rounded-full bg-[#1eb7ff]" /> RSI 14
        </button>
      </div>

      {/* The actual chart container */}
      <div ref={chartContainerRef} className="w-full relative" />

      {/* Real index snapshot from the backend (NIFTY 50 / SENSEX / BANK NIFTY) */}
      <div className="grid grid-cols-3 gap-4 mt-6 border-t border-[#1a2333] pt-6 text-sm">
        {indices.length === 0
          ? [1, 2, 3].map(i => (
              <div key={i} className="flex flex-col gap-1 border-r last:border-r-0 border-[#1a2333] px-3 first:pl-0 last:pr-0 animate-pulse">
                <span className="text-gray-500 text-xs">Loading…</span>
              </div>
            ))
          : indices.map(idx => {
              const isPositive = idx.changePercent >= 0;
              return (
                <div key={idx.name} className="flex flex-col gap-1 border-r last:border-r-0 border-[#1a2333] px-3 first:pl-0 last:pr-0">
                  <span className="text-gray-500 text-xs">{idx.name}</span>
                  <span className="text-base font-medium text-white">{idx.value.toLocaleString()}</span>
                  <span className={`text-xs font-medium ${isPositive ? 'text-[#00c853]' : 'text-[#ff3b3b]'}`}>
                    {isPositive ? '+' : ''}{idx.changePercent.toFixed(2)}%
                  </span>
                </div>
              );
            })}
      </div>
    </div>
  );
}
