import './Contact.css'

export default function Contact() {
  return (
    <main className="contact-page">
      <section className="contact-hero">
        <div className="container">
          <span className="section-label">Contact</span>
          <h1 className="contact-hero__title">Get in touch.</h1>
          <p className="contact-hero__sub">Questions about CaseFlow? Reach out to the team.</p>
        </div>
      </section>

      <section className="contact-body section">
        <div className="container">
          <div className="contact-grid">
            <div className="contact-info">
              <div className="contact-info__card">
                <h3>Project Details</h3>
                <div className="contact-info__row"><span className="contact-info__label">Organization</span><span>Cognizant Technology Solutions</span></div>
                <div className="contact-info__row"><span className="contact-info__label">Program</span><span>Full Stack Java with React Internship</span></div>
                <div className="contact-info__row"><span className="contact-info__label">Year</span><span>2026</span></div>
                <div className="contact-info__row"><span className="contact-info__label">Team Size</span><span>8 Interns</span></div>
                <div className="contact-info__row"><span className="contact-info__label">Project</span><span>CaseFlow — Legal Case Management System</span></div>
              </div>

              <div className="contact-info__card">
                <h3>Technology Contact</h3>
                <p className="contact-info__note">For technical queries about specific modules, reach out to the respective module owner listed on the About page.</p>
              </div>
            </div>

            <div className="contact-form-card">
              <h3>Send a Message</h3>
              <form className="contact-form" onSubmit={e => { e.preventDefault(); alert('Message sent! (demo)'); }}>
                <div className="contact-form__field">
                  <label>Name</label>
                  <input type="text" placeholder="Your name" required />
                </div>
                <div className="contact-form__field">
                  <label>Email</label>
                  <input type="email" placeholder="you@example.com" required />
                </div>
                <div className="contact-form__field">
                  <label>Message</label>
                  <textarea rows="5" placeholder="How can we help?" required />
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>Send Message</button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
