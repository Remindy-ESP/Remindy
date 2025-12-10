import React from 'react';
import { TouchableOpacity, View, StyleSheet } from 'react-native';

interface AddOperationButtonProps {
  readonly onPress: () => void;
}

export default function AddOperationButton({ onPress }: AddOperationButtonProps) {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.plusIcon}>
        <View style={styles.horizontalBar} />
        <View style={styles.verticalBar} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#06071D',
    borderWidth: 1,
    borderColor: '#4D4D8C',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    zIndex: 999,
  },
  plusIcon: {
    width: 26,
    height: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  horizontalBar: {
    position: 'absolute',
    width: 26,
    height: 4,
    backgroundColor: '#4D4D8C',
    borderRadius: 2,
  },
  verticalBar: {
    position: 'absolute',
    width: 4,
    height: 26,
    backgroundColor: '#4D4D8C',
    borderRadius: 2,
  },
});
