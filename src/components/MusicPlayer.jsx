import { useState, useEffect, useRef } from 'react'

// Drop your tracks in /public/music/
// Default falls back to /music.mp3 if no playlist
const TRACKS = [
  { title: 'TRACK 01', file: '/music.mp3' },
]

export default function MusicPlayer() {
  const audioRef = useRef(null)
  const canvasRef = useRef(null)
  const analyserRef = useRef(null)
  const animRef = useRef(null)
  const audioCtxRef = useRef(null)

  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(false)
  const [volume, setVolume] = useState(0.7)
  const [trackIndex, setTrackIndex] = useState(0)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [started, setStarted] = useState(false)

  const track = TRACKS[trackIndex]

  // Set up Web Audio analyser on first play
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

      ctx.fillStyle = '#050000'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      const barWidth = (canvas.width / bufferLength) * 1.8
      let x = 0

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height
        const r = 180 + dataArray[i] * 0.3
        const g = 0
        const b = 0
        ctx.fillStyle = `rgb(${r},${g},${b})`
        ctx.fillRect(x, canvas.height - barHeight, barWidth - 1, barHeight)

        // Peak dot
        ctx.fillStyle = '#ff4444'
        ctx.fillRect(x, canvas.height - barHeight - 2, barWidth - 1, 2)
        x += barWidth + 1
      }
    }
    draw()
  }

  async function togglePlay() {
    const audio = audioRef.current
    if (!audio) return

    if (!started) {
      setupAnalyser()
      setStarted(true)
    }

    if (audioCtxRef.current?.state === 'suspended') {
      await audioCtxRef.current.resume()
    }

    if (playing) {
      audio.pause()
      cancelAnimationFrame(animRef.current)
    } else {
      await audio.play()
      drawVisualizer()
    }
    setPlaying(p => !p)
  }

  function prevTrack() {
    setTrackIndex(i => (i - 1 + TRACKS.length) % TRACKS.length)
    setPlaying(false)
  }

  function nextTrack() {
    setTrackIndex(i => (i + 1) % TRACKS.length)
    setPlaying(false)
  }

  function toggleMute() {
    audioRef.current.muted = !muted
    setMuted(m => !m)
  }

  function handleVolumeChange(e) {
    const v = parseFloat(e.target.value)
    setVolume(v)
    audioRef.current.volume = v
  }

  function handleSeek(e) {
    const v = parseFloat(e.target.value)
    audioRef.current.currentTime = v
    setCurrentTime(v)
  }

  function handleTimeUpdate() {
    const audio = audioRef.current
    setCurrentTime(audio.currentTime)
    setProgress(audio.currentTime)
    setDuration(audio.duration || 0)
  }

  function handleEnded() {
    nextTrack()
  }

  // Auto-play next track when trackIndex changes (after first interaction)
  useEffect(() => {
    if (!started) return
    const audio = audioRef.current
    audio.load()
    if (playing) {
      audio.play().then(() => drawVisualizer()).catch(() => {})
    }
  }, [trackIndex])

  function fmt(s) {
    if (!s || isNaN(s)) return '0:00'
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60).toString().padStart(2, '0')
    return `${m}:${sec}`
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '1rem',
      left: '50%',
      transform: 'translateX(-50%)',
      width: '320px',
      zIndex: 9000,
      fontFamily: "'Courier New', monospace",
    }}>
      {/* Player body */}
      <div style={{
        background: 'linear-gradient(160deg, #2a2a2a 0%, #1a1a1a 50%, #222 100%)',
        border: '1px solid #555',
        borderBottomColor: '#111',
        borderRightColor: '#111',
        borderRadius: '8px 8px 4px 4px',
        boxShadow: '0 -4px 20px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.08)',
        padding: '0.6rem',
      }}>
        {/* Header bar */}
        <div style={{
          background: 'linear-gradient(90deg, #1a0000, #330000, #1a0000)',
          borderRadius: '4px 4px 0 0',
          padding: '0.2rem 0.5rem',
          marginBottom: '0.4rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          border: '1px solid #550000',
        }}>
          <span style={{ fontSize: '0.6rem', color: '#ff2222', letterSpacing: '2px', textTransform: 'uppercase' }}>
            ▶ NOW PLAYING
          </span>
          <span style={{ fontSize: '0.6rem', color: '#440000', letterSpacing: '1px' }}>
            WMP-Y2K
          </span>
        </div>

        {/* Visualizer canvas */}
        <canvas
          ref={canvasRef}
          width={296}
          height={50}
          style={{
            width: '100%',
            height: '50px',
            display: 'block',
            border: '1px solid #220000',
            borderRadius: '2px',
            marginBottom: '0.4rem',
            background: '#050000',
          }}
        />

        {/* Track name */}
        <div style={{
          background: '#080000',
          border: '1px solid #1a0000',
          borderRadius: '2px',
          padding: '0.3rem 0.5rem',
          marginBottom: '0.4rem',
          fontSize: '0.7rem',
          color: '#ff4444',
          letterSpacing: '1px',
          textTransform: 'uppercase',
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          textOverflow: 'ellipsis',
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.6)',
        }}>
          {track.title}
        </div>

        {/* Progress bar */}
        <input
          type="range"
          min={0}
          max={duration || 1}
          step={0.1}
          value={currentTime}
          onChange={handleSeek}
          style={{
            width: '100%',
            height: '6px',
            marginBottom: '0.4rem',
            accentColor: '#ff2222',
            cursor: 'pointer',
          }}
        />

        {/* Time display */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '0.62rem',
          color: '#550000',
          marginBottom: '0.5rem',
          letterSpacing: '1px',
        }}>
          <span>{fmt(currentTime)}</span>
          <span>{fmt(duration)}</span>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', gap: '0.3rem', justifyContent: 'center', marginBottom: '0.5rem' }}>
          {[
            { label: '⏮', action: prevTrack },
            { label: playing ? '⏸' : '▶', action: togglePlay, primary: true },
            { label: '⏭', action: nextTrack },
            { label: muted ? '🔇' : '🔊', action: toggleMute },
          ].map((btn, i) => (
            <button
              key={i}
              onClick={btn.action}
              style={{
                flex: btn.primary ? 2 : 1,
                padding: '0.4rem',
                fontSize: btn.primary ? '0.9rem' : '0.75rem',
                fontFamily: 'inherit',
                background: btn.primary
                  ? 'linear-gradient(180deg, #6a0000 0%, #440000 100%)'
                  : 'linear-gradient(180deg, #333 0%, #222 100%)',
                color: btn.primary ? '#ffaaaa' : '#aaa',
                border: '1px solid',
                borderTopColor: btn.primary ? '#aa2222' : '#555',
                borderLeftColor: btn.primary ? '#aa2222' : '#555',
                borderBottomColor: btn.primary ? '#110000' : '#111',
                borderRightColor: btn.primary ? '#110000' : '#111',
                borderRadius: '3px',
                cursor: 'pointer',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06), 0 2px 4px rgba(0,0,0,0.5)',
                transition: 'all 0.1s',
              }}
            >
              {btn.label}
            </button>
          ))}
        </div>

        {/* Volume */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ fontSize: '0.6rem', color: '#444', letterSpacing: '1px', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>VOL</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={handleVolumeChange}
            style={{ flex: 1, height: '4px', accentColor: '#ff2222', cursor: 'pointer' }}
          />
        </div>
      </div>

      <audio
        ref={audioRef}
        src={track.file}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        onLoadedMetadata={handleTimeUpdate}
        preload="auto"
      />
    </div>
  )
}