import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Folder } from '@/services/api';

interface FolderNavigationBarProps {
  readonly currentFolder: Folder | null;
  readonly folderPath: Folder[];
  readonly onNavigate: (folderId: string | null) => void;
}

export default function FolderNavigationBar({ currentFolder: _currentFolder, folderPath, onNavigate }: FolderNavigationBarProps) {
  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity style={styles.item} onPress={() => onNavigate(null)} activeOpacity={0.7}>
          <Ionicons name="home" size={16} color="#6366f1" />
          <Text style={styles.itemText}>Accueil</Text>
        </TouchableOpacity>
        {folderPath.map((folder) => (
          <View key={folder.id} style={styles.itemWrapper}>
            <Ionicons name="chevron-forward" size={16} color="#9ca3af" style={styles.separator} />
            <TouchableOpacity style={styles.item} onPress={() => onNavigate(folder.id)} activeOpacity={0.7}>
              <Text style={styles.itemText}>{folder.name}</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#06071D',
    borderBottomWidth: 1,
    borderBottomColor: '#373848',
    paddingVertical: 8,
  },
  scrollContent: {
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  itemWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  itemText: {
    color: '#fff',
    fontSize: 14,
    marginLeft: 4,
  },
  separator: {
    marginHorizontal: 8,
  },
});
