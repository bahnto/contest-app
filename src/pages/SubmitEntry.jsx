import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import '../styles/participant.css'

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
    if (f.type.startsWith('image/')) setPreview(URL.createObjectURL(f))
    else setPreview(null)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!file) { setError('SELECT A FILE.'); return }
    setUploading(true); setError('')
    const ext = file.name.split('.').pop()
    const filename = `${contestId}/${Date.now()}_${participantName}.${ext}`
    const { error: uploadError } = await supabase.storage.from('entries').upload(filename, file, { upsert: false })
    if (uploadError) { setError('UPLOAD FAILED: ' + uploadError.message); setUploading(false); return }
    const { data: urlData } = supabase.storage.from('entries').getPublicUrl(filename)
    const { error: dbError } = await supabase.from('entries').upsert(
      { contest_id: contestId, author_name: participantName, media_url: urlData.publicUrl, description: description.trim() },
      { onConflict: 'contest_id,author_name' }
    )
    if (dbError) { setError('SAVE FAILED: ' + dbError.message); setUploading(false); return }
    navigate(`/contest/${contestId}/play`)
  }

  return (
    <div className="p-console">
      <div className="p-grid-bg" />
      <div className="p-topbar">
        <div className="p-topbar-title">Submit Entry</div>
        <div className="p-topbar-right">
          <div className="p-leds">
            <div className="p-led p-led-g" />
            <div className="p-led p-led-o" />
            <div className="p-led p-led-b" />
          </div>
          <div className="p-topbar-status">UPLOAD READY</div>
        </div>
      </div>

      <div style={{ maxWidth: 600, margin: '0 auto', padding: '1rem', position: 'relative', zIndex: 1 }}>
        <button className="p-back" onClick={() => navigate(`/contest/${contestId}/play`)}>◀ BACK</button>

        <div className="p-panel p-panel-cut-tr" style={{ marginBottom: 3 }}>
          <div className="p-panel-header">
            <div className="p-panel-dot" />
            <div className="p-panel-title">Submit Entry</div>
          </div>
          <div className="p-contest-meta" style={{ padding: '8px 10px' }}>Upload media — competes in all categories</div>
        </div>

        <div className="p-panel p-panel-cut-br">
          <div className="p-form-wrap">
            <form onSubmit={handleSubmit}>
              <label className="p-field-label">Photo / Video file</label>
              <input type="file" accept="image/*,video/*" onChange={handleFileChange} className="p-input" />
              {preview && (
                <div className="p-media" style={{ marginBottom: 8 }}>
                  <img src={preview} alt="Preview" />
                  <div className="p-media-label">PREVIEW</div>
                </div>
              )}
              <label className="p-field-label">Description (optional)</label>
              <textarea className="p-input" value={description} onChange={e => setDescription(e.target.value)} placeholder="ADD A NOTE..." rows={3} />
              {error && <p className="p-error">⚠ {error}</p>}
              <button type="submit" className="p-btn-primary" disabled={uploading}>
                {uploading ? 'UPLOADING...' : '▶ CONFIRM SUBMISSION'}
              </button>
            </form>
          </div>
        </div>
      </div>

      <div className="p-bottombar">
        <span>CONTEST-APP v2.0</span>
        <span>◆ UPLOAD TO COMPETE ◆</span>
        <span>2025</span>
      </div>
    </div>
  )
}