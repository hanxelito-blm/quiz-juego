import { useRef, useCallback, useEffect } from 'react'

/**
 * useAudio — Web Audio API synthesizer
 *   - Background music: looping arpeggio with bass line
 *   - Eat SFX: rising double-tone blip
 *   - Death SFX: descending crash + rumble
 *   - Level-up SFX: fanfare arpeggio
 */
const useAudio = () => {
  const ctxRef        = useRef(null)
  const masterRef     = useRef(null)   // master gain
  const musicGainRef  = useRef(null)   // music sub-bus
  const sfxGainRef    = useRef(null)   // sfx sub-bus
  const isPlayingRef  = useRef(false)
  const timerRef      = useRef(null)
  const beatRef       = useRef(0)
  const isReadyRef    = useRef(false)

  // ── Melody & bass sequences ────────────────────────────────────────────────
  // Pentatonic scale — always sounds good
  const MELODY = [261.63, 293.66, 329.63, 392.00, 440.00, 392.00, 329.63, 293.66,
                  261.63, 329.63, 392.00, 523.25, 440.00, 392.00, 329.63, 261.63]
  const BASS   = [65.41, 65.41, 73.42, 65.41, 65.41, 73.42, 82.41, 73.42]

  // ── Init AudioContext (must be triggered by user gesture) ─────────────────
  const init = useCallback(() => {
    if (ctxRef.current) return
    try {
      const AC = window.AudioContext || window.webkitAudioContext
      if (!AC) return
      ctxRef.current = new AC()

      // Master gain
      masterRef.current = ctxRef.current.createGain()
      masterRef.current.gain.value = 0.7
      masterRef.current.connect(ctxRef.current.destination)

      // Music sub-bus
      musicGainRef.current = ctxRef.current.createGain()
      musicGainRef.current.gain.value = 0.18
      musicGainRef.current.connect(masterRef.current)

      // SFX sub-bus (louder)
      sfxGainRef.current = ctxRef.current.createGain()
      sfxGainRef.current.gain.value = 0.55
      sfxGainRef.current.connect(masterRef.current)

      // Resume if suspended
      if (ctxRef.current.state === 'suspended') {
        ctxRef.current.resume().then(() => { isReadyRef.current = true }).catch(() => {})
      } else {
        isReadyRef.current = true
      }
    } catch (e) {
      console.warn('Web Audio not supported:', e)
    }
  }, [])

  // ── Low-level oscillator helper ────────────────────────────────────────────
  const tone = useCallback((freq, start, dur, type = 'sine', vol = 1, bus = null) => {
    const ctx = ctxRef.current
    if (!ctx || ctx.state !== 'running') return
    const targetBus = bus || sfxGainRef.current
    if (!targetBus) return

    const osc  = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = type
    osc.frequency.setValueAtTime(freq, start)
    gain.gain.setValueAtTime(0.001, start)
    gain.gain.linearRampToValueAtTime(vol, start + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.001, start + dur)

    osc.connect(gain)
    gain.connect(targetBus)
    osc.start(start)
    osc.stop(start + dur + 0.05)
  }, [])

  // ── Background music loop ─────────────────────────────────────────────────
  const playBGMusic = useCallback(() => {
    init()
    if (isPlayingRef.current) return
    isPlayingRef.current = true

    const TEMPO = 0.18  // seconds per 16th note

    const tick = () => {
      if (!isPlayingRef.current) return
      const ctx = ctxRef.current
      if (!ctx || ctx.state !== 'running') {
        timerRef.current = setTimeout(tick, 200)
        return
      }

      const beat = beatRef.current
      const now  = ctx.currentTime
      const bus  = musicGainRef.current

      // Melody note every beat
      const mel = MELODY[beat % MELODY.length]
      tone(mel, now, TEMPO * 1.6, 'triangle', 0.8, bus)

      // High shimmer on every 4th beat
      if (beat % 4 === 0) {
        tone(mel * 2, now, TEMPO * 0.8, 'sine', 0.3, bus)
      }

      // Bass every 2 beats
      if (beat % 2 === 0) {
        tone(BASS[Math.floor(beat / 2) % BASS.length], now, TEMPO * 3, 'sawtooth', 0.6, bus)
      }

      // Subtle drum click on beat 0 and 8
      if (beat % 8 === 0 || beat % 8 === 4) {
        const noiseOsc = ctx.createOscillator()
        const noiseGain = ctx.createGain()
        noiseOsc.type = 'square'
        noiseOsc.frequency.setValueAtTime(180, now)
        noiseOsc.frequency.exponentialRampToValueAtTime(40, now + 0.06)
        noiseGain.gain.setValueAtTime(0.3, now)
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08)
        noiseOsc.connect(noiseGain)
        noiseGain.connect(bus)
        noiseOsc.start(now)
        noiseOsc.stop(now + 0.1)
      }

      beatRef.current = (beat + 1) % 64
      timerRef.current = setTimeout(tick, TEMPO * 1000)
    }

    setTimeout(tick, 300)
  }, [init, tone])

  // ── Stop music ─────────────────────────────────────────────────────────────
  const stopBGMusic = useCallback(() => {
    isPlayingRef.current = false
    if (timerRef.current) clearTimeout(timerRef.current)
    // Fade out
    if (musicGainRef.current && ctxRef.current?.state === 'running') {
      musicGainRef.current.gain.setTargetAtTime(0, ctxRef.current.currentTime, 0.3)
    }
  }, [])

  // ── SFX: eat ──────────────────────────────────────────────────────────────
  const playEat = useCallback(() => {
    if (!isReadyRef.current || ctxRef.current?.state !== 'running') return
    const t = ctxRef.current.currentTime
    tone(440, t,        0.08, 'triangle', 1)
    tone(880, t + 0.07, 0.08, 'triangle', 0.8)
  }, [tone])

  // ── SFX: death — dramatic descending crash ─────────────────────────────────
  const playDeath = useCallback(() => {
    if (!ctxRef.current) return
    const ctx = ctxRef.current
    if (ctx.state === 'suspended') ctx.resume().catch(() => {})

    const t    = ctx.currentTime
    const bus  = sfxGainRef.current || masterRef.current
    if (!bus) return

    // Descending screech
    ;[0, 0.12, 0.24, 0.36].forEach((delay, i) => {
      const freq = 400 - i * 80
      tone(freq, t + delay, 0.25, 'sawtooth', 1 - i * 0.15, bus)
    })

    // Low boom
    const boomOsc  = ctx.createOscillator()
    const boomGain = ctx.createGain()
    boomOsc.type = 'sine'
    boomOsc.frequency.setValueAtTime(80, t + 0.1)
    boomOsc.frequency.exponentialRampToValueAtTime(20, t + 0.8)
    boomGain.gain.setValueAtTime(0.001, t + 0.1)
    boomGain.gain.linearRampToValueAtTime(1, t + 0.12)
    boomGain.gain.exponentialRampToValueAtTime(0.001, t + 0.9)
    boomOsc.connect(boomGain)
    boomGain.connect(bus)
    boomOsc.start(t + 0.1)
    boomOsc.stop(t + 1.0)

    // Noise burst (crunch)
    const noiseOsc  = ctx.createOscillator()
    const noiseGain = ctx.createGain()
    noiseOsc.type = 'square'
    noiseOsc.frequency.setValueAtTime(200, t)
    noiseOsc.frequency.exponentialRampToValueAtTime(30, t + 0.4)
    noiseGain.gain.setValueAtTime(0.001, t)
    noiseGain.gain.linearRampToValueAtTime(0.7, t + 0.02)
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.5)
    noiseOsc.connect(noiseGain)
    noiseGain.connect(bus)
    noiseOsc.start(t)
    noiseOsc.stop(t + 0.55)

    // Sad descending melody
    const sadNotes = [523.25, 392.00, 329.63, 261.63]
    sadNotes.forEach((freq, i) => {
      tone(freq, t + 0.5 + i * 0.18, 0.3, 'sine', 0.5 - i * 0.08, bus)
    })
  }, [tone])

  // ── SFX: level up ────────────────────────────────────────────────────────
  const playLevelUp = useCallback(() => {
    if (!isReadyRef.current || ctxRef.current?.state !== 'running') return
    const t   = ctxRef.current.currentTime
    const bus = sfxGainRef.current
    const up  = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99]
    up.forEach((freq, i) => {
      tone(freq, t + i * 0.1, 0.25, 'triangle', 0.9 - i * 0.08, bus)
    })
  }, [tone])

  // ── Mute toggle ───────────────────────────────────────────────────────────
  const toggleMute = useCallback(() => {
    if (!masterRef.current) return
    const g = masterRef.current.gain
    const ctx = ctxRef.current
    if (!ctx) return
    const current = g.value
    g.setTargetAtTime(current > 0.01 ? 0 : 0.7, ctx.currentTime, 0.1)
  }, [])

  // ── Auto-init on first user interaction ──────────────────────────────────
  useEffect(() => {
    const trigger = () => {
      init()
      if (ctxRef.current?.state === 'suspended') {
        ctxRef.current.resume().then(() => { isReadyRef.current = true }).catch(() => {})
      } else if (ctxRef.current?.state === 'running') {
        isReadyRef.current = true
      }
    }
    document.addEventListener('keydown',   trigger, { once: true })
    document.addEventListener('mousedown', trigger, { once: true })
    document.addEventListener('touchstart',trigger, { once: true })
    return () => {
      isPlayingRef.current = false
      if (timerRef.current) clearTimeout(timerRef.current)
      ctxRef.current?.close().catch(() => {})
      document.removeEventListener('keydown',    trigger)
      document.removeEventListener('mousedown',  trigger)
      document.removeEventListener('touchstart', trigger)
    }
  }, [init])

  return { playBGMusic, stopBGMusic, playEat, playDeath, playLevelUp, toggleMute, isReadyRef }
}

export default useAudio