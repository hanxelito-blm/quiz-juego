import { useEffect, useState } from 'react'

const GameModal = ({ isOpen, score, isSubmitting, error, onSubmit }) => {
  const [playerName, setPlayerName] = useState('Anónimo')

  useEffect(() => {
    const saved = localStorage.getItem('playerName') || 'Anónimo'
    setPlayerName(saved)
  }, [])

  if (!isOpen) return null

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <h2 style={styles.title}>¡Partida Terminada!</h2>

        <div style={styles.scoreDisplay}>
          <span style={styles.scoreLabel}>Puntaje Final</span>
          <span style={styles.scoreValue}>{score}</span>
        </div>

        <div style={styles.nameDisplay}>
          <span style={styles.nameText}>Jugador: {playerName}</span>
        </div>

        {error && <div style={styles.errorBox}>{error}</div>}

        <div style={styles.buttonGroup}>
          <button
            style={{ ...styles.btn, ...styles.btnPrimary }}
            onClick={() => onSubmit(playerName, score)}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Guardando...' : 'Guardar Puntaje'}
          </button>
          <button
            style={{ ...styles.btn, ...styles.btnSecondary }}
            onClick={() => window.location.reload()}
            disabled={isSubmitting}
          >
            Jugar de Nuevo
          </button>
        </div>
      </div>
    </div>
  )
}

const styles = {
  overlay: {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0, 0, 0, 0.85)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  modal: {
    background: 'rgba(15, 20, 42, 0.9)',
    border: '2px solid #eab308',
    borderRadius: '16px',
    padding: '2.5rem',
    maxWidth: '420px',
    width: '90%',
    textAlign: 'center',
    boxShadow: '0 0 40px rgba(234, 179, 8, 0.3)',
    backdropFilter: 'blur(10px)',
  },
  title: {
    fontFamily: 'var(--font-title)',
    fontSize: '1.6rem',
    color: '#eab308',
    marginBottom: '1rem',
    textShadow: '0 0 15px rgba(234, 179, 8, 0.4)',
  },
  scoreDisplay: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    marginBottom: '1.5rem',
  },
  scoreLabel: {
    color: '#9ca3af',
    fontSize: '0.9rem',
  },
  scoreValue: {
    fontFamily: 'var(--font-title)',
    fontSize: '3rem',
    fontWeight: 900,
    color: '#eab308',
    textShadow: '0 0 20px rgba(234, 179, 8, 0.5)',
  },
  nameDisplay: {
    marginBottom: '1.5rem',
  },
  nameText: {
    color: '#06b6d4',
    fontSize: '1.05rem',
    fontWeight: 600,
  },
  errorBox: {
    background: 'rgba(239, 68, 68, 0.15)',
    border: '1px solid #ef4444',
    color: '#ef4444',
    padding: '0.6rem 1rem',
    borderRadius: '8px',
    marginBottom: '1rem',
    fontSize: '0.9rem',
  },
  buttonGroup: {
    display: 'flex',
    gap: '0.75rem',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  btn: {
    padding: '0.6rem 1.25rem',
    border: 'none',
    borderRadius: '8px',
    fontFamily: 'var(--font-body)',
    fontWeight: 700,
    fontSize: '0.95rem',
    cursor: 'pointer',
  },
  btnPrimary: {
    background: 'linear-gradient(135deg, #eab308, #f59e0b)',
    color: '#0a0e1a',
  },
  btnSecondary: {
    background: '#111827',
    color: '#f9fafb',
    border: '1px solid #374151',
  },
}

export default GameModal