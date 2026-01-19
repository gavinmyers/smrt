export const API_BASE_URL = '/api';

export async function fetchSession() {
  const response = await fetch(`${API_BASE_URL}/session`, {
    credentials: 'include',
  });
  if (!response.ok) {
    throw new Error('Failed to fetch session');
  }
  return response.json();
}

export async function login(data: any) {
  const response = await fetch(`${API_BASE_URL}/open/user/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Login failed');
  return response.json();
}

export async function register(data: any) {
  const response = await fetch(`${API_BASE_URL}/open/user/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Registration failed');
  return response.json();
}

export async function logout() {
  await fetch(`${API_BASE_URL}/open/user/logout`, { method: 'POST' });
}

export async function fetchHealth() {
  const response = await fetch(`${API_BASE_URL}/open/status/health`);
  if (!response.ok) {
    throw new Error('Failed to fetch health');
  }
  return response.json();
}

export async function fetchProjects() {
  const response = await fetch(`${API_BASE_URL}/session/project/list`);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to fetch projects: ${response.status} ${text}`);
  }
  return response.json();
}

export async function fetchProject(id: string) {
  const response = await fetch(`${API_BASE_URL}/session/project/${id}`);
  if (!response.ok) {
    throw new Error('Failed to fetch project');
  }
  return response.json();
}

export async function createProject(name: string) {
  const response = await fetch(`${API_BASE_URL}/session/project/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  if (!response.ok) {
    throw new Error('Failed to create project');
  }
  return response.json();
}

export async function updateProject(id: string, name: string) {
  const response = await fetch(`${API_BASE_URL}/session/project/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  if (!response.ok) {
    throw new Error('Failed to update project');
  }
  return response.json();
}

export async function deleteProject(id: string) {
  const response = await fetch(`${API_BASE_URL}/session/project/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete project');
  }
}

// Conditions
export async function fetchConditions(projectId: string) {
  const response = await fetch(`${API_BASE_URL}/session/project/${projectId}/conditions`);
  if (!response.ok) {
    const text = await response.text();
    console.error(`[API] fetchConditions failed: ${response.status} ${text}`);
    throw new Error(`Failed to fetch conditions: ${response.status}`);
  }
  const data = await response.json();
  if (!Array.isArray(data)) {
    console.error('[API] fetchConditions expected array but got:', data);
    return [];
  }
  return data;
}

export async function createCondition(projectId: string, name: string) {
  const response = await fetch(`${API_BASE_URL}/session/project/${projectId}/conditions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  if (!response.ok) {
    const text = await response.text();
    console.error(`[API] createCondition failed: ${response.status} ${text}`);
    throw new Error(`Failed to create condition: ${response.status}`);
  }
  return response.json();
}

export async function updateCondition(projectId: string, id: string, name: string) {
  const response = await fetch(`${API_BASE_URL}/session/project/${projectId}/conditions/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  if (!response.ok) {
    const text = await response.text();
    console.error(`[API] updateCondition failed: ${response.status} ${text}`);
    throw new Error(`Failed to update condition: ${response.status}`);
  }
  return response.json();
}

export async function deleteCondition(projectId: string, id: string) {
  const response = await fetch(`${API_BASE_URL}/session/project/${projectId}/conditions/${id}`, { method: 'DELETE' });
  if (!response.ok) {
    const text = await response.text();
    console.error(`[API] deleteCondition failed: ${response.status} ${text}`);
    throw new Error(`Failed to delete condition: ${response.status}`);
  }
}

// Features
export async function fetchFeatures(projectId: string) {
  const response = await fetch(`${API_BASE_URL}/session/project/${projectId}/features`);
  if (!response.ok) {
    const text = await response.text();
    console.error(`[API] fetchFeatures failed: ${response.status} ${text}`);
    throw new Error(`Failed to fetch features: ${response.status}`);
  }
  const data = await response.json();
  if (!Array.isArray(data)) {
    console.error('[API] fetchFeatures expected array but got:', data);
    return [];
  }
  return data;
}

export async function createFeature(projectId: string, name: string) {
  const response = await fetch(`${API_BASE_URL}/session/project/${projectId}/features`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  if (!response.ok) {
    const text = await response.text();
    console.error(`[API] createFeature failed: ${response.status} ${text}`);
    throw new Error(`Failed to create feature: ${response.status}`);
  }
  return response.json();
}

export async function updateFeature(projectId: string, id: string, name: string) {
  const response = await fetch(`${API_BASE_URL}/session/project/${projectId}/features/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  if (!response.ok) {
    const text = await response.text();
    console.error(`[API] updateFeature failed: ${response.status} ${text}`);
    throw new Error(`Failed to update feature: ${response.status}`);
  }
  return response.json();
}

export async function deleteFeature(projectId: string, id: string) {
  const response = await fetch(`${API_BASE_URL}/session/project/${projectId}/features/${id}`, { method: 'DELETE' });
  if (!response.ok) {
    const text = await response.text();
    console.error(`[API] deleteFeature failed: ${response.status} ${text}`);
    throw new Error(`Failed to delete feature: ${response.status}`);
  }
}

// Keys
export async function fetchKeys(projectId: string) {
  const response = await fetch(`${API_BASE_URL}/session/project/${projectId}/keys`);
  if (!response.ok) {
    const text = await response.text();
    console.error(`[API] fetchKeys failed: ${response.status} ${text}`);
    throw new Error(`Failed to fetch keys: ${response.status}`);
  }
  const data = await response.json();
  if (!Array.isArray(data)) {
    console.error('[API] fetchKeys expected array but got:', data);
    return [];
  }
  return data;
}

export async function createKey(projectId: string, name: string) {
  const response = await fetch(`${API_BASE_URL}/session/project/${projectId}/keys`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  if (!response.ok) {
    const text = await response.text();
    console.error(`[API] createKey failed: ${response.status} ${text}`);
    throw new Error(`Failed to create key: ${response.status}`);
  }
  return response.json();
}

export async function deleteKey(projectId: string, id: string) {
  const response = await fetch(`${API_BASE_URL}/session/project/${projectId}/keys/${id}`, { method: 'DELETE' });
  if (!response.ok) {
    const text = await response.text();
    console.error(`[API] deleteKey failed: ${response.status} ${text}`);
    throw new Error(`Failed to delete key: ${response.status}`);
  }
}
