import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { ComparisonInfoModal } from '../ComparisonInfoModal';

describe('ComparisonInfoModal', () => {
  it('does not render the body when not visible', () => {
    const { queryByTestId } = render(
      <ComparisonInfoModal visible={false} period="month" onClose={() => {}} />,
    );
    expect(queryByTestId('comparison-info-text')).toBeNull();
  });

  it("renders the exact 'Ce jour' text for the day period", () => {
    const { getByTestId, getByText } = render(
      <ComparisonInfoModal visible period="day" onClose={() => {}} />,
    );
    expect(getByText('Ce jour')).toBeTruthy();
    expect(getByTestId('comparison-info-text').props.children).toBe(
      "Comparaison du cumul des dépenses depuis le début du mois jusqu'au jour actuel avec la même période du mois précédent.\n" +
        'Exemple : du 1er au 5 octobre vs du 1er au 5 septembre.',
    );
  });

  it("renders the exact 'Semaine' text for the week period", () => {
    const { getByTestId, getByText } = render(
      <ComparisonInfoModal visible period="week" onClose={() => {}} />,
    );
    expect(getByText('Semaine')).toBeTruthy();
    expect(getByTestId('comparison-info-text').props.children).toBe(
      'Comparaison du cumul des dépenses de la semaine passée avec la semaine précédente.\n' +
        'Exemple : semaine du 6 octobre, à celle du 13 octobre',
    );
  });

  it("renders the exact 'Mensuel' text for the month period", () => {
    const { getByTestId, getByText } = render(
      <ComparisonInfoModal visible period="month" onClose={() => {}} />,
    );
    expect(getByText('Mensuel')).toBeTruthy();
    expect(getByTestId('comparison-info-text').props.children).toBe(
      'Comparaison du total dépensé depuis le début du mois avec le mois précédent. Même si en début de mois le comparo sera indécent.\n' +
        'Exemple : octobre vs septembre.',
    );
  });

  it("renders the exact 'Année' text for the year period", () => {
    const { getByTestId, getByText } = render(
      <ComparisonInfoModal visible period="year" onClose={() => {}} />,
    );
    expect(getByText('Année')).toBeTruthy();
    expect(getByTestId('comparison-info-text').props.children).toBe(
      "Comparaison des dépenses de l'année actuelle avec celle de l'année précédente.\n" +
        'Exemple : 2025 vs 2024.',
    );
  });

  it('calls onClose when the close button is pressed', () => {
    const onClose = jest.fn();
    const { getByTestId } = render(
      <ComparisonInfoModal visible period="month" onClose={onClose} />,
    );
    fireEvent.press(getByTestId('comparison-info-close'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when the backdrop is pressed', () => {
    const onClose = jest.fn();
    const { getByTestId } = render(
      <ComparisonInfoModal visible period="month" onClose={onClose} />,
    );
    fireEvent.press(getByTestId('comparison-info-overlay'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
