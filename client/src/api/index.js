import api from './axios';

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  resetPassword: (token, data) => api.post(`/auth/reset-password/${token}`, data),
};

export const institutionAPI = {
  getMine: () => api.get('/institutions/mine'),
  update: (data) => api.put('/institutions/mine', data),
  getDepartments: () => api.get('/institutions/departments'),
  createDepartment: (data) => api.post('/institutions/departments', data),
  updateDepartment: (id, data) => api.put(`/institutions/departments/${id}`, data),
  deleteDepartment: (id) => api.delete(`/institutions/departments/${id}`),
  getClasses: () => api.get('/institutions/classes'),
  createClass: (data) => api.post('/institutions/classes', data),
  updateClass: (id, data) => api.put(`/institutions/classes/${id}`, data),
  deleteClass: (id) => api.delete(`/institutions/classes/${id}`),
  getMembers: (params) => api.get('/institutions/members', { params }),
  addMember: (data) => api.post('/institutions/members', data),
  updateMember: (id, data) => api.put(`/institutions/members/${id}`, data),
  removeMember: (id) => api.delete(`/institutions/members/${id}`),
};

export const questionAPI = {
  getAll: (params) => api.get('/questions', { params }),
  getOne: (id) => api.get(`/questions/${id}`),
  create: (data) => api.post('/questions', data),
  update: (id, data) => api.put(`/questions/${id}`, data),
  delete: (id) => api.delete(`/questions/${id}`),
  bulkImport: (data) => api.post('/questions/bulk-import', data),
  getCollections: () => api.get('/questions/collections/list'),
  createCollection: (data) => api.post('/questions/collections', data),
  updateCollection: (id, data) => api.put(`/questions/collections/${id}`, data),
  addToCollection: (id, data) => api.post(`/questions/collections/${id}/add`, data),
  deleteCollection: (id) => api.delete(`/questions/collections/${id}`),
};

export const resourceAPI = {
  getAll: (params) => api.get('/resources', { params }),
  getOne: (id) => api.get(`/resources/${id}`),
  upload: (formData) => api.post('/resources', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id, data) => api.put(`/resources/${id}`, data),
  delete: (id) => api.delete(`/resources/${id}`),
};

export const examAPI = {
  getAll: (params) => api.get('/exams', { params }),
  getOne: (id) => api.get(`/exams/${id}`),
  create: (data) => api.post('/exams', data),
  createFromAi: (data) => api.post('/exams/from-ai', data),
  saveAiDraft: (data) => api.post('/exams/save-ai-draft', data),
  update: (id, data) => api.put(`/exams/${id}`, data),
  delete: (id) => api.delete(`/exams/${id}`),
  addSection: (id, data) => api.post(`/exams/${id}/sections`, data),
  addQuestions: (id, data) => api.post(`/exams/${id}/questions`, data),
  publish: (id) => api.post(`/exams/${id}/publish`),
  updateStatus: (id, data) => api.put(`/exams/${id}/status`, data),
  getHealth: (id) => api.get(`/exams/${id}/health`),
  getByCode: (code) => api.get(`/exams/code/${code}`),
};

export const attemptAPI = {
  start: (data) => api.post('/attempts/start', data),
  save: (attemptId, data) => api.put(`/attempts/${attemptId}/save`, data),
  submit: (attemptId) => api.post(`/attempts/${attemptId}/submit`),
  executeCode: (attemptId, data) => api.post(`/attempts/${attemptId}/execute`, data),
  getMine: () => api.get('/attempts/mine'),
  getOne: (attemptId) => api.get(`/attempts/${attemptId}`),
  getExamAttempts: (examId) => api.get(`/attempts/exam/${examId}`),
  getFeedback: (attemptId) => api.post(`/attempts/${attemptId}/feedback`),
};

export const evaluationAPI = {
  getQueue: () => api.get('/evaluations/queue'),
  evaluate: (attemptId, data) => api.post(`/evaluations/${attemptId}`, data),
  getOne: (attemptId) => api.get(`/evaluations/${attemptId}`),
  publishResults: (examId) => api.post(`/evaluations/publish/${examId}`),
};

export const aiAPI = {
  generateExam: (data) => api.post('/ai/generate-exam', data),
  chatExam: (data) => api.post('/ai/chat-exam', data),
  extractSyllabusText: (file) => {
    const form = new FormData();
    form.append('file', file);
    return api.post('/ai/extract-text', form, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  generateQuestions: (data) => api.post('/ai/generate-questions', data),
  generateBlueprint: (data) => api.post('/ai/generate-blueprint', data),
  copilotChat: (data) => api.post('/ai/copilot', data),
  checkQuality: (data) => api.post('/ai/quality-check', data),
  generateRubric: (data) => api.post('/ai/generate-rubric', data),
  getHistory: (params) => api.get('/ai/history', { params }),
  getConversations: () => api.get('/ai/conversations'),
};

export const analyticsAPI = {
  getDashboard: () => api.get('/analytics/dashboard'),
  getInstitution: () => api.get('/analytics/institution'),
  getExam: (examId) => api.get(`/analytics/exam/${examId}`),
  getQuestions: (examId) => api.get(`/analytics/questions/${examId}`),
};

export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  getInstitutions: (params) => api.get('/admin/institutions', { params }),
  getUsers: (params) => api.get('/admin/users', { params }),
  getFeatureFlags: () => api.get('/admin/feature-flags'),
  updateFeatureFlag: (key, data) => api.put(`/admin/feature-flags/${key}`, data),
  getQuotas: () => api.get('/admin/quotas'),
  updateQuota: (instId, data) => api.put(`/admin/quotas/${instId}`, data),
  getAuditLogs: (params) => api.get('/admin/audit-logs', { params }),
};

export const searchAPI = {
  search: (q) => api.get('/search', { params: { q } }),
};

export const examPreviewAPI = {
  getPublicPreview: (examId) => api.get(`/exams/preview/${examId}`),
};

export const shareLinkAPI = {
  create: (data) => api.post('/share-links', data),
  getForExam: (examId) => api.get(`/share-links?examId=${examId}`),
  update: (slug, data) => api.put(`/share-links/${slug}`, data),
  delete: (slug) => api.delete(`/share-links/${slug}`),
  resolve: (slug) => api.get(`/share-links/resolve/${slug}`),
  join: (slug, data) => api.post(`/share-links/resolve/${slug}/join`, data),
  analytics: (slug) => api.get(`/share-links/${slug}/analytics`),
};

export const classroomAPI = {
  getAll: () => api.get('/institutions/classrooms'),
  getOne: (id) => api.get(`/institutions/classrooms/${id}`),
  create: (data) => api.post('/institutions/classrooms', data),
  update: (id, data) => api.put(`/institutions/classrooms/${id}`, data),
  join: (data) => api.post('/institutions/classrooms/join', data),
  resolveInvite: (slug) => api.get(`/institutions/classrooms/invite/${slug}`),
  addAnnouncement: (id, data) => api.post(`/institutions/classrooms/${id}/announcements`, data),
  removeStudent: (classId, studentId) => api.delete(`/institutions/classrooms/${classId}/students/${studentId}`),
};

export const scheduleAPI = {
  getAll: (params) => api.get('/schedules', { params }),
  getCalendar: (month) => api.get(`/schedules/calendar?month=${month}`),
  getUpcoming: () => api.get('/schedules/upcoming'),
  create: (data) => api.post('/schedules', data),
  update: (id, data) => api.put(`/schedules/${id}`, data),
};
