import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
  withDelay,
} from 'react-native-reanimated';
import { useEffect } from 'react';
import type { BaseToastProps } from 'react-native-toast-message';

interface ToastIconConfig {
  name: keyof typeof Ionicons.glyphMap;
  color: string;
  bgColor: string;
  borderColor: string;
  accentColor: string;
}

const TOAST_ICONS: Record<string, ToastIconConfig> = {
  success: {
    name: 'checkmark-circle',
    color: '#4ade80',
    bgColor: 'rgba(74, 222, 128, 0.08)',
    borderColor: 'rgba(74, 222, 128, 0.20)',
    accentColor: '#4ade80',
  },
  error: {
    name: 'close-circle',
    color: '#f87171',
    bgColor: 'rgba(248, 113, 113, 0.08)',
    borderColor: 'rgba(248, 113, 113, 0.20)',
    accentColor: '#f87171',
  },
  info: {
    name: 'information-circle',
    color: '#60a5fa',
    bgColor: 'rgba(96, 165, 250, 0.08)',
    borderColor: 'rgba(96, 165, 250, 0.20)',
    accentColor: '#60a5fa',
  },
};

function AnimatedToast({ type, text1, text2 }: { type: string; text1?: string; text2?: string }) {
  const config = TOAST_ICONS[type] || TOAST_ICONS.info;
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(50);
  const iconScale = useSharedValue(0);

  useEffect(() => {
    opacity.value = withSpring(1, { damping: 20, stiffness: 300 });
    scale.value = withSpring(1, { damping: 15, stiffness: 200 });
    translateY.value = withSpring(0, { damping: 20, stiffness: 250 });
    iconScale.value = withDelay(
      150,
      withSequence(
        withSpring(1.3, { damping: 8, stiffness: 300 }),
        withSpring(1, { damping: 12, stiffness: 200 })
      )
    );
  }, []);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { scale: scale.value },
      { translateY: translateY.value },
    ],
  }));

  const iconAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));

  return (
    <Animated.View
      style={[
        styles.toastContainer,
        { borderColor: config.borderColor },
        containerStyle,
      ]}
    >
      <View style={[styles.accentBar, { backgroundColor: config.accentColor }]} />
      <Animated.View style={[styles.iconContainer, iconAnimStyle]}>
        <Ionicons name={config.name} size={24} color={config.color} />
      </Animated.View>
      <View style={styles.textContainer}>
        {text1 ? <Text style={styles.title} numberOfLines={1}>{text1}</Text> : null}
        {text2 ? <Text style={styles.message} numberOfLines={2}>{text2}</Text> : null}
      </View>
    </Animated.View>
  );
}

export const toastConfig = {
  success: (props: BaseToastProps) => (
    <AnimatedToast type="success" text1={props.text1} text2={props.text2} />
  ),
  error: (props: BaseToastProps) => (
    <AnimatedToast type="error" text1={props.text1} text2={props.text2} />
  ),
  info: (props: BaseToastProps) => (
    <AnimatedToast type="info" text1={props.text1} text2={props.text2} />
  ),
};

const styles = StyleSheet.create({
  toastContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 12,
    overflow: 'hidden',
    backgroundColor: '#1E1F3A',
    minHeight: 60,
  },
  accentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  message: {
    color: '#B8BBD6',
    fontSize: 13,
    marginTop: 2,
    lineHeight: 18,
  },
});
