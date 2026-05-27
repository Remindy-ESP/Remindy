import React, { useState } from 'react';
import {
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  Pressable,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface PickerItem {
  label: string;
  value: string;
}

interface AppPickerProps {
  items: PickerItem[];
  selectedValue: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
}

export default function AppPicker({
  items,
  selectedValue,
  onValueChange,
  placeholder,
}: AppPickerProps) {
  const [open, setOpen] = useState(false);

  const selected = items.find((i) => i.value === selectedValue);
  const displayLabel = selected?.label ?? placeholder ?? '';

  const handleSelect = (value: string) => {
    onValueChange(value);
    setOpen(false);
  };

  return (
    <>
      <TouchableOpacity style={styles.trigger} onPress={() => setOpen(true)} activeOpacity={0.7}>
        <Text style={styles.triggerText} numberOfLines={1}>
          {displayLabel}
        </Text>
        <Ionicons name="chevron-down" size={16} color="#9ca3af" />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.overlay} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <FlatList
              data={items}
              keyExtractor={(item) => item.value}
              showsVerticalScrollIndicator={true}
              indicatorStyle="white"
              style={styles.list}
              renderItem={({ item }) => {
                const isSelected = item.value === selectedValue;
                return (
                  <TouchableOpacity
                    style={[styles.item, isSelected && styles.itemSelected]}
                    onPress={() => handleSelect(item.value)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.itemText, isSelected && styles.itemTextSelected]}>
                      {item.label}
                    </Text>
                    {isSelected && (
                      <Ionicons name="checkmark" size={16} color="#6366f1" />
                    )}
                  </TouchableOpacity>
                );
              }}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1a1a3e',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3d3d6f',
    paddingHorizontal: 12,
    paddingVertical: 13,
    gap: 8,
  },
  triggerText: {
    color: '#fff',
    fontSize: 15,
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  sheet: {
    backgroundColor: '#1B1B3A',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2E356F',
    width: '100%',
    maxWidth: 400,
    maxHeight: 400,
    overflow: 'hidden',
  },
  list: {
    flexGrow: 0,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#252545',
  },
  itemSelected: {
    backgroundColor: 'rgba(99,102,241,0.12)',
  },
  itemText: {
    color: '#e2e8f0',
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
  },
  itemTextSelected: {
    color: '#818cf8',
    fontWeight: '700',
  },
});
