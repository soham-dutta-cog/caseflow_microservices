export default function Contact() {
  return (
    <main>
      <section className="text-center text-white" style={{ background: 'var(--cf-navy-950)', padding: '160px 0 80px' }}>
        <div className="container">
          <span className="section-label">Contact</span>
          <h1 className="mb-2" style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(32px, 5vw, 50px)', fontWeight: 600, color: '#fff' }}>Get in touch.</h1>
          <p className="fs-5 mb-0" style={{ color: 'rgba(255,255,255,0.5)' }}>Questions about CaseFlow? Reach out to the team.</p>
        </div>
      </section>

      <section className="contact-body section">
        <div className="container">
          <div className="row g-4">
            <div className="col-12 col-lg-6 d-flex flex-column gap-4">
              <div className="card border shadow-sm p-4 rounded-3">
                <h3 className="h5 fw-bold text-dark mb-4">Project Details</h3>
                <div className="d-flex justify-content-between py-2 border-bottom small"><span className="fw-semibold text-dark">Organization</span><span className="text-secondary">Cognizant Technology Solutions</span></div>
                <div className="d-flex justify-content-between py-2 border-bottom small"><span className="fw-semibold text-dark">Program</span><span className="text-secondary">Full Stack Java with React Internship</span></div>
                <div className="d-flex justify-content-between py-2 border-bottom small"><span className="fw-semibold text-dark">Year</span><span className="text-secondary">2026</span></div>
                <div className="d-flex justify-content-between py-2 border-bottom small"><span className="fw-semibold text-dark">Team Size</span><span className="text-secondary">8 Interns</span></div>
                <div className="d-flex justify-content-between py-2 small"><span className="fw-semibold text-dark">Project</span><span className="text-secondary">CaseFlow — Legal Case Management System</span></div>
              </div>

              <div className="card border shadow-sm p-4 rounded-3">
                <h3 className="h5 fw-bold text-dark mb-3">Technology Contact</h3>
                <p className="small text-muted mb-0">For technical queries about specific modules, reach out to the respective module owner listed on the About page.</p>
              </div>
            </div>

            <div className="col-12 col-lg-6">
              <div className="card border shadow-sm p-4 rounded-3 h-100">
                <h3 className="h5 fw-bold text-dark mb-4">Send a Message</h3>
                <form className="d-flex flex-column gap-3" onSubmit={e => { e.preventDefault(); alert('Message sent! (demo)'); }}>
                  <div>
                    <label className="form-label small fw-semibold text-dark mb-1">Name</label>
                    <input type="text" className="form-control" placeholder="Your name" required />
                  </div>
                  <div>
                    <label className="form-label small fw-semibold text-dark mb-1">Email</label>
                    <input type="email" className="form-control" placeholder="you@example.com" required />
                  </div>
                  <div>
                    <label className="form-label small fw-semibold text-dark mb-1">Message</label>
                    <textarea rows="5" className="form-control" placeholder="How can we help?" required />
                  </div>
                  <button type="submit" className="btn btn-gold w-100">Send Message</button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
