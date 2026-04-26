import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface PlaceholderScreenProps {
  title: string;
  subtitle: string;
  message?: string;
}

export default function PlaceholderScreen({
  title,
  subtitle,
  message = 'Cette page sera disponible bientot.',
}: PlaceholderScreenProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{title}</Text>
        <Text style={styles.headerSubtitle}>{subtitle}</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>En preparation</Text>
          <Text style={styles.cardText}>{message}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#11112A',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    backgroundColor: '#11112A',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 6,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#B8BBD6',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    backgroundColor: '#373848',
    borderRadius: 14,
    padding: 18,
  },
  cardTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  cardText: {
    color: '#D3D6E8',
    fontSize: 14,
    lineHeight: 20,
  },
});

