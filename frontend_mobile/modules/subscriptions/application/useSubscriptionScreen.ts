import { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { subscriptionService } from '@/modules/subscriptions/infrastructure/subscriptionApi';
import { categoryService } from '@/modules/categories/infrastructure/categoryApi';
import { reminderService } from '@/modules/notifications/infrastructure/reminderApi';
import { Subscription, Category, CreateSubscriptionRequest, getErrorMessage } from '@/services/api';
import { useTranslation } from '@/shared/application/I18nContext';
import { formatShortDate } from '@/utils/format';
import { toast } from '@/context/ToastContext';
import { showConfirm } from '@/context/ConfirmContext';

type BillingCycle = 'ONE_TIME' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';

type SearchParam = string | string[] | undefined;

export interface SubscriptionFormData {
  name: string;
  description: string;
  price: number;
  billingCycle: BillingCycle;
  startDate: string;
  endDate?: string;
  categoryId: string;
  reminderDays: number;
  isTrial: boolean;
  trialEndDate?: string;
}

function mapFrequencyParamToBillingCycle(frequency: SearchParam): BillingCycle {
  const freqStr = Array.isArray(frequency) ? frequency[0] : frequency;
  const frequencyMap: Record<string, BillingCycle> = {
    'ponctuel': 'ONE_TIME',
    'mensuel': 'MONTHLY',
    'trimestriel': 'QUARTERLY',
    'semestriel': 'QUARTERLY',
    'annuel': 'YEARLY',
  };
  return frequencyMap[freqStr?.toLowerCase() || ''] || 'MONTHLY';
}

function mapBillingCycleToBackendFrequency(cycle: string): 'one-time' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' {
  const mapping: Record<string, 'one-time' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'> = {
    'ONE_TIME': 'one-time',
    'WEEKLY': 'weekly',
    'MONTHLY': 'monthly',
    'QUARTERLY': 'quarterly',
    'YEARLY': 'yearly',
  };
  return mapping[cycle] || 'monthly';
}

function findCategoryIdFromParam(parsedCategoryParam: SearchParam, allCategories: Category[]): string {
  const defaultId = allCategories.length > 0 ? allCategories[0].id : '';
  if (!parsedCategoryParam) return defaultId;
  const categoryName = Array.isArray(parsedCategoryParam) ? parsedCategoryParam[0] : parsedCategoryParam;
  const matchedCategory = allCategories.find(
    (cat) => cat.name.toLowerCase() === categoryName.toLowerCase()
  );
  return matchedCategory ? matchedCategory.id : defaultId;
}

function extractParam(param: SearchParam): string | undefined {
  return Array.isArray(param) ? param[0] : param;
}

function buildRequestData(formData: SubscriptionFormData, parsedPrice: number): CreateSubscriptionRequest {
  const requestData: CreateSubscriptionRequest = {
    name: formData.name,
    amount: parsedPrice,
    frequency: mapBillingCycleToBackendFrequency(formData.billingCycle),
    startDate: formData.startDate,
    currency: 'EUR',
    status: formData.isTrial ? 'trial' : 'active',
  };
  if (formData.isTrial && formData.trialEndDate) {
    requestData.trialStartDate = formData.startDate;
    requestData.trialEndDate = formData.trialEndDate;
  }
  if (formData.endDate) {
    requestData.endDate = formData.endDate;
  }
  if (formData.description) {
    requestData.notes = formData.description;
  }
  if (formData.categoryId && formData.categoryId.trim() !== '') {
    requestData.categoryId = formData.categoryId;
  }
  return requestData;
}

async function updateSubscriptionReminder(subscriptionId: string, reminderDays: number): Promise<void> {
  const existingReminders = await reminderService.getBySubscription(subscriptionId);
  if (existingReminders.length > 0) {
    await reminderService.update(existingReminders[0].id, {
      days_before: reminderDays,
      enabled: true,
      channel: 'push',
    });
  } else {
    await reminderService.create({
      subscription_id: subscriptionId,
      type: 'subscription_renewal',
      days_before: reminderDays,
      enabled: true,
      channel: 'push',
    });
  }
}

async function createSubscriptionReminders(subscriptionId: string, reminderDays: number, isTrial: boolean): Promise<void> {
  const reminderPromises = [];
  if (reminderDays > 0) {
    reminderPromises.push(reminderService.create({
      subscription_id: subscriptionId,
      type: 'subscription_renewal',
      days_before: reminderDays,
      enabled: true,
      channel: 'push',
    }));
  }
  if (isTrial && reminderDays > 0) {
    reminderPromises.push(reminderService.create({
      subscription_id: subscriptionId,
      type: 'trial_ending',
      days_before: reminderDays,
      enabled: true,
      channel: 'push',
    }));
  }
  if (reminderPromises.length > 0) {
    await Promise.all(reminderPromises);
  }
}

function parsePriceInput(input: string): number | null {
  if (!input || input.trim() === '') {
    return null;
  }
  const normalized = input.trim().replace(',', '.');
  const parts = normalized.split('.');
  if (parts.length > 2) return null;
  if (!parts[0]?.split('').every((c) => c >= '0' && c <= '9')) return null;
  if (parts[1] !== undefined && (parts[1].length === 0 || parts[1].length > 2 || !parts[1].split('').every((c) => c >= '0' && c <= '9'))) return null;
  const parsed = Number.parseFloat(normalized);
  if (Number.isNaN(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
}

const DEFAULT_FORM_DATA: SubscriptionFormData = {
  name: '',
  description: '',
  price: 0,
  billingCycle: 'MONTHLY',
  startDate: new Date().toISOString().split('T')[0],
  categoryId: '',
  reminderDays: 3,
  isTrial: false,
};

export function useSubscriptionScreen() {
  const router = useRouter();
  const { t, language } = useTranslation();
  const {
    openAdd,
    documentId,
    parsedProvider,
    parsedAmount,
    parsedDate,
    parsedFrequency,
    parsedCategory
  } = useLocalSearchParams();

  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null);
  const [filterFrequency, setFilterFrequency] = useState<string>('');
  const [filterCategoryId, setFilterCategoryId] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showTrialEndDatePicker, setShowTrialEndDatePicker] = useState(false);
  const [formData, setFormData] = useState<SubscriptionFormData>(DEFAULT_FORM_DATA);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [priceInput, setPriceInput] = useState<string>('');

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setShowSuccessOverlay(true);
    setTimeout(() => setShowSuccessOverlay(false), 2000);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const filters: { frequency?: string; categoryId?: string } = {};
      if (filterFrequency) filters.frequency = filterFrequency;
      if (filterCategoryId) filters.categoryId = filterCategoryId;

      const [subscriptionsData, categoriesData] = await Promise.all([
        subscriptionService.getAll(Object.keys(filters).length > 0 ? filters : undefined),
        categoryService.getAll(),
      ]);
      setSubscriptions(Array.isArray(subscriptionsData) ? subscriptionsData : []);
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(getErrorMessage(err, t('subscription.errors.loadFailed')));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData().catch(console.error);
  }, []);

  useEffect(() => {
    if (!openAdd) return;
    const categoryId = findCategoryIdFromParam(parsedCategory, categories);
    const providerName = extractParam(parsedProvider);
    const amountStr = extractParam(parsedAmount);
    const dateStr = extractParam(parsedDate);

    setEditingSubscription(null);
    setPriceInput(amountStr || '');
    setFormData({
      name: providerName || '',
      description: documentId ? t('subscription.importedFromDocument', { documentId: String(documentId) }) : '',
      price: amountStr ? Number.parseFloat(amountStr) : 0,
      billingCycle: mapFrequencyParamToBillingCycle(parsedFrequency),
      startDate: dateStr || new Date().toISOString().split('T')[0],
      categoryId,
      reminderDays: 3,
      isTrial: false,
    });
    setFormErrors({});
    setModalVisible(true);
    router.setParams({
      openAdd: undefined, documentId: undefined, parsedProvider: undefined,
      parsedAmount: undefined, parsedCurrency: undefined, parsedDate: undefined,
      parsedFrequency: undefined, parsedCategory: undefined,
    });
  }, [openAdd, categories]);

  useEffect(() => {
    if (!loading) fetchData().catch(console.error);
  }, [filterFrequency, filterCategoryId]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = t('subscription.validation.nameRequired');
    const parsed = parsePriceInput(priceInput);
    if (parsed === null) errors.price = t('subscription.validation.priceInvalid');
    if (!formData.startDate) errors.startDate = t('subscription.validation.startDateRequired');
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleStartDateChange = (_event: any, selectedDate?: Date) => {
    setShowStartDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      setFormData({ ...formData, startDate: `${year}-${month}-${day}` });
    }
  };

  const handleEndDateChange = (_event: any, selectedDate?: Date) => {
    setShowEndDatePicker(false);
    if (selectedDate) {
      setFormData({ ...formData, endDate: selectedDate.toISOString().split('T')[0] });
    }
  };

  const handleTrialEndDateChange = (_event: any, selectedDate?: Date) => {
    setShowTrialEndDatePicker(false);
    if (selectedDate) {
      setFormData({ ...formData, trialEndDate: selectedDate.toISOString().split('T')[0] });
    }
  };

  const openAddModal = () => {
    setEditingSubscription(null);
    setPriceInput('');
    setFormData({ ...DEFAULT_FORM_DATA, categoryId: categories.length > 0 ? categories[0].id : '' });
    setFormErrors({});
    setModalVisible(true);
  };

  const openEditModal = async (subscription: Subscription) => {
    setEditingSubscription(subscription);
    setPriceInput(subscription.amount?.toString() || '0');
    const frequencyToBillingCycle: Record<string, BillingCycle> = {
      'one-time': 'ONE_TIME', 'weekly': 'WEEKLY', 'monthly': 'MONTHLY',
      'quarterly': 'QUARTERLY', 'yearly': 'YEARLY',
    };
    let existingReminderDays = 3;
    try {
      const reminders = await reminderService.getBySubscription(subscription.id);
      if (reminders.length > 0) existingReminderDays = reminders[0].days_before;
    } catch (err) {
      console.warn('Could not fetch reminders for subscription:', err);
    }
    setFormData({
      name: subscription.name,
      description: subscription.notes || '',
      price: subscription.amount || 0,
      billingCycle: frequencyToBillingCycle[subscription.frequency] || 'MONTHLY',
      startDate: subscription.startDate ? subscription.startDate.split('T')[0] : new Date().toISOString().split('T')[0],
      endDate: subscription.endDate ? subscription.endDate.split('T')[0] : undefined,
      categoryId: subscription.categoryId || '',
      reminderDays: existingReminderDays,
      isTrial: subscription.status === 'trial' || !!subscription.trialEndDate,
      trialEndDate: subscription.trialEndDate ? subscription.trialEndDate.split('T')[0] : undefined,
    });
    setFormErrors({});
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    const parsedPrice = parsePriceInput(priceInput);
    if (parsedPrice === null) {
      toast.error(t('subscription.alerts.invalidPriceFormat'));
      return;
    }
    try {
      const requestData = buildRequestData(formData, parsedPrice);
      if (editingSubscription) {
        await subscriptionService.update(editingSubscription.id, requestData);
        if (formData.reminderDays > 0) {
          try { await updateSubscriptionReminder(editingSubscription.id, formData.reminderDays); }
          catch (reminderErr) { console.warn('Failed to update reminder:', reminderErr); }
        }
        showSuccess(t('subscription.success.updated'));
      } else {
        const created = await subscriptionService.create(requestData);
        try { await createSubscriptionReminders(created.id, formData.reminderDays, formData.isTrial); }
        catch (reminderErr) { console.warn('Failed to create reminders:', reminderErr); }
        showSuccess(t('subscription.success.created'));
      }
      setModalVisible(false);
      await fetchData();
    } catch (err: any) {
      toast.error(getErrorMessage(err, t('subscription.errors.saveFailed')));
    }
  };

  const handleDelete = async (subscription: Subscription) => {
    const confirmed = await showConfirm({
      title: t('subscription.alerts.deleteTitle'),
      message: t('subscription.alerts.deleteMessage', { name: subscription.name }),
      destructive: true,
    });
    if (!confirmed) return;
    try {
      await subscriptionService.delete(subscription.id);
      showSuccess(t('subscription.success.deleted'));
      await fetchData();
    } catch (err: any) {
      toast.error(getErrorMessage(err, t('subscription.errors.deleteFailed')));
    }
  };

  const handlePauseResume = async (subscription: Subscription) => {
    try {
      if (subscription.status === 'active') {
        await subscriptionService.pause(subscription.id);
        showSuccess(t('subscription.success.paused'));
      } else {
        await subscriptionService.resume(subscription.id);
        showSuccess(t('subscription.success.resumed'));
      }
      await fetchData();
    } catch (err: any) {
      toast.error(getErrorMessage(err, t('subscription.errors.updateFailed')));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active': return '#4ade80';
      case 'paused': return '#facc15';
      case 'cancelled': return '#f87171';
      case 'trial': return '#60a5fa';
      default: return '#9ca3af';
    }
  };

  const getBillingCycleLabel = (cycle: string) => {
    switch (cycle?.toLowerCase()) {
      case 'one-time': return t('subscription.cycle.oneTime');
      case 'monthly': return t('subscription.cycle.monthly');
      case 'yearly': return t('subscription.cycle.yearly');
      case 'weekly': return t('subscription.cycle.weekly');
      case 'quarterly': return t('subscription.cycle.quarterly');
      default: return cycle;
    }
  };

  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return t('subscription.card.naDate');
    try {
      const date = new Date(dateString);
      if (Number.isNaN(date.getTime())) return t('subscription.card.invalidDate');
      return formatShortDate(date, language);
    } catch {
      return t('subscription.card.invalidDate');
    }
  };

  const formatDateForDisplay = (dateString: string): string => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
  };

  const filteredSubscriptions = subscriptions.filter((sub) => {
    if (filterFrequency && sub.frequency.toLowerCase() !== filterFrequency.toLowerCase()) return false;
    if (filterCategoryId && sub.category?.id !== filterCategoryId) return false;
    return true;
  });

  return {
    t, language,
    subscriptions, categories, loading, refreshing, error,
    modalVisible, setModalVisible,
    editingSubscription,
    filterFrequency, setFilterFrequency,
    filterCategoryId, setFilterCategoryId,
    successMessage, showSuccessOverlay,
    showStartDatePicker, setShowStartDatePicker,
    showEndDatePicker, setShowEndDatePicker,
    showTrialEndDatePicker, setShowTrialEndDatePicker,
    formData, setFormData,
    formErrors,
    priceInput, setPriceInput,
    filteredSubscriptions,
    fetchData, onRefresh, validateForm,
    handleStartDateChange, handleEndDateChange, handleTrialEndDateChange,
    openAddModal, openEditModal, handleSubmit, handleDelete, handlePauseResume,
    getStatusColor, getBillingCycleLabel, formatDate, formatDateForDisplay,
  };
}
