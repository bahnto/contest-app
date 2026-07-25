import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import MusicPlayer from '../components/MusicPlayer.jsx'
import '../styles/participant.css'

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

  if (loading) return <div className="p-console"><div className="p-grid-bg" /><div className="p-loading">LOADING...</div></div>
  if (!contest) return <div className="p-console"><div className="p-grid-bg" /><div className="p-loading">NOT FOUND</div></div>

  const phaseLabel = { draft: 'OFFLINE', submit: 'SUBMISSIONS OPEN', vote: 'VOTING ACTIVE', results: 'RESULTS RELEASED' }
  const phaseClass = { draft: '', submit: 'submit', vote: '', results: 'results' }
  const votedCount = myVotes.length

  return (
    <div className="p-console">
      <div className="p-grid-bg" />
      <div className="p-topbar">
        <div className="p-topbar-title">Contest Terminal v2.0</div>
        <div className="p-topbar-right">
          <div className="p-leds">
            <div className="p-led p-led-g" />
            <div className="p-led p-led-o" />
            <div className="p-led p-led-b" />
          </div>
          <div className="p-topbar-status">SYS OK &nbsp;|&nbsp; ONLINE</div>
        </div>
      </div>

      <div className="p-layout">
        {/* LEFT */}
        <div className="p-panel p-panel-cut-tr p-left">
          <div className="p-panel-header">
            <div className="p-panel-dot" />
            <div className="p-panel-title">Contest Info</div>
          </div>
          <div className="p-contest-name">{contest.name}</div>
          <div className="p-contest-meta">Operator: {participantName.toUpperCase()}</div>
          <div className="p-contest-meta" style={{ marginBottom: 0 }}>Session active</div>
          <div className={`p-status-pill ${phaseClass[contest.phase] || ''}`}>{phaseLabel[contest.phase]}</div>
          <div className="p-sys-info">
            <div className="p-sys-row"><span>Categories</span><span>{categories.length}</span></div>
            <div className="p-sys-row"><span>Voted</span><span>{votedCount} / {categories.length}</span></div>
            <div className="p-sys-row"><span>Entry</span><span>{myEntry ? 'SUBMITTED' : 'PENDING'}</span></div>
            <div className="p-sys-row hi"><span>Status</span><span>ONLINE</span></div>
          </div>
          <div className="p-nav">
            <div className={`p-nav-item ${contest.phase === 'vote' ? 'active' : ''}`}>▶ &nbsp; VOTE</div>
            <div className={`p-nav-item ${contest.phase === 'submit' ? 'active' : ''}`}>◇ &nbsp; MY ENTRY</div>
            <div className={`p-nav-item ${contest.phase === 'results' ? 'active' : ''}`}>◇ &nbsp; RESULTS</div>
          </div>
        </div>

        {/* CENTER */}
        <div className="p-panel p-panel-cut-both" style={{ gridColumn: 2, gridRow: 1 }}>
          <div className="p-panel-header">
            <div className="p-panel-dot" />
            <div className="p-panel-title">
              {contest.phase === 'submit' ? 'Submission Terminal' :
               contest.phase === 'vote' ? 'Voting Terminal' :
               contest.phase === 'results' ? 'Results' : 'System Status'}
            </div>
          </div>

          {contest.phase === 'draft' && (
            <div className="p-notice p-notice-warn" style={{ margin: '10px 8px' }}>
              ⚠ SYSTEM OFFLINE — Contest not open yet.
            </div>
          )}

          {contest.phase === 'submit' && (
            myEntry ? (
              <div style={{ padding: '8px' }}>
                {myEntry.media_url && (
                  <div className="p-media">
                    <img src={myEntry.media_url} alt="Your entry" onError={e => e.target.style.display='none'} />
                    <div className="p-media-label">Your submission</div>
                  </div>
                )}
                {myEntry.description && <p style={{ fontSize: '11px', color: '#4477aa', padding: '0 2px 8px', letterSpacing: '1px' }}>{myEntry.description}</p>}
                <div className="p-notice p-notice-success">✓ Entry confirmed — competing in all {categories.length} categories.</div>
              </div>
            ) : (
              <div style={{ padding: '8px' }}>
                <div className="p-notice p-notice-info">Submit one entry. It competes in all {categories.length} categories.</div>
                <button className="p-btn-primary" onClick={() => navigate(`/contest/${contestId}/submit`)}>▶ SUBMIT ENTRY</button>
              </div>
            )
          )}

          {contest.phase === 'vote' && categories.map((cat, i) => {
            const voted = myVotes.includes(cat.id)
            return (
              <div key={cat.id} className={`p-cat-item ${voted ? 'voted' : ''}`} onClick={() => navigate(`/contest/${contestId}/vote/${cat.id}`)}>
                <div className="p-cat-num">{String(i + 1).padStart(2, '0')}</div>
                <div className="p-cat-body">
                  <div className="p-cat-name">{cat.name}</div>
                  <div className="p-cat-sub">Select one entry to vote</div>
                </div>
                <div className="p-cat-action">
                  {voted ? <div className="p-voted-tag">✓ VOTED</div> : <button className="p-btn-vote">VOTE →</button>}
                </div>
              </div>
            )
          })}

          {contest.phase === 'results' && (
            <div style={{ padding: '8px' }}>
              <button className="p-btn-primary" onClick={() => navigate(`/contest/${contestId}/results`)}>▶ VIEW FINAL RESULTS</button>
            </div>
          )}
        </div>

        {/* RIGHT — music */}
        <div className="p-panel p-panel-cut-tl p-right">
          <MusicPlayer />
        </div>

        {/* BOTTOM MINI PANELS */}
        <div className="p-bottom-row">
          <div className="p-mini p-panel-cut-tr">
            <div className="p-mini-label">Entries</div>
            <div className="p-mini-value">{categories.length}</div>
            <div className="p-seg-row">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className={`p-seg ${i < categories.length ? 'on' : ''}`} />
              ))}
            </div>
          </div>
          <div className="p-mini">
            <div className="p-mini-label">Progress</div>
            <div className="p-mini-value">{votedCount} / {categories.length}</div>
            <div className="p-seg-row">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className={`p-seg ${i < votedCount ? 'on-o' : ''}`} />
              ))}
            </div>
          </div>
          <div className="p-mini p-panel-cut-tl">
            <div className="p-mini-label">Status</div>
            <div className="p-mini-value" style={{ color: contest.phase === 'vote' ? 'var(--orange)' : 'var(--accent)' }}>
              {contest.phase.toUpperCase()}
            </div>
            <div className="p-seg-row">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className={`p-seg ${i < 5 ? 'on' : ''}`} />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="p-bottombar">
        <span>CONTEST-APP v2.0</span>
        <span>◆ VOTE CAREFULLY — RESULTS FINAL ◆</span>
        <span>2025</span>
      </div>
    </div>
  )
}