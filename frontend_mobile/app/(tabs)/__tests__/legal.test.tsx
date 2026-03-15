import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import LegalScreen from '../legal';

describe('LegalScreen', () => {
  it('should render without crashing', () => {
    const { getByText } = render(<LegalScreen />);
    expect(getByText('Charte juridique')).toBeTruthy();
  });

  it('should display the header title', () => {
    const { getByText } = render(<LegalScreen />);
    expect(getByText('Charte juridique')).toBeTruthy();
  });

  it('should display the header subtitle', () => {
    const { getByText } = render(<LegalScreen />);
    expect(getByText('Conformité légale & protection des données')).toBeTruthy();
  });

  it('should display the last update badge', () => {
    const { getByText } = render(<LegalScreen />);
    expect(getByText('Dernière mise à jour : Nov. 2025')).toBeTruthy();
  });

  it('should display the introduction text', () => {
    const { getByText } = render(<LegalScreen />);
    expect(getByText(/dispositions juridiques applicables/)).toBeTruthy();
  });

  it('should display all section titles', () => {
    const { getByText } = render(<LegalScreen />);
    expect(getByText('Aspects juridiques & corpus applicable')).toBeTruthy();
    expect(getByText('Alertes & parades de conformité')).toBeTruthy();
    expect(getByText("Plan d'actions conformité")).toBeTruthy();
    expect(getByText('Sources juridiques & bibliographie')).toBeTruthy();
    expect(getByText('Conclusion exécutable (priorités 0–90 jours)')).toBeTruthy();
  });

  it('should expand a section when tapped', () => {
    const { getByTestId, queryByText } = render(<LegalScreen />);

    // Content should not be visible initially
    expect(queryByText('Protection des données (UE/FR)')).toBeNull();

    // Tap the first section header
    const sectionHeader = getByTestId('section-aspects');
    fireEvent.press(sectionHeader);

    // Content should now be visible
    expect(queryByText('Protection des données (UE/FR)')).toBeTruthy();
  });

  it('should collapse a section when tapped again', () => {
    const { getByTestId, queryByText } = render(<LegalScreen />);

    const sectionHeader = getByTestId('section-aspects');

    // Expand
    fireEvent.press(sectionHeader);
    expect(queryByText('Protection des données (UE/FR)')).toBeTruthy();

    // Collapse
    fireEvent.press(sectionHeader);
    expect(queryByText('Protection des données (UE/FR)')).toBeNull();
  });

  it('should render with correct structure', () => {
    const { toJSON } = render(<LegalScreen />);
    const tree = toJSON();
    expect(tree).toBeTruthy();
  });

  it('should display the footer', () => {
    const { getByText } = render(<LegalScreen />);
    expect(getByText('Document de référence interne — T_LAW_ESP')).toBeTruthy();
  });
});
