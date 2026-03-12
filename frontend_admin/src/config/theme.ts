import { createTheme, ThemeOptions } from '@mui/material/styles';

const shared: ThemeOptions = {
    typography: {
        fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
        h4: { fontWeight: 700 },
        h5: { fontWeight: 600 },
        h6: { fontWeight: 600 },
    },
    shape: { borderRadius: 10 },
    components: {
        MuiButton: {
            defaultProps: { disableElevation: true },
            styleOverrides: {
                root: { textTransform: 'none', fontWeight: 600 },
            },
        },
        MuiPaper: {
            defaultProps: { elevation: 0 },
            styleOverrides: {
                root: { backgroundImage: 'none' },
            },
        },
    },
};

export const lightTheme = createTheme({
    ...shared,
    palette: {
        mode: 'light',
        primary: { main: '#6366f1' },
        secondary: { main: '#8b5cf6' },
        background: { default: '#f5f5f9', paper: '#ffffff' },
        error: { main: '#ef4444' },
        warning: { main: '#f59e0b' },
        success: { main: '#10b981' },
        info: { main: '#3b82f6' },
    },
});

export const darkTheme = createTheme({
    ...shared,
    palette: {
        mode: 'dark',
        primary: { main: '#818cf8' },
        secondary: { main: '#a78bfa' },
        background: { default: '#0f1117', paper: '#1a1d2e' },
        error: { main: '#f87171' },
        warning: { main: '#fbbf24' },
        success: { main: '#34d399' },
        info: { main: '#60a5fa' },
    },
});
