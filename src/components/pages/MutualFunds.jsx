import { useState, useEffect } from 'react'
import { Search, RefreshCw, Star, PieChart } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { searchFunds, getFundNav, getMFRecommendations, fmt, fmtPct, colorClass } from '../../utils/api'

const RISK_LEVELS = ['low', 'medium', 'high']
const HORIZONS = ['short', 'medium', 'long']
const GOALS = ['growth', 'income', 'tax-saving', 'safety']

function ReturnBadge({ val }) {
  if (val == null) return <span className="text-[var(--text-muted)] num">\u2014</span>
  return <span className={`num text-sm font-bold ${val >= 0 ? 'up' : 'down'}`}>{fmtPct(val)}</span>
}

function FundCard({ fund, onSelect, selected }) {
  const isActive = selected?.scheme_code === fund.scheme_code
  return (
    <button onClick={() => onSelect(fund)}
      className={`w-full text-left p-3 rounded-xl transition-all ${isActive ? '' : 'hover:bg-[var(--bg-elevated)]'}`}
      style={isActive ? { background: 'rgba(0,229,255,0.06)', boxShadow: 'inset 3px 0 0 var(--neon-cyan)', border: '1px solid rgba(0,229,255,0.2)' } : { border: '1px solid var(--border)' }}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-[var(--text-primary)] line-clamp-2">{fund.name}</p>
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {fund.amc && <span className="badge-blue">{fund.amc.split(' ')[0]}</span>}
            {fund.category && <span className="badge-yellow">{fund.category}</span>}
          </div>
        </div>
        {fund.nav && <div className="num text-xs font-bold text-white shrink-0">\u20B9{fmt(fund.nav)}</div>}
      </div>
    </button>
  )
}

function RecommendationCard({ rec }) {
  const riskColor = rec.risk_level.includes('Very') ? 'badge-red' : rec.risk_level === 'High' ? 'badge-yellow' : rec.risk_level.includes('Medium') ? 'badge-blue' : 'badge-green'
  return (
    <div className="card space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <h4 className="text-sm font-bold text-white">{rec.category}</h4>
          <p className="text-[10px] font-mono text-[var(--text-muted)]">{rec.min_horizon}</p>
        </div>
        <span className={riskColor}>{rec.risk_level} Risk</span>
      </div>
      <p className="text-xs text-[var(--text-secondary)]">{rec.rationale}</p>
      <div className="space-y-1.5">
        <p className="text-[10px] font-mono font-semibold text-[var(--text-muted)] uppercase tracking-widest">Suggested Funds</p>
        {rec.suggested_funds.map((f, i) => (
          <div key={i} className="flex items-center gap-2 text-xs text-[var(--text-primary)]">
            <Star className="w-3 h-3 shrink-0" style={{ color: 'var(--neon-amber)' }} />{f}
          </div>
        ))}
      </div>
    </div>
  )
}

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="card-glass px-3 py-2 text-xs font-mono">
      <p className="text-[var(--text-muted)]">{label}</p>
      <p className="font-bold text-white">\u20B9{fmt(payload[0]?.value)}</p>
    </div>
  )
}

export default function MutualFunds() {
  const [tab, setTab] = useState('search')
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [selected, setSelected] = useState(null)
  const [navData, setNavData] = useState(null)
  const [navLoading, setNavLoading] = useState(false)
  const [searching, setSearching] = useState(false)
  const [risk, setRisk] = useState('medium')
  const [horizon, setHorizon] = useState('medium')
  const [goal, setGoal] = useState('growth')
  const [recommendations, setRecommendations] = useState(null)
  const [recLoading, setRecLoading] = useState(false)

  const doSearch = async () => {
    if (!query.trim()) return; setSearching(true)
    try { const r = await searchFunds(query); setResults(r.data) } catch (e) {}
    setSearching(false)
  }

  const selectFund = async (fund) => {
    setSelected(fund); setNavLoading(true)
    try { const r = await getFundNav(fund.scheme_code, 365); setNavData(r.data) } catch (e) {}
    setNavLoading(false)
  }

  const loadRecommendations = async () => {
    setRecLoading(true)
    try { const r = await getMFRecommendations(risk, horizon, goal); setRecommendations(r.data) } catch (e) {}
    setRecLoading(false)
  }

  useEffect(() => { if (tab === 'recommendations') loadRecommendations() }, [tab, risk, horizon, goal])

  const chartData = navData?.history?.slice(-90) || []

  return (
    <div className="p-4 md:p-6 space-y-5">
      <div className="flex items-center gap-3">
        <PieChart className="w-5 h-5 text-[var(--neon-cyan)]" />
        <h1 className="text-lg font-bold text-white">Mutual Funds</h1>
      </div>

      <div className="flex gap-1.5" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
        {[['search', 'Search Funds'], ['recommendations', 'Recommendations']].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} className={`btn-terminal ${tab === key ? 'active' : ''}`}>{label}</button>
        ))}
      </div>

      {tab === 'search' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-1 space-y-3">
            <div className="flex gap-2">
              <input className="input flex-1" placeholder="Search fund name or AMC..." value={query}
                onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && doSearch()} />
              <button className="btn-primary px-3" onClick={doSearch} disabled={searching}>
                {searching ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[10px] font-mono text-[var(--text-muted)]">TRY: HDFC, MIRAE, AXIS, PARAG PARIKH</p>
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {results.map((f, i) => <FundCard key={i} fund={f} onSelect={selectFund} selected={selected} />)}
              {results.length === 0 && query && !searching && (
                <p className="text-sm text-[var(--text-muted)] font-mono text-center py-8">NO RESULTS</p>
              )}
            </div>
          </div>

          <div className="lg:col-span-2 space-y-4">
            {navLoading && <div className="card h-64 flex items-center justify-center"><RefreshCw className="w-6 h-6 animate-spin text-[var(--neon-blue)]" /></div>}
            {navData && !navLoading && (
              <>
                <div className="card">
                     <h2 className="text-sm font-bold text-white">{navData.name}</h2>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    <span className="badge-blue">{navData.amc}</span>
                    <span className="badge-yellow">{navData.category}</span>
                    <span className="badge-cyan">{navData.type}</span>
                  </div>
                  <div className="mt-3">
                    <p className="text-[10px] font-mono text-[var(--text-muted)] uppercase">Current NAV</p>
                    <p className="num text-2xl font-bold text-white">\u20B9{fmt(navData.current_nav)}</p>
                  </div>
                  <div className="grid grid-cols-4 md:grid-cols-7 gap-2 mt-4">
                    {['1W', '1M', '3M', '6M', '1Y', '3Y', '5Y'].map(period => (
                      <div key={period} className="text-center p-2 rounded-lg" style={{ background: 'var(--bg-elevated)' }}>
                        <p className="text-[10px] font-mono text-[var(--text-muted)]">{period}</p>
                        <ReturnBadge val={navData.returns[period]} />
                      </div>
                    ))}
                  </div>
                </div>
                {chartData.length > 0 && (
                  <div className="card">
                    <h3 className="text-[10px] font-mono font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-4">NAV History (90D)</h3>
                    <ResponsiveContainer width="100%" height={220}>
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="navGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="var(--neon-green)" stopOpacity={0.25} />
                            <stop offset="100%" stopColor="var(--neon-green)" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                        <XAxis dataKey="date" tick={{ fontSize: 9 }} tickFormatter={d => d?.slice(5)} />
                        <YAxis tick={{ fontSize: 9 }} domain={['auto', 'auto']} />
                        <Tooltip content={<ChartTooltip />} />
                        <Area type="monotone" dataKey="nav" stroke="var(--neon-green)" fill="url(#navGrad)" strokeWidth={2} dot={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </>
            )}
            {!navData && !navLoading && (
              <div className="card h-64 flex items-center justify-center">
                <div className="text-center">
                  <Search className="w-10 h-10 mx-auto mb-3 opacity-20 text-[var(--text-muted)]" />
                  <p className="font-mono text-sm text-[var(--text-muted)]">SELECT A FUND TO VIEW PERFORMANCE</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'recommendations' && (
        <div className="space-y-5">
          <div className="card">
            <h3 className="text-[10px] font-mono font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-4">Investment Profile</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-[10px] font-mono text-[var(--text-muted)] mb-1.5 block uppercase">Risk Appetite</label>
                <div className="flex gap-1.5">
                  {RISK_LEVELS.map(r => (
                    <button key={r} onClick={() => setRisk(r)} className={`btn-terminal flex-1 capitalize ${risk === r ? 'active' : ''}`}>{r}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[10px] font-mono text-[var(--text-muted)] mb-1.5 block uppercase">Horizon</label>
                <div className="flex gap-1.5">
                  {HORIZONS.map(h => (
                    <button key={h} onClick={() => setHorizon(h)} className={`btn-terminal flex-1 ${horizon === h ? 'active' : ''}`}>
                      {h === 'short' ? '< 1Y' : h === 'medium' ? '1-5Y' : '5Y+'}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[10px] font-mono text-[var(--text-muted)] mb-1.5 block uppercase">Goal</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {GOALS.map(g => (
                    <button key={g} onClick={() => setGoal(g)} className={`btn-terminal capitalize ${goal === g ? 'active' : ''}`}>{g.replace('-', ' ')}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {recLoading ? (
            <div className="flex justify-center py-12"><RefreshCw className="w-6 h-6 animate-spin text-[var(--neon-blue)]" /></div>
          ) : recommendations && (
            <div>
              <p className="text-xs font-mono text-[var(--text-muted)] mb-4">{recommendations.recommendations.length} RECOMMENDATIONS</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {recommendations.recommendations.map((rec, i) => <RecommendationCard key={i} rec={rec} />)}
                {recommendations.recommendations.length === 0 && (
                  <p className="text-[var(--text-muted)] font-mono text-sm col-span-2 text-center py-8">NO RECOMMENDATIONS FOR THIS PROFILE</p>
                )}
              </div>
              <p className="text-[10px] font-mono text-[var(--text-muted)] mt-4">
                * For educational purposes only. Consult a SEBI-registered advisor before investing.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
