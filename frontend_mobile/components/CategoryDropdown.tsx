import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { Category } from '@/services/api';

interface CategoryDropdownProps {
  categories: Category[];
  emptyLabel: string;
  allLabel: string;
  onSelectAll: () => void;
  onSelect: (name: string) => void;
}

export default function CategoryDropdown({
  categories,
  emptyLabel,
  allLabel,
  onSelectAll,
  onSelect,
}: CategoryDropdownProps) {
  return (
    <View style={styles.container}>
      {categories.length === 0 ? (
        <Text style={styles.emptyText}>{emptyLabel}</Text>
      ) : (
        <>
          <TouchableOpacity style={styles.item} onPress={onSelectAll} activeOpacity={0.7}>
            <Text style={styles.itemText}>{allLabel}</Text>
          </TouchableOpacity>
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={styles.item}
              onPress={() => onSelect(category.name)}
              activeOpacity={0.7}
            >
              <Text style={styles.itemText}>{category.name}</Text>
            </TouchableOpacity>
          ))}
        </>
      )}
    </View>
  );
}

export const categoryDropdownStyles = StyleSheet.create({
  categoriesContainer: {
    position: 'absolute',
    alignSelf: 'center',
    minWidth: 160,
    backgroundColor: '#1B1B3A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2E356F',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
    zIndex: 1000,
  },
  categoryItem: {
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#252545',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e2e8f0',
    textAlign: 'center',
  },
});

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    alignSelf: 'center',
    minWidth: 160,
    backgroundColor: '#1B1B3A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2E356F',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
    zIndex: 1000,
  },
  emptyText: {
    color: '#6b7280',
    padding: 16,
    textAlign: 'center',
    fontSize: 14,
  },
  item: {
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#252545',
  },
  itemText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e2e8f0',
    textAlign: 'center',
  },
});
