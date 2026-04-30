import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { hearings, cases, users } from '../../api/services'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'

const cardStyle = { borderRadius: 14, boxShadow: '0 2px 12px rgba(10,14,26,0.06)' }

export default function ScheduleHearing() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const nav = useNavigate()

  const [form, setForm] = useState({
    caseId: '', judgeId: '', hearingDate: '', hearingTime: '', scheduleId: '',
  })
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  const [caseList, setCaseList] = useState([])
  const [judgeList, setJudgeList] = useState([])
  const [slots, setSlots] = useState([])
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [caseSearch, setCaseSearch] = useState('')
  const [showCaseDropdown, setShowCaseDropdown] = useState(false)

  useEffect(() => {
    cases.list().then(d => setCaseList(d || [])).catch(() => {})
    users.byRole('JUDGE').then(d => setJudgeList(d || [])).catch(() => {})
  }, [])

  useEffect(() => {
    if (!form.judgeId) { setSlots([]); return }
    setSlotsLoading(true)
    setForm(f => ({ ...f, scheduleId: '' }))
    hearings.availableSlots(form.judgeId)
      .then(d => setSlots(d || []))
      .catch(() => setSlots([]))
      .finally(() => setSlotsLoading(false))
  }, [form.judgeId])

  const filteredCases = caseList.filter(c => {
    const q = caseSearch.toLowerCase()
    return String(c.caseId).includes(q) || (c.title || '').toLowerCase().includes(q) || (c.caseType || '').toLowerCase().includes(q)
  })

  const selectedCase = caseList.find(c => String(c.caseId) === String(form.caseId))
  const selectedJudge = judgeList.find(j => j.userId === form.judgeId)
  const selectedSlot = slots.find(s => String(s.scheduleId) === String(form.scheduleId))

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
        scheduleId: Number(form.scheduleId),
        scheduledBy: user.userId,
      })
      nav(`/hearings/${res.hearingId}`)
    } catch (e) { setErr(e.message) } finally { setLoading(false) }
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-3">
        <h1 className="page-title h3 mb-1">{t('Schedule Hearing')}</h1>
        <p className="text-muted mb-0" style={{ fontSize: 13 }}>
          Select a case, assign a judge, then pick an available time slot.
        </p>
      </div>

      {err && <div className="alert alert-danger py-2 mb-3" style={{ borderRadius: 10 }}>{err}</div>}

      <div className="card border-0 mx-auto" style={{ ...cardStyle, maxWidth: 720 }}>
        <div className="card-body p-4">
          {/* Section header */}
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
                    <div className="position-absolute w-100 bg-white border-0 shadow"
                      style={{ zIndex: 1050, maxHeight: 280, overflowY: 'auto', top: 'calc(100% + 4px)', borderRadius: 12 }}>
                      <div className="p-2" style={{ borderBottom: '1px solid #f0f2f7' }}>
                        <div className="input-group input-group-sm">
                          <span className="input-group-text border-0 bg-light"><i className="bi bi-search text-muted" /></span>
                          <input
                            autoFocus
                            className="form-control border-0 bg-light"
                            placeholder={t('Search by ID, title, or type...')}
                            value={caseSearch}
                            onChange={e => setCaseSearch(e.target.value)}
                            onClick={e => e.stopPropagation()}
                          />
                        </div>
                      </div>
                      {filteredCases.length === 0 ? (
                        <div className="text-center text-muted py-4" style={{ fontSize: 13 }}>
                          <i className="bi bi-search d-block mb-1" />No cases found
                        </div>
                      ) : filteredCases.map(c => (
                        <div
                          key={c.caseId}
                          className="px-3 py-2 d-flex justify-content-between align-items-center"
                          style={{
                            cursor: 'pointer',
                            background: String(form.caseId) === String(c.caseId) ? '#0f1629' : 'transparent',
                            color: String(form.caseId) === String(c.caseId) ? '#fff' : 'inherit',
                            fontSize: 14,
                            transition: 'background 0.15s',
                          }}
                          onMouseEnter={e => { if (String(form.caseId) !== String(c.caseId)) e.currentTarget.style.background = '#f8f9fc' }}
                          onMouseLeave={e => { if (String(form.caseId) !== String(c.caseId)) e.currentTarget.style.background = 'transparent' }}
                          onClick={() => { setForm(f => ({ ...f, caseId: String(c.caseId) })); setShowCaseDropdown(false) }}
                        >
                          <div>
                            <span className="fw-semibold" style={{ color: String(form.caseId) === String(c.caseId) ? '#c9a84c' : '#c9a84c' }}>#{c.caseId}</span>
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

              {/* ── Judge selector ── */}
              <div className="col-md-6">
                <label className="form-label fw-semibold small">{t('Judge')}</label>
                <select
                  className="form-select"
                  style={{ borderRadius: 9 }}
                  value={form.judgeId}
                  onChange={e => setForm(f => ({ ...f, judgeId: e.target.value, scheduleId: '' }))}
                  required
                >
                  <option value="">{t('Select a judge...')}</option>
                  {judgeList.map(j => (
                    <option key={j.userId} value={j.userId}>
                      {j.name || j.email} — {j.userId}
                    </option>
                  ))}
                </select>
              </div>

              {/* ── Slot selector ── */}
              <div className="col-md-6">
                <label className="form-label fw-semibold small">
                  {t('Available Slot')}
                  {form.judgeId && !slotsLoading && (
                    <span className="text-muted fw-normal ms-1" style={{ fontSize: 11 }}>
                      ({slots.length} available)
                    </span>
                  )}
                </label>
                {slotsLoading ? (
                  <div className="form-control d-flex align-items-center gap-2 text-muted" style={{ borderRadius: 9 }}>
                    <span className="spinner-border spinner-border-sm" />{t('Loading slots...')}
                  </div>
                ) : (
                  <select
                    className="form-select"
                    style={{ borderRadius: 9 }}
                    value={form.scheduleId}
                    onChange={e => {
                      const slot = slots.find(s => String(s.scheduleId) === e.target.value)
                      setForm(f => ({
                        ...f,
                        scheduleId: e.target.value,
                        hearingDate: slot?.scheduleDate || f.hearingDate,
                        hearingTime: slot?.timeSlot || f.hearingTime,
                      }))
                    }}
                    required
                    disabled={!form.judgeId || slots.length === 0}
                  >
                    <option value="">
                      {!form.judgeId ? t('Select a judge first') : slots.length === 0 ? t('No available slots') : t('Select a slot...')}
                    </option>
                    {slots.map(s => (
                      <option key={s.scheduleId} value={s.scheduleId}>
                        #{s.scheduleId} — {s.scheduleDate} · {s.timeSlot}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* ── Selected slot preview ── */}
              {selectedSlot && (
                <div className="col-12">
                  <div className="d-flex align-items-center gap-3 p-3 rounded-3" style={{ background: '#f0f7ff', border: '1px solid #c7ddf5' }}>
                    <i className="bi bi-calendar-check text-primary" style={{ fontSize: 20 }} />
                    <div>
                      <div className="fw-semibold" style={{ fontSize: 14, color: '#0f1629' }}>
                        Slot #{selectedSlot.scheduleId} — {selectedSlot.scheduleDate} at {selectedSlot.timeSlot}
                      </div>
                      <div className="text-muted" style={{ fontSize: 12 }}>
                        Date and time fields below are pre-filled from this slot
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Date & Time ── */}
              <div className="col-md-6">
                <label className="form-label fw-semibold small">{t('Hearing Date')}</label>
                <input
                  className="form-control"
                  style={{ borderRadius: 9 }}
                  type="date"
                  value={form.hearingDate}
                  onChange={e => setForm(f => ({ ...f, hearingDate: e.target.value }))}
                  required
                />
              </div>
              <div className="col-md-6">
                <label className="form-label fw-semibold small">{t('Hearing Time')}</label>
                <input
                  className="form-control"
                  style={{ borderRadius: 9 }}
                  value={form.hearingTime}
                  onChange={e => setForm(f => ({ ...f, hearingTime: e.target.value }))}
                  placeholder="e.g. 10:00 AM"
                  required
                />
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
              <button
                className="btn btn-dark px-4"
                style={{ borderRadius: 10, padding: '10px 28px', fontSize: 14 }}
                disabled={loading || !form.caseId || !form.judgeId || !form.scheduleId}
              >
                {loading
                  ? <><span className="spinner-border spinner-border-sm me-2" />Scheduling...</>
                  : <><i className="bi bi-calendar-check me-2" />{t('Schedule Hearing')}</>
                }
              </button>
              {(!form.caseId || !form.judgeId || !form.scheduleId) && (
                <span className="text-muted" style={{ fontSize: 12 }}>
                  <i className="bi bi-info-circle me-1" />
                  Complete all required fields to proceed
                </span>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
