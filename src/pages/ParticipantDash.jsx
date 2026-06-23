import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'

const PHASE_LABELS = {
  draft:   { label: 'Not open yet',      className: 'badge-draft' },
  submit:  { label: 'Submissions open',  className: 'badge-submit' },
  vote:    { label: 'Voting open',       className: 'badge-vote' },
  results: { label: 'Results released',  className: 'badge-results' },
}

export default function ParticipantDash() {
  const { contestId } = useParams()
  const navigate = useNavigate()

  const [contest, setContest] = useState(null)
  const [categories, setCategories] = useState([])
  const [myEntry, setMyEntry] = useState(null)
  const [myVotes, setMyVotes] = useState([]) // list of category_ids I've voted in
  const [loading, setLoading] = useState(true)

  const participantName = sessionStorage.getItem(`participant_${contestId}`)

  useEffect(() => {
    if (!participantName) {
      navigate(`/contest/${contestId}`)
      return
    }
    fetchAll()
  }, [contestId])

  async function fetchAll() {
    setLoading(true)
    const [contestRes, catsRes, entryRes, votesRes] = await Promise.all([
      supabase.from('contests').select('*').eq('id', contestId).single(),
      supabase.from('categories').select('*').eq('contest_id', contestId).order('created_at'),
      supabase.from('entries').select('*').eq('contest_id', contestId).eq('author_name', participantName).maybeSingle(),
      supabase.from('votes').select('category_id').eq('contest_id', contestId).eq('voter_name', participantName),
    ])
    if (contestRes.data) setContest(contestRes.data)
    if (catsRes.data) setCategories(catsRes.data)
    if (entryRes.data) setMyEntry(entryRes.data)
    if (votesRes.data) setMyVotes(votesRes.data.map(v => v.category_id))
    setLoading(false)
  }

  if (loading) return <div className="loading">Loading…</div>
  if (!contest) return <div className="page"><p>Contest not found.</p></div>

  const phase = PHASE_LABELS[contest.phase]

  return (
    <div className="page">
      <div className="row-between" style={{ marginBottom: '0.25rem' }}>
        <h1>{contest.name}</h1>
        <span className={`badge ${phase.className}`}>{phase.label}</span>
      </div>
      <p style={{ marginBottom: '1.5rem' }}>Hi, {participantName} 👋</p>

      {/* DRAFT */}
      {contest.phase === 'draft' && (
        <div className="notice notice-info">
          This contest isn't open yet. The organizer will let you know when submissions open.
        </div>
      )}

      {/* SUBMIT */}
      {contest.phase === 'submit' && (
        <>
          <h2>Your entry</h2>
          {myEntry ? (
            <div className="card">
              {myEntry.media_url && (
                <img
                  src={myEntry.media_url}
                  alt="Your entry"
                  className="media-preview"
                  onError={e => e.target.style.display = 'none'}
                />
              )}
              {myEntry.description && <p>{myEntry.description}</p>}
              <div className="notice notice-success" style={{ marginTop: '0.75rem', marginBottom: 0 }}>
                Entry submitted! You're in all {categories.length} categor{categories.length === 1 ? 'y' : 'ies'}.
              </div>
            </div>
          ) : (
            <>
              <p style={{ marginBottom: '1rem' }}>
                Submit one entry — it will automatically compete in all {categories.length} categor{categories.length === 1 ? 'y' : 'ies'}.
              </p>
              <button
                className="btn btn-primary btn-full"
                onClick={() => navigate(`/contest/${contestId}/submit`)}
              >
                Submit my entry
              </button>
            </>
          )}
        </>
      )}

      {/* VOTE */}
      {contest.phase === 'vote' && (
        <>
          <h2>Vote in each category</h2>
          <p style={{ marginBottom: '1rem' }}>One vote per category. You can change your mind until results are released.</p>
          <div className="stack">
            {categories.map(cat => {
              const voted = myVotes.includes(cat.id)
              return (
                <div key={cat.id} className="card card-clickable row-between"
                  onClick={() => navigate(`/contest/${contestId}/vote/${cat.id}`)}
                >
                  <span style={{ fontWeight: 500 }}>{cat.name}</span>
                  {voted
                    ? <span className="badge badge-results">✓ Voted</span>
                    : <span className="badge badge-vote">Vote →</span>
                  }
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* RESULTS */}
      {contest.phase === 'results' && (
        <button
          className="btn btn-primary btn-full"
          onClick={() => navigate(`/contest/${contestId}/results`)}
        >
          See results 🏆
        </button>
      )}
    </div>
  )
}
