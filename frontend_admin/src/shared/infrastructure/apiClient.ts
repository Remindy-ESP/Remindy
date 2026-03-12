import axios, { InternalAxiosRequestConfig, AxiosError } from 'axios';
import { API_BASE_URL } from '@/config/env';

const TOKEN_KEY = 'admin_access_token';
const REFRESH_KEY = 'admin_refresh_token';

export function getAccessToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
}

export function setTokens(access: string, refresh?: string) {
    localStorage.setItem(TOKEN_KEY, access);
    if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
}

export function clearTokens() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
}

let csrfToken: string | null = null;

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
    headers: { 'Content-Type': 'application/json' },
});

// --- Request interceptor: attach JWT + CSRF ---
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const token = getAccessToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    if (
        csrfToken &&
        config.method &&
        ['post', 'put', 'patch', 'delete'].includes(config.method)
    ) {
        config.headers['x-csrf-token'] = csrfToken;
    }
    return config;
});

// --- Response interceptor: handle 401 refresh, 403 ---
let isRefreshing = false;
let failQueue: Array<{
    resolve: (token: string) => void;
    reject: (err: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null) {
    failQueue.forEach((p) => {
        if (token) p.resolve(token);
        else p.reject(error);
    });
    failQueue = [];
}

apiClient.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & {
            _retry?: boolean;
        };

        if (error.response?.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failQueue.push({
                        resolve: (token: string) => {
                            originalRequest.headers.Authorization = `Bearer ${token}`;
                            resolve(apiClient(originalRequest));
                        },
                        reject,
                    });
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const refreshToken = localStorage.getItem(REFRESH_KEY);
                const { data } = await axios.post(
                    `${API_BASE_URL}/auth/refresh-token`,
                    { refreshToken },
                    { withCredentials: true, baseURL: API_BASE_URL },
                );
                setTokens(data.accessToken, data.refreshToken);
                processQueue(null, data.accessToken);
                originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
                return apiClient(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError, null);
                clearTokens();
                window.location.href = '/login';
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        if (error.response?.status === 403) {
            // Permission denied — could redirect or show toast
        }

        return Promise.reject(error);
    },
);

// --- CSRF helper ---
export async function fetchCsrfToken(): Promise<string> {
    const { data } = await apiClient.get('/admin/auth/csrf');
    csrfToken = data.csrfToken;
    return data.csrfToken;
}

export default apiClient;
