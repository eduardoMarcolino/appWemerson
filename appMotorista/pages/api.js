import axios from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const configuredUrl = process.env.EXPO_PUBLIC_API_URL;
const defaultHost = Platform.OS === 'android' ? 'http://10.0.2.2:8000' : 'http://localhost:8000';
export const API_URL = `${(configuredUrl || defaultHost).replace(/\/+$/, '')}/api`;
const API_ORIGIN = API_URL.replace(/\/api$/, '');
const tokenKey = '@interiorgo/auth/token';
const sessionKey = '@interiorgo/auth/session';
const expiresAtKey = '@interiorgo/auth/expires-at';
const cachePrefix = '@interiorgo/cache/';
let cacheUserId = 'anonymous';
let onAuthenticationExpired;
let onCacheFallback;
let cacheFallbackNotified = false;
let tokenExpiresAt = null;
let refreshInProgress = null;

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
    if ((error.response?.status === 401 && error.config?.headers?.Authorization)
      || (error.response?.status === 403 && error.config?.url?.endsWith('/session'))) {
      onAuthenticationExpired?.();
    }
    const status = error.response?.status;
    const validationMessage = status === 422
      ? Object.values(error.response?.data?.errors || {}).flat()[0]
      : null;
    const message = validationMessage
      || (status >= 500
        ? 'Ocorreu um erro no servidor. Tente novamente mais tarde.'
        : error.response?.data?.message
          || (error.code === 'ECONNABORTED'
            ? 'A API demorou para responder. Tente novamente.'
            : 'Não foi possível conectar à API. Verifique sua conexão e tente novamente.'));

    const requestError = new Error(message);
    requestError.status = status;
    return Promise.reject(requestError);
  },
);

export function setAuthToken(token, userId, expiresAt = null) {
  cacheUserId = token ? String(userId || 'anonymous') : 'anonymous';
  tokenExpiresAt = token ? expiresAt : null;
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
  await ensureFreshToken();
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

export async function persistSession(token, session, rememberMe, expiresAt = null) {
  setAuthToken(token, session.user?.userId, expiresAt);
  if (rememberMe) {
    await AsyncStorage.multiSet([
      [tokenKey, token],
      [sessionKey, JSON.stringify(session)],
      [expiresAtKey, expiresAt || ''],
    ]);
  } else {
    await AsyncStorage.multiRemove([tokenKey, sessionKey, expiresAtKey]);
  }
}

export async function updateStoredSession(session) {
  const token = await AsyncStorage.getItem(tokenKey);
  if (token) {
    await AsyncStorage.setItem(sessionKey, JSON.stringify(session));
  }
}

export async function loadRememberedSession() {
  const [[, token], [, sessionValue], [, expiresAt]] = await AsyncStorage.multiGet([tokenKey, sessionKey, expiresAtKey]);
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
  setAuthToken(token, session.user.userId, expiresAt || null);
  return { token, session, expiresAt: expiresAt || null };
}

export async function clearStoredSession() {
  const keys = await AsyncStorage.getAllKeys();
  const cachedKeys = keys.filter((key) => key.startsWith(cachePrefix));
  await AsyncStorage.multiRemove([tokenKey, sessionKey, expiresAtKey, ...cachedKeys]);
  setAuthToken(null);
}

async function ensureFreshToken() {
  if (!client.defaults.headers.common.Authorization) return;
  const expiresSoon = !tokenExpiresAt || new Date(tokenExpiresAt).getTime() <= Date.now() + 5 * 60 * 1000;
  if (!expiresSoon) return;
  if (!refreshInProgress) {
    refreshInProgress = client.post('/auth/refresh', {}).then(async ({ data }) => {
      const userId = cacheUserId;
      setAuthToken(data.token, userId, data.expires_at);
      const storedToken = await AsyncStorage.getItem(tokenKey);
      if (storedToken) {
        await AsyncStorage.multiSet([[tokenKey, data.token], [expiresAtKey, data.expires_at || '']]);
      }
    }).finally(() => {
      refreshInProgress = null;
    });
  }
  await refreshInProgress;
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
    await ensureFreshToken();
    const response = await client.post(path, body);
    await invalidateCache();
    return { data: response.data, status: response.status };
  },
  put: async (path, body) => {
    await ensureFreshToken();
    const response = await client.put(path, body);
    await invalidateCache();
    return { data: response.data, status: response.status };
  },
  delete: async (path, body) => {
    await ensureFreshToken();
    const response = await client.delete(path, { data: body });
    await invalidateCache();
    return { data: response.data, status: response.status };
  },
  get: async (path) => {
    try {
      await ensureFreshToken();
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
  getLive: async (path) => {
    await ensureFreshToken();
    const response = await client.get(path);
    return { data: response.data, status: response.status };
  },
};
