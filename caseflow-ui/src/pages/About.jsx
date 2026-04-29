export default function About() {
  return (
    <main>
      <section className="text-white" style={{ background: 'var(--cf-navy-950)', padding: '160px 0 80px' }}>
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-7">
              <span className="section-label">About CaseFlow</span>
              <h1 className="mb-3" style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(32px, 5vw, 50px)', fontWeight: 600, lineHeight: 1.15 }}>Bringing legal case management into the modern era.</h1>
              <p className="fs-5 mb-0" style={{ maxWidth: 580, color: 'rgba(255,255,255,0.5)' }}>CaseFlow is a full-stack microservices application developed by a team of 8 interns at Cognizant during the 2026 internship program, specializing in Full Stack Java with React.</p>
            </div>
            <div className="col-lg-5 d-none d-lg-flex justify-content-center">
              <div className="d-flex flex-column gap-3 text-center">
                {[{n:'8', l:'Services'},{n:'11', l:'Cloud Components'},{n:'50+', l:'Endpoints'}].map((s,i) => (
                  <div key={i} className="px-4 py-3 rounded-3" style={{background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)'}}>
                    <div style={{fontFamily:'var(--font-display)', fontSize:28, fontWeight:700, color:'var(--cf-gold-400)'}}>{s.n}</div>
                    <div style={{fontSize:12, color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:'0.08em'}}>{s.l}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="about-mission section">
        <div className="container">
          <div className="row g-4">
            <div className="col-12 col-md-4">
              <div className="card h-100 border shadow-sm p-4 rounded-3">
                <h3 className="h5 fw-bold text-dark mb-3">The Problem</h3>
                <p className="small text-secondary mb-0">Traditional legal case management relies on fragmented paper-based systems, disconnected tools, and manual tracking — leading to missed deadlines, compliance failures, and poor visibility across case lifecycles.</p>
              </div>
            </div>
            <div className="col-12 col-md-4">
              <div className="card h-100 border shadow-sm p-4 rounded-3">
                <h3 className="h5 fw-bold text-dark mb-3">Our Solution</h3>
                <p className="small text-secondary mb-0">CaseFlow digitizes and unifies the entire legal workflow — case filing, document management, hearing scheduling, SLA tracking, compliance checks, and reporting — into a single, integrated microservices platform with real-time notifications and role-based access.</p>
              </div>
            </div>
            <div className="col-12 col-md-4">
              <div className="card h-100 border shadow-sm p-4 rounded-3">
                <h3 className="h5 fw-bold text-dark mb-3">The Architecture</h3>
                <p className="small text-secondary mb-0">Built with Spring Boot 3 microservices, Spring Cloud infrastructure (Eureka, Gateway, Config Server), Resilience4j circuit breakers, and a React frontend — each module independently deployable and scalable.</p>
              </div>
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
          <div className="row g-4">
            {[
              { num: '01', title: 'True Microservices', desc: '8 independently deployable services, each with its own database, communicating via REST and Feign clients.' },
              { num: '02', title: 'Fault Tolerant', desc: 'Resilience4j circuit breakers on every inter-service call — if one service goes down, the rest keep running with graceful fallbacks.' },
              { num: '03', title: 'Centralized Config', desc: 'Spring Cloud Config Server manages all service configurations from one place — change settings without redeploying.' },
              { num: '04', title: 'SLA Enforcement', desc: 'Automated deadline tracking with breach detection and real-time notifications — no case falls through the cracks.' },
            ].map((v, i) => (
              <div key={i} className="col-12 col-md-6">
                <div className="bg-white border p-4 h-100 rounded-3 shadow-sm">
                  <span className="fs-3 fw-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--cf-gold-400)' }}>{v.num}</span>
                  <h3 className="h5 fw-bold text-dark mt-2 mb-2">{v.title}</h3>
                  <p className="small text-secondary mb-0">{v.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
