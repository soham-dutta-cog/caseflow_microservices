import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { hearings, cases, users } from '../../api/services'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'

const FIXED_SLOTS = [
  '9:00 AM - 10:00 AM',
  '10:00 AM - 11:00 AM',
  '11:00 AM - 12:00 PM',
  '2:00 PM - 3:00 PM',
  '3:00 PM - 4:00 PM',
]

const cardStyle = { borderRadius: 14, boxShadow: '0 2px 12px rgba(10,14,26,0.06)' }

export default function ScheduleHearing() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const nav = useNavigate()

  const [form, setForm] = useState({ caseId: '', judgeId: '', hearingDate: '', hearingTime: '' })
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  const [caseList, setCaseList] = useState([])
  const [judgeList, setJudgeList] = useState([])
  const [bookedTimes, setBookedTimes] = useState([])
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [caseSearch, setCaseSearch] = useState('')
  const [showCaseDropdown, setShowCaseDropdown] = useState(false)

  useEffect(() => {
    cases.list().then(d => setCaseList(d || [])).catch(() => {})
    users.byRole('JUDGE').then(d => setJudgeList(d || [])).catch(() => {})
  }, [])

  // When judge OR date changes, reload booked times for that judge+date
  useEffect(() => {
    setForm(f => ({ ...f, hearingTime: '' }))
    setBookedTimes([])
    if (!form.judgeId || !form.hearingDate) return
    setSlotsLoading(true)
    hearings.byJudge(form.judgeId)
      .then(d => {
        const booked = (d || [])
          .filter(h => h.hearingDate === form.hearingDate && h.status !== 'CANCELLED')
          .map(h => h.hearingTime)
        setBookedTimes(booked)
      })
      .catch(() => {})
      .finally(() => setSlotsLoading(false))
  }, [form.judgeId, form.hearingDate])

  const filteredCases = caseList.filter(c => {
    const q = caseSearch.toLowerCase()
    return String(c.caseId).includes(q) || (c.title || '').toLowerCase().includes(q) || (c.caseType || '').toLowerCase().includes(q)
  })

  const selectedCase = caseList.find(c => String(c.caseId) === String(form.caseId))
  const selectedJudge = judgeList.find(j => j.userId === form.judgeId)
  const availableSlots = FIXED_SLOTS.filter(s => !bookedTimes.includes(s))

  const submit = async (e) => {
    e.preventDefault()
    setErr('')
    setLoading(true)
    try {
      const res = await hearings.schedule({
        caseId: Number(form.caseId),
        judgeId: form.judgeId,
        hearingDate: form.hearingDate,
        hearingTime: form.hearingTime,
        scheduledBy: user.userId,
      })
      nav(`/hearings/${res.hearingId}`)
    } catch (e) { setErr(e.message) } finally { setLoading(false) }
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <div>
      <div className="mb-3">
        <h1 className="page-title h3 mb-1">{t('Schedule Hearing')}</h1>
        <p className="text-muted mb-0" style={{ fontSize: 13 }}>
          Select a case, assign a judge, pick a date, then choose a time slot.
        </p>
      </div>

      {err && <div className="alert alert-danger py-2 mb-3" style={{ borderRadius: 10 }}>{err}</div>}

      <div className="card border-0 mx-auto" style={{ ...cardStyle, maxWidth: 720 }}>
        <div className="card-body p-4">

          <div className="d-flex align-items-center gap-2 mb-4">
            <div className="d-flex align-items-center justify-content-center flex-shrink-0"
              style={{ width: 36, height: 36, borderRadius: 9, background: 'linear-gradient(135deg, #c9a84c, #d4b865)' }}>
              <i className="bi bi-calendar-plus text-white" style={{ fontSize: 16 }} />
            </div>
            <h3 className="h6 fw-bold mb-0" style={{ color: '#0f1629' }}>New Hearing</h3>
          </div>

          <form onSubmit={submit}>
            <div className="row g-3">

              {/* ── Case selector ── */}
              <div className="col-12">
                <label className="form-label fw-semibold small">{t('Case')}</label>
                <div className="position-relative">
                  <div
                    className="form-control d-flex align-items-center justify-content-between"
                    style={{ cursor: 'pointer', minHeight: 40, borderRadius: 9, userSelect: 'none' }}
                    onClick={() => { setShowCaseDropdown(v => !v); setCaseSearch('') }}
                  >
                    {selectedCase ? (
                      <span>
                        <strong style={{ color: '#c9a84c' }}>#{selectedCase.caseId}</strong>
                        <span className="ms-2 text-muted" style={{ fontSize: 13 }}>
                          {selectedCase.title || selectedCase.caseType || 'Case'}
                        </span>
                      </span>
                    ) : (
                      <span className="text-muted" style={{ fontSize: 14 }}>{t('Search and select a case...')}</span>
                    )}
                    <i className={`bi ${showCaseDropdown ? 'bi-chevron-up' : 'bi-chevron-down'} text-muted`} style={{ fontSize: 12 }} />
                  </div>

                  {showCaseDropdown && (
                    <div className="position-absolute w-100 bg-white shadow"
                      style={{ zIndex: 1050, maxHeight: 280, overflowY: 'auto', top: 'calc(100% + 4px)', borderRadius: 12, border: '1px solid #f0f2f7' }}>
                      <div className="p-2" style={{ borderBottom: '1px solid #f0f2f7' }}>
                        <div className="input-group input-group-sm">
                          <span className="input-group-text border-0 bg-light"><i className="bi bi-search text-muted" /></span>
                          <input autoFocus className="form-control border-0 bg-light"
                            placeholder={t('Search by ID, title, or type...')}
                            value={caseSearch} onChange={e => setCaseSearch(e.target.value)}
                            onClick={e => e.stopPropagation()} />
                        </div>
                      </div>
                      {filteredCases.length === 0 ? (
                        <div className="text-center text-muted py-4" style={{ fontSize: 13 }}>
                          <i className="bi bi-search d-block mb-1" />No cases found
                        </div>
                      ) : filteredCases.map(c => (
                        <div key={c.caseId}
                          className="px-3 py-2 d-flex justify-content-between align-items-center"
                          style={{ cursor: 'pointer', background: String(form.caseId) === String(c.caseId) ? '#0f1629' : 'transparent', color: String(form.caseId) === String(c.caseId) ? '#fff' : 'inherit', fontSize: 14, transition: 'background 0.15s' }}
                          onMouseEnter={e => { if (String(form.caseId) !== String(c.caseId)) e.currentTarget.style.background = '#f8f9fc' }}
                          onMouseLeave={e => { if (String(form.caseId) !== String(c.caseId)) e.currentTarget.style.background = 'transparent' }}
                          onClick={() => { setForm(f => ({ ...f, caseId: String(c.caseId) })); setShowCaseDropdown(false) }}
                        >
                          <div>
                            <span className="fw-semibold" style={{ color: '#c9a84c' }}>#{c.caseId}</span>
                            {c.title && <span className="ms-2">{c.title}</span>}
                          </div>
                          <div className="d-flex gap-1">
                            {c.caseType && <span className="badge bg-secondary" style={{ fontSize: 10 }}>{c.caseType}</span>}
                            {c.status && <span className="badge bg-light text-dark border" style={{ fontSize: 10 }}>{c.status}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <input type="hidden" value={form.caseId} required />
              </div>

              {/* ── Judge + Date ── */}
              <div className="col-md-6">
                <label className="form-label fw-semibold small">{t('Judge')}</label>
                <select className="form-select" style={{ borderRadius: 9 }}
                  value={form.judgeId}
                  onChange={e => setForm(f => ({ ...f, judgeId: e.target.value, hearingTime: '' }))}
                  required>
                  <option value="">{t('Select a judge...')}</option>
                  {judgeList.map(j => (
                    <option key={j.userId} value={j.userId}>{j.name || j.email} — {j.userId}</option>
                  ))}
                </select>
              </div>

              <div className="col-md-6">
                <label className="form-label fw-semibold small">{t('Hearing Date')}</label>
                <input className="form-control" style={{ borderRadius: 9 }} type="date"
                  min={today}
                  value={form.hearingDate}
                  onChange={e => setForm(f => ({ ...f, hearingDate: e.target.value, hearingTime: '' }))}
                  required />
              </div>

              {/* ── Slot cards ── */}
              <div className="col-12">
                <label className="form-label fw-semibold small d-flex align-items-center justify-content-between">
                  <span>{t('Available Time Slots')}</span>
                  {form.judgeId && form.hearingDate && !slotsLoading && (
                    <span className="text-muted fw-normal" style={{ fontSize: 11 }}>
                      {availableSlots.length} of {FIXED_SLOTS.length} slots free — click to select
                    </span>
                  )}
                </label>

                {!form.judgeId || !form.hearingDate ? (
                  <div className="rounded-3 p-3 d-flex align-items-center gap-2"
                    style={{ background: '#f8f9fc', border: '1px dashed #dee2e6' }}>
                    <i className="bi bi-arrow-up-circle text-muted" />
                    <span className="text-muted" style={{ fontSize: 13 }}>
                      {!form.judgeId ? 'Select a judge' : 'Pick a date'} to see available slots
                    </span>
                  </div>
                ) : slotsLoading ? (
                  <div className="rounded-3 p-3 d-flex align-items-center gap-2"
                    style={{ background: '#f8f9fc', border: '1px solid #f0f2f7' }}>
                    <span className="spinner-border spinner-border-sm text-muted" />
                    <span className="text-muted" style={{ fontSize: 13 }}>Checking availability...</span>
                  </div>
                ) : (
                  <div className="d-flex flex-column gap-2">
                    {FIXED_SLOTS.map(slot => {
                      const booked = bookedTimes.includes(slot)
                      const selected = form.hearingTime === slot
                      return (
                        <div key={slot}
                          onClick={() => !booked && setForm(f => ({ ...f, hearingTime: slot }))}
                          style={{
                            cursor: booked ? 'not-allowed' : 'pointer',
                            borderRadius: 10,
                            padding: '12px 16px',
                            border: selected ? '2px solid #0f1629' : booked ? '1.5px solid #f0f2f7' : '1.5px solid #e9ecef',
                            background: selected ? '#0f1629' : booked ? '#fafafa' : '#fff',
                            opacity: booked ? 0.55 : 1,
                            transition: 'all 0.18s',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                          }}
                          onMouseEnter={e => { if (!booked && !selected) { e.currentTarget.style.borderColor = '#c9a84c'; e.currentTarget.style.background = '#fffbf0' } }}
                          onMouseLeave={e => { if (!booked && !selected) { e.currentTarget.style.borderColor = '#e9ecef'; e.currentTarget.style.background = '#fff' } }}
                        >
                          <div className="d-flex align-items-center gap-3">
                            <div className="d-flex align-items-center justify-content-center"
                              style={{ width: 38, height: 38, borderRadius: 8, background: selected ? 'rgba(255,255,255,0.12)' : booked ? '#f0f2f7' : '#f8f9fc', flexShrink: 0 }}>
                              <i className="bi bi-clock" style={{ fontSize: 16, color: selected ? '#c9a84c' : booked ? '#adb5bd' : '#6c757d' }} />
                            </div>
                            <div>
                              <div className="fw-semibold" style={{ fontSize: 14, color: selected ? '#fff' : booked ? '#adb5bd' : '#0f1629' }}>
                                {slot}
                              </div>
                              <div style={{ fontSize: 12, color: selected ? 'rgba(255,255,255,0.6)' : '#adb5bd' }}>
                                {booked ? 'Already booked' : `${form.hearingDate}`}
                              </div>
                            </div>
                          </div>
                          <div className="d-flex align-items-center gap-2">
                            {booked ? (
                              <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: '#f0f2f7', color: '#adb5bd', border: '1px solid #dee2e6' }}>
                                Booked
                              </span>
                            ) : selected ? (
                              <>
                                <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}>
                                  Selected
                                </span>
                                <i className="bi bi-check-circle-fill" style={{ fontSize: 16, color: '#c9a84c' }} />
                              </>
                            ) : (
                              <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: '#e8f5ec', color: '#34a85a', border: '1px solid #b8e6c4' }}>
                                Available
                              </span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
                <input type="hidden" value={form.hearingTime} required />
              </div>

              {/* ── Scheduled By ── */}
              <div className="col-12">
                <label className="form-label fw-semibold small">{t('Scheduled By')}</label>
                <div className="form-control d-flex align-items-center gap-2"
                  style={{ borderRadius: 9, background: '#f8f9fc', cursor: 'default', color: '#6c757d' }}>
                  <i className="bi bi-person-circle" />
                  <span style={{ fontSize: 14 }}>{user?.name || user?.email}</span>
                  <span className="ms-auto badge bg-secondary" style={{ fontSize: 11 }}>{user?.userId}</span>
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="d-flex align-items-center gap-3 mt-4 pt-3" style={{ borderTop: '1px solid #f0f2f7' }}>
              <button className="btn btn-dark px-4"
                style={{ borderRadius: 10, padding: '10px 28px', fontSize: 14 }}
                disabled={loading || !form.caseId || !form.judgeId || !form.hearingDate || !form.hearingTime}>
                {loading
                  ? <><span className="spinner-border spinner-border-sm me-2" />Scheduling...</>
                  : <><i className="bi bi-calendar-check me-2" />{t('Schedule Hearing')}</>}
              </button>
              {(!form.caseId || !form.judgeId || !form.hearingDate || !form.hearingTime) && (
                <span className="text-muted" style={{ fontSize: 12 }}>
                  <i className="bi bi-info-circle me-1" />Complete all required fields to proceed
                </span>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
