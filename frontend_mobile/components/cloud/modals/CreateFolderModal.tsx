import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import BaseInputModal from './BaseInputModal';

interface CreateFolderModalProps {
  readonly visible: boolean;
  readonly onClose: () => void;
  readonly onSubmit: (name: string, color?: string) => Promise<void>;
}

export default function CreateFolderModal({ visible, onClose, onSubmit }: CreateFolderModalProps) {
  const { t } = useTranslation('common');
  const [selectedColor, setSelectedColor] = useState('#6366f1');

  const colors = ['#6366f1', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  const handleSubmit = async (name: string) => {
    await onSubmit(name, selectedColor);
    setSelectedColor('#6366f1');
  };

  const handleClose = () => {
    setSelectedColor('#6366f1');
    onClose();
  };

  return (
    <BaseInputModal
      visible={visible}
      title={t('createFolder.title')}
      placeholder={t('createFolder.placeholder')}
      submitText={t('actions.create')}
      onClose={handleClose}
      onSubmit={handleSubmit}
    >
      <View>
        <Text style={styles.label}>{t('createFolder.color')}</Text>
        <View style={styles.colorsContainer}>
          {colors.map((color) => (
            <TouchableOpacity
              key={color}
              style={[styles.colorOption, { backgroundColor: color }, selectedColor === color && styles.selectedColor]}
              onPress={() => setSelectedColor(color)}
              activeOpacity={0.7}
            />
          ))}
        </View>
      </View>
    </BaseInputModal>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
    marginBottom: 12,
  },
  colorsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  selectedColor: {
    borderWidth: 3,
    borderColor: '#000',
  },
});
