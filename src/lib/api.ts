export async function fetchWithAuth(url: string, init: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(init.headers as any),
  };

  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(url, { ...init, headers });

  // Try parse JSON safely
  const text = await res.text();
  let json: any = null;
  try { json = text ? JSON.parse(text) : null; } catch {}

  if (res.status === 401 || res.status === 403) {
    throw new Error('Unauthorized');
  }

  if (!res.ok) {
    throw new Error(json?.message || 'Request failed');
  }

  return json;
}