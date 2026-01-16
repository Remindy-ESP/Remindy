import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, Pressable, StyleSheet, ActivityIndicator } from 'react-native';

interface BaseInputModalProps {
  readonly visible: boolean;
  readonly title: string;
  readonly placeholder: string;
  readonly submitText: string;
  readonly initialValue?: string;
  readonly onClose: () => void;
  readonly onSubmit: (value: string) => Promise<void>;
  readonly children?: React.ReactNode;
}

export default function BaseInputModal({
  visible,
  title,
  placeholder,
  submitText,
  initialValue = '',
  onClose,
  onSubmit,
  children,
}: BaseInputModalProps) {
  const [value, setValue] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      setValue(initialValue);
    }
  }, [visible, initialValue]);

  const handleSubmit = async () => {
    if (!value.trim() || value === initialValue) return;
    try {
      setLoading(true);
      await onSubmit(value.trim());
      onClose();
    } catch (error) {
      console.error('Error submitting:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setValue('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <Pressable style={styles.overlay} onPress={handleClose}>
        <Pressable style={styles.modal} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>{title}</Text>
          <TextInput
            style={styles.input}
            placeholder={placeholder}
            placeholderTextColor="#9ca3af"
            value={value}
            onChangeText={setValue}
            autoFocus
          />
          {children}
          <View style={styles.buttons}>
            <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={handleClose} activeOpacity={0.7}>
              <Text style={styles.cancelText}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.submitButton, (!value.trim() || value === initialValue || loading) && styles.disabledButton]}
              onPress={handleSubmit}
              disabled={!value.trim() || value === initialValue || loading}
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
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#000',
    marginBottom: 24,
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
  submitButton: {
    backgroundColor: '#6366f1',
  },
  disabledButton: {
    opacity: 0.5,
  },
  cancelText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '500',
  },
  submitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
