import React, { ReactNode } from 'react';
import { Modal, View, Text, TouchableOpacity, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { useTranslation } from '@/context/I18nContext';

interface BaseModalProps {
  readonly visible: boolean;
  readonly title: string;
  readonly onClose: () => void;
  readonly onSubmit: () => void;
  readonly submitText: string;
  readonly submitDisabled?: boolean;
  readonly loading?: boolean;
  readonly children: ReactNode;
}

export default function BaseModal({
  visible,
  title,
  onClose,
  onSubmit,
  submitText,
  submitDisabled = false,
  loading = false,
  children,
}: BaseModalProps) {
  const { t } = useTranslation();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.modal} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>{title}</Text>
          {children}
          <View style={styles.buttons}>
            <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={onClose} activeOpacity={0.7}>
              <Text style={styles.cancelText}>{t('cloud.modals.common.cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.submitButton, (submitDisabled || loading) && styles.disabledButton]}
              onPress={onSubmit}
              disabled={submitDisabled || loading}
              activeOpacity={0.7}
            >
              {loading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.submitText}>{submitText}</Text>}
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export const modalStyles = StyleSheet.create({
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
    marginBottom: 20,
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
  submitButton: {
    backgroundColor: '#6366f1',
  },
  disabledButton: {
    opacity: 0.5,
  },
  cancelText: {
    color: '#cbd5f5',
    fontSize: 15,
    fontWeight: '600',
  },
  submitText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});

const styles = modalStyles;
