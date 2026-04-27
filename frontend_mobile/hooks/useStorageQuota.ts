import { useState } from 'react';
import { storageService } from '@/services/api';
import type { StorageQuota } from '@/services/api';

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
      setError(err instanceof Error ? err.message : 'Failed to load storage quota');
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
