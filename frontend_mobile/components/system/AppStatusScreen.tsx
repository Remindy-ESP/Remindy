import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

type Action = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  testID?: string;
};

type Props = {
  code: '404' | '500';
  title: string;
  message: string;
  actions: Action[];
};

export default function AppStatusScreen({ code, title, message, actions }: Props) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.badgeWrap}>
          <View style={styles.badge}>
            <Ionicons
              name={code === '404' ? 'search-outline' : 'alert-circle-outline'}
              size={22}
              color="#E6E8FF"
            />
            <Text style={styles.badgeCode}>{code}</Text>
          </View>
        </View>

        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>

        <View style={styles.actionsWrap}>
          {actions.map(action => (
            <TouchableOpacity
              key={`${action.label}-${action.variant ?? 'primary'}`}
              testID={action.testID}
              style={[
                styles.button,
                action.variant === 'secondary' ? styles.buttonSecondary : styles.buttonPrimary,
              ]}
              onPress={action.onPress}
              activeOpacity={0.85}
            >
              <Text
                style={[
                  styles.buttonText,
                  action.variant === 'secondary'
                    ? styles.buttonTextSecondary
                    : styles.buttonTextPrimary,
                ]}
              >
                {action.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#06071D',
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  badgeWrap: {
    marginBottom: 18,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#16183D',
    borderColor: '#313984',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  badgeCode: {
    color: '#E6E8FF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 10,
  },
  message: {
    color: '#BCC2E7',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    maxWidth: 360,
    marginBottom: 22,
  },
  actionsWrap: {
    width: '100%',
    gap: 10,
  },
  button: {
    width: '100%',
    borderRadius: 14,
    paddingVertical: 13,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  buttonPrimary: {
    backgroundColor: '#4B4FC9',
    borderColor: '#6366f1',
  },
  buttonSecondary: {
    backgroundColor: '#151736',
    borderColor: '#2E356F',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  buttonTextPrimary: {
    color: '#FFFFFF',
  },
  buttonTextSecondary: {
    color: '#DCE0FF',
  },
});

