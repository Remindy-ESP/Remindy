import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation, type SupportedLanguage } from '@/context/I18nContext';
import ScreenHeader from '@/components/ScreenHeader';

export default function ProfilePreferencesScreen() {
  const { t, language, setLanguage } = useTranslation();

  const languageOptions: { code: SupportedLanguage; label: string; testID: string }[] = [
    {
      code: 'fr',
      label: t('profile.preferences.languageOptions.fr'),
      testID: 'language-switcher-fr',
    },
    {
      code: 'en',
      label: t('profile.preferences.languageOptions.en'),
      testID: 'language-switcher-en',
    },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <ScreenHeader title={t('profile.preferences.title')} subtitle={t('profile.preferences.subtitle')} />

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('profile.preferences.language')}</Text>
        <Text style={styles.cardText}>{t('profile.preferences.message')}</Text>

        {languageOptions.map((option) => {
          const isSelected = language === option.code;
          return (
            <TouchableOpacity
              key={option.code}
              testID={option.testID}
              style={styles.row}
              onPress={() => {
                void setLanguage(option.code);
              }}
              activeOpacity={0.8}
            >
              <View style={styles.rowLeft}>
                <View style={styles.rowIconWrap}>
                  <Ionicons name="globe-outline" size={18} color="#C9CCF4" />
                </View>
                <Text style={styles.rowLabel}>{option.label}</Text>
              </View>
              {isSelected ? (
                <Ionicons name="checkmark" size={20} color="#4ade80" />
              ) : (
                <Ionicons name="chevron-forward" size={18} color="#8E93B7" />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#11112A',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 28,
  },
  card: {
    backgroundColor: '#373848',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  cardTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
    paddingHorizontal: 2,
  },
  cardText: {
    color: '#D3D6E8',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rowIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#1F2140',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 12,
  },
});
