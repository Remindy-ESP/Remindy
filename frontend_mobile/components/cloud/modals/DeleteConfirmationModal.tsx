import React, { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, Pressable, StyleSheet, ActivityIndicator } from 'react-native';

interface DeleteConfirmationModalProps {
  readonly visible: boolean;
  readonly title: string;
  readonly message: string;
  readonly onClose: () => void;
  readonly onConfirm: () => Promise<void>;
}

export default function DeleteConfirmationModal({ visible, title, message, onClose, onConfirm }: DeleteConfirmationModalProps) {
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
              <Text style={styles.cancelText}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.deleteButton, loading && styles.disabledButton]}
              onPress={handleConfirm}
              disabled={loading}
              activeOpacity={0.7}
            >
              {loading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.deleteText}>Supprimer</Text>}
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
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    width: '85%',
    maxWidth: 400,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  message: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
    lineHeight: 20,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
  },
  deleteButton: {
    backgroundColor: '#E74C3C',
  },
  disabledButton: {
    opacity: 0.5,
  },
  cancelText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '500',
  },
  deleteText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
