import { Link } from 'react-router-dom'
import './Footer.css'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__grid">
          <div className="footer__brand">
            <div className="footer__logo">
              <span className="footer__logo-icon">⚖</span>
              <span className="footer__logo-text">Case<span className="footer__logo-accent">Flow</span></span>
            </div>
            <p className="footer__tagline">Modernizing legal case management with intelligent workflow automation.</p>
          </div>

          <div className="footer__col">
            <h4 className="footer__heading">Product</h4>
            <Link to="/how-it-works" className="footer__link">How It Works</Link>
            <Link to="/about" className="footer__link">About</Link>
            <Link to="/contact" className="footer__link">Contact</Link>
          </div>

          <div className="footer__col">
            <h4 className="footer__heading">Modules</h4>
            <Link to="/cases" className="footer__link">Case Filing</Link>
            <Link to="/hearings" className="footer__link">Hearings</Link>
            <Link to="/workflow" className="footer__link">Workflow</Link>
            <Link to="/appeals" className="footer__link">Appeals</Link>
          </div>

          <div className="footer__col">
            <h4 className="footer__heading">Tech Stack</h4>
            <span className="footer__link">Spring Boot 3</span>
            <span className="footer__link">React 18</span>
            <span className="footer__link">Spring Cloud</span>
            <span className="footer__link">MySQL</span>
          </div>
        </div>

        <div className="footer__bottom">
          <p>&copy; 2026 CaseFlow &mdash; Cognizant Internship Project</p>
          <p className="footer__built">Built with Spring Boot &middot; React &middot; Microservices</p>
        </div>
      </div>
    </footer>
  )
}
