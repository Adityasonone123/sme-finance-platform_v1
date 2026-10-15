import axios from 'axios';
import { HealthResponse } from '../types/api';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 5000,
});

export const checkHealth = async (): Promise<HealthResponse> => {
  const response = await apiClient.get<HealthResponse>('/api/health');
  return response.data;
};
