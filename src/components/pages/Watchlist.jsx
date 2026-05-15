import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { Star, Plus, Trash2, TrendingUp, TrendingDown, Search, X } from 'lucide-react'
import { searchStocks, getQuotes, fmt } from '../../utils/api'

export default function Watchlist() {
  const { user, isConfigured } = useAuth()
  const navigate = useNavigate()
  const [watchlist, setWatchlist] = useState([])
  const [quotes, setQuotes] = useState([])
  const [search, setSearch] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [showAdd, setShowAdd] = useState(false)

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('finbot_watchlist') || '[]')
    setWatchlist(saved.length ? saved : ['RELIANCE.NS', 'TCS.NS', 'INFY.NS', 'HDFCBANK.NS', 'SBIN.NS'])
  }, [])

  useEffect(() => {
    if (!watchlist.length) return
    const symbols = watchlist.join(',')
    getQuotes(symbols).then(res => setQuotes(res.data || [])).catch(() => {})
    const interval = setInterval(() => {
      getQuotes(symbols).then(res => setQuotes(res.data || [])).catch(() => {})
    }, 60000)
    return () => clearInterval(interval)
  }, [watchlist])

  const saveWatchlist = (list) => {
    setWatchlist(list)
    localStorage.setItem('finbot_watchlist', JSON.stringify(list))
  }

  const addSymbol = (sym) => {
    if (!watchlist.includes(sym)) saveWatchlist([...watchlist, sym])
    setShowAdd(false); setSearch(''); setResults([])
  }
  const removeSymbol = (sym) => saveWatchlist(watchlist.filter(s => s !== sym))

  const handleSearch = async (q) => {
    setSearch(q)
    if (q.length < 2) { setResults([]); return }
    setSearching(true)
    try { const res = await searchStocks(q); setResults(res.data || []) } catch { setResults([]) }
    setSearching(false)
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500" /> My Watchlist
          </h1>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{watchlist.length} stocks tracked</p>
        </div>
        <button onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors">
          <Plus className="w-4 h-4" /> Add Stock
        </button>
      </div>

      {showAdd && (
        <div className="mb-4 p-4 rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input type="text" placeholder="Search stocks... (e.g., RELIANCE, TCS)" value={search} onChange={e => handleSearch(e.target.value)} autoFocus
              className="w-full pl-10 pr-10 py-2.5 rounded-lg text-sm text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-emerald-500/50"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }} />
            <button onClick={() => { setShowAdd(false); setSearch(''); setResults([]) }} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
          {results.length > 0 && (
            <div className="mt-2 space-y-1">
              {results.map(r => (
                <button key={r.symbol} onClick={() => addSymbol(r.symbol)}
                  className="w-full flex items-center justify-between p-2.5 rounded-lg text-sm hover:bg-white/5 transition-colors">
                  <span className="text-white font-medium">{r.symbol}</span>
                  <span className="text-emerald-500 text-xs">+ Add</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="rounded-xl overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>
          <span>Symbol</span><span className="text-right">Price</span><span className="text-right">Change</span><span className="text-right">%</span><span></span>
        </div>
        {watchlist.map(sym => {
          const q = quotes.find(q => q.symbol === sym) || {}
          const isUp = (q.change_pct || 0) >= 0
          return (
            <div key={sym} className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 items-center px-4 py-3 hover:bg-white/5 transition-colors" style={{ borderBottom: '1px solid var(--border)' }}>
              <span className="text-sm font-semibold text-white">{sym.replace('.NS', '').replace('.BO', '')}</span>
              <span className="text-sm text-white text-right font-mono">{q.price ? fmt(q.price) : '—'}</span>
              <span className={`text-xs text-right font-mono ${isUp ? 'text-emerald-400' : 'text-red-400'}`}>
                {q.change != null ? (isUp ? '+' : '') + fmt(q.change) : '—'}
              </span>
              <span className={`text-xs text-right font-mono flex items-center gap-1 ${isUp ? 'text-emerald-400' : 'text-red-400'}`}>
                {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {q.change_pct != null ? fmt(q.change_pct) + '%' : '—'}
              </span>
              <button onClick={() => removeSymbol(sym)} className="p-1 rounded hover:bg-red-500/20 text-gray-500 hover:text-red-400 transition-colors">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
              }
