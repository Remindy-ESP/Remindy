import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import BrandLogo, { findBrandDomain } from '../BrandLogo';

// ---------------------------------------------------------------------------
// findBrandDomain — unit tests for the matching logic
// ---------------------------------------------------------------------------
describe('findBrandDomain', () => {
  it('returns domain for exact brand name (case-insensitive)', () => {
    expect(findBrandDomain('Netflix')).toBe('netflix.com');
    expect(findBrandDomain('SPOTIFY')).toBe('spotify.com');
    expect(findBrandDomain('deezer')).toBe('deezer.com');
  });

  it('returns domain for partial match (e.g. "Netflix Premium")', () => {
    expect(findBrandDomain('Netflix Premium')).toBe('netflix.com');
    expect(findBrandDomain('Abonnement Spotify')).toBe('spotify.com');
    expect(findBrandDomain('Mon abonnement Disney+')).toBe('disneyplus.com');
  });

  it('prefers longer brand key over shorter one', () => {
    // "apple tv" should match before "apple"
    expect(findBrandDomain('Apple TV+')).toBe('tv.apple.com');
    // "amazon prime" should match before generic
    expect(findBrandDomain('Amazon Prime Video')).toBe('amazon.com');
  });

  it('returns null for unknown brands', () => {
    expect(findBrandDomain('Mon Assurance Perso')).toBeNull();
    expect(findBrandDomain('Loyer Appartement')).toBeNull();
  });

  it('returns null for empty or undefined', () => {
    expect(findBrandDomain('')).toBeNull();
  });

  it('handles whitespace correctly', () => {
    expect(findBrandDomain('  Netflix  ')).toBe('netflix.com');
    expect(findBrandDomain('  basic fit  ')).toBe('basic-fit.com');
  });
});

// ---------------------------------------------------------------------------
// BrandLogo component — rendering tests
// ---------------------------------------------------------------------------
describe('BrandLogo component', () => {
  it('renders an Image for known brands', () => {
    const { getByTestId } = render(<BrandLogo name="Netflix" size={40} />);
    expect(getByTestId('brand-logo-image')).toBeTruthy();
  });

  it('falls back to category emoji when brand is unknown and categoryIcon is provided', () => {
    const { getByTestId, getByText } = render(
      <BrandLogo name="Mon Loyer" categoryIcon="🏠" size={40} />
    );
    expect(getByTestId('brand-logo-emoji')).toBeTruthy();
    expect(getByText('🏠')).toBeTruthy();
  });

  it('falls back to initial letter when brand is unknown and no categoryIcon', () => {
    const { getByTestId, getByText } = render(
      <BrandLogo name="Mon Loyer" size={40} />
    );
    expect(getByTestId('brand-logo-initial')).toBeTruthy();
    expect(getByText('M')).toBeTruthy();
  });

  it('renders "?" when name is empty and no categoryIcon', () => {
    const { getByTestId, getByText } = render(
      <BrandLogo name="" size={40} />
    );
    expect(getByTestId('brand-logo-initial')).toBeTruthy();
    expect(getByText('?')).toBeTruthy();
  });

  it('renders with default size of 40', () => {
    const { getByTestId } = render(<BrandLogo name="Netflix" />);
    expect(getByTestId('brand-logo-image')).toBeTruthy();
  });

  it('falls back to emoji after image load error', () => {
    const { getByTestId } = render(
      <BrandLogo name="Netflix" categoryIcon="🎬" size={40} />
    );
    // Initially renders the image
    const imageContainer = getByTestId('brand-logo-image');
    expect(imageContainer).toBeTruthy();

    // Simulate image load error — find the Image inside and fire onError
    const image = imageContainer.findByProps({ resizeMode: 'cover' });
    fireEvent(image, 'error');

    // Should now render the emoji fallback
    expect(getByTestId('brand-logo-emoji')).toBeTruthy();
  });

  it('falls back to initial letter after image load error when no categoryIcon', () => {
    const { getByTestId, getByText } = render(
      <BrandLogo name="Spotify" size={40} />
    );
    // Initially renders the image
    const imageContainer = getByTestId('brand-logo-image');
    const image = imageContainer.findByProps({ resizeMode: 'cover' });
    fireEvent(image, 'error');

    // Should now render the initial letter fallback
    expect(getByTestId('brand-logo-initial')).toBeTruthy();
    expect(getByText('S')).toBeTruthy();
  });
});
