import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function AbonnementScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Abonnement</Text>
        <Text style={styles.headerSubtitle}>
          Gérez votre abonnement
        </Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.placeholder}>Contenu Abonnement</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a3e',
  },
  header: {
    padding: 20,
    backgroundColor: '#1a1a3e',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#e0e0e0',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  placeholder: {
    fontSize: 18,
    color: '#fff',
  },
});
