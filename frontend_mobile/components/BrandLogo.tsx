import React, { useState } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';

/**
 * Mapping of known brand keywords to their domain names.
 * Used to fetch logos via the Clearbit Logo API.
 */
const BRAND_LOGOS: Record<string, string> = {
  // Streaming
  'netflix': 'netflix.com',
  'spotify': 'spotify.com',
  'deezer': 'deezer.com',
  'disney': 'disneyplus.com',
  'youtube': 'youtube.com',
  'canal': 'canalplus.com',
  'crunchyroll': 'crunchyroll.com',
  'hbo': 'hbo.com',
  'max': 'max.com',
  'apple tv': 'tv.apple.com',
  'apple music': 'apple.com',
  'amazon prime': 'amazon.com',
  'prime video': 'primevideo.com',
  'ocs': 'ocs.fr',
  'paramount': 'paramountplus.com',
  // Tech & Productivité
  'adobe': 'adobe.com',
  'microsoft': 'microsoft.com',
  'google': 'google.com',
  'github': 'github.com',
  'figma': 'figma.com',
  'notion': 'notion.so',
  'slack': 'slack.com',
  'discord': 'discord.com',
  'chatgpt': 'openai.com',
  'openai': 'openai.com',
  'canva': 'canva.com',
  'dropbox': 'dropbox.com',
  'icloud': 'apple.com',
  'midjourney': 'midjourney.com',
  // Telecom
  'orange': 'orange.fr',
  'sosh': 'sosh.fr',
  'sfr': 'sfr.fr',
  'red by sfr': 'red-by-sfr.fr',
  'bouygues': 'bouyguestelecom.fr',
  'free': 'free.fr',
  // Gaming
  'xbox': 'xbox.com',
  'playstation': 'playstation.com',
  'nintendo': 'nintendo.com',
  'steam': 'store.steampowered.com',
  // Fitness & Sport
  'basic fit': 'basic-fit.com',
  'basic-fit': 'basic-fit.com',
  'fitness park': 'fitnesspark.fr',
  'gymlib': 'gymlib.com',
  'strava': 'strava.com',
  // Livraison & Transport
  'uber': 'uber.com',
  'deliveroo': 'deliveroo.com',
  // Presse
  'le monde': 'lemonde.fr',
  'mediapart': 'mediapart.fr',
  'le figaro': 'lefigaro.fr',
  "l'equipe": 'lequipe.fr',
  // Rencontres
  'tinder': 'tinder.com',
  'bumble': 'bumble.com',
  // Cloud
  'aws': 'aws.amazon.com',
  'ovh': 'ovhcloud.com',
};

/** Palette of colors for the letter-initial fallback circle */
const FALLBACK_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e',
  '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6',
  '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e',
];

export interface BrandLogoProps {
  /** Name of the subscription (e.g. "Netflix Premium", "Spotify") */
  name?: string;
  /** Category emoji icon (e.g. "🎬") — used as fallback when brand is not recognized */
  categoryIcon?: string;
  /** Category color — used for the emoji fallback circle background */
  categoryColor?: string;
  /** Size in pixels (default: 40) */
  size?: number;
}

/**
 * Finds the Clearbit domain for a given subscription name.
 * Uses partial, case-insensitive matching so "Netflix Premium" matches "netflix".
 * Longer brand keys are checked first to prefer "apple tv" over "apple".
 */
export function findBrandDomain(name: string): string | null {
  if (!name) return null;
  const lowerName = name.toLowerCase().trim();

  // Sort keys by length descending so longer (more specific) keys match first
  const sortedKeys = Object.keys(BRAND_LOGOS).sort((a, b) => b.length - a.length);

  for (const brand of sortedKeys) {
    if (lowerName.includes(brand)) {
      return BRAND_LOGOS[brand];
    }
  }
  return null;
}

/**
 * BrandLogo component — displays a brand logo from the Clearbit CDN,
 * falling back to the category emoji, and finally to a colored initial letter.
 *
 * Fallback chain: CDN Logo → Category Emoji → Colored Initial
 */
export default function BrandLogo({
  name = '',
  categoryIcon,
  categoryColor,
  size = 40,
}: BrandLogoProps) {
  const [imageError, setImageError] = useState(false);

  const domain = findBrandDomain(name);
  const showImage = domain !== null && !imageError;

  // Pick a deterministic color based on the name
  const charCode = name ? name.charCodeAt(0) : 0;
  const fallbackColor = categoryColor || FALLBACK_COLORS[charCode % FALLBACK_COLORS.length];

  // Level 1: Brand logo from CDN
  if (showImage) {
    return (
      <View
        testID="brand-logo-image"
        style={[
          styles.container,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
          },
        ]}
      >
        <Image
          source={{ uri: `https://icon.horse/icon/${domain}` }}
          style={{ width: size, height: size, borderRadius: size / 2 }}
          onError={() => setImageError(true)}
          resizeMode="cover"
        />
      </View>
    );
  }

  // Level 2: Category emoji fallback
  if (categoryIcon) {
    return (
      <View
        testID="brand-logo-emoji"
        style={[
          styles.fallbackContainer,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: `${fallbackColor}20`,
          },
        ]}
      >
        <Text style={{ fontSize: size * 0.45 }}>{categoryIcon}</Text>
      </View>
    );
  }

  // Level 3: Colored initial letter fallback
  const firstLetter = name ? name.trim().charAt(0).toUpperCase() : '?';
  return (
    <View
      testID="brand-logo-initial"
      style={[
        styles.fallbackContainer,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: fallbackColor,
        },
      ]}
    >
      <Text style={{ fontSize: size * 0.45, color: '#ffffff', fontWeight: 'bold' }}>
        {firstLetter}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fallbackContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
