import { useState, useMemo } from 'react'
import { Calculator, Target, TrendingUp, ArrowUpRight } from 'lucide-react'
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts'

const fmtINR = (num) => {
  if (num == null) return '—'
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(num)
}

const TABS = [
  { key: 'sip', label: 'SIP', icon: Calculator },
  { key: 'lumpsum', label: 'Lumpsum', icon: TrendingUp },
  { key: 'stepup', label: 'Step-Up SIP', icon: ArrowUpRight },
  { key: 'goal', label: 'Goal Planner', icon: Target },
]

const DONUT_COLORS = ['#00d26a', '#58a6ff']
const BAR_COLORS = { invested: '#58a6ff', returns: '#00d26a' }

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: '#161d29',
      border: '1px solid #1c2333',
      borderRadius: 8,
      padding: '10px 14px',
      fontSize: 12,
      fontFamily: "'JetBrains Mono', monospace",
    }}>
      <p style={{ color: '#8b949e', marginBottom: 4 }}>Year {label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color, margin: 0 }}>
          {p.name}: {fmtINR(p.value)}
        </p>
      ))}
    </div>
  )
}

function DonutChart({ invested, returns }) {
  const total = invested + returns
  const data = [
    { name: 'Invested', value: invested },
    { name: 'Returns', value: returns },
  ]
  return (
    <div className="flex flex-col items-center">
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            dataKey="value"
            stroke="none"
          >
            {data.map((_, i) => (
              <Cell key={i} fill={DONUT_COLORS[i]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(val) => fmtINR(val)}
            contentStyle={{
              background: '#161d29',
              border: '1px solid #1c2333',
              borderRadius: 8,
              fontSize: 12,
              fontFamily: "'JetBrains Mono', monospace",
            }}
          />
          <Legend
            verticalAlign="bottom"
            iconType="circle"
            formatter={(val) => <span style={{ color: '#e6edf3', fontSize: 12 }}>{val}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
      <p className="text-center mt-1" style={{ color: '#8b949e', fontSize: 12 }}>
        Total: <span className="num" style={{ color: '#00d26a', fontWeight: 700 }}>{fmtINR(total)}</span>
      </p>
    </div>
  )
}

function YearlyBarChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1c2333" />
        <XAxis
          dataKey="year"
          tick={{ fill: '#8b949e', fontSize: 11 }}
          axisLine={{ stroke: '#1c2333' }}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: '#8b949e', fontSize: 11 }}
          axisLine={{ stroke: '#1c2333' }}
          tickLine={false}
          tickFormatter={(v) => {
            if (v >= 10000000) return `${(v / 10000000).toFixed(1)}Cr`
            if (v >= 100000) return `${(v / 100000).toFixed(1)}L`
            if (v >= 1000) return `${(v / 1000).toFixed(0)}K`
            return v
          }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          iconType="circle"
          formatter={(val) => <span style={{ color: '#e6edf3', fontSize: 12 }}>{val}</span>}
        />
        <Bar dataKey="invested" name="Invested" fill={BAR_COLORS.invested} radius={[3, 3, 0, 0]} />
        <Bar dataKey="returns" name="Returns" fill={BAR_COLORS.returns} radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

function ResultCard({ label, value, color = '#e6edf3' }) {
  return (
    <div className="card" style={{ padding: '16px 20px' }}>
      <p style={{ color: '#8b949e', fontSize: 12, marginBottom: 4 }}>{label}</p>
      <p className="num" style={{ color, fontSize: 22, fontWeight: 700, margin: 0 }}>
        {fmtINR(value)}
      </p>
    </div>
  )
}

function InputField({ label, value, onChange, min, max, step = 1, suffix }) {
  return (
    <div>
      <label style={{ color: '#8b949e', fontSize: 12, display: 'block', marginBottom: 6 }}>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        <input
          className="input"
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          min={min}
          max={max}
          step={step}
          style={{
            width: '100%',
            paddingRight: suffix ? 44 : 12,
            fontFamily: "'JetBrains Mono', monospace",
          }}
        />
        {suffix && (
          <span style={{
            position: 'absolute',
            right: 12,
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#484f58',
            fontSize: 13,
            pointerEvents: 'none',
          }}>
            {suffix}
          </span>
        )}
      </div>
    </div>
  )
}

/* ── Calculator Logic ───────────────────────────────── */

function useSIPCalc(monthly, rate, years) {
  return useMemo(() => {
    const r = rate / 100 / 12
    const n = years * 12
    const invested = monthly * n
    const maturity = monthly * ((Math.pow(1 + r, n) - 1) / r) * (1 + r)
    const returns = maturity - invested

    const yearlyData = []
    for (let y = 1; y <= years; y++) {
      const m = y * 12
      const inv = monthly * m
      const mat = monthly * ((Math.pow(1 + r, m) - 1) / r) * (1 + r)
      yearlyData.push({ year: `Y${y}`, invested: Math.round(inv), returns: Math.round(mat - inv) })
    }
    return { invested, returns: Math.round(returns), maturity: Math.round(maturity), yearlyData }
  }, [monthly, rate, years])
}

function useLumpsumCalc(principal, rate, years) {
  return useMemo(() => {
    const r = rate / 100
    const maturity = principal * Math.pow(1 + r, years)
    const returns = maturity - principal

    const yearlyData = []
    for (let y = 1; y <= years; y++) {
      const mat = principal * Math.pow(1 + r, y)
      yearlyData.push({ year: `Y${y}`, invested: principal, returns: Math.round(mat - principal) })
    }
    return { invested: principal, returns: Math.round(returns), maturity: Math.round(maturity), yearlyData }
  }, [principal, rate, years])
}

function useStepUpCalc(monthly, rate, years, stepUp) {
  return useMemo(() => {
    const r = rate / 100 / 12
    let totalInvested = 0
    let totalValue = 0
    let currentSIP = monthly
    const yearlyData = []

    for (let y = 1; y <= years; y++) {
      for (let m = 1; m <= 12; m++) {
        totalInvested += currentSIP
        totalValue = (totalValue + currentSIP) * (1 + r)
      }
      yearlyData.push({
        year: `Y${y}`,
        invested: Math.round(totalInvested),
        returns: Math.round(totalValue - totalInvested),
      })
      currentSIP = Math.round(currentSIP * (1 + stepUp / 100))
    }

    return {
      invested: Math.round(totalInvested),
      returns: Math.round(totalValue - totalInvested),
      maturity: Math.round(totalValue),
      yearlyData,
    }
  }, [monthly, rate, years, stepUp])
}

function useGoalCalc(target, rate, years) {
  return useMemo(() => {
    const r = rate / 100 / 12
    const n = years * 12
    const requiredSIP = target / (((Math.pow(1 + r, n) - 1) / r) * (1 + r))
    const invested = Math.round(requiredSIP) * n
    return {
      requiredSIP: Math.round(requiredSIP),
      invested,
      returns: Math.round(target - invested),
      maturity: target,
    }
  }, [target, rate, years])
}

/* ── Tab Panels ─────────────────────────────────────── */

function SIPPanel() {
  const [monthly, setMonthly] = useState(10000)
  const [rate, setRate] = useState(12)
  const [years, setYears] = useState(10)
  const result = useSIPCalc(monthly, rate, years)

  return (
    <div style={{ display: 'grid', gap: 24 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
        <InputField label="Monthly Investment" value={monthly} onChange={setMonthly} min={500} step={500} suffix="₹" />
        <InputField label="Expected Return (p.a.)" value={rate} onChange={setRate} min={1} max={30} step={0.5} suffix="%" />
        <InputField label="Time Period" value={years} onChange={setYears} min={1} max={40} suffix="yr" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
        <ResultCard label="Total Invested" value={result.invested} color="#58a6ff" />
        <ResultCard label="Estimated Returns" value={result.returns} color="#00d26a" />
        <ResultCard label="Maturity Amount" value={result.maturity} color="#ffa726" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div className="card" style={{ padding: 16 }}>
          <p style={{ color: '#8b949e', fontSize: 12, marginBottom: 12 }}>Yearly Breakdown</p>
          <YearlyBarChart data={result.yearlyData} />
        </div>
        <div className="card" style={{ padding: 16 }}>
          <p style={{ color: '#8b949e', fontSize: 12, marginBottom: 12 }}>Investment vs Returns</p>
          <DonutChart invested={result.invested} returns={result.returns} />
        </div>
      </div>
    </div>
  )
}

function LumpsumPanel() {
  const [principal, setPrincipal] = useState(500000)
  const [rate, setRate] = useState(12)
  const [years, setYears] = useState(10)
  const result = useLumpsumCalc(principal, rate, years)

  return (
    <div style={{ display: 'grid', gap: 24 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
        <InputField label="One-Time Investment" value={principal} onChange={setPrincipal} min={1000} step={10000} suffix="₹" />
        <InputField label="Expected Return (p.a.)" value={rate} onChange={setRate} min={1} max={30} step={0.5} suffix="%" />
        <InputField label="Time Period" value={years} onChange={setYears} min={1} max={40} suffix="yr" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
        <ResultCard label="Total Invested" value={result.invested} color="#58a6ff" />
        <ResultCard label="Estimated Returns" value={result.returns} color="#00d26a" />
        <ResultCard label="Maturity Amount" value={result.maturity} color="#ffa726" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div className="card" style={{ padding: 16 }}>
          <p style={{ color: '#8b949e', fontSize: 12, marginBottom: 12 }}>Yearly Growth</p>
          <YearlyBarChart data={result.yearlyData} />
        </div>
        <div className="card" style={{ padding: 16 }}>
          <p style={{ color: '#8b949e', fontSize: 12, marginBottom: 12 }}>Investment vs Returns</p>
          <DonutChart invested={result.invested} returns={result.returns} />
        </div>
      </div>
    </div>
  )
}

function StepUpPanel() {
  const [monthly, setMonthly] = useState(10000)
  const [rate, setRate] = useState(12)
  const [years, setYears] = useState(10)
  const [stepUp, setStepUp] = useState(10)
  const result = useStepUpCalc(monthly, rate, years, stepUp)

  return (
    <div style={{ display: 'grid', gap: 24 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
        <InputField label="Starting Monthly SIP" value={monthly} onChange={setMonthly} min={500} step={500} suffix="₹" />
        <InputField label="Expected Return (p.a.)" value={rate} onChange={setRate} min={1} max={30} step={0.5} suffix="%" />
        <InputField label="Time Period" value={years} onChange={setYears} min={1} max={40} suffix="yr" />
        <InputField label="Annual Step-Up" value={stepUp} onChange={setStepUp} min={1} max={50} suffix="%" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
        <ResultCard label="Total Invested" value={result.invested} color="#58a6ff" />
        <ResultCard label="Estimated Returns" value={result.returns} color="#00d26a" />
        <ResultCard label="Maturity Amount" value={result.maturity} color="#ffa726" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div className="card" style={{ padding: 16 }}>
          <p style={{ color: '#8b949e', fontSize: 12, marginBottom: 12 }}>Yearly Breakdown (with Step-Up)</p>
          <YearlyBarChart data={result.yearlyData} />
        </div>
        <div className="card" style={{ padding: 16 }}>
          <p style={{ color: '#8b949e', fontSize: 12, marginBottom: 12 }}>Investment vs Returns</p>
          <DonutChart invested={result.invested} returns={result.returns} />
        </div>
      </div>
    </div>
  )
}

function GoalPanel() {
  const [target, setTarget] = useState(10000000)
  const [rate, setRate] = useState(12)
  const [years, setYears] = useState(15)
  const result = useGoalCalc(target, rate, years)

  const goalYearlyData = useMemo(() => {
    const r = rate / 100 / 12
    const monthly = result.requiredSIP
    const data = []
    for (let y = 1; y <= years; y++) {
      const m = y * 12
      const inv = monthly * m
      const mat = monthly * ((Math.pow(1 + r, m) - 1) / r) * (1 + r)
      data.push({ year: `Y${y}`, invested: Math.round(inv), returns: Math.round(mat - inv) })
    }
    return data
  }, [result.requiredSIP, rate, years])

  return (
    <div style={{ display: 'grid', gap: 24 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
        <InputField label="Target Corpus" value={target} onChange={setTarget} min={100000} step={100000} suffix="₹" />
        <InputField label="Expected Return (p.a.)" value={rate} onChange={setRate} min={1} max={30} step={0.5} suffix="%" />
        <InputField label="Timeline" value={years} onChange={setYears} min={1} max={40} suffix="yr" />
      </div>

      <div className="card" style={{
        padding: '20px 24px',
        border: '1px solid #00d26a33',
        background: 'linear-gradient(135deg, #00d26a0a, #0d1117)',
      }}>
        <p style={{ color: '#8b949e', fontSize: 12, marginBottom: 4 }}>Required Monthly SIP</p>
        <p className="num" style={{ color: '#00d26a', fontSize: 32, fontWeight: 700, margin: 0 }}>
          {fmtINR(result.requiredSIP)}
        </p>
        <p style={{ color: '#484f58', fontSize: 12, marginTop: 6 }}>
          to reach {fmtINR(target)} in {years} years at {rate}% p.a.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
        <ResultCard label="Total Investment Needed" value={result.invested} color="#58a6ff" />
        <ResultCard label="Wealth Gain" value={result.returns} color="#00d26a" />
        <ResultCard label="Target Corpus" value={result.maturity} color="#ffa726" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div className="card" style={{ padding: 16 }}>
          <p style={{ color: '#8b949e', fontSize: 12, marginBottom: 12 }}>Path to Goal</p>
          <YearlyBarChart data={goalYearlyData} />
        </div>
        <div className="card" style={{ padding: 16 }}>
          <p style={{ color: '#8b949e', fontSize: 12, marginBottom: 12 }}>Investment vs Returns</p>
          <DonutChart invested={result.invested} returns={result.returns} />
        </div>
      </div>
    </div>
  )
}

/* ── Main Component ─────────────────────────────────── */

export default function SIPCalculator() {
  const [activeTab, setActiveTab] = useState('sip')

  return (
    <div style={{ padding: '24px 32px', maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ color: '#e6edf3', fontSize: 22, fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Calculator style={{ width: 22, height: 22, color: '#00d26a' }} />
          Investment Calculators
        </h1>
        <p style={{ color: '#484f58', fontSize: 13, marginTop: 4 }}>
          Plan your investments with SIP, Lumpsum, Step-Up SIP and Goal-based calculators
        </p>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: 4,
        marginBottom: 28,
        borderBottom: '1px solid #1c2333',
        paddingBottom: 0,
      }}>
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={activeTab === key ? 'btn-primary' : 'btn-terminal'}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '10px 18px',
              fontSize: 13,
              fontWeight: 600,
              borderRadius: '8px 8px 0 0',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s',
              ...(activeTab === key
                ? { background: '#00d26a', color: '#060a13' }
                : { background: 'transparent', color: '#8b949e' }),
            }}
          >
            <Icon style={{ width: 15, height: 15 }} />
            {label}
          </button>
        ))}
      </div>

      {/* Active Panel */}
      {activeTab === 'sip' && <SIPPanel />}
      {activeTab === 'lumpsum' && <LumpsumPanel />}
      {activeTab === 'stepup' && <StepUpPanel />}
      {activeTab === 'goal' && <GoalPanel />}
    </div>
  )
              }
