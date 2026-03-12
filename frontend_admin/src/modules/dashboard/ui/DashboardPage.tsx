import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import PeopleIcon from '@mui/icons-material/People';
import SecurityIcon from '@mui/icons-material/Security';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import CloudIcon from '@mui/icons-material/Cloud';
import { useAdminUsers } from '@/modules/users/application/useAdminUsers';

function StatCard({
    title,
    value,
    icon,
    color,
}: {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    color: string;
}) {
    return (
        <Paper sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
                sx={{
                    width: 52,
                    height: 52,
                    borderRadius: 3,
                    bgcolor: color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                }}
            >
                {icon}
            </Box>
            <Box>
                <Typography variant="body2" color="text.secondary">
                    {title}
                </Typography>
                <Typography variant="h5" fontWeight={700}>
                    {value}
                </Typography>
            </Box>
        </Paper>
    );
}

export function DashboardPage() {
    const { data: usersData } = useAdminUsers({ page: 1, limit: 1 });

    return (
        <Box>
            <Typography variant="h4" sx={{ mb: 3 }}>
                Dashboard
            </Typography>

            <Grid container spacing={3}>
                <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                    <StatCard
                        title="Utilisateurs"
                        value={usersData?.total ?? '—'}
                        icon={<PeopleIcon />}
                        color="#6366f1"
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                    <StatCard
                        title="Sécurité"
                        value="—"
                        icon={<SecurityIcon />}
                        color="#10b981"
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                    <StatCard
                        title="Audit"
                        value="—"
                        icon={<ReceiptLongIcon />}
                        color="#f59e0b"
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                    <StatCard
                        title="Cloud"
                        value="—"
                        icon={<CloudIcon />}
                        color="#3b82f6"
                    />
                </Grid>
            </Grid>

            <Paper sx={{ p: 3, mt: 3 }}>
                <Typography variant="h6" gutterBottom>
                    Bienvenue dans le panel d'administration
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Utilisez la sidebar pour naviguer entre les différentes sections.
                    Les KPIs seront enrichis au fur et à mesure de l'implémentation des modules backend.
                </Typography>
            </Paper>
        </Box>
    );
}
