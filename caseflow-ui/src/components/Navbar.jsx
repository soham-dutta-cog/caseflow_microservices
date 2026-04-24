import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Navbar.css'

export default function Navbar() {
  const { user } = useAuth()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => setMenuOpen(false), [location])

  return (
    <nav className={`cf-navbar ${scrolled ? 'cf-navbar--scrolled' : ''}`}>
      <div className="container d-flex align-items-center justify-content-between">
        <Link to="/" className="d-flex align-items-center gap-2" style={{ zIndex: 10 }}>
          <span className="cf-navbar__logo-icon fs-4">⚖</span>
          <span className="cf-navbar__logo-text fs-5 fw-semibold">
            Case<span className="cf-navbar__logo-accent">Flow</span>
          </span>
        </Link>

        <div className={`cf-navbar__links ${menuOpen ? 'cf-navbar__links--open' : ''}`}>
          <Link to="/" className={`cf-navbar__link small fw-medium ${location.pathname === '/' ? 'active' : ''}`}>Home</Link>
          <Link to="/about" className={`cf-navbar__link small fw-medium ${location.pathname === '/about' ? 'active' : ''}`}>About</Link>
          <Link to="/how-it-works" className={`cf-navbar__link small fw-medium ${location.pathname === '/how-it-works' ? 'active' : ''}`}>How It Works</Link>
          <Link to="/contact" className={`cf-navbar__link small fw-medium ${location.pathname === '/contact' ? 'active' : ''}`}>Contact</Link>
          {user ? (
            <Link to="/dashboard" className="btn btn-gold px-4 py-2" style={{ fontSize: 13 }}>Dashboard</Link>
          ) : (
            <Link to="/login" className="btn btn-gold px-4 py-2" style={{ fontSize: 13 }}>Sign In</Link>
          )}
        </div>

        <button className="cf-navbar__hamburger" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
          <span className={`cf-navbar__hamburger-line ${menuOpen ? 'open' : ''}`} />
          <span className={`cf-navbar__hamburger-line ${menuOpen ? 'open' : ''}`} />
          <span className={`cf-navbar__hamburger-line ${menuOpen ? 'open' : ''}`} />
        </button>
      </div>
    </nav>
  )
}
