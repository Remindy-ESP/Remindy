import React, { useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useStatistics } from '@/hooks/useStatistics';
import { useExpenseSummary } from '@/hooks/useExpenseSummary';
import { PeriodFilterTabs } from '@/components/statistics/PeriodFilterTabs';
import { ExpenseSummaryHeader } from '@/components/statistics/ExpenseSummaryHeader';
import { ComparisonInfoModal } from '@/components/statistics/ComparisonInfoModal';

export default function StatisticsScreen() {
  const {
    activePeriod,
    setActivePeriod,
    loading,
    error,
    fetchData,
    getStatsForPeriod,
  } = useStatistics();

  const {
    data: summary,
    loading: summaryLoading,
    error: summaryError,
    refetch: refetchSummary,
  } = useExpenseSummary(activePeriod);

  const [infoVisible, setInfoVisible] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      fetchData();
      refetchSummary();
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

      <PeriodFilterTabs selectedPeriod={activePeriod} onPeriodChange={setActivePeriod} />

      {summaryError ? (
        <View style={styles.summaryErrorCard}>
          <Text style={styles.summaryErrorText}>
            Bilan indisponible : {summaryError}
          </Text>
        </View>
      ) : summaryLoading || !summary ? (
        <View style={styles.summaryLoadingCard}>
          <ActivityIndicator size="small" color="#9ca3af" />
        </View>
      ) : (
        <ExpenseSummaryHeader
          periodLabel={summary.periodLabel}
          totalAmount={summary.currentTotal}
          percentageChange={summary.percentageChange}
          trend={summary.trend}
          comparisonLabel={summary.comparisonLabel}
          onInfoPress={() => setInfoVisible(true)}
        />
      )}

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

      <ComparisonInfoModal
        visible={infoVisible}
        period={activePeriod}
        onClose={() => setInfoVisible(false)}
      />
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
  summaryLoadingCard: {
    backgroundColor: '#1a1a3e',
    borderRadius: 12,
    padding: 32,
    marginHorizontal: 16,
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryErrorCard: {
    backgroundColor: '#1a1a3e',
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  summaryErrorText: {
    color: '#ff6b6b',
    fontSize: 13,
    textAlign: 'center',
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
