import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams } from 'react-router-dom'
import GameCanvas from '../components/GameCanvas.jsx'
import GameModal from '../components/GameModal.jsx'
import Loader from '../components/Loader.jsx'
import { submitScore } from '../api/api.js'

const GamePage = () => {
  const { nivel } = useParams()
  const level = parseInt(nivel, 10) || 1

  const [score, setScore] = useState(0)
  const [showModal, setShowModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [finalScore, setFinalScore] = useState(0)
  const [savedLocally, setSavedLocally] = useState(false)

  const playerNameRef = useRef('Anónimo')

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 600)
    return () => clearTimeout(timer)
  }, [level])

  useEffect(() => {
    setScore(0)
    setShowModal(false)
    setSubmitError(null)
    setFinalScore(0)
    setSavedLocally(false)
  }, [level])

  useEffect(() => {
    const name = localStorage.getItem('playerName') || 'Anónimo'
    playerNameRef.current = name
  }, [])

  const handleGameOver = useCallback((finalScoreValue) => {
    setFinalScore(finalScoreValue)
    setTimeout(() => setShowModal(true), 300)
  }, [])

  const handleSubmitScore = useCallback(async (name, scoreValue) => {
    if (!name || !name.trim()) {
      setSubmitError('Por favor ingresa tu nombre en la pantalla de inicio')
      return
    }

    setIsSubmitting(true)
    setSubmitError(null)
    setSavedLocally(false)

    try {
      const result = await submitScore({
        playerName: name,
        score: scoreValue,
        level: level,
      })

      if (result) {
        if (result.savedLocally) {
          setSavedLocally(true)
        }
        setShowModal(false)
        setTimeout(() => {
          window.location.href = '/puntajes'
        }, 500)
      }
    } catch (err) {
      setSavedLocally(true)
      setShowModal(false)
      setTimeout(() => {
        window.location.href = '/puntajes'
      }, 500)
    } finally {
      setIsSubmitting(false)
    }
  }, [level])

  if (isLoading) {
    return (
      <div className="page-container" style={{ textAlign: 'center', paddingTop: '4rem' }}>
        <Loader message={`Cargando nivel ${level}...`} />
      </div>
    )
  }

  return (
    <div className="page-container" style={{ paddingTop: '1.5rem' }}>
      <div style={styles.header}>
        <h2 style={styles.levelTitle}>NIVEL {level}</h2>
        <div style={styles.scoreBadge}>
          Puntaje: <span style={styles.scoreValue}>{score}</span>
        </div>
      </div>

      <div style={styles.gameArea}>
        <GameCanvas
          level={level}
          onGameOver={handleGameOver}
          onScoreChange={setScore}
        />
      </div>

      <GameModal
        isOpen={showModal}
        score={finalScore}
        isSubmitting={isSubmitting}
        error={submitError}
        onSubmit={handleSubmitScore}
      />

      <p style={styles.controlText}>Flechas o W/A/S/D para girar - Come orbes amarillos para crecer</p>
    </div>
  )
}

const styles = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem',
    flexWrap: 'wrap',
    gap: '1rem',
  },
  levelTitle: {
    fontFamily: 'var(--font-title)',
    fontSize: 'clamp(1.2rem, 4vw, 2rem)',
    background: 'linear-gradient(135deg, #eab308, #f59e0b)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  scoreBadge: {
    background: '#1f2937',
    padding: '0.5rem 1rem',
    borderRadius: '8px',
    fontSize: '1.1rem',
    fontWeight: 700,
    border: '1px solid #eab308',
  },
  scoreValue: {
    color: '#eab308',
    fontFamily: 'var(--font-title)',
  },
  gameArea: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '1rem',
  },
  controlText: {
    color: '#9ca3af',
    fontSize: '0.9rem',
    marginTop: '0.75rem',
  },
}

export default GamePage