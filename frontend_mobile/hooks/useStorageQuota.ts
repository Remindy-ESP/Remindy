import { useState } from 'react';
import { storageService } from '@/services/api';
import type { StorageQuota } from '@/services/api';
import i18n from '@/i18n';

export function useStorageQuota() {
  const [quota, setQuota] = useState<StorageQuota | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchQuota = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await storageService.getQuota();
      setQuota(data);
    } catch (err) {
      console.error('Error fetching storage quota:', err);
      setError(err instanceof Error ? err.message : i18n.t('errors.storageQuotaLoadFailed'));
    } finally {
      setLoading(false);
    }
  };

  return {
    quota,
    loading,
    error,
    fetchQuota,
  };
}
