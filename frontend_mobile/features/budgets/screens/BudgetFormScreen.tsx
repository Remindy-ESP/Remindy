import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from '@/context/I18nContext';
import { categoryService } from '@/services/api/category.service';
import type { Category } from '@/services/api/types';
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
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [values, setValues] = useState<BudgetFormValues>(EMPTY_VALUES);
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
    }
  }, [budget]);

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
      Alert.alert('Error', message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingBudget || loadingCategories) {
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
});
