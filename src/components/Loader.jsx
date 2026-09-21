import { useEffect, useState } from 'react'

const Loader = ({ message = 'Cargando...' }) => {
  return (
    <div style={styles.container}>
      <div style={styles.spinner}>
        <div style={styles.dot} />
        <div style={{ ...styles.dot, animationDelay: '0.2s' }} />
        <div style={{ ...styles.dot, animationDelay: '0.4s' }} />
      </div>
      <p style={styles.text}>{message}</p>
    </div>
  )
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '3rem',
    gap: '1rem',
  },
  spinner: {
    display: 'flex',
    gap: '0.5rem',
  },
  dot: {
    width: '12px',
    height: '12px',
    background: '#06b6d4',
    borderRadius: '50%',
    animation: 'bounce 1.4s infinite ease-in-out both',
  },
  text: {
    color: '#9ca3af',
    fontSize: '1rem',
  },
}

export default Loader
