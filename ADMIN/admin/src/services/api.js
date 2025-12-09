const API_BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:8081'

function authHeaders() {
  const token = localStorage.getItem('admin_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export async function getJSON(path) {
  const res = await fetch(`${API_BASE}${path}`, { headers: { ...authHeaders() } })
  return res.json()
}
export async function postJSON(path, data) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type':'application/json', ...authHeaders() },
    body: JSON.stringify(data)
  })
  return res.json()
}
export async function putJSON(path, data) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'PUT',
    headers: { 'Content-Type':'application/json', ...authHeaders() },
    body: JSON.stringify(data)
  })
  return res.json()
}
export async function del(path) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'DELETE',
    headers: { ...authHeaders() }
  })
  return res.json()
}
export async function uploadJSONFile(path, file) {
  const fd = new FormData()
  fd.append('file', file)
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    body: fd,
    headers: { ...authHeaders() } // don't set Content-Type
  })
  return res.json()
}
