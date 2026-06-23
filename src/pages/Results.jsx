import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'

export default function Results() {
  const { contestId } = useParams()
  const navigate = useNavigate()
  const participantName = sessionStorage.getItem(`participant_${contestId}`)

  const [contest, setContest] = useState(null)
  const [categories, setCategories] = useState([])
  const [entries, setEntries] = useState([])
  const [votes, setVotes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!participantName) { navigate(`/contest/${contestId}`); return }
    fetchAll()
  }, [contestId])

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

  if (loading) return <div className="loading">Loading…</div>
  if (!contest) return <div className="page"><p>Contest not found.</p></div>
  if (contest.phase !== 'results') {
    return (
      <div className="page">
        <button className="back-btn" onClick={() => navigate(`/contest/${contestId}/play`)}>← Back</button>
        <div className="notice notice-warn">Results haven't been released yet.</div>
      </div>
    )
  }

  return (
    <div className="page">
      <button className="back-btn" onClick={() => navigate(`/contest/${contestId}/play`)}>
        ← Back
      </button>
      <h1>{contest.name}</h1>
      <p style={{ marginBottom: '1.5rem' }}>Final results 🏆</p>

      {categories.map(cat => {
        // Count votes for this category
        const catVotes = votes.filter(v => v.category_id === cat.id)
        const voteCounts = {} // entry_id → count
        entries.forEach(e => { voteCounts[e.id] = 0 })
        catVotes.forEach(v => {
          if (voteCounts[v.entry_id] !== undefined) voteCounts[v.entry_id]++
        })

        // Sort entries by vote count descending
        const sorted = [...entries].sort((a, b) => (voteCounts[b.id] || 0) - (voteCounts[a.id] || 0))
        const maxVotes = Math.max(...Object.values(voteCounts), 1)

        return (
          <div key={cat.id} style={{ marginBottom: '2rem' }}>
            <h2 style={{ marginBottom: '0.75rem' }}>{cat.name}</h2>

            {sorted.map((entry, i) => {
              const count = voteCounts[entry.id] || 0
              const pct = Math.round((count / maxVotes) * 100)
              const isWinner = i === 0 && count > 0

              return (
                <div key={entry.id} className="result-row">
                  <div className="result-label">
                    <span style={{ fontWeight: isWinner ? 600 : 400 }}>
                      {isWinner ? '🥇 ' : ''}{entry.author_name}
                    </span>
                    <span style={{ color: 'var(--text-muted)' }}>
                      {count} vote{count !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="result-bar-bg">
                    <div className="result-bar-fill" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}
