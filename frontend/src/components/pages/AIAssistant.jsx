import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Key, RefreshCw, Lightbulb, AlertCircle, ChevronDown, Terminal } from 'lucide-react'
import { sendChatMessage, getSuggestedQuestions } from '../../utils/api'

function Message({ msg }) {
  const isUser = msg.role === 'user'
  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
        isUser ? '' : ''
      }`} style={{ background: isUser ? 'var(--neon-blue)' : 'var(--neon-green)', opacity: 0.9 }}>
        {isUser ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-white" />}
      </div>
      <div className={`max-w-[75%] rounded-xl px-4 py-3 text-sm leading-relaxed ${isUser ? 'rounded-tr-sm' : 'rounded-tl-sm'}`}
        style={{
          background: isUser ? 'rgba(88,166,255,0.12)' : 'var(--bg-elevated)',
          border: `1px solid ${isUser ? 'rgba(88,166,255,0.2)' : 'var(--border)'}`,
          color: 'var(--text-primary)'
        }}>
        {msg.content.split('\n').map((line, i) => (
          <span key={i}>{line}{i < msg.content.split('\n').length - 1 && <br />}</span>
        ))}
      </div>
    </div>
  )
}

export default function AIAssistant() {
  const [apiKey, setApiKey] = useState(() => {
    try { return localStorage.getItem('anthropic_api_key') || '' } catch { return '' }
  })
  const [keyInput, setKeyInput] = useState('')
  const [keySet, setKeySet] = useState(false)
  const [messages, setMessages] = useState([{
    role: 'assistant',
    content: 'Namaste! I\'m FinBot, your personal finance assistant for Indian markets.\n\nI can help with:\n\u2022 Stock analysis & NSE/BSE queries\n\u2022 Mutual fund selection & SIP planning\n\u2022 Tax saving (80C, ELSS, NPS)\n\u2022 Portfolio strategy & asset allocation\n\u2022 Personal finance planning\n\nWhat would you like to know?'
  }])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [suggestedQs, setSuggestedQs] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [error, setError] = useState(null)
  const bottomRef = useRef()
  const inputRef = useRef()

  useEffect(() => {
    try { if (localStorage.getItem('anthropic_api_key')) setKeySet(true) } catch {}
    getSuggestedQuestions().then(r => setSuggestedQs(r.data)).catch(() => {})
  }, [])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const saveKey = () => {
    if (!keyInput.trim()) return
    try { localStorage.setItem('anthropic_api_key', keyInput.trim()) } catch {}
    setApiKey(keyInput.trim()); setKeySet(true); setKeyInput('')
  }

  const removeKey = () => {
    try { localStorage.removeItem('anthropic_api_key') } catch {}
    setApiKey(''); setKeySet(false)
  }

  const send = async (text) => {
    const msg = (text || input).trim()
    if (!msg || loading) return
    setInput(''); setError(null)
    const userMsg = { role: 'user', content: msg }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages); setLoading(true)
    try {
      const r = await sendChatMessage(newMessages.slice(-10), apiKey)
      setMessages(prev => [...prev, { role: 'assistant', content: r.data.response }])
    } catch (e) {
      setError(e.response?.data?.detail || 'Something went wrong.')
      setMessages(prev => prev.slice(0, -1))
    }
    setLoading(false); inputRef.current?.focus()
  }

  if (!keySet) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[80vh]">
        <div className="card max-w-md w-full space-y-5">
          <div className="text-center">
            <div className="w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4"
              style={{ background: 'linear-gradient(135deg, var(--neon-green), #00a050)' }}>
              <Bot className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-lg font-bold text-white">Set Up AI Assistant</h2>
            <p className="text-sm text-[var(--text-secondary)] mt-1">FinBot uses Claude (Anthropic) for intelligent financial guidance.</p>
          </div>
          <div className="space-y-3">
            <div className="flex gap-2">
              <input type="password" className="input flex-1 font-mono" placeholder="sk-ant-api03-..."
                value={keyInput} onChange={e => setKeyInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && saveKey()} />
              <button className="btn-primary flex items-center gap-2" onClick={saveKey}><Key className="w-4 h-4" /> Save</button>
            </div>
            <p className="text-[10px] font-mono text-[var(--text-muted)]">
              Key stored locally in your browser only. Get yours at{' '}
              <a href="https://console.anthropic.com" target="_blank" rel="noopener noreferrer" className="text-[var(--neon-blue)] hover:underline">console.anthropic.com</a>
            </p>
          </div>
          <div className="rounded-xl p-4" style={{ background: 'var(--bg-elevated)' }}>
            <p className="text-[10px] font-mono font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-2">Capabilities</p>
            <div className="grid grid-cols-2 gap-1.5">
              {['SIP Planning', 'ELSS & 80C', 'Portfolio Review', 'Stock Analysis', 'MF Comparison', 'Tax Saving'].map(item => (
                <div key={item} className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--neon-blue)' }} />{item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full" style={{ minHeight: 'calc(100vh - 36px)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 md:px-6 py-3" style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--neon-green)' }}>
            <Bot className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">FinBot</h2>
            <p className="text-[10px] font-mono text-[var(--text-muted)]">INDIA FINANCE ASSISTANT \u00B7 CLAUDE</p>
          </div>
          <div className="pulse-dot bg-[var(--neon-green)] text-[var(--neon-green)] ml-2" />
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-terminal flex items-center gap-1.5" onClick={() => setShowSuggestions(s => !s)}>
            <Lightbulb className="w-3 h-3" /> Tips
            <ChevronDown className={`w-3 h-3 transition-transform ${showSuggestions ? 'rotate-180' : ''}`} />
          </button>
          <button className="btn-terminal" onClick={removeKey}>Key</button>
          <button className="btn-terminal" onClick={() => setMessages([{
            role: 'assistant', content: 'New conversation. How can I help with your finances?'
          }])}>New</button>
        </div>
      </div>

      {/* Suggestions */}
      {showSuggestions && (
        <div className="px-4 md:px-6 py-3 grid grid-cols-1 md:grid-cols-2 gap-1.5" style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)' }}>
          {suggestedQs.slice(0, 6).map((q, i) => (
            <button key={i} onClick={() => { send(q); setShowSuggestions(false) }}
              className="text-left text-xs p-2 rounded-lg truncate transition-colors font-mono"
              style={{ color: 'var(--neon-blue)', background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--neon-blue)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>{q}</button>
          ))}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 space-y-4">
        {messages.map((msg, i) => <Message key={i} msg={msg} />)}
        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'var(--neon-green)' }}>
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="rounded-xl rounded-tl-sm px-4 py-3" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
              <div className="flex gap-1.5 items-center h-5">
                <div className="w-1.5 h-1.5 rounded-full animate-bounce [animation-delay:0ms]" style={{ background: 'var(--neon-green)' }} />
                <div className="w-1.5 h-1.5 rounded-full animate-bounce [animation-delay:150ms]" style={{ background: 'var(--neon-green)' }} />
                <div className="w-1.5 h-1.5 rounded-full animate-bounce [animation-delay:300ms]" style={{ background: 'var(--neon-green)' }} />
              </div>
            </div>
          </div>
        )}
        {error && (
          <div className="flex items-start gap-2 rounded-lg p-3 mx-auto max-w-lg" style={{ background: 'rgba(255,59,59,0.08)', border: '1px solid var(--neon-red)' }}>
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'var(--neon-red)' }} />
            <p className="text-sm" style={{ color: 'var(--neon-red)' }}>{error}</p>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 md:px-6 py-4" style={{ background: 'var(--bg-card)', borderTop: '1px solid var(--border)' }}>
        <div className="flex gap-3 items-end max-w-4xl mx-auto">
          <textarea ref={inputRef} className="input flex-1 resize-none" rows={1}
            placeholder="Ask about stocks, mutual funds, SIPs, tax planning..."
            value={input}
            onChange={e => { setInput(e.target.value); e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px' }}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }} />
          <button className="btn-primary h-10 w-10 flex items-center justify-center shrink-0 rounded-xl"
            onClick={() => send()} disabled={loading || !input.trim()}>
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  )
}
