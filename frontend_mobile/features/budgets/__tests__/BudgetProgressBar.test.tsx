import React from 'react';
import { render } from '@testing-library/react-native';
import {
  BudgetProgressBar,
  colorForProgress,
  PROGRESS_COLORS,
} from '../components/BudgetProgressBar';

describe('colorForProgress', () => {
  it('returns the OK color below 70%', () => {
    expect(colorForProgress(0)).toBe(PROGRESS_COLORS.ok);
    expect(colorForProgress(0.5)).toBe(PROGRESS_COLORS.ok);
    expect(colorForProgress(0.69)).toBe(PROGRESS_COLORS.ok);
  });

  it('returns the warning color at the 70% threshold and above', () => {
    expect(colorForProgress(0.7)).toBe(PROGRESS_COLORS.warning);
    expect(colorForProgress(0.85)).toBe(PROGRESS_COLORS.warning);
    expect(colorForProgress(0.89)).toBe(PROGRESS_COLORS.warning);
  });

  it('returns the danger color at the 90% threshold and above', () => {
    expect(colorForProgress(0.9)).toBe(PROGRESS_COLORS.danger);
    expect(colorForProgress(1)).toBe(PROGRESS_COLORS.danger);
    expect(colorForProgress(1.2)).toBe(PROGRESS_COLORS.danger);
  });
});

describe('BudgetProgressBar', () => {
  it('renders the fill with the OK color when below 70%', () => {
    const { getByTestId } = render(<BudgetProgressBar progress={0.4} />);
    const fill = getByTestId('budget-progress-bar-fill');
    expect(fill.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ backgroundColor: PROGRESS_COLORS.ok }),
      ]),
    );
  });

  it('renders the fill with the warning color at 80%', () => {
    const { getByTestId } = render(<BudgetProgressBar progress={0.8} />);
    const fill = getByTestId('budget-progress-bar-fill');
    expect(fill.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ backgroundColor: PROGRESS_COLORS.warning }),
      ]),
    );
  });

  it('renders the fill with the danger color at 95%', () => {
    const { getByTestId } = render(<BudgetProgressBar progress={0.95} />);
    const fill = getByTestId('budget-progress-bar-fill');
    expect(fill.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ backgroundColor: PROGRESS_COLORS.danger }),
      ]),
    );
  });

  it('clamps the visual fill width to 100%', () => {
    const { getByTestId } = render(<BudgetProgressBar progress={1.5} />);
    const fill = getByTestId('budget-progress-bar-fill');
    expect(fill.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ width: '100%' })]),
    );
  });

  it('clamps the visual fill width to 0% when negative', () => {
    const { getByTestId } = render(<BudgetProgressBar progress={-0.5} />);
    const fill = getByTestId('budget-progress-bar-fill');
    expect(fill.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ width: '0%' })]),
    );
  });

  it('exposes accessibility metadata', () => {
    const { getByTestId } = render(<BudgetProgressBar progress={0.5} />);
    const track = getByTestId('budget-progress-bar');
    expect(track.props.accessibilityRole).toBe('progressbar');
    expect(track.props.accessibilityValue).toEqual({ min: 0, max: 100, now: 50 });
  });
});
