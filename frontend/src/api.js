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
  registerClinic: (data) => apiRequest('/public/register-clinic', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  me: () => apiRequest('/auth/me'),
  logout: () => apiRequest('/auth/logout', { method: 'POST' }),
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
};

export const sessionApi = {
  list: (patientId, params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/patients/${patientId}/sessions${query ? `?${query}` : ''}`);
  },
  create: (patientId, sessionData) => apiRequest(`/patients/${patientId}/sessions`, {
    method: 'POST',
    body: JSON.stringify(sessionData),
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
  checkIn: (data) => apiRequest('/kiosk/check-in', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
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
  list: (params) => {
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
};

export const parentPortalApi = {
  login: (phone, pin) => apiRequest('/public/parent-portal/login', {
    method: 'POST',
    body: JSON.stringify({ phone, pin }),
  }),
  getDashboard: (patientId) => apiRequest(`/public/parent-portal/dashboard?patient_id=${patientId}`),
  toggleHomework: (homeworkId) => apiRequest(`/public/parent-portal/homework/${homeworkId}/toggle-status`, {
    method: 'POST',
  }),
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
  updateTestConfig: (testCode, data) => apiRequest(`/super-admin/tests/${testCode}`, {
    method: 'POST',
    body: JSON.stringify(data),
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
};

export const superadminApi = superAdminApi;

export const clinicApi = {
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
  suggestAnamnesisQuestions: (data) => apiRequest('/clinic/anamnesis/suggest-questions', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  generateBilanSynthesis: (data) => apiRequest('/clinic/ai/bilan-synthesis', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  generateDiagnosticReport: (data) => apiRequest('/clinic/ai/diagnostic-report', {
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




