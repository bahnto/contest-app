import { useNavigate } from 'react-router-dom'

export default function NotFound() {
  const navigate = useNavigate()
  return (
    <div className="page">
      <h1>Page not found</h1>
      <p style={{ marginBottom: '1.5rem' }}>This link doesn't exist or has expired.</p>
      <button className="btn btn-primary" onClick={() => navigate('/')}>Go home</button>
    </div>
  )
}
