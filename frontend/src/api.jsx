import axios from 'axios';

// Dynamic Base URL detection
const getBaseURL = () => {
  const envURL = import.meta.env.VITE_API_BASE_URL;

  // Production me localhost env accidentally set ho jaaye to ignore karo
  if (envURL && !/^https?:\/\/(localhost|127\.0\.0\.1)/.test(envURL)) {
    return envURL;
  }

  const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  if (isLocal) return 'http://localhost:8001';

  return 'https://auto-job-agent-1.onrender.com';
};

const api = axios.create({
  baseURL: getBaseURL(),
  timeout: 120000,
});

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
    }

    if (error.request) {
      console.error('[API Network Error]: No response was received.', error.request);
      return Promise.reject({
        message: 'Network error: Backend unreachable. Check Render backend URL / Vercel env VITE_API_BASE_URL.',
      });
    }

    return Promise.reject({ message: error.message });
  }
);

export const jobApi = {
  // GET /jobs/recent?skills=&source=&location=&limit=
  getMatches: (skills = '', source = 'all', location = 'India', limit = 24) =>
    api.get('/jobs/recent', {
      params: {
        skills,
        source,
        location,
        limit,
      },
    }),

  getJobDetail: (id) => api.get(`/jobs/${id}`),

  uploadResume: (file) => {
    const formData = new FormData();
    formData.append('resume_file', file);
    return api.post('/resume/upload', formData);
  },

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
