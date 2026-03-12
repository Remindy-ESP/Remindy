import MuiBreadcrumbs from '@mui/material/Breadcrumbs';
import MuiLink from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import { Link as RouterLink } from 'react-router-dom';

const LABELS: Record<string, string> = {
    dashboard: 'Dashboard',
    users: 'Utilisateurs',
    audit: 'Audit',
    security: 'Sécurité',
};

interface Props {
    pathname: string;
}

export function Breadcrumbs({ pathname }: Props) {
    const segments = pathname.split('/').filter(Boolean);
    if (segments.length === 0) return null;

    return (
        <MuiBreadcrumbs
            separator={<NavigateNextIcon fontSize="small" />}
            aria-label="Fil d'Ariane"
            sx={{ mb: 2 }}
        >
            <MuiLink
                component={RouterLink}
                to="/dashboard"
                underline="hover"
                color="text.secondary"
                fontSize="small"
            >
                Admin
            </MuiLink>
            {segments.map((seg, i) => {
                const path = '/' + segments.slice(0, i + 1).join('/');
                const label = LABELS[seg] || seg;
                const isLast = i === segments.length - 1;

                return isLast ? (
                    <Typography key={path} color="text.primary" fontSize="small" fontWeight={600}>
                        {label}
                    </Typography>
                ) : (
                    <MuiLink
                        key={path}
                        component={RouterLink}
                        to={path}
                        underline="hover"
                        color="text.secondary"
                        fontSize="small"
                    >
                        {label}
                    </MuiLink>
                );
            })}
        </MuiBreadcrumbs>
    );
}
