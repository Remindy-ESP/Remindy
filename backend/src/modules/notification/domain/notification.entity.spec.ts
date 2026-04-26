import { Notification } from './notification.entity';

function makeValidProps(overrides = {}) {
  return {
    userId: 'user-1',
    type: 'reminder' as const,
    channel: 'email' as const,
    title: 'Payment Due',
    body: 'Your payment is due soon',
    status: 'pending' as const,
    ...overrides,
  };
}

describe('Notification domain entity', () => {
  describe('constructor & validate', () => {
    it('creates a valid notification with all fields', () => {
      const future = new Date(Date.now() + 60_000);
      const n = new Notification(
        makeValidProps({
          id: 'notif-1',
          eventId: 'event-1',
          reminderId: 'rem-1',
          sentAt: new Date(),
          readAt: new Date(),
          snoozedUntil: future,
          errorMessage: '  err  ',
          metadata: { key: 'val' },
          createdAt: new Date(),
          deletedAt: new Date(),
          status: 'sent',
        }),
      );
      expect(n.id).toBe('notif-1');
      expect(n.userId).toBe('user-1');
      expect(n.eventId).toBe('event-1');
      expect(n.reminderId).toBe('rem-1');
      expect(n.type).toBe('reminder');
      expect(n.channel).toBe('email');
      expect(n.title).toBe('Payment Due');
      expect(n.body).toBe('Your payment is due soon');
      expect(n.errorMessage).toBe('err'); // trimmed
      expect(n.metadata).toEqual({ key: 'val' });
      expect(n.createdAt).toBeDefined();
      expect(n.deletedAt).toBeDefined();
    });

    it('trims title and body on construction', () => {
      const n = new Notification(makeValidProps({ title: '  Hello  ', body: '  World  ' }));
      expect(n.title).toBe('Hello');
      expect(n.body).toBe('World');
    });

    it('throws when title is empty', () => {
      expect(() => new Notification(makeValidProps({ title: '  ' }))).toThrow(
        'Notification title cannot be empty',
      );
    });

    it('throws when title exceeds 255 characters', () => {
      expect(() => new Notification(makeValidProps({ title: 'a'.repeat(256) }))).toThrow(
        'Notification title cannot exceed 255 characters',
      );
    });

    it('throws when body is empty', () => {
      expect(() => new Notification(makeValidProps({ body: '  ' }))).toThrow(
        'Notification body cannot be empty',
      );
    });

    it('throws when status is snoozed without snoozedUntil', () => {
      expect(() => new Notification(makeValidProps({ status: 'snoozed' }))).toThrow(
        'Snoozed notifications must have a snoozedUntil date',
      );
    });

    it('throws when snoozedUntil is in the past and status is snoozed', () => {
      expect(
        () =>
          new Notification(
            makeValidProps({
              status: 'snoozed',
              snoozedUntil: new Date('2020-01-01'),
            }),
          ),
      ).toThrow('Snoozed until date must be in the future');
    });

    it('accepts snoozed status with future snoozedUntil', () => {
      const future = new Date(Date.now() + 60_000);
      expect(
        () => new Notification(makeValidProps({ status: 'snoozed', snoozedUntil: future })),
      ).not.toThrow();
    });
  });

  describe('markAsRead', () => {
    it('sets readAt', () => {
      const n = new Notification(makeValidProps());
      n.markAsRead();
      expect(n.readAt).toBeDefined();
      expect(n.isRead()).toBe(true);
    });

    it('throws when already read', () => {
      const n = new Notification(makeValidProps({ readAt: new Date() }));
      expect(() => n.markAsRead()).toThrow('Notification already marked as read');
    });
  });

  describe('snooze', () => {
    it('sets status to snoozed and snoozedUntil', () => {
      const n = new Notification(makeValidProps());
      const future = new Date(Date.now() + 60_000);
      n.snooze(future);
      expect(n.status).toBe('snoozed');
      expect(n.snoozedUntil).toBe(future);
      expect(n.isSnoozed()).toBe(true);
    });

    it('throws when snooze date is in the past', () => {
      const n = new Notification(makeValidProps());
      expect(() => n.snooze(new Date('2020-01-01'))).toThrow('Snooze date must be in the future');
    });
  });

  describe('markAsSent', () => {
    it('sets status to sent and sets sentAt', () => {
      const n = new Notification(makeValidProps());
      n.markAsSent();
      expect(n.status).toBe('sent');
      expect(n.sentAt).toBeDefined();
    });
  });

  describe('markAsFailed', () => {
    it('sets status to failed and trims errorMessage', () => {
      const n = new Notification(makeValidProps());
      n.markAsFailed('  connection error  ');
      expect(n.status).toBe('failed');
      expect(n.errorMessage).toBe('connection error');
    });
  });

  describe('unsnooze', () => {
    it('resets status to pending and clears snoozedUntil', () => {
      const future = new Date(Date.now() + 60_000);
      const n = new Notification(makeValidProps({ status: 'snoozed', snoozedUntil: future }));
      n.unsnooze();
      expect(n.status).toBe('pending');
      expect(n.snoozedUntil).toBeUndefined();
      expect(n.isSnoozed()).toBe(false);
    });

    it('throws when not snoozed', () => {
      const n = new Notification(makeValidProps());
      expect(() => n.unsnooze()).toThrow('Notification is not snoozed');
    });
  });

  describe('isRead', () => {
    it('returns false when no readAt', () => {
      const n = new Notification(makeValidProps());
      expect(n.isRead()).toBe(false);
    });

    it('returns true when readAt is set', () => {
      const n = new Notification(makeValidProps({ readAt: new Date() }));
      expect(n.isRead()).toBe(true);
    });
  });

  describe('isSnoozed', () => {
    it('returns false for non-snoozed status', () => {
      for (const status of ['pending', 'sent', 'failed'] as const) {
        const n = new Notification(makeValidProps({ status }));
        expect(n.isSnoozed()).toBe(false);
      }
    });
  });

  describe('getters for optional fields', () => {
    it('sentAt, snoozedUntil, errorMessage, metadata are undefined when not set', () => {
      const n = new Notification(makeValidProps());
      expect(n.sentAt).toBeUndefined();
      expect(n.snoozedUntil).toBeUndefined();
      expect(n.errorMessage).toBeUndefined();
      expect(n.metadata).toBeUndefined();
      expect(n.deletedAt).toBeUndefined();
    });
  });
});
