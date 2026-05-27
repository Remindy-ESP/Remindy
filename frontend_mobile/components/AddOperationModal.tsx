import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Pressable,
} from 'react-native';
import { useTranslation } from '@/context/I18nContext';

interface AddOperationModalProps {
  readonly visible: boolean;
  readonly onClose: () => void;
  readonly onManualEntry: () => void;
  readonly onPdfInsert: () => void;
}

export default function AddOperationModal({
  visible,
  onClose,
  onManualEntry,
  onPdfInsert,
}: AddOperationModalProps) {
  const { t } = useTranslation();
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.modalContainer} onPress={(e) => e.stopPropagation()}>
          {/* Close Button */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <View style={styles.closeIcon}>
              <View style={styles.closeBar1} />
              <View style={styles.closeBar2} />
            </View>
          </TouchableOpacity>

          {/* Title */}
          <Text style={styles.title}>{t('common.addOperation.title')}</Text>

          {/* Manual Entry Button */}
          <TouchableOpacity
            style={styles.manualButton}
            onPress={onManualEntry}
            activeOpacity={0.7}
          >
            <Text style={styles.manualButtonText}>{t('common.addOperation.manual')}</Text>
          </TouchableOpacity>

          {/* Divider */}
          <Text style={styles.divider}>{t('common.or')}</Text>

          {/* PDF Insert Button */}
          <TouchableOpacity
            style={styles.pdfButton}
            onPress={onPdfInsert}
            activeOpacity={0.7}
          >
            <Text style={styles.pdfButtonText}>{t('common.addOperation.pdf')}</Text>
            <View style={styles.plusIcon}>
              <View style={styles.plusHorizontal} />
              <View style={styles.plusVertical} />
            </View>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#1B1B3A',
    borderRadius: 16,
    padding: 32,
    width: '85%',
    maxWidth: 400,
    position: 'relative',
    borderWidth: 1,
    borderColor: '#2E356F',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  closeIcon: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBar1: {
    position: 'absolute',
    width: 20,
    height: 2,
    backgroundColor: '#9ca3af',
    transform: [{ rotate: '45deg' }],
  },
  closeBar2: {
    position: 'absolute',
    width: 20,
    height: 2,
    backgroundColor: '#9ca3af',
    transform: [{ rotate: '-45deg' }],
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 28,
    color: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#2E356F',
    paddingBottom: 16,
  },
  manualButton: {
    backgroundColor: '#252545',
    borderWidth: 1,
    borderColor: '#2E356F',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  manualButtonText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    color: '#e2e8f0',
  },
  divider: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 20,
    color: '#6b7280',
  },
  pdfButton: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  pdfButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  plusIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  plusHorizontal: {
    position: 'absolute',
    width: 12,
    height: 1.5,
    backgroundColor: '#FFFFFF',
    borderRadius: 1,
  },
  plusVertical: {
    position: 'absolute',
    width: 1.5,
    height: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 1,
  },
});
