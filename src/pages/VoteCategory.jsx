import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'

export default function VoteCategory() {
  const { contestId, categoryId } = useParams()
  const navigate = useNavigate()
  const participantName = sessionStorage.getItem(`participant_${contestId}`)

  const [category, setCategory] = useState(null)
  const [entries, setEntries] = useState([])
  const [currentVote, setCurrentVote] = useState(null) // entry_id I voted for
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!participantName) { navigate(`/contest/${contestId}`); return }
    fetchAll()
  }, [categoryId])

  async function fetchAll() {
    setLoading(true)
    const [catRes, entriesRes, myVoteRes] = await Promise.all([
      supabase.from('categories').select('*').eq('id', categoryId).single(),
      supabase.from('entries').select('*').eq('contest_id', contestId).order('author_name'),
      supabase.from('votes')
        .select('entry_id')
        .eq('contest_id', contestId)
        .eq('category_id', categoryId)
        .eq('voter_name', participantName)
        .maybeSingle(),
    ])
    if (catRes.data) setCategory(catRes.data)
    if (entriesRes.data) setEntries(entriesRes.data)
    if (myVoteRes.data) setCurrentVote(myVoteRes.data.entry_id)
    setLoading(false)
  }

  async function castVote(entryId) {
    setSaving(true)
    // Upsert: update if already voted in this category, insert if not
    const { error } = await supabase
      .from('votes')
      .upsert(
        {
          contest_id: contestId,
          category_id: categoryId,
          voter_name: participantName,
          entry_id: entryId,
        },
        { onConflict: 'contest_id,category_id,voter_name' }
      )

    if (!error) {
      setCurrentVote(entryId)
    }
    setSaving(false)
  }

  if (loading) return <div className="loading">Loading…</div>

  return (
    <div className="page">
      <button className="back-btn" onClick={() => navigate(`/contest/${contestId}/play`)}>
        ← Back
      </button>

      <h1>{category?.name}</h1>
      <p style={{ marginBottom: '1.5rem' }}>
        Tap an entry to vote. You can change your vote until results are released.
      </p>

      {entries.length === 0 && <p>No entries yet.</p>}

      {entries.map(entry => {
        const isVoted = currentVote === entry.id
        return (
          <div
            key={entry.id}
            className={`card card-clickable ${isVoted ? 'card-selected' : ''}`}
            onClick={() => !saving && castVote(entry.id)}
          >
            {entry.media_url && (
              <img
                src={entry.media_url}
                alt={`Entry by ${entry.author_name}`}
                className="media-preview"
                onError={e => e.target.style.display = 'none'}
              />
            )}
            <div className="row-between">
              <span style={{ fontWeight: 600 }}>{entry.author_name}</span>
              {isVoted && <span className="badge badge-results">✓ Your vote</span>}
            </div>
            {entry.description && (
              <p style={{ marginTop: '0.25rem' }}>{entry.description}</p>
            )}
          </div>
        )
      })}
    </div>
  )
}
