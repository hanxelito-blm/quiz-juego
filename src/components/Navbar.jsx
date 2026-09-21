import { Link } from 'react-router-dom'

const Navbar = () => {
  return (
    <nav style={styles.navbar}>
      <div style={styles.container}>
        <Link to="/" style={styles.logo}>
          <span style={styles.logoIcon}>🐍</span>
          <span style={styles.logoText}>SNAKE</span>
        </Link>
        <div style={styles.links}>
          <Link to="/" style={styles.link}>Inicio</Link>
          <Link to="/juego/1" style={styles.link}>Jugar</Link>
          <Link to="/puntajes" style={styles.link}>Puntajes</Link>
        </div>
      </div>
    </nav>
  )
}

const styles = {
  navbar: {
    position: 'sticky',
    top: 0,
    zIndex: 1000,
    background: 'rgba(10, 14, 26, 0.95)',
    backdropFilter: 'blur(10px)',
    borderBottom: '1px solid #374151',
    padding: '0.75rem 0',
  },
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 1rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    textDecoration: 'none',
  },
  logoIcon: {
    fontSize: '1.5rem',
  },
  logoText: {
    fontFamily: 'var(--font-title)',
    fontSize: '1.25rem',
    fontWeight: 900,
    background: 'linear-gradient(135deg, #06b6d4, #22c55e)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  links: {
    display: 'flex',
    gap: '1.5rem',
  },
  link: {
    color: '#9ca3af',
    textDecoration: 'none',
    fontWeight: 600,
    fontSize: '1rem',
    transition: 'color 0.2s',
  },
}

export default Navbar