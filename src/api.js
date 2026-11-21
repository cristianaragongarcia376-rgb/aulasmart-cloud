const API_URL = (
  import.meta.env.VITE_API_URL ||
  'https://api.aulasmartcloud.tech'
).replace(/\/$/, '');

export async function apiRequest(path, options = {}) {
  const { token, ...requestOptions } = options;

  const headers = new Headers(requestOptions.headers);

  if (requestOptions.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...requestOptions,
    headers,
  });

  const data = response.status === 204
    ? null
    : await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error || `Error HTTP ${response.status}`);
  }

  return data;
}

export function login(email, password) {
  return apiRequest('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export function getCurrentUser(token) {
  return apiRequest('/api/me', { token });
}

export function getResources(resource, token) {
  const allowed = [
    'students',
    'teachers',
    'courses',
    'enrollments',
    'payments',
  ];

  if (!allowed.includes(resource)) {
    throw new Error('Recurso no permitido');
  }

  return apiRequest(`/api/${resource}`, { token });
}
export function createStudent(student, token) {
  return apiRequest('/api/students', {
    method: 'POST',
    token,
    body: JSON.stringify(student),
  });
}

// Actualizar estudiante
export function updateStudent(id, student, token) {
  return apiRequest(`/api/students/${encodeURIComponent(id)}`, {
    method: 'PUT',
    token,
    body: JSON.stringify(student),
  });
}

// Eliminar estudiante
export function deleteStudent(id, token) {
  return apiRequest(`/api/students/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    token,
  });
}
// Consultar docentes
export function getTeachers(token) {
  return getResources('teachers', token);
}

// Registrar docente
export function createTeacher(teacher, token) {
  return apiRequest('/api/teachers', {
    method: 'POST',
    token,
    body: JSON.stringify(teacher),
  });
}

// Actualizar docente
export function updateTeacher(id, teacher, token) {
  return apiRequest(`/api/teachers/${encodeURIComponent(id)}`, {
    method: 'PUT',
    token,
    body: JSON.stringify(teacher),
  });
}

// Eliminar docente
export function deleteTeacher(id, token) {
  return apiRequest(`/api/teachers/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    token,
  });
}