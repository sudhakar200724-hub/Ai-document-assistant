import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getHealth = () => api.get('/health');
export const getSystemStatus = () => api.get('/settings/status');
export const updateSettings = (data) => api.post('/settings/update', data);

// Documents
export const getDocuments = () => api.get('/documents');
export const getDocument = (id) => api.get(`/documents/${id}`);
export const getDocumentChunks = (id) => api.get(`/documents/${id}/chunks`);
export const uploadDocument = (formData) => api.post('/documents/upload', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
export const createRawDocument = (data) => api.post('/documents/raw', data);
export const deleteDocument = (id) => api.delete(`/documents/${id}`);

// Summaries
export const generateSummary = (data) => api.post('/summary/generate', data);
export const getDocumentSummaries = (docId) => api.get(`/summary/document/${docId}`);

// Explain, Paraphrase, Translate
export const explainConcept = (data) => api.post('/explain', data);
export const paraphraseText = (data) => api.post('/paraphrase', data);
export const translateText = (data) => api.post('/translate', data);

// Chat
export const askDocument = (data) => api.post('/chat', data);
export const getChatHistory = (docId, sessionId = 'default') => api.get(`/chat/history/${docId}?session_id=${sessionId}`);
export const clearChatHistory = (docId, sessionId = 'default') => api.delete(`/chat/history/${docId}?session_id=${sessionId}`);

// Study Mode
export const generateStudyMaterial = (data) => api.post('/study/generate', data);
export const submitQuiz = (data) => api.post('/study/quiz/submit', data);
export const getQuizHistory = (docId) => api.get(`/study/quiz/history/${docId}`);

// Research Mode
export const getResearchAnalysis = (docId) => api.get(`/research/${docId}`);

// Compare
export const compareDocuments = (data) => api.post('/compare', data);

// Concept Map
export const getConceptMap = (docId) => api.get(`/concept-map/${docId}`);

// Export
export const exportContent = async (title, content, format, docTitle) => {
  const response = await api.post('/export', {
    title,
    content,
    export_format: format,
    document_title: docTitle
  }, { responseType: 'blob' });
  
  const blob = new Blob([response.data], {
    type: format === 'pdf' ? 'application/pdf' :
          format === 'docx' ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' :
          format === 'md' ? 'text/markdown' : 'text/plain'
  });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${title.toLowerCase().replace(/\s+/g, '_')}.${format}`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
};

// History & Stats
export const getDashboardStats = () => api.get('/history/dashboard-stats');
export const getFullHistory = () => api.get('/history/all');

export default api;
