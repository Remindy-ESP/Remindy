import React from 'react';
import {
  Alert,
  Clipboard,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import CoachMarkTarget from '@/components/system/CoachMarkTarget';
import { COACH_MARK_TARGETS } from '@/features/coach-marks/coach-marks.config';
import { useTranslation } from '@/context/I18nContext';

type PromoItem = {
  id: string;
  brand: string;
  subtitle: string;
  discountLabel: string;
  promoCode: string;
  partnerUrl: string;
  logo: any;
};

const PROMOS: PromoItem[] = [
  {
    id: 'amazon',
    brand: 'Amazon',
    subtitle: 'Offre partenaire',
    discountLabel: '-30%',
    promoCode: 'AMZREMI30',
    partnerUrl: 'https://www.amazon.fr/prime',
    logo: require('../../assets/images/promo/amazon.png'),
  },
  {
    id: 'spotify',
    brand: 'Spotify',
    subtitle: 'Abonnement Premium',
    discountLabel: '-20%',
    promoCode: 'SPOTI20REM',
    partnerUrl: 'https://www.spotify.com/fr/premium/',
    logo: require('../../assets/images/promo/Spotify.png'),
  },
  {
    id: 'edf',
    brand: 'EDF',
    subtitle: 'Offre energie',
    discountLabel: '-35%',
    promoCode: 'EDFREMINDY35',
    partnerUrl: 'https://particulier.edf.fr/',
    logo: require('../../assets/images/promo/edf.png'),
  },
  {
    id: 'fitness-park',
    brand: 'Fitness Park',
    subtitle: 'Abonnement salle',
    discountLabel: '-15%',
    promoCode: 'FITPARK15',
    partnerUrl: 'https://www.fitnesspark.fr/',
    logo: require('../../assets/images/promo/fitnesspark.png'),
  },
];

export default function PromotionScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  const handleCopyPromoCode = (promo: PromoItem) => {
    Clipboard.setString(promo.promoCode);
    Alert.alert(
      t('promotion.copiedTitle'),
      t('promotion.copiedMessage', { brand: promo.brand, code: promo.promoCode }),
    );
  };

  const handleOpenPartnerWebsite = async (promo: PromoItem) => {
    try {
      const supported = await Linking.canOpenURL(promo.partnerUrl);
      if (!supported) {
        Alert.alert(
          t('promotion.linkUnavailableTitle'),
          t('promotion.linkUnavailableMessage', { url: promo.partnerUrl }),
        );
        return;
      }

      await Linking.openURL(promo.partnerUrl);
    } catch {
      Alert.alert(t('common.error'), t('promotion.openErrorMessage'));
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.8}>
            <Ionicons name="chevron-back" size={20} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerTextWrap}>
            <Text style={styles.title}>{t('promotion.title')}</Text>
            <Text style={styles.subtitle}>{t('promotion.subtitle')}</Text>
          </View>
        </View>

        <View style={styles.listCard}>
          {PROMOS.map((promo, index) => (
            <View key={promo.id} style={styles.rowWrapper}>
              <CoachMarkTarget
                targetKey={
                  index === 0 ? COACH_MARK_TARGETS.promotionFirstRow : `promo-row-${promo.id}-noop`
                }
              >
              <Pressable
                testID={`promo-row-${promo.id}`}
                style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
                onPress={() => void handleOpenPartnerWebsite(promo)}
              >
                  <Image source={promo.logo} style={styles.logo} resizeMode="contain" />

                  <View style={styles.mainRowContent}>
                    <View style={styles.brandAndCodeRow}>
                      <Text style={styles.brandText} numberOfLines={1}>
                        {promo.brand}
                      </Text>
                      <Text style={styles.codeValue} numberOfLines={1}>
                        {promo.promoCode}
                      </Text>
                      <Pressable
                        testID={`copy-code-${promo.id}`}
                        accessibilityRole="button"
                        accessibilityLabel={t('promotion.copyAccessibility', { brand: promo.brand })}
                        style={({ pressed }) => [
                          styles.iconButton,
                          pressed && styles.iconButtonPressed,
                        ]}
                        onPress={(event) => {
                          event?.stopPropagation?.();
                          handleCopyPromoCode(promo);
                        }}
                      >
                        <Ionicons name="copy-outline" size={14} color="#FFFFFF" />
                      </Pressable>
                    </View>
                  </View>

                  <View style={styles.rightActionsInline}>
                    <Text style={styles.discountText}>{promo.discountLabel}</Text>

                    <Pressable
                      testID={`open-link-${promo.id}`}
                      accessibilityRole="button"
                      accessibilityLabel={t('promotion.openAccessibility', { brand: promo.brand })}
                      style={({ pressed }) => [
                        styles.linkButton,
                        pressed && styles.linkButtonPressed,
                      ]}
                      onPress={(event) => {
                        event?.stopPropagation?.();
                        void handleOpenPartnerWebsite(promo);
                      }}
                    >
                      <Text style={styles.linkButtonText}>WWW</Text>
                    </Pressable>
                  </View>
              </Pressable>
              </CoachMarkTarget>

              {index < PROMOS.length - 1 ? <View style={styles.separator} /> : null}
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#090A2E',
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 4,
    paddingBottom: 28,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 2,
    paddingBottom: 10,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#373848',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTextWrap: {
    flex: 1,
  },
  title: {
    color: '#F6F7FB',
    fontSize: 34,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  subtitle: {
    color: '#C0C4DE',
    fontSize: 13,
    marginTop: 4,
    textAlign: 'center',
  },
  listCard: {
    backgroundColor: '#0B0D38',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  rowWrapper: {
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    borderRadius: 12,
  },
  rowPressed: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    transform: [{ scale: 0.995 }],
  },
  logo: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  mainRowContent: {
    flex: 1,
    minWidth: 0,
    paddingRight: 6,
  },
  brandAndCodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minWidth: 0,
  },
  brandText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    flexShrink: 1,
  },
  codeValue: {
    color: '#DDE1FF',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.2,
    backgroundColor: '#151B56',
    borderWidth: 1,
    borderColor: '#2A347A',
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 3,
    overflow: 'hidden',
    flexShrink: 1,
  },
  iconButton: {
    width: 28,
    height: 28,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#32408D',
    backgroundColor: '#1A2168',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.96 }],
    backgroundColor: '#242D81',
  },
  rightActionsInline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  discountText: {
    color: '#F4F6FF',
    fontSize: 17,
    fontWeight: '700',
  },
  linkButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  linkButtonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.96 }],
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  linkButtonText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.2,
    lineHeight: 10,
    textAlign: 'center',
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.16)',
    marginLeft: 4,
    marginRight: 4,
  },
});
