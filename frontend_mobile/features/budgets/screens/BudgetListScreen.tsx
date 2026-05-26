import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTranslation } from '@/context/I18nContext';
import { useBudgets } from '../hooks/useBudgets';
import { BudgetCard } from '../components/BudgetCard';

export interface BudgetListScreenProps {
  onCreatePress?: () => void;
  onItemPress?: (id: string) => void;
}

export function BudgetListScreen({
  onCreatePress,
  onItemPress,
}: BudgetListScreenProps = {}): React.ReactElement {
  const { t } = useTranslation();
  const { budgetsWithSpending, loading, error, refetch } = useBudgets({ withSpending: true });

  const goCreate = () => {
    if (onCreatePress) onCreatePress();
    else router.push('/(stack)/budgets-form');
  };

  const goDetail = (id: string) => {
    if (onItemPress) onItemPress(id);
    else router.push({ pathname: '/(stack)/budgets-form', params: { id } });
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loading}>{t('budgets.loading')}</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.error}>{t('budgets.errorPrefix', { message: error })}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('budgets.title')}</Text>
        <Text style={styles.subtitle}>{t('budgets.subtitle')}</Text>
      </View>

      {budgetsWithSpending.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="wallet-outline" size={64} color="#6b7280" />
          <Text style={styles.emptyTitle}>{t('budgets.emptyTitle')}</Text>
          <Text style={styles.emptySubtitle}>{t('budgets.emptySubtitle')}</Text>
          <TouchableOpacity style={styles.emptyCta} onPress={goCreate} testID="budgets-empty-cta">
            <Text style={styles.emptyCtaText}>{t('budgets.emptyCta')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} tintColor="#6366f1" />}
        >
          {budgetsWithSpending.map(b => (
            <BudgetCard key={b.id} budget={b} onPress={() => goDetail(b.id)} />
          ))}
        </ScrollView>
      )}

      <TouchableOpacity style={styles.fab} onPress={goCreate} testID="budgets-fab">
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
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
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  title: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '700',
  },
  subtitle: {
    color: '#9ca3af',
    marginTop: 4,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 96,
  },
  loading: {
    color: '#9ca3af',
    marginTop: 12,
  },
  error: {
    color: '#ef4444',
    padding: 16,
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 8,
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 12,
  },
  emptySubtitle: {
    color: '#9ca3af',
    textAlign: 'center',
  },
  emptyCta: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#6366f1',
    borderRadius: 12,
  },
  emptyCtaText: {
    color: '#fff',
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
  },
});
