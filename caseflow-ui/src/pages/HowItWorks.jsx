import './HowItWorks.css'

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
    <main className="hiw-page">
      <section className="hiw-hero">
        <div className="container">
          <span className="section-label">How It Works</span>
          <h1 className="hiw-hero__title">From filing to resolution — <br />every step automated.</h1>
          <p className="hiw-hero__sub">Follow a case through the entire CaseFlow platform to see how all 8 microservices work together.</p>
        </div>
      </section>

      <section className="hiw-steps section">
        <div className="container">
          <div className="hiw-timeline">
            {steps.map((step, i) => (
              <div key={i} className="hiw-step">
                <div className="hiw-step__marker">
                  <span className="hiw-step__num">{step.num}</span>
                  {i < steps.length - 1 && <div className="hiw-step__line" />}
                </div>
                <div className="hiw-step__content">
                  <h3 className="hiw-step__title">{step.title}</h3>
                  <p className="hiw-step__desc">{step.desc}</p>
                  <span className="hiw-step__service">{step.service}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
