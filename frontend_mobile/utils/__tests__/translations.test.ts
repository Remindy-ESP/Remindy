import {
  translateEventStatus,
  translatePaymentStatus,
  getEventStatusColor,
  getPaymentStatusColor,
} from '../translations';

describe('translations utility', () => {
  describe('translateEventStatus', () => {
    it('should translate scheduled to Planifié', () => {
      expect(translateEventStatus('scheduled')).toBe('Planifié');
    });

    it('should translate completed to Terminé', () => {
      expect(translateEventStatus('completed')).toBe('Terminé');
    });

    it('should translate canceled to Annulé', () => {
      expect(translateEventStatus('canceled')).toBe('Annulé');
    });

    it('should translate cancelled to Annulé', () => {
      expect(translateEventStatus('cancelled')).toBe('Annulé');
    });

    it('should translate failed to Échoué', () => {
      expect(translateEventStatus('failed')).toBe('Échoué');
    });

    it('should translate PENDING to En attente', () => {
      expect(translateEventStatus('PENDING')).toBe('En attente');
    });

    it('should translate COMPLETED to Terminé', () => {
      expect(translateEventStatus('COMPLETED')).toBe('Terminé');
    });

    it('should translate RESCHEDULED to Reprogrammé', () => {
      expect(translateEventStatus('RESCHEDULED')).toBe('Reprogrammé');
    });

    it('should return original status for unknown status', () => {
      expect(translateEventStatus('unknown')).toBe('unknown');
    });
  });

  describe('translatePaymentStatus', () => {
    it('should translate pending to En attente', () => {
      expect(translatePaymentStatus('pending')).toBe('En attente');
    });

    it('should translate paid to Payé', () => {
      expect(translatePaymentStatus('paid')).toBe('Payé');
    });

    it('should translate failed to Échoué', () => {
      expect(translatePaymentStatus('failed')).toBe('Échoué');
    });

    it('should return original status for unknown status', () => {
      expect(translatePaymentStatus('unknown')).toBe('unknown');
    });
  });

  describe('getEventStatusColor', () => {
    it('should return yellow for scheduled', () => {
      expect(getEventStatusColor('scheduled')).toBe('#fbbf24');
    });

    it('should return green for completed', () => {
      expect(getEventStatusColor('completed')).toBe('#4ade80');
    });

    it('should return gray for canceled', () => {
      expect(getEventStatusColor('canceled')).toBe('#9ca3af');
    });

    it('should return gray for cancelled', () => {
      expect(getEventStatusColor('cancelled')).toBe('#9ca3af');
    });

    it('should return red for failed', () => {
      expect(getEventStatusColor('failed')).toBe('#f87171');
    });

    it('should return yellow for PENDING', () => {
      expect(getEventStatusColor('PENDING')).toBe('#fbbf24');
    });

    it('should return green for COMPLETED', () => {
      expect(getEventStatusColor('COMPLETED')).toBe('#4ade80');
    });

    it('should return blue for RESCHEDULED', () => {
      expect(getEventStatusColor('RESCHEDULED')).toBe('#60a5fa');
    });

    it('should return gray for unknown status', () => {
      expect(getEventStatusColor('unknown')).toBe('#9ca3af');
    });
  });

  describe('getPaymentStatusColor', () => {
    it('should return yellow for pending', () => {
      expect(getPaymentStatusColor('pending')).toBe('#fbbf24');
    });

    it('should return green for paid', () => {
      expect(getPaymentStatusColor('paid')).toBe('#4ade80');
    });

    it('should return red for failed', () => {
      expect(getPaymentStatusColor('failed')).toBe('#f87171');
    });

    it('should return gray for unknown status', () => {
      expect(getPaymentStatusColor('unknown')).toBe('#9ca3af');
    });
  });

  describe('edge cases', () => {
    it('should handle empty string', () => {
      expect(translateEventStatus('')).toBe('');
      expect(translatePaymentStatus('')).toBe('');
      expect(getEventStatusColor('')).toBe('#9ca3af');
      expect(getPaymentStatusColor('')).toBe('#9ca3af');
    });

    it('should handle case sensitivity', () => {
      expect(translateEventStatus('SCHEDULED')).toBe('SCHEDULED');
      expect(translateEventStatus('Scheduled')).toBe('Scheduled');
    });

    it('should handle special characters', () => {
      expect(translateEventStatus('status-with-dash')).toBe('status-with-dash');
      expect(getEventStatusColor('status_with_underscore')).toBe('#9ca3af');
    });
  });
});
