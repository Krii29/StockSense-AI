import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000';

export async function fetchStockData(symbol, market = 'NSE') {
  const cleanSymbol = symbol.trim().toUpperCase();
  const response = await axios.get(`${API_BASE_URL}/stocks/${encodeURIComponent(cleanSymbol)}`, {
    params: { market },
  });
  return response.data;
}
export async function fetchStockHistory(symbol, market = 'NSE', period = '6mo', interval = '1d') {
  const cleanSymbol = symbol.trim().toUpperCase();
  const response = await axios.get(`${API_BASE_URL}/stocks/${encodeURIComponent(cleanSymbol)}/history`, {
    params: { market, period, interval },
  });
  return response.data;
}

export async function fetchStockNews(symbol, market = 'NSE') {
  const cleanSymbol = symbol.trim().toUpperCase();
  const response = await axios.get(`${API_BASE_URL}/stocks/${encodeURIComponent(cleanSymbol)}/news`, {
    params: { market },
  });
  return response.data;
}
export async function fetchStockPrediction(symbol, market = 'NSE', days = 5) {
  const cleanSymbol = symbol.trim().toUpperCase();
  const response = await axios.get(`${API_BASE_URL}/stocks/${encodeURIComponent(cleanSymbol)}/predict`, {
    params: { market, days },
  });
  return response.data;
}
export async function sendChatMessage(
  message,
  symbol = 'RELIANCE',
  market = 'NSE'
) {
  const response = await axios.post(`${API_BASE_URL}/chat`, {
    message,
    symbol,
    market,
  });

  return response.data;
}