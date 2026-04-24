import axios from 'axios'

// In production (GitHub Pages), use the Render backend URL
// In development, use Vite's proxy (/api -> localhost:8000)
const API_BASE = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
})

// ─── Stocks ────────────────────────────────────────────────────────────────
export const getIndices = () => api.get('/stocks/indices')
export const searchStocks = (q) => api.get('/stocks/search', { params: { q } })
export const getQuotes = (symbols) => api.get('/stocks/quote', { params: { symbols } })
export const getHistorical = (symbol, period = '1y', interval = '1d') =>
  api.get(`/stocks/historical/${symbol}`, { params: { period, interval } })
export const getEarnings = (symbol) => api.get(`/stocks/earnings/${symbol}`)
export const getEarningsBatch = (symbols) =>
  api.get('/stocks/earnings-batch', { params: { symbols } })
export const getMovers = () => api.get('/stocks/movers')

// ─── Crypto ────────────────────────────────────────────────────────────────
export const getCryptoMarkets = (vs_currency = 'inr', per_page = 20) =>
  api.get('/crypto/markets', { params: { vs_currency, per_page } })
export const getCryptoHistorical = (coin_id, days = 30, vs_currency = 'inr') =>
  api.get(`/crypto/historical/${coin_id}`, { params: { days, vs_currency } })
export const getCoinDetail = (coin_id) => api.get(`/crypto/coin/${coin_id}`)

// ─── Commodities ───────────────────────────────────────────────────────────
export const getCommodities = () => api.get('/commodities/')
export const getCommodityHistorical = (symbol, period = '1y') =>
  api.get(`/commodities/historical/${symbol}`, { params: { period } })

// ─── Portfolio ─────────────────────────────────────────────────────────────
export const uploadPortfolio = (file) => {
  const formData = new FormData()
  formData.append('file', file)
  return api.post('/portfolio/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}
export const getPortfolioHistorical = (symbols, quantities, buy_prices, period = '1y') =>
  api.get('/portfolio/historical-performance', {
    params: { symbols, quantities, buy_prices, period },
  })
export const getForecast = (symbol) => api.get(`/portfolio/forecast/${symbol}`)

// ─── News ──────────────────────────────────────────────────────────────────
export const getIndiaNews = (limit = 20) => api.get('/news/india', { params: { limit } })
export const getWorldNews = (limit = 20) => api.get('/news/world', { params: { limit } })
export const getAllNews = (limit = 30) => api.get('/news/all', { params: { limit } })

// ─── Mutual Funds ──────────────────────────────────────────────────────────
export const searchFunds = (q) => api.get('/mf/search', { params: { q } })
export const getFundNav = (scheme_code, days = 365) =>
  api.get(`/mf/nav/${scheme_code}`, { params: { days } })
export const getFundCategories = () => api.get('/mf/categories')
export const getMFRecommendations = (risk, horizon, goal) =>
  api.get('/mf/recommendations', { params: { risk, horizon, goal } })

// ─── AI Chat ───────────────────────────────────────────────────────────────
export const sendChatMessage = (messages, api_key, context = null) =>
  api.post('/ai/chat', { messages, api_key, context })
export const getSuggestedQuestions = () => api.get('/ai/suggested-questions')

// ─── Helpers ───────────────────────────────────────────────────────────────
export const fmt = (num, decimals = 2) => {
  if (num == null) return '—'
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num)
}

export const fmtCurrency = (num, currency = '₹') => {
  if (num == null) return '—'
  if (Math.abs(num) >= 1e7) return `${currency}${fmt(num / 1e7, 2)}Cr`
  if (Math.abs(num) >= 1e5) return `${currency}${fmt(num / 1e5, 2)}L`
  if (Math.abs(num) >= 1e3) return `${currency}${fmt(num / 1e3, 2)}K`
  return `${currency}${fmt(num)}`
}

export const fmtPct = (num) => {
  if (num == null) return '—'
  const sign = num >= 0 ? '+' : ''
  return `${sign}${num.toFixed(2)}%`
}

export const colorClass = (num) => {
  if (num == null) return 'text-[var(--text-muted)]'
  return num >= 0 ? 'up' : 'down'
}
