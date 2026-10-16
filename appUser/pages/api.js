import axios from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const configuredUrl = process.env.EXPO_PUBLIC_API_URL;
const defaultHost = Platform.OS === 'android' ? 'http://10.0.2.2:8000' : 'http://localhost:8000';
export const API_URL = `${(configuredUrl || defaultHost).replace(/\/+$/, '')}/api`;
const API_ORIGIN = API_URL.replace(/\/api$/, '');
const tokenKey = '@interiorgo/auth/token';
const sessionKey = '@interiorgo/auth/session';
const cachePrefix = '@interiorgo/cache/';
let cacheUserId = 'anonymous';
let onAuthenticationExpired;
let onCacheFallback;
let cacheFallbackNotified = false;

const client = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
  },
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401
      || (error.response?.status === 403 && error.config?.url?.endsWith('/session'))) {
      onAuthenticationExpired?.();
    }
    const validationMessage = Object.values(error.response?.data?.errors || {}).flat()[0];
    const message = validationMessage
      || error.response?.data?.message
      || (error.code === 'ECONNABORTED'
        ? 'A API demorou para responder. Tente novamente.'
        : `Falha ao conectar com a API: ${error.message}`);

    const requestError = new Error(message);
    requestError.status = error.response?.status;
    return Promise.reject(requestError);
  },
);

export function setAuthToken(token, userId) {
  cacheUserId = token ? String(userId || 'anonymous') : 'anonymous';
  if (token) {
    client.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete client.defaults.headers.common.Authorization;
  }
}

export function setAuthenticationExpiredHandler(handler) {
  onAuthenticationExpired = handler;
}

export function setCacheFallbackHandler(handler) {
  onCacheFallback = handler;
}

export function profilePhotoUrl(path) {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_ORIGIN}/storage/${path.replace(/^\/+/, '')}`;
}

export async function uploadProfilePhoto(asset) {
  const formData = new FormData();
  formData.append('foto', {
    uri: asset.uri,
    name: asset.fileName || 'foto-perfil.jpg',
    type: asset.mimeType || 'image/jpeg',
  });
  const response = await client.post('/account/photo', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  await invalidateCache();
  return response.data;
}

export async function persistSession(token, session, rememberMe) {
  setAuthToken(token, session.user?.userId);
  if (rememberMe) {
    await AsyncStorage.multiSet([
      [tokenKey, token],
      [sessionKey, JSON.stringify(session)],
    ]);
  } else {
    await AsyncStorage.multiRemove([tokenKey, sessionKey]);
  }
}

export async function updateStoredSession(session) {
  const token = await AsyncStorage.getItem(tokenKey);
  if (token) {
    await AsyncStorage.setItem(sessionKey, JSON.stringify(session));
  }
}

export async function loadRememberedSession() {
  const [[, token], [, sessionValue]] = await AsyncStorage.multiGet([tokenKey, sessionKey]);
  if (!token || !sessionValue) {
    await AsyncStorage.multiRemove([tokenKey, sessionKey]);
    return null;
  }

  let session;
  try {
    session = JSON.parse(sessionValue);
  } catch (error) {
    await clearStoredSession();
    throw new Error(`Não foi possível ler a sessão salva: ${error.message}`);
  }

  if (!session?.user?.userId) {
    await clearStoredSession();
    return null;
  }
  setAuthToken(token, session.user.userId);
  return { token, session };
}

export async function clearStoredSession() {
  const keys = await AsyncStorage.getAllKeys();
  const cachedKeys = keys.filter((key) => key.startsWith(cachePrefix));
  await AsyncStorage.multiRemove([tokenKey, sessionKey, ...cachedKeys]);
  setAuthToken(null);
}

function cacheKey(path) {
  return `${cachePrefix}${cacheUserId}/${encodeURIComponent(path)}`;
}

async function invalidateCache() {
  const keys = await AsyncStorage.getAllKeys();
  await AsyncStorage.multiRemove(keys.filter((key) => key.startsWith(`${cachePrefix}${cacheUserId}/`)));
}

export const api = {
  post: async (path, body) => {
    const response = await client.post(path, body);
    await invalidateCache();
    return { data: response.data, status: response.status };
  },
  put: async (path, body) => {
    const response = await client.put(path, body);
    await invalidateCache();
    return { data: response.data, status: response.status };
  },
  delete: async (path, body) => {
    const response = await client.delete(path, { data: body });
    await invalidateCache();
    return { data: response.data, status: response.status };
  },
  get: async (path) => {
    try {
      const response = await client.get(path);
      await AsyncStorage.setItem(cacheKey(path), JSON.stringify(response.data));
      cacheFallbackNotified = false;
      return { data: response.data, status: response.status, cached: false };
    } catch (error) {
      if (error.status === 401 || error.status === 403) throw error;
      const cachedValue = await AsyncStorage.getItem(cacheKey(path));
      if (!cachedValue) throw error;
      if (!cacheFallbackNotified) {
        cacheFallbackNotified = true;
        onCacheFallback?.();
      }
      return { data: JSON.parse(cachedValue), status: 200, cached: true };
    }
  },
};
