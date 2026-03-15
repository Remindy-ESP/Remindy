import { EventSeries } from './event-series.entity';

function makeValidProps(overrides = {}) {
  return {
    subscriptionId: 'sub-1',
    rrule: 'FREQ=MONTHLY;INTERVAL=1',
    dtstart: new Date('2025-01-01'),
    timezone: 'Europe/Paris',
    ...overrides,
  };
}

describe('EventSeries domain entity', () => {
  describe('constructor & validate', () => {
    it('creates a valid EventSeries with all fields', () => {
      const es = new EventSeries(
        makeValidProps({
          id: 'series-1',
          exdates: [new Date('2025-02-01')],
          rdates: [new Date('2025-03-15')],
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: new Date(),
        }),
      );
      expect(es.id).toBe('series-1');
      expect(es.subscriptionId).toBe('sub-1');
      expect(es.rrule).toBe('FREQ=MONTHLY;INTERVAL=1');
      expect(es.dtstart).toEqual(new Date('2025-01-01'));
      expect(es.timezone).toBe('Europe/Paris');
      expect(es.exdates).toHaveLength(1);
      expect(es.rdates).toHaveLength(1);
      expect(es.createdAt).toBeDefined();
      expect(es.updatedAt).toBeDefined();
      expect(es.deletedAt).toBeDefined();
    });

    it('normalizes rrule to uppercase', () => {
      const es = new EventSeries(makeValidProps({ rrule: 'freq=monthly;interval=1' }));
      expect(es.rrule).toBe('FREQ=MONTHLY;INTERVAL=1');
    });

    it('defaults timezone to Europe/Paris when not provided', () => {
      const props = makeValidProps();
      delete (props as any).timezone;
      const es = new EventSeries({ ...props, timezone: '' });
      expect(es.timezone).toBe('Europe/Paris');
    });

    it('throws when subscriptionId is empty', () => {
      expect(() => new EventSeries(makeValidProps({ subscriptionId: '' }))).toThrow(
        'Subscription ID is required',
      );
    });

    it('throws when rrule is empty', () => {
      expect(() => new EventSeries(makeValidProps({ rrule: '  ' }))).toThrow('RRULE is required');
    });

    it('throws when dtstart is missing', () => {
      expect(() => new EventSeries(makeValidProps({ dtstart: null as any }))).toThrow(
        'Start date (dtstart) is required',
      );
    });

    it('throws when rrule does not start with FREQ=', () => {
      expect(() => new EventSeries(makeValidProps({ rrule: 'INTERVAL=1;FREQ=MONTHLY' }))).toThrow(
        'RRULE must start with FREQ=',
      );
    });

    it('throws when timezone is empty string after trim', () => {
      // timezone defaults via || 'Europe/Paris' in constructor, but validate checks if it's empty
      // Since constructor does: this._timezone = props.timezone || 'Europe/Paris'
      // an empty string will be replaced with 'Europe/Paris', so this won't throw
      // We test the validate path by directly testing updateTimezone('')
      const es = new EventSeries(makeValidProps());
      expect(() => es.updateTimezone('')).toThrow('Timezone is required');
    });

    it('throws when timezone is whitespace string (validate covers line 103)', () => {
      // '   ' is truthy so || 'Europe/Paris' does NOT replace it
      // but trim().length === 0 makes validate() throw
      expect(() => new EventSeries(makeValidProps({ timezone: '   ' }))).toThrow(
        'Timezone is required',
      );
    });
  });

  describe('updateRRule', () => {
    it('updates rrule to uppercase', () => {
      const es = new EventSeries(makeValidProps());
      es.updateRRule('freq=weekly;interval=1');
      expect(es.rrule).toBe('FREQ=WEEKLY;INTERVAL=1');
    });

    it('throws when rrule is empty', () => {
      const es = new EventSeries(makeValidProps());
      expect(() => es.updateRRule('')).toThrow('RRULE is required');
    });

    it('throws when new rrule does not start with FREQ=', () => {
      const es = new EventSeries(makeValidProps());
      expect(() => es.updateRRule('INTERVAL=2')).toThrow('RRULE must start with FREQ=');
    });
  });

  describe('updateDtstart', () => {
    it('updates dtstart', () => {
      const es = new EventSeries(makeValidProps());
      const newDate = new Date('2025-06-01');
      es.updateDtstart(newDate);
      expect(es.dtstart).toBe(newDate);
    });

    it('throws when dtstart is null', () => {
      const es = new EventSeries(makeValidProps());
      expect(() => es.updateDtstart(null as any)).toThrow('Start date (dtstart) is required');
    });
  });

  describe('updateTimezone', () => {
    it('updates timezone', () => {
      const es = new EventSeries(makeValidProps());
      es.updateTimezone('America/New_York');
      expect(es.timezone).toBe('America/New_York');
    });

    it('throws when timezone is empty', () => {
      const es = new EventSeries(makeValidProps());
      expect(() => es.updateTimezone('  ')).toThrow('Timezone is required');
    });
  });

  describe('addExceptionDate', () => {
    it('adds a date to exdates', () => {
      const es = new EventSeries(makeValidProps());
      const d = new Date('2025-03-01');
      es.addExceptionDate(d);
      expect(es.exdates).toHaveLength(1);
      expect(es.exdates![0]).toBe(d);
    });

    it('does not add duplicate dates', () => {
      const es = new EventSeries(makeValidProps());
      const d = new Date('2025-03-01');
      es.addExceptionDate(d);
      es.addExceptionDate(new Date(d.getTime()));
      expect(es.exdates).toHaveLength(1);
    });

    it('initializes exdates array if not set', () => {
      const es = new EventSeries(makeValidProps());
      expect(es.exdates).toBeUndefined();
      es.addExceptionDate(new Date('2025-05-01'));
      expect(es.exdates).toHaveLength(1);
    });
  });

  describe('removeExceptionDate', () => {
    it('removes a date from exdates', () => {
      const d1 = new Date('2025-03-01');
      const d2 = new Date('2025-04-01');
      const es = new EventSeries(makeValidProps({ exdates: [d1, d2] }));
      es.removeExceptionDate(d1);
      expect(es.exdates).toHaveLength(1);
      expect(es.exdates![0].getTime()).toBe(d2.getTime());
    });

    it('does nothing when exdates is undefined', () => {
      const es = new EventSeries(makeValidProps());
      expect(() => es.removeExceptionDate(new Date())).not.toThrow();
    });
  });

  describe('addRecurrenceDate', () => {
    it('adds a date to rdates', () => {
      const es = new EventSeries(makeValidProps());
      const d = new Date('2025-05-15');
      es.addRecurrenceDate(d);
      expect(es.rdates).toHaveLength(1);
    });

    it('does not add duplicate rdates', () => {
      const es = new EventSeries(makeValidProps());
      const d = new Date('2025-05-15');
      es.addRecurrenceDate(d);
      es.addRecurrenceDate(new Date(d.getTime()));
      expect(es.rdates).toHaveLength(1);
    });

    it('initializes rdates array if not set', () => {
      const es = new EventSeries(makeValidProps());
      expect(es.rdates).toBeUndefined();
      es.addRecurrenceDate(new Date('2025-06-01'));
      expect(es.rdates).toHaveLength(1);
    });
  });

  describe('removeRecurrenceDate', () => {
    it('removes a date from rdates', () => {
      const d1 = new Date('2025-05-15');
      const d2 = new Date('2025-06-15');
      const es = new EventSeries(makeValidProps({ rdates: [d1, d2] }));
      es.removeRecurrenceDate(d1);
      expect(es.rdates).toHaveLength(1);
      expect(es.rdates![0].getTime()).toBe(d2.getTime());
    });

    it('does nothing when rdates is undefined', () => {
      const es = new EventSeries(makeValidProps());
      expect(() => es.removeRecurrenceDate(new Date())).not.toThrow();
    });
  });

  describe('toJSON', () => {
    it('returns all props', () => {
      const es = new EventSeries(makeValidProps({ id: 'series-json' }));
      const json = es.toJSON();
      expect(json.id).toBe('series-json');
      expect(json.subscriptionId).toBe('sub-1');
      expect(json.rrule).toBe('FREQ=MONTHLY;INTERVAL=1');
      expect(json.timezone).toBe('Europe/Paris');
    });
  });
});
