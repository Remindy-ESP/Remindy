import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { lightTheme, darkTheme } from '@/config/theme';

type Mode = 'light' | 'dark';

interface ThemeCtx {
    mode: Mode;
    toggle: () => void;
}

const ThemeContext = createContext<ThemeCtx>({ mode: 'dark', toggle: () => { } });

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [mode, setMode] = useState<Mode>(() => {
        const saved = localStorage.getItem('admin_theme') as Mode | null;
        if (saved) return saved;
        return window.matchMedia('(prefers-color-scheme: dark)').matches
            ? 'dark'
            : 'light';
    });

    useEffect(() => {
        localStorage.setItem('admin_theme', mode);
    }, [mode]);

    const toggle = () => setMode((m) => (m === 'light' ? 'dark' : 'light'));

    return (
        <ThemeContext.Provider value={{ mode, toggle }}>
            <MuiThemeProvider theme={mode === 'dark' ? darkTheme : lightTheme}>
                <CssBaseline />
                {children}
            </MuiThemeProvider>
        </ThemeContext.Provider>
    );
}

export function useThemeMode() {
    return useContext(ThemeContext);
}
