import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'

const PHASE_LABELS = {
  draft:   { label: 'Draft',             className: 'badge-draft' },
  submit:  { label: 'Submissions open',  className: 'badge-submit' },
  vote:    { label: 'Voting open',       className: 'badge-vote' },
  results: { label: 'Results released',  className: 'badge-results' },
}

export default function AdminDashboard() {
  const [contests, setContests] = useState([])
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState('')
  const [creating, setCreating] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [deleting, setDeleting] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (!sessionStorage.getItem('admin')) navigate('/')
  }, [navigate])

  useEffect(() => {
    fetchContests()
  }, [])

  async function fetchContests() {
    setLoading(true)
    const { data, error } = await supabase
      .from('contests')
      .select('*')
      .order('created_at', { ascending: false })
    if (!error) setContests(data || [])
    setLoading(false)
  }

  async function createContest(e) {
    e.preventDefault()
    if (!newName.trim()) return
    setCreating(true)
    const { data, error } = await supabase
      .from('contests')
      .insert({ name: newName.trim(), phase: 'draft' })
      .select()
      .single()
    if (!error && data) navigate(`/admin/contest/${data.id}`)
    setCreating(false)
  }

  async function deleteContest(e, contestId) {
    e.stopPropagation()
    if (!confirm('Delete this contest and all its data?')) return
    setDeleting(contestId)
    await supabase.from('votes').delete().eq('contest_id', contestId)
    await supabase.from('entries').delete().eq('contest_id', contestId)
    await supabase.from('categories').delete().eq('contest_id', contestId)
    await supabase.from('contests').delete().eq('id', contestId)
    setContests(cs => cs.filter(c => c.id !== contestId))
    setDeleting(null)
  }

  if (loading) return <div className="loading">Loading...</div>

  return (
    <div className="page">
      <div className="row-between" style={{ marginBottom: '1.5rem' }}>
        <h1>Your contests</h1>
        <button className="btn btn-sm btn-primary" onClick={() => setShowForm(v => !v)}>
          + New
        </button>
      </div>

      {showForm && (
        <form onSubmit={createContest} className="card" style={{ marginBottom: '1rem' }}>
          <label>Contest name</label>
          <input
            type="text"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="e.g. Best Setup 2025"
            autoFocus
          />
          <div className="row" style={{ gap: '0.5rem' }}>
            <button type="submit" className="btn btn-primary" disabled={creating}>
              {creating ? 'Creating…' : 'Create contest'}
            </button>
            <button type="button" className="btn" onClick={() => setShowForm(false)}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {contests.length === 0 && !showForm && (
        <p>No contests yet. Create your first one.</p>
      )}

      {contests.map(c => {
        const phase = PHASE_LABELS[c.phase] || PHASE_LABELS.draft
        return (
          <div
            key={c.id}
            className="card card-clickable"
            onClick={() => navigate(`/admin/contest/${c.id}`)}
          >
            <div className="row-between">
              <span style={{ fontWeight: 600 }}>{c.name}</span>
              <div className="row" style={{ gap: '0.5rem' }}>
                <span className={`badge ${phase.className}`}>{phase.label}</span>
                <button
                  className="btn btn-sm btn-danger"
                  disabled={deleting === c.id}
                  onClick={e => deleteContest(e, c.id)}
                >
                  {deleting === c.id ? '…' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )
      })}

      <hr className="divider" />
      <button
        className="btn btn-sm"
        onClick={() => { sessionStorage.removeItem('admin'); navigate('/') }}
      >
        Log out
      </button>
    </div>
  )
}