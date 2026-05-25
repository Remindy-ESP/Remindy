import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Folder } from '@/services/api';
import { useTranslation } from '@/context/I18nContext';

interface FolderCardProps {
  readonly folder: Folder;
  readonly onPress: () => void;
  readonly onMenuPress: () => void;
}

export default function FolderCard({ folder, onPress, onMenuPress }: FolderCardProps) {
  const { t } = useTranslation();
  const folderColor = folder.color || '#6366f1';
  const count = folder.documentCount || 0;

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.iconContainer, { backgroundColor: folderColor + '20' }]}>
        <Ionicons name="folder" size={24} color={folderColor} />
      </View>
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={1}>
          {folder.name}
        </Text>
        <Text style={styles.count}>
          {t('cloud.documentCount', { count })}
        </Text>
      </View>
      {!folder.isDefault && (
        <TouchableOpacity onPress={onMenuPress} style={styles.menuButton} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="ellipsis-vertical" size={20} color="#9ca3af" />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F1F39',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#373848',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  name: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  count: {
    color: '#9ca3af',
    fontSize: 12,
  },
  menuButton: {
    padding: 4,
  },
});
