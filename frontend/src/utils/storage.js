const KEYS = {
  WATCHLIST: 'stocksense_watchlist',
  PORTFOLIO: 'stocksense_portfolio',
  ALERTS: 'stocksense_alerts',
};

function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

// Watchlist: array of { id, symbol, market }
export function getWatchlist() {
  return load(KEYS.WATCHLIST, []);
}
export function saveWatchlist(list) {
  save(KEYS.WATCHLIST, list);
}

// Portfolio: array of { id, symbol, market, qty, buyPrice, buyDate }
export function getPortfolio() {
  return load(KEYS.PORTFOLIO, []);
}
export function savePortfolio(list) {
  save(KEYS.PORTFOLIO, list);
}

// Alerts: array of { id, symbol, market, condition, targetPrice, triggered }
export function getAlerts() {
  return load(KEYS.ALERTS, []);
}
export function saveAlerts(list) {
  save(KEYS.ALERTS, list);
}

export function newId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}