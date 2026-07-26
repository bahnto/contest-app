import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'
import HoloEffects from './components/HoloEffects.jsx'
import { playSound, preloadSounds } from './lib/sounds.js'

// Global click sound on all buttons
document.addEventListener('click', e => {
  if (e.target.closest('button') || e.target.closest('.p-cat-item') || e.target.closest('.p-panel-clickable')) {
    playSound('/sounds/vote.mp3', 0.4)
  }
}, true)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <HoloEffects />
      <App />
    </BrowserRouter>
  </React.StrictMode>
)