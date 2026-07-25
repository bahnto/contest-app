import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import '../styles/participant.css'

export default function ContestJoin() {
  const { contestId } = useParams()
  const navigate = useNavigate()
  const [contest, setContest] = useState(null)
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = sessionStorage.getItem(`participant_${contestId}`)
    if (stored) { navigate(`/contest/${contestId}/play`); return }
    supabase.from('contests').select('*').eq('id', contestId).single()
      .then(({ data }) => { setContest(data); setLoading(false) })
  }, [contestId, navigate])

  function join(e) {
    e.preventDefault()
    if (!name.trim()) return
    sessionStorage.setItem(`participant_${contestId}`, name.trim())
    navigate(`/contest/${contestId}/play`)
  }

  if (loading) return <div className="p-console"><div className="p-grid-bg" /><div className="p-loading">LOADING...</div></div>
  if (!contest) return <div className="p-console"><div className="p-grid-bg" /><div className="p-loading">NOT FOUND</div></div>

  return (
    <div className="p-console">
      <div className="p-grid-bg" />
      <div className="p-topbar">
        <div className="p-topbar-title">Contest Terminal</div>
        <div className="p-topbar-right">
          <div className="p-leds">
            <div className="p-led p-led-g" />
            <div className="p-led p-led-o" />
            <div className="p-led p-led-b" />
          </div>
          <div className="p-topbar-status">SYS OK</div>
        </div>
      </div>

      <div style={{ maxWidth: 480, margin: '0 auto', padding: '3rem 1rem', position: 'relative', zIndex: 1 }}>
        <div className="p-panel p-panel-cut-tr" style={{ marginBottom: 3 }}>
          <div className="p-panel-header">
            <div className="p-panel-dot" />
            <div className="p-panel-title">Contestant Entry</div>
          </div>
          <div className="p-contest-name">{contest.name}</div>
          <div className="p-contest-meta">Identify yourself to enter</div>
        </div>

        <div className="p-panel p-panel-cut-br">
          <div className="p-form-wrap">
            <form onSubmit={join}>
              <label className="p-field-label">Callsign / Name</label>
              <input className="p-input" type="text" value={name} onChange={e => setName(e.target.value)} placeholder="ENTER NAME_" maxLength={50} autoFocus />
              <button type="submit" className="p-btn-primary">▶ ENTER CONTEST</button>
            </form>
          </div>
        </div>
      </div>

      <div className="p-bottombar">
        <span>CONTEST-APP v2.0</span>
        <span>◆ IDENTIFY TO PROCEED ◆</span>
        <span>2025</span>
      </div>
    </div>
  )
}