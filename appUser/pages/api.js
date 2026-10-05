import axios from 'axios';
import { Platform } from 'react-native';

const configuredUrl = process.env.EXPO_PUBLIC_API_URL;
const defaultHost = Platform.OS === 'android' ? 'http://10.0.2.2:8000' : 'http://localhost:8000';
export const API_URL = `${(configuredUrl || defaultHost).replace(/\/+$/, '')}/api`;

const client = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    const validationMessage = Object.values(error.response?.data?.errors || {}).flat()[0];
    const message = validationMessage
      || error.response?.data?.message
      || (error.code === 'ECONNABORTED'
        ? 'A API demorou para responder. Tente novamente.'
        : `Falha ao conectar com a API: ${error.message}`);

    return Promise.reject(new Error(message));
  },
);

export function setAuthToken(token) {
  if (token) {
    client.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete client.defaults.headers.common.Authorization;
  }
}

export const api = {
  post: async (path, body) => {
    const response = await client.post(path, body);
    return { data: response.data, status: response.status };
  },
  get: async (path) => {
    const response = await client.get(path);
    return { data: response.data, status: response.status };
  },
};
