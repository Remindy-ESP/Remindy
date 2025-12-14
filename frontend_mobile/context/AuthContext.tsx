import React, { createContext, useContext, useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { useRouter } from 'expo-router';

type AuthContextType = {
    token: string | null;
    isLoading: boolean;
    signIn: (token: string) => Promise<void>;
    signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        // Check for existing token on mount
        const bootstrapAsync = async () => {
            try {
                const storedToken = await SecureStore.getItemAsync('user_token');
                if (storedToken) {
                    setToken(storedToken);
                    // Optional: Validate token with backend here
                }
            } catch (e) {
                console.error('Restoring token failed', e);
            } finally {
                setIsLoading(false);
            }
        };

        bootstrapAsync();
    }, []);

    const signIn = async (newToken: string) => {
        try {
            await SecureStore.setItemAsync('user_token', newToken);
            setToken(newToken);
        } catch (e) {
            console.error('Saving token failed', e);
        }
    };

    const signOut = async () => {
        try {
            await SecureStore.deleteItemAsync('user_token');
            setToken(null);
            router.replace('/');
        } catch (e) {
            console.error('Deleting token failed', e);
        }
    };

    return (
        <AuthContext.Provider value={{ token, isLoading, signIn, signOut }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
