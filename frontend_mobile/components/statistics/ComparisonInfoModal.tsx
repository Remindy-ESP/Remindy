import React from 'react';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { PERIOD_LABELS, type Period } from '@/types/statistics';

interface ComparisonInfoModalProps {
  visible: boolean;
  period: Period;
  onClose: () => void;
}

const INFO_TEXTS: Record<Period, string> = {
  day:
    "Comparaison du cumul des dépenses depuis le début du mois jusqu'au jour actuel avec la même période du mois précédent.\n" +
    'Exemple : du 1er au 5 octobre vs du 1er au 5 septembre.',
  week:
    'Comparaison du cumul des dépenses de la semaine passée avec la semaine précédente.\n' +
    'Exemple : semaine du 6 octobre, à celle du 13 octobre',
  month:
    'Comparaison du total dépensé depuis le début du mois avec le mois précédent. Même si en début de mois le comparo sera indécent.\n' +
    'Exemple : octobre vs septembre.',
  year:
    "Comparaison des dépenses de l'année actuelle avec celle de l'année précédente.\n" +
    'Exemple : 2025 vs 2024.',
};

export function ComparisonInfoModal({ visible, period, onClose }: ComparisonInfoModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose} testID="comparison-info-overlay">
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <Text style={styles.title}>{PERIOD_LABELS[period]}</Text>
            <TouchableOpacity
              onPress={onClose}
              testID="comparison-info-close"
              accessibilityLabel="Fermer"
              hitSlop={8}
            >
              <Text style={styles.closeIcon}>✕</Text>
            </TouchableOpacity>
          </View>
          <Text testID="comparison-info-text" style={styles.body}>
            {INFO_TEXTS[period]}
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
