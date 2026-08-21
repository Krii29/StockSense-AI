// Simple Moving Average over closing prices.
// Returns points starting once `period` candles are available.
export function calculateSMA(candlesticks, period) {
  if (!candlesticks || candlesticks.length < period) return [];
  const result = [];
  let sum = 0;
  for (let i = 0; i < candlesticks.length; i++) {
    sum += candlesticks[i].close;
    if (i >= period) sum -= candlesticks[i - period].close;
    if (i >= period - 1) {
      result.push({ time: candlesticks[i].time, value: +(sum / period).toFixed(2) });
    }
  }
  return result;
}

// Wilder's RSI (the standard TradingView default), over closing prices.
export function calculateRSI(candlesticks, period = 14) {
  if (!candlesticks || candlesticks.length < period + 1) return [];

  const result = [];
  let gainSum = 0;
  let lossSum = 0;

  for (let i = 1; i <= period; i++) {
    const change = candlesticks[i].close - candlesticks[i - 1].close;
    if (change >= 0) gainSum += change;
    else lossSum -= change;
  }

  let avgGain = gainSum / period;
  let avgLoss = lossSum / period;
  result.push({
    time: candlesticks[period].time,
    value: avgLoss === 0 ? 100 : +(100 - 100 / (1 + avgGain / avgLoss)).toFixed(2),
  });

  for (let i = period + 1; i < candlesticks.length; i++) {
    const change = candlesticks[i].close - candlesticks[i - 1].close;
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? -change : 0;
    // Wilder smoothing
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    result.push({
      time: candlesticks[i].time,
      value: avgLoss === 0 ? 100 : +(100 - 100 / (1 + avgGain / avgLoss)).toFixed(2),
    });
  }

  return result;
}