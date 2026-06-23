import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'

const PHASES = ['draft', 'submit', 'vote', 'results']

const PHASE_LABELS = {
  draft:   { label: 'Draft',             className: 'badge-draft' },
  submit:  { label: 'Submissions open',  className: 'badge-submit' },
  vote:    { label: 'Voting open',       className: 'badge-vote' },
  results: { label: 'Results released',  className: 'badge-results' },
}

const PHASE_ADVANCE_LABELS = {
  draft:  'Open for submissions',
  submit: 'Close submissions & open voting',
  vote:   'Close voting & release results',
}

export default function AdminContest() {
  const { contestId } = useParams()
  const navigate = useNavigate()

  const [contest, setContest] = useState(null)
  const [categories, setCategories] = useState([])
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [newCatName, setNewCatName] = useState('')
  const [showCatForm, setShowCatForm] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!sessionStorage.getItem('admin')) navigate('/')
  }, [navigate])

  useEffect(() => {
    fetchAll()
  }, [contestId])

  async function fetchAll() {
    setLoading(true)
    const [contestRes, catsRes, entriesRes] = await Promise.all([
      supabase.from('contests').select('*').eq('id', contestId).single(),
      supabase.from('categories').select('*').eq('contest_id', contestId).order('created_at'),
      supabase.from('entries').select('*').eq('contest_id', contestId).order('created_at'),
    ])
    if (contestRes.data) setContest(contestRes.data)
    if (catsRes.data) setCategories(catsRes.data)
    if (entriesRes.data) setEntries(entriesRes.data)
    setLoading(false)
  }

  async function advancePhase() {
    const next = PHASES[PHASES.indexOf(contest.phase) + 1]
    if (!next) return
    const { error } = await supabase
      .from('contests')
      .update({ phase: next })
      .eq('id', contestId)
    if (!error) setContest(c => ({ ...c, phase: next }))
  }

  async function addCategory(e) {
    e.preventDefault()
    if (!newCatName.trim()) return
    const { data, error } = await supabase
      .from('categories')
      .insert({ contest_id: contestId, name: newCatName.trim() })
      .select()
      .single()
    if (!error && data) {
      setCategories(cats => [...cats, data])
      setNewCatName('')
      setShowCatForm(false)
    }
  }

  async function deleteCategory(catId) {
    if (!confirm('Delete this category? Votes for it will also be removed.')) return
    await supabase.from('votes').delete().eq('category_id', catId)
    await supabase.from('categories').delete().eq('id', catId)
    setCategories(cats => cats.filter(c => c.id !== catId))
  }

  function copyShareLink() {
    const url = `${window.location.origin}/contest/${contestId}`
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  if (loading) return <div className="loading">Loading…</div>
  if (!contest) return <div className="page"><p>Contest not found.</p></div>

  const phase = PHASE_LABELS[contest.phase]
  const shareUrl = `${window.location.origin}/contest/${contestId}`

  return (
    <div className="page">
      <button className="back-btn" onClick={() => navigate('/admin')}>
        ← All contests
      </button>

      {/* Header */}
      <div className="row-between" style={{ marginBottom: '0.25rem' }}>
        <h1>{contest.name}</h1>
        <span className={`badge ${phase.className}`}>{phase.label}</span>
      </div>
      <p style={{ marginBottom: '1.5rem' }}>
        {entries.length} entr{entries.length === 1 ? 'y' : 'ies'} · {categories.length} categor{categories.length === 1 ? 'y' : 'ies'}
      </p>

      {/* Phase control */}
      {contest.phase !== 'results' ? (
        <button className="btn btn-primary btn-full" onClick={advancePhase}>
          {PHASE_ADVANCE_LABELS[contest.phase]}
        </button>
      ) : (
        <div className="notice notice-success">Results are live — participants can see them.</div>
      )}

      <hr className="divider" />

      {/* Share link */}
      <h2>Share link</h2>
      <div className="card" style={{ wordBreak: 'break-all', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
        {shareUrl}
      </div>
      <button className="btn btn-full btn-sm" onClick={copyShareLink}>
        {copied ? '✓ Copied!' : 'Copy link'}
      </button>

      <hr className="divider" />

      {/* Categories */}
      <div className="row-between" style={{ marginBottom: '0.75rem' }}>
        <h2 style={{ margin: 0 }}>Categories</h2>
        {contest.phase === 'draft' && (
          <button className="btn btn-sm" onClick={() => setShowCatForm(v => !v)}>
            + Add
          </button>
        )}
      </div>

      {contest.phase !== 'draft' && (
        <div className="notice notice-info" style={{ marginBottom: '0.75rem' }}>
          Categories can only be edited while the contest is in Draft.
        </div>
      )}

      {showCatForm && (
        <form onSubmit={addCategory} style={{ marginBottom: '0.75rem' }}>
          <input
            type="text"
            value={newCatName}
            onChange={e => setNewCatName(e.target.value)}
            placeholder="Category name (e.g. Prettiest)"
            autoFocus
          />
          <div className="row">
            <button type="submit" className="btn btn-primary btn-sm">Save</button>
            <button type="button" className="btn btn-sm" onClick={() => setShowCatForm(false)}>Cancel</button>
          </div>
        </form>
      )}

      {categories.length === 0 && <p>No categories yet.</p>}

      {categories.map(cat => (
        <div key={cat.id} className="card">
          <div className="row-between">
            <span style={{ fontWeight: 500 }}>{cat.name}</span>
            {contest.phase === 'draft' && (
              <button
                className="btn btn-sm btn-danger"
                onClick={() => deleteCategory(cat.id)}
              >
                Delete
              </button>
            )}
          </div>
        </div>
      ))}

      <hr className="divider" />

      {/* Entries */}
      <h2>Entries ({entries.length})</h2>
      {entries.length === 0 && <p>No entries yet.</p>}
      {entries.map(entry => (
        <div key={entry.id} className="card">
          <div className="row-between" style={{ marginBottom: '0.25rem' }}>
            <span style={{ fontWeight: 600 }}>{entry.author_name}</span>
          </div>
          {entry.description && (
            <p style={{ marginBottom: '0.5rem' }}>{entry.description}</p>
          )}
          {entry.media_url && (
            <a href={entry.media_url} target="_blank" rel="noreferrer" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              View media ↗
            </a>
          )}
        </div>
      ))}
    </div>
  )
}
