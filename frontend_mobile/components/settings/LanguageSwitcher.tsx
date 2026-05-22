import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import {
  LANGUAGE_LABELS,
  SUPPORTED_LANGUAGES,
  SupportedLanguage,
  isSupportedLanguage,
} from '@/i18n/config';
import { changeAppLanguage } from '@/i18n';

interface LanguageSwitcherProps {
  testID?: string;
}

export default function LanguageSwitcher({ testID }: LanguageSwitcherProps) {
  const { t, i18n } = useTranslation('settings');
  const current = isSupportedLanguage(i18n.language)
    ? i18n.language
    : (i18n.language.split('-')[0] as SupportedLanguage);

  const handleSelect = async (lng: SupportedLanguage) => {
    if (lng === current) {
      return;
    }
    await changeAppLanguage(lng);
  };

  return (
    <View style={styles.card} testID={testID}>
      <Text style={styles.title}>{t('language.sectionTitle')}</Text>
      <Text style={styles.subtitle}>{t('language.sectionSubtitle')}</Text>

      <View style={styles.options}>
        {SUPPORTED_LANGUAGES.map((lng) => {
          const isActive = lng === current;
          return (
            <TouchableOpacity
              key={lng}
              testID={`language-option-${lng}`}
              style={[styles.option, isActive && styles.optionActive]}
              onPress={() => void handleSelect(lng)}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={LANGUAGE_LABELS[lng]}
            >
              <Text style={[styles.optionLabel, isActive && styles.optionLabelActive]}>
                {LANGUAGE_LABELS[lng]}
              </Text>
              {isActive ? (
                <Ionicons name="checkmark-circle" size={18} color="#8A91FF" />
              ) : null}
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.currentLine} testID="language-current">
        {t('language.current', { label: LANGUAGE_LABELS[current] })}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#373848',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
  },
  title: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    color: '#D3D6E8',
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 14,
  },
  options: {
    gap: 8,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1F2140',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3E4470',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  optionActive: {
    borderColor: '#8A91FF',
    backgroundColor: '#2A2F63',
  },
  optionLabel: {
    color: '#DDE1FF',
    fontSize: 14,
    fontWeight: '600',
  },
  optionLabelActive: {
    color: '#fff',
    fontWeight: '700',
  },
  currentLine: {
    color: '#B8BBD6',
    fontSize: 12,
    marginTop: 14,
  },
});
