import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000';

export async function fetchStockData(symbol, market = 'NSE') {
  const cleanSymbol = symbol.trim().toUpperCase();
  const response = await axios.get(`${API_BASE_URL}/stocks/${encodeURIComponent(cleanSymbol)}`, {
    params: { market },
  });
  return response.data;
}
