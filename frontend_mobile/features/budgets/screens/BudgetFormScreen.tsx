import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTranslation } from '@/shared/application/I18nContext';
import { toast } from '@/context/ToastContext';
import { categoryService } from '@/services/api/category.service';
import { subscriptionService } from '@/services/api';
import type { Category, Subscription } from '@/services/api/types';
import {
  BudgetFormFields,
  BudgetFormValues,
} from '../components/BudgetFormFields';
import { useBudget } from '../hooks/useBudget';
import { budgetsApi } from '../api/budgets.api';
import { UpdateBudgetInput } from '../types/budget.types';

const TODAY = new Date().toISOString().slice(0, 10);

const EMPTY_VALUES: BudgetFormValues = {
  name: '',
  amount: 0,
  currency: 'EUR',
  period: 'monthly',
  startDate: TODAY,
  endDate: null,
  categoryId: null,
  isActive: true,
  notes: '',
};

export interface BudgetFormScreenProps {
  budgetId?: string | null;
  onDone?: () => void;
}

export function BudgetFormScreen({
  budgetId = null,
  onDone,
}: BudgetFormScreenProps = {}): React.ReactElement {
  const { t } = useTranslation();
  const isEdit = Boolean(budgetId);
  const { budget, loading: loadingBudget, update } = useBudget(budgetId);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingSubscriptions, setLoadingSubscriptions] = useState(true);
  const [values, setValues] = useState<BudgetFormValues>(EMPTY_VALUES);
  const [selectedSubscriptionIds, setSelectedSubscriptionIds] = useState<string[]>([]);
  const [errors, setErrors] = useState<Partial<Record<keyof BudgetFormValues, string>>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await categoryService.getAll();
        if (!cancelled) setCategories(data);
      } catch {
        if (!cancelled) setCategories([]);
      } finally {
        if (!cancelled) setLoadingCategories(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await subscriptionService.getAll();
        if (!cancelled) setSubscriptions(data);
      } catch {
        if (!cancelled) setSubscriptions([]);
      } finally {
        if (!cancelled) setLoadingSubscriptions(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (budget) {
      setValues({
        name: budget.name,
        amount: budget.amount,
        currency: budget.currency,
        period: budget.period,
        startDate: budget.startDate.slice(0, 10),
        endDate: budget.endDate ? budget.endDate.slice(0, 10) : null,
        categoryId: budget.categoryId,
        isActive: budget.isActive,
        notes: budget.notes ?? '',
      });
      setSelectedSubscriptionIds(budget.subscriptionIds ?? []);
    }
  }, [budget]);

  const toggleSubscription = (id: string) => {
    setSelectedSubscriptionIds(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id],
    );
  };

  const validate = (): boolean => {
    const next: Partial<Record<keyof BudgetFormValues, string>> = {};
    if (!values.name || values.name.trim().length === 0) {
      next.name = t('budgets.form.nameLabel');
    }
    if (!values.amount || values.amount <= 0) {
      next.amount = t('budgets.form.amountLabel');
    }
    if (!values.currency || values.currency.length !== 3) {
      next.currency = t('budgets.form.currencyLabel');
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const payload = {
        name: values.name.trim(),
        amount: values.amount,
        currency: values.currency.toUpperCase(),
        period: values.period,
        startDate: new Date(values.startDate).toISOString(),
        endDate: values.endDate ? new Date(values.endDate).toISOString() : null,
        categoryId: values.categoryId ?? null,
        subscriptionIds: selectedSubscriptionIds,
        isActive: values.isActive ?? true,
        notes: values.notes,
      };

      if (isEdit) {
        const updates: UpdateBudgetInput = { ...payload };
        await update(updates);
      } else {
        await budgetsApi.create(payload);
      }
      if (onDone) onDone();
      else router.back();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const selectionLabel = (() => {
    const count = selectedSubscriptionIds.length;
    if (count === 0) return t('budgets.form.subscriptionsPlaceholder');
    if (count === 1) return t('budgets.form.subscriptionSelected', { count });
    return t('budgets.form.subscriptionsSelected', { count });
  })();

  if (loadingBudget || loadingCategories || loadingSubscriptions) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>
          {isEdit ? t('budgets.editBudget') : t('budgets.addBudget')}
        </Text>
        <BudgetFormFields
          values={values}
          onChange={setValues}
          categories={categories}
          errors={errors}
        />

        {/* Subscription picker */}
        <View style={styles.fieldBlock}>
          <Text style={styles.fieldLabel}>{t('budgets.form.subscriptionsLabel')}</Text>
          <Text style={styles.selectionSummary}>{selectionLabel}</Text>
          {subscriptions.length === 0 ? (
            <Text style={styles.emptyNote}>{t('budgets.form.noSubscriptions')}</Text>
          ) : (
            <View style={styles.subscriptionList}>
              {subscriptions.map(sub => {
                const selected = selectedSubscriptionIds.includes(sub.id);
                return (
                  <TouchableOpacity
                    key={sub.id}
                    style={[styles.subscriptionRow, selected && styles.subscriptionRowSelected]}
                    onPress={() => toggleSubscription(sub.id)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
                      {selected && <Ionicons name="checkmark" size={14} color="#fff" />}
                    </View>
                    <View style={styles.subscriptionInfo}>
                      <Text style={styles.subscriptionName} numberOfLines={1}>
                        {sub.name}
                      </Text>
                      <Text style={styles.subscriptionAmount}>
                        {(sub.amount ?? 0).toFixed(2)} {sub.currency}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, styles.cancelButton]}
          onPress={() => (onDone ? onDone() : router.back())}
        >
          <Text style={styles.cancelText}>{t('budgets.form.cancel')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.submitButton, submitting && styles.disabled]}
          onPress={submit}
          disabled={submitting}
          testID="budget-form-submit"
        >
          <Text style={styles.submitText}>
            {isEdit ? t('budgets.form.submitUpdate') : t('budgets.form.submitCreate')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#11112A' },
  centered: { justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: 16, gap: 16, paddingBottom: 24 },
  title: { color: '#fff', fontSize: 22, fontWeight: '700', marginBottom: 8 },
  footer: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: '#1f2540',
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: { backgroundColor: '#1B1B3A' },
  submitButton: { backgroundColor: '#6366f1' },
  submitText: { color: '#fff', fontWeight: '700' },
  cancelText: { color: '#cbd5f5', fontWeight: '600' },
  disabled: { opacity: 0.6 },
  fieldBlock: {
    backgroundColor: '#1B1B3A',
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  fieldLabel: {
    color: '#9ca3af',
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  selectionSummary: {
    color: '#6366f1',
    fontSize: 13,
    fontWeight: '500',
  },
  emptyNote: {
    color: '#6b7280',
    fontSize: 14,
    fontStyle: 'italic',
  },
  subscriptionList: {
    gap: 8,
    marginTop: 4,
  },
  subscriptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#252545',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  subscriptionRowSelected: {
    borderColor: '#6366f1',
    backgroundColor: '#1e1e40',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#4b5563',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  subscriptionInfo: { flex: 1 },
  subscriptionName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  subscriptionAmount: {
    color: '#9ca3af',
    fontSize: 12,
    marginTop: 2,
  },
});
