import './About.css'

export default function About() {
  return (
    <main className="about-page">
      <section className="about-hero">
        <div className="container">
          <span className="section-label">About CaseFlow</span>
          <h1 className="about-hero__title">Bringing legal case management <br />into the modern era.</h1>
          <p className="about-hero__sub">CaseFlow is a full-stack microservices application developed by a team of 8 interns at Cognizant during the 2026 internship program, specializing in Full Stack Java with React.</p>
        </div>
      </section>

      <section className="about-mission section">
        <div className="container">
          <div className="about-mission__grid">
            <div className="about-mission__card">
              <h3>The Problem</h3>
              <p>Traditional legal case management relies on fragmented paper-based systems, disconnected tools, and manual tracking — leading to missed deadlines, compliance failures, and poor visibility across case lifecycles.</p>
            </div>
            <div className="about-mission__card">
              <h3>Our Solution</h3>
              <p>CaseFlow digitizes and unifies the entire legal workflow — case filing, document management, hearing scheduling, SLA tracking, compliance checks, and reporting — into a single, integrated microservices platform with real-time notifications and role-based access.</p>
            </div>
            <div className="about-mission__card">
              <h3>The Architecture</h3>
              <p>Built with Spring Boot 3 microservices, Spring Cloud infrastructure (Eureka, Gateway, Config Server), Resilience4j circuit breakers, and a React frontend — each module independently deployable and scalable.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="about-values section">
        <div className="container">
          <div className="section-header">
            <span className="section-label">Project Highlights</span>
            <h2 className="section-title">What makes CaseFlow different.</h2>
          </div>
          <div className="about-values__grid">
            {[
              { num: '01', title: 'True Microservices', desc: '8 independently deployable services, each with its own database, communicating via REST and Feign clients.' },
              { num: '02', title: 'Fault Tolerant', desc: 'Resilience4j circuit breakers on every inter-service call — if one service goes down, the rest keep running with graceful fallbacks.' },
              { num: '03', title: 'Centralized Config', desc: 'Spring Cloud Config Server manages all service configurations from one place — change settings without redeploying.' },
              { num: '04', title: 'SLA Enforcement', desc: 'Automated deadline tracking with breach detection and real-time notifications — no case falls through the cracks.' },
            ].map((v, i) => (
              <div key={i} className="about-value">
                <span className="about-value__num">{v.num}</span>
                <h3 className="about-value__title">{v.title}</h3>
                <p className="about-value__desc">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
