import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'

export default function ContestJoin() {
  const { contestId } = useParams()
  const navigate = useNavigate()
  const [contest, setContest] = useState(null)
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // If they already joined (name stored in session), skip to dash
    const stored = sessionStorage.getItem(`participant_${contestId}`)
    if (stored) {
      navigate(`/contest/${contestId}/play`)
      return
    }

    supabase
      .from('contests')
      .select('*')
      .eq('id', contestId)
      .single()
      .then(({ data }) => {
        setContest(data)
        setLoading(false)
      })
  }, [contestId, navigate])

  function join(e) {
    e.preventDefault()
    if (!name.trim()) return
    // Save name to session — no accounts, no database entry needed
    sessionStorage.setItem(`participant_${contestId}`, name.trim())
    navigate(`/contest/${contestId}/play`)
  }

  if (loading) return <div className="loading">Loading…</div>
  if (!contest) return <div className="page"><p>Contest not found.</p></div>

  return (
    <div className="page">
      <h1>{contest.name}</h1>
      <p style={{ marginBottom: '1.5rem' }}>Enter your name to join.</p>

      <form onSubmit={join}>
        <label>Your name</label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g. Anto"
          maxLength={50}
          autoFocus
        />
        <button type="submit" className="btn btn-primary btn-full">
          Join contest
        </button>
      </form>
    </div>
  )
}
