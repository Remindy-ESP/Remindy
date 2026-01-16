import React from 'react';
import { Modal, Text, TouchableOpacity, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface DocumentActionsMenuProps {
  readonly visible: boolean;
  readonly onClose: () => void;
  readonly onView: () => void;
  readonly onDownload: () => void;
  readonly onInfo: () => void;
  readonly onRename: () => void;
  readonly onMove: () => void;
  readonly onLink: () => void;
  readonly onDelete: () => void;
}

export default function DocumentActionsMenu({
  visible,
  onClose,
  onView,
  onDownload,
  onInfo,
  onRename,
  onMove,
  onLink,
  onDelete,
}: DocumentActionsMenuProps) {
  const actions = [
    { icon: 'eye-outline', label: 'Visualiser', onPress: onView, color: '#6366f1' },
    { icon: 'download-outline', label: 'Télécharger', onPress: onDownload, color: '#10B981' },
    { icon: 'information-circle-outline', label: 'Informations', onPress: onInfo, color: '#6366f1' },
    { icon: 'create-outline', label: 'Renommer', onPress: onRename, color: '#6366f1' },
    { icon: 'folder-open-outline', label: 'Déplacer', onPress: onMove, color: '#6366f1' },
    { icon: 'link-outline', label: 'Lier à une transaction', onPress: onLink, color: '#6366f1' },
    { icon: 'trash-outline', label: 'Supprimer', onPress: onDelete, color: '#E74C3C' },
  ];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.menu} onPress={(e) => e.stopPropagation()}>
          {actions.map((action, index) => (
            <TouchableOpacity
              key={action.label}
              style={[styles.action, index === actions.length - 1 && styles.lastAction]}
              onPress={() => {
                action.onPress();
                onClose();
              }}
              activeOpacity={0.7}
            >
              <Ionicons name={action.icon as any} size={20} color={action.color} />
              <Text style={[styles.actionText, { color: action.color }]}>{action.label}</Text>
            </TouchableOpacity>
          ))}
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
  menu: {
    backgroundColor: '#1F1F39',
    borderRadius: 12,
    width: '80%',
    maxWidth: 320,
    borderWidth: 1,
    borderColor: '#373848',
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#373848',
  },
  lastAction: {
    borderBottomWidth: 0,
  },
  actionText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 12,
  },
});
