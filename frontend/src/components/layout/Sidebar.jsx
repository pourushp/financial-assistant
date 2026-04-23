import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, TrendingUp, Briefcase, BarChart3,
  PieChart, Bot, Newspaper, Calculator, IndianRupee, X
} from 'lucide-react'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, shortcut: 'D' },
  { to: '/markets', label: 'Markets', icon: TrendingUp, shortcut: 'M' },
  { to: '/portfolio', label: 'Portfolio', icon: Briefcase, shortcut: 'P' },
  { to: '/earnings', label: 'Earnings', icon: BarChart3, shortcut: 'E' },
  { to: '/mutual-funds', label: 'Mutual Funds', icon: PieChart, shortcut: 'F' },
  { to: '/sip-calculator', label: 'SIP Calculator', icon: Calculator, shortcut: 'S' },
  { to: '/news', label: 'News', icon: Newspaper, shortcut: 'N' },
  { to: '/assistant', label: 'AI Assistant', icon: Bot, shortcut: 'A' },
]

export default function Sidebar({ open, onClose }) {
  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed md:sticky top-0 left-0 z-50 md:z-auto
        w-60 md:w-56 shrink-0 h-screen
        flex flex-col
        transition-transform duration-300 ease-in-out
        ${open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `} style={{ background: 'var(--bg-card)', borderRight: '1px solid var(--border)' }}>
        {/* Logo */}
        <div className="px-4 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #1a6dff 0%, #0050cc 100%)' }}>
              <IndianRupee className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="font-bold text-sm text-white tracking-tight">FinBot</div>
              <div className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-widest">Terminal</div>
            </div>
          </div>
          <button className="md:hidden p-1 text-[var(--text-muted)] hover:text-white" onClick={onClose}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Market Status */}
        <div className="px-4 py-2.5" style={{ borderBottom: '1px solid var(--border)' }}>
          <MarketStatus />
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
          {navItems.map(({ to, label, icon: Icon, shortcut }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 group ${
                  isActive
                    ? 'text-[var(--neon-blue)]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`
              }
              style={({ isActive }) => isActive ? {
                background: 'rgba(88, 166, 255, 0.08)',
                boxShadow: 'inset 3px 0 0 var(--neon-blue)',
              } : { background: 'transparent' }}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="flex-1">{label}</span>
              <kbd className="hidden md:inline text-[10px] font-mono px-1.5 py-0.5 rounded text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)' }}>
                {shortcut}
              </kbd>
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-4 py-3" style={{ borderTop: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2 text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider">
            <div className="w-1.5 h-1.5 rounded-full bg-[var(--neon-green)]" />
            Live Data
          </div>
          <p className="text-[10px] text-[var(--text-muted)] mt-1 font-mono">
            Yahoo · CoinGecko · AMFI
          </p>
        </div>
      </aside>
    </>
  )
}

function MarketStatus() {
  const now = new Date()
  const ist = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }))
  const hours = ist.getHours()
  const mins = ist.getMinutes()
  const day = ist.getDay()
  const isWeekday = day >= 1 && day <= 5
  const timeNum = hours * 100 + mins
  const isOpen = isWeekday && timeNum >= 915 && timeNum <= 1530

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className={`pulse-dot ${isOpen ? 'bg-[var(--neon-green)] text-[var(--neon-green)]' : 'bg-[var(--neon-red)] text-[var(--neon-red)]'}`} />
        <span className="text-xs font-mono font-semibold" style={{ color: isOpen ? 'var(--neon-green)' : 'var(--neon-red)' }}>
          NSE {isOpen ? 'OPEN' : 'CLOSED'}
        </span>
      </div>
      <span className="text-[10px] font-mono text-[var(--text-muted)]">
        IST {ist.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false })}
      </span>
    </div>
  )
}
