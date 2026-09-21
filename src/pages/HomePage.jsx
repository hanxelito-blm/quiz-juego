import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

const HomePage = () => {
  const [name, setName] = useState('')
  const [color, setColor] = useState('yellow')
  const [showSaved, setShowSaved] = useState(false)
  const [canvasDim, setCanvasDim] = useState({ width: 900, height: 600 })
  const navigate = useNavigate()
  const canvasRef = useRef(null)
  const animationRef = useRef(null)

  const COLORS = [
    { id: 'yellow', hex: '#eab308' },
    { id: 'red',    hex: '#ef4444' },
    { id: 'green',  hex: '#22c55e' },
    { id: 'blue',   hex: '#3b82f6' },
    { id: 'purple', hex: '#a855f7' }
  ]

  useEffect(() => {
    const savedName = localStorage.getItem('playerName') || ''
    if (savedName) setName(savedName)
    const savedColor = localStorage.getItem('snakeColor') || 'yellow'
    setColor(savedColor)

    const handleResize = () => {
      setCanvasDim({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const W = canvas.width
    const H = canvas.height
    const particles = []
    for (let i = 0; i < 40; i++) {
      particles.push({
        x: Math.random() * W,
        y: Math.random() * H,
        r: 1 + Math.random() * 3,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        a: Math.random() * Math.PI * 2,
      })
    }

    const lines = []
    for (let i = 0; i < 5; i++) {
      lines.push({
        startY: Math.random() * H,
        speed: 0.1 + Math.random() * 0.2,
      })
    }

    const animate = () => {
      ctx.clearRect(0, 0, W, H)

      const time = Date.now() * 0.001

      const bgGrad = ctx.createLinearGradient(0, 0, W, H)
      bgGrad.addColorStop(0, '#0a0e1a')
      bgGrad.addColorStop(0.5, '#0f142a')
      bgGrad.addColorStop(1, '#1a0a2e')
      ctx.fillStyle = bgGrad
      ctx.fillRect(0, 0, W, H)

      lines.forEach((line, i) => {
        line.startY += line.speed
        if (line.startY > H) line.startY = 0
        ctx.strokeStyle = `rgba(234, 179, 8, ${0.03 + i * 0.02})`
        ctx.lineWidth = 1 + i * 0.5
        ctx.setLineDash([20, 30])
        ctx.beginPath()
        const wave = Math.sin(time * 0.5 + i) * 30
        const x = wave + W * 0.2 * (i + 1)
        ctx.moveTo(x % W, line.startY)
        ctx.lineTo((x + H) % W, H)
        ctx.stroke()
        ctx.setLineDash([])
      })

      for (const p of particles) {
        p.x += p.vx
        p.y += p.vy
        if (p.x < 0) p.x = W
        if (p.x > W) p.x = 0
        if (p.y < 0) p.y = H
        if (p.y > H) p.y = 0
        const pulse = Math.sin(time * 2 + p.a) * 0.5 + 0.5

        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.globalAlpha = 0.35 + pulse * 0.25
        ctx.fillStyle = '#eab308'
        ctx.beginPath()
        ctx.arc(0, 0, p.r + pulse * 1, 0, Math.PI * 2)
        ctx.fill()
        ctx.globalAlpha = 0.15
        ctx.shadowColor = '#eab308'
        ctx.shadowBlur = 12
        ctx.beginPath()
        ctx.arc(0, 0, p.r + pulse * 1.5, 0, Math.PI * 2)
        ctx.fill()
        ctx.shadowBlur = 0
        ctx.restore()
      }

      animationRef.current = requestAnimationFrame(animate)
    }
    animationRef.current = requestAnimationFrame(animate)
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
    }
  }, [canvasDim])

  const handleNameSubmit = () => {
    const trimmed = name.trim() || 'Anónimo'
    localStorage.setItem('playerName', trimmed)
    localStorage.setItem('snakeColor', color)
    setShowSaved(true)
    setTimeout(() => setShowSaved(false), 1500)
    navigate('/juego/1')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleNameSubmit()
  }

  return (
    <div style={styles.container}>
      <canvas
        ref={canvasRef}
        width={canvasDim.width}
        height={canvasDim.height}
        style={styles.bgCanvas}
      />

      <div style={styles.content}>
        <div style={styles.hero}>
          <div style={styles.iconSection}>
            <span style={styles.icon}>🐍</span>
          </div>
          <h1 style={styles.title}>
            SNAKE <span style={styles.titleAccent}>GAME</span>
          </h1>
          <p style={styles.subtitle}>
            El clásico juego del gusano, ahora con movimiento libre y estilo
            Slither.io - Come orbes amarillos y crece sin chocar contigo
          </p>
        </div>

        <div style={styles.gameCard}>
          <h3 style={styles.formTitle}>Ingresa tu nombre para comenzar</h3>
          <div style={styles.inputRow}>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Tu nombre..."
              style={styles.nameInput}
              maxLength={20}
              autoFocus
            />
          </div>
          
          <h3 style={styles.formTitle}>Elige tu color</h3>
          <div style={styles.colorRow}>
            {COLORS.map(c => (
              <div 
                key={c.id}
                onClick={() => setColor(c.id)}
                style={{
                  ...styles.colorCircle,
                  backgroundColor: c.hex,
                  border: color === c.id ? '3px solid #fff' : '2px solid transparent',
                  transform: color === c.id ? 'scale(1.2)' : 'scale(1)'
                }}
              />
            ))}
          </div>

          <button
            style={styles.playBtn}
            onClick={handleNameSubmit}
            disabled={!name.trim()}
          >
            ▶ JUGAR NIVEL 1
          </button>
          {showSaved && <span style={styles.savedMsg}>Nombre guardado correctamente</span>}
        </div>

        <div style={styles.infoGrid}>
          <div style={styles.infoCard}>
            <span style={styles.cardIcon}>⌨️</span>
            <h3 style={styles.cardTitle}>Controles</h3>
            <p style={styles.cardText}>Flechas o W/A/S/D para girar el gusano</p>
          </div>
          <div style={styles.infoCard}>
            <span style={styles.cardIcon}>🟡</span>
            <h3 style={styles.cardTitle}>Objetivo</h3>
            <p style={styles.cardText}>Come orbes amarillos para crecer y sumar puntos</p>
          </div>
          <div style={styles.infoCard}>
            <span style={styles.cardIcon}>⚠️</span>
            <h3 style={styles.cardTitle}>Peligro</h3>
            <p style={styles.cardText}>No choques contra tu propio cuerpo. Cada nivel es más veloz</p>
          </div>
        </div>
      </div>
    </div>
  )
}

const styles = {
  container: {
    position: 'relative',
    minHeight: '100vh',
    overflow: 'hidden',
  },
  bgCanvas: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    zIndex: 0,
  },
  content: {
    position: 'relative',
    zIndex: 10,
    maxWidth: '1200px',
    margin: '0 auto',
    textAlign: 'center',
    paddingTop: '3rem',
    paddingBottom: '2rem',
  },
  hero: {
    marginBottom: '2.5rem',
  },
  iconSection: {
    marginBottom: '1rem',
  },
  icon: {
    fontSize: '5rem',
    animation: 'float 4s infinite ease-in-out',
  },
  title: {
    fontFamily: 'var(--font-title)',
    fontSize: 'clamp(2.5rem, 8vw, 4.5rem)',
    fontWeight: 900,
    marginBottom: '0.5rem',
    letterSpacing: '3px',
  },
  titleAccent: {
    background: 'linear-gradient(135deg, #eab308, #f59e0b)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  subtitle: {
    color: '#9ca3af',
    fontSize: '1.15rem',
    maxWidth: '650px',
    margin: '0 auto',
    lineHeight: 1.6,
  },
  gameCard: {
    background: 'rgba(15, 20, 42, 0.7)',
    border: '2px solid #eab308',
    borderRadius: '16px',
    padding: '2rem',
    maxWidth: '450px',
    margin: '0 auto 2.5rem',
    boxShadow: '0 0 30px rgba(234, 179, 8, 0.2)',
    backdropFilter: 'blur(10px)',
  },
  formTitle: {
    fontFamily: 'var(--font-title)',
    fontSize: '1.1rem',
    color: '#eab308',
    marginBottom: '1rem',
  },
  inputRow: {
    marginBottom: '1.25rem',
  },
  nameInput: {
    width: '100%',
    padding: '0.75rem 1rem',
    background: '#111827',
    border: '1px solid #eab308',
    borderRadius: '8px',
    color: '#f9fafb',
    fontSize: '1.1rem',
    fontFamily: 'var(--font-body)',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  playBtn: {
    width: '100%',
    padding: '0.85rem',
    background: 'linear-gradient(135deg, #eab308, #f59e0b)',
    border: 'none',
    borderRadius: '10px',
    color: '#0a0e1a',
    fontFamily: 'var(--font-title)',
    fontWeight: 700,
    fontSize: '1.2rem',
    cursor: 'pointer',
  },
  savedMsg: {
    display: 'block',
    color: '#22c55e',
    marginTop: '0.6rem',
    fontSize: '0.9rem',
    fontWeight: 600,
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '1.5rem',
  },
  infoCard: {
    background: 'rgba(31, 41, 55, 0.5)',
    border: '1px solid #374151',
    borderRadius: '12px',
    padding: '1.25rem',
  },
  cardIcon: {
    fontSize: '2rem',
    display: 'block',
    marginBottom: '0.75rem',
  },
  cardTitle: {
    fontFamily: 'var(--font-title)',
    fontSize: '0.95rem',
    color: '#eab308',
    marginBottom: '0.5rem',
  },
  cardText: {
    color: '#9ca3af',
    fontSize: '0.9rem',
    lineHeight: 1.5,
  },
  colorRow: {
    display: 'flex',
    justifyContent: 'center',
    gap: '1rem',
    marginBottom: '1.5rem',
  },
  colorCircle: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    cursor: 'pointer',
    transition: 'transform 0.2s, border 0.2s',
  },
}

export default HomePage