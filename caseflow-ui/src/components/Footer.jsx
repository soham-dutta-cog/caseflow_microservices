import { Link } from 'react-router-dom'
import './Footer.css'

export default function Footer() {
  return (
    <footer className="cf-footer pt-5 pb-4 small">
      <div className="container">
        <div className="row g-4 mb-5">
          <div className="col-12 col-md-6 col-lg-5">
            <div className="d-flex align-items-center mb-3">
              <span className="cf-footer__logo-icon fs-4">⚖</span>
              <span className="cf-footer__logo-text ms-2 fs-5 fw-semibold">Case<span className="cf-footer__logo-accent">Flow</span></span>
            </div>
            <p className="cf-footer__tagline mb-0" style={{ maxWidth: 280 }}>Modernizing legal case management with intelligent workflow automation.</p>
          </div>

          <div className="col-6 col-md-2 col-lg-2 d-flex flex-column">
            <h4 className="cf-footer__heading text-white text-uppercase fw-semibold mb-3" style={{ fontSize: 13, letterSpacing: '0.08em' }}>Product</h4>
            <Link to="/how-it-works" className="cf-footer__link mb-2">How It Works</Link>
            <Link to="/about" className="cf-footer__link mb-2">About</Link>
            <Link to="/contact" className="cf-footer__link mb-2">Contact</Link>
          </div>

          <div className="col-6 col-md-2 col-lg-2 d-flex flex-column">
            <h4 className="cf-footer__heading text-white text-uppercase fw-semibold mb-3" style={{ fontSize: 13, letterSpacing: '0.08em' }}>Modules</h4>
            <Link to="/cases" className="cf-footer__link mb-2">Case Filing</Link>
            <Link to="/hearings" className="cf-footer__link mb-2">Hearings</Link>
            <Link to="/workflow" className="cf-footer__link mb-2">Workflow</Link>
            <Link to="/appeals" className="cf-footer__link mb-2">Appeals</Link>
          </div>

          <div className="col-12 col-md-2 col-lg-3 d-flex flex-column">
            <h4 className="cf-footer__heading text-white text-uppercase fw-semibold mb-3" style={{ fontSize: 13, letterSpacing: '0.08em' }}>Tech Stack</h4>
            <span className="cf-footer__link mb-2">Spring Boot 3</span>
            <span className="cf-footer__link mb-2">React 18</span>
            <span className="cf-footer__link mb-2">Spring Cloud</span>
            <span className="cf-footer__link mb-2">MySQL</span>
          </div>
        </div>

        <div className="cf-footer__bottom pt-4 d-flex flex-column flex-md-row justify-content-between gap-2">
          <p className="mb-0">&copy; 2026 CaseFlow &mdash; Cognizant Internship Project</p>
          <p className="cf-footer__built mb-0">Built with Spring Boot &middot; React &middot; Microservices</p>
        </div>
      </div>
    </footer>
  )
}
