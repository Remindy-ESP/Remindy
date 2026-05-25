import React from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Switch } from 'react-native';
import { useTranslation } from '@/context/I18nContext';
import type { Category } from '@/services/api/types';
import { BudgetPeriod, CreateBudgetInput } from '../types/budget.types';
import { CategoryPicker } from './CategoryPicker';

export interface BudgetFormValues extends CreateBudgetInput {
  endDate: string | null | undefined;
}

export interface BudgetFormFieldsProps {
  values: BudgetFormValues;
  onChange: (next: BudgetFormValues) => void;
  categories: Category[];
  errors?: Partial<Record<keyof BudgetFormValues, string>>;
}

export function BudgetFormFields({
  values,
  onChange,
  categories,
  errors,
}: BudgetFormFieldsProps): React.ReactElement {
  const { t } = useTranslation();

  const set = <K extends keyof BudgetFormValues>(key: K, value: BudgetFormValues[K]) => {
    onChange({ ...values, [key]: value });
  };

  return (
    <View style={styles.container}>
      <Field label={t('budgets.form.nameLabel')} error={errors?.name}>
        <TextInput
          style={styles.input}
          placeholder={t('budgets.form.namePlaceholder')}
          placeholderTextColor="#6b7280"
          value={values.name}
          onChangeText={v => set('name', v)}
          testID="budget-form-name"
          maxLength={100}
        />
      </Field>

      <View style={styles.row}>
        <View style={[styles.flex2, styles.gapRight]}>
          <Field label={t('budgets.form.amountLabel')} error={errors?.amount}>
            <TextInput
              style={styles.input}
              placeholder={t('budgets.form.amountPlaceholder')}
              placeholderTextColor="#6b7280"
              value={values.amount > 0 ? String(values.amount) : ''}
              onChangeText={v => set('amount', Number(v.replace(',', '.')) || 0)}
              keyboardType="decimal-pad"
              testID="budget-form-amount"
            />
          </Field>
        </View>
        <View style={styles.flex1}>
          <Field label={t('budgets.form.currencyLabel')}>
            <TextInput
              style={styles.input}
              value={values.currency}
              onChangeText={v => set('currency', v.toUpperCase().slice(0, 3))}
              autoCapitalize="characters"
              maxLength={3}
              testID="budget-form-currency"
            />
          </Field>
        </View>
      </View>

      <Field label={t('budgets.form.periodLabel')}>
        <View style={styles.periodRow}>
          <PeriodOption
            label={t('budgets.form.periodMonthly')}
            value="monthly"
            selected={values.period === 'monthly'}
            onPress={() => set('period', 'monthly')}
          />
          <PeriodOption
            label={t('budgets.form.periodYearly')}
            value="yearly"
            selected={values.period === 'yearly'}
            onPress={() => set('period', 'yearly')}
          />
        </View>
      </Field>

      <CategoryPicker
        categories={categories}
        selectedCategoryId={values.categoryId ?? null}
        onSelect={id => set('categoryId', id)}
      />

      <Field label={t('budgets.form.startDateLabel')}>
        <TextInput
          style={styles.input}
          value={values.startDate}
          onChangeText={v => set('startDate', v)}
          placeholder="YYYY-MM-DD"
          placeholderTextColor="#6b7280"
          testID="budget-form-start-date"
        />
      </Field>

      <Field label={t('budgets.form.endDateLabel')}>
        <TextInput
          style={styles.input}
          value={values.endDate ?? ''}
          onChangeText={v => set('endDate', v.length > 0 ? v : null)}
          placeholder="YYYY-MM-DD"
          placeholderTextColor="#6b7280"
          testID="budget-form-end-date"
        />
      </Field>

      <View style={styles.switchRow}>
        <Text style={styles.label}>{t('budgets.form.isActiveLabel')}</Text>
        <Switch
          value={values.isActive ?? true}
          onValueChange={v => set('isActive', v)}
          testID="budget-form-is-active"
        />
      </View>

      <Field label={t('budgets.form.notesLabel')}>
        <TextInput
          style={[styles.input, styles.textarea]}
          value={values.notes ?? ''}
          onChangeText={v => set('notes', v)}
          multiline
          testID="budget-form-notes"
        />
      </Field>
    </View>
  );
}

interface FieldProps {
  label: string;
  error?: string;
  children: React.ReactNode;
}

function Field({ label, error, children }: FieldProps): React.ReactElement {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {children}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

interface PeriodOptionProps {
  label: string;
  value: BudgetPeriod;
  selected: boolean;
  onPress: () => void;
}

function PeriodOption({ label, selected, onPress }: PeriodOptionProps): React.ReactElement {
  return (
    <TouchableOpacity
      style={[styles.periodOption, selected && styles.periodOptionSelected]}
      onPress={onPress}
    >
      <Text style={[styles.periodOptionText, selected && styles.periodOptionTextSelected]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { gap: 16 },
  field: { gap: 6 },
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  flex1: { flex: 1 },
  flex2: { flex: 2 },
  gapRight: { marginRight: 12 },
  label: { color: '#9ca3af', fontSize: 14 },
  input: {
    backgroundColor: '#1B1B3A',
    color: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 10,
    fontSize: 16,
  },
  textarea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  periodRow: {
    flexDirection: 'row',
    backgroundColor: '#1B1B3A',
    borderRadius: 10,
    overflow: 'hidden',
  },
  periodOption: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  periodOptionSelected: {
    backgroundColor: '#6366f1',
  },
  periodOptionText: {
    color: '#cbd5f5',
    fontWeight: '600',
  },
  periodOptionTextSelected: {
    color: '#fff',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
  },
});
