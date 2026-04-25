import { useState, useEffect, useCallback } from 'react'
import { Search, TrendingUp, TrendingDown, RefreshCw, BarChart3 } from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, ComposedChart, LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts'
import {
  searchStocks, getHistorical, getQuotes,
  getCryptoMarkets, getCryptoHistorical,
  getCommodities, getCommodityHistorical,
  fmt, fmtPct, fmtCurrency, colorClass
} from '../../utils/api'

const TABS = ['Stocks', 'Crypto', 'Commodities']

const TerminalTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="card-glass px-3 py-2 text-xs font-mono">
      <p className="text-[var(--text-muted)] mb-1">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex gap-3 justify-between">
          <span style={{ color: p.color }}>{p.name}</span>
          <span className="font-bold text-white">{typeof p.value === 'number' ? fmt(p.value, p.value > 100 ? 2 : 6) : p.value}</span>
        </div>
      ))}
    </div>
  )
}

function StocksTab() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [selected, setSelected] = useState(null)
  const [chartData, setChartData] = useState([])
  const [period, setPeriod] = useState('1y')
  const [searching, setSearching] = useState(false)
  const [chartLoading, setChartLoading] = useState(false)
  const defaultSymbols = 'RELIANCE.NS,TCS.NS,INFY.NS,HDFCBANK.NS,ICICIBANK.NS,ITC.NS,SBIN.NS,BHARTIARTL.NS'
  const [watchlist, setWatchlist] = useState([])

  useEffect(() => {
    getQuotes(defaultSymbols).then(r => setWatchlist(r.data)).catch(() => {})
  }, [])

  const doSearch = useCallback(async () => {
    if (!query.trim()) return
    setSearching(true)
    try { const r = await searchStocks(query); setResults(r.data) } catch (e) {}
    setSearching(false)
  }, [query])

  const selectStock = async (stock) => {
    setSelected(stock)
    setChartLoading(true)
    try {
      const r = await getHistorical(stock.symbol, period)
      setChartData(r.data.data)
    } catch (e) {}
    setChartLoading(false)
  }

  useEffect(() => { if (selected) selectStock(selected) }, [period])

  const up = selected ? (selected.change_pct ?? 0) >= 0 : true
  const gradColor = up ? 'var(--neon-green)' : 'var(--neon-red)'

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-1 space-y-4">
        <div className="card space-y-3">
          <h3 className="text-[10px] font-mono font-semibold text-[var(--text-muted)] uppercase tracking-widest">Search</h3>
          <div className="flex gap-2">
            <input className="input flex-1" placeholder="RELIANCE, TCS, NIFTY..." value={query}
              onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && doSearch()} />
            <button className="btn-primary px-3" onClick={doSearch} disabled={searching}>
              {searching ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            </button>
          </div>
          {results.length > 0 && (
            <div className="space-y-0.5 max-h-48 overflow-y-auto">{results.map((r, i) => (
              <button key={i} onClick={() => selectStock(r)}
                className="w-full text-left flex items-center justify-between px-3 py-2 rounded-lg transition-colors hover:bg-[var(--bg-elevated)]">
                <div><div className="text-xs font-semibold text-[var(--text-primary)]">{r.symbol}</div>
                  <div className="text-[10px] font-mono text-[var(--text-muted)]">{r.exchange}</div></div>
                <span className="num text-xs text-[var(--text-secondary)]">{fmt(r.price)}</span>
              </button>
            ))}</div>
          )}
        </div>
        <div className="card">
          <h3 className="text-[10px] font-mono font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-3">Watchlist</h3>
          <div className="space-y-0.5 max-h-[400px] overflow-y-auto">
            {watchlist.map((s) => (
              <button key={s.symbol} onClick={() => selectStock(s)}
                className={`w-full text-left flex items-center justify-between px-3 py-2 rounded-lg transition-all ${
                  selected?.symbol === s.symbol ? 'bg-[rgba(88,166,255,0.08)]' : 'hover:bg-[var(--bg-elevated)]'
                }`}
                style={selected?.symbol === s.symbol ? { boxShadow: 'inset 3px 0 0 var(--neon-blue)' } : {}}>
                <div>
                  <span className="text-xs font-semibold text-[var(--text-primary)]">{s.symbol.replace('.NS', '')}</span>
                  <div className={`num text-[10px] font-bold ${(s.change_pct ?? 0) >= 0 ? 'up' : 'down'}`}>{fmtPct(s.change_pct)}</div>
                </div>
                <span className="num text-xs font-bold text-white">{fmt(s.price, 2)}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="lg:col-span-2 space-y-4">
        {selected ? (
          <>
            <div className={`card ${up ? 'card-glow-green' : 'card-glow-red'}`}>
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-white">{selected.symbol}</h2>
                    <span className={`badge ${up ? 'badge-green' : 'badge-red'}`}>{up ? 'BULLISH' : 'BEARISH'}</span>
                  </div>
                  <div className="flex items-baseline gap-3 mt-1">
                    <span className="num text-3xl font-bold text-white">₹{fmt(selected.price, 2)}</span>
                    <span className={`num text-lg font-bold ${up ? 'up' : 'down'}`}>{fmtPct(selected.change_pct)}</span>
                  </div>
                  <div className="flex gap-4 mt-2 num text-[10px] text-[var(--text-muted)]">
                    <span>O {fmt(selected.open, 2)}</span>
                    <span>H {fmt(selected.high, 2)}</span>
                    <span>L {fmt(selected.low, 2)}</span>
                    <span>V {fmtCurrency(selected.volume, '')}</span>
                  </div>
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  {['1mo', '3mo', '6mo', '1y', '2y', '5y'].map(p => (
                    <button key={p} onClick={() => setPeriod(p)}
                      className={`btn-terminal ${period === p ? 'active' : ''}`}>{p}</button>
                  ))}
                </div>
              </div>
            </div>
            <div className="card">
              <h3 className="text-[10px] font-mono font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-4">Price · Volume</h3>
              {chartLoading ? (
                <div className="h-72 flex items-center justify-center"><RefreshCw className="w-5 h-5 animate-spin text-[var(--text-muted)]" /></div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={chartData.slice(-120)}>
                    <defs>
                      <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={gradColor} stopOpacity={0.2} />
                        <stop offset="100%" stopColor={gradColor} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="date" tick={{ fontSize: 9 }} tickFormatter={d => d?.slice(5)} />
                    <YAxis yAxisId="price" tick={{ fontSize: 9 }} domain={['auto', 'auto']} orientation="right" />
                    <YAxis yAxisId="vol" tick={false} width={0} domain={[0, d => d * 4]} />
                    <Tooltip content={<TerminalTooltip />} />
                    <Bar yAxisId="vol" dataKey="volume" name="Volume" fill="rgba(88,166,255,0.15)" radius={[1, 1, 0, 0]} />
                    <Area yAxisId="price" type="monotone" dataKey="close" name="Close" stroke={gradColor} fill="url(#priceGrad)" strokeWidth={2} dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              )}
            </div>
          </>
        ) : (
          <div className="card h-72 flex items-center justify-center">
            <div className="text-center">
              <Search className="w-10 h-10 mx-auto mb-3 text-[var(--text-muted)] opacity-30" />
              <p className="text-sm text-[var(--text-muted)] font-mono">SELECT A STOCK TO VIEW DATA</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function CryptoTab() {
  const [coins, setCoins] = useState([])
  const [selected, setSelected] = useState(null)
  const [chartData, setChartData] = useState([])
  const [chartDays, setChartDays] = useState(30)
  const [currency, setCurrency] = useState('inr')
  const [loading, setLoading] = useState(true)
  const [chartLoading, setChartLoading] = useState(false)
  const sym = currency === 'inr' ? '₹' : '$'

  useEffect(() => { getCryptoMarkets(currency, 20).then(r => { setCoins(r.data); setLoading(false) }).catch(() => setLoading(false)) }, [currency])

  const selectCoin = async (coin) => {
    setSelected(coin)
    setChartLoading(true)
    try { const r = await getCryptoHistorical(coin.id, chartDays, currency); setChartData(r.data.data) } catch (e) {}
    setChartLoading(false)
  }

  useEffect(() => { if (selected) selectCoin(selected) }, [chartDays])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-1 card overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[10px] font-mono font-semibold text-[var(--neon-amber)] uppercase tracking-widest">Top Crypto</h3>
          <select className="input text-xs py-1 px-2" value={currency} onChange={e => setCurrency(e.target.value)}>
            <option value="inr">INR</option><option value="usd">USD</option>
          </select>
        </div>
        <div className="space-y-0.5 max-h-[500px] overflow-y-auto">
          {loading ? [...Array(8)].map((_, i) => <div key={i} className="skeleton h-12 rounded-lg mb-1" />) :
            coins.map(c => (
              <button key={c.id} onClick={() => selectCoin(c)}
                className={`w-full text-left flex items-center gap-3 p-2.5 rounded-lg transition-all ${
                  selected?.id === c.id ? 'bg-[rgba(255,167,38,0.08)]' : 'hover:bg-[var(--bg-elevated)]'
                }`}
                style={selected?.id === c.id ? { boxShadow: 'inset 3px 0 0 var(--neon-amber)' } : {}}>
                <img src={c.image} alt={c.name} className="w-6 h-6 rounded-full" />
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-bold text-white">{c.symbol}</span>
                  <div className={`num text-[10px] font-bold ${(c.change_24h ?? 0) >= 0 ? 'up' : 'down'}`}>{fmtPct(c.change_24h)}</div>
                </div>
                <span className="num text-xs font-bold text-white shrink-0">{sym}{fmt(c.price, c.price > 100 ? 0 : 4)}</span>
              </button>
            ))}
        </div>
      </div>

      <div className="lg:col-span-2 space-y-4">
        {selected ? (
          <>
            <div className="card">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <img src={selected.image} alt={selected.name} className="w-10 h-10 rounded-full" />
                  <div>
                    <h2 className="text-lg font-bold text-white">{selected.name} <span className="text-[var(--text-muted)]">{selected.symbol}</span></h2>
                    <div className="flex items-baseline gap-3 mt-0.5">
                      <span className="num text-2xl font-bold">{sym}{fmt(selected.price, selected.price > 100 ? 2 : 6)}</span>
                      <span className={`num text-sm font-bold ${(selected.change_24h ?? 0) >= 0 ? 'up' : 'down'}`}>{fmtPct(selected.change_24h)} 24h</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-1.5">
                  {[7, 30, 90, 365].map(d => (
                    <button key={d} onClick={() => setChartDays(d)} className={`btn-terminal ${chartDays === d ? 'active' : ''}`}>
                      {d === 365 ? '1Y' : `${d}D`}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 mt-4">
                <div className="rounded-lg p-3" style={{ background: 'var(--bg-elevated)' }}>
                  <div className="text-[10px] font-mono text-[var(--text-muted)]">MCAP</div>
                  <div className="num text-sm font-bold text-white">{fmtCurrency(selected.market_cap, sym)}</div>
                </div>
                <div className="rounded-lg p-3" style={{ background: 'var(--bg-elevated)' }}>
                  <div className="text-[10px] font-mono text-[var(--text-muted)]">24H VOL</div>
                  <div className="num text-sm font-bold text-white">{fmtCurrency(selected.volume_24h, sym)}</div>
                </div>
                <div className="rounded-lg p-3" style={{ background: 'var(--bg-elevated)' }}>
                  <div className="text-[10px] font-mono text-[var(--text-muted)]">7D</div>
                  <div className={`num text-sm font-bold ${(selected.change_7d ?? 0) >= 0 ? 'up' : 'down'}`}>{fmtPct(selected.change_7d)}</div>
                </div>
              </div>
            </div>
            <div className="card">
              {chartLoading ? <div className="h-60 flex items-center justify-center"><RefreshCw className="w-5 h-5 animate-spin text-[var(--text-muted)]" /></div> : (
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="cryptoGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--neon-amber)" stopOpacity={0.25} />
                        <stop offset="100%" stopColor="var(--neon-amber)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="date" tick={{ fontSize: 9 }} />
                    <YAxis tick={{ fontSize: 9 }} domain={['auto', 'auto']} />
                    <Tooltip content={<TerminalTooltip />} />
                    <Area type="monotone" dataKey="price" name="Price" stroke="var(--neon-amber)" fill="url(#cryptoGrad)" strokeWidth={2} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </>
        ) : (
          <div className="card h-60 flex items-center justify-center"><p className="font-mono text-sm text-[var(--text-muted)]">SELECT A COIN</p></div>
        )}
      </div>
    </div>
  )
}

function CommoditiesTab() {
  const [commodities, setCommodities] = useState([])
  const [selected, setSelected] = useState(null)
  const [chartData, setChartData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { getCommodities().then(r => { setCommodities(r.data); setLoading(false) }).catch(() => setLoading(false)) }, [])

  const selectCommodity = async (c) => {
    setSelected(c)
    try { const r = await getCommodityHistorical(c.symbol, '1y'); setChartData(r.data.data.slice(-60)) } catch (e) {}
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-1 card">
        <h3 className="text-[10px] font-mono font-semibold text-[var(--neon-purple)] uppercase tracking-widest mb-3">Commodities</h3>
        {loading ? [...Array(6)].map((_, i) => <div key={i} className="skeleton h-14 rounded-lg mb-1" />) :
          <div className="space-y-0.5">{commodities.map(c => (
            <button key={c.symbol} onClick={() => selectCommodity(c)}
              className={`w-full text-left p-3 rounded-lg transition-all ${
                selected?.symbol === c.symbol ? 'bg-[rgba(179,136,255,0.08)]' : 'hover:bg-[var(--bg-elevated)]'
              }`}
              style={selected?.symbol === c.symbol ? { boxShadow: 'inset 3px 0 0 var(--neon-purple)' } : {}}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-white">{c.name}</div>
                  <div className="text-[10px] font-mono text-[var(--text-muted)]">{c.unit}</div>
                </div>
                <div className="text-right">
                  <div className="num text-xs font-bold text-white">${fmt(c.price)}</div>
                  <div className={`num text-[10px] font-bold ${(c.change_pct ?? 0) >= 0 ? 'up' : 'down'}`}>{fmtPct(c.change_pct)}</div>
                </div>
              </div>
            </button>
          ))}</div>
        }
      </div>
      <div className="lg:col-span-2">
        {selected ? (
          <div className="card space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white">{selected.name}</h2>
                <div className="flex items-baseline gap-3 mt-0.5">
                  <span className="num text-2xl font-bold">${fmt(selected.price, 2)}</span>
                  <span className={`num text-sm font-bold ${(selected.change_pct ?? 0) >= 0 ? 'up' : 'down'}`}>{fmtPct(selected.change_pct)}</span>
                  <span className="text-[10px] font-mono text-[var(--text-muted)]">{selected.unit}</span>
                </div>
              </div>
            </div>
            {chartData.length > 0 && (
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="commGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--neon-purple)" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="var(--neon-purple)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="date" tick={{ fontSize: 9 }} tickFormatter={d => d?.slice(5)} />
                  <YAxis tick={{ fontSize: 9 }} domain={['auto', 'auto']} />
                  <Tooltip content={<TerminalTooltip />} />
                  <Area type="monotone" dataKey="close" name="Close" stroke="var(--neon-purple)" fill="url(#commGrad)" strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        ) : <div className="card h-60 flex items-center justify-center"><p className="font-mono text-sm text-[var(--text-muted)]">SELECT A COMMODITY</p></div>}
      </div>
    </div>
  )
}

export default function Markets() {
  const [tab, setTab] = useState('Stocks')
  return (
    <div className="p-4 md:p-6 space-y-5">
      <div className="flex items-center gap-3">
        <BarChart3 className="w-5 h-5 text-[var(--neon-blue)]" />
        <h1 className="text-lg font-bold text-white">Markets</h1>
      </div>
      <div className="flex gap-1.5" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`btn-terminal ${tab === t ? 'active' : ''}`}>{t}</button>
        ))}
      </div>
      {tab === 'Stocks' && <StocksTab />}
      {tab === 'Crypto' && <CryptoTab />}
      {tab === 'Commodities' && <CommoditiesTab />}
    </div>
  )
}
