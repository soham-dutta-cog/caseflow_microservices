import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import './Home.css'

/* ===== Scroll-triggered animation hook ===== */
function useReveal() {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true) },
      { threshold: 0.15 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])
  return [ref, visible]
}

function Reveal({ children, className = '', delay = 0 }) {
  const [ref, visible] = useReveal()
  return (
    <div ref={ref} className={`reveal ${visible ? 'reveal--visible' : ''} ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  )
}

/* ===== Animated counter ===== */
function Counter({ end, duration = 2000, suffix = '' }) {
  const [count, setCount] = useState(0)
  const [ref, visible] = useReveal()
  useEffect(() => {
    if (!visible) return
    let start = 0
    const step = end / (duration / 16)
    const timer = setInterval(() => {
      start += step
      if (start >= end) { setCount(end); clearInterval(timer) }
      else setCount(Math.floor(start))
    }, 16)
    return () => clearInterval(timer)
  }, [visible, end, duration])
  return <span ref={ref}>{count}{suffix}</span>
}

/* ===== Data ===== */
const modules = [
  {
    icon: '🔐', title: 'Identity & Access Management', color: '#8b6cc1', tag: 'Security',
    headline: 'Enterprise-grade security that never gets in the way.',
    desc: 'Role-based access control with JWT authentication ensures every user — from litigants to judges to administrators — sees only what they are authorized to see. Secure login, session management, and comprehensive audit logging of every action taken in the system.',
    features: ['JWT token-based authentication', 'Role-based access control (RBAC)', 'Secure password encryption with BCrypt', 'Complete audit trail of all user actions', 'Session management & token expiry'],
    stat: '100%', statLabel: 'API endpoints secured',
  },
  {
    icon: '📁', title: 'Case Filing & Documentation', color: '#4a90d9', tag: 'Core',
    headline: 'From paper stacks to digital filing in seconds.',
    desc: 'Digitize the entire case filing process. Litigants and lawyers can file new cases, upload supporting documents, and track document verification status — all from a single interface. Automatic status transitions ensure cases move forward without manual intervention.',
    features: ['Digital case filing with auto-generated IDs', 'Document upload with verification workflow', 'Auto-activation when all documents verified', 'Case status tracking (Filed → Active → Closed)', 'Search by litigant, lawyer, or status'],
    stat: '70%', statLabel: 'Faster than paper filing',
  },
  {
    icon: '⚙', title: 'Workflow & SLA Engine', color: '#2dd4a8', tag: 'Automation',
    headline: 'Never miss a deadline. Ever.',
    desc: 'The intelligent workflow engine automatically initializes lifecycle stages for every case, tracks SLA deadlines in real-time, and triggers breach notifications before deadlines are missed. Supports stage advancement, rollback, skip, and reassignment — giving clerks full control over case progression.',
    features: ['Auto-initialized lifecycle stages per case type', 'Real-time SLA countdown & breach detection', 'Stage advance, rollback, skip & reassign', 'SLA extension requests with audit trail', 'Warning notifications before deadline breach'],
    stat: '95%', statLabel: 'SLA compliance rate',
  },
  {
    icon: '⚖', title: 'Hearing & Scheduling', color: '#e8a838', tag: 'Scheduling',
    headline: 'Smart scheduling that respects everyone\'s time.',
    desc: 'Court clerks can manage judge calendars, check availability in real-time, and schedule hearings without conflicts. Automatic notifications go out to all parties. Supports rescheduling and completion with outcome recording — the entire hearing lifecycle in one place.',
    features: ['Judge calendar & availability management', 'Conflict-free hearing slot allocation', 'Automatic notifications to all parties', 'Reschedule with reason tracking', 'Hearing completion with outcome recording'],
    stat: '0', statLabel: 'Scheduling conflicts',
  },
  {
    icon: '📋', title: 'Appeals Management', color: '#f07068', tag: 'Legal Process',
    headline: 'Transparent appeals. Fair outcomes.',
    desc: 'When a decision is contested, the appeals module handles the entire process — from filing through review assignment to final decision. Each appeal is tracked with full transparency, complete with reviewer assignment, hearing linkage, and automatic status updates to the parent case.',
    features: ['Appeal filing against case decisions', 'Automatic reviewer assignment', 'Decision tracking with outcome recording', 'Parent case status auto-update', 'Complete appeal history & timeline'],
    stat: '100%', statLabel: 'Appeal transparency',
  },
  {
    icon: '✅', title: 'Compliance & Audit', color: '#1a9e7e', tag: 'Governance',
    headline: 'Stay compliant. Stay confident.',
    desc: 'Automated compliance checks run at every critical stage of a case. The audit module maintains an immutable trail of every action, every change, and every decision — ensuring regulatory compliance and providing a complete forensic record when needed.',
    features: ['Automated compliance checks at each stage', 'Immutable audit trail for all actions', 'Admin-led audit creation & closure', 'Findings documentation with timestamps', 'Compliance scoring per case'],
    stat: '100%', statLabel: 'Audit coverage',
  },
  {
    icon: '🔔', title: 'Smart Notifications', color: '#c9a84c', tag: 'Communication',
    headline: 'The right alert, to the right person, at the right time.',
    desc: 'Real-time notifications keep every stakeholder informed — from SLA breach warnings to hearing schedules to appeal decisions. Supports per-user notification feeds, read/unread tracking, bulk mark-as-read, and categorized alerts so important updates never get lost in the noise.',
    features: ['Real-time event-driven notifications', 'Per-user notification feed & history', 'Read/unread tracking with bulk actions', 'Categorized alerts (SLA, Hearing, Case)', 'Cross-service event consumption'],
    stat: '<1s', statLabel: 'Notification delivery',
  },
  {
    icon: '📊', title: 'Reports & Analytics', color: '#4a5d8a', tag: 'Insights',
    headline: 'Data-driven decisions for legal operations.',
    desc: 'Generate comprehensive reports across every dimension — case volumes, SLA metrics, hearing statistics, compliance scores, and more. Administrators get a bird\'s-eye view of the entire system with configurable report scopes and exportable data for stakeholder presentations.',
    features: ['Cross-service data aggregation', 'Configurable report scopes & filters', 'Case volume & status distribution', 'SLA performance metrics', 'Admin-level system-wide dashboards'],
    stat: '8', statLabel: 'Data sources unified',
  },
]

const metrics = [
  { number: 8, suffix: '', label: 'Independent Microservices' },
  { number: 11, suffix: '', label: 'Spring Cloud Services' },
  { number: 50, suffix: '+', label: 'REST API Endpoints' },
  { number: 8, suffix: '', label: 'Dedicated Databases' },
]

const techStack = [
  { category: 'Backend', items: ['Spring Boot 3.2', 'Spring Cloud Gateway', 'Spring Security + JWT', 'Spring Data JPA', 'OpenFeign Clients'] },
  { category: 'Infrastructure', items: ['Netflix Eureka Discovery', 'Spring Cloud Config Server', 'Resilience4j Circuit Breaker', 'MySQL (Database per Service)', 'Vite Dev Proxy'] },
  { category: 'Frontend', items: ['React 18', 'React Router v6', 'Vite Build Tool', 'CSS Custom Properties', 'Responsive Design'] },
]

const team = [
  { name: 'Varun', role: 'IAM & Security Module', avatar: '👤' },
  { name: 'Ananya', role: 'Case Filing Module', avatar: '👤' },
  { name: 'Sumita', role: 'Hearing & Scheduling Module', avatar: '👤' },
  { name: 'Soham', role: 'Workflow & SLA Module', avatar: '👤' },
  { name: 'Kalai', role: 'Appeals Module', avatar: '👤' },
  { name: 'Rashad', role: 'Compliance & Audit Module', avatar: '👤' },
  { name: 'Harsh', role: 'Notifications Module', avatar: '👤' },
  { name: 'Puneeth', role: 'Reporting & Analytics Module', avatar: '👤' },
]

const whyCards = [
  { icon: '🏛', title: 'Built for Legal', desc: 'Not a generic project management tool — every feature is purpose-built for legal case workflows, court scheduling, and compliance requirements.' },
  { icon: '🔄', title: 'Fault Tolerant', desc: 'Circuit breakers on every inter-service call. If notifications go down, case filing keeps working. No single point of failure.' },
  { icon: '⚡', title: 'Real-Time', desc: 'SLA breach detection, instant notifications, live status updates — everything happens in real-time, not batch-processed overnight.' },
  { icon: '🔒', title: 'Secure by Design', desc: 'JWT authentication at the gateway level, role-based access control, encrypted passwords, and immutable audit trails on every action.' },
  { icon: '📐', title: 'Independently Scalable', desc: 'Each microservice scales independently. Heavy reporting load? Scale just the reporting service without touching the rest.' },
  { icon: '🧩', title: 'Modular Architecture', desc: 'Each module is owned, developed, and deployed independently by a single team member — true microservice ownership.' },
]

export default function Home() {
  const [activeModule, setActiveModule] = useState(0)

  return (
    <main>
      {/* ===== HERO ===== */}
      <section className="hero">
        <div className="hero__bg">
          <div className="hero__gradient" />
          <div className="hero__grid-pattern" />
          <div className="hero__orb hero__orb--1" />
          <div className="hero__orb hero__orb--2" />
          <div className="hero__orb hero__orb--3" />
        </div>
        <div className="container hero__content">
          <h1 className="hero__title animate-in animate-in-delay-1">
            The future of legal<br />case management is&nbsp;
            <span className="text-gradient">here.</span>
          </h1>
          <p className="hero__subtitle animate-in animate-in-delay-2">
            CaseFlow replaces fragmented paper-based legal systems with a single, intelligent platform
            that automates case filing, hearing scheduling, deadline tracking, compliance checks, and reporting —
            so legal teams can focus on justice, not paperwork.
          </p>
          <div className="hero__actions animate-in animate-in-delay-3">
            <Link to="/login" className="btn btn-primary btn-lg">Get Started Free</Link>
            <a href="#modules" className="btn btn-secondary">Explore Modules</a>
          </div>

          <div className="hero__metrics animate-in animate-in-delay-4">
            {metrics.map((m, i) => (
              <div key={i} className="hero__metric">
                <span className="hero__metric-number"><Counter end={m.number} suffix={m.suffix} /></span>
                <span className="hero__metric-label">{m.label}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="hero__scroll-indicator">
          <div className="hero__scroll-line" />
        </div>
      </section>

      {/* ===== BRAND STORY ===== */}
      <section className="brand section">
        <div className="container">
          <div className="brand__grid">
            <Reveal>
              <div className="brand__left">
                <span className="section-label">Why CaseFlow?</span>
                <h2 className="section-title">Courts shouldn't run on spreadsheets and sticky notes.</h2>
              </div>
            </Reveal>
            <Reveal delay={200}>
              <div className="brand__right">
                <p>Every year, thousands of legal cases are delayed, mismanaged, or lost in bureaucratic chaos — not because of bad lawyers or judges, but because of outdated systems that were never designed for the complexity of modern legal operations.</p>
                <p>CaseFlow changes that. We built a platform from the ground up, using microservices architecture and cloud-native technology, to handle every stage of a legal case — from the moment it is filed to its final resolution. Every deadline tracked. Every document verified. Every stakeholder notified. Automatically.</p>
                <p className="brand__highlight">This isn't just digitization. It's a complete rethink of how legal workflows should operate in 2026.</p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ===== WHY CASEFLOW ===== */}
      <section className="why section">
        <div className="container">
          <Reveal>
            <div className="section-header">
              <span className="section-label">What Sets Us Apart</span>
              <h2 className="section-title">Six reasons legal teams choose CaseFlow.</h2>
            </div>
          </Reveal>
          <div className="why__grid">
            {whyCards.map((card, i) => (
              <Reveal key={i} delay={i * 80}>
                <div className="why-card">
                  <span className="why-card__icon">{card.icon}</span>
                  <h3 className="why-card__title">{card.title}</h3>
                  <p className="why-card__desc">{card.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===== MODULES — DETAILED SHOWCASE ===== */}
      <section className="modules section" id="modules">
        <div className="container">
          <Reveal>
            <div className="section-header">
              <span className="section-label">Platform Modules</span>
              <h2 className="section-title">Eight modules. One seamless experience.</h2>
              <p className="section-subtitle">Each module is an independent microservice — built, deployed, and scaled separately. Click any module to explore what it does.</p>
            </div>
          </Reveal>

          {/* Module selector tabs */}
          <div className="mod-tabs">
            {modules.map((mod, i) => (
              <button
                key={i}
                className={`mod-tab ${activeModule === i ? 'mod-tab--active' : ''}`}
                onClick={() => setActiveModule(i)}
                style={{ '--tab-color': mod.color }}
              >
                <span className="mod-tab__icon">{mod.icon}</span>
                <span className="mod-tab__title">{mod.title.split(' ')[0]}</span>
              </button>
            ))}
          </div>

          {/* Active module detail */}
          <div className="mod-detail" key={activeModule}>
            <div className="mod-detail__header">
              <span className="mod-detail__tag" style={{ background: modules[activeModule].color }}>{modules[activeModule].tag}</span>
              <h3 className="mod-detail__title">{modules[activeModule].title}</h3>
              <p className="mod-detail__headline">{modules[activeModule].headline}</p>
            </div>
            <div className="mod-detail__body">
              <div className="mod-detail__desc">
                <p>{modules[activeModule].desc}</p>
                <div className="mod-detail__stat">
                  <span className="mod-detail__stat-number">{modules[activeModule].stat}</span>
                  <span className="mod-detail__stat-label">{modules[activeModule].statLabel}</span>
                </div>
              </div>
              <div className="mod-detail__features">
                <h4>Key Capabilities</h4>
                <ul>
                  {modules[activeModule].features.map((f, j) => (
                    <li key={j}><span className="mod-feature__check" style={{ color: modules[activeModule].color }}>✓</span> {f}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Quick-access cards */}
          <div className="mod-cards">
            {modules.map((mod, i) => (
              <Reveal key={i} delay={i * 60}>
                <button className="mod-mini-card" onClick={() => { setActiveModule(i); document.getElementById('modules').scrollIntoView({ behavior: 'smooth' }) }} style={{ '--accent': mod.color }}>
                  <span className="mod-mini-card__icon">{mod.icon}</span>
                  <span className="mod-mini-card__title">{mod.title}</span>
                  <span className="mod-mini-card__arrow">→</span>
                </button>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      
      {/* ===== ARCHITECTURE ===== */}
      <section className="arch section">
        <div className="container">
          <div className="arch__inner">
            <Reveal>
              <div className="arch__text">
                <span className="section-label">Architecture</span>
                <h2 className="section-title" style={{ color: 'var(--cf-white)' }}>Built on microservices.<br />Designed for resilience.</h2>
                <p className="arch__desc">Every request flows through the API Gateway, authenticated via JWT, routed by Eureka service discovery, and protected by Resilience4j circuit breakers. If one service goes down, the rest keep running with graceful fallbacks.</p>
                <div className="arch__features">
                  <div className="arch__feature"><span className="arch__feature-icon">🛡</span> API Gateway routing</div>
                  <div className="arch__feature"><span className="arch__feature-icon">🔍</span> Eureka service discovery</div>
                  <div className="arch__feature"><span className="arch__feature-icon">⚡</span> Circuit breaker fallbacks</div>
                  <div className="arch__feature"><span className="arch__feature-icon">🗄</span> Database per service</div>
                  <div className="arch__feature"><span className="arch__feature-icon">⚙</span> Centralized config server</div>
                  <div className="arch__feature"><span className="arch__feature-icon">🔐</span> JWT at gateway level</div>
                </div>
              </div>
            </Reveal>
            <Reveal delay={200}>
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
                  <div className="arch__node arch__node--infra">Config Server<span>:8888</span></div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ===== TECH STACK ===== */}
      <section className="tech section" id="tech">
        <div className="container">
          <Reveal>
            <div className="section-header">
              <span className="section-label">Tech Stack</span>
              <h2 className="section-title">Powered by modern Java<br />and cloud-native tools.</h2>
            </div>
          </Reveal>
          <div className="tech__grid">
            {techStack.map((group, i) => (
              <Reveal key={i} delay={i * 120}>
                <div className="tech__card">
                  <h3 className="tech__card-title">{group.category}</h3>
                  <ul className="tech__list">
                    {group.items.map((item, j) => (
                      <li key={j} className="tech__item"><span className="tech__item-dot" />{item}</li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===== TEAM ===== */}
      <section className="team section" id="team">
        <div className="container">
          <Reveal>
            <div className="section-header">
              <span className="section-label">Our Team</span>
              <h2 className="section-title">8 interns. 8 modules.<br />One integrated platform.</h2>
              <p className="section-subtitle">Each team member owns an independent microservice end-to-end — from database design to REST API to frontend interface.</p>
            </div>
          </Reveal>
          <div className="team__grid">
            {team.map((member, i) => (
              <Reveal key={i} delay={i * 60}>
                <div className="team-card">
                  <div className="team-card__avatar">{member.avatar}</div>
                  <h4 className="team-card__name">{member.name}</h4>
                  <p className="team-card__role">{member.role}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="cta section">
        <div className="container">
          <Reveal>
            <div className="cta__inner">
              <h2 className="cta__title">Ready to see CaseFlow in action?</h2>
              <p className="cta__desc">Sign in to explore the platform, manage cases, track deadlines, and experience the future of legal operations.</p>
              <div className="cta__actions">
                <Link to="/login" className="btn btn-primary btn-lg">Get Started</Link>
                <Link to="/how-it-works" className="btn btn-dark">Read the Docs</Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </main>
  )
}