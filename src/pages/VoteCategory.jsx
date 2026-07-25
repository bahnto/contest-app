import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import MusicPlayer from '../components/MusicPlayer.jsx'
import '../styles/participant.css'

export default function VoteCategory() {
  const { contestId, categoryId } = useParams()
  const navigate = useNavigate()
  const participantName = sessionStorage.getItem(`participant_${contestId}`)
  const [category, setCategory] = useState(null)
  const [entries, setEntries] = useState([])
  const [currentVote, setCurrentVote] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [lightbox, setLightbox] = useState(null)

  useEffect(() => {
    if (!participantName) { navigate(`/contest/${contestId}`); return }
    fetchAll()
  }, [categoryId])

  async function fetchAll() {
    setLoading(true)
    const [catRes, entriesRes, myVoteRes] = await Promise.all([
      supabase.from('categories').select('*').eq('id', categoryId).single(),
      supabase.from('entries').select('*').eq('contest_id', contestId).order('author_name'),
      supabase.from('votes').select('entry_id').eq('contest_id', contestId).eq('category_id', categoryId).eq('voter_name', participantName).maybeSingle(),
    ])
    if (catRes.data) setCategory(catRes.data)
    if (entriesRes.data) setEntries(entriesRes.data)
    if (myVoteRes.data) setCurrentVote(myVoteRes.data.entry_id)
    setLoading(false)
  }

  async function castVote(entryId) {
    setSaving(true)
    const { error } = await supabase.from('votes').upsert(
      { contest_id: contestId, category_id: categoryId, voter_name: participantName, entry_id: entryId },
      { onConflict: 'contest_id,category_id,voter_name' }
    )
    if (!error) setCurrentVote(entryId)
    setSaving(false)
  }

  if (loading) return <div className="p-console"><div className="p-grid-bg" /><div className="p-loading">LOADING...</div></div>

  return (
    <div className="p-console">
      <div className="p-grid-bg" />
      <div className="p-topbar">
        <div className="p-topbar-title">Voting Terminal</div>
        <div className="p-topbar-right">
          <div className="p-leds">
            <div className="p-led p-led-g" />
            <div className="p-led p-led-o" />
            <div className="p-led p-led-b" />
          </div>
          <div className="p-topbar-status">VOTE ACTIVE</div>
        </div>
      </div>

      <div className="p-layout">
        {/* LEFT */}
        <div className="p-panel p-panel-cut-tr p-left">
          <div className="p-panel-header">
            <div className="p-panel-dot" />
            <div className="p-panel-title">Category</div>
          </div>
          <div className="p-contest-name">{category?.name}</div>
          <div className="p-contest-meta">Select one entry</div>
          <div className="p-contest-meta">Tap to cast vote</div>
          {currentVote && <div className="p-status-pill results">VOTE CAST</div>}
          <div className="p-sys-info">
            <div className="p-sys-row"><span>Entries</span><span>{entries.length}</span></div>
            <div className="p-sys-row hi"><span>Status</span><span>{currentVote ? 'VOTED' : 'PENDING'}</span></div>
          </div>
          <div className="p-nav">
            <button className="p-back" onClick={() => navigate(`/contest/${contestId}/play`)}>◀ BACK</button>
          </div>
        </div>

        {/* CENTER */}
        <div className="p-panel p-panel-cut-both" style={{ gridColumn: 2, gridRow: 1 }}>
          <div className="p-panel-header">
            <div className="p-panel-dot" />
            <div className="p-panel-title">Entries — {category?.name}</div>
          </div>
          {entries.length === 0 && <div className="p-notice p-notice-warn" style={{ margin: '10px 8px' }}>NO ENTRIES FOUND.</div>}
          {entries.map(entry => {
            const isVoted = currentVote === entry.id
            {lightbox && (
  <div
    onClick={() => setLightbox(null)}
    style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, cursor: 'zoom-out'
    }}
  >
    <img src={lightbox} style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain' }} />
  </div>
)}
            return (
              <div key={entry.id} className={`p-cat-item ${isVoted ? 'voted' : ''}`} onClick={() => !saving && castVote(entry.id)}>
                <div className="p-cat-num" style={{ fontSize: '10px', color: isVoted ? 'var(--accent)' : 'var(--accent-dim)' }}>
                  {isVoted ? '✓' : '○'}
                </div>
                <div className="p-cat-body" style={{ padding: 0 }}>
                  {entry.media_url && (
                    <div className="p-media" style={{ margin: 0, borderRadius: 0, border: 'none', borderBottom: '1px solid var(--border)' }}>
                      <img
  src={entry.media_url}
  alt={entry.author_name}
  onError={e => e.target.style.display='none'}
  style={{ maxHeight: 120, cursor: 'zoom-in' }}
  onClick={e => { e.stopPropagation(); setLightbox(entry.media_url) }}
/>
                      <div className="p-media-label">{entry.author_name.toUpperCase()}</div>
                    </div>
                  )}
                  <div style={{ padding: '8px' }}>
                    <div className="p-cat-name">{entry.author_name}</div>
                    {entry.description && <div className="p-cat-sub">{entry.description}</div>}
                  </div>
                </div>
                <div className="p-cat-action">
                  {isVoted ? <div className="p-voted-tag">✓ YOUR<br/>VOTE</div> : <button className="p-btn-vote">VOTE →</button>}
                </div>
              </div>
            )
          })}
        </div>

        {/* RIGHT */}
        <div className="p-panel p-panel-cut-tl p-right">
          <MusicPlayer />
        </div>

        <div className="p-bottom-row">
          <div className="p-mini p-panel-cut-tr">
            <div className="p-mini-label">Category</div>
            <div className="p-mini-value" style={{ fontSize: '9px', letterSpacing: '1px' }}>{category?.name?.toUpperCase().slice(0,10)}</div>
          </div>
          <div className="p-mini">
            <div className="p-mini-label">Entries</div>
            <div className="p-mini-value">{entries.length}</div>
          </div>
          <div className="p-mini p-panel-cut-tl">
            <div className="p-mini-label">Status</div>
            <div className="p-mini-value" style={{ color: currentVote ? 'var(--green)' : 'var(--orange)' }}>
              {currentVote ? 'VOTED' : 'OPEN'}
            </div>
          </div>
        </div>
      </div>

      <div className="p-bottombar">
        <span>CONTEST-APP v2.0</span>
        <span>◆ TAP ENTRY TO VOTE ◆</span>
        <span>2025</span>
      </div>
    </div>
  )
}