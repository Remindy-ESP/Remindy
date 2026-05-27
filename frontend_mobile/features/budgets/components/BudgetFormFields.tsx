import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Switch, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
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

const formatDateDisplay = (dateStr: string | null | undefined): string => {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
};

const dateToYMD = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export function BudgetFormFields({
  values,
  onChange,
  categories,
  errors,
}: BudgetFormFieldsProps): React.ReactElement {
  const { t } = useTranslation();
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const set = <K extends keyof BudgetFormValues>(key: K, value: BudgetFormValues[K]) => {
    onChange({ ...values, [key]: value });
  };

  const focusStyle = (field: string) => (focusedField === field ? styles.inputFocused : undefined);

  return (
    <View style={styles.container}>
      <Field label={t('budgets.form.nameLabel')} error={errors?.name}>
        <TextInput
          style={[styles.input, focusStyle('name')]}
          placeholder={t('budgets.form.namePlaceholder')}
          placeholderTextColor="#6b7280"
          value={values.name}
          onChangeText={v => set('name', v)}
          onFocus={() => setFocusedField('name')}
          onBlur={() => setFocusedField(null)}
          testID="budget-form-name"
          maxLength={100}
        />
      </Field>

      <View style={styles.row}>
        <View style={[styles.flex2, styles.gapRight]}>
          <Field label={t('budgets.form.amountLabel')} error={errors?.amount}>
            <TextInput
              style={[styles.input, focusStyle('amount')]}
              placeholder={t('budgets.form.amountPlaceholder')}
              placeholderTextColor="#6b7280"
              value={values.amount > 0 ? String(values.amount) : ''}
              onChangeText={v => set('amount', Number(v.replace(',', '.')) || 0)}
              keyboardType="decimal-pad"
              onFocus={() => setFocusedField('amount')}
              onBlur={() => setFocusedField(null)}
              testID="budget-form-amount"
            />
          </Field>
        </View>
        <View style={styles.flex1}>
          <Field label={t('budgets.form.currencyLabel')}>
            <TextInput
              style={[styles.input, focusStyle('currency')]}
              value={values.currency}
              onChangeText={v => set('currency', v.toUpperCase().slice(0, 3))}
              autoCapitalize="characters"
              maxLength={3}
              onFocus={() => setFocusedField('currency')}
              onBlur={() => setFocusedField(null)}
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
        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => setShowStartPicker(true)}
          testID="budget-form-start-date"
        >
          <Text style={values.startDate ? styles.dateButtonText : styles.dateButtonPlaceholder}>
            {values.startDate ? formatDateDisplay(values.startDate) : 'JJ/MM/AAAA'}
          </Text>
          <Text style={styles.dateIcon}>📅</Text>
        </TouchableOpacity>
        {showStartPicker && (
          <DateTimePicker
            value={values.startDate ? new Date(values.startDate) : new Date()}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(_, date) => {
              setShowStartPicker(Platform.OS === 'ios');
              if (date) set('startDate', dateToYMD(date));
            }}
          />
        )}
      </Field>

      <Field label={t('budgets.form.endDateLabel')}>
        <View style={styles.dateRow}>
          <TouchableOpacity
            style={[styles.dateButton, { flex: 1 }]}
            onPress={() => setShowEndPicker(true)}
            testID="budget-form-end-date"
          >
            <Text style={values.endDate ? styles.dateButtonText : styles.dateButtonPlaceholder}>
              {values.endDate ? formatDateDisplay(values.endDate) : 'Optionnel'}
            </Text>
            <Text style={styles.dateIcon}>📅</Text>
          </TouchableOpacity>
          {values.endDate && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => set('endDate', null)}
            >
              <Text style={styles.clearButtonText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
        {showEndPicker && (
          <DateTimePicker
            value={values.endDate ? new Date(values.endDate) : new Date()}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(_, date) => {
              setShowEndPicker(false);
              if (date) set('endDate', dateToYMD(date));
            }}
          />
        )}
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
          style={[styles.input, styles.textarea, focusStyle('notes')]}
          value={values.notes ?? ''}
          onChangeText={v => set('notes', v)}
          multiline
          onFocus={() => setFocusedField('notes')}
          onBlur={() => setFocusedField(null)}
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
    borderWidth: 1,
    borderColor: '#2d2d5f',
  },
  inputFocused: {
    borderColor: '#6366f1',
    borderWidth: 2,
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
  dateButton: {
    backgroundColor: '#2d2d5f',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  dateButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  dateButtonPlaceholder: {
    color: '#6b7280',
    fontSize: 16,
  },
  dateIcon: {
    fontSize: 18,
  },
  dateRow: {
    flexDirection: 'row',
    gap: 8,
  },
  clearButton: {
    backgroundColor: '#ef4444',
    borderRadius: 10,
    width: 46,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
