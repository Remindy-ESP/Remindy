import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';
import Chip from '@mui/material/Chip';
import MenuIcon from '@mui/icons-material/Menu';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import LogoutIcon from '@mui/icons-material/Logout';
import { useThemeMode } from '@/shared/application/ThemeContext';
import { useAuth } from '@/modules/auth/application/AuthContext';
import { DRAWER_WIDTH } from './Sidebar';

interface Props {
    onMenuToggle: () => void;
}

export function Topbar({ onMenuToggle }: Props) {
    const { mode, toggle } = useThemeMode();
    const { user, logout } = useAuth();

    return (
        <AppBar
            position="sticky"
            elevation={0}
            sx={{
                width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
                ml: { md: `${DRAWER_WIDTH}px` },
                bgcolor: 'background.paper',
                color: 'text.primary',
                borderBottom: '1px solid',
                borderColor: 'divider',
            }}
        >
            <Toolbar>
                <IconButton
                    edge="start"
                    aria-label="Ouvrir le menu"
                    onClick={onMenuToggle}
                    sx={{ display: { md: 'none' }, mr: 1 }}
                >
                    <MenuIcon />
                </IconButton>

                <Box sx={{ flexGrow: 1 }} />

                {user && (
                    <Chip
                        label={user.role.replace('_', ' ').toUpperCase()}
                        size="small"
                        color="primary"
                        variant="outlined"
                        sx={{ mr: 2, fontWeight: 600 }}
                    />
                )}

                <Tooltip title={mode === 'dark' ? 'Mode clair' : 'Mode sombre'}>
                    <IconButton onClick={toggle} aria-label="Basculer le thème">
                        {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
                    </IconButton>
                </Tooltip>

                <Tooltip title="Déconnexion">
                    <IconButton onClick={logout} aria-label="Se déconnecter" sx={{ ml: 1 }}>
                        <LogoutIcon />
                    </IconButton>
                </Tooltip>
            </Toolbar>
        </AppBar>
    );
}
