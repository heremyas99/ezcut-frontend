const BASE = '/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const api = {
  // Auth
  register: (body) => request('/auth.php?action=register', { method: 'POST', body }),
  login: (body) => request('/auth.php?action=login', { method: 'POST', body }),
  logout: () => request('/auth.php?action=logout', { method: 'POST' }),
  me: () => request('/auth.php?action=me'),

  // Appointments
  book: (body) => request('/appointments.php?action=book', { method: 'POST', body }),
  myAppointments: () => request('/appointments.php?action=my'),
  myHistory: () => request('/appointments.php?action=history'),
  getSlots: (branch_id, date) => request(`/appointments.php?action=slots&branch_id=${branch_id}&date=${date}`),
  barberAppointments: (date) => request(`/appointments.php?action=barber&date=${date}`),
  completeAppointment: (id) => request(`/appointments.php?action=complete&id=${id}`, { method: 'PUT' }),
  allAppointments: (params = {}) => {
    const q = new URLSearchParams({ action: 'all', ...params }).toString();
    return request(`/appointments.php?${q}`);
  },
  updateAppointment: (id, body) => request(`/appointments.php?action=update&id=${id}`, { method: 'PUT', body }),
  dashboardStats: () => request('/appointments.php?action=stats'),

  // Resources
  getServices: () => request('/resources.php?resource=services'),
  addService: (body) => request('/resources.php?resource=services', { method: 'POST', body }),
  editService: (id, body) => request(`/resources.php?resource=services&id=${id}`, { method: 'PUT', body }),
  deleteService: (id) => request(`/resources.php?resource=services&id=${id}`, { method: 'DELETE' }),

  getBarbers: (branch_id) => request(`/resources.php?resource=barbers${branch_id ? '&branch_id=' + branch_id : ''}`),
  addBarber: (body) => request('/resources.php?resource=barbers', { method: 'POST', body }),
  editBarber: (id, body) => request(`/resources.php?resource=barbers&id=${id}`, { method: 'PUT', body }),
  deleteBarber: (id) => request(`/resources.php?resource=barbers&id=${id}`, { method: 'DELETE' }),

  getBranches: () => request('/resources.php?resource=branches'),
  addBranch: (body) => request('/resources.php?resource=branches', { method: 'POST', body }),
  editBranch: (id, body) => request(`/resources.php?resource=branches&id=${id}`, { method: 'PUT', body }),

  getTimeSlots: (branch_id) => request(`/resources.php?resource=timeslots${branch_id ? '&branch_id=' + branch_id : ''}`),
  addTimeSlot: (body) => request('/resources.php?resource=timeslots', { method: 'POST', body }),
  deleteTimeSlot: (id) => request(`/resources.php?resource=timeslots&id=${id}`, { method: 'DELETE' }),

  submitFeedback: (body) => request('/resources.php?resource=feedback', { method: 'POST', body }),
  getFeedback: () => request('/resources.php?resource=feedback'),

  // Reports
  dailyReport: (date) => request(`/reports.php?type=daily&date=${date}`),
  monthlyReport: (month) => request(`/reports.php?type=monthly&month=${month}`),
};
