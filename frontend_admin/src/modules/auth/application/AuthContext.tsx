import {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    ReactNode,
} from 'react';
import apiClient, {
    setTokens,
    clearTokens,
    getAccessToken,
    fetchCsrfToken,
} from '@/shared/infrastructure/apiClient';
import type {
    AdminMeResponse,
    AdminPermission,
    LoginResponse,
} from '@/shared/domain/types';

interface AuthState {
    isAuthenticated: boolean;
    isLoading: boolean;
    needsMfaSetup: boolean;
    needsMfaVerify: boolean;
    user: AdminMeResponse | null;
}

interface AuthContextValue extends AuthState {
    login: (email: string, password: string) => Promise<LoginResponse>;
    logout: () => void;
    setupMfa: () => Promise<{ otpauthUrl: string; qrCodeDataUrl: string }>;
    enableMfa: (code: string) => Promise<void>;
    verifyMfa: (code: string) => Promise<void>;
    hasPermission: (p: AdminPermission) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<AuthState>({
        isAuthenticated: false,
        isLoading: true,
        needsMfaSetup: false,
        needsMfaVerify: false,
        user: null,
    });

    // Decode JWT payload without verifying signature (client-side only)
    const decodeJwt = (token: string) => {
        try {
            const payload = token.split('.')[1];
            return JSON.parse(atob(payload));
        } catch {
            return null;
        }
    };

    const fetchMe = useCallback(async () => {
        const token = getAccessToken();
        if (!token) {
            setState((s) => ({ ...s, isLoading: false }));
            return;
        }

        const payload = decodeJwt(token);
        if (!payload) {
            clearTokens();
            setState((s) => ({ ...s, isLoading: false }));
            return;
        }

        // If MFA not yet set up or not verified, go to MFA page first
        if (!payload.mfaEnabled) {
            setState({
                isAuthenticated: true,
                isLoading: false,
                needsMfaSetup: true,
                needsMfaVerify: false,
                user: null,
            });
            return;
        }

        if (!payload.mfaVerified) {
            setState({
                isAuthenticated: true,
                isLoading: false,
                needsMfaSetup: false,
                needsMfaVerify: true,
                user: null,
            });
            return;
        }

        // MFA is verified — we can call /admin/me
        try {
            const { data } =
                await apiClient.get<AdminMeResponse>('/admin/me');
            await fetchCsrfToken();
            setState({
                isAuthenticated: true,
                isLoading: false,
                needsMfaSetup: false,
                needsMfaVerify: false,
                user: data,
            });
        } catch {
            clearTokens();
            setState({
                isAuthenticated: false,
                isLoading: false,
                needsMfaSetup: false,
                needsMfaVerify: false,
                user: null,
            });
        }
    }, []);

    useEffect(() => {
        if (getAccessToken()) {
            fetchMe();
        } else {
            setState((s) => ({ ...s, isLoading: false }));
        }
    }, [fetchMe]);

    const login = useCallback(
        async (email: string, password: string) => {
            const { data } = await apiClient.post<LoginResponse>('/auth/login', {
                email,
                password,
            });
            setTokens(data.accessToken, data.refreshToken);
            await fetchMe();
            return data;
        },
        [fetchMe],
    );

    const logout = useCallback(() => {
        apiClient.post('/auth/logout').catch(() => { });
        clearTokens();
        setState({
            isAuthenticated: false,
            isLoading: false,
            needsMfaSetup: false,
            needsMfaVerify: false,
            user: null,
        });
    }, []);

    const setupMfa = useCallback(async () => {
        const { data } = await apiClient.post('/admin/auth/mfa/setup');
        return data as { otpauthUrl: string; qrCodeDataUrl: string };
    }, []);

    const enableMfa = useCallback(
        async (code: string) => {
            const { data } = await apiClient.post('/admin/auth/mfa/enable', {
                code,
            });
            setTokens(data.accessToken);
            await fetchMe();
        },
        [fetchMe],
    );

    const verifyMfa = useCallback(
        async (code: string) => {
            const { data } = await apiClient.post('/admin/auth/mfa/verify', {
                code,
            });
            setTokens(data.accessToken);
            await fetchMe();
        },
        [fetchMe],
    );

    const hasPermission = useCallback(
        (p: AdminPermission) => {
            return state.user?.permissions.includes(p) ?? false;
        },
        [state.user],
    );

    return (
        <AuthContext.Provider
            value={{
                ...state,
                login,
                logout,
                setupMfa,
                enableMfa,
                verifyMfa,
                hasPermission,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
