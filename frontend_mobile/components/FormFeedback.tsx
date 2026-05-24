import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface FormFeedbackProps {
  error?: string;
  success?: string;
  variant?: 'dark' | 'light';
}

export default function FormFeedback({ error, success, variant = 'dark' }: FormFeedbackProps) {
  const s = variant === 'light' ? light : dark;
  return (
    <>
      {error ? (
        <View style={s.errorBox}>
          <Text style={s.errorText}>{error}</Text>
        </View>
      ) : null}
      {success ? (
        <View style={s.successBox}>
          <Text style={s.successText}>{success}</Text>
        </View>
      ) : null}
    </>
  );
}

const dark = StyleSheet.create({
  errorBox: {
    backgroundColor: '#4B242C',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#A6475A',
  },
  errorText: {
    color: '#FFD7DE',
    fontSize: 13,
  },
  successBox: {
    backgroundColor: '#1E4732',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#3C9B6A',
  },
  successText: {
    color: '#D3FFEA',
    fontSize: 13,
  },
});

const light = StyleSheet.create({
  errorBox: {
    backgroundColor: '#fee2e2',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  errorText: {
    color: '#991b1b',
    fontSize: 14,
  },
  successBox: {
    backgroundColor: '#dcfce7',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  successText: {
    color: '#166534',
    fontSize: 14,
  },
});
