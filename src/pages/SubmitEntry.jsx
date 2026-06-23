import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'

export default function SubmitEntry() {
  const { contestId } = useParams()
  const navigate = useNavigate()
  const participantName = sessionStorage.getItem(`participant_${contestId}`)

  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [description, setDescription] = useState('')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  function handleFileChange(e) {
    const f = e.target.files[0]
    if (!f) return
    setFile(f)
    // Show a preview if it's an image
    if (f.type.startsWith('image/')) {
      setPreview(URL.createObjectURL(f))
    } else {
      setPreview(null)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!file) { setError('Please select a file.'); return }
    setUploading(true)
    setError('')

    // Upload file to Supabase Storage
    const ext = file.name.split('.').pop()
    const filename = `${contestId}/${Date.now()}_${participantName}.${ext}`

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('entries')
      .upload(filename, file, { upsert: false })

    if (uploadError) {
      setError('Upload failed: ' + uploadError.message)
      setUploading(false)
      return
    }

    // Get the public URL
    const { data: urlData } = supabase.storage
      .from('entries')
      .getPublicUrl(filename)

    const mediaUrl = urlData.publicUrl

    // Save entry to database
    const { error: dbError } = await supabase
      .from('entries')
      .upsert(
        {
          contest_id: contestId,
          author_name: participantName,
          media_url: mediaUrl,
          description: description.trim(),
        },
        { onConflict: 'contest_id,author_name' } // one entry per person per contest
      )

    if (dbError) {
      setError('Could not save entry: ' + dbError.message)
      setUploading(false)
      return
    }

    navigate(`/contest/${contestId}/play`)
  }

  return (
    <div className="page">
      <button className="back-btn" onClick={() => navigate(`/contest/${contestId}/play`)}>
        ← Back
      </button>
      <h1>Submit your entry</h1>
      <p style={{ marginBottom: '1.5rem' }}>
        Upload a photo or video. It will compete in every category.
      </p>

      <form onSubmit={handleSubmit}>
        <label>Photo or video</label>
        <input
          type="file"
          accept="image/*,video/*"
          onChange={handleFileChange}
          style={{ marginBottom: '0.75rem' }}
        />

        {preview && (
          <img src={preview} alt="Preview" className="media-preview" />
        )}

        <label>Description (optional)</label>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Say something about your entry…"
          rows={3}
        />

        {error && <p className="error-text">{error}</p>}

        <button type="submit" className="btn btn-primary btn-full" disabled={uploading}>
          {uploading ? 'Uploading…' : 'Submit entry'}
        </button>
      </form>
    </div>
  )
}
