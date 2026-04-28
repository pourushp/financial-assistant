import { useState, useRef } from 'react'
import { Upload, TrendingUp, TrendingDown, Search, RefreshCw, AlertCircle } from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, Tooltip,
  XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend
} from 'recharts'
import {
  uploadPortfolio, getPortfolioHistorical, getForecast,
  fmt, fmtCurrency, fmtPct, colorClass
} from '../../utils/api'

const COLORS = ['#58a6ff', '#00d26a', '#ffa726', '#ff3b3b', '#b388ff', '#00e5ff', '#58a6ff', '#00d26a']

const SAMPLE_CSV = `Symbol,Quantity,BuyPrice,BuyDate
RELIANCE.NS,10,2400.50,2023-01-15
TCS.NS,5,3200.00,2022-06-20
INFY.NS,15,1450.00,2023-03-10
HDFCBANK.NS,20,1650.75,2022-11-05
ICICIBANK.NS,25,900.00,2023-06-01`

function SummaryCard({ label, value, sub, color }) {
  return (
    <div className="card" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      <p className="text-[10px] font-mono font-semibold text-[var(--text-muted)] uppercase tracking-widest">{label}</p>
      <p className={`text-xl font-bold mt-1 num ${color || 'text-[var(--text-primary)]'}`}>{value}</p>
      {sub && <p className="text-xs text-[var(--text-muted)] mt-0.5">{sub}</p>}
    </div>
  )
}

function ForecastBadge({ signal }) {
  const map = {
    Bullish: 'badge-green',
    Bearish: 'badge-red',
    Neutral: 'badge-yellow',
  }
  return <span className={`badge ${map[signal] || 'badge-blue'}`}>{signal}</span>
}

export default function Portfolio() {
  const [portfolio, setPortfolio] = useState(null)
  const [historical, setHistorical] = useState([])
  const [forecasts, setForecasts] = useState({})
  const [selectedForecast, setSelectedForecast] = useState(null)
  const [forecastData, setForecastData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [histLoading, setHistLoading] = useState(false)
  const [forecastLoading, setForecastLoading] = useState(false)
  const [error, setError] = useState(null)
  const fileRef = useRef()

  const handleFile = async (file) => {
    setLoading(true)
    setError(null)
    try {
      const res = await uploadPortfolio(file)
      setPortfolio(res.data)
      // Load historical performance
      const h = res.data.holdings
      if (h.length > 0) {
        setHistLoading(true)
        try {
          const symbols = h.map(x => x.symbol).join(',')
          const quantities = h.map(x => x.quantity).join(',')
          const buys = h.map(x => x.buy_price).join(',')
          const hr = await getPortfolioHistorical(symbols, quantities, buys, '1y')
          setHistorical(hr.data.timeline)
        } catch (e) {}
        setHistLoading(false)
      }
    } catch (e) {
      setError(e.response?.data?.detail || 'Failed to parse portfolio file. Check the format.')
    }
    setLoading(false)
  }

  const loadForecast = async (symbol) => {
    setSelectedForecast(symbol)
    setForecastLoading(true)
    try {
      const r = await getForecast(symbol)
      setForecastData(r.data)
    } catch (e) {}
    setForecastLoading(false)
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    return (
      <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }} className="rounded-lg p-2 text-xs">
        <p className="text-[var(--text-muted)]">{label}</p>
        <p className="text-[var(--text-primary)] font-bold num">{'₹'}{fmt(payload[0]?.value, 0)}</p>
      </div>
    )
  }

  const pieData = portfolio?.holdings.map(h => ({
    name: h.symbol.replace('.NS', '').replace('.BO', ''),
    value: h.current_value,
  })) || []

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-[var(--text-primary)]">Portfolio</h1>
        <button className="btn-secondary flex items-center gap-2" onClick={() => {
          const blob = new Blob([SAMPLE_CSV], { type: 'text/csv' })
          const a = document.createElement('a')
          a.href = URL.createObjectURL(blob)
          a.download = 'sample_portfolio.csv'
          a.click()
        }}>
          Download Sample CSV
        </button>
      </div>

      {/* Upload area */}
      {!portfolio && (
        <div
          className="rounded-xl p-10 text-center cursor-pointer transition-colors"
          style={{ border: '2px dashed var(--border)', background: 'var(--bg-card)' }}
          onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--neon-blue)'}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
          onClick={() => fileRef.current?.click()}
          onDragOver={e => e.preventDefault()}
          onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files[0]) }}
        >
          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={e => handleFile(e.target.files[0])}
          />
          {loading ? (
            <div className="flex flex-col items-center gap-2 text-[var(--text-secondary)]">
              <RefreshCw className="w-8 h-8 animate-spin" />
              <p>Analyzing portfolio...</p>
            </div>
          ) : (
            <>
              <Upload className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
              <p className="font-medium text-[var(--text-primary)]">Upload your portfolio CSV</p>
              <p className="text-sm mt-1 text-[var(--text-muted)]">Format: Symbol, Quantity, BuyPrice, BuyDate</p>
              <p className="text-sm text-[var(--text-muted)]">Example: RELIANCE.NS, 10, 2400.50, 2023-01-15</p>
            </>
          )}
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 rounded-lg p-4" style={{ background: 'rgba(255,59,59,0.08)', border: '1px solid var(--neon-red)' }}>
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'var(--neon-red)' }} />
          <p className="text-sm" style={{ color: 'var(--neon-red)' }}>{error}</p>
        </div>
      )}

      {portfolio && (
        <>
          {/* Reset */}
          <button className="btn-secondary text-xs" onClick={() => { setPortfolio(null); setHistorical([]); setForecastData(null) }}>
            &larr; Upload Different Portfolio
          </button>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <SummaryCard label="Total Invested" value={`₹${fmt(portfolio.summary.total_invested, 0)}`} />
            <SummaryCard
              label="Current Value"
              value={`₹${fmt(portfolio.summary.total_current_value, 0)}`}
              color={colorClass(portfolio.summary.total_gain_loss)}
            />
            <SummaryCard
              label="Total P&L"
              value={`${portfolio.summary.total_gain_loss >= 0 ? '+' : ''}₹${fmt(portfolio.summary.total_gain_loss, 0)}`}
              color={colorClass(portfolio.summary.total_gain_loss)}
            />
            <SummaryCard
              label="Total Return"
              value={fmtPct(portfolio.summary.total_gain_loss_pct)}
              color={colorClass(portfolio.summary.total_gain_loss_pct)}
              sub={`${portfolio.summary.num_holdings} holdings`}
            />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Historical Performance */}
            <div className="card" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <h3 className="text-[10px] font-mono font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-4">Portfolio Value (1Y)</h3>
              {histLoading ? (
                <div className="h-48 flex items-center justify-center">
                  <div className="skeleton w-full h-40 rounded-lg" />
                </div>
              ) : historical.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={historical}>
                    <defs>
                      <linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#58a6ff" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#58a6ff" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickFormatter={d => d?.slice(5)} stroke="var(--border)" />
                    <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickFormatter={v => `₹${Math.round(v / 1000)}K`} stroke="var(--border)" />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="value" stroke="#58a6ff" fill="url(#portfolioGradient)" dot={false} strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-48 flex items-center justify-center text-sm text-[var(--text-muted)]">No historical data</div>
              )}
            </div>

            {/* Allocation Pie */}
            <div className="card" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <h3 className="text-[10px] font-mono font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-4">Portfolio Allocation</h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => [`₹${fmt(v, 0)}`, 'Value']} contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px', color: 'var(--text-primary)' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Holdings Table */}
          <div className="card overflow-x-auto" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <h3 className="text-[10px] font-mono font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-4">Holdings</h3>
            <table className="table-terminal w-full text-sm">
              <thead>
                <tr className="text-[10px] font-mono font-semibold text-[var(--text-muted)] uppercase tracking-widest" style={{ borderBottom: '1px solid var(--border)' }}>
                  <th className="text-left pb-2">Symbol</th>
                  <th className="text-right pb-2">Qty</th>
                  <th className="text-right pb-2">Avg Cost</th>
                  <th className="text-right pb-2">Current</th>
                  <th className="text-right pb-2">Invested</th>
                  <th className="text-right pb-2">Value</th>
                  <th className="text-right pb-2">P&L</th>
                  <th className="text-right pb-2">%</th>
                  <th className="text-right pb-2">Weight</th>
                  <th className="text-right pb-2">Forecast</th>
                </tr>
              </thead>
              <tbody>
                {portfolio.holdings.map((h) => (
                  <tr key={h.symbol} style={{ borderBottom: '1px solid var(--border)' }} className="hover:bg-[var(--bg-elevated)] transition-colors">
                    <td className="py-2.5 font-medium text-[var(--text-primary)] font-mono">
                      {h.symbol.replace('.NS', '').replace('.BO', '')}
                    </td>
                    <td className="text-right text-[var(--text-secondary)] num">{h.quantity}</td>
                    <td className="text-right text-[var(--text-secondary)] num">{'₹'}{fmt(h.buy_price)}</td>
                    <td className="text-right text-[var(--text-primary)] num">{'₹'}{fmt(h.current_price)}</td>
                    <td className="text-right text-[var(--text-secondary)] num">{'₹'}{fmt(h.invested, 0)}</td>
                    <td className="text-right text-[var(--text-primary)] num">{'₹'}{fmt(h.current_value, 0)}</td>
                    <td className={`text-right font-medium num ${colorClass(h.gain_loss)}`}>
                      {h.gain_loss >= 0 ? '+' : ''}{'₹'}{fmt(h.gain_loss, 0)}
                    </td>
                    <td className={`text-right font-medium num ${colorClass(h.gain_loss_pct)}`}>
                      {fmtPct(h.gain_loss_pct)}
                    </td>
                    <td className="text-right text-[var(--text-muted)] num">{fmt(h.weight, 1)}%</td>
                    <td className="text-right">
                      <button
                        className="btn-terminal text-xs"
                        onClick={() => loadForecast(h.symbol)}
                      >
                        Forecast
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Forecast Panel */}
          {forecastData && (
            <div className="card" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[10px] font-mono font-semibold text-[var(--text-muted)] uppercase tracking-widest">
                  Forecast: {forecastData.symbol.replace('.NS', '')}
                </h3>
                <button className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] text-xs" onClick={() => setForecastData(null)}>&#10005; Close</button>
              </div>
              {forecastLoading ? (
                <div className="flex justify-center py-8"><div className="skeleton w-full h-40 rounded-lg" /></div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="flex gap-4 mb-4 text-xs text-[var(--text-muted)]">
                      <span>Current: <span className="text-[var(--text-primary)] font-bold num">{'₹'}{fmt(forecastData.current_price)}</span></span>
                      <span>MA Signal: <ForecastBadge signal={forecastData.ma_signal} /></span>
                    </div>
                    <div className="space-y-2">
                      {forecastData.predictions?.map((p, i) => (
                        <div key={i} className="flex justify-between text-xs p-2 rounded-lg" style={{ background: 'var(--bg-elevated)' }}>
                          <span className="text-[var(--text-muted)]">{p.period}</span>
                          <span className={`num font-bold ${colorClass(p.change_pct)}`}>
                            {'₹'}{fmt(p.price)} ({fmtPct(p.change_pct)})
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-widest mb-3">Analysis</p>
                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{forecastData.analysis || 'No analysis available.'}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
