import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import MusicPlayer from '../components/MusicPlayer.jsx'
import '../styles/participant.css'

const PHASE_BADGE = {
  draft:   { label: 'OFFLINE',           cls: 'p-badge p-badge-submit' },
  submit:  { label: 'SUBMISSIONS OPEN',  cls: 'p-badge p-badge-submit' },
  vote:    { label: 'VOTING ACTIVE',     cls: 'p-badge p-badge-vote' },
  results: { label: 'RESULTS RELEASED',  cls: 'p-badge p-badge-results' },
}

export default function ParticipantDash() {
  const { contestId } = useParams()
  const navigate = useNavigate()

  const [contest, setContest] = useState(null)
  const [categories, setCategories] = useState([])
  const [myEntry, setMyEntry] = useState(null)
  const [myVotes, setMyVotes] = useState([])
  const [loading, setLoading] = useState(true)

  const participantName = sessionStorage.getItem(`participant_${contestId}`)

  useEffect(() => {
    if (!participantName) { navigate(`/contest/${contestId}`); return }
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

  if (loading) return <div className="p-root"><div className="p-loading">LOADING...</div></div>
  if (!contest) return <div className="p-root"><div className="p-page"><p>Contest not found.</p></div></div>

  const phase = PHASE_BADGE[contest.phase] || PHASE_BADGE.draft

  return (
    <div className="p-root">
      <div className="p-grid-deco" />
      <div className="p-corner p-corner-tl" />
      <div className="p-corner p-corner-tr" />
      <div className="p-corner p-corner-bl" />
      <div className="p-corner p-corner-br" />
      <MusicPlayer />

      <div className="p-page">
        {/* Header */}
        <div className="p-header">
          <div className="p-row-between">
            <div className="p-title">{contest.name}</div>
            <span className={phase.cls}>{phase.label}</span>
          </div>
          <div className="p-subtitle">OPERATOR: {participantName.toUpperCase()}</div>
        </div>

        {/* DRAFT */}
        {contest.phase === 'draft' && (
          <div className="p-notice p-notice-warn">
            ⚠ SYSTEM OFFLINE — Contest has not opened yet.
          </div>
        )}

        {/* SUBMIT */}
        {contest.phase === 'submit' && (
          <>
            <p className="p-label">SUBMISSION STATUS</p>
            {myEntry ? (
              <div className="p-panel">
                {myEntry.media_url && (
                  <div className="p-media-viewer">
                    <img src={myEntry.media_url} alt="Your entry" onError={e => e.target.style.display='none'} />
                    <div className="p-media-label">YOUR SUBMISSION</div>
                  </div>
                )}
                {myEntry.description && (
                  <p style={{ fontSize: '0.82rem', color: '#888', marginBottom: '0.5rem' }}>{myEntry.description}</p>
                )}
                <div className="p-notice p-notice-success">
                  ✓ ENTRY CONFIRMED — Competing in all {categories.length} categories.
                </div>
              </div>
            ) : (
              <div className="p-panel p-panel-red">
                <p style={{ fontSize: '0.8rem', color: '#888', marginBottom: '0.75rem' }}>
                  Submit one entry. It will compete in all {categories.length} categories automatically.
                </p>
                <button
                  className="p-btn p-btn-primary p-btn-full"
                  onClick={() => navigate(`/contest/${contestId}/submit`)}
                >
                  ▶ SUBMIT ENTRY
                </button>
              </div>
            )}
          </>
        )}

        {/* VOTE */}
        {contest.phase === 'vote' && (
          <>
            <p className="p-label">VOTING TERMINAL</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {categories.map(cat => {
                const voted = myVotes.includes(cat.id)
                return (
                  <div
                    key={cat.id}
                    className={`p-panel p-panel-clickable ${voted ? '' : ''}`}
                    onClick={() => navigate(`/contest/${contestId}/vote/${cat.id}`)}
                  >
                    <div className="p-row-between">
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>
                        {cat.name}
                      </span>
                      {voted
                        ? <span className="p-badge p-badge-done">✓ VOTED</span>
                        : <span className="p-badge p-badge-vote">VOTE →</span>
                      }
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}

        {/* RESULTS */}
        {contest.phase === 'results' && (
          <button
            className="p-btn p-btn-primary p-btn-full"
            onClick={() => navigate(`/contest/${contestId}/results`)}
          >
            ▶ VIEW FINAL RESULTS
          </button>
        )}
      </div>
    </div>
  )
}




// v2 de esta cosa wea no se que 