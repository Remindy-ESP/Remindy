import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useTranslation } from '@/shared/application/I18nContext';
import type { Category } from '@/services/api/types';

export interface CategoryPickerProps {
  categories: Category[];
  selectedCategoryId: string | null;
  onSelect: (categoryId: string | null) => void;
  testID?: string;
}

export function CategoryPicker({
  categories,
  selectedCategoryId,
  onSelect,
  testID,
}: CategoryPickerProps): React.ReactElement {
  const { t } = useTranslation();

  return (
    <View testID={testID}>
      <Text style={styles.label}>{t('budgets.form.categoryLabel')}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        <Chip
          label={t('budgets.form.noCategory')}
          selected={selectedCategoryId === null}
          color="#6366f1"
          onPress={() => onSelect(null)}
          testID="category-picker-none"
        />
        {categories.map(c => (
          <Chip
            key={c.id}
            label={c.name}
            selected={selectedCategoryId === c.id}
            color={c.color}
            onPress={() => onSelect(c.id)}
            testID={`category-picker-${c.id}`}
          />
        ))}
      </ScrollView>
    </View>
  );
}

interface ChipProps {
  label: string;
  selected: boolean;
  color: string;
  onPress: () => void;
  testID?: string;
}

function Chip({ label, selected, color, onPress, testID }: ChipProps): React.ReactElement {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.chip,
        selected && { backgroundColor: color, borderColor: color },
      ]}
      testID={testID}
    >
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  label: {
    color: '#9ca3af',
    fontSize: 14,
    marginBottom: 6,
  },
  scroll: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#3b3b5c',
    marginRight: 8,
  },
  chipText: {
    color: '#cbd5f5',
    fontSize: 13,
    fontWeight: '600',
  },
  chipTextSelected: {
    color: '#fff',
  },
});
