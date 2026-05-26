import { useSearchParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import { SecurityLogsTab } from './SecurityLogsTab';
import { SuspiciousEventsTab } from './SuspiciousEventsTab';
import { BlockedIpsTab } from './BlockedIpsTab';

type SecurityTab = 'logs' | 'suspicious' | 'blocked-ips' | 'policy';

const TABS: { value: SecurityTab; label: string }[] = [
  { value: 'logs', label: 'Logs' },
  { value: 'suspicious', label: 'Événements suspects' },
  { value: 'blocked-ips', label: 'IPs bloquées' },
  { value: 'policy', label: 'Politique' },
];

const DEFAULT_TAB: SecurityTab = 'logs';

function isSecurityTab(value: string | null): value is SecurityTab {
  return TABS.some(t => t.value === value);
}

function Placeholder({ label }: { label: string }) {
  return (
    <Box
      sx={{
        p: 4,
        border: '1px dashed',
        borderColor: 'divider',
        borderRadius: 2,
        color: 'text.secondary',
      }}
    >
      {label} — à implémenter
    </Box>
  );
}

export function SecurityPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawTab = searchParams.get('tab');
  const activeTab: SecurityTab = isSecurityTab(rawTab) ? rawTab : DEFAULT_TAB;

  const handleChange = (_: unknown, next: SecurityTab) => {
    const params = new URLSearchParams(searchParams);
    params.set('tab', next);
    setSearchParams(params, { replace: true });
  };

  return (
    <Box>
      <Typography variant='h4' sx={{ mb: 3 }}>
        Sécurité
      </Typography>

      <Tabs
        value={activeTab}
        onChange={handleChange}
        aria-label='Onglets sécurité'
        sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
      >
        {TABS.map(t => (
          <Tab key={t.value} value={t.value} label={t.label} />
        ))}
      </Tabs>

      {activeTab === 'logs' && <SecurityLogsTab />}
      {activeTab === 'suspicious' && <SuspiciousEventsTab />}
      {activeTab === 'blocked-ips' && <BlockedIpsTab />}
      {activeTab === 'policy' && <Placeholder label='Politique' />}
    </Box>
  );
}
