export const ROLES = ['LITIGANT', 'LAWYER', 'JUDGE', 'CLERK', 'ADMIN']
export const USER_STATUS = ['ACTIVE', 'INACTIVE', 'SUSPENDED']

export const CASE_STATUS = ['FILED', 'ACTIVE', 'ADJOURNED', 'CLOSED']
export const DOC_TYPES = ['PETITION', 'AFFIDAVIT', 'EVIDENCE', 'ORDER', 'JUDGMENT', 'OTHER']
export const DOC_VERIFICATION = ['PENDING', 'VERIFIED', 'REJECTED']

export const HEARING_STATUS = ['SCHEDULED', 'RESCHEDULED', 'COMPLETED', 'CANCELLED']

// ── Appeals (must match backend enums in entity/Appeal.java + entity/Review.java) ──
export const APPEAL_STATUS = ['SUBMITTED', 'REVIEWED', 'DECIDED', 'CANCELLED']
export const REVIEW_OUTCOME = [
  'APPEAL_UPHELD',
  'APPEAL_DISMISSED',
  'PARTIALLY_UPHELD',
  'REMANDED',
  'RETRIAL_ORDERED',
]
export const APPEAL_DOC_TYPES = [
  'PETITION', 'EVIDENCE', 'BRIEF', 'AFFIDAVIT',
  'PRIOR_JUDGMENT', 'NOTICE', 'OTHER',
]
export const APPEAL_AUDIT_ACTIONS = {
  FILED:                 'Filed',
  CANCELLED:             'Cancelled',
  OPENED_FOR_REVIEW:     'Opened for review',
  OUTCOME_DRAFT_UPDATED: 'Draft outcome updated',
  DECIDED:               'Decision issued',
  DOCUMENT_UPLOADED:     'Document uploaded',
  DOCUMENT_DELETED:      'Document deleted',
}
export const REVIEW_OUTCOME_LABELS = {
  APPEAL_UPHELD:    'Appeal upheld',
  APPEAL_DISMISSED: 'Appeal dismissed',
  PARTIALLY_UPHELD: 'Partially upheld',
  REMANDED:         'Remanded',
  RETRIAL_ORDERED:  'Retrial ordered',
}

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
  // green — terminal / good outcomes
  if (['ACTIVE', 'VERIFIED', 'PASS', 'COMPLETED', 'DECIDED', 'CLOSED', 'READ',
       'APPEAL_UPHELD', 'PARTIALLY_UPHELD', 'RETRIAL_ORDERED'].includes(s)) return 'text-bg-success'
  // amber — in-progress / pending
  if (['WARNING', 'PENDING', 'SUBMITTED', 'REVIEWED', 'NEEDS_REVIEW',
       'SCHEDULED', 'HEARING_SCHEDULED', 'FILED', 'UNREAD', 'RESCHEDULED'].includes(s)) return 'text-bg-warning'
  // red — failed / cancelled
  if (['BREACHED', 'REJECTED', 'FAIL', 'CANCELLED', 'SUSPENDED', 'INACTIVE',
       'APPEAL_DISMISSED', 'APPEALED'].includes(s)) return 'text-bg-danger'
  // blue — informational / lateral movements
  if (['OPEN', 'REMANDED', 'OPENED_FOR_REVIEW', 'OUTCOME_DRAFT_UPDATED',
       'DOCUMENT_UPLOADED', 'DOCUMENT_DELETED'].includes(s)) return 'text-bg-info'
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
