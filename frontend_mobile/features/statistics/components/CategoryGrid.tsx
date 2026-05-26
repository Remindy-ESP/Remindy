import React from 'react';
import { StyleSheet, View } from 'react-native';
import { CategoryCard, CategoryCardProps } from './CategoryCard';

export interface CategoryGridItem extends Omit<CategoryCardProps, 'testID'> {
  id: string;
}

export interface CategoryGridProps {
  items: CategoryGridItem[];
  testID?: string;
}

export function CategoryGrid({
  items,
  testID = 'category-grid',
}: CategoryGridProps): React.ReactElement {
  return (
    <View style={styles.grid} testID={testID}>
      {items.map((item, index) => (
        <View key={item.id} style={styles.cell}>
          <CategoryCard
            name={item.name}
            icon={item.icon}
            color={item.color}
            amount={item.amount}
            share={item.share}
            currency={item.currency}
            testID={`${testID}-card-${index}`}
          />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  cell: {
    width: '50%',
    paddingHorizontal: 6,
    paddingVertical: 6,
  },
});
