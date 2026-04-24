import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { TrendingUp, TrendingDown, RefreshCw, ExternalLink, Activity, Clock, BarChart3 } from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts'
import { getIndices, getMovers, getIndiaNews, getWorldNews, getHistorical, fmt, fmtPct, colorClass } from '../../utils/api'

function IndexCard({ idx, onClick, selected }) {
  const up = (idx.change_pct ?? 0) >= 0
  return (
    <button
      onClick={() => onClick(idx)}
      className={`card text-left w-full transition-all duration-200 ${
        selected?.symbol === idx.symbol ? 'card-glow-green' : ''
      } ${up ? 'hover:card-glow-green' : 'hover:card-glow-red'}`}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-mono font-semibold text-[var(--text-muted)] uppercase tracking-wider">{idx.name}</span>
        <div className={`pulse-dot ${up ? 'bg-[var(--neon-green)] text-[var(--neon-green)]' : 'bg-[var(--neon-red)] text-[var(--neon-red)]'}`} />
      </div>
      <div className="num text-xl font-bold text-white">{fmt(idx.price, 2)}</div>
      <div className={`flex items-center gap-1.5 mt-1 num text-sm font-bold ${up ? 'up' : 'down'}`}>
        {up ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
        {fmtPct(idx.change_pct)}
        <span className="font-normal text-xs opacity-60">({up ? '+' : ''}{fmt(idx.change, 2)})</span>
      </div>
      <div className="flex justify-between mt-2 text-[10px] font-mono text-[var(--text-muted)]">
        <span>H {fmt(idx.high, 2)}</span>
        <span>L {fmt(idx.low, 2)}</span>
      </div>
    </button>
  )
}

function MoverRow({ stock, rank }) {
  const up = (stock.change_pct ?? 0) >= 0
  return (
    <div className="flex items-center gap-3 py-2 group" style={{ borderBottom: '1px solid rgba(28,35,51,0.4)' }}>
      <span className="num text-[10px] text-[var(--text-muted)] w-4">{rank}</span>
      <div className="flex-1 min-w-0">
        <span className="text-xs font-semibold text-[var(--text-primary)] group-hover:text-white transition-colors">
          {stock.symbol.replace('.NS', '').replace('.BO', '')}
        </span>
      </div>
      <span className="num text-xs text-[var(--text-secondary)]">{fmt(stock.price, 2)}</span>
      <span className={`num text-xs font-bold min-w-[60px] text-right ${up ? 'up' : 'down'}`}>
        {fmtPct(stock.change_pct)}
      </span>
    </div>
  )
}

function NewsItem({ article, compact }) {
  return (
    <a
      href={article.link}
      target="_blank"
      rel="noopener noreferrer"
      className="flex gap-3 py-2.5 group transition-colors"
      style={{ borderBottom: '1px solid rgba(28,35,51,0.4)' }}
    >
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-[var(--text-secondary)] leading-snug line-clamp-2 group-hover:text-[var(--text-primary)] transition-colors">
          {article.title}
        </p>
        {!compact && (
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] font-mono text-[var(--neon-blue)]">{article.source}</span>
            <span className="text-[10px] text-[var(--text-muted)]">{article.category}</span>
          </div>
        )}
      </div>
      <ExternalLink className="w-3 h-3 text-[var(--text-muted)] shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
    </a>
  )
}

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="card-glass px-3 py-2">
      <p className="text-[10px] font-mono text-[var(--text-muted)]">{label}</p>
      <p className="num text-sm font-bold text-white">{fmt(payload[0]?.value, 2)}</p>
    </div>
  )
}

export default function Dashboard() {
  const [indices, setIndices] = useState([])
  const [movers, setMovers] = useState({ gainers: [], losers: [] })
  const [indiaNews, setIndiaNews] = useState([])
  const [worldNews, setWorldNews] = useState([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [selectedIndex, setSelectedIndex] = useState(null)
  const [indexChart, setIndexChart] = useState([])
  const [chartLoading, setChartLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    const [idxRes, movRes, inRes, wldRes] = await Promise.allSettled([
      getIndices(), getMovers(), getIndiaNews(15), getWorldNews(10),
    ])
    if (idxRes.status === 'fulfilled') setIndices(idxRes.value.data)
    if (movRes.status === 'fulfilled') setMovers(movRes.value.data)
    if (inRes.status === 'fulfilled') setIndiaNews(inRes.value.data)
    if (wldRes.status === 'fulfilled') setWorldNews(wldRes.value.data)
    setLastUpdated(new Date())
    setLoading(false)
  }

  const selectIndex = async (idx) => {
    setSelectedIndex(idx)
    setChartLoading(true)
    try {
      const r = await getHistorical(idx.symbol, '1mo', '1d')
      setIndexChart(r.data.data)
    } catch (e) {}
    setChartLoading(false)
  }

  useEffect(() => { load() }, [])

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Activity className="w-5 h-5 text-[var(--neon-blue)]" />
          <div>
            <h1 className="text-lg font-bold text-white">Market Overview</h1>
            <div className="flex items-center gap-2 text-[10px] font-mono text-[var(--text-muted)]">
              <Clock className="w-3 h-3" />
              {lastUpdated ? `${lastUpdated.toLocaleTimeString('en-IN')} IST` : 'LOADING...'}
            </div>
          </div>
        </div>
        <button onClick={load} disabled={loading} className="btn-secondary flex items-center gap-2 text-xs">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Indices Grid */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 className="w-3.5 h-3.5 text-[var(--text-muted)]" />
          <h2 className="text-[10px] font-mono font-semibold text-[var(--text-muted)] uppercase tracking-widest">Indian Indices</h2>
        </div>
        {loading && indices.length === 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
            {[...Array(6)].map((_, i) => <div key={i} className="skeleton h-28 rounded-xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
            {indices.map((idx) => (
              <IndexCard key={idx.symbol} idx={idx} onClick={selectIndex} selected={selectedIndex} />
            ))}
          </div>
        )}
      </div>

      {/* Index Chart (shown when an index is selected) */}
      {selectedIndex && (
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <h3 className="text-sm font-bold text-white">{selectedIndex.name}</h3>
              <span className="badge badge-blue">1M</span>
            </div>
            <button className="text-[var(--text-muted)] hover:text-white text-xs" onClick={() => setSelectedIndex(null)}>Close</button>
          </div>
          {chartLoading ? (
            <div className="h-48 flex items-center justify-center"><RefreshCw className="w-5 h-5 animate-spin text-[var(--text-muted)]" /></div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={indexChart}>
                <defs>
                  <linearGradient id="indexGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--neon-blue)" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="var(--neon-blue)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="date" tick={{ fontSize: 9 }} tickFormatter={d => d?.slice(5)} />
                <YAxis tick={{ fontSize: 9 }} domain={['auto', 'auto']} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="close" stroke="var(--neon-blue)" fill="url(#indexGrad)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      )}

      {/* Main Grid: Movers + News */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Gainers */}
        <div className="card">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-3.5 h-3.5 text-[var(--neon-green)]" />
            <h3 className="text-[10px] font-mono font-semibold text-[var(--neon-green)] uppercase tracking-widest">Top Gainers</h3>
          </div>
          {movers.gainers.length === 0 ? (
            <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="skeleton h-8 rounded" />)}</div>
          ) : movers.gainers.map((s, i) => <MoverRow key={s.symbol} stock={s} rank={i + 1} />)}
        </div>

        {/* Losers */}
        <div className="card">
          <div className="flex items-center gap-2 mb-3">
            <TrendingDown className="w-3.5 h-3.5 text-[var(--neon-red)]" />
            <h3 className="text-[10px] font-mono font-semibold text-[var(--neon-red)] uppercase tracking-widest">Top Losers</h3>
          </div>
          {movers.losers.length === 0 ? (
            <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="skeleton h-8 rounded" />)}</div>
          ) : movers.losers.map((s, i) => <MoverRow key={s.symbol} stock={s} rank={i + 1} />)}
        </div>

        {/* India News */}
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[10px] font-mono font-semibold text-[var(--neon-cyan)] uppercase tracking-widest">India Market News</h3>
            <Link to="/news" className="text-[10px] font-mono text-[var(--neon-blue)] hover:underline">ALL NEWS →</Link>
          </div>
          <div className="max-h-[320px] overflow-y-auto pr-1">
            {indiaNews.slice(0, 10).map((a, i) => <NewsItem key={i} article={a} />)}
            {indiaNews.length === 0 && (
              <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="skeleton h-10 rounded" />)}</div>
            )}
          </div>
        </div>
      </div>

      {/* World News */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[10px] font-mono font-semibold text-[var(--neon-amber)] uppercase tracking-widest">Global Finance</h3>
          <Link to="/news" className="text-[10px] font-mono text-[var(--neon-blue)] hover:underline">VIEW ALL →</Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6">
          {worldNews.slice(0, 6).map((a, i) => <NewsItem key={i} article={a} compact />)}
          {worldNews.length === 0 && (
            <div className="col-span-3 space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="skeleton h-10 rounded" />)}</div>
          )}
        </div>
      </div>
    </div>
  )
}
