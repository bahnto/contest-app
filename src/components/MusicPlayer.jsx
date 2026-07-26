import { useState, useEffect, useRef } from 'react'

const TRACKS_BASE = [
  { title: 'TRACK 01', file: '/music/Track01.mp3' },
  { title: 'TRACK 02', file: '/music/Track02.mp3' },
  { title: 'TRACK 03', file: '/music/Track03.mp3' },
  { title: 'TRACK 04', file: '/music/Track04.mp3' },
  { title: 'TRACK 05', file: '/music/Track05.mp3' },
  { title: 'TRACK 06', file: '/music/Track06.mp3' },
  { title: 'TRACK 07', file: '/music/Track07.mp3' },
]

// Shuffle on load
function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const TRACKS = shuffle(TRACKS_BASE)

export default function MusicPlayer() {
  const audioRef = useRef(null)
  const canvasRef = useRef(null)
  const analyserRef = useRef(null)
  const animRef = useRef(null)
  const audioCtxRef = useRef(null)
  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(false)
  const [volume, setVolume] = useState(0.4)
  const [trackIndex, setTrackIndex] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [started, setStarted] = useState(false)

  const track = TRACKS[trackIndex]

  function setupAnalyser() {
    if (analyserRef.current) return
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    audioCtxRef.current = ctx
    const analyser = ctx.createAnalyser()
    analyser.fftSize = 64
    const source = ctx.createMediaElementSource(audioRef.current)
    source.connect(analyser)
    analyser.connect(ctx.destination)
    analyserRef.current = analyser
  }

  function drawVisualizer() {
    const canvas = canvasRef.current
    const analyser = analyserRef.current
    if (!canvas || !analyser) return
    const ctx = canvas.getContext('2d')
    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)
    function draw() {
      animRef.current = requestAnimationFrame(draw)
      analyser.getByteFrequencyData(dataArray)
      ctx.fillStyle = '#030810'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      const barWidth = (canvas.width / bufferLength) * 1.8
      let x = 0
      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height
        const intensity = dataArray[i] / 255
        const r = Math.floor(68 + intensity * 100)
        const g = Math.floor(153 + intensity * 50)
        const b = 255
        ctx.fillStyle = `rgb(${r},${g},${b})`
        ctx.fillRect(x, canvas.height - barHeight, barWidth - 1, barHeight)
        ctx.fillStyle = 'rgba(180,220,255,0.8)'
        ctx.fillRect(x, canvas.height - barHeight - 2, barWidth - 1, 2)
        x += barWidth + 1
      }
    }
    draw()
  }

  // Idle animation when not playing
  function drawIdle() {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let ph = 0
    function draw() {
      if (playing) return
      animRef.current = requestAnimationFrame(draw)
      ph += 0.04
      ctx.fillStyle = '#030810'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      const barCount = 32
      const barWidth = canvas.width / barCount
      for (let i = 0; i < barCount; i++) {
        const h = Math.max(2, Math.abs(Math.sin(ph + i * 0.3)) * 8 + 2)
        ctx.fillStyle = '#1a2a4a'
        ctx.fillRect(i * barWidth, canvas.height - h, barWidth - 1, h)
      }
    }
    draw()
  }

  useEffect(() => {
    drawIdle()
    return () => cancelAnimationFrame(animRef.current)
  }, [playing])

  async function togglePlay() {
    const audio = audioRef.current
    if (!audio) return
    if (!started) { setupAnalyser(); setStarted(true) }
    if (audioCtxRef.current?.state === 'suspended') await audioCtxRef.current.resume()
    if (playing) {
      audio.pause()
      cancelAnimationFrame(animRef.current)
    } else {
      await audio.play()
      drawVisualizer()
    }
    setPlaying(p => !p)
  }

  function prevTrack() { setTrackIndex(i => (i - 1 + TRACKS.length) % TRACKS.length); setPlaying(false) }
  function nextTrack() { setTrackIndex(i => (i + 1) % TRACKS.length); setPlaying(false) }
  function toggleMute() { audioRef.current.muted = !muted; setMuted(m => !m) }

  function handleVolumeChange(e) {
  const v = parseFloat(e.target.value)
  setVolume(v)
  if (audioRef.current) audioRef.current.volume = v
}

  function handleSeek(e) {
    const rect = e.currentTarget.getBoundingClientRect()
    const pct = (e.clientX - rect.left) / rect.width
    const t = pct * duration
    audioRef.current.currentTime = t
    setCurrentTime(t)
  }

  function handleTimeUpdate() {
    const audio = audioRef.current
    setCurrentTime(audio.currentTime)
    setDuration(audio.duration || 0)
  }

  useEffect(() => {
    if (!started) return
    const audio = audioRef.current
    audio.load()
    if (playing) audio.play().then(() => drawVisualizer()).catch(() => {})
  }, [trackIndex])

  function fmt(s) {
    if (!s || isNaN(s)) return '0:00'
    return `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, '0')}`
  }

  const pct = duration ? (currentTime / duration) * 100 : 0

  return (
    <>
      <audio ref={audioRef} src={track.file} onTimeUpdate={handleTimeUpdate} onEnded={nextTrack} onLoadedMetadata={handleTimeUpdate} preload="auto" />

      <div className="p-panel-header">
        <div className="p-panel-dot" />
        <div className="p-panel-title">Now Playing</div>
      </div>

      <div className="p-wmp-screen">
        <span className="p-wmp-label">▶ SPECTRUM</span>
        <canvas ref={canvasRef} width={200} height={56} style={{ width: '100%', height: '100%', display: 'block' }} />
      </div>

      <div className="p-wmp-track">{track.title}</div>

      <div className="p-wmp-progress" onClick={handleSeek}>
        <div className="p-wmp-progress-fill" style={{ width: `${pct}%` }} />
      </div>

      <div className="p-wmp-time">
        <span>{fmt(currentTime)}</span>
        <span>{fmt(duration)}</span>
      </div>

      <div className="p-wmp-controls">
        <button className="p-wmp-btn" onClick={prevTrack}>⏮</button>
        <button className={`p-wmp-btn${playing ? ' play' : ''}`} onClick={togglePlay}>{playing ? '⏸' : '▶'}</button>
        <button className="p-wmp-btn" onClick={nextTrack}>⏭</button>
        <button className="p-wmp-btn" onClick={toggleMute}>{muted ? '🔇' : '🔊'}</button>
      </div>

      <div className="p-vol-row">
        <span className="p-vol-label">VOL</span>
        <input
          type="range" min={0} max={1} step={0.01} value={volume}
          onChange={handleVolumeChange}
          style={{ flex: 1, height: '4px', accentColor: '#4499ff', cursor: 'pointer' }}
        />
      </div>
    </>
  )
}