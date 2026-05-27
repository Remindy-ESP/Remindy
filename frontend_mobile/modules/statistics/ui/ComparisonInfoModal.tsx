import React from 'react';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { type Period } from '@/types/statistics';
import { useTranslation } from '@/shared/application/I18nContext';

interface ComparisonInfoModalProps {
  visible: boolean;
  period: Period;
  onClose: () => void;
}

export function ComparisonInfoModal({ visible, period, onClose }: ComparisonInfoModalProps) {
  const { t } = useTranslation();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose} testID="comparison-info-overlay">
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <Text style={styles.title}>{t(`statistics.periods.${period}`)}</Text>
            <TouchableOpacity
              onPress={onClose}
              testID="comparison-info-close"
              accessibilityLabel={t('statistics.comparison.closeAccessibility')}
              hitSlop={8}
            >
              <Text style={styles.closeIcon}>✕</Text>
            </TouchableOpacity>
          </View>
          <Text testID="comparison-info-text" style={styles.body}>
            {t(`statistics.comparison.info.${period}`)}
          </Text>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#1a1a3e',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 420,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  closeIcon: {
    color: '#9ca3af',
    fontSize: 18,
  },
  body: {
    color: '#e5e7eb',
    fontSize: 14,
    lineHeight: 20,
  },
});

export default ComparisonInfoModal;
