import axios from 'axios';

// Create a centralized Axios instance
const api = axios.create({
  // Switched to 8001 to resolve Port 8000 conflicts on user machine
  baseURL: 'http://127.0.0.1:8001',
  timeout: 120000,
});

// Request interceptor for JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('[API Request Error]:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for centralized error handling
api.interceptors.response.use(
  (response) => {
    console.log(`[API Success] ${response.config.method.toUpperCase()} ${response.config.url}:`, response.data);
    return response;
  },
  (error) => {
    if (error.response) {
      let message = error.response.data?.detail || error.response.data?.error || 'Server error';
      if (typeof message !== 'string') message = JSON.stringify(message);
      console.error(`[API Error ${error.response.status}]:`, message);
      return Promise.reject({ message, status: error.response.status });
    } else if (error.request) {
      console.error('[API Network Error]: No response was received. Possible causes: Backend not running, Port mismatch, or CORS block.', error.request);
      return Promise.reject({ message: 'Network error: Backend unreachable. Please check if your terminal shows uvicorn is running on port 8001.' });
    }
    return Promise.reject({ message: error.message });
  }
);

export const jobApi = {
  // GET /jobs/recent (Aggregate matches)
  getMatches: (skills) => api.get('/jobs/recent', { params: { skills } }),

  // GET /jobs/{id}
  getJobDetail: (id) => api.get(`/jobs/${id}`),

  // POST /resume/upload
  uploadResume: (file) => {
    const formData = new FormData();
    formData.append('resume_file', file); // Backend expects 'resume_file'
    return api.post('/resume/upload', formData);
  },

  // POST /cover_letter/generate
  generateCoverLetter: (file, jobDescription, targetJob, tone, wordLimit, experienceLevel, isPremium) => {
    const formData = new FormData();
    formData.append('resume_file', file);
    formData.append('job_description', jobDescription);
    formData.append('target_job', targetJob);
    formData.append('tone', tone);
    formData.append('word_limit', wordLimit);
    formData.append('experience_level', experienceLevel);
    formData.append('is_premium', isPremium);
    return api.post('/cover_letter/generate', formData);
  },

  // POST /match/detailed-insight
  getDetailedInsight: (resumeId, jobDescription) => {
    const formData = new FormData();
    formData.append('resume_id', resumeId);
    formData.append('job_description', jobDescription);
    return api.post('/match/detailed-insight', formData);
  },
};

export const authApi = {
  login: (credentials) => api.post('/login', credentials),
  signup: (userData) => api.post('/signup', userData),
};

export default api;
