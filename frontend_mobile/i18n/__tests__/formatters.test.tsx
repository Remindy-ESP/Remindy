import React from 'react';
import { Text } from 'react-native';
import { render } from '@testing-library/react-native';
import i18n from '../index';
import {
  formatCurrency,
  formatDate,
  formatNumber,
  useCurrencyFormat,
  useDateFormat,
  useNumberFormat,
} from '../formatters';

describe('i18n/formatters', () => {
  describe('formatCurrency', () => {
    it('formats with French locale conventions', () => {
      const result = formatCurrency(12.5, 'fr');
      expect(result).toMatch(/12,50/);
      expect(result).toContain('€');
    });

    it('formats with English locale conventions', () => {
      const result = formatCurrency(12.5, 'en');
      expect(result).toMatch(/12\.50/);
      expect(result).toContain('€');
    });

    it('falls back to en-US when given an unsupported tag', () => {
      const result = formatCurrency(12.5, 'xx-YY');
      expect(result).toMatch(/12\.50/);
    });

    it('accepts a region-tagged code like en-US', () => {
      const result = formatCurrency(12.5, 'en-US');
      expect(result).toMatch(/12\.50/);
    });

    it('accepts an alternative currency code', () => {
      const result = formatCurrency(100, 'en', 'USD');
      expect(result).toContain('$');
    });
  });

  describe('formatDate', () => {
    const isoDate = '2025-10-05T12:00:00.000Z';

    it('formats with French locale conventions', () => {
      const result = formatDate(isoDate, 'fr');
      expect(result).toMatch(/octobre/i);
      expect(result).toMatch(/2025/);
    });

    it('formats with English locale conventions', () => {
      const result = formatDate(isoDate, 'en');
      expect(result).toMatch(/october/i);
      expect(result).toMatch(/2025/);
    });

    it('accepts a Date instance', () => {
      const result = formatDate(new Date(isoDate), 'fr');
      expect(result).toMatch(/2025/);
    });

    it('returns empty string on invalid date input', () => {
      expect(formatDate('not-a-date', 'fr')).toBe('');
    });
  });

  describe('formatNumber', () => {
    it('uses comma as decimal separator in French', () => {
      expect(formatNumber(1234.5, 'fr')).toMatch(/1[\s ]234,5/);
    });

    it('uses period as decimal separator in English', () => {
      expect(formatNumber(1234.5, 'en')).toMatch(/1,234\.5/);
    });

    it('respects passed Intl options', () => {
      expect(formatNumber(0.42, 'en', { style: 'percent' })).toMatch(/42/);
    });
  });

  describe('hooks', () => {
    beforeAll(async () => {
      await i18n.changeLanguage('fr');
    });

    afterAll(async () => {
      await i18n.changeLanguage('fr');
    });

    function HookHarness({ render: r }: { render: () => string }) {
      return <Text testID="hook-result">{r()}</Text>;
    }

    it('useCurrencyFormat returns a function tied to the active language', () => {
      const Component = () => {
        const format = useCurrencyFormat('EUR');
        return <HookHarness render={() => format(99.99)} />;
      };
      const { getByTestId } = render(<Component />);
      expect(getByTestId('hook-result').props.children).toMatch(/99,99/);
    });

    it('useDateFormat returns a function tied to the active language', () => {
      const Component = () => {
        const format = useDateFormat();
        return <HookHarness render={() => format('2025-10-05')} />;
      };
      const { getByTestId } = render(<Component />);
      expect(getByTestId('hook-result').props.children).toMatch(/octobre/i);
    });

    it('useNumberFormat returns a function tied to the active language', () => {
      const Component = () => {
        const format = useNumberFormat();
        return <HookHarness render={() => format(1234.5)} />;
      };
      const { getByTestId } = render(<Component />);
      expect(getByTestId('hook-result').props.children).toMatch(/1[\s ]234,5/);
    });

    it('useDateFormat returns empty string on invalid input', () => {
      const Component = () => {
        const format = useDateFormat();
        return <HookHarness render={() => format('not-a-date')} />;
      };
      const { getByTestId } = render(<Component />);
      expect(getByTestId('hook-result').props.children).toBe('');
    });
  });
});
