import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'

// Inject floating bubbles into the page
function Bubbles() {
  return (
    <div className="bubbles">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="bubble" />
      ))}
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Bubbles />
      <App />
    </BrowserRouter>
  </React.StrictMode>
)