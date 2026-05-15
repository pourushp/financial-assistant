import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { Bell, Plus, Trash2, ArrowUp, ArrowDown, Search, X, Check } from 'lucide-react'
import { searchStocks, fmt } from '../../utils/api'

export default function Alerts() {
  const { user } = useAuth()
  const [alerts, setAlerts] = useState([])
  const [showAdd, setShowAdd] = useState(false)
  const [search, setSearch] = useState('')
  const [results, setResults] = useState([])
  const [selectedSymbol, setSelectedSymbol] = useState('')
  const [targetPrice, setTargetPrice] = useState('')
  const [direction, setDirection] = useState('above')

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('finbot_alerts') || '[]')
    setAlerts(saved)
  }, [])

  const saveAlerts = (list) => { setAlerts(list); localStorage.setItem('finbot_alerts', JSON.stringify(list)) }

  const handleSearch = async (q) => {
    setSearch(q)
    if (q.length < 2) { setResults([]); return }
    try { const res = await searchStocks(q); setResults(res.data || []) } catch { setResults([]) }
  }

  const addAlert = () => {
    if (!selectedSymbol || !targetPrice) return
    const newAlert = { id: Date.now(), symbol: selectedSymbol, targetPrice: parseFloat(targetPrice), direction, active: true, createdAt: new Date().toISOString() }
    saveAlerts([...alerts, newAlert])
    setShowAdd(false); setSelectedSymbol(''); setTargetPrice(''); setSearch(''); setResults([])
  }

  const removeAlert = (id) => saveAlerts(alerts.filter(a => a.id !== id))
  const toggleAlert = (id) => saveAlerts(alerts.map(a => a.id === id ? { ...a, active: !a.active } : a))

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Bell className="w-5 h-5 text-amber-500" /> Price Alerts
          </h1>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{alerts.filter(a => a.active).length} active alerts</p>
        </div>
        <button onClick={() => setShowAdd(!showAdd)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors">
          <Plus className="w-4 h-4" /> New Alert
        </button>
      </div>

      {showAdd && (
        <div className="mb-4 p-4 rounded-xl space-y-3" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input type="text" placeholder="Search stock..." value={search} onChange={e => handleSearch(e.target.value)} autoFocus
              className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-emerald-500/50"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }} />
          </div>
          {results.length > 0 && !selectedSymbol && (
            <div className="space-y-1">
              {results.map(r => (
                <button key={r.symbol} onClick={() => { setSelectedSymbol(r.symbol); setResults([]) }}
                  className="w-full flex items-center justify-between p-2 rounded-lg text-sm hover:bg-white/5 transition-colors">
                  <span className="text-white font-medium">{r.symbol}</span>
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>₹{fmt(r.price)}</span>
                </button>
              ))}
            </div>
          )}
          {selectedSymbol && (
            <>
              <div className="flex items-center gap-2">
                <span className="text-sm text-white font-medium px-3 py-1.5 rounded-lg" style={{ background: 'var(--bg-elevated)' }}>{selectedSymbol}</span>
                <button onClick={() => setSelectedSymbol('')} className="text-gray-500 hover:text-white"><X className="w-4 h-4" /></button>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setDirection('above')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-colors ${direction === 'above' ? 'bg-emerald-600 text-white' : 'text-gray-400'}`}
                  style={direction !== 'above' ? { background: 'var(--bg-elevated)' } : {}}>
                  <ArrowUp className="w-3.5 h-3.5" /> Goes above
                </button>
                <button onClick={() => setDirection('below')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-colors ${direction === 'below' ? 'bg-red-600 text-white' : 'text-gray-400'}`}
                  style={direction !== 'below' ? { background: 'var(--bg-elevated)' } : {}}>
                  <ArrowDown className="w-3.5 h-3.5" /> Goes below
                </button>
              </div>
              <input type="number" placeholder="Target price (₹)" value={targetPrice} onChange={e => setTargetPrice(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg text-sm text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-emerald-500/50"
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }} />
              <button onClick={addAlert} className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-colors">
                Create Alert
              </button>
            </>
          )}
        </div>
      )}

      <div className="space-y-2">
        {alerts.length === 0 && (
          <div className="text-center py-12 rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <Bell className="w-10 h-10 mx-auto mb-3 text-gray-600" />
            <p className="text-sm text-gray-400">No alerts yet. Create one to get notified when a stock hits your target price.</p>
          </div>
        )}
        {alerts.map(alert => (
          <div key={alert.id} className={`flex items-center gap-4 p-4 rounded-xl transition-opacity ${alert.active ? '' : 'opacity-50'}`}
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${alert.direction === 'above' ? 'bg-emerald-600/20' : 'bg-red-600/20'}`}>
              {alert.direction === 'above' ? <ArrowUp className="w-4 h-4 text-emerald-500" /> : <ArrowDown className="w-4 h-4 text-red-500" />}
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-white">{alert.symbol.replace('.NS', '')}</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {alert.direction === 'above' ? 'Above' : 'Below'} ₹{fmt(alert.targetPrice)}
              </p>
            </div>
            <button onClick={() => toggleAlert(alert.id)} className={`p-1.5 rounded-lg ${alert.active ? 'bg-emerald-600/20 text-emerald-500' : 'bg-gray-700/50 text-gray-500'}`}>
              <Check className="w-4 h-4" />
            </button>
            <button onClick={() => removeAlert(alert.id)} className="p-1.5 rounded-lg hover:bg-red-500/20 text-gray-500 hover:text-red-400 transition-colors">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
          }
