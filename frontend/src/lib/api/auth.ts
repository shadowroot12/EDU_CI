export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export async function login(username: string, password: string) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  if (!res.ok) {
    throw new Error('Échec de la connexion');
  }

  return res.json();
}

export async function register(userData: any) {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || 'Échec de l\'inscription');
  }

  return res.json();
}

export function setToken(token: string) {
  localStorage.setItem('edu_token', token);
}

export function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('edu_token');
}

export function removeToken() {
  localStorage.removeItem('edu_token');
}

export async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (res.status === 401) {
    // Token expiré ou invalide
    removeToken();
    window.location.href = '/login';
    throw new Error('Non autorisé');
  }

  return res;
}
