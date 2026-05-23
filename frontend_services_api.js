// src/services/api.js
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

const api = axios.create({ baseURL: BASE_URL, timeout: 10000 });

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      SecureStore.deleteItemAsync('token');
    }
    return Promise.reject(err);
  }
);

export const AuthAPI = {
  login:    (data) => api.post('/api/auth/login', data),
  register: (data) => api.post('/api/auth/register', data),
  me:       ()     => api.get('/api/auth/me'),
};

export const AdminAPI = {
  getFamilies:         ()           => api.get('/api/admin/families'),
  createFamily:        (data)       => api.post('/api/admin/families', data),
  updateFamily:        (id, data)   => api.patch(`/api/admin/families/${id}`, data),
  deleteFamily:        (id)         => api.delete(`/api/admin/families/${id}`),
  getSuperKey:         ()           => api.get('/api/admin/super-key'),
  regenerateSuperKey:  ()           => api.post('/api/admin/super-key/regenerate'),
  regenerateFamilyKey: (id)         => api.post(`/api/admin/families/${id}/regenerate-key`),
  getUsers:            ()           => api.get('/api/admin/users'),
  removeUser:          (id)         => api.delete(`/api/admin/users/${id}`),
  getStats:            ()           => api.get('/api/admin/stats'),
};

export const DeviceAPI = {
  register:      (data) => api.post('/api/devices/register', data),
  myDevices:     ()     => api.get('/api/devices/my'),
  familyDevices: ()     => api.get('/api/devices/family'),
  remove:        (id)   => api.delete(`/api/devices/${id}`),
};

export const GateAPI = {
  trigger:     (data) => api.post('/api/gate/trigger', data),
  acknowledge: (id)   => api.post(`/api/gate/acknowledge/${id}`),
  getEvents:   ()     => api.get('/api/gate/events'),
};

export const ScheduleAPI = {
  set:          (data) => api.post('/api/schedule/', data),
  mySchedule:   ()     => api.get('/api/schedule/my'),
  familySchedule: ()   => api.get('/api/schedule/family'),
  delete:       (date) => api.delete(`/api/schedule/${date}`),
};

export const NotifAPI = {
  getAll:    ()   => api.get('/api/notifications/'),
  markRead:  (id) => api.post(`/api/notifications/${id}/read`),
  markAllRead: () => api.post('/api/notifications/read-all'),
};

export const WS_URL = BASE_URL.replace('http', 'ws') + '/api/gate/ws';

export default api;
