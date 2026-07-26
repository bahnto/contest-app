import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import MusicPlayer from '../components/MusicPlayer.jsx'
import { playReveal } from '../lib/sounds.js'
import '../styles/participant.css'

export default function Results() {
  const { contestId } = useParams()
  const navigate = useNavigate()
  const participantName = sessionStorage.getItem(`participant_${contestId}`)
  const [contest, setContest] = useState(null)
  const [categories, setCategories] = useState([])
  const [entries, setEntries] = useState([])
  const [votes, setVotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    if (!participantName) { navigate(`/contest/${contestId}`); return }
    fetchAll()
  }, [contestId])

  useEffect(() => {
    if (!loading && contest?.phase === 'results' && !revealed) {
      setRevealed(true)
      setTimeout(() => playReveal(), 400)
    }
  }, [loading])

  async function fetchAll() {
    setLoading(true)
    const [contestRes, catsRes, entriesRes, votesRes] = await Promise.all([
      supabase.from('contests').select('*').eq('id', contestId).single(),
      supabase.from('categories').select('*').eq('contest_id', contestId).order('created_at'),
      supabase.from('entries').select('*').eq('contest_id', contestId),
      supabase.from('votes').select('*').eq('contest_id', contestId),
    ])
    if (contestRes.data) setContest(contestRes.data)
    if (catsRes.data) setCategories(catsRes.data)
    if (entriesRes.data) setEntries(entriesRes.data)
    if (votesRes.data) setVotes(votesRes.data)
    setLoading(false)
  }

  if (loading) return <div className="p-console"><div className="p-grid-bg" /><div className="p-loading">LOADING...</div></div>
  if (!contest) return <div className="p-console"><div className="p-grid-bg" /><div className="p-loading">NOT FOUND</div></div>

  if (contest.phase !== 'results') return (
    <div className="p-console">
      <div className="p-grid-bg" />
      <div style={{ maxWidth: 480, margin: '2rem auto', padding: '0 1rem', position: 'relative', zIndex: 1 }}>
        <div className="p-notice p-notice-warn">⚠ Results not yet released.</div>
        <button className="p-back" onClick={() => navigate(`/contest/${contestId}/play`)}>◀ BACK</button>
      </div>
    </div>
  )

  return (
    <div className="p-console">
      <div className="p-grid-bg" />
      <div className="p-topbar">
        <div className="p-topbar-title">Final Results</div>
        <div className="p-topbar-right">
          <div className="p-leds">
            <div className="p-led p-led-g" />
            <div className="p-led p-led-o" />
            <div className="p-led p-led-b" />
          </div>
          <div className="p-topbar-status">TRANSMISSION COMPLETE</div>
        </div>
      </div>

      <div className="p-layout">
        <div className="p-panel p-panel-cut-tr p-left">
          <div className="p-panel-header">
            <div className="p-panel-dot" />
            <div className="p-panel-title">Contest</div>
          </div>
          <div className="p-contest-name">{contest.name}</div>
          <div className="p-status-pill results">RESULTS RELEASED</div>
          <div className="p-sys-info">
            <div className="p-sys-row"><span>Categories</span><span style={{ color: '#7799bb' }}>{categories.length}</span></div>
            <div className="p-sys-row"><span>Entries</span><span style={{ color: '#7799bb' }}>{entries.length}</span></div>
            <div className="p-sys-row hi"><span>Status</span><span>FINAL</span></div>
          </div>
          <div className="p-nav">
            <button className="p-back" onClick={() => navigate(`/contest/${contestId}/play`)}>◀ BACK</button>
          </div>
        </div>

        <div className="p-panel p-panel-cut-both" style={{ gridColumn: 2, gridRow: 1, overflowY: 'auto' }}>
          <div className="p-panel-header">
            <div className="p-panel-dot" />
            <div className="p-panel-title">Final Results — {contest.name}</div>
          </div>
          <div style={{ padding: '8px 10px' }}>
            {categories.map(cat => {
              const catVotes = votes.filter(v => v.category_id === cat.id)
              const voteCounts = {}
              entries.forEach(e => { voteCounts[e.id] = 0 })
              catVotes.forEach(v => { if (voteCounts[v.entry_id] !== undefined) voteCounts[v.entry_id]++ })
              const sorted = [...entries].sort((a, b) => (voteCounts[b.id] || 0) - (voteCounts[a.id] || 0))
              const maxVotes = Math.max(...Object.values(voteCounts), 1)

              return (
                <div key={cat.id} style={{ marginBottom: '1.5rem' }}>
                  <div style={{ fontSize: '9px', color: '#00ffee', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '8px', paddingBottom: '4px', borderBottom: '1px solid var(--border)' }}>
                    ▶ {cat.name}
                  </div>
                  {sorted.map((entry, i) => {
                    const count = voteCounts[entry.id] || 0
                    const pct = Math.round((count / maxVotes) * 100)
                    const isWinner = i === 0 && count > 0
                    return (
                      <div key={entry.id} className="p-result-row">
                        <div className={`p-result-label ${isWinner ? 'winner' : ''}`}>
                          <span>{isWinner ? '◆ ' : ''}{entry.author_name.toUpperCase()}</span>
                          <span style={{ color: 'var(--text-muted)' }}>{count} VOTE{count !== 1 ? 'S' : ''}</span>
                        </div>
                        <div className="p-result-bg">
                          <div className={`p-result-fill ${isWinner ? 'winner' : ''}`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>

        <div className="p-panel p-panel-cut-tl p-right">
          <MusicPlayer />
        </div>

        <div className="p-bottom-row">
          <div className="p-mini p-panel-cut-tr">
            <div className="p-mini-label">Contest</div>
            <div className="p-mini-value" style={{ fontSize: '9px' }}>FINAL</div>
          </div>
          <div className="p-mini">
            <div className="p-mini-label">Total votes</div>
            <div className="p-mini-value">{votes.length}</div>
          </div>
          <div className="p-mini p-panel-cut-tl">
            <div className="p-mini-label">Entries</div>
            <div className="p-mini-value">{entries.length}</div>
          </div>
        </div>
      </div>

      <div className="p-bottombar">
        <span>CONTEST-APP v2.0</span>
        <span>◆ TRANSMISSION COMPLETE ◆</span>
        <span>2025</span>
      </div>
    </div>
  )
}