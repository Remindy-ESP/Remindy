import React, { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useTranslation } from '@/shared/application/I18nContext';

interface DeleteConfirmationModalProps {
  readonly visible: boolean;
  readonly title: string;
  readonly message: string;
  readonly onClose: () => void;
  readonly onConfirm: () => Promise<void>;
}

export default function DeleteConfirmationModal({ visible, title, message, onClose, onConfirm }: DeleteConfirmationModalProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    try {
      setLoading(true);
      await onConfirm();
      onClose();
    } catch (error) {
      console.error('Error deleting:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.modal} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.buttons}>
            <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={onClose} activeOpacity={0.7}>
              <Text style={styles.cancelText}>{t('cloud.modals.common.cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.deleteButton, loading && styles.disabledButton]}
              onPress={handleConfirm}
              disabled={loading}
              activeOpacity={0.7}
            >
              {loading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.deleteText}>{t('cloud.modals.common.delete')}</Text>}
            </TouchableOpacity>
          </View>
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
  modal: {
    backgroundColor: '#1B1B3A',
    borderRadius: 16,
    padding: 24,
    width: '85%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: '#2E356F',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 10,
  },
  message: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 24,
    lineHeight: 20,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#252545',
    borderWidth: 1,
    borderColor: '#2E356F',
  },
  deleteButton: {
    backgroundColor: '#7f1d1d',
    borderWidth: 1,
    borderColor: '#E74C3C',
  },
  disabledButton: {
    opacity: 0.5,
  },
  cancelText: {
    color: '#cbd5f5',
    fontSize: 15,
    fontWeight: '600',
  },
  deleteText: {
    color: '#fca5a5',
    fontSize: 15,
    fontWeight: '700',
  },
});
