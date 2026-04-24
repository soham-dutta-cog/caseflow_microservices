const steps = [
  { num: '1', title: 'Case Filing', desc: 'A litigant or lawyer files a new case through the Case module. Documents are uploaded and queued for verification.', service: 'case-service → iam-service' },
  { num: '2', title: 'Workflow Initialization', desc: 'Once all documents are verified, the Workflow engine auto-initializes lifecycle stages with SLA deadlines for the case.', service: 'workflow-service → case-service' },
  { num: '3', title: 'Hearing Scheduling', desc: 'A court clerk schedules hearings by checking judge availability. Participants are notified automatically.', service: 'hearing-service → iam-service → notification-service' },
  { num: '4', title: 'Stage Advancement', desc: 'As the case progresses through stages (Filing → Active → Hearing → Decision), the workflow tracks deadlines and detects SLA breaches.', service: 'workflow-service → notification-service' },
  { num: '5', title: 'Appeals & Compliance', desc: 'If needed, appeals are filed against decisions. The Compliance module runs automated checks and maintains audit trails.', service: 'appeal-service → compliance-service' },
  { num: '6', title: 'Reporting', desc: 'Administrators generate reports across all modules — case volumes, SLA metrics, hearing stats, compliance scores.', service: 'reporting-service → all services' },
]

export default function HowItWorks() {
  return (
    <main>
      <section className="text-center text-white" style={{ background: 'var(--cf-navy-950)', padding: '160px 0 80px' }}>
        <div className="container">
          <span className="section-label">How It Works</span>
          <h1 className="mb-3" style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(32px, 5vw, 50px)', fontWeight: 600, lineHeight: 1.15 }}>From filing to resolution — <br />every step automated.</h1>
          <p className="fs-5 mx-auto mb-0" style={{ maxWidth: 560, color: 'rgba(255,255,255,0.5)' }}>Follow a case through the entire CaseFlow platform to see how all 8 microservices work together.</p>
        </div>
      </section>

      <section className="hiw-steps section">
        <div className="container">
          <div className="mx-auto" style={{ maxWidth: 680 }}>
            {steps.map((step, i) => (
              <div key={i} className="d-flex gap-3 gap-md-4 position-relative">
                <div className="d-flex flex-column align-items-center flex-shrink-0">
                  <span className="d-flex align-items-center justify-content-center rounded-circle fw-bold" style={{ width: 44, height: 44, background: 'var(--cf-navy-900)', color: 'var(--cf-gold-400)', fontFamily: 'var(--font-display)', fontSize: 18 }}>{step.num}</span>
                  {i < steps.length - 1 && <div className="flex-grow-1 my-2" style={{ width: 2, background: 'var(--cf-gray-200)' }} />}
                </div>
                <div className="pb-5">
                  <h3 className="h5 fw-bold text-dark mb-2">{step.title}</h3>
                  <p className="text-secondary mb-2" style={{ lineHeight: 1.7 }}>{step.desc}</p>
                  <span className="d-inline-block px-3 py-1 rounded-pill fw-semibold" style={{ background: 'var(--cf-navy-50)', color: 'var(--cf-navy-600)', fontSize: 12, fontFamily: 'monospace' }}>{step.service}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
