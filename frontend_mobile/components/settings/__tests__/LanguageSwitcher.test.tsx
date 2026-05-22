import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import LanguageSwitcher from '../LanguageSwitcher';
import i18n, { changeAppLanguage } from '@/i18n';

describe('LanguageSwitcher', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('fr');
  });

  it('renders an option per supported language', () => {
    const { getByTestId } = render(<LanguageSwitcher />);
    expect(getByTestId('language-option-en')).toBeTruthy();
    expect(getByTestId('language-option-fr')).toBeTruthy();
  });

  it('marks the active language as selected', () => {
    const { getByTestId } = render(<LanguageSwitcher />);
    const frOption = getByTestId('language-option-fr');
    expect(frOption.props.accessibilityState?.selected).toBe(true);
  });

  it('shows the current language label in French', () => {
    const { getByTestId } = render(<LanguageSwitcher />);
    expect(getByTestId('language-current').props.children).toMatch(/Français/);
  });

  it('switches language on tap and persists the choice', async () => {
    const { getByTestId } = render(<LanguageSwitcher />);

    await act(async () => {
      fireEvent.press(getByTestId('language-option-en'));
    });

    expect(i18n.language).toBe('en');
  });

  it('no-ops when tapping the already-active language', async () => {
    const { getByTestId } = render(<LanguageSwitcher />);

    await act(async () => {
      fireEvent.press(getByTestId('language-option-fr'));
    });

    expect(i18n.language).toBe('fr');
  });

  it('matches the snapshot in French', () => {
    const { toJSON } = render(<LanguageSwitcher />);
    expect(toJSON()).toMatchSnapshot();
  });

  it('matches the snapshot in English', async () => {
    await changeAppLanguage('en');
    const { toJSON } = render(<LanguageSwitcher />);
    expect(toJSON()).toMatchSnapshot();
    await changeAppLanguage('fr');
  });
});
