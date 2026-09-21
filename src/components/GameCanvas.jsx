import { useEffect, useRef, useCallback, useState } from 'react'
import useGameState from '../hooks/useGameState.js'
import useTimer from '../hooks/useTimer.js'
import useAudio from '../hooks/useAudio.js'

const ASSETS = {
  head: new Image(),
  body: new Image(),
  rock: new Image(),
  food: new Image()
}
ASSETS.head.src = '/assets/snake_head.jpg'
ASSETS.body.src = '/assets/snake_body.jpg'
ASSETS.rock.src = '/assets/obstacle_rock.jpg'
ASSETS.food.src = '/assets/food_orb.jpg'

const LERP = (a, b, t) => a + (b - a) * t

const GameCanvas = ({ level, onGameOver, onScoreChange, customColor, customHead, isPaused, onPauseToggle }) => {
  const canvasRef    = useRef(null)
  const animRef      = useRef(null)
  const [canvasSize, setCanvasSize] = useState({ width: 900, height: 560 })
  const [isMuted, setIsMuted]       = useState(false)
  const prevScoreRef = useRef(0)
  const [paused, setPaused] = useState(false)

  const {
    score,
    isGameOver,
    isRunning,
    isRunningRef,
    isGameOverRef,
    scoreRef,
    snakeRef,
    foodRef,
    obstaclesRef,
    enemiesRef,
    cameraRef,
    gameStep,
    endGame,
    initGame,
    updateDirection,
    defaultColor,
    defaultHead,
  } = useGameState(customColor, customHead)

  const effectiveColor = customColor || defaultColor
  const effectiveHead  = customHead  || defaultHead

  useEffect(() => {
    setPaused(isPaused || false)
  }, [isPaused])

  const [snakeColor, setSnakeColor] = useState('yellow')
  
  useEffect(() => {
    setSnakeColor(localStorage.getItem('snakeColor') || 'yellow')
  }, [])

  const COLOR_MAP = {
    yellow: { head: '#eab308', mid: '#d97706', tail: '#78350f' },
    red:    { head: '#ef4444', mid: '#b91c1c', tail: '#7f1d1d' },
    green:  { head: '#22c55e', mid: '#15803d', tail: '#14532d' },
    blue:   { head: '#3b82f6', mid: '#1d4ed8', tail: '#1e3a8a' },
    purple: { head: '#a855f7', mid: '#7e22ce', tail: '#4c1d95' }
  }
  const pColor = COLOR_MAP[snakeColor] || COLOR_MAP.yellow

  const { playBGMusic, stopBGMusic, playEat, playDeath, toggleMute } = useAudio()

  // ── Start music on first keypress ────────────────────────────────────────
  useEffect(() => {
    const startMusic = () => playBGMusic()
    document.addEventListener('keydown',    startMusic, { once: true })
    document.addEventListener('mousedown',  startMusic, { once: true })
    document.addEventListener('touchstart', startMusic, { once: true })
    return () => {
      document.removeEventListener('keydown',    startMusic)
      document.removeEventListener('mousedown',  startMusic)
      document.removeEventListener('touchstart', startMusic)
    }
  }, [playBGMusic])

  // ── Stop music when leaving page ─────────────────────────────────────────
  useEffect(() => {
    return () => stopBGMusic()
  }, [stopBGMusic])

  // ── Notify parent of score changes ────────────────────────────────────────
  useEffect(() => { onScoreChange(score) }, [score, onScoreChange])

  // ── Resize ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const resize = () => {
      const wrapper = document.getElementById('game-canvas-wrapper')
      if (!wrapper) return
      const w = Math.min(900, wrapper.clientWidth)
      const h = Math.min(580, Math.floor(window.innerHeight * 0.72))
      setCanvasSize({ width: w, height: h })
    }
    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])

  // ── Game-over handler ─────────────────────────────────────────────────────
  const handleGameOver = useCallback(() => {
    stopBGMusic()
    playDeath()
    const finalScore = endGame()
    onGameOver(finalScore)
  }, [endGame, onGameOver, stopBGMusic, playDeath])

  // ── Game loop (logic, ~60fps) — also triggers eat SFX ────────────────────
  useTimer(() => {
    if (paused) return
    const currentScore = scoreRef.current
    const alive = gameStep()
    if (scoreRef.current > currentScore) playEat()
    if (!alive) handleGameOver()
  }, 1000 / 60, isRunning && !isGameOver && !paused)

  // ── Keyboard controls ─────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'p' || e.key === 'P') {
        if (onPauseToggle) onPauseToggle()
        return
      }
      if (!isRunningRef.current || isGameOverRef.current || paused) return
      if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) e.preventDefault()
      updateDirection(e.key)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isRunningRef, isGameOverRef, updateDirection, paused, onPauseToggle])

  // ── Render loop (canvas, requestAnimationFrame) ───────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    canvas.width  = canvasSize.width
    canvas.height = canvasSize.height
    const W = canvasSize.width
    const H = canvasSize.height

    // Helper: world coords → screen coords
    const toScreen = (wx, wy) => {
      const cam = cameraRef.current
      return { x: wx - cam.x + W / 2, y: wy - cam.y + H / 2 }
    }

    const isVisible = (sx, sy, margin = 60) =>
      sx > -margin && sx < W + margin && sy > -margin && sy < H + margin

    const draw = () => {
      const now = Date.now()

      // ── Background ─────────────────────────────────────────────────────────
      const bg = ctx.createLinearGradient(0, 0, W, H)
      bg.addColorStop(0, '#05061a')
      bg.addColorStop(1, '#0a0e1a')
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, W, H)

      // ── Grid ───────────────────────────────────────────────────────────────
      ctx.strokeStyle = 'rgba(234,179,8,0.06)'
      ctx.lineWidth = 1
      ctx.setLineDash([2, 6])
      const cam = cameraRef.current
      const gs  = 60
      const x0  = Math.floor((cam.x - W / 2) / gs) * gs
      const y0  = Math.floor((cam.y - H / 2) / gs) * gs
      for (let x = x0; x < cam.x + W / 2; x += gs) {
        const sx = x - cam.x + W / 2
        ctx.beginPath(); ctx.moveTo(sx, 0); ctx.lineTo(sx, H); ctx.stroke()
      }
      for (let y = y0; y < cam.y + H / 2; y += gs) {
        const sy = y - cam.y + H / 2
        ctx.beginPath(); ctx.moveTo(0, sy); ctx.lineTo(W, sy); ctx.stroke()
      }
      ctx.setLineDash([])

      // ── World Borders ──────────────────────────────────────────────────────
      const WORLD_SIZE = 5000;
      ctx.save();
      ctx.fillStyle = 'rgba(239, 68, 68, 0.2)'; 
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 4;
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 15;

      const tl = toScreen(0, 0);
      const br = toScreen(WORLD_SIZE, WORLD_SIZE);

      // We only draw the borders if they are visible
      if (tl.x > 0) { // Left border
        ctx.fillRect(tl.x - 200, tl.y, 200, WORLD_SIZE);
        ctx.beginPath(); ctx.moveTo(tl.x, tl.y); ctx.lineTo(tl.x, br.y); ctx.stroke();
      }
      if (br.x < W) { // Right border
        ctx.fillRect(br.x, tl.y, 200, WORLD_SIZE);
        ctx.beginPath(); ctx.moveTo(br.x, tl.y); ctx.lineTo(br.x, br.y); ctx.stroke();
      }
      if (tl.y > 0) { // Top border
        ctx.fillRect(tl.x, tl.y - 200, WORLD_SIZE, 200);
        ctx.beginPath(); ctx.moveTo(tl.x, tl.y); ctx.lineTo(br.x, tl.y); ctx.stroke();
      }
      if (br.y < H) { // Bottom border
        ctx.fillRect(tl.x, br.y, WORLD_SIZE, 200);
        ctx.beginPath(); ctx.moveTo(tl.x, br.y); ctx.lineTo(br.x, br.y); ctx.stroke();
      }
      ctx.restore();

      // ── Obstacles (rocks) ──────────────────────────────────────────────────
      for (const obs of obstaclesRef.current) {
        const s = toScreen(obs.x, obs.y)
        if (!isVisible(s.x, s.y, obs.radius + 20)) continue

        ctx.save()
        ctx.translate(s.x, s.y)
        
        // Draw the image instead of polygon
        if (ASSETS.rock.complete) {
          ctx.beginPath()
          ctx.arc(0, 0, obs.radius, 0, Math.PI * 2)
          ctx.clip()
          
          ctx.drawImage(ASSETS.rock, -obs.radius, -obs.radius, obs.radius * 2, obs.radius * 2)
          
          // Draw a small red ring to indicate danger
          ctx.beginPath()
          ctx.arc(0, 0, obs.radius - 2, 0, Math.PI * 2)
          ctx.strokeStyle = '#ef4444'
          ctx.lineWidth = 3
          ctx.stroke()
        } else {
          // Fallback if image not loaded
          ctx.beginPath()
          ctx.arc(0, 0, obs.radius, 0, Math.PI * 2)
          ctx.fillStyle = '#374151'
          ctx.fill()
          ctx.fillText('💀', 0, 2)
        }
        ctx.restore()
      }

      // ── Food ───────────────────────────────────────────────────────────────
      for (const f of foodRef.current) {
        const s = toScreen(f.x, f.y)
        if (!isVisible(s.x, s.y, 30)) continue

        const pulse = 1 + 0.12 * Math.sin(now * 0.003 + f.x * 0.05)
        const rad = f.radius * pulse

        ctx.save()
        ctx.translate(s.x, s.y)

        if (ASSETS.food.complete) {
          ctx.beginPath()
          ctx.arc(0, 0, rad, 0, Math.PI * 2)
          ctx.clip()
          ctx.drawImage(ASSETS.food, -rad, -rad, rad * 2, rad * 2)

          // Extra glow based on food color
          ctx.beginPath()
          ctx.arc(0, 0, rad, 0, Math.PI * 2)
          ctx.strokeStyle = f.color
          ctx.shadowColor = f.color
          ctx.shadowBlur = 10
          ctx.lineWidth = 1
          ctx.stroke()
        } else {
          ctx.shadowColor = f.color
          ctx.shadowBlur  = 16
          const fg = ctx.createRadialGradient(-f.radius * 0.2, -f.radius * 0.2, 0, 0, 0, rad)
          fg.addColorStop(0, '#ffffff')
          fg.addColorStop(0.35, f.color)
          fg.addColorStop(1, f.color + '88')
          ctx.fillStyle = fg
          ctx.beginPath()
          ctx.arc(0, 0, rad, 0, Math.PI * 2)
          ctx.fill()
        }
        ctx.restore()
      }

      // ── Enemy snakes ───────────────────────────────────────────────────────
      ctx.lineCap  = 'round'
      ctx.lineJoin = 'round'

      for (const enemy of enemiesRef.current) {
        const segs = enemy.segments
        if (segs.length < 2) continue
        const hs = toScreen(segs[0].x, segs[0].y)
        if (!isVisible(hs.x, hs.y, 120)) continue

        // Body
        for (let i = 0; i < segs.length - 1; i++) {
          const ratio = 1 - i / segs.length
          const w     = LERP(2, 9, ratio)
          const s1 = toScreen(segs[i].x,     segs[i].y)
          const s2 = toScreen(segs[i+1].x, segs[i+1].y)
          const grad = ctx.createLinearGradient(s1.x, s1.y, s2.x, s2.y)
          grad.addColorStop(0, enemy.palette.head)
          grad.addColorStop(1, enemy.palette.trail)
          ctx.strokeStyle = grad
          ctx.shadowColor = enemy.palette.head
          ctx.shadowBlur  = w
          ctx.lineWidth   = w
          ctx.beginPath(); ctx.moveTo(s1.x, s1.y); ctx.lineTo(s2.x, s2.y); ctx.stroke()
          ctx.shadowBlur = 0
        }

        // Head
        ctx.save()
        ctx.translate(hs.x, hs.y)
        const pulseR = enemy.chasing ? 1 + 0.15 * Math.sin(now * 0.008) : 1
        ctx.shadowColor = enemy.palette.head
        ctx.shadowBlur  = enemy.chasing ? 25 : 12
        ctx.fillStyle   = enemy.palette.head
        ctx.beginPath(); ctx.arc(0, 0, 10 * pulseR, 0, Math.PI * 2); ctx.fill()
        ctx.shadowBlur = 0

        // Eyes (rotated toward movement direction)
        const ea = enemy.angle
        const ex = Math.cos(ea) * 4
        const ey = Math.sin(ea) * 4
        const px = -Math.sin(ea) * 2.5
        const py =  Math.cos(ea) * 2.5
        ctx.fillStyle = '#fff'
        ctx.beginPath(); ctx.arc(ex + px, ey + py, 2.5, 0, Math.PI * 2); ctx.fill()
        ctx.beginPath(); ctx.arc(ex - px, ey - py, 2.5, 0, Math.PI * 2); ctx.fill()
        ctx.fillStyle = '#000'
        ctx.beginPath(); ctx.arc(ex + px + 0.5, ey + py + 0.5, 1.2, 0, Math.PI * 2); ctx.fill()
        ctx.beginPath(); ctx.arc(ex - px + 0.5, ey - py + 0.5, 1.2, 0, Math.PI * 2); ctx.fill()

        if (enemy.chasing) {
          ctx.fillStyle   = '#ff4444'
          ctx.font        = 'bold 11px sans-serif'
          ctx.textAlign   = 'center'
          ctx.textBaseline = 'alphabetic'
          ctx.fillText('!', 0, -14)
        }
        ctx.restore()
      }

      // ── Player snake ───────────────────────────────────────────────────────
      const snake = snakeRef.current
      if (snake.length >= 2) {
        ctx.lineCap  = 'round'
        ctx.lineJoin = 'round'

        // Body segments
        for (let i = snake.length - 1; i > 0; i--) {
          const ratio = 1 - i / snake.length
          const w     = LERP(6, 16, ratio)
          const s1 = toScreen(snake[i].x,   snake[i].y)
          if (!isVisible(s1.x, s1.y, 60)) continue

          ctx.save()
          ctx.translate(s1.x, s1.y)
          
          if (ASSETS.body.complete) {
            ctx.beginPath()
            ctx.arc(0, 0, w, 0, Math.PI * 2)
            ctx.clip()
            
            // To allow color tinting, we can use globalCompositeOperation, 
            // but just drawing the body sprite is fine for now
            ctx.drawImage(ASSETS.body, -w, -w, w * 2, w * 2)
          } else {
            ctx.beginPath()
            ctx.arc(0, 0, w, 0, Math.PI * 2)
            ctx.fillStyle = pColor.mid
            ctx.fill()
          }
          ctx.restore()
        }

        // Head
        const hs = toScreen(snake[0].x, snake[0].y)
        if (isVisible(hs.x, hs.y)) {
          ctx.save()
          ctx.translate(hs.x, hs.y)
          
          // Calculate angle for rotation based on the first two segments
          const dx = snake[0].x - snake[1].x
          const dy = snake[0].y - snake[1].y
          const angle = Math.atan2(dy, dx)
          ctx.rotate(angle)

          const headRad = 18

          if (ASSETS.head.complete) {
            ctx.beginPath()
            ctx.arc(0, 0, headRad, 0, Math.PI * 2)
            ctx.clip()
            // Assume sprite is facing right (0 radians)
            ctx.drawImage(ASSETS.head, -headRad, -headRad, headRad * 2, headRad * 2)
          } else {
            ctx.shadowColor = pColor.head
            ctx.shadowBlur  = 28
            ctx.fillStyle   = pColor.head
            ctx.beginPath(); ctx.arc(0, 0, 14, 0, Math.PI * 2); ctx.fill()
            ctx.shadowBlur = 0

            // Draw eyes facing right (since we rotated the canvas)
            ctx.fillStyle = '#fff'
            ctx.beginPath(); ctx.arc(6, -5, 3.5, 0, Math.PI * 2); ctx.fill()
            ctx.beginPath(); ctx.arc(6,  5, 3.5, 0, Math.PI * 2); ctx.fill()
            ctx.fillStyle = '#000'
            ctx.beginPath(); ctx.arc(7, -5, 1.5, 0, Math.PI * 2); ctx.fill()
            ctx.beginPath(); ctx.arc(7,  5, 1.5, 0, Math.PI * 2); ctx.fill()
          }
          ctx.restore()
        }
      }

      // ── Minimap ───────────────────────────────────────────────────────────
      const MS    = 90
      const MX    = W - MS - 12
      const MY    = H - MS - 12
      const MSCALE = MS / 5000

      ctx.save()
      ctx.globalAlpha = 0.75
      ctx.fillStyle   = '#0a0e2a'
      ctx.strokeStyle = '#eab308'
      ctx.lineWidth   = 1
      ctx.beginPath(); ctx.roundRect(MX, MY, MS, MS, 5); ctx.fill(); ctx.stroke()

      // Obstacles
      ctx.fillStyle = '#ef4444'
      for (const obs of obstaclesRef.current) {
        ctx.fillRect(MX + obs.x * MSCALE - 1.5, MY + obs.y * MSCALE - 1.5, 3, 3)
      }

      // Enemies
      for (const enemy of enemiesRef.current) {
        ctx.fillStyle = enemy.palette.head
        ctx.beginPath()
        ctx.arc(MX + enemy.x * MSCALE, MY + enemy.y * MSCALE, 2.5, 0, Math.PI * 2)
        ctx.fill()
      }

      // Player
      if (snake.length > 0) {
        ctx.shadowColor = '#eab308'
        ctx.shadowBlur  = 6
        ctx.fillStyle   = '#eab308'
        ctx.beginPath()
        ctx.arc(MX + snake[0].x * MSCALE, MY + snake[0].y * MSCALE, 3.5, 0, Math.PI * 2)
        ctx.fill()
        ctx.shadowBlur = 0
      }
      ctx.restore()
    }

    // Render loop — runs continuously via rAF (not just when running,
    // so the game-over overlay still shows the frozen final frame)
    const loop = () => {
      draw()
      animRef.current = requestAnimationFrame(loop)
    }
    loop()

    return () => { if (animRef.current) cancelAnimationFrame(animRef.current) }
  }, [canvasSize, cameraRef, snakeRef, foodRef, obstaclesRef, enemiesRef])

  const handleMute = () => {
    toggleMute()
    setIsMuted(m => !m)
  }

  const handleRestart = () => {
    playBGMusic()
    initGame()
  }

  return (
    <div id="game-canvas-wrapper" style={styles.container}>
      <canvas
        ref={canvasRef}
        width={canvasSize.width}
        height={canvasSize.height}
        style={styles.canvas}
      />

      {/* Mute and Pause buttons — top right corner */}
      <div style={styles.topControls}>
        <button
          id="pause-btn"
          style={styles.controlBtn}
          onClick={() => {
            if (!isGameOver) togglePause()
          }}
          title={isPaused ? 'Reanudar' : 'Pausar'}
        >
          {isPaused ? '▶️' : '⏸️'}
        </button>
        <button
          id="mute-btn"
          style={styles.controlBtn}
          onClick={handleMute}
          title={isMuted ? 'Activar sonido' : 'Silenciar'}
        >
          {isMuted ? '🔇' : '🔊'}
        </button>
      </div>

      {isPaused && !isGameOver && (
        <div style={styles.overlay}>
          <h2 style={styles.title}>PAUSA</h2>
          <button style={styles.btn} onClick={togglePause}>REANUDAR (P)</button>
        </div>
      )}

      {isGameOver && (
        <div style={styles.overlay}>
          <h2 style={styles.title}>¡GAME OVER!</h2>
          <p style={styles.scoreLine}>Puntaje final: <span style={styles.scoreNum}>{scoreRef.current}</span></p>
          <button style={styles.btn} onClick={handleRestart}>JUGAR DE NUEVO</button>
        </div>
      )}
    </div>
  )
}

const styles = {
  container: {
    position: 'relative',
    display:  'inline-block',
    margin:   '0 auto',
  },
  topControls: {
    position: 'absolute',
    top: '10px',
    right: '10px',
    display: 'flex',
    gap: '8px',
    zIndex: 30,
  },
  controlBtn: {
    background:   'rgba(10,14,26,0.75)',
    border:       '1px solid #eab30860',
    borderRadius: '8px',
    color:        '#eab308',
    fontSize:     '1.3rem',
    padding:      '4px 8px',
    cursor:       'pointer',
    lineHeight:   1,
    backdropFilter: 'blur(4px)',
  },
  canvas: {
    display:      'block',
    background:   '#05061a',
    borderRadius: '14px',
    border:       '3px solid #eab308',
    boxShadow:    '0 0 40px rgba(234,179,8,0.3)',
  },
  overlay: {
    position:       'absolute',
    inset:          0,
    display:        'flex',
    flexDirection:  'column',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            '1rem',
    background:     'rgba(5,6,26,0.88)',
    borderRadius:   '14px',
    zIndex:         20,
  },
  title: {
    fontFamily:  'var(--font-title)',
    fontSize:    '2.6rem',
    color:       '#eab308',
    textShadow:  '0 0 30px rgba(234,179,8,0.6)',
    margin:      0,
  },
  scoreLine: {
    fontSize:   '1.5rem',
    color:      '#f9fafb',
    margin:     0,
  },
  scoreNum: {
    color:       '#eab308',
    fontFamily:  'var(--font-title)',
    fontWeight:  700,
  },
  btn: {
    marginTop:   '0.5rem',
    padding:     '0.75rem 2.2rem',
    background:  'linear-gradient(135deg,#eab308,#f59e0b)',
    border:      'none',
    borderRadius:'10px',
    color:       '#0a0e1a',
    fontFamily:  'var(--font-title)',
    fontWeight:  700,
    fontSize:    '1.1rem',
    cursor:      'pointer',
  },
}

export default GameCanvas