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
    minWidth: 146,
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
    overflow: 'hidden',
    zIndex: 1000,
  },
  categoryItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F1F39',
    textAlign: 'center',
  },
});

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    alignSelf: 'center',
    minWidth: 146,
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
    overflow: 'hidden',
    zIndex: 1000,
  },
  emptyText: {
    color: '#999',
    padding: 16,
    textAlign: 'center',
  },
  item: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  itemText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F1F39',
    textAlign: 'center',
  },
});
