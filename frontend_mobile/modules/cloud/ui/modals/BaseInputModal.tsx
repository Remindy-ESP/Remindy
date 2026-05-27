import React, { useState, useEffect } from 'react';
import { TextInput, StyleSheet } from 'react-native';
import BaseModal from './BaseModal';

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
    <BaseModal
      visible={visible}
      title={title}
      submitText={submitText}
      onClose={handleClose}
      onSubmit={handleSubmit}
      submitDisabled={!value.trim() || value === initialValue}
      loading={loading}
    >
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="#9ca3af"
        value={value}
        onChangeText={setValue}
        autoFocus
      />
      {children}
    </BaseModal>
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#000',
    marginBottom: 24,
  },
});
