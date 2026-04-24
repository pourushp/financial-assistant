import { useEffect, useState } from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { getIndices, fmt, fmtPct } from '../../utils/api'

function TickerItem({ item }) {
  const up = (item.change_pct ?? 0) >= 0
  return (
    <div className="inline-flex items-center gap-3 px-5 py-1.5 border-r border-[var(--border)]">
      <span className="text-[var(--text-muted)] text-xs font-semibold tracking-wide">{item.name}</span>
      <span className="num text-sm font-bold text-[var(--text-primary)]">{fmt(item.price, 2)}</span>
      <span className={`inline-flex items-center gap-0.5 num text-xs font-bold ${up ? 'up' : 'down'}`}>
        {up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
        {fmtPct(item.change_pct)}
      </span>
    </div>
  )
}

export default function TickerTape() {
  const [indices, setIndices] = useState([])

  useEffect(() => {
    getIndices().then(r => setIndices(r.data)).catch(() => {})
    const interval = setInterval(() => {
      getIndices().then(r => setIndices(r.data)).catch(() => {})
    }, 60000)
    return () => clearInterval(interval)
  }, [])

  if (indices.length === 0) {
    return (
      <div className="ticker-tape h-9 flex items-center px-4">
        <div className="flex items-center gap-2">
          <div className="pulse-dot bg-[var(--neon-blue)]" />
          <span className="text-xs text-[var(--text-muted)] font-mono">LOADING MARKET DATA...</span>
        </div>
      </div>
    )
  }

  // Duplicate for seamless scroll
  const items = [...indices, ...indices]

  return (
    <div className="ticker-tape h-9 flex items-center">
      <div className="ticker-scroll">
        {items.map((idx, i) => (
          <TickerItem key={`${idx.symbol}-${i}`} item={idx} />
        ))}
      </div>
    </div>
  )
}
