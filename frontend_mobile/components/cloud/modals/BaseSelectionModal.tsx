import React, { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import BaseModal from './BaseModal';

interface BaseSelectionModalProps {
  readonly visible: boolean;
  readonly title: string;
  readonly submitText: string;
  readonly onClose: () => void;
  readonly onSubmit: () => Promise<void>;
  readonly children: React.ReactNode;
}

export default function BaseSelectionModal({
  visible,
  title,
  submitText,
  onClose,
  onSubmit,
  children,
}: BaseSelectionModalProps) {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      await onSubmit();
      onClose();
    } catch (error) {
      console.error('Error submitting:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <BaseModal
      visible={visible}
      title={title}
      submitText={submitText}
      onClose={onClose}
      onSubmit={handleSubmit}
      loading={loading}
    >
      <ScrollView style={styles.list}>{children}</ScrollView>
    </BaseModal>
  );
}

const styles = StyleSheet.create({
  list: {
    maxHeight: 300,
    marginBottom: 16,
  },
});
