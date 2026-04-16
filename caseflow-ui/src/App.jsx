import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import About from './pages/About'
import HowItWorks from './pages/HowItWorks'
import Contact from './pages/Contact'

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/how-it-works" element={<HowItWorks />} />
        <Route path="/contact" element={<Contact />} />
        {/* 
          Module routes — each team member adds their own here:
          <Route path="/login" element={<Login />} />
          <Route path="/cases/*" element={<CaseModule />} />
          <Route path="/hearings/*" element={<HearingModule />} />
          <Route path="/workflow/*" element={<WorkflowModule />} />
          <Route path="/appeals/*" element={<AppealModule />} />
          <Route path="/compliance/*" element={<ComplianceModule />} />
          <Route path="/notifications/*" element={<NotificationsModule />} />
          <Route path="/reports/*" element={<ReportsModule />} />
        */}
      </Routes>
      <Footer />
    </Router>
  )
}

export default App
