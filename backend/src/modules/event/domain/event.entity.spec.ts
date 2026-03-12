import { Event } from './event.entity';

function makeValidProps(overrides = {}) {
  return {
    subscriptionId: 'sub-1',
    title: 'Paiement Netflix',
    amount: 9.99,
    startsAt: new Date('2025-01-01T10:00:00Z'),
    status: 'scheduled' as const,
    ...overrides,
  };
}

describe('Event domain entity', () => {
  describe('constructor & validate', () => {
    it('creates a valid event with all fields', () => {
      const e = new Event(
        makeValidProps({
          id: 'evt-1',
          eventSeriesId: 'series-1',
          endsAt: new Date('2025-01-01T11:00:00Z'),
          paymentStatus: 'pending',
          notes: '  some note  ',
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: new Date(),
        }),
      );
      expect(e.id).toBe('evt-1');
      expect(e.subscriptionId).toBe('sub-1');
      expect(e.eventSeriesId).toBe('series-1');
      expect(e.title).toBe('Paiement Netflix'); // trimmed
      expect(e.amount).toBe(9.99);
      expect(e.notes).toBe('some note'); // trimmed
      expect(e.createdAt).toBeDefined();
      expect(e.updatedAt).toBeDefined();
      expect(e.deletedAt).toBeDefined();
    });

    it('trims title and notes on construction', () => {
      const e = new Event(makeValidProps({ title: '  Title  ', notes: '  note  ' }));
      expect(e.title).toBe('Title');
      expect(e.notes).toBe('note');
    });

    it('throws when title is empty', () => {
      expect(() => new Event(makeValidProps({ title: '  ' }))).toThrow(
        'Event title cannot be empty',
      );
    });

    it('throws when title exceeds 255 characters', () => {
      expect(() => new Event(makeValidProps({ title: 'a'.repeat(256) }))).toThrow(
        'Event title cannot exceed 255 characters',
      );
    });

    it('throws when amount is zero', () => {
      expect(() => new Event(makeValidProps({ amount: 0 }))).toThrow(
        'Event amount must be positive',
      );
    });

    it('throws when amount is negative', () => {
      expect(() => new Event(makeValidProps({ amount: -5 }))).toThrow(
        'Event amount must be positive',
      );
    });

    it('throws when status is invalid', () => {
      expect(() => new Event(makeValidProps({ status: 'unknown' as any }))).toThrow(
        'Invalid event status',
      );
    });

    it('throws when paymentStatus is invalid', () => {
      expect(
        () => new Event(makeValidProps({ paymentStatus: 'invalid' as any })),
      ).toThrow('Invalid payment status');
    });

    it('throws when endsAt is before startsAt', () => {
      expect(
        () =>
          new Event(
            makeValidProps({
              startsAt: new Date('2025-01-02'),
              endsAt: new Date('2025-01-01'),
            }),
          ),
      ).toThrow('End date must be after start date');
    });

    it('accepts all valid statuses', () => {
      for (const status of ['scheduled', 'completed', 'canceled', 'failed'] as const) {
        expect(() => new Event(makeValidProps({ status }))).not.toThrow();
      }
    });

    it('accepts all valid paymentStatuses', () => {
      for (const paymentStatus of ['pending', 'paid', 'failed'] as const) {
        expect(() => new Event(makeValidProps({ paymentStatus }))).not.toThrow();
      }
    });

    it('optional fields are undefined when not set', () => {
      const e = new Event(makeValidProps());
      expect(e.id).toBeUndefined();
      expect(e.eventSeriesId).toBeUndefined();
      expect(e.endsAt).toBeUndefined();
      expect(e.paymentStatus).toBeUndefined();
      expect(e.notes).toBeUndefined();
      expect(e.createdAt).toBeUndefined();
      expect(e.updatedAt).toBeUndefined();
      expect(e.deletedAt).toBeUndefined();
    });
  });

  describe('updateTitle', () => {
    it('updates the title', () => {
      const e = new Event(makeValidProps());
      e.updateTitle('New Title');
      expect(e.title).toBe('New Title');
    });

    it('trims the title', () => {
      const e = new Event(makeValidProps());
      e.updateTitle('  New  ');
      expect(e.title).toBe('New');
    });

    it('throws on empty title', () => {
      const e = new Event(makeValidProps());
      expect(() => e.updateTitle('')).toThrow('Event title cannot be empty');
    });

    it('throws when title exceeds 255 characters', () => {
      const e = new Event(makeValidProps());
      expect(() => e.updateTitle('a'.repeat(256))).toThrow(
        'Event title cannot exceed 255 characters',
      );
    });
  });

  describe('updateAmount', () => {
    it('updates amount', () => {
      const e = new Event(makeValidProps());
      e.updateAmount(19.99);
      expect(e.amount).toBe(19.99);
    });

    it('throws on non-positive amount', () => {
      const e = new Event(makeValidProps());
      expect(() => e.updateAmount(0)).toThrow('Event amount must be positive');
    });
  });

  describe('reschedule', () => {
    it('updates startsAt and endsAt', () => {
      const e = new Event(makeValidProps());
      const newStart = new Date('2025-06-01');
      const newEnd = new Date('2025-06-02');
      e.reschedule(newStart, newEnd);
      expect(e.startsAt).toBe(newStart);
      expect(e.endsAt).toBe(newEnd);
    });

    it('reschedules without endsAt', () => {
      const e = new Event(makeValidProps());
      const newStart = new Date('2025-06-01');
      e.reschedule(newStart);
      expect(e.startsAt).toBe(newStart);
      expect(e.endsAt).toBeUndefined();
    });

    it('throws when endsAt is before startsAt', () => {
      const e = new Event(makeValidProps());
      expect(() =>
        e.reschedule(new Date('2025-06-02'), new Date('2025-06-01')),
      ).toThrow('End date must be after start date');
    });
  });

  describe('updateStatus', () => {
    it('updates status', () => {
      const e = new Event(makeValidProps());
      e.updateStatus('completed');
      expect(e.status).toBe('completed');
    });

    it('throws on invalid status', () => {
      const e = new Event(makeValidProps());
      expect(() => e.updateStatus('unknown' as any)).toThrow('Invalid event status');
    });
  });

  describe('updatePaymentStatus', () => {
    it('updates paymentStatus', () => {
      const e = new Event(makeValidProps());
      e.updatePaymentStatus('paid');
      expect(e.paymentStatus).toBe('paid');
    });

    it('clears paymentStatus when undefined', () => {
      const e = new Event(makeValidProps({ paymentStatus: 'pending' }));
      e.updatePaymentStatus(undefined);
      expect(e.paymentStatus).toBeUndefined();
    });

    it('throws on invalid paymentStatus', () => {
      const e = new Event(makeValidProps());
      expect(() => e.updatePaymentStatus('unknown' as any)).toThrow('Invalid payment status');
    });
  });

  describe('updateNotes', () => {
    it('trims notes', () => {
      const e = new Event(makeValidProps());
      e.updateNotes('  hello  ');
      expect(e.notes).toBe('hello');
    });

    it('clears notes when undefined', () => {
      const e = new Event(makeValidProps({ notes: 'old' }));
      e.updateNotes(undefined);
      expect(e.notes).toBeUndefined();
    });
  });

  describe('complete', () => {
    it('sets status to completed', () => {
      const e = new Event(makeValidProps());
      e.complete();
      expect(e.status).toBe('completed');
    });
  });

  describe('cancel', () => {
    it('sets status to canceled', () => {
      const e = new Event(makeValidProps());
      e.cancel();
      expect(e.status).toBe('canceled');
    });
  });

  describe('markAsPaid', () => {
    it('sets paymentStatus to paid and status to completed', () => {
      const e = new Event(makeValidProps());
      e.markAsPaid();
      expect(e.paymentStatus).toBe('paid');
      expect(e.status).toBe('completed');
    });
  });

  describe('markAsFailed', () => {
    it('sets status to failed and paymentStatus to failed', () => {
      const e = new Event(makeValidProps());
      e.markAsFailed();
      expect(e.status).toBe('failed');
      expect(e.paymentStatus).toBe('failed');
    });
  });

  describe('isOverdue', () => {
    it('returns true when scheduled and startsAt is in the past', () => {
      const e = new Event(
        makeValidProps({ startsAt: new Date('2020-01-01'), status: 'scheduled' }),
      );
      expect(e.isOverdue()).toBe(true);
    });

    it('returns false when scheduled but startsAt is in the future', () => {
      const future = new Date();
      future.setFullYear(future.getFullYear() + 1);
      const e = new Event(makeValidProps({ startsAt: future, status: 'scheduled' }));
      expect(e.isOverdue()).toBe(false);
    });

    it('returns false when status is not scheduled', () => {
      const e = new Event(
        makeValidProps({ startsAt: new Date('2020-01-01'), status: 'completed' }),
      );
      expect(e.isOverdue()).toBe(false);
    });
  });
});
