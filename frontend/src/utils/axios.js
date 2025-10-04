// Create or update your axios config file (e.g., src/utils/axios.js or src/config/axios.js)

import axios from 'axios';

// Create axios instance with base URL
const axiosInstance = axios.create({
  baseURL: 'http://localhost:3000', // Change this to your backend port
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // if you're using cookies
});

// Add request interceptor if you need to add auth tokens
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default axiosInstance;