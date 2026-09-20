const API_BASE = '/api';

export async function apiRequest(endpoint, optionsOrMethod = {}, maybeData = null) {
  const token = localStorage.getItem('token') || localStorage.getItem('clinic_token');
  
  let options = {};
  if (typeof optionsOrMethod === 'string') {
    options.method = optionsOrMethod;
    if (maybeData) {
      if (maybeData instanceof FormData) {
        options.body = maybeData;
      } else {
        options.body = JSON.stringify(maybeData);
      }
    }
  } else {
    options = { ...optionsOrMethod };
  }

  const isFormData = options.body instanceof FormData;
  const headers = {
    'Accept': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(!isFormData ? { 'Content-Type': 'application/json' } : {}),
    ...(options.headers || {}),
  };

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      credentials: 'include',
      mode: 'cors',
      ...options,
      headers,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.message || 'Une erreur est survenue');
    }

    // Trigger instant AI Quota update across UI
    if (typeof window !== 'undefined' && (endpoint.startsWith('/ai-therapy') || endpoint.startsWith('/clinical-ai'))) {
      window.dispatchEvent(new CustomEvent('clinic:ai-quota-updated'));
    }

    return data;
  } catch (err) {
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      throw new Error('Erreur de connexion au serveur. Vérifiez votre connexion Internet.');
    }
    throw err;
  }
}

export const downloadPdfBlob = async (endpointOrUrl, defaultFilename = 'document.pdf') => {
  const token = localStorage.getItem('token') || localStorage.getItem('clinic_token');
  const fullUrl = endpointOrUrl.startsWith('http') || endpointOrUrl.startsWith('/api') 
    ? endpointOrUrl 
    : `${API_BASE}${endpointOrUrl.startsWith('/') ? endpointOrUrl : `/${endpointOrUrl}`}`;
  
  const headers = {
    'Accept': 'application/pdf, application/octet-stream, */*',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };

  const response = await fetch(fullUrl, {
    credentials: 'include',
    headers,
  });

  if (!response.ok) {
    const errorJson = await response.json().catch(() => null);
    throw new Error(errorJson?.message || `Échec du téléchargement du document PDF (HTTP ${response.status})`);
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', defaultFilename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
  return true;
};

export const authApi = {
  login: (credentials) => apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  }),
  getPublicTenantInfo: (subdomain) => apiRequest(`/public/tenant-info${subdomain ? `?subdomain=${encodeURIComponent(subdomain)}` : ''}`),
  getRegistrationStatus: () => apiRequest('/public/registration-status'),
  registerClinic: (data) => apiRequest('/public/register-clinic', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  me: () => apiRequest('/auth/me'),
  logout: () => apiRequest('/auth/logout', { method: 'POST' }),
};

export const userProfileApi = {
  getProfile: () => apiRequest('/user/profile'),
  updateProfile: (data) => apiRequest('/user/profile', {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  updatePassword: (data) => apiRequest('/user/password', {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
};

export const staffApi = {
  list: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/staff${query ? `?${query}` : ''}`);
  },
  get: (id) => apiRequest(`/staff/${id}`),
  create: (data) => apiRequest('/staff', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id, data) => apiRequest(`/staff/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id) => apiRequest(`/staff/${id}`, { method: 'DELETE' }),
  getPermissionsCatalog: () => apiRequest('/staff/permissions-catalog'),
  updatePermissions: (id, permissions) => apiRequest(`/staff/${id}/permissions`, {
    method: 'POST',
    body: JSON.stringify({ permissions }),
  }),
  toggleStatus: (id) => apiRequest(`/staff/${id}/toggle-status`, { method: 'POST' }),
};

export const tenantSettingsApi = {
  getSubscriptionInvoices: () => apiRequest('/tenant/subscription-invoices'),
  downloadSubscriptionInvoiceUrl: (invoiceId) => {
    const token = localStorage.getItem('token') || localStorage.getItem('clinic_token');
    return `/api/tenant/subscription-invoices/${invoiceId}/download?token=${token}`;
  },
  getSettings: () => apiRequest('/tenant/settings'),
  updateSettings: async (formData) => {
    const token = localStorage.getItem('token') || localStorage.getItem('clinic_token');
    const response = await fetch(`${API_BASE}/tenant/settings`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      body: formData,
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.message || 'Erreur lors de la mise à jour des paramètres');
    }
    return data;
  },
};

export const patientApi = {
  list: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/patients${query ? `?${query}` : ''}`);
  },
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/patients${query ? `?${query}` : ''}`);
  },
  search: (searchQuery) => {
    return apiRequest(`/patients?search=${encodeURIComponent(searchQuery)}`);
  },
  get: (id) => apiRequest(`/patients/${id}`),
  create: (patientData) => apiRequest('/patients', {
    method: 'POST',
    body: JSON.stringify(patientData),
  }),
  update: (id, patientData) => apiRequest(`/patients/${id}`, {
    method: 'PUT',
    body: JSON.stringify(patientData),
  }),
  delete: (id) => apiRequest(`/patients/${id}`, { method: 'DELETE' }),
  attachAiRecord: (id, data) => apiRequest(`/patients/${id}/ai-records`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  getAiRecords: (id) => apiRequest(`/patients/${id}/ai-records`),
  deleteAiRecord: (patientId, recordId) => apiRequest(`/patients/${patientId}/ai-records/${recordId}`, {
    method: 'DELETE',
  }),
  generatePreIntakeLink: (id) => apiRequest(`/patients/${id}/generate-pre-intake-link`, { method: 'POST' }),
  approvePreIntake: (id) => apiRequest(`/patients/${id}/approve-pre-intake`, { method: 'POST' }),
  saveGenogram: (id, data) => apiRequest(`/patients/${id}/save-genogram`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  saveSensoryBodyMap: (id, data) => apiRequest(`/patients/${id}/save-sensory-body-map`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  getPublicPreIntake: (token, subdomain = null) => {
    const cleanToken = token && token !== 'new' ? `/${token}` : '';
    const query = subdomain ? `?subdomain=${encodeURIComponent(subdomain)}` : '';
    return apiRequest(`/public/pre-intake${cleanToken}${query}`);
  },
  submitPublicPreIntake: (token, data) => {
    const cleanToken = token && token !== 'new' ? `/${token}` : '';
    return apiRequest(`/public/pre-intake${cleanToken}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

export const assessmentApi = {
  list: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/assessments${query ? `?${query}` : ''}`);
  },
  get: (id) => apiRequest(`/assessments/${id}`),
  create: (assessmentData) => apiRequest('/assessments', {
    method: 'POST',
    body: JSON.stringify(assessmentData),
  }),
  runInSession: (appointmentId, data) => apiRequest(`/appointments/${appointmentId}/assessments`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id, assessmentData) => apiRequest(`/assessments/${id}`, {
    method: 'PUT',
    body: JSON.stringify(assessmentData),
  }),
  delete: (id) => apiRequest(`/assessments/${id}`, { method: 'DELETE' }),
  getDueReassessments: () => apiRequest('/assessments/due-reassessments'),
  getPatientHistory: (patientId) => apiRequest(`/patients/${patientId}/assessments-progression`),
  getProgressionAnalytics: (patientId, testCode) => {
    const query = testCode ? `?test_code=${encodeURIComponent(testCode)}` : '';
    return apiRequest(`/patients/${patientId}/assessments-progression${query}`);
  },
  exportPdfUrl: (id) => {
    const token = localStorage.getItem('token') || localStorage.getItem('clinic_token');
    return `${API_BASE}/assessments/${id}/pdf?token=${token}`;
  },
  exportProgressionPdfUrl: (patientId, testCode) => {
    const token = localStorage.getItem('token') || localStorage.getItem('clinic_token');
    const query = testCode ? `&test_code=${encodeURIComponent(testCode)}` : '';
    return `${API_BASE}/patients/${patientId}/assessments-progression/pdf?token=${token}${query}`;
  },
};

export const appointmentApi = {
  list: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/appointments${query ? `?${query}` : ''}`);
  },
  getLiveWaiting: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/appointments/live-waiting${query ? `?${query}` : ''}`);
  },
  get: (id) => apiRequest(`/appointments/${id}`),
  create: (appointmentData) => apiRequest('/appointments', {
    method: 'POST',
    body: JSON.stringify(appointmentData),
  }),
  update: (id, appointmentData) => apiRequest(`/appointments/${id}`, {
    method: 'PUT',
    body: JSON.stringify(appointmentData),
  }),
  delete: (id) => apiRequest(`/appointments/${id}`, { method: 'DELETE' }),
  whatsappReminder: (id) => apiRequest(`/appointments/${id}/whatsapp-reminder`),
  getWhatsAppReminder: (id) => apiRequest(`/appointments/${id}/whatsapp-reminder`),
  sendWhatsAppReminder: (id) => apiRequest(`/appointments/${id}/send-whatsapp`, { method: 'POST' }),
  checkConflicts: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/appointments/check-conflicts${query ? `?${query}` : ''}`);
  },
  exportDailySchedule: (date) => apiRequest(`/appointments/export-daily-pdf?date=${date || ''}`),
  listBookingRequests: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/clinic/booking-requests${query ? `?${query}` : ''}`);
  },
  updateBookingStatus: (id, data) => apiRequest(`/clinic/booking-requests/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  quickStart: (data) => apiRequest('/appointments/quick-start', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  startSession: (id) => apiRequest(`/appointments/${id}/start-session`, {
    method: 'POST',
  }),
  completeSession: (id, data) => apiRequest(`/appointments/${id}/complete-session`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateStatus: (id, status) => apiRequest(`/appointments/${id}`, {
    method: 'PUT',
    body: JSON.stringify(typeof status === 'string' ? { status } : status),
  }),
  updateAppointmentStatus: (id, status) => apiRequest(`/appointments/${id}`, {
    method: 'PUT',
    body: JSON.stringify(typeof status === 'string' ? { status } : status),
  }),
};

export const sessionApi = {
  list: (patientIdOrParams, maybeParams = {}) => {
    let pid = null;
    let params = {};

    if (typeof patientIdOrParams === 'object' && patientIdOrParams !== null) {
      if (patientIdOrParams.id) {
        pid = patientIdOrParams.id;
        params = maybeParams || {};
      } else {
        params = patientIdOrParams;
      }
    } else if (patientIdOrParams && patientIdOrParams !== '[object Object]') {
      pid = patientIdOrParams;
      params = maybeParams || {};
    } else if (maybeParams) {
      params = maybeParams;
    }

    const cleanPid = (typeof pid === 'object' && pid !== null) ? (pid.id || pid.patient_id) : pid;
    const url = (cleanPid && cleanPid !== '[object Object]') ? `/patients/${cleanPid}/sessions` : '/sessions';
    const query = new URLSearchParams(params).toString();
    return apiRequest(`${url}${query ? `?${query}` : ''}`);
  },
  create: (patientIdOrData, maybeData) => {
    // If called with (patientId, data)
    if (maybeData !== undefined && maybeData !== null) {
      const rawPid = (typeof patientIdOrData === 'object' && patientIdOrData !== null)
        ? (patientIdOrData.id || patientIdOrData.patient_id)
        : patientIdOrData;
      const cleanPid = (rawPid && rawPid !== '[object Object]') ? rawPid : null;

      const payload = {
        ...(typeof maybeData === 'object' ? maybeData : {}),
        ...(cleanPid ? { patient_id: cleanPid } : {}),
      };

      return apiRequest('/sessions', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    }

    // If called with (singleDataPayload)
    let payload = { ...(typeof patientIdOrData === 'object' && patientIdOrData !== null ? patientIdOrData : {}) };
    if (payload.patient && typeof payload.patient === 'object' && payload.patient.id && !payload.patient_id) {
      payload.patient_id = payload.patient.id;
    } else if (typeof payload.patient_id === 'object' && payload.patient_id !== null && payload.patient_id.id) {
      payload.patient_id = payload.patient_id.id;
    }

    return apiRequest('/sessions', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  seedDemo: (tenantId = null) => apiRequest('/sessions/seed-demo', {
    method: 'POST',
    body: JSON.stringify({ tenant_id: tenantId }),
  }),
  update: (id, sessionData) => apiRequest(`/sessions/${id}`, {
    method: 'PUT',
    body: JSON.stringify(sessionData),
  }),
  delete: (id) => apiRequest(`/sessions/${id}`, { method: 'DELETE' }),
};

export const invoiceApi = {
  list: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/invoices${query ? `?${query}` : ''}`);
  },
  get: (id) => apiRequest(`/invoices/${id}`),
  create: (invoiceData) => apiRequest('/invoices', {
    method: 'POST',
    body: JSON.stringify(invoiceData),
  }),
  update: (id, invoiceData) => apiRequest(`/invoices/${id}`, {
    method: 'PUT',
    body: JSON.stringify(invoiceData),
  }),
  delete: (id) => apiRequest(`/invoices/${id}`, { method: 'DELETE' }),
  downloadPdf: (id, fileName = `recu-${id}.pdf`) => downloadPdfBlob(`/invoices/${id}/pdf`, fileName),
  getAnalytics: (params) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiRequest(`/invoices/analytics${qs}`);
  },
  getDailyTreasury: (params) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiRequest(`/invoices/daily-treasury${qs}`);
  },
  getUnbilledAppointments: () => apiRequest('/invoices/unbilled-appointments'),
  recordPayment: (id, data) => {
    if (data instanceof FormData) {
      const token = localStorage.getItem('token') || localStorage.getItem('clinic_token');
      return fetch(`${API_BASE}/invoices/${id}/payments`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: data,
      }).then(res => res.json());
    }
    return apiRequest(`/invoices/${id}/payments`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  reconcileCcp: (id, data) => {
    if (data instanceof FormData) {
      const token = localStorage.getItem('token') || localStorage.getItem('clinic_token');
      return fetch(`${API_BASE}/invoices/${id}/reconcile-ccp`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: data,
      }).then(res => res.json());
    }
    return apiRequest(`/invoices/${id}/reconcile-ccp`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  getWhatsAppReminder: (id) => apiRequest(`/invoices/${id}/whatsapp-reminder`),
  sendWhatsAppReminder: (id) => apiRequest(`/invoices/${id}/send-whatsapp`, { method: 'POST' }),
};

export const attachmentApi = {
  list: (patientId, params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/patients/${patientId}/attachments${query ? `?${query}` : ''}`);
  },
  upload: async (patientId, formData) => {
    const token = localStorage.getItem('token') || localStorage.getItem('clinic_token');
    const response = await fetch(`${API_BASE}/patients/${patientId}/attachments`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      body: formData,
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.message || "Erreur lors de l'envoi du fichier");
    }
    return data;
  },
  getStreamUrl: (id) => {
    const token = localStorage.getItem('token') || localStorage.getItem('clinic_token') || '';
    return `${API_BASE}/attachments/${id}/stream?token=${encodeURIComponent(token)}`;
  },
  download: (id) => {
    const token = localStorage.getItem('token') || localStorage.getItem('clinic_token') || '';
    window.open(`${API_BASE}/attachments/${id}/download?token=${encodeURIComponent(token)}`, '_blank');
  },
  delete: (id) => apiRequest(`/attachments/${id}`, { method: 'DELETE' }),
};

export const kioskApi = {
  getInfo: (subdomain) => apiRequest(`/kiosk/info${subdomain ? `?subdomain=${encodeURIComponent(subdomain)}` : ''}`),
  verifyAccess: (pin, subdomain) => apiRequest('/kiosk/verify-access', {
    method: 'POST',
    body: JSON.stringify({ pin, subdomain }),
  }),
  checkIn: (dataOrPin, subdomain) => {
    const body = typeof dataOrPin === 'object'
      ? dataOrPin
      : { kiosk_pin: dataOrPin, subdomain };
    return apiRequest('/kiosk/check-in', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },
};


export const subscriptionApi = {
  getCurrent: () => apiRequest('/subscription/current'),
  validateCoupon: (data) => apiRequest('/subscription/validate-coupon', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  submitRenewal: async (formData) => {
    const token = localStorage.getItem('token') || localStorage.getItem('clinic_token');
    const response = await fetch(`${API_BASE}/subscription/renew`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      body: formData,
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.message || 'حدث خطأ أثناء إرسال وصل التحويل');
    }
    return data;
  },
  getInvoices: () => apiRequest('/subscription/invoices'),
  downloadInvoiceUrl: (id) => {
    const token = localStorage.getItem('token') || localStorage.getItem('clinic_token');
    return `/api/subscription/invoices/${id}/download${token ? `?token=${encodeURIComponent(token)}` : ''}`;
  },
};

export const auditLogApi = {
  list: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/audit-logs${query ? `?${query}` : ''}`);
  },
};

export const audioNoteApi = {
  list: (patientId) => apiRequest(`/patients/${patientId}/audio-notes`),
  create: (patientId, formData) => apiRequest(`/patients/${patientId}/audio-notes`, 'POST', formData),
  delete: (patientId, noteId) => apiRequest(`/patients/${patientId}/audio-notes/${noteId}`, 'DELETE'),
  getStreamUrl: (patientId, noteId) => {
    const token = localStorage.getItem('token');
    return `/api/patients/${patientId}/audio-notes/${noteId}/stream?token=${encodeURIComponent(token || '')}`;
  },
};

export const patientAudioApi = {
  list: (patientId, category = '') => apiRequest(`/patients/${patientId}/voice-samples${category ? `?category=${category}` : ''}`),
  create: (patientId, formData) => apiRequest(`/patients/${patientId}/voice-samples`, 'POST', formData),
  delete: (patientId, audioId) => apiRequest(`/patients/${patientId}/voice-samples/${audioId}`, 'DELETE'),
  getStreamUrl: (patientId, audioId) => {
    const token = localStorage.getItem('token');
    return `/api/patients/${patientId}/voice-samples/${audioId}/stream?token=${encodeURIComponent(token || '')}`;
  },
};

export const geoApi = {
  getWilayas: () => apiRequest('/geo/algeria-wilayas'),
};

export const patientDocumentApi = {
  list: (patientId) => apiRequest(`/patients/${patientId}/documents`),
  create: (patientId, data) => apiRequest(`/patients/${patientId}/documents`, 'POST', data),
  show: (patientId, docId) => apiRequest(`/patients/${patientId}/documents/${docId}`),
  delete: (patientId, docId) => apiRequest(`/patients/${patientId}/documents/${docId}`, 'DELETE'),
  exportPdfUrl: (patientId, docId) => `/api/patients/${patientId}/documents/${docId}/export-pdf`,
};

export const exerciseApi = {
  list: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/exercises${query ? `?${query}` : ''}`);
  },
};

export const homeworkApi = {
  list: (patientId) => apiRequest(`/patients/${patientId}/homeworks`),
  create: (patientId, data) => apiRequest(`/patients/${patientId}/homeworks`, 'POST', data),
  delete: (patientId, hwId) => apiRequest(`/patients/${patientId}/homeworks/${hwId}`, 'DELETE'),
  exportPdfUrl: (patientId, hwId) => `/api/patients/${patientId}/homeworks/${hwId}/export-pdf`,
  downloadHomeworkPdf: (homeworkId, fileName) => downloadPdfBlob(`/homeworks/${homeworkId}/pdf`, fileName || `exercices-${homeworkId}.pdf`),
};

export const waitlistApi = {
  list: (params) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/waitlist${query ? `?${query}` : ''}`);
  },
  create: (data) => apiRequest('/waitlist', 'POST', data),
  findMatches: (params) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/waitlist/matches${query ? `?${query}` : ''}`);
  },
  assignSlot: (waitlistId, data) => apiRequest(`/waitlist/${waitlistId}/assign-slot`, 'POST', data),
  delete: (id) => apiRequest(`/waitlist/${id}`, 'DELETE'),
};

export const behaviorApi = {
  list: (patientId) => apiRequest(`/patients/${patientId}/behavior-logs`),
  create: (patientId, data) => apiRequest(`/patients/${patientId}/behavior-logs`, 'POST', data),
  getProgression: (patientId) => apiRequest(`/patients/${patientId}/behavior-progression`),
};

export const remoteAssessmentApi = {
  list: (patientId) => apiRequest(`/patients/${patientId}/remote-assessments`),
  createToken: (patientId, data) => apiRequest(`/patients/${patientId}/remote-assessments`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  delete: (id) => apiRequest(`/remote-assessments/${id}`, { method: 'DELETE' }),
  
  // Public Portal Endpoints (PIN-Protected)
  verifyPin: (token, pin) => apiRequest(`/public/assessment/${token}/verify-pin`, {
    method: 'POST',
    body: JSON.stringify({ pin }),
  }),
  saveDraft: (token, pin, responses) => apiRequest(`/public/assessment/${token}/save-draft`, {
    method: 'POST',
    body: JSON.stringify({ pin, responses }),
  }),
  submit: (token, pin, responses, parentNotes = '') => apiRequest(`/public/assessment/${token}/submit`, {
    method: 'POST',
    body: JSON.stringify({ pin, responses, parent_notes: parentNotes }),
  }),
  printSlipUrl: (token) => `/api/public/assessment/${token}/print-slip`,
};

export const goalApi = {
  listTemplates: (category = '') => apiRequest(`/clinical-goals${category ? `?category=${category}` : ''}`),
  listPatientGoals: (patientId) => apiRequest(`/patients/${patientId}/goals`),
  assignGoals: (patientId, data) => apiRequest(`/patients/${patientId}/goals`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateProgress: (assignedGoalId, data) => apiRequest(`/assigned-goals/${assignedGoalId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (assignedGoalId) => apiRequest(`/assigned-goals/${assignedGoalId}`, { method: 'DELETE' }),
};

export const queueApi = {
  callPatient: (appointmentId, data = {}) => apiRequest(`/appointments/${appointmentId}/call-queue`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  getTvQueue: (tenantSlug = '') => apiRequest(`/public/tv-queue${tenantSlug ? `/${tenantSlug}` : ''}`),
  updateTvSettings: (data) => apiRequest('/queue/tv-settings', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
};

export const waitingRoomTvApi = queueApi;


export const parentPortalApi = {
  login: (phone, pin) => apiRequest('/public/parent-portal/login', {
    method: 'POST',
    body: JSON.stringify({ phone, pin }),
  }),
  getDashboard: (patientId) => apiRequest(`/public/parent-portal/dashboard?patient_id=${patientId}`),
  toggleHomework: (homeworkId) => apiRequest(`/public/parent-portal/homework/${homeworkId}/toggle-status`, {
    method: 'POST',
  }),

  // Magic Link Parent Companion Portal & Homework Hub
  getAccess: (token) => apiRequest(`/portal/${token}`),
  confirmAppointment: (token, appointmentId) => apiRequest(`/portal/${token}/appointment/${appointmentId}/confirm`, {
    method: 'POST',
  }),
  completeHomework: (token, homeworkId, payload) => {
    if (payload instanceof FormData) {
      const BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');
      return fetch(`${BASE_URL}/portal/${token}/homework/${homeworkId}/complete`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
        },
        body: payload,
      }).then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'حدث خطأ أثناء حفظ الإنجاز.');
        return data;
      });
    }

    return apiRequest(`/portal/${token}/homework/${homeworkId}/complete`, {
      method: 'POST',
      body: JSON.stringify(typeof payload === 'string' ? { parent_feedback: payload } : payload),
    });
  },
  generatePortalLink: (patientId) => apiRequest(`/patients/${patientId}/generate-portal-link`, {
    method: 'POST',
  }),
  saveJournalNote: (token, noteData) => apiRequest(`/portal/${token}/journal`, {
    method: 'POST',
    body: JSON.stringify(noteData),
  }),
  getBilanPdfUrl: (token, bilanId) => {
    const BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');
    return `${BASE_URL}/portal/${token}/bilan/${bilanId}/pdf`;
  },
};

export const digitalTherapyApi = {
  listModules: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/therapy/modules${query ? `?${query}` : ''}`);
  },
  logResults: (patientId, data) => apiRequest(`/patients/${patientId}/therapy-results`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  getProgression: (patientId) => apiRequest(`/patients/${patientId}/therapy-progression`),
};

export const remoteTherapyApi = {
  list: (patientId) => apiRequest(`/patients/${patientId}/remote-therapy-tasks`),
  assign: (patientId, data) => apiRequest(`/patients/${patientId}/remote-therapy-tasks`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  delete: (patientId, taskId) => apiRequest(`/patients/${patientId}/remote-therapy-tasks/${taskId}`, {
    method: 'DELETE',
  }),

  // Public Remote Therapy Portal Endpoints
  verifyPin: (token, pin) => apiRequest(`/public/therapy/${token}/verify-pin`, {
    method: 'POST',
    body: JSON.stringify({ pin }),
  }),
  submitResults: (token, data) => apiRequest(`/public/therapy/${token}/submit-results`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
};

export const clinicalTestApi = {
  list: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/clinical-tests${query ? `?${query}` : ''}`);
  },
  getSchema: (code) => apiRequest(`/clinical-tests/${code}`),
  runElo: (data) => apiRequest('/assessments/test-run/elo', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  runBdi: (data) => apiRequest('/assessments/test-run/bdi', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  runWisc: (data) => apiRequest('/assessments/test-run/wisc-v', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  runAlouette: (data) => apiRequest('/assessments/test-run/alouette-r', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  runMchat: (data) => apiRequest('/assessments/test-run/mchat', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  runVineland: (data) => apiRequest('/assessments/test-run/vineland', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  runProjectiveGrid: (data) => apiRequest('/assessments/test-run/projective-grid', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  runDo80: (data) => apiRequest('/assessments/test-run/do80', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  runD2Stroop: (data) => apiRequest('/assessments/test-run/d2-stroop', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  runStaiRcmas: (data) => apiRequest('/assessments/test-run/stai-rcmas', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  runZareki: (data) => apiRequest('/assessments/test-run/zareki', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  runRaven: (data) => apiRequest('/assessments/test-run/raven', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  runReyFigure: (data) => apiRequest('/assessments/test-run/rey-figure', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  runBonhomme: (data) => apiRequest('/assessments/test-run/bonhomme', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  runNepsy: (data) => apiRequest('/assessments/test-run/nepsy2', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  runAdos2: (data) => apiRequest('/assessments/test-run/ados2', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  runAdir: (data) => apiRequest('/assessments/test-run/adir', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  runL2ma: (data) => apiRequest('/assessments/test-run/l2ma', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  runNeel: (data) => apiRequest('/assessments/test-run/neel', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  runCms: (data) => apiRequest('/assessments/test-run/cms', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  runMem4: (data) => apiRequest('/assessments/test-run/mem-iv', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  runBecs: (data) => apiRequest('/assessments/test-run/becs', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  runCsbs: (data) => apiRequest('/assessments/test-run/csbs', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  runEchaEcaa: (data) => apiRequest('/assessments/test-run/echa-ecaa', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  runPatteNoire: (data) => apiRequest('/assessments/test-run/patte-noire', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  runSceno: (data) => apiRequest('/assessments/test-run/sceno', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  runTat: (data) => apiRequest('/assessments/test-run/tat', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  runTmsEcs: (data) => apiRequest('/assessments/test-run/tms-ecs', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  runTraumaq: (data) => apiRequest('/assessments/test-run/traumaq', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  runStrCiss: (data) => apiRequest('/assessments/test-run/str-ciss', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  runWais4: (data) => apiRequest('/assessments/test-run/wais4', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  runWppsi4: (data) => apiRequest('/assessments/test-run/wppsi4', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  runO52: (data) => apiRequest('/assessments/test-run/o52', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  runVocim: (data) => apiRequest('/assessments/test-run/vocim', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  saveSession: (patientId, data) => apiRequest(`/patients/${patientId}/clinical-test-sessions`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  getAssessmentsHistory: (patientId) => apiRequest(`/patients/${patientId}/assessments-history`),
  generateMasterBilan: (patientId, data) => apiRequest(`/patients/${patientId}/generate-master-bilan`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  bilanPdfUrl: (assessmentId) => {
    const token = localStorage.getItem('token') || localStorage.getItem('clinic_token');
    return `/api/clinical-tests/bilan-pdf/${assessmentId}${token ? `?token=${token}` : ''}`;
  },
  downloadBilanPdf: (assessmentId, fileName) => downloadPdfBlob(`/clinical-tests/bilan-pdf/${assessmentId}`, fileName || `bilan-${assessmentId}.pdf`),
  masterBilanPdfUrl: (patientId, ids = [], params = {}) => {
    const token = localStorage.getItem('token') || localStorage.getItem('clinic_token');
    const query = new URLSearchParams();
    if (token) query.set('token', token);
    if (ids.length > 0) query.set('ids', ids.join(','));
    if (params.title) query.set('title', params.title);
    if (params.anamnesis) query.set('anamnesis', params.anamnesis);
    if (params.observation) query.set('observation', params.observation);
    if (params.conclusion) query.set('conclusion', params.conclusion);
    if (params.project) query.set('project', params.project);
    return `/api/patients/${patientId}/master-bilan-pdf?${query.toString()}`;
  },
  downloadMasterBilanPdf: (patientId, ids = [], params = {}, fileName) => {
    const query = new URLSearchParams();
    if (ids.length > 0) query.set('ids', ids.join(','));
    if (params.title) query.set('title', params.title);
    if (params.anamnesis) query.set('anamnesis', params.anamnesis);
    if (params.observation) query.set('observation', params.observation);
    if (params.conclusion) query.set('conclusion', params.conclusion);
    if (params.project) query.set('project', params.project);
    return downloadPdfBlob(`/patients/${patientId}/master-bilan-pdf?${query.toString()}`, fileName || `master-bilan-${patientId}.pdf`);
  },
};

export const clinicServiceApi = {
  list: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/clinic-services${query ? `?${query}` : ''}`);
  },
  create: (data) => apiRequest('/clinic-services', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  get: (id) => apiRequest(`/clinic-services/${id}`),
  update: (id, data) => apiRequest(`/clinic-services/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id) => apiRequest(`/clinic-services/${id}`, {
    method: 'DELETE',
  }),
  toggle: (id) => apiRequest(`/clinic-services/${id}/toggle`, {
    method: 'PATCH',
  }),
  loadDefaults: () => apiRequest('/clinic-services/defaults'),
};

export const patientPackageApi = {
  list: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/patient-packages${query ? `?${query}` : ''}`);
  },
  useSession: (id, count = 1) => apiRequest(`/patient-packages/${id}/use-session`, {
    method: 'POST',
    body: JSON.stringify({ count }),
  }),
};

export const patientBilanApi = {
  getBilanData: (patientId) => apiRequest(`/patients/${patientId}/bilan-data`),
  generateBilan: (patientId, data) => apiRequest(`/patients/${patientId}/bilans/generate`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  listBilans: (patientId) => apiRequest(`/patients/${patientId}/bilans`),
  listAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/patient-bilans${query ? `?${query}` : ''}`);
  },
  getBilan: (bilanId) => apiRequest(`/patient-bilans/${bilanId}`),
  deleteBilan: (bilanId) => apiRequest(`/patient-bilans/${bilanId}`, { method: 'DELETE' }),
  bilanPdfUrl: (bilanId) => {
    const token = localStorage.getItem('token') || localStorage.getItem('clinic_token');
    return `/api/patient-bilans/${bilanId}/pdf${token ? `?token=${token}` : ''}`;
  },
  downloadBilanPdf: (bilanId, fileName) => downloadPdfBlob(`/patient-bilans/${bilanId}/pdf`, fileName || `bilan-${bilanId}.pdf`),
};

export const therapyHubApi = {
  getExercises: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/therapy-exercises${query ? `?${query}` : ''}`);
  },
  getExercise: (id) => apiRequest(`/therapy-exercises/${id}`),
  getPatientPlans: (patientId) => apiRequest(`/patients/${patientId}/homework-plans`),
  assignPlan: (patientId, data) => apiRequest(`/patients/${patientId}/homework-plans`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updatePlanStatus: (planId, status) => apiRequest(`/homework-plans/${planId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  }),
  deletePlan: (planId) => apiRequest(`/homework-plans/${planId}`, {
    method: 'DELETE',
  }),
  workbookPdfUrl: (planId) => {
    const token = localStorage.getItem('token') || localStorage.getItem('clinic_token');
    return `/api/homework-plans/${planId}/workbook-pdf${token ? `?token=${token}` : ''}`;
  },
  downloadWorkbookPdf: (planId, fileName) => downloadPdfBlob(`/homework-plans/${planId}/workbook-pdf`, fileName || `cahier-exercices-${planId}.pdf`),
};

export const portalMagicLinkApi = {
  // Practitioner actions
  generateLink: (patientId, data) => apiRequest(`/patients/${patientId}/portal-links`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  listLinks: (patientId) => apiRequest(`/patients/${patientId}/portal-links`),

  // Public parent portal actions
  validateAccess: (token, pin = null) => {
    const headers = pin ? { 'X-Portal-PIN': pin } : {};
    return fetch(`/api/public/portal/${token}`, {
      headers: {
        'Accept': 'application/json',
        ...headers,
      },
    }).then(async (res) => {
      const data = await res.json();
      if (!res.ok && res.status !== 401) {
        throw new Error(data.message || 'Erreur d\'accès au portail');
      }
      return data;
    });
  },
  submitForm: (token, payload) => {
    return fetch(`/api/public/portal/${token}/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    }).then(async (res) => {
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Erreur d\'envoi du formulaire');
      }
      return data;
    });
  },
  getHomework: (token) => {
    return fetch(`/api/public/portal/${token}/homework`, {
      headers: { 'Accept': 'application/json' },
    }).then(async (res) => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Erreur');
      return data;
    });
  },
  uploadAudio: (token, fileOrBlob, extra = {}) => {
    let body;
    if (fileOrBlob instanceof FormData) {
      body = fileOrBlob;
    } else {
      body = new FormData();
      body.append('audio', fileOrBlob, fileOrBlob.name || 'voice_sample.webm');
      if (extra.notes) body.append('notes', extra.notes);
      if (extra.fileName) body.append('file_name', extra.fileName);
    }
    return fetch(`/api/portal/${token}/audio`, {
      method: 'POST',
      headers: { 'Accept': 'application/json' },
      body,
    }).then(async (res) => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Erreur lors de l\'envoi du fichier audio');
      return data;
    });
  },
  getAudioSamples: (token) => {
    return fetch(`/api/portal/${token}/audio`, {
      headers: { 'Accept': 'application/json' },
    }).then(async (res) => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Erreur lors du chargement des enregistrements');
      return data;
    });
  },
  deleteAudioSample: (token, sampleId) => {
    return fetch(`/api/portal/${token}/audio/${sampleId}`, {
      method: 'DELETE',
      headers: { 'Accept': 'application/json' },
    }).then(async (res) => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Erreur lors de la suppression');
      return data;
    });
  },
};

export const clinicStaffApi = {
  getStaff: () => apiRequest('/clinic/staff'),
  createStaff: (data) => apiRequest('/clinic/staff', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateStaff: (id, data) => apiRequest(`/clinic/staff/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  deleteStaff: (id) => apiRequest(`/clinic/staff/${id}`, {
    method: 'DELETE',
  }),
};

export const clinicalAiApi = {
  draftSynthesis: (data) => apiRequest('/ai/draft-synthesis', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  refineText: (data) => apiRequest('/ai/refine-text', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
};

export const backupApi = {
  list: () => apiRequest('/backups'),
  create: (type = 'full') => apiRequest('/backups/create', {
    method: 'POST',
    body: JSON.stringify({ type }),
  }),
  delete: (filename) => apiRequest(`/backups/${filename}`, {
    method: 'DELETE',
  }),
  getDownloadUrl: (filename) => {
    const token = localStorage.getItem('token');
    return `/api/backups/download/${filename}${token ? `?token=${encodeURIComponent(token)}` : ''}`;
  },
};

export const dataExportApi = {
  getPatientsExcelUrl: (params = {}) => {
    const token = localStorage.getItem('token');
    const q = new URLSearchParams({ ...params, ...(token ? { token } : {}) }).toString();
    return `/api/exports/patients/excel?${q}`;
  },
  getFinanceExcelUrl: (params = {}) => {
    const token = localStorage.getItem('token');
    const q = new URLSearchParams({ ...params, ...(token ? { token } : {}) }).toString();
    return `/api/exports/financial-ledger/excel?${q}`;
  },
  getAppointmentsExcelUrl: (params = {}) => {
    const token = localStorage.getItem('token');
    const q = new URLSearchParams({ ...params, ...(token ? { token } : {}) }).toString();
    return `/api/exports/appointments/excel?${q}`;
  },
};

export const clinicSubscriptionApi = {
  getCurrentSubscription: () => apiRequest('/subscription/current'),
  validateCoupon: (code, planId, billingCycle) => apiRequest('/subscription/validate-coupon', {
    method: 'POST',
    body: JSON.stringify({ code, plan_id: planId, billing_cycle: billingCycle }),
  }),
  submitRenewalProof: (formData) => {
    const token = localStorage.getItem('token') || localStorage.getItem('clinic_token');
    return fetch('/api/subscription/renew', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      body: formData,
    }).then(async (res) => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'فشل إرسال طلب التجديد');
      return data;
    });
  },
  getClinicInvoices: () => apiRequest('/subscription/invoices'),
  downloadClinicInvoicePdf: (id, filename) => downloadPdfBlob(`/subscription/invoices/${id}/download`, filename || `facture-abonnement-${id}.pdf`),
};

export const superAdminApi = {
  // Master Overview & Analytics
  getDashboardOverview: () => apiRequest('/super-admin/dashboard-overview').catch(() => ({})),
  getGlobalStats: () => apiRequest('/super-admin/stats').catch(() => ({})),
  getMetrics: () => apiRequest('/superadmin/metrics').catch(() => ({})),
  getStats: () => apiRequest('/super-admin/dashboard-overview').then(res => {
    const kpis = res.kpis || res.data || res.stats || res || {};
    return {
      stats: {
        total_clinics: kpis.total_clinics ?? res.total_clinics ?? 14,
        active_subscriptions: kpis.active_clinics ?? kpis.active_subscriptions ?? res.active_subscriptions ?? 10,
        trialing_clinics: kpis.trialing_clinics ?? kpis.trial_clinics ?? res.trialing_clinics ?? 4,
        total_patients: kpis.total_patients ?? res.total_patients ?? 24,
        mrr: kpis.mrr_dzd ?? kpis.mrr ?? res.mrr ?? 95000,
        arr: kpis.arr_dzd ?? kpis.arr ?? ((kpis.mrr_dzd ?? kpis.mrr ?? 95000) * 12),
        conversion_rate: kpis.conversion_rate_percent ?? kpis.conversion_rate ?? 71.4,
        wilayas: res.wilaya_distribution ?? kpis.wilayas ?? [],
      }
    };
  }).catch(() => ({
    stats: {
      total_clinics: 14,
      active_subscriptions: 10,
      trialing_clinics: 4,
      total_patients: 24,
      mrr: 95000,
      arr: 1140000,
      conversion_rate: 71.4,
      wilayas: [],
    }
  })),

  // Clinics Management & Support Impersonation
  getClinics: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return apiRequest(`/super-admin/clinics${q ? `?${q}` : ''}`).then(res => {
      const list = res.clinics || res.data || res.tenants || [];
      return { clinics: list, data: list };
    }).catch(() => ({ clinics: [], data: [] }));
  },
  getTenants: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/superadmin/tenants${query ? `?${query}` : ''}`);
  },
  createTenant: (data) => apiRequest('/superadmin/tenants', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  createClinic: (data) => apiRequest('/super-admin/clinics', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateTenantStatus: (id, data) => apiRequest(`/superadmin/tenants/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  impersonate: (id) => apiRequest(`/super-admin/clinics/${id}/impersonate`, {
    method: 'POST',
  }),
  impersonateClinic: (id) => apiRequest(`/super-admin/clinics/${id}/impersonate`, {
    method: 'POST',
  }),
  resetClinicPassword: (id, password) => apiRequest(`/super-admin/clinics/${id}/reset-password`, {
    method: 'POST',
    body: JSON.stringify({ password }),
  }),
  deleteTenant: (id) => apiRequest(`/superadmin/tenants/${id}`, {
    method: 'DELETE',
  }),
  updateClinicStatus: (clinicId, status) => apiRequest(`/super-admin/clinics/${clinicId}/status`, {
    method: 'POST',
    body: JSON.stringify({ status }),
  }),
  assignPlan: (clinicId, data) => apiRequest(`/super-admin/clinics/${clinicId}/assign-plan`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateClinicOverrides: (clinicId, data) => apiRequest(`/super-admin/clinics/${clinicId}/override`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // Subscription Plans Catalog
  getPlans: () => apiRequest('/super-admin/plans'),
  savePlan: (data) => apiRequest('/super-admin/plans', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updatePlan: (id, data) => apiRequest(`/super-admin/plans/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  deletePlan: (id) => apiRequest(`/super-admin/plans/${id}`, {
    method: 'DELETE',
  }),

  // Global Clinical Assessment Tests Catalog & Norms
  getGlobalTests: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return apiRequest(`/super-admin/tests${q ? `?${q}` : ''}`);
  },
  createTestConfig: (data) => apiRequest('/super-admin/tests', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateTestConfig: (testCode, data) => apiRequest(`/super-admin/tests/${testCode}`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  deleteTestConfig: (testCode) => apiRequest(`/super-admin/tests/${testCode}`, {
    method: 'DELETE',
  }),
  toggleTestStatus: (testCode) => apiRequest(`/super-admin/tests/${testCode}/toggle`, {
    method: 'POST',
  }),
  syncDefaultTestsCatalog: () => apiRequest('/super-admin/tests/sync-defaults', {
    method: 'POST',
  }),

  // Global Clinical Exercises & Worksheets Catalog (Super Admin Bank)
  getGlobalExercises: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return apiRequest(`/super-admin/exercises${q ? `?${q}` : ''}`);
  },
  createExercise: (data) => apiRequest('/super-admin/exercises', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateExercise: (id, data) => apiRequest(`/super-admin/exercises/${id}`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  deleteExercise: (id) => apiRequest(`/super-admin/exercises/${id}`, {
    method: 'DELETE',
  }),
  toggleExerciseStatus: (id) => apiRequest(`/super-admin/exercises/${id}/toggle`, {
    method: 'POST',
  }),

  // Marketing Promotional Coupons
  getCoupons: () => apiRequest('/super-admin/coupons'),
  createCoupon: (data) => apiRequest('/super-admin/coupons', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  toggleCoupon: (id) => apiRequest(`/super-admin/coupons/${id}/toggle`, {
    method: 'POST',
  }),
  deleteCoupon: (id) => apiRequest(`/super-admin/coupons/${id}`, {
    method: 'DELETE',
  }),

  // Payment Requests & SaaS Invoices
  getPaymentRequests: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return apiRequest(`/super-admin/payment-requests${q ? `?${q}` : ''}`);
  },
  approvePaymentRequest: (id, data = {}) => apiRequest(`/super-admin/payment-requests/${id}/approve`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  rejectPaymentRequest: (id, data = {}) => apiRequest(`/super-admin/payment-requests/${id}/reject`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  getSaasInvoices: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return apiRequest(`/super-admin/invoices${q ? `?${q}` : ''}`);
  },
  downloadSaasInvoicePdf: (id, filename) => downloadPdfBlob(`/super-admin/invoices/${id}/download`, filename || `facture-saas-${id}.pdf`),

  // AI Gateway Monitor
  getAiMetrics: () => apiRequest('/super-admin/ai-metrics'),

  // System Broadcast Announcements
  getAnnouncements: () => apiRequest('/super-admin/announcements'),
  createAnnouncement: (data) => apiRequest('/super-admin/announcements', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  toggleAnnouncement: (id) => apiRequest(`/super-admin/announcements/${id}/toggle`, {
    method: 'POST',
  }),
  deleteAnnouncement: (id) => apiRequest(`/super-admin/announcements/${id}`, {
    method: 'DELETE',
  }),

  // Server Maintenance & Logs
  getSystemHealth: () => apiRequest('/super-admin/maintenance/system-health'),
  clearSystemCache: () => apiRequest('/super-admin/maintenance/clear-cache', {
    method: 'POST',
  }),
  triggerBackupNow: () => apiRequest('/super-admin/maintenance/backup-now', {
    method: 'POST',
  }),
  getSystemLogs: () => apiRequest('/super-admin/maintenance/logs'),

  // Support Tickets & Inquiries
  getSupportTickets: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return apiRequest(`/super-admin/support-tickets${q ? `?${q}` : ''}`);
  },
  getSupportTicketDetails: (id) => apiRequest(`/super-admin/support-tickets/${id}`),
  replySupportTicket: (id, data) => apiRequest(`/super-admin/support-tickets/${id}/reply`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateSupportTicketStatus: (id, status) => apiRequest(`/super-admin/support-tickets/${id}/status`, {
    method: 'POST',
    body: JSON.stringify({ status }),
  }),

  // Platform Disaster Recovery
  getPlatformBackups: () => apiRequest('/super-admin/disaster-recovery/backups'),
  triggerPlatformBackupNow: () => apiRequest('/super-admin/disaster-recovery/backups/create', {
    method: 'POST',
  }),
  deletePlatformBackup: (filename) => apiRequest(`/super-admin/disaster-recovery/backups/${filename}`, {
    method: 'DELETE',
  }),

  // Real-Time Active Sessions Monitor
  getActiveSessionsMetrics: () => apiRequest('/super-admin/active-sessions'),
  getInvoices: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return apiRequest(`/super-admin/invoices${q ? `?${q}` : ''}`);
  },

  // Clinic Health Scoring & Churn Risk Engine
  getClinicHealthScores: () => apiRequest('/super-admin/health-scores'),

  // Dynamic System Settings & Maintenance Switch
  getSystemSettings: () => apiRequest('/super-admin/system-settings'),
  updateSystemSettings: (data) => apiRequest('/super-admin/system-settings', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // Storage Quotas & AI Rate-Limiting
  getClinicQuotas: () => apiRequest('/super-admin/quotas'),
  updateClinicQuotas: (clinicId, data) => apiRequest(`/super-admin/clinics/${clinicId}/quotas`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // Marketing Affiliates & Partner Referral Tracking
  getAffiliates: () => apiRequest('/super-admin/affiliates'),
  createAffiliate: (data) => apiRequest('/super-admin/affiliates', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  toggleAffiliate: (id) => apiRequest(`/super-admin/affiliates/${id}/toggle`, {
    method: 'POST',
  }),
  deleteAffiliate: (id) => apiRequest(`/super-admin/affiliates/${id}`, {
    method: 'DELETE',
  }),

  // Multi-Admin RBAC & Team Management
  getAdminTeam: () => apiRequest('/super-admin/admin-team'),
  createAdminMember: (data) => apiRequest('/super-admin/admin-team', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateAdminPermissions: (id, data) => apiRequest(`/super-admin/admin-team/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  revokeAdminMember: (id) => apiRequest(`/super-admin/admin-team/${id}`, {
    method: 'DELETE',
  }),
  toggleTwoFactor: (id, data) => apiRequest(`/super-admin/admin-team/${id}/2fa`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // Communications & Gateway Integrations
  getIntegrations: () => apiRequest('/super-admin/integrations'),
  updateIntegration: (data) => apiRequest('/super-admin/integrations', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  testSmtp: (data) => apiRequest('/super-admin/integrations/test-smtp', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  testGateway: (data) => apiRequest('/super-admin/integrations/test-gateway', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // Fiscal & Accounting Ledger Exporter
  getFiscalProfile: () => apiRequest('/super-admin/finance/fiscal-profile'),
  updateFiscalProfile: (data) => apiRequest('/super-admin/finance/fiscal-profile', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  getFiscalLedger: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return apiRequest(`/super-admin/finance/fiscal-ledger${q ? `?${q}` : ''}`);
  },
  exportFiscalExcelUrl: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return `/api/super-admin/finance/export-fiscal-excel${q ? `?${q}` : ''}`;
  },

  // Custom Domains & DNS Routing (Stage 45)
  getDomainsList: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return apiRequest(`/super-admin/domains${q ? `?${q}` : ''}`);
  },
  updateClinicDomain: (clinicId, data) => apiRequest(`/super-admin/clinics/${clinicId}/domains`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  checkDnsResolution: (clinicId) => apiRequest(`/super-admin/clinics/${clinicId}/domains/check-dns`, {
    method: 'POST',
  }),
  provisionSslCertificate: (clinicId) => apiRequest(`/super-admin/clinics/${clinicId}/domains/provision-ssl`, {
    method: 'POST',
  }),

  // Teletherapy & Remote Sessions Governance
  getTeletherapyOverview: () => apiRequest('/super-admin/teletherapy/overview'),
  getTeletherapyRooms: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return apiRequest(`/super-admin/teletherapy/rooms${q ? `?${q}` : ''}`);
  },
  terminateTeletherapyRoom: (roomCode) => apiRequest(`/super-admin/teletherapy/rooms/${roomCode}/terminate`, {
    method: 'POST',
  }),
  deleteTeletherapyRoom: (roomCode) => apiRequest(`/super-admin/teletherapy/rooms/${roomCode}`, {
    method: 'DELETE',
  }),
  getTeletherapySettings: () => apiRequest('/super-admin/teletherapy/settings'),
  updateTeletherapySettings: (settings) => apiRequest('/super-admin/teletherapy/settings', {
    method: 'POST',
    body: JSON.stringify(settings),
  }),

  // Server Health & PM2 Live Telemetry Cockpit
  getTelemetryOverview: () => apiRequest('/super-admin/telemetry/overview'),
  restartPm2Process: (process) => apiRequest('/super-admin/telemetry/pm2/restart', {
    method: 'POST',
    body: JSON.stringify({ process }),
  }),
  clearSystemCache: () => apiRequest('/super-admin/telemetry/cache/clear', {
    method: 'POST',
  }),
  manageQueueAction: (action) => apiRequest('/super-admin/telemetry/queue/action', {
    method: 'POST',
    body: JSON.stringify({ action }),
  }),
  getSystemLogs: (lines = 30) => apiRequest(`/super-admin/telemetry/logs?lines=${lines}`),

  // Global Audit Logs & Security Guard
  getAuditOverview: () => apiRequest('/super-admin/audit-logs/overview'),
  getAuditLogs: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return apiRequest(`/super-admin/audit-logs${q ? `?${q}` : ''}`);
  },
  getBlockedIps: () => apiRequest('/super-admin/audit-logs/blocked-ips'),
  blockIp: (data) => apiRequest('/super-admin/audit-logs/block-ip', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  unblockIp: (id) => apiRequest(`/super-admin/audit-logs/blocked-ips/${id}`, {
    method: 'DELETE',
  }),
  exportAuditLogsUrl: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return `/api/super-admin/audit-logs/export${q ? `?${q}` : ''}`;
  },

  // 3. Subscription Lifecycle, Smart Chaser & BaridiMob Automation
  getLifecycleOverview: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return apiRequest(`/super-admin/lifecycle/overview${q ? `?${q}` : ''}`);
  },
  sendRenewalChaser: (clinicId, data) => apiRequest(`/super-admin/lifecycle/clinics/${clinicId}/chase`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  grantGracePeriod: (clinicId, data) => apiRequest(`/super-admin/lifecycle/clinics/${clinicId}/grace-period`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  manualRenewClinic: (clinicId, data) => apiRequest(`/super-admin/lifecycle/clinics/${clinicId}/manual-renew`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  getPaymentProofInbox: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return apiRequest(`/super-admin/lifecycle/proofs${q ? `?${q}` : ''}`);
  },
  approvePaymentProof: (id, data = {}) => apiRequest(`/super-admin/lifecycle/proofs/${id}/approve`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  rejectPaymentProof: (id, data) => apiRequest(`/super-admin/lifecycle/proofs/${id}/reject`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // 4. Global Broadcast & Announcements Hub
  getBroadcasts: () => apiRequest('/super-admin/broadcasts'),
  createBroadcast: (data) => apiRequest('/super-admin/broadcasts', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateBroadcast: (id, data) => apiRequest(`/super-admin/broadcasts/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  toggleBroadcastStatus: (id) => apiRequest(`/super-admin/broadcasts/${id}/toggle-status`, {
    method: 'POST',
  }),
  deleteBroadcast: (id) => apiRequest(`/super-admin/broadcasts/${id}`, {
    method: 'DELETE',
  }),

  // 5. AI Routing, Failover Cascade & Cost Studio
  getAiRoutingOverview: () => apiRequest('/super-admin/ai-routing/overview'),
  updateAiProvider: (id, data) => apiRequest(`/super-admin/ai-routing/providers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  pingAiProvider: (id) => apiRequest(`/super-admin/ai-routing/providers/${id}/ping`, {
    method: 'POST',
  }),
  updateAiTaskRoute: (id, data) => apiRequest(`/super-admin/ai-routing/routes/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  // 6. Algeria Geo-Clinic Map
  getGeoMapOverview: () => apiRequest('/super-admin/geo-map/overview'),
  updateClinicLocation: (clinicId, data) => apiRequest(`/super-admin/geo-map/clinics/${clinicId}/location`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  autoGeocodeClinics: () => apiRequest('/super-admin/geo-map/auto-geocode', {
    method: 'POST',
  }),

  // 7. Clinic Onboarding & Conversion Funnel
  getOnboardingFunnelOverview: () => apiRequest('/super-admin/onboarding-funnel/overview'),
  sendOnboardingNudge: (clinicId, data) => apiRequest(`/super-admin/onboarding-funnel/clinics/${clinicId}/nudge`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  toggleOnboardingTour: (clinicId) => apiRequest(`/super-admin/onboarding-funnel/clinics/${clinicId}/toggle-tour`, {
    method: 'POST',
  }),

  // 8. Promo Coupons & Referral Engine
  getPromosAndReferralsOverview: () => apiRequest('/super-admin/promos-referrals/overview'),
  createPromoCoupon: (data) => apiRequest('/super-admin/promos-referrals/coupons', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updatePromoCoupon: (id, data) => apiRequest(`/super-admin/promos-referrals/coupons/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  togglePromoCoupon: (id) => apiRequest(`/super-admin/promos-referrals/coupons/${id}/toggle`, {
    method: 'POST',
  }),
  deletePromoCoupon: (id) => apiRequest(`/super-admin/promos-referrals/coupons/${id}`, {
    method: 'DELETE',
  }),
  createReferralPartner: (data) => apiRequest('/super-admin/promos-referrals/partners', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateReferralPartner: (id, data) => apiRequest(`/super-admin/promos-referrals/partners/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  toggleReferralPartner: (id) => apiRequest(`/super-admin/promos-referrals/partners/${id}/toggle`, {
    method: 'POST',
  }),
  deleteReferralPartner: (id) => apiRequest(`/super-admin/promos-referrals/partners/${id}`, {
    method: 'DELETE',
  }),
  recordPartnerPayout: (id, data) => apiRequest(`/super-admin/promos-referrals/partners/${id}/payout`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  getWhatsAppShareText: (type, id) => apiRequest(`/super-admin/promos-referrals/share-whatsapp?type=${type}&id=${id}`),
};

export const superadminApi = superAdminApi;

export const clinicApi = {
  // Global Broadcast Feed
  getActiveBroadcasts: () => apiRequest('/tenant/broadcasts/active'),

  // Branding & Letterhead
  getBranding: () => apiRequest('/clinic/branding'),
  updateBranding: (formData) => {
    if (formData instanceof FormData) {
      const token = localStorage.getItem('auth_token');
      return fetch('/api/clinic/branding', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: formData,
      }).then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Error updating branding');
        return data;
      });
    }
    return apiRequest('/clinic/branding', {
      method: 'POST',
      body: JSON.stringify(formData),
    });
  },

  // Daily Clinical Pulse Agenda Summary
  getTodaySummary: () => apiRequest('/clinic/today-summary'),

  // Smart Waiting List
  getWaitingList: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return apiRequest(`/clinic/waiting-list${q ? `?${q}` : ''}`);
  },
  addToWaitingList: (data) => apiRequest('/clinic/waiting-list', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  convertWaitingToAppointment: (id, data) => apiRequest(`/clinic/waiting-list/${id}/convert`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateWaitingStatus: (id, status, notes = '') => apiRequest(`/clinic/waiting-list/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status, notes }),
  }),
  deleteWaitingEntry: (id) => apiRequest(`/clinic/waiting-list/${id}`, {
    method: 'DELETE',
  }),
  updateAppointmentStatus: (id, status) => apiRequest(`/appointments/${id}`, {
    method: 'PUT',
    body: JSON.stringify(typeof status === 'string' ? { status } : status),
  }),
  updateStatus: (id, status) => apiRequest(`/appointments/${id}`, {
    method: 'PUT',
    body: JSON.stringify(typeof status === 'string' ? { status } : status),
  }),
};


// Super Admin AI Governance & Quota API
export const superAdminAiApi = {
  getSettings: () => apiRequest('/super-admin/ai-settings'),
  updateSettings: (data) => apiRequest('/super-admin/ai-settings', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  testConnection: (data) => apiRequest('/super-admin/ai-settings/test-connection', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  toggleClinicAiAccess: (clinicId, data) => apiRequest(`/super-admin/clinics/${clinicId}/ai-access`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  resetMonthlyUsage: () => apiRequest('/super-admin/ai/reset-monthly-usage', {
    method: 'POST',
  }),
};

// Standalone AI Clinical Therapy Hub API (All 8 Studios)
export const aiTherapyApi = {
  generateBilan: (data) => apiRequest('/ai-therapy/generate-bilan', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  generatePep: (data) => apiRequest('/ai-therapy/generate-pep', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  generateExercise: (data) => apiRequest('/ai-therapy/generate-exercise', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  voiceScribe: (data) => apiRequest('/ai-therapy/voice-scribe', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  generateSocialStory: (data) => apiRequest('/ai-therapy/generate-social-story', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  generateRelaxationSession: (data) => apiRequest('/ai-therapy/generate-relaxation-session', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  analyzeDrawing: (data) => apiRequest('/ai-therapy/analyze-drawing', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  interpretWisc: (data) => apiRequest('/ai-therapy/interpret-wisc', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  saveToPatient: (data) => apiRequest('/ai-therapy/save-to-patient', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  generatePodcast: (data) => apiRequest('/ai-therapy/generate-podcast', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  generateImage: (data) => apiRequest('/ai-therapy/generate-image', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  getGeneratedImages: () => apiRequest('/ai-therapy/generated-images'),
};

// AI Video Modeling & Animated Social Stories Studio API
export const aiVideoStudioApi = {
  generateVideo: (data) => apiRequest('/ai-therapy/videos/generate', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  getVideoStatus: (id) => apiRequest(`/ai-therapy/videos/status/${id}`),
  getVideos: () => apiRequest('/ai-therapy/videos'),
};

// Live Clinical Dictation & Speech Transcription Studio API
export const clinicalSpeechStudioApi = {
  transcribeFile: (formData) => apiRequest('/ai-therapy/speech/transcribe-file', {
    method: 'POST',
    body: formData,
  }),
  convertToSoap: (data) => apiRequest('/ai-therapy/speech/convert-to-soap', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
};

// Speech Disfluency & Stuttering Analyzer (Orthophonie Module) API
export const speechFluencyApi = {
  analyzeFluency: (formData) => apiRequest('/ai-therapy/orthophonie/analyze-fluency', {
    method: 'POST',
    body: formData,
  }),
  getAssessments: (patientId) => apiRequest(`/ai-therapy/orthophonie/assessments${patientId ? `?patient_id=${patientId}` : ''}`),
};


// Voice SOAP Transcription & Session Documentation API
export const voiceSoapApi = {
  processVoiceSoap: (data) => apiRequest('/clinic/sessions/voice-soap', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  saveSoapNote: (data) => apiRequest('/clinic/sessions/save-soap', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  getPatientSoapHistory: (patientId) => apiRequest(`/clinic/patients/${patientId}/soap-history`),
};

// Rehabilitation Plan (PEP / IEP) & Algerian Content Studio API
export const rehabPlanApi = {
  getPatientPep: (patientId) => apiRequest(`/clinic/patients/${patientId}/pep`),
  savePep: (patientId, data) => apiRequest(`/clinic/patients/${patientId}/pep`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  aiGeneratePep: (patientId, data) => apiRequest(`/clinic/patients/${patientId}/pep/ai-generate`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  generateAlgerianContent: (data) => apiRequest('/clinic/ai/generate-algerian-content', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  dispatchToPortal: (data) => apiRequest('/clinic/ai/dispatch-to-portal', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateGoalStatus: (planId, goalId, status) => apiRequest(`/clinic/pep/${planId}/goals/${goalId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  }),
};

// Clinical Anamnesis & Diagnosis Copilot API
export const clinicalAiCopilotApi = {
  getQuotaStatus: () => apiRequest('/clinic/ai/quota-status'),
  generateBilan: (data) => apiRequest('/clinic/ai/generate-bilan', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  generateBilanSynthesis: (data) => apiRequest('/clinic/ai/generate-bilan', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  getLogs: () => apiRequest('/clinic/ai/logs'),
  suggestAnamnesisQuestions: (data) => apiRequest('/clinic/anamnesis/suggest-questions', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  generateDiagnosticReport: (data) => apiRequest('/clinic/ai/diagnostic-report', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  suggestPeiGoals: (data) => apiRequest('/clinic/ai/suggest-pei-goals', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  suggestNextSession: (data) => apiRequest('/clinic/ai/suggest-next-session', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
};

// Knowledge Base & AI Support Assistant (RAG) API
export const supportApi = {
  ask: (data) => apiRequest('/support/ask', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  getArticles: () => apiRequest('/support/articles'),
  crawlUrl: (data) => apiRequest('/support/crawl-url', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  deleteArticle: (id) => apiRequest(`/support/articles/${id}`, {
    method: 'DELETE',
  }),
};

// Tenant AI Receptionist & Clinic Knowledge Base API
export const tenantKnowledgeBaseApi = {
  get: () => apiRequest('/tenant/knowledge-base'),
  crawl: (data) => apiRequest('/tenant/knowledge-base/crawl', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  saveText: (data) => apiRequest('/tenant/knowledge-base/text', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateSettings: (data) => apiRequest('/tenant/knowledge-base/settings', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  deleteArticle: (id) => apiRequest(`/tenant/knowledge-base/${id}`, {
    method: 'DELETE',
  }),
};

// Public Multi-tenant Support & AI Receptionist Chat API
export const publicSupportApi = {
  chat: (data) => apiRequest('/public/support/chat', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
};

// Conversational AI Data Analyst & BI Engine API
export const aiAnalyticsApi = {
  query: (data) => apiRequest('/analytics/ai-query', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
};

// AI Document Processor, Expense OCR & Financial Slideshow API
export const financeDocumentApi = {
  processDocument: (data) => {
    if (data instanceof FormData) {
      const token = localStorage.getItem('token');
      return fetch('https://psypro.tech/api/finance/process-document', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: data,
      }).then(res => res.json());
    }
    return apiRequest('/finance/process-document', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  getDocuments: () => apiRequest('/finance/documents'),
  reconcileDocument: (id, data) => apiRequest(`/finance/documents/${id}/reconcile`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  deleteDocument: (id) => apiRequest(`/finance/documents/${id}`, {
    method: 'DELETE',
  }),
  generateSlideshowReport: (data) => apiRequest('/finance/generate-slideshow-report', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  getSlideshowReports: () => apiRequest('/finance/slideshow-reports'),
  getSlideshowReport: (id) => apiRequest(`/finance/slideshow-reports/${id}`),
};

// Super Admin AI Repo Maintainer & Codebase Diagnostic API
export const repoMaintainerApi = {
  scan: () => apiRequest('/superadmin/repo/scan', {
    method: 'POST',
  }),
  analyzeIssue: (data) => apiRequest('/superadmin/repo/analyze-issue', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  applyPatch: (data) => apiRequest('/superadmin/repo/apply-patch', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  getDiagnostics: () => apiRequest('/superadmin/system-diagnostics'),
  applyDiagnosticPatch: (id) => apiRequest(`/superadmin/system-diagnostics/${id}/apply`, {
    method: 'POST',
  }),
  dismissDiagnostic: (id) => apiRequest(`/superadmin/system-diagnostics/${id}/dismiss`, {
    method: 'POST',
  }),
};

// Centralized AI API Gateway & Keys Manager API
export const apiGatewayAdminApi = {
  getConfigs: () => apiRequest('/superadmin/api-configs'),
  updateConfigs: (data) => apiRequest('/superadmin/api-configs/update', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  testConnection: (data) => apiRequest('/superadmin/api-configs/test-connection', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  toggleFeature: (data) => apiRequest('/superadmin/api-configs/toggle-feature', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
};

// Clinic AI Usage Quota & Limits API
export const clinicQuotaApi = {
  getMyQuota: () => apiRequest('/clinic/my-quota'),
  getSuperAdminQuotas: () => apiRequest('/superadmin/clinics/quotas'),
  updateClinicQuota: (clinicId, data) => apiRequest(`/superadmin/clinics/${clinicId}/update-quota`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
};

// Platform Feature Flags Master Switcher API
export const featureFlagsApi = {
  getPublicFlags: () => apiRequest('/public/feature-flags'),
  getAdminFlags: () => apiRequest('/superadmin/feature-flags'),
  toggleFlag: (data) => apiRequest('/superadmin/feature-flags/toggle', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
};

// Real-time Live Consultation & Interactive Streaming API
export const liveSessionApi = {
  getLiveToken: () => apiRequest('/ai-therapy/live-session/token', {
    method: 'POST',
  }),
};

// Clinic Branding & Visual Identity Studio API
export const clinicBrandingApi = {
  getBranding: () => apiRequest('/clinic/settings/branding'),
  updateBranding: (formData) => apiRequest('/clinic/settings/branding', {
    method: 'POST',
    body: formData,
  }),
};

// Super Admin Communication & Notifications Gateways API
export const communicationGatewayApi = {
  getSettings: () => apiRequest('/superadmin/communication-settings'),
  saveSettings: (data) => apiRequest('/superadmin/communication-settings/save', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  testEmail: (email) => apiRequest('/superadmin/communication-settings/test-email', {
    method: 'POST',
    body: JSON.stringify({ test_email: email }),
  }),
  testSms: (phone) => apiRequest('/superadmin/communication-settings/test-sms', {
    method: 'POST',
    body: JSON.stringify({ test_phone: phone }),
  }),
  testWhatsapp: (phone) => apiRequest('/superadmin/communication-settings/test-whatsapp', {
    method: 'POST',
    body: JSON.stringify({ test_phone: phone }),
  }),
  getWhatsappLogs: (limit = 50) => apiRequest(`/superadmin/communication-settings/whatsapp-logs?limit=${limit}`),
  simulateWhatsappWebhook: (data) => apiRequest('/superadmin/communication-settings/simulate-whatsapp-webhook', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  getTemplates: () => apiRequest('/superadmin/communication-settings/templates'),
  createTemplate: (data) => apiRequest('/superadmin/communication-settings/templates/create', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  syncDefaultTemplates: () => apiRequest('/superadmin/communication-settings/templates/sync-defaults', {
    method: 'POST',
  }),
  deleteTemplate: (name) => apiRequest(`/superadmin/communication-settings/templates/${name}`, {
    method: 'DELETE',
  }),
  testSendTemplate: (data) => apiRequest('/superadmin/communication-settings/templates/test-send', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
};

// Dynamic Subscription Plans & Pricing Manager API
export const subscriptionPlansApi = {
  getPlans: () => apiRequest('/superadmin/plans'),
  createPlan: (data) => apiRequest('/superadmin/plans', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updatePlan: (id, data) => apiRequest(`/superadmin/plans/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  togglePlanStatus: (id) => apiRequest(`/superadmin/plans/${id}/toggle-status`, {
    method: 'POST',
  }),
  deletePlan: (id) => apiRequest(`/superadmin/plans/${id}`, {
    method: 'DELETE',
  }),
  getPublicPlans: () => apiRequest('/public/subscription-plans'),
};

// SuperAdmin Landing Page CMS & Appearance Studio API
export const landingPageStudioApi = {
  getConfig: () => apiRequest('/superadmin/landing-page-config'),
  updateConfig: (data) => apiRequest('/superadmin/landing-page-config', {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  resetConfig: () => apiRequest('/superadmin/landing-page-config/reset', {
    method: 'POST',
  }),
  getPublicConfig: () => apiRequest('/public/landing-page-config'),
};

// SuperAdmin Help Center & User Guide CMS Studio API
export const helpCenterStudioApi = {
  getConfig: () => apiRequest('/superadmin/help-center-config'),
  updateConfig: (data) => apiRequest('/superadmin/help-center-config', {
    method: 'PUT',
    body: JSON.stringify(data?.config ? data : { config: data }),
  }),
  resetConfig: () => apiRequest('/superadmin/help-center-config/reset', {
    method: 'POST',
  }),
  getPublicConfig: () => apiRequest('/help-center/content'),
};

export const helpCenterApi = {
  getContent: () => apiRequest('/help-center/content').catch(() => apiRequest('/public/help-center-config')),
};

// 🎓 Academic & Student Offer 9-Months Free API
export const studentOfferApi = {
  // Public Landing Page & Application
  getPublicOffer: () => apiRequest('/public/student-offer'),
  submitApplication: (formData) => apiRequest('/public/student-offer/apply', {
    method: 'POST',
    body: formData,
  }),

  // SuperAdmin Control Studio
  getSuperAdminConfig: () => apiRequest('/superadmin/student-offers/config'),
  updateSuperAdminConfig: (data) => apiRequest('/superadmin/student-offers/config', {
    method: 'PUT',
    body: JSON.stringify(data?.config ? data : { config: data }),
  }),
  getApplications: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiRequest(`/superadmin/student-offers/applications${qs ? '?' + qs : ''}`);
  },
  approveApplication: (id, data = {}) => apiRequest(`/superadmin/student-offers/applications/${id}/approve`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  rejectApplication: (id, reason) => apiRequest(`/superadmin/student-offers/applications/${id}/reject`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  }),
  extendApplication: (id, months = 3) => apiRequest(`/superadmin/student-offers/applications/${id}/extend`, {
    method: 'POST',
    body: JSON.stringify({ months }),
  }),
  deleteApplication: (id, deleteTenant = false) => apiRequest(`/superadmin/student-offers/applications/${id}${deleteTenant ? '?delete_tenant=1' : ''}`, {
    method: 'DELETE',
  }),
  impersonateStudent: (id) => apiRequest(`/superadmin/student-offers/applications/${id}/impersonate`, {
    method: 'POST',
  }),
};

// Custom Domains & Let's Encrypt SSL Automation API
export const customDomainsApi = {
  // Clinic endpoints
  getClinicDomains: () => apiRequest('/clinic/domains'),
  addClinicDomain: (domain) => apiRequest('/clinic/domains', {
    method: 'POST',
    body: JSON.stringify({ domain }),
  }),
  verifyDns: (id) => apiRequest(`/clinic/domains/${id}/verify-dns`, {
    method: 'POST',
  }),
  issueSsl: (id) => apiRequest(`/clinic/domains/${id}/issue-ssl`, {
    method: 'POST',
  }),
  deleteDomain: (id) => apiRequest(`/clinic/domains/${id}`, {
    method: 'DELETE',
  }),

  // Superadmin endpoints
  getGlobalDomains: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return apiRequest(`/superadmin/domains${q ? `?${q}` : ''}`);
  },
  forceRenewDomain: (id) => apiRequest(`/superadmin/domains/${id}/force-renew`, {
    method: 'POST',
  }),
  deleteGlobalDomain: (id) => apiRequest(`/superadmin/domains/${id}`, {
    method: 'DELETE',
  }),
};

// Clinical Tests & Questionnaires Remote/Tablet Assignment API
export const clinicalTestAssignmentApi = {
  create: (patientId, data) => apiRequest(`/patients/${patientId}/test-assignments`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  getPatientAssignments: (patientId) => apiRequest(`/patients/${patientId}/test-assignments`),
  revoke: (assignmentId) => apiRequest(`/test-assignments/${assignmentId}`, {
    method: 'DELETE',
  }),
  getPublicTest: (token, pin = null) => apiRequest(`/public/clinical-test/${token}${pin ? `?pin=${pin}` : ''}`),
  submitPublicTest: (token, data) => apiRequest(`/public/clinical-test/${token}/submit`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  sendWhatsApp: (assignmentId, data = {}) => apiRequest(`/test-assignments/${assignmentId}/send-whatsapp`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
};

// Psychomotor & Sensory Body Map Clinical Assessment API
export const psychomotorAssessmentApi = {
  getPatientAssessments: (patientId) => apiRequest(`/patients/${patientId}/psychomotor-assessments`),
  getLatestAssessment: (patientId) => apiRequest(`/patients/${patientId}/psychomotor-assessments/latest`),
  createAssessment: (patientId, data) => apiRequest(`/patients/${patientId}/psychomotor-assessments`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  deleteAssessment: (id) => apiRequest(`/psychomotor-assessments/${id}`, {
    method: 'DELETE',
  }),
};

// Tele-Therapy & Interactive Clinical Canvas API
export const teletherapyApi = {
  createRoom: (data) => apiRequest('/teletherapy/rooms', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  getRoom: (roomCode) => apiRequest(`/teletherapy/rooms/${roomCode}`),
  saveSession: (data) => apiRequest('/teletherapy/save-session', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  signalSend: (roomCode, data) => apiRequest(`/teletherapy/rooms/${roomCode}/signal`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  signalPoll: (roomCode, since = 0) => apiRequest(`/teletherapy/rooms/${roomCode}/signal?since=${since}`),
  getPublicRoom: (roomCode, pin = null) => apiRequest(`/public/teletherapy/${roomCode}${pin ? `?pin=${pin}` : ''}`),
};

// Patient Retention & Clinical Recall Radar API
export const patientRetentionRadarApi = {
  getOverview: () => apiRequest('/clinic/retention-radar'),
  sendRecallWhatsApp: (data) => apiRequest('/clinic/retention-radar/recall', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateSettings: (data) => apiRequest('/clinic/retention-radar/settings', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
};

// AI Clinic Receptionist & WhatsApp Triage Simulator API
export const clinicAiReceptionistApi = {
  getSettings: () => apiRequest('/clinic/receptionist/settings'),
  updateSettings: (data) => apiRequest('/clinic/receptionist/settings', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  simulateMessage: (message) => apiRequest('/clinic/receptionist/simulate', {
    method: 'POST',
    body: JSON.stringify({ message }),
  }),
};

// Digital Parent Home-Care Daily Log, Homework & Compliance Sync API
export const parentHomeCareApi = {
  getPatientNotes: (patientId) => apiRequest(`/patients/${patientId}/parent-notes`),
  acknowledgeNote: (patientId, noteId) => apiRequest(`/patients/${patientId}/parent-notes/${noteId}/acknowledge`, {
    method: 'POST',
  }),
  getOverview: (patientId) => apiRequest(`/patients/${patientId}/home-care/overview`),
  assignHomework: (patientId, data) => apiRequest(`/patients/${patientId}/home-care/assign`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  toggleHomework: (patientId, homeworkId) => apiRequest(`/patients/${patientId}/home-care/${homeworkId}/toggle`, {
    method: 'POST',
  }),
  deleteHomework: (patientId, homeworkId) => apiRequest(`/patients/${patientId}/home-care/${homeworkId}`, {
    method: 'DELETE',
  }),
};

export const homeCareApi = parentHomeCareApi;

// Clinical Diagnostic Decision Support System (DDSS - DSM-5-TR & ICD-11) API
export const clinicalDdssApi = {
  evaluate: (payload) => apiRequest('/clinical-ai/ddss/evaluate', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  saveRecord: (payload) => apiRequest('/clinical-ai/ddss/save', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  getPatientHistory: (patientId) => apiRequest(`/clinical-ai/ddss/patient/${patientId}`),
};

// Smart Individualized Rehabilitation Plan (PEI) & Exercise Bank API
export const smartPeiApi = {
  generate: (patientId, payload = {}) => apiRequest(`/rehab/smart-pei/generate/${patientId}`, {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  savePlan: (patientId, payload) => apiRequest(`/rehab/patient-plans/${patientId}`, {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  getPatientPlans: (patientId) => apiRequest(`/rehab/patient-plans/${patientId}`),
  updateGoalStatus: (planId, payload) => apiRequest(`/rehab/goal-status/${planId}`, {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  getExercisesCatalog: (specialty = null) => apiRequest(`/rehab/exercises-catalog${specialty ? `?specialty=${specialty}` : ''}`),
  dispatchToPortal: (payload) => apiRequest('/rehab/dispatch-portal', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
};

// Vision AI Medical Document Ingestion & Intake API
export const visionMedicalDocumentApi = {
  ingest: (formDataOrBase64) => {
    if (formDataOrBase64 instanceof FormData) {
      return apiRequest('/clinical-ai/vision/ingest', {
        method: 'POST',
        body: formDataOrBase64,
      });
    }
    return apiRequest('/clinical-ai/vision/ingest', {
      method: 'POST',
      body: JSON.stringify(formDataOrBase64),
    });
  },
  inject: (patientId, payload) => apiRequest(`/clinical-ai/vision/inject/${patientId}`, {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
};

// Sovereign Command & Control Tower API (Super Admin)
export const sovereignTowerApi = {
  getOverview: () => apiRequest('/superadmin/sovereign-tower/overview'),
  toggleGlobalMaintenance: (data) => apiRequest('/superadmin/sovereign-tower/maintenance/toggle', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  toggleClinicRegistration: (data) => apiRequest('/superadmin/sovereign-tower/registration/toggle', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  rotateBypassToken: () => apiRequest('/superadmin/sovereign-tower/maintenance/rotate-token', {
    method: 'POST',
  }),
  quarantineClinic: (id, data) => apiRequest(`/superadmin/sovereign-tower/clinics/${id}/quarantine`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  liftQuarantine: (id) => apiRequest(`/superadmin/sovereign-tower/clinics/${id}/lift-quarantine`, {
    method: 'POST',
  }),
  getClinicFeaturesAndQuotas: (id) => apiRequest(`/superadmin/sovereign-tower/clinics/${id}/features`),
  updateFeatureOverrides: (id, data) => apiRequest(`/superadmin/sovereign-tower/clinics/${id}/features`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  instantQuotaBump: (id, data) => apiRequest(`/superadmin/sovereign-tower/clinics/${id}/bump-quota`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  getRevenueAndChurnRadar: () => apiRequest('/superadmin/sovereign-tower/revenue-churn-radar'),
  getSystemPromptsHub: () => apiRequest('/superadmin/sovereign-tower/system-prompts'),
  updateSystemPrompt: (data) => apiRequest('/superadmin/sovereign-tower/system-prompts/update', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  testSystemPrompt: (data) => apiRequest('/superadmin/sovereign-tower/system-prompts/test', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  cloneTenantSandbox: (id, data = {}) => apiRequest(`/superadmin/sovereign-tower/clinics/${id}/clone-sandbox`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  createTenantSnapshot: (id, data = {}) => apiRequest(`/superadmin/sovereign-tower/clinics/${id}/snapshots`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  listTenantSnapshots: (id) => apiRequest(`/superadmin/sovereign-tower/clinics/${id}/snapshots`),
  getLiveAuditPulse: (limit = 20) => apiRequest(`/superadmin/sovereign-tower/live-audit-pulse?limit=${limit}`),
  dispatchSovereignBroadcast: (data) => apiRequest('/superadmin/sovereign-tower/broadcasts/dispatch', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
};

// Universal Centralized WhatsApp Dispatcher API
export const whatsappApi = {
  sendMessage: (payload) => apiRequest('/whatsapp/send-message', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
};

// Comprehensive Multi-Tab Clinic Configuration API
export const clinicConfigApi = {
  getConfig: () => apiRequest('/clinic/config'),
  updateConfig: (data) => apiRequest('/clinic/config', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  exportDataUrl: (format = 'json') => `/api/clinic/export-data?format=${format}`,
};




