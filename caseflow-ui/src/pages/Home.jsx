import { Link } from 'react-router-dom'
import './Home.css'

const modules = [
  { icon: '🔐', title: 'Identity & Access', desc: 'Secure login, role-based access, JWT authentication', path: '/login', color: 'var(--cf-violet)' },
  { icon: '📁', title: 'Case Filing', desc: 'File cases, upload & verify documents digitally', path: '/cases', color: 'var(--cf-blue)' },
  { icon: '⚙', title: 'Workflow Engine', desc: 'Automated case lifecycle stages with SLA tracking', path: '/workflow', color: 'var(--cf-teal)' },
  { icon: '⚖', title: 'Hearing Scheduler', desc: 'Schedule hearings, manage judge calendars', path: '/hearings', color: 'var(--cf-amber)' },
  { icon: '📋', title: 'Appeals', desc: 'File appeals, assign reviews, track decisions', path: '/appeals', color: 'var(--cf-coral)' },
  { icon: '✅', title: 'Compliance', desc: 'Automated compliance checks & audit trails', path: '/compliance', color: 'var(--cf-teal-dark)' },
  { icon: '🔔', title: 'Notifications', desc: 'Real-time alerts for case updates & deadlines', path: '/notifications', color: 'var(--cf-gold-500)' },
  { icon: '📊', title: 'Reports & Analytics', desc: 'Generate reports, track metrics, admin dashboards', path: '/reports', color: 'var(--cf-navy-500)' },
]

const techStack = [
  { category: 'Backend', items: ['Spring Boot 3.2', 'Spring Cloud Gateway', 'Spring Security + JWT', 'Spring Data JPA', 'OpenFeign Clients'] },
  { category: 'Infrastructure', items: ['Netflix Eureka', 'Config Server', 'Resilience4j Circuit Breaker', 'MySQL Databases', 'REST Microservices'] },
  { category: 'Frontend', items: ['React 18', 'React Router v6', 'Vite Build Tool', 'Responsive CSS', 'Lucide Icons'] },
]

const team = [
  { name: 'Team Member 1', role: 'IAM & Security Module', avatar: '👤' },
  { name: 'Team Member 2', role: 'Case Filing Module', avatar: '👤' },
  { name: 'Team Member 3', role: 'Hearing & Scheduling Module', avatar: '👤' },
  { name: 'Soham', role: 'Workflow & SLA Module', avatar: '👤' },
  { name: 'Team Member 5', role: 'Appeals Module', avatar: '👤' },
  { name: 'Team Member 6', role: 'Compliance & Audit Module', avatar: '👤' },
  { name: 'Team Member 7', role: 'Notifications Module', avatar: '👤' },
  { name: 'Team Member 8', role: 'Reporting & Analytics Module', avatar: '👤' },
]

export default function Home() {
  return (
    <main>
      {/* ===== HERO ===== */}
      <section className="hero">
        <div className="hero__bg">
          <div className="hero__gradient" />
          <div className="hero__grid-pattern" />
          <div className="hero__orb hero__orb--1" />
          <div className="hero__orb hero__orb--2" />
        </div>
        <div className="container hero__content">
          {/* <div className="hero__badge animate-in">
            <span className="hero__badge-dot" />
            Cognizant Internship Project — 2026
          </div> */}
          <h1 className="hero__title animate-in animate-in-delay-1">
            Legal case management,<br />
            <span className="text-gradient">reimagined.</span>
          </h1>
          <p className="hero__subtitle animate-in animate-in-delay-2">
            CaseFlow is a modern, microservices-based platform that streamlines every stage
            of legal case handling — from filing and scheduling to compliance and reporting.
          </p>
          <div className="hero__actions animate-in animate-in-delay-3">
            <Link to="/login" className="btn btn-primary">Get Started</Link>
            <Link to="/how-it-works" className="btn btn-secondary">How It Works</Link>
          </div>
          <div className="hero__stats animate-in animate-in-delay-4">
            <div className="hero__stat">
              <span className="hero__stat-number">8</span>
              <span className="hero__stat-label">Microservices</span>
            </div>
            <div className="hero__stat-divider" />
            <div className="hero__stat">
              <span className="hero__stat-number">11</span>
              <span className="hero__stat-label">Spring Cloud Services</span>
            </div>
            <div className="hero__stat-divider" />
            <div className="hero__stat">
              <span className="hero__stat-number">8</span>
              <span className="hero__stat-label">Team Members</span>
            </div>
          </div>
        </div>
      </section>

      {/* ===== MODULES ===== */}
      <section className="modules section" id="modules">
        <div className="container">
          <div className="section-header">
            <span className="section-label">Platform Modules</span>
            <h2 className="section-title">Everything a legal team needs, <br />in one unified platform.</h2>
            <p className="section-subtitle">Each module is an independent microservice — built, deployed, and scaled separately.</p>
          </div>
          <div className="modules__grid">
            {modules.map((mod, i) => (
              <Link to={mod.path} key={i} className="module-card" style={{ '--accent': mod.color }}>
                <div className="module-card__icon">{mod.icon}</div>
                <h3 className="module-card__title">{mod.title}</h3>
                <p className="module-card__desc">{mod.desc}</p>
                <span className="module-card__arrow">→</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ===== ARCHITECTURE HIGHLIGHT ===== */}
      <section className="arch section">
        <div className="container">
          <div className="arch__inner">
            <div className="arch__text">
              <span className="section-label">Architecture</span>
              <h2 className="section-title" style={{ color: 'var(--cf-white)' }}>Built on microservices.<br />Designed for resilience.</h2>
              <p className="arch__desc">Every request flows through the API Gateway, authenticated via JWT, routed by Eureka service discovery, and protected by Resilience4j circuit breakers. If one service goes down, the rest keep running.</p>
              <div className="arch__features">
                <div className="arch__feature"><span className="arch__feature-icon">🛡</span> API Gateway routing</div>
                <div className="arch__feature"><span className="arch__feature-icon">🔍</span> Eureka service discovery</div>
                <div className="arch__feature"><span className="arch__feature-icon">⚡</span> Circuit breaker fallbacks</div>
                <div className="arch__feature"><span className="arch__feature-icon">🗄</span> Database per service</div>
                <div className="arch__feature"><span className="arch__feature-icon">⚙</span> Centralized config server</div>
                <div className="arch__feature"><span className="arch__feature-icon">🔐</span> JWT authentication</div>
              </div>
            </div>
            <div className="arch__visual">
              <div className="arch__node arch__node--gateway">API Gateway<span>:8085</span></div>
              <div className="arch__connector" />
              <div className="arch__services">
                {['IAM', 'Cases', 'Workflow', 'Hearing'].map((s, i) => (
                  <div key={i} className="arch__node arch__node--service">{s}<span>:808{i + 1}</span></div>
                ))}
              </div>
              <div className="arch__services">
                {['Appeals', 'Compliance', 'Notifications', 'Reports'].map((s, i) => (
                  <div key={i} className="arch__node arch__node--service">{s}<span>:808{i + 6}</span></div>
                ))}
              </div>
              <div className="arch__infra">
                <div className="arch__node arch__node--infra">Eureka<span>:8761</span></div>
                <div className="arch__node arch__node--infra">Config<span>:8888</span></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== TECH STACK ===== */}
      <section className="tech section" id="tech">
        <div className="container">
          <div className="section-header">
            <span className="section-label">Tech Stack</span>
            <h2 className="section-title">Powered by modern Java <br /> and cloud-native tools.</h2>
          </div>
          <div className="tech__grid">
            {techStack.map((group, i) => (
              <div key={i} className="tech__card">
                <h3 className="tech__card-title">{group.category}</h3>
                <ul className="tech__list">
                  {group.items.map((item, j) => (
                    <li key={j} className="tech__item">
                      <span className="tech__item-dot" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== TEAM ===== */}
      <section className="team section" id="team">
        <div className="container">
          <div className="section-header">
            <span className="section-label">Our Team</span>
            <h2 className="section-title">8 interns. 8 modules. <br />One integrated platform.</h2>
            <p className="section-subtitle">Each team member owns an independent microservice end-to-end — from database to API to frontend.</p>
          </div>
          <div className="team__grid">
            {team.map((member, i) => (
              <div key={i} className="team-card">
                <div className="team-card__avatar">{member.avatar}</div>
                <h4 className="team-card__name">{member.name}</h4>
                <p className="team-card__role">{member.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="cta section">
        <div className="container">
          <div className="cta__inner">
            <h2 className="cta__title">Ready to explore CaseFlow?</h2>
            <p className="cta__desc">Sign in to access the platform, or explore the documentation to learn more.</p>
            <div className="cta__actions">
              <Link to="/login" className="btn btn-primary">Sign In</Link>
              <Link to="/how-it-works" className="btn btn-dark">Learn More</Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
