import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface FormFeedbackProps {
  error?: string;
  success?: string;
}

export default function FormFeedback({ error, success }: FormFeedbackProps) {
  return (
    <>
      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}
      {success ? (
        <View style={styles.successBox}>
          <Text style={styles.successText}>{success}</Text>
        </View>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
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
