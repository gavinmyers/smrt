export const API_BASE_URL = '/api';

export async function fetchSession() {
  const response = await fetch(`${API_BASE_URL}/session`, {
    credentials: 'include', // Important for sending cookies
  });
  if (!response.ok) {
    throw new Error('Failed to fetch session');
  }
  return response.json();
}

export async function fetchHealth() {
  const response = await fetch(`${API_BASE_URL}/health`);
  if (!response.ok) {
    throw new Error('Failed to fetch health');
  }
  return response.json();
}
