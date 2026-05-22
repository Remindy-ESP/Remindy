import React from 'react';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { type Period } from '@/types/statistics';

interface ComparisonInfoModalProps {
  visible: boolean;
  period: Period;
  onClose: () => void;
}

export function ComparisonInfoModal({ visible, period, onClose }: ComparisonInfoModalProps) {
  const { t } = useTranslation('statistics');
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose} testID="comparison-info-overlay">
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <Text style={styles.title}>{t(`periods.${period}`)}</Text>
            <TouchableOpacity
              onPress={onClose}
              testID="comparison-info-close"
              accessibilityLabel={t('comparison.closeLabel')}
              hitSlop={8}
            >
              <Text style={styles.closeIcon}>✕</Text>
            </TouchableOpacity>
          </View>
          <Text testID="comparison-info-text" style={styles.body}>
            {t(`comparison.info.${period}`)}
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
