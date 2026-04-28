const BASE_URL = import.meta.env.VITE_API_URL ?? ''

function getToken() {
  return localStorage.getItem('cf_token')
}

export function setToken(token) {
  if (token) localStorage.setItem('cf_token', token)
  else localStorage.removeItem('cf_token')
}

export function setUser(user) {
  if (user) localStorage.setItem('cf_user', JSON.stringify(user))
  else localStorage.removeItem('cf_user')
}

export function getUser() {
  const raw = localStorage.getItem('cf_user')
  return raw ? JSON.parse(raw) : null
}

export function clearAuth() {
  localStorage.removeItem('cf_token')
  localStorage.removeItem('cf_user')
}

async function request(path, { method = 'GET', body, params, headers = {}, isForm = false, raw = false } = {}) {
  let url = `${BASE_URL}${path}`
  if (params) {
    const search = new URLSearchParams()
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') search.append(k, v)
    })
    const qs = search.toString()
    if (qs) url += `?${qs}`
  }

  const token = getToken()
  const finalHeaders = { ...headers }
  if (token) finalHeaders['Authorization'] = `Bearer ${token}`
  if (!isForm && body !== undefined) finalHeaders['Content-Type'] = 'application/json'

  const res = await fetch(url, {
    method,
    headers: finalHeaders,
    body: isForm ? body : body !== undefined ? JSON.stringify(body) : undefined,
  })

  if (raw) return res

  const contentType = res.headers.get('content-type') || ''
  let data
  if (contentType.includes('application/json')) {
    data = await res.json().catch(() => null)
  } else {
    data = await res.text().catch(() => null)
  }

  if (!res.ok) {
    const msg = (data && (data.message || data.error)) || (typeof data === 'string' && data) || `Request failed (${res.status})`
    const err = new Error(msg)
    err.status = res.status
    err.data = data
    throw err
  }

  return data
}

export const api = {
  get: (path, params, opts) => request(path, { method: 'GET', params, ...(opts || {}) }),
  post: (path, body, opts) => request(path, { method: 'POST', body, ...(opts || {}) }),
  put: (path, body, opts) => request(path, { method: 'PUT', body, ...(opts || {}) }),
  patch: (path, body, opts) => request(path, { method: 'PATCH', body, ...(opts || {}) }),
  del: (path, opts) => request(path, { method: 'DELETE', ...(opts || {}) }),
  postForm: (path, formData) => request(path, { method: 'POST', body: formData, isForm: true }),
  raw: (path, opts) => request(path, { ...(opts || {}), raw: true }),
  baseUrl: BASE_URL,
}
