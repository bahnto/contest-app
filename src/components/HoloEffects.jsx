import { useEffect, useRef } from 'react'

export default function HoloEffects() {
  const canvasRef = useRef(null)
  const trailRef = useRef([])
  const particlesRef = useRef([])
  const mouseRef = useRef({ x: -100, y: -100 })
  const animRef = useRef(null)
  const timeRef = useRef(0)

  useEffect(() => {
    document.body.style.cursor = 'none'
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')

    function resize() {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    // Background geo particles
    particlesRef.current = Array.from({ length: 20 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.2,
      vy: (Math.random() - 0.5) * 0.2,
      size: Math.random() * 2.5 + 1,
      type: Math.floor(Math.random() * 2),
      opacity: Math.random() * 0.15 + 0.03,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.008,
      color: Math.random() > 0.5 ? '#b060ff' : '#00ffee',
    }))

    function drawHUDCircle(t) {
      const cx = canvas.width * 0.5
      const cy = canvas.height * 0.5
      const maxR = Math.min(canvas.width, canvas.height) * 0.38

      ctx.save()
      ctx.translate(cx, cy)

      // Outer ring — slow rotate
      ctx.save()
      ctx.rotate(t * 0.12)
      ctx.beginPath()
      ctx.arc(0, 0, maxR, 0, Math.PI * 2)
      ctx.strokeStyle = 'rgba(0,255,238,0.06)'
      ctx.lineWidth = 1
      ctx.stroke()
      // Dashes on outer ring
      for (let i = 0; i < 24; i++) {
        const a = (Math.PI * 2 / 24) * i
        const r1 = maxR - 8
        const r2 = maxR
        ctx.beginPath()
        ctx.moveTo(Math.cos(a) * r1, Math.sin(a) * r1)
        ctx.lineTo(Math.cos(a) * r2, Math.sin(a) * r2)
        ctx.strokeStyle = i % 6 === 0 ? 'rgba(0,255,238,0.25)' : 'rgba(0,255,238,0.08)'
        ctx.lineWidth = i % 6 === 0 ? 1.5 : 0.7
        ctx.stroke()
      }
      ctx.restore()

      // Mid ring — counter-rotate
      ctx.save()
      ctx.rotate(-t * 0.2)
      const midR = maxR * 0.72
      ctx.beginPath()
      ctx.arc(0, 0, midR, 0, Math.PI * 2)
      ctx.strokeStyle = 'rgba(176,96,255,0.07)'
      ctx.lineWidth = 0.8
      ctx.stroke()
      // Arcs on mid ring
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI * 2 / 6) * i
        ctx.save()
        ctx.rotate(a)
        ctx.beginPath()
        ctx.arc(0, 0, midR, -0.25, 0.25)
        ctx.strokeStyle = 'rgba(176,96,255,0.3)'
        ctx.lineWidth = 1.5
        ctx.stroke()
        ctx.restore()
      }
      ctx.restore()

      // Inner ring — fast rotate
      ctx.save()
      ctx.rotate(t * 0.35)
      const innerR = maxR * 0.45
      ctx.beginPath()
      ctx.arc(0, 0, innerR, 0, Math.PI * 2)
      ctx.strokeStyle = 'rgba(68,153,255,0.06)'
      ctx.lineWidth = 0.7
      ctx.stroke()
      // Tick marks
      for (let i = 0; i < 12; i++) {
        const a = (Math.PI * 2 / 12) * i
        const r1 = innerR - 5
        const r2 = innerR
        ctx.beginPath()
        ctx.moveTo(Math.cos(a) * r1, Math.sin(a) * r1)
        ctx.lineTo(Math.cos(a) * r2, Math.sin(a) * r2)
        ctx.strokeStyle = 'rgba(68,153,255,0.2)'
        ctx.lineWidth = 0.8
        ctx.stroke()
      }
      ctx.restore()

      // Radial lines (static)
      for (let i = 0; i < 8; i++) {
        const a = (Math.PI * 2 / 8) * i
        ctx.beginPath()
        ctx.moveTo(Math.cos(a) * innerR * 0.3, Math.sin(a) * innerR * 0.3)
        ctx.lineTo(Math.cos(a) * maxR, Math.sin(a) * maxR)
        ctx.strokeStyle = 'rgba(0,255,238,0.03)'
        ctx.lineWidth = 0.5
        ctx.stroke()
      }

      // Pulse ring — breathing
      const pulse = 0.5 + Math.sin(t * 1.5) * 0.5
      ctx.beginPath()
      ctx.arc(0, 0, maxR * 0.25, 0, Math.PI * 2)
      ctx.strokeStyle = `rgba(0,255,238,${0.04 + pulse * 0.08})`
      ctx.lineWidth = 1 + pulse * 1.5
      ctx.stroke()

      // Center crosshair
      ctx.save()
      ctx.rotate(t * 0.5)
      const ch = 12
      ctx.strokeStyle = 'rgba(0,255,238,0.2)'
      ctx.lineWidth = 0.8
      ctx.beginPath(); ctx.moveTo(-ch, 0); ctx.lineTo(-ch * 0.3, 0); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(ch * 0.3, 0); ctx.lineTo(ch, 0); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(0, -ch); ctx.lineTo(0, -ch * 0.3); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(0, ch * 0.3); ctx.lineTo(0, ch); ctx.stroke()
      ctx.restore()

      // Targeting arc — sweeps around
      ctx.save()
      ctx.rotate(t * 0.8)
      const sweepR = maxR * 0.6
      const grad = ctx.createConicalGradient
        ? null
        : null
      ctx.beginPath()
      ctx.arc(0, 0, sweepR, 0, Math.PI * 0.4)
      ctx.strokeStyle = 'rgba(0,255,238,0.12)'
      ctx.lineWidth = 2
      ctx.stroke()
      ctx.restore()

      ctx.restore()
    }

    function drawCursor(x, y) {
      ctx.save()
      ctx.translate(x, y)

      // Outer triangle
      ctx.save()
      ctx.rotate(-Math.PI * 0.75)
      const s = 11
      ctx.beginPath()
      ctx.moveTo(0, -s * 1.3)
      ctx.lineTo(s * 1.1, s * 0.65)
      ctx.lineTo(-s * 1.1, s * 0.65)
      ctx.closePath()
      ctx.strokeStyle = '#00ffee'
      ctx.lineWidth = 1.5
      ctx.shadowColor = '#00ffee'
      ctx.shadowBlur = 10
      ctx.stroke()

      // Inner fill
      ctx.beginPath()
      ctx.moveTo(0, -s * 0.65)
      ctx.lineTo(s * 0.55, s * 0.32)
      ctx.lineTo(-s * 0.55, s * 0.32)
      ctx.closePath()
      ctx.fillStyle = 'rgba(0,255,238,0.1)'
      ctx.fill()
      ctx.strokeStyle = 'rgba(176,96,255,0.7)'
      ctx.lineWidth = 0.8
      ctx.shadowColor = '#b060ff'
      ctx.shadowBlur = 6
      ctx.stroke()
      ctx.restore()

      // Center dot
      ctx.beginPath()
      ctx.arc(0, 0, 1.5, 0, Math.PI * 2)
      ctx.fillStyle = '#00ffee'
      ctx.shadowColor = '#00ffee'
      ctx.shadowBlur = 8
      ctx.fill()

      ctx.restore()
    }

    function drawTrail() {
      trailRef.current.forEach(p => {
        ctx.save()
        ctx.globalAlpha = p.life * 0.5
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rotation)
        if (p.type === 0) {
          ctx.beginPath()
          ctx.moveTo(0, -p.size)
          ctx.lineTo(p.size * 0.866, p.size * 0.5)
          ctx.lineTo(-p.size * 0.866, p.size * 0.5)
          ctx.closePath()
        } else {
          ctx.beginPath()
          ctx.moveTo(0, -p.size)
          ctx.lineTo(p.size * 0.6, 0)
          ctx.lineTo(0, p.size)
          ctx.lineTo(-p.size * 0.6, 0)
          ctx.closePath()
        }
        ctx.strokeStyle = p.color
        ctx.lineWidth = 0.8
        ctx.shadowColor = p.color
        ctx.shadowBlur = 4
        ctx.stroke()
        ctx.restore()
      })
    }

    function animate() {
      animRef.current = requestAnimationFrame(animate)
      timeRef.current += 0.016
      const t = timeRef.current

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // HUD circle
      drawHUDCircle(t)

      // Background geo particles
      particlesRef.current.forEach(p => {
        p.x += p.vx; p.y += p.vy; p.rotation += p.rotSpeed
        if (p.x < -20) p.x = canvas.width + 20
        if (p.x > canvas.width + 20) p.x = -20
        if (p.y < -20) p.y = canvas.height + 20
        if (p.y > canvas.height + 20) p.y = -20

        ctx.save()
        ctx.globalAlpha = p.opacity
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rotation)

        if (p.type === 0) {
          ctx.beginPath()
          ctx.moveTo(0, -p.size * 2)
          ctx.lineTo(p.size * 1.7, p.size)
          ctx.lineTo(-p.size * 1.7, p.size)
          ctx.closePath()
        } else {
          ctx.beginPath()
          ctx.moveTo(0, -p.size * 2)
          ctx.lineTo(p.size * 1.2, 0)
          ctx.lineTo(0, p.size * 2)
          ctx.lineTo(-p.size * 1.2, 0)
          ctx.closePath()
        }
        ctx.strokeStyle = p.color
        ctx.lineWidth = 0.6
        ctx.stroke()
        ctx.restore()
      })

      // Trail
      trailRef.current = trailRef.current.filter(p => p.life > 0)
      trailRef.current.forEach(p => { p.life -= 0.045; p.rotation += 0.06 })
      drawTrail()

      // Cursor
      drawCursor(mouseRef.current.x, mouseRef.current.y)
    }

    function onMouseMove(e) {
      const prev = { ...mouseRef.current }
      mouseRef.current = { x: e.clientX, y: e.clientY }
      const dx = e.clientX - prev.x
      const dy = e.clientY - prev.y
      if (Math.sqrt(dx * dx + dy * dy) > 4) {
        trailRef.current.push({
          x: e.clientX + (Math.random() - 0.5) * 10,
          y: e.clientY + (Math.random() - 0.5) * 10,
          size: Math.random() * 3 + 1,
          life: 0.7 + Math.random() * 0.3,
          rotation: Math.random() * Math.PI * 2,
          type: Math.random() > 0.5 ? 0 : 1,
          color: Math.random() > 0.5 ? '#00ffee' : '#b060ff',
        })
        if (trailRef.current.length > 18) trailRef.current.shift()
      }
    }

    window.addEventListener('mousemove', onMouseMove)
    animate()

    return () => {
      document.body.style.cursor = ''
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', onMouseMove)
      cancelAnimationFrame(animRef.current)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9990 }}
    />
  )
}