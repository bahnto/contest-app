// Sound engine — all sounds handled here

const soundCache = {}

async function loadSound(url) {
  if (soundCache[url]) return soundCache[url]
  try {
    const res = await fetch(url)
    const buf = await res.arrayBuffer()
    const ctx = getAudioCtx()
    const decoded = await ctx.decodeAudioData(buf)
    soundCache[url] = decoded
    return decoded
  } catch (e) {
    return null
  }
}

let _ctx = null
function getAudioCtx() {
  if (!_ctx) _ctx = new (window.AudioContext || window.webkitAudioContext)()
  return _ctx
}

function resumeCtx() {
  const ctx = getAudioCtx()
  if (ctx.state === 'suspended') ctx.resume()
}

export function playSound(url, volume = 0.7) {
  resumeCtx()
  const ctx = getAudioCtx()
  loadSound(url).then(buf => {
    if (!buf) return
    const source = ctx.createBufferSource()
    source.buffer = buf
    const gain = ctx.createGain()
    gain.gain.value = volume
    source.connect(gain)
    gain.connect(ctx.destination)
    source.start()
  })
}

// Synthesized reveal sound — anime UI style
// Ascending sweep + chord stab + shimmer
export function playReveal() {
  resumeCtx()
  const ctx = getAudioCtx()
  const now = ctx.currentTime

  // 1. Ascending frequency sweep
  const sweep = ctx.createOscillator()
  const sweepGain = ctx.createGain()
  sweep.type = 'sine'
  sweep.frequency.setValueAtTime(200, now)
  sweep.frequency.exponentialRampToValueAtTime(1800, now + 0.6)
  sweepGain.gain.setValueAtTime(0, now)
  sweepGain.gain.linearRampToValueAtTime(0.15, now + 0.05)
  sweepGain.gain.linearRampToValueAtTime(0.12, now + 0.4)
  sweepGain.gain.linearRampToValueAtTime(0, now + 0.7)
  sweep.connect(sweepGain)
  sweepGain.connect(ctx.destination)
  sweep.start(now)
  sweep.stop(now + 0.7)

  // 2. Chord stab at peak (3 notes — major chord)
  const notes = [880, 1108, 1320] // A5, C#6, E6
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'triangle'
    osc.frequency.value = freq
    gain.gain.setValueAtTime(0, now + 0.5)
    gain.gain.linearRampToValueAtTime(0.08, now + 0.55 + i * 0.03)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.8)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(now + 0.5)
    osc.stop(now + 1.8)
  })

  // 3. High shimmer — metallic ping
  const ping = ctx.createOscillator()
  const pingGain = ctx.createGain()
  ping.type = 'sine'
  ping.frequency.setValueAtTime(3200, now + 0.55)
  ping.frequency.exponentialRampToValueAtTime(2400, now + 1.5)
  pingGain.gain.setValueAtTime(0, now + 0.55)
  pingGain.gain.linearRampToValueAtTime(0.06, now + 0.58)
  pingGain.gain.exponentialRampToValueAtTime(0.001, now + 1.5)
  ping.connect(pingGain)
  pingGain.connect(ctx.destination)
  ping.start(now + 0.55)
  ping.stop(now + 1.5)

  // 4. Low thump to anchor it
  const thump = ctx.createOscillator()
  const thumpGain = ctx.createGain()
  thump.type = 'sine'
  thump.frequency.setValueAtTime(80, now + 0.5)
  thump.frequency.exponentialRampToValueAtTime(40, now + 0.8)
  thumpGain.gain.setValueAtTime(0, now + 0.5)
  thumpGain.gain.linearRampToValueAtTime(0.25, now + 0.52)
  thumpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.8)
  thump.connect(thumpGain)
  thumpGain.connect(ctx.destination)
  thump.start(now + 0.5)
  thump.stop(now + 0.8)
}

// Preload sounds after first interaction
export function preloadSounds() {
  loadSound('/sounds/vote.mp3')
  loadSound('/sounds/welcome.mp3')
}