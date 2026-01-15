import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface UploadDocumentButtonProps {
  readonly onPress: () => void;
}

export default function UploadDocumentButton({ onPress }: UploadDocumentButtonProps) {
  return (
    <TouchableOpacity style={styles.button} onPress={onPress} activeOpacity={0.8}>
      <Ionicons name="add-circle" size={20} color="#fff" />
      <Text style={styles.text}>Ajouter un document</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366f1',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
  },
  text: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
