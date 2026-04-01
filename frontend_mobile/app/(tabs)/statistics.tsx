import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useStatistics, type TimePeriod } from '@/hooks/useStatistics';

export default function StatisticsScreen() {
  const {
    activePeriod,
    setActivePeriod,
    timePeriods,
    loading,
    error,
    fetchData,
    getStatsForPeriod,
  } = useStatistics();

  useFocusEffect(
    React.useCallback(() => {
      fetchData();
    }, [])
  );

  const stats = getStatsForPeriod(activePeriod);

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#4f46e5" />
        <Text style={styles.loadingText}>Chargement des statistiques...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>Erreur : {error}</Text>
        <Text style={styles.errorSubtext}>
          Vérifiez que le serveur est lancé et votre connexion réseau
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Statistiques</Text>
        <Text style={styles.headerSubtitle}>
          Consultez vos statistiques
        </Text>
      </View>

      {/* Period Filter Tabs */}
      <View style={styles.periodSection}>
        <View style={styles.periodMenu}>
          {timePeriods.map((period) => (
            <TouchableOpacity
              key={period.key}
              testID={`period-${period.key}`}
              style={[
                styles.periodTab,
                activePeriod === period.key
                  ? styles.periodTabActive
                  : styles.periodTabInactive,
              ]}
              onPress={() => setActivePeriod(period.key)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.periodTabText,
                  activePeriod === period.key
                    ? styles.periodTabTextActive
                    : styles.periodTabTextInactive,
                ]}
              >
                {period.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Summary Cards */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total dépenses</Text>
          <Text style={styles.summaryValue}>{stats.totalExpenses.toFixed(2)}€</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Transactions</Text>
          <Text style={styles.summaryValue}>{stats.transactionCount}</Text>
        </View>
      </View>

      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, styles.summaryCardFull]}>
          <Text style={styles.summaryLabel}>Moyenne par transaction</Text>
          <Text style={styles.summaryValue}>{stats.averageTransaction.toFixed(2)}€</Text>
        </View>
      </View>

      {/* Category Breakdown */}
      <View style={styles.breakdownSection}>
        <Text style={styles.breakdownTitle}>Répartition par catégorie</Text>
        {stats.categoryBreakdown.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>
              Aucune dépense pour cette période
            </Text>
          </View>
        ) : (
          stats.categoryBreakdown.map((cat) => (
            <View key={cat.name} style={styles.categoryRow}>
              <View style={styles.categoryLeft}>
                <Text style={styles.categoryIcon}>{cat.icon}</Text>
                <View>
                  <Text style={styles.categoryName}>{cat.name}</Text>
                  <Text style={styles.categoryCount}>
                    {cat.count} transaction{cat.count > 1 ? 's' : ''}
                  </Text>
                </View>
              </View>
              <Text style={styles.categoryAmount}>{cat.total.toFixed(2)}€</Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#11112A',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    color: '#fff',
    marginTop: 16,
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 16,
    textAlign: 'center',
  },
  errorSubtext: {
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  header: {
    padding: 20,
    backgroundColor: '#11112A',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#e0e7ff',
  },
  periodSection: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  periodMenu: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  periodTab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodTabActive: {
    backgroundColor: '#000',
  },
  periodTabInactive: {
    backgroundColor: 'transparent',
  },
  periodTabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  periodTabTextActive: {
    color: '#fff',
  },
  periodTabTextInactive: {
    color: '#000',
    opacity: 0.6,
  },
  summaryRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 12,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#2a2a5e',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  summaryCardFull: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 13,
    color: '#9ca3af',
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  breakdownSection: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 32,
  },
  breakdownTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  emptyCard: {
    backgroundColor: '#2a2a5e',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#2a2a5e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  categoryName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  categoryCount: {
    color: '#9ca3af',
    fontSize: 12,
    marginTop: 2,
  },
  categoryAmount: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
