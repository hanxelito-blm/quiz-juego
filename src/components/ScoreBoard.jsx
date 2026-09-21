import { useState } from 'react'

const ScoreBoard = ({ scores }) => {
  if (!scores || scores.length === 0) {
    return <p style={styles.empty}>No hay puntajes registrados aún.</p>
  }

  return (
    <div style={styles.tableContainer}>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>#</th>
            <th style={styles.th}>Jugador</th>
            <th style={styles.th}>Puntaje</th>
            <th style={styles.th}>Nivel</th>
            <th style={styles.th}>Fecha</th>
          </tr>
        </thead>
        <tbody>
          {scores.map((score, index) => (
            <tr key={score.id} style={index % 2 === 0 ? styles.rowEven : styles.rowOdd}>
              <td style={styles.td}>
                {index < 3 ? (
                  <span style={index === 0 ? styles.medalGold : index === 1 ? styles.medalSilver : styles.medalBronze}>
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                  </span>
                ) : (
                  index + 1
                )}
              </td>
              <td style={{ ...styles.td, fontWeight: 700 }}>{score.playerName}</td>
              <td style={{ ...styles.td, color: '#22c55e', fontWeight: 700 }}>{score.score}</td>
              <td style={styles.td}>{score.level}</td>
              <td style={{ ...styles.td, color: '#9ca3af', fontSize: '0.9rem' }}>{score.date}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const styles = {
  tableContainer: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    padding: '0.75rem 1rem',
    textAlign: 'left',
    borderBottom: '2px solid #06b6d4',
    color: '#06b6d4',
    fontFamily: 'var(--font-title)',
    fontSize: '0.85rem',
    textTransform: 'uppercase',
  },
  td: {
    padding: '0.75rem 1rem',
    borderBottom: '1px solid #1f2937',
  },
  rowEven: {
    background: 'rgba(31, 41, 55, 0.5)',
  },
  rowOdd: {
    background: 'transparent',
  },
  medalGold: { fontSize: '1.25rem' },
  medalSilver: { fontSize: '1.25rem' },
  medalBronze: { fontSize: '1.25rem' },
  empty: {
    textAlign: 'center',
    color: '#9ca3af',
    padding: '2rem',
    fontSize: '1.1rem',
  },
}

export default ScoreBoard
