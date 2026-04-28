import { useState, useEffect } from 'react'
import { ExternalLink, RefreshCw, Newspaper, Globe } from 'lucide-react'
import { getIndiaNews, getWorldNews } from '../../utils/api'

function NewsCard({ article }) {
  return (
    <a href={article.link} target="_blank" rel="noopener noreferrer"
      className="flex flex-col gap-2 p-4 rounded-xl transition-all group"
      style={{ border: '1px solid var(--border)', background: 'var(--bg-card)' }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-hover)'; e.currentTarget.style.background = 'var(--bg-card-hover)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg-card)' }}>
      <div className="flex items-center gap-2">
        <span className="badge-cyan">{article.category}</span>
        <span className="text-[10px] font-mono text-[var(--text-muted)]">{article.source}</span>
        <ExternalLink className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--text-muted)' }} />
      </div>
      <h3 className="text-sm font-medium leading-snug line-clamp-3 text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors">
        {article.title}
      </h3>
      {article.summary && <p className="text-xs line-clamp-2 text-[var(--text-muted)]">{article.summary}</p>}
      {article.published && <p className="text-[10px] font-mono text-[var(--text-muted)]">{article.published}</p>}
    </a>
  )
}

export default function NewsPage() {
  const [tab, setTab] = useState('india')
  const [indiaNews, setIndiaNews] = useState([])
  const [worldNews, setWorldNews] = useState([])
  const [loading, setLoading] = useState(false)

  const load = async (which = tab) => {
    setLoading(true)
    try {
      if (which === 'india' || which === 'all') { const r = await getIndiaNews(30); setIndiaNews(r.data) }
      if (which === 'world' || which === 'all') { const r = await getWorldNews(30); setWorldNews(r.data) }
    } catch (e) {}
    setLoading(false)
  }

  useEffect(() => {
    load()
    const interval = setInterval(() => load(), 60_000) // refresh news every 60s
    return () => clearInterval(interval)
  }, [])
  useEffect(() => { load(tab) }, [tab])

  const articles = tab === 'india' ? indiaNews : worldNews

  return (
    <div className="p-4 md:p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Newspaper className="w-5 h-5 text-[var(--neon-cyan)]" />
          <h1 className="text-lg font-bold text-white">News Feed</h1>
        </div>
        <button onClick={() => load()} disabled={loading} className="btn-secondary flex items-center gap-2 text-xs">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />Refresh
        </button>
      </div>

      <div className="flex gap-1.5" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
        <button onClick={() => setTab('india')} className={`btn-terminal flex items-center gap-1.5 ${tab === 'india' ? 'active' : ''}`}>
          <Newspaper className="w-3.5 h-3.5" /> India
        </button>
        <button onClick={() => setTab('world')} className={`btn-terminal flex items-center gap-1.5 ${tab === 'world' ? 'active' : ''}`}>
          <Globe className="w-3.5 h-3.5" /> Global
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {[...Array(9)].map((_, i) => <div key={i} className="skeleton h-32 rounded-xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {articles.map((a, i) => <NewsCard key={i} article={a} />)}
        </div>
      )}

      {!loading && articles.length === 0 && (
        <div className="text-center py-16 text-[var(--text-muted)]">
          <Newspaper className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No articles found</p>
        </div>
      )}
    </div>
  )
}
