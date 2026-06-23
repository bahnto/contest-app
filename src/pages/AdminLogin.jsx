import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'contest123'

export default function AdminLogin() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  function handleLogin(e) {
    e.preventDefault()
    if (password === ADMIN_PASSWORD) {
      // Store a simple session flag
      sessionStorage.setItem('admin', 'true')
      navigate('/admin')
    } else {
      setError('Wrong password.')
    }
  }

  return (
    <div className="page">
      <h1>Admin login</h1>
      <p style={{ marginBottom: '1.5rem' }}>For contest organizers only.</p>

      <form onSubmit={handleLogin}>
        <label>Password</label>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Enter admin password"
          autoFocus
        />
        {error && <p className="error-text">{error}</p>}
        <button type="submit" className="btn btn-primary btn-full">
          Enter
        </button>
      </form>
    </div>
  )
}
