export const ROLES = ['LITIGANT', 'LAWYER', 'JUDGE', 'CLERK', 'ADMIN']
export const USER_STATUS = ['ACTIVE', 'INACTIVE', 'SUSPENDED']

export const CASE_STATUS = ['FILED', 'UNDER_REVIEW', 'HEARING_SCHEDULED', 'DECIDED', 'APPEALED', 'CLOSED']
export const DOC_TYPES = ['PETITION', 'AFFIDAVIT', 'EVIDENCE', 'ORDER', 'JUDGMENT', 'OTHER']
export const DOC_VERIFICATION = ['PENDING', 'VERIFIED', 'REJECTED']

export const HEARING_STATUS = ['SCHEDULED', 'RESCHEDULED', 'COMPLETED', 'CANCELLED']
export const APPEAL_STATUS = ['FILED', 'UNDER_REVIEW', 'DECISION_ISSUED', 'CLOSED']
export const REVIEW_OUTCOME = ['UPHELD', 'REVERSED', 'MODIFIED', 'SENT_BACK']

export const SLA_STATUS = ['ACTIVE', 'WARNING', 'BREACHED', 'CLOSED']
export const COMPLIANCE_RESULT = ['PASS', 'FAIL', 'NEEDS_REVIEW']
export const AUDIT_STATUS = ['OPEN', 'CLOSED', 'PENDING']

export const NOTIF_CATEGORY = ['CASE', 'HEARING', 'APPEAL', 'COMPLIANCE']
export const NOTIF_STATUS = ['READ', 'UNREAD']

export const REPORT_SCOPE = ['COURT', 'JUDGE', 'PERIOD', 'CLERK', 'LAWYER', 'CASE', 'COMPLIANCE']

export const REPORT_SCOPE_HELP = {
  COURT:      { label: 'System-wide', placeholder: 'ALL', hint: 'Whole court / system-wide aggregate. Use "ALL" or any label.' },
  JUDGE:      { label: 'By Judge',    placeholder: 'Judge user-id (e.g. 12)', hint: 'Numeric judge id. Filters cases & hearings to this judge.' },
  PERIOD:     { label: 'Date range',  placeholder: 'e.g. Q1 2026',            hint: 'Pick dateFrom and dateTo below. scopeValue is just a label.' },
  CLERK:      { label: 'By Clerk',    placeholder: 'Clerk user-id',           hint: 'System-wide metrics tagged to a clerk for tracking.' },
  LAWYER:     { label: 'By Lawyer',   placeholder: 'Lawyer email or id',      hint: 'Filters to cases this lawyer represents.' },
  CASE:       { label: 'Single case', placeholder: 'Case id (e.g. 42)',       hint: 'Drill-down report for one specific case.' },
  COMPLIANCE: { label: 'Compliance',  placeholder: 'ALL',                     hint: 'Compliance-focused report (audit trail + checks).' },
}

export const CASE_TYPES = ['civil', 'criminal', 'corporate']
export const LIFECYCLE_MODES = ['auto', 'manual']

export function statusBadgeClass(status) {
  if (!status) return 'text-bg-secondary'
  const s = String(status).toUpperCase()
  if (['ACTIVE', 'VERIFIED', 'PASS', 'COMPLETED', 'DECIDED', 'CLOSED', 'READ', 'DECISION_ISSUED', 'UPHELD'].includes(s)) return 'text-bg-success'
  if (['WARNING', 'PENDING', 'UNDER_REVIEW', 'NEEDS_REVIEW', 'SCHEDULED', 'HEARING_SCHEDULED', 'FILED', 'UNREAD', 'RESCHEDULED'].includes(s)) return 'text-bg-warning'
  if (['BREACHED', 'REJECTED', 'FAIL', 'CANCELLED', 'SUSPENDED', 'INACTIVE', 'REVERSED', 'APPEALED'].includes(s)) return 'text-bg-danger'
  if (['OPEN', 'MODIFIED', 'SENT_BACK'].includes(s)) return 'text-bg-info'
  return 'text-bg-secondary'
}

export function formatDate(d) {
  if (!d) return '-'
  try {
    const date = new Date(d)
    if (isNaN(date.getTime())) return d
    return date.toLocaleDateString()
  } catch { return d }
}
export function formatDateTime(d) {
  if (!d) return '-'
  try {
    const date = new Date(d)
    if (isNaN(date.getTime())) return d
    return date.toLocaleString()
  } catch { return d }
}
