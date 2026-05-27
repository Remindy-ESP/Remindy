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
    width: 50,
    height: 50,
    borderRadius: 25,
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
    opacity: 0.6,
  },
  plusIcon: {
    width: 22,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  horizontalBar: {
    position: 'absolute',
    width: 22,
    height: 3.5,
    backgroundColor: '#4D4D8C',
    borderRadius: 2,
  },
  verticalBar: {
    position: 'absolute',
    width: 3.5,
    height: 22,
    backgroundColor: '#4D4D8C',
    borderRadius: 2,
  },
});
