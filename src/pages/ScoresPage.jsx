import { useEffect, useState } from 'react'
import Loader from '../components/Loader.jsx'
import ScoreBoard from '../components/ScoreBoard.jsx'
import { fetchScores } from '../api/api.js'

const ScoresPage = () => {
  const [scores, setScores] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const loadScores = async () => {
      try {
        setLoading(true)
        const data = await fetchScores()
        setScores(data)
        setError(null)
      } catch (err) {
        setError('No se pudieron cargar los puntajes. Verifica tu conexión.')
        console.error('Error loading scores:', err)
      } finally {
        setLoading(false)
      }
    }

    loadScores()
  }, [])

  if (loading) {
    return (
      <div className="page-container" style={{ textAlign: 'center', paddingTop: '4rem' }}>
        <Loader message="Cargando tabla de líderes..." />
      </div>
    )
  }

  return (
    <div className="page-container" style={{ paddingTop: '2rem' }}>
      <div style={styles.header}>
        <h2 style={styles.title}>🏆 Tabla de Líderes</h2>
        <p style={styles.subtitle}>Los mejores jugadores de Snake Game</p>
      </div>

      {error && (
        <div style={styles.errorBox}>{error}</div>
      )}

      <div className="card" style={styles.tableCard}>
        {scores && scores.length > 0 ? (
          <>
            <ScoreBoard scores={scores} />
            <div style={styles.footer}>
              <span style={styles.count}>Total: {scores.length} registros</span>
            </div>
          </>
        ) : (
          <div style={styles.emptyState}>
            <span style={styles.emptyIcon}>🎮</span>
            <p style={styles.emptyText}>Aún no hay puntajes registrados.</p>
            <p style={styles.emptyHint}>¡Juega y sé el primero en la tabla!</p>
          </div>
        )}
      </div>
    </div>
  )
}

const styles = {
  header: {
    textAlign: 'center',
    marginBottom: '2rem',
  },
  title: {
    fontFamily: 'var(--font-title)',
    fontSize: 'clamp(1.5rem, 4vw, 2.2rem)',
    color: '#eab308',
    textShadow: '0 0 20px rgba(234, 179, 8, 0.3)',
  },
  subtitle: {
    color: '#9ca3af',
    marginTop: '0.5rem',
  },
  tableCard: {
    padding: '1.5rem',
  },
  errorBox: {
    background: 'rgba(239, 68, 68, 0.15)',
    border: '1px solid #ef4444',
    color: '#ef4444',
    padding: '1rem',
    borderRadius: '8px',
    marginBottom: '1.5rem',
    textAlign: 'center',
  },
  footer: {
    marginTop: '1rem',
    textAlign: 'right',
    borderTop: '1px solid #374151',
    paddingTop: '0.75rem',
  },
  count: {
    color: '#6b7280',
    fontSize: '0.9rem',
  },
  emptyState: {
    textAlign: 'center',
    padding: '3rem 1rem',
  },
  emptyIcon: {
    fontSize: '3rem',
    display: 'block',
    marginBottom: '1rem',
  },
  emptyText: {
    color: '#9ca3af',
    fontSize: '1.2rem',
    marginBottom: '0.5rem',
  },
  emptyHint: {
    color: '#6b7280',
    fontSize: '1rem',
  },
}

export default ScoresPage