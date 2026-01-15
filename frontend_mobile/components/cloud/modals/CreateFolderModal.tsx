import React, { useState } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, Pressable, StyleSheet, ActivityIndicator } from 'react-native';

interface CreateFolderModalProps {
  readonly visible: boolean;
  readonly onClose: () => void;
  readonly onSubmit: (name: string, color?: string) => Promise<void>;
}

export default function CreateFolderModal({ visible, onClose, onSubmit }: CreateFolderModalProps) {
  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState('#6366f1');
  const [loading, setLoading] = useState(false);

  const colors = ['#6366f1', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  const handleSubmit = async () => {
    if (!name.trim()) return;
    try {
      setLoading(true);
      await onSubmit(name.trim(), selectedColor);
      setName('');
      setSelectedColor('#6366f1');
      onClose();
    } catch (error) {
      console.error('Error creating folder:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setName('');
    setSelectedColor('#6366f1');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <Pressable style={styles.overlay} onPress={handleClose}>
        <Pressable style={styles.modal} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>Nouveau dossier</Text>
          <TextInput
            style={styles.input}
            placeholder="Nom du dossier"
            placeholderTextColor="#9ca3af"
            value={name}
            onChangeText={setName}
            autoFocus
          />
          <Text style={styles.label}>Couleur</Text>
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
          <View style={styles.buttons}>
            <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={handleClose} activeOpacity={0.7}>
              <Text style={styles.cancelText}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.submitButton, (!name.trim() || loading) && styles.disabledButton]}
              onPress={handleSubmit}
              disabled={!name.trim() || loading}
              activeOpacity={0.7}
            >
              {loading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.submitText}>Créer</Text>}
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
    marginBottom: 16,
  },
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
