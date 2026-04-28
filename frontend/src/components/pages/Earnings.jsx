import { useState, useRef } from 'react'
import { Upload, RefreshCw, AlertCircle, BarChart3 } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts'
import { getEarningsBatch, fmt, fmtCurrency } from '../../utils/api'

const SAMPLE_CSV = `Symbol
RELIANCE.NS
TCS.NS
INFY.NS
HDFCBANK.NS
WIPRO.NS`

function formatRevenue(val) {
  if (val == null) return '—'
  const abs = Math.abs(val)
  if (abs >= 1e12) return `₹${(val / 1e12).toFixed(2)}T`
  if (abs >= 1e9) return `₹${(val / 1e9).toFixed(2)}B`
  if (abs >= 1e6) return `₹${(val / 1e6).toFixed(2)}M`
  return `₹${fmt(val)}`
}

function QoQChange({ current, previous }) {
  if (current == null || previous == null || previous === 0) return null
  const pct = ((current - previous) / Math.abs(previous)) * 100
  const up = pct >= 0
  return (
    <span className={`ml-1 num text-[10px] font-bold ${up ? 'up' : 'down'}`}>
      {up ? '▲' : '▼'} {Math.abs(pct).toFixed(1)}%
    </span>
  )
}

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="card-glass px-3 py-2 text-xs font-mono">
      <p className="text-[var(--text-muted)] mb-1">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex gap-3 justify-between">
          <span style={{ color: p.color }}>{p.name}</span>
          <span className="font-bold text-white">₹{p.value?.toFixed(2)}B</span>
        </div>
      ))}
    </div>
  )
}

function CompanyEarnings({ data }) {
  const quarters = (data.quarterly || []).slice(-8)
  if (quarters.length === 0) {
    return (
      <div className="card">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-bold text-white">{data.symbol.replace('.NS', '')}</h3>
          <span className="badge-red">NO DATA</span>
        </div>
        <p className="text-xs text-[var(--text-muted)] font-mono">{data.error || 'Quarterly earnings not available'}</p>
      </div>
    )
  }

  const chartData = quarters.map((q) => ({
    quarter: q.quarter,
    revenue: q.revenue ? q.revenue / 1e9 : null,
    net_income: q.net_income ? q.net_income / 1e9 : null,
    operating_income: q.operating_income ? q.operating_income / 1e9 : null,
  }))

  const latest = quarters[quarters.length - 1]
  const prev = quarters[quarters.length - 2]

  return (
    <div className="card space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center gap-3">
          <h3 className="text-base font-bold text-white">{data.symbol.replace('.NS', '').replace('.BO', '')}</h3>
          <span className="badge-blue">{quarters.length}Q</span>
        </div>
        <div className="flex gap-4 text-right">
          <div>
            <p className="text-[10px] font-mono text-[var(--text-muted)] uppercase">Revenue</p>
            <p className="num text-sm font-bold text-white">
              {formatRevenue(latest.revenue)}
              {prev && <QoQChange current={latest.revenue} previous={prev.revenue} />}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-mono text-[var(--text-muted)] uppercase">Net Income</p>
            <p className={`num text-sm font-bold ${latest.net_income >= 0 ? 'up' : 'down'}`}>
              {formatRevenue(latest.net_income)}
              {prev && <QoQChange current={latest.net_income} previous={prev.net_income} />}
            </p>
          </div>
          {latest.eps && (
            <div>
              <p className="text-[10px] font-mono text-[var(--text-muted)] uppercase">EPS</p>
              <p className="num text-sm font-bold text-white">{fmt(latest.eps, 2)}</p>
            </div>
          )}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={chartData} barGap={4}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="quarter" tick={{ fontSize: 9 }} />
          <YAxis tick={{ fontSize: 9 }} tickFormatter={v => `${v?.toFixed(0)}B`} />
          <Tooltip content={<ChartTooltip />} />
          <Legend wrapperStyle={{ fontSize: '10px', fontFamily: 'JetBrains Mono' }} />
          <Bar dataKey="revenue" name="Revenue" fill="var(--neon-blue)" radius={[2, 2, 0, 0]} />
          <Bar dataKey="net_income" name="Net Income" fill="var(--neon-green)" radius={[2, 2, 0, 0]} />
          <Bar dataKey="operating_income" name="Op. Income" fill="var(--neon-amber)" radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>

      <div className="overflow-x-auto">
        <table className="table-terminal">
          <thead>
            <tr>
              <th>Quarter</th><th className="text-right">Revenue</th><th className="text-right">Gross Profit</th>
              <th className="text-right">Op. Income</th><th className="text-right">Net Income</th>
              <th className="text-right">EPS</th><th className="text-right">QoQ Net</th>
            </tr>
          </thead>
          <tbody>
            {[...quarters].reverse().map((q, i) => {
              const prevQ = [...quarters].reverse()[i + 1]
              return (
                <tr key={i}>
                  <td className="font-semibold text-[var(--text-primary)]">{q.quarter}</td>
                  <td className="text-right num">{formatRevenue(q.revenue)}</td>
                  <td className="text-right num">{formatRevenue(q.gross_profit)}</td>
                  <td className={`text-right num ${q.operating_income >= 0 ? 'up' : 'down'}`}>{formatRevenue(q.operating_income)}</td>
                  <td className={`text-right num font-bold ${q.net_income >= 0 ? 'up' : 'down'}`}>{formatRevenue(q.net_income)}</td>
                  <td className="text-right num">{q.eps != null ? fmt(q.eps, 2) : '—'}</td>
                  <td className="text-right">{prevQ ? <QoQChange current={q.net_income} previous={prevQ.net_income} /> : '—'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function Earnings() {
  const [earnings, setEarnings] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [manualInput, setManualInput] = useState('')
  const fileRef = useRef()

  const fetchEarnings = async (symbols) => {
    setLoading(true); setError(null)
    try { const r = await getEarningsBatch(symbols.join(',')); setEarnings(r.data) }
    catch (e) { setError('Failed to fetch earnings data.') }
    setLoading(false)
  }

  const handleFile = async (file) => {
    try {
      const text = await file.text()
      const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
      const symbols = lines.filter(l => !l.toLowerCase().startsWith('symbol') && !l.startsWith('#'))
      if (symbols.length === 0) { setError('No symbols found in file.'); return }
      fetchEarnings(symbols)
    } catch (e) { setError('Failed to read file.') }
  }

  const handleManual = () => {
    const symbols = manualInput.split(/[,\n\s]+/).map(s => s.trim().toUpperCase()).filter(Boolean)
    if (symbols.length === 0) return
    fetchEarnings(symbols)
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-5 h-5 text-[var(--neon-cyan)]" />
          <div>
            <h1 className="text-lg font-bold text-white">Earnings Tracker</h1>
            <p className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-widest">Quarter-on-quarter performance</p>
          </div>
        </div>
        <button className="btn-secondary text-xs" onClick={() => {
          const blob = new Blob([SAMPLE_CSV], { type: 'text/csv' })
          const a = document.createElement('a'); a.href = URL.createObjectURL(blob)
          a.download = 'sample_earnings.csv'; a.click()
        }}>Download Sample CSV</button>
      </div>

      {earnings.length === 0 && !loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl p-8 text-center cursor-pointer transition-colors"
            style={{ border: '2px dashed var(--border)', background: 'var(--bg-card)' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--neon-cyan)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
            onClick={() => fileRef.current?.click()}
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files[0]) }}>
            <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden" onChange={e => handleFile(e.target.files[0])} />
            <Upload className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--text-muted)' }} />
            <p className="font-medium text-sm text-[var(--text-primary)]">Upload CSV of symbols</p>
            <p className="text-[10px] font-mono text-[var(--text-muted)] mt-1">One symbol per line (e.g. RELIANCE.NS)</p>
          </div>
          <div className="card space-y-3">
            <h3 className="text-[10px] font-mono font-semibold text-[var(--text-muted)] uppercase tracking-widest">Or enter symbols</h3>
            <textarea className="input w-full h-28 resize-none font-mono" placeholder="RELIANCE.NS&#10;TCS.NS&#10;INFY.NS"
              value={manualInput} onChange={e => setManualInput(e.target.value)} />
            <button className="btn-primary w-full" onClick={handleManual}>Fetch Earnings</button>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 rounded-lg p-4" style={{ background: 'rgba(255,59,59,0.08)', border: '1px solid var(--neon-red)' }}>
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'var(--neon-red)' }} />
          <p className="text-sm" style={{ color: 'var(--neon-red)' }}>{error}</p>
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center gap-3 py-16">
          <RefreshCw className="w-8 h-8 animate-spin text-[var(--neon-blue)]" />
          <p className="font-mono text-sm text-[var(--text-muted)]">FETCHING QUARTERLY DATA...</p>
        </div>
      )}

      {earnings.length > 0 && !loading && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-xs font-mono text-[var(--text-muted)]">{earnings.length} companies</p>
            <button className="btn-secondary text-xs" onClick={() => { setEarnings([]); setManualInput(''); setError(null) }}>Reset</button>
          </div>

          <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: 'var(--bg-card)' }}>
                    <th className="text-left p-3 font-mono text-[10px] uppercase tracking-wider text-[var(--text-muted)]">Symbol</th>
                    <th className="text-right p-3 font-mono text-[10px] uppercase tracking-wider text-[var(--text-muted)]">Revenue</th>
                    <th className="text-right p-3 font-mono text-[10px] uppercase tracking-wider text-[var(--text-muted)]">Net Income</th>
                    <th className="text-right p-3 font-mono text-[10px] uppercase tracking-wider text-[var(--text-muted)]">EPS</th>
                    <th className="text-right p-3 font-mono text-[10px] uppercase tracking-wider text-[var(--text-muted)]">Revenue QoQ</th>
                  </tr>
                </thead>
                <tbody>
                  {earnings.map((e, i) => (
                    <tr key={i} style={{ borderTop: '1px solid var(--border)' }}>
                      <td className="p-3 font-mono font-bold text-[var(--neon-cyan)]">{e.symbol}</td>
                      <td className="p-3 text-right font-mono text-[var(--text-secondary)]">{formatRevenue(e.totalRevenue)}</td>
                      <td className="p-3 text-right font-mono text-[var(--text-secondary)]">{formatRevenue(e.netIncome)}</td>
                      <td className="p-3 text-right font-mono text-[var(--text-secondary)]">{e.eps != null ? e.eps.toFixed(2) : '—'}</td>
                      <td className="p-3 text-right">
                        <QoQChange current={e.totalRevenue} previous={e.prevRevenue} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {earnings.length > 0 && (
            <div className="card" style={{ height: 350 }}>
              <h3 className="text-[10px] font-mono font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-4">Revenue Comparison</h3>
              <ResponsiveContainer width="100%" height="85%">
                <BarChart data={earnings.filter(e => e.totalRevenue != null)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="symbol" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
                  <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} tickFormatter={v => formatRevenue(v)} />
                  <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                    formatter={v => [formatRevenue(v), 'Revenue']} />
                  <Bar dataKey="totalRevenue" fill="var(--neon-cyan)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}
    </div>
  )
}
