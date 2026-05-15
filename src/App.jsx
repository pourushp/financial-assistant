import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import { Menu } from 'lucide-react'
import { useAuth } from './contexts/AuthContext'
import Sidebar from './components/layout/Sidebar'
import TickerTape from './components/layout/TickerTape'
import Dashboard from './components/pages/Dashboard'
import Markets from './components/pages/Markets'
import Portfolio from './components/pages/Portfolio'
import Earnings from './components/pages/Earnings'
import MutualFunds from './components/pages/MutualFunds'
import SIPCalculator from './components/pages/SIPCalculator'
import NewsPage from './components/pages/NewsPage'
import AIAssistant from './components/pages/AIAssistant'
import Auth from './components/pages/Auth'
import Watchlist from './components/pages/Watchlist'
import Alerts from './components/pages/Alerts'

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user } = useAuth()

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <TickerTape />

        <div className="md:hidden flex items-center gap-3 px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
          <button onClick={() => setSidebarOpen(true)} className="p-1.5 rounded-lg" style={{ background: 'var(--bg-elevated)' }}>
            <Menu className="w-5 h-5 text-[var(--text-secondary)]" />
          </button>
          <span className="text-sm font-bold text-white">FinBot Terminal</span>
        </div>

        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/markets" element={<Markets />} />
            <Route path="/portfolio" element={<Portfolio />} />
            <Route path="/earnings" element={<Earnings />} />
            <Route path="/mutual-funds" element={<MutualFunds />} />
            <Route path="/sip-calculator" element={<SIPCalculator />} />
            <Route path="/news" element={<NewsPage />} />
            <Route path="/assistant" element={<AIAssistant />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/watchlist" element={<Watchlist />} />
            <Route path="/alerts" element={<Alerts />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}
