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

export const NOTIF_CATEGORY = ['CASE_UPDATE', 'DEADLINE', 'HEARING', 'DECISION', 'APPEAL', 'SYSTEM', 'AUDIT', 'SLA_WARNING', 'SLA_BREACH']
export const NOTIF_STATUS = ['READ', 'UNREAD']

export const REPORT_SCOPE = ['SYSTEM', 'ADMIN', 'CLERK', 'LAWYER', 'CASE']

export const CASE_TYPES = ['civil', 'criminal', 'corporate']
export const LIFECYCLE_MODES = ['auto', 'manual']

export function statusBadgeClass(status) {
  if (!status) return 'badge-default'
  const s = String(status).toUpperCase()
  if (['ACTIVE', 'VERIFIED', 'PASS', 'COMPLETED', 'DECIDED', 'CLOSED', 'READ', 'DECISION_ISSUED', 'UPHELD'].includes(s)) return 'badge-success'
  if (['WARNING', 'PENDING', 'UNDER_REVIEW', 'NEEDS_REVIEW', 'SCHEDULED', 'HEARING_SCHEDULED', 'FILED', 'UNREAD', 'RESCHEDULED'].includes(s)) return 'badge-warning'
  if (['BREACHED', 'REJECTED', 'FAIL', 'CANCELLED', 'SUSPENDED', 'INACTIVE', 'REVERSED', 'APPEALED'].includes(s)) return 'badge-danger'
  if (['OPEN', 'MODIFIED', 'SENT_BACK'].includes(s)) return 'badge-info'
  return 'badge-default'
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
