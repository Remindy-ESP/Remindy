import React, { useState, useEffect } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  ScrollView,
  RefreshControl,
  Platform,
  Switch,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { subscriptionService } from '@/modules/subscriptions/infrastructure/subscriptionApi';
import { categoryService } from '@/modules/categories/infrastructure/categoryApi';
import { reminderService } from '@/modules/notifications/infrastructure/reminderApi';
import { Subscription, Category, CreateSubscriptionRequest, getErrorMessage } from '@/services/api';
import CoachMarkTarget from '@/shared/ui/system/CoachMarkTarget';
import { COACH_MARK_TARGETS } from '@/features/coach-marks/coach-marks.config';
import { useTranslation } from '@/shared/application/I18nContext';
import { formatShortDate } from '@/utils/format';
import BrandLogo from '@/modules/dashboard/ui/BrandLogo';

interface SubscriptionFormData {
  name: string;
  description: string;
  price: number;
  billingCycle: 'ONE_TIME' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  startDate: string;
  endDate?: string;
  categoryId: string;
  reminderDays: number;
  isTrial: boolean;
  trialEndDate?: string;
}

export default function SubscriptionScreen() {
  const router = useRouter();
  const { t, language } = useTranslation();
  const {
    openAdd,
    documentId,
    parsedProvider,
    parsedAmount,
    // parsedCurrency, // Not used but kept in case needed in the future
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

  // Filters
  const [filterFrequency, setFilterFrequency] = useState<string>('');
  const [filterCategoryId, setFilterCategoryId] = useState<string>('');

  // Success overlay state
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);

  // Date picker state
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showTrialEndDatePicker, setShowTrialEndDatePicker] = useState(false);

  const [formData, setFormData] = useState<SubscriptionFormData>({
    name: '',
    description: '',
    price: 0,
    billingCycle: 'MONTHLY',
    startDate: new Date().toISOString().split('T')[0],
    categoryId: '',
    reminderDays: 3,
    isTrial: false,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [priceInput, setPriceInput] = useState<string>('');

  // Helper to show success message
  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setShowSuccessOverlay(true);
    setTimeout(() => {
      setShowSuccessOverlay(false);
    }, 2000);
  };

  // Helper to format date from YYYY-MM-DD to DD/MM/YYYY
  const formatDateForDisplay = (dateString: string): string => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
  };

  // Handle date change from picker
  const handleStartDateChange = (event: any, selectedDate?: Date) => {
    setShowStartDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      const dateString = `${year}-${month}-${day}`;
      setFormData({ ...formData, startDate: dateString });
    }
  };

  const handleEndDateChange = (event: any, selectedDate?: Date) => {
    setShowEndDatePicker(false);
    if (selectedDate) {
      setFormData({ ...formData, endDate: selectedDate.toISOString().split('T')[0] });
    }
  };

  const handleTrialEndDateChange = (event: any, selectedDate?: Date) => {
    setShowTrialEndDatePicker(false);
    if (selectedDate) {
      setFormData({ ...formData, trialEndDate: selectedDate.toISOString().split('T')[0] });
    }
  };

  useEffect(() => {
    void fetchData();
  }, []);

  useEffect(() => {
    if (openAdd) {
      // Map parsed frequency to billingCycle
      const mapFrequencyToBillingCycle = (frequency: string | string[] | undefined): 'ONE_TIME' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY' => {
        const freqStr = Array.isArray(frequency) ? frequency[0] : frequency;
        const frequencyMap: Record<string, 'ONE_TIME' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY'> = {
          'ponctuel': 'ONE_TIME',
          'mensuel': 'MONTHLY',
          'trimestriel': 'QUARTERLY',
          'semestriel': 'QUARTERLY', // Map semestriel to quarterly as fallback
          'annuel': 'YEARLY',
        };
        return frequencyMap[freqStr?.toLowerCase() || ''] || 'MONTHLY';
      };

      // Find category by name if parsedCategory is provided
      let categoryId = categories.length > 0 ? categories[0].id : '';
      if (parsedCategory) {
        const categoryName = Array.isArray(parsedCategory) ? parsedCategory[0] : parsedCategory;
        const matchedCategory = categories.find(
          (cat) => cat.name.toLowerCase() === categoryName.toLowerCase()
        );
        if (matchedCategory) {
          categoryId = matchedCategory.id;
        }
      }

      // Pre-fill form with parsed data if available
      const providerName = Array.isArray(parsedProvider) ? parsedProvider[0] : parsedProvider;
      const amountStr = Array.isArray(parsedAmount) ? parsedAmount[0] : parsedAmount;
      const dateStr = Array.isArray(parsedDate) ? parsedDate[0] : parsedDate;

      setEditingSubscription(null);
      setPriceInput(amountStr || '');
      setFormData({
        name: providerName || '',
        description: documentId ? t('subscription.importedFromDocument', { documentId: String(documentId) }) : '',
        price: amountStr ? parseFloat(amountStr) : 0,
        billingCycle: mapFrequencyToBillingCycle(parsedFrequency),
        startDate: dateStr || new Date().toISOString().split('T')[0],
        categoryId: categoryId,
        reminderDays: 3,
        isTrial: false,
      });
      setFormErrors({});
      setModalVisible(true);

      // Clear params to avoid re-triggering
      router.setParams({
        openAdd: undefined,
        documentId: undefined,
        parsedProvider: undefined,
        parsedAmount: undefined,
        parsedCurrency: undefined,
        parsedDate: undefined,
        parsedFrequency: undefined,
        parsedCategory: undefined,
      });
    }
  }, [openAdd, categories]);

  useEffect(() => {
    if (!loading) {
      void fetchData();
    }
  }, [filterFrequency, filterCategoryId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Build filters object
      const filters: { frequency?: string; categoryId?: string } = {};
      if (filterFrequency) {
        filters.frequency = filterFrequency;
      }
      if (filterCategoryId) {
        filters.categoryId = filterCategoryId;
      }

      const [subscriptionsData, categoriesData] = await Promise.all([
        subscriptionService.getAll(Object.keys(filters).length > 0 ? filters : undefined),
        categoryService.getAll(),
      ]);
      setSubscriptions(subscriptionsData);
      setCategories(categoriesData);
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(getErrorMessage(err, t('subscription.errors.loadFailed')));
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const parsePriceInput = (input: string): number | null => {
    if (!input || input.trim() === '') {
      return null;
    }

    // Normalize: replace comma with dot for parsing
    const normalized = input.trim().replace(',', '.');

    // Validate format: must match pattern like "15" or "15.99" (max 2 decimal places)
    const priceRegex = /^\d+(\.\d{1,2})?$/;
    if (!priceRegex.test(normalized)) {
      return null;
    }

    const parsed = parseFloat(normalized);
    if (isNaN(parsed) || parsed <= 0) {
      return null;
    }

    return parsed;
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = t('subscription.validation.nameRequired');
    }

    const parsedPrice = parsePriceInput(priceInput);
    if (parsedPrice === null) {
      errors.price = t('subscription.validation.priceInvalid');
    }

    if (!formData.startDate) {
      errors.startDate = t('subscription.validation.startDateRequired');
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const openAddModal = () => {
    setEditingSubscription(null);
    setPriceInput('');
    setFormData({
      name: '',
      description: '',
      price: 0,
      billingCycle: 'MONTHLY',
      startDate: new Date().toISOString().split('T')[0],
      categoryId: categories.length > 0 ? categories[0].id : '',
      reminderDays: 3,
      isTrial: false,
    });
    setFormErrors({});
    setModalVisible(true);
  };

  const openEditModal = async (subscription: Subscription) => {
    setEditingSubscription(subscription);
    setPriceInput(subscription.amount?.toString() || '0');

    const frequencyToBillingCycle: Record<string, 'ONE_TIME' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY'> = {
      'one-time': 'ONE_TIME',
      'weekly': 'WEEKLY',
      'monthly': 'MONTHLY',
      'quarterly': 'QUARTERLY',
      'yearly': 'YEARLY',
    };

    // Fetch existing reminder for this subscription
    let existingReminderDays = 3;
    try {
      const reminders = await reminderService.getBySubscription(subscription.id);
      if (reminders.length > 0) {
        existingReminderDays = reminders[0].days_before;
      }
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

  /**
   * Map frontend billingCycle to backend frequency format
   */
  const mapBillingCycleToFrequency = (cycle: string): 'one-time' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' => {
    const mapping: Record<string, 'one-time' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'> = {
      'ONE_TIME': 'one-time',
      'WEEKLY': 'weekly',
      'MONTHLY': 'monthly',
      'QUARTERLY': 'quarterly',
      'YEARLY': 'yearly',
    };
    return mapping[cycle] || 'monthly';
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    // Parse price safely (handles both comma and dot)
    const parsedPrice = parsePriceInput(priceInput);
    if (parsedPrice === null) {
      Alert.alert(t('common.error'), t('subscription.alerts.invalidPriceFormat'));
      return;
    }

    try {
      // Prepare data matching backend DTO contract exactly
      const requestData: CreateSubscriptionRequest = {
        name: formData.name,
        amount: parsedPrice,
        frequency: mapBillingCycleToFrequency(formData.billingCycle),
        startDate: formData.startDate,
        currency: 'EUR',
        status: formData.isTrial ? 'trial' : 'active',
      };

      if (formData.isTrial && formData.trialEndDate) {
        requestData.trialStartDate = formData.startDate; // Usually starts at subscription start
        requestData.trialEndDate = formData.trialEndDate;
      }

      if (formData.endDate) {
        requestData.endDate = formData.endDate;
      }
      if (formData.description) {
        requestData.notes = formData.description;
      }

      // Add categoryId if selected
      if (formData.categoryId && formData.categoryId.trim() !== '') {
        requestData.categoryId = formData.categoryId;
      }

      if (editingSubscription) {
        await subscriptionService.update(editingSubscription.id, requestData);

        // Update or create reminder for this subscription
        if (formData.reminderDays > 0) {
          try {
            const existingReminders = await reminderService.getBySubscription(editingSubscription.id);
            if (existingReminders.length > 0) {
              await reminderService.update(existingReminders[0].id, {
                days_before: formData.reminderDays,
                enabled: true,
                channel: 'push',
              });
            } else {
              await reminderService.create({
                subscription_id: editingSubscription.id,
                type: 'subscription_renewal',
                days_before: formData.reminderDays,
                enabled: true,
                channel: 'push',
              });
            }
          } catch (reminderErr) {
            console.warn('Failed to update reminder, subscription was saved:', reminderErr);
          }
        }

        showSuccess(t('subscription.success.updated'));
      } else {
        const created = await subscriptionService.create(requestData);

        // Create reminders for the new subscription
        try {
          const reminderPromises = [];

          if (formData.reminderDays > 0) {
            reminderPromises.push(reminderService.create({
              subscription_id: created.id,
              type: 'subscription_renewal',
              days_before: formData.reminderDays,
              enabled: true,
              channel: 'push',
            }));
          }

          if (formData.isTrial && formData.reminderDays > 0) {
            reminderPromises.push(reminderService.create({
              subscription_id: created.id,
              type: 'trial_ending',
              days_before: formData.reminderDays,
              enabled: true,
              channel: 'push',
            }));
          }

          if (reminderPromises.length > 0) {
            await Promise.all(reminderPromises);
          }
        } catch (reminderErr) {
          console.warn('Failed to create reminders, subscription was created:', reminderErr);
        }

        showSuccess(t('subscription.success.created'));
      }
      setModalVisible(false);
      await fetchData();
    } catch (err: any) {
      const errorMessage = getErrorMessage(err, t('subscription.errors.saveFailed'));
      Alert.alert(t('common.error'), errorMessage);
    }
  };

  const handleDelete = (subscription: Subscription) => {
    Alert.alert(
      t('subscription.alerts.deleteTitle'),
      t('subscription.alerts.deleteMessage', { name: subscription.name }),
      [
        { text: t('subscription.alerts.deleteCancel'), style: 'cancel' },
        {
          text: t('subscription.alerts.deleteConfirm'),
          style: 'destructive',
          onPress: async () => {
            try {
              await subscriptionService.delete(subscription.id);
              showSuccess(t('subscription.success.deleted'));
              await fetchData();
            } catch (err: any) {
              Alert.alert(t('common.error'), getErrorMessage(err, t('subscription.errors.deleteFailed')));
            }
          },
        },
      ]
    );
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
      Alert.alert(t('common.error'), getErrorMessage(err, t('subscription.errors.updateFailed')));
    }
  };

  const getStatusColor = (status: string) => {
    const lowerStatus = status?.toLowerCase();
    switch (lowerStatus) {
      case 'active': return '#4ade80';
      case 'paused': return '#facc15';
      case 'cancelled': return '#f87171';
      case 'trial': return '#60a5fa';
      default: return '#9ca3af';
    }
  };

  const getBillingCycleLabel = (cycle: string) => {
    const lowerCycle = cycle?.toLowerCase();
    switch (lowerCycle) {
      case 'one-time': return t('subscription.cycle.oneTime');
      case 'monthly': return t('subscription.cycle.monthly');
      case 'yearly': return t('subscription.cycle.yearly');
      case 'weekly': return t('subscription.cycle.weekly');
      case 'quarterly': return t('subscription.cycle.quarterly');
      default: return cycle;
    }
  };

  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) {
      return t('subscription.card.naDate');
    }

    try {
      const date = new Date(dateString);
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return t('subscription.card.invalidDate');
      }
      return formatShortDate(date, language);
    } catch (error) {
      console.error('Error formatting date:', error);
      return t('subscription.card.invalidDate');
    }
  };

  // Filtrer les opérations basé sur les filtres sélectionnés
  const filteredSubscriptions = subscriptions.filter((sub) => {
    // Filtrer par fréquence
    if (filterFrequency && sub.frequency.toLowerCase() !== filterFrequency.toLowerCase()) {
      return false;
    }

    // Filtrer par catégorie
    if (filterCategoryId && sub.category?.id !== filterCategoryId) {
      return false;
    }

    return true;
  });

  const renderSubscriptionItem = ({ item }: { item: Subscription }) => (
    <View style={styles.subscriptionCard}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleContainer}>
          <BrandLogo
            name={item.name}
            categoryIcon={item.category?.icon}
            categoryColor={item.category?.color}
            size={32}
          />
          <Text style={styles.cardTitle}>
            {item.name.length > 30 ? `${item.name.substring(0, 30)}...` : item.name}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
        </View>
        <Text style={styles.cardPrice}>
          {item.currency || '$'}{item.amount?.toFixed(2) || '0.00'}
        </Text>
      </View>

      {item.notes && (
        <Text style={styles.cardDescription}>{item.notes}</Text>
      )}

      <View style={styles.cardDetails}>
        <View style={styles.frequencyBadge}>
          <Text style={styles.frequencyText}>
            {getBillingCycleLabel(item.frequency)}
          </Text>
        </View>
        {item.category && (
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryIcon}>{item.category.icon}</Text>
            <Text style={styles.categoryText}>{item.category.name}</Text>
          </View>
        )}
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.dateText}>
          {t('subscription.card.startPrefix', { date: formatDate(item.startDate) })}
        </Text>
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handlePauseResume(item)}
          >
            <Text style={styles.actionButtonText}>
              {item.status === 'active' ? '⏸' : '▶️'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => openEditModal(item)}
          >
            <Text style={styles.actionButtonText}>✏️</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDelete(item)}
          >
            <Text style={styles.actionButtonText}>🗑️</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('subscription.headerTitle')}</Text>
        </View>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>{t('subscription.loading')}</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('subscription.headerTitle')}</Text>
        </View>
        <View style={styles.centerContent}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchData}>
            <Text style={styles.retryButtonText}>{t('common.retry')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>{t('subscription.headerTitle')}</Text>
          <Text style={styles.headerSubtitle}>
            {t('subscription.count', { count: filteredSubscriptions.length })}
            {(filterFrequency || filterCategoryId) && t('subscription.totalSuffix', { count: subscriptions.length })}
          </Text>
        </View>
        <CoachMarkTarget targetKey={COACH_MARK_TARGETS.subscriptionAddButton}>
          <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
            <Text style={styles.addButtonText}>{t('subscription.addButton')}</Text>
          </TouchableOpacity>
        </CoachMarkTarget>
      </View>

      {/* Filtres */}
      <View style={styles.filtersContainer}>
        <View style={styles.filterGroup}>
          <Text style={styles.filterLabel}>{t('subscription.filterFrequencyLabel')}</Text>
          <View style={styles.filterPickerContainer}>
            <Picker
              selectedValue={filterFrequency}
              onValueChange={(value) => setFilterFrequency(value)}
              style={styles.filterPicker}
              dropdownIconColor="#fff"
            >
              <Picker.Item label={t('subscription.filterAll')} value="" />
              <Picker.Item label={t('subscription.cycle.oneTime')} value="one-time" />
              <Picker.Item label={t('subscription.cycle.weekly')} value="weekly" />
              <Picker.Item label={t('subscription.cycle.monthly')} value="monthly" />
              <Picker.Item label={t('subscription.cycle.quarterly')} value="quarterly" />
              <Picker.Item label={t('subscription.cycle.yearly')} value="yearly" />
            </Picker>
          </View>
        </View>

        <View style={styles.filterGroup}>
          <Text style={styles.filterLabel}>{t('subscription.filterCategoryLabel')}</Text>
          <View style={styles.filterPickerContainer}>
            <Picker
              selectedValue={filterCategoryId}
              onValueChange={(value) => setFilterCategoryId(value)}
              style={styles.filterPicker}
              dropdownIconColor="#fff"
            >
              <Picker.Item label={t('subscription.filterAllCategories')} value="" />
              {categories.map((cat) => (
                <Picker.Item key={cat.id} label={cat.name} value={cat.id} />
              ))}
            </Picker>
          </View>
        </View>
      </View>

      {filteredSubscriptions.length === 0 ? (
        <View style={styles.centerContent}>
          {subscriptions.length === 0 ? (
            <>
              <Text style={styles.emptyText}>{t('subscription.empty')}</Text>
              <Text style={styles.emptySubtext}>{t('subscription.emptyHint')}</Text>
            </>
          ) : (
            <>
              <Text style={styles.emptyText}>{t('subscription.filteredEmpty')}</Text>
              <Text style={styles.emptySubtext}>{t('subscription.filteredEmptyHint')}</Text>
            </>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredSubscriptions}
          renderItem={renderSubscriptionItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />
          }
        />
      )}

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {editingSubscription ? t('subscription.modal.titleEdit') : t('subscription.modal.titleAdd')}
                </Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Text style={styles.closeButton}>✕</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>{t('subscription.modal.name')}</Text>
                <TextInput
                  style={[styles.input, formErrors.name && styles.inputError]}
                  value={formData.name}
                  onChangeText={(text) => setFormData({ ...formData, name: text })}
                  placeholder={t('subscription.modal.namePlaceholder')}
                  placeholderTextColor="#9ca3af"
                />
                {formErrors.name && <Text style={styles.errorLabel}>{formErrors.name}</Text>}
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>{t('subscription.modal.description')}</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={formData.description}
                  onChangeText={(text) => setFormData({ ...formData, description: text })}
                  placeholder={t('subscription.modal.descriptionPlaceholder')}
                  placeholderTextColor="#9ca3af"
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.formRow}>
                <View style={[styles.formGroup, styles.formGroupHalf]}>
                  <Text style={styles.label}>{t('subscription.modal.price')}</Text>
                  <TextInput
                    style={[styles.input, formErrors.price && styles.inputError]}
                    value={priceInput}
                    onChangeText={(text) => setPriceInput(text)}
                    placeholder={t('subscription.modal.pricePlaceholder')}
                    placeholderTextColor="#9ca3af"
                    keyboardType="decimal-pad"
                  />
                  {formErrors.price && <Text style={styles.errorLabel}>{formErrors.price}</Text>}
                </View>

                <View style={[styles.formGroup, styles.formGroupHalf]}>
                  <Text style={styles.label}>{t('subscription.modal.billingCycle')}</Text>
                  <View style={styles.pickerContainer}>
                    <Picker
                      selectedValue={formData.billingCycle}
                      onValueChange={(value) => setFormData({ ...formData, billingCycle: value })}
                      style={styles.picker}
                      dropdownIconColor="#fff"
                    >
                      <Picker.Item label={t('subscription.cycle.oneTime')} value="ONE_TIME" />
                      <Picker.Item label={t('subscription.cycle.weeklyShort')} value="WEEKLY" />
                      <Picker.Item label={t('subscription.cycle.monthlyShort')} value="MONTHLY" />
                      <Picker.Item label={t('subscription.cycle.quarterlyShort')} value="QUARTERLY" />
                      <Picker.Item label={t('subscription.cycle.yearly')} value="YEARLY" />
                    </Picker>
                  </View>
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>{t('subscription.modal.category')}</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={formData.categoryId}
                    onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
                    style={styles.picker}
                    dropdownIconColor="#fff"
                  >
                    <Picker.Item label={t('subscription.modal.noCategory')} value="" />
                    {categories.map((cat) => (
                      <Picker.Item key={cat.id} label={cat.name} value={cat.id} />
                    ))}
                  </Picker>
                </View>
              </View>

              <View style={styles.formGroup}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text style={styles.label}>Période d'essai</Text>
                  <Switch
                    value={formData.isTrial}
                    onValueChange={(value) => {
                      const updates: Partial<SubscriptionFormData> = { isTrial: value };
                      if (value && !formData.trialEndDate) {
                        // Default trial end to M+1
                        const defaultEnd = new Date();
                        defaultEnd.setMonth(defaultEnd.getMonth() + 1);
                        updates.trialEndDate = defaultEnd.toISOString().split('T')[0];
                      }
                      setFormData({ ...formData, ...updates });
                    }}
                    trackColor={{ false: '#3d3d6f', true: '#6366f1' }}
                    thumbColor={formData.isTrial ? '#fff' : '#9ca3af'}
                  />
                </View>
                
                {formData.isTrial && (
                  <View style={{ marginTop: 8 }}>
                    <Text style={[styles.label, { fontSize: 13, color: '#9ca3af' }]}>Date de fin de période d'essai</Text>
                    <TouchableOpacity
                      style={styles.dateButton}
                      onPress={() => setShowTrialEndDatePicker(true)}
                    >
                      <Text style={styles.dateButtonText}>
                        {formData.trialEndDate ? formatDateForDisplay(formData.trialEndDate) : 'Sélectionner une date'}
                      </Text>
                      <Text style={styles.dateIcon}>📅</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              <View style={styles.formRow}>
                <View style={[styles.formGroup, styles.formGroupHalf]}>
                  <Text style={styles.label}>{t('subscription.modal.startDate')}</Text>
                  <TouchableOpacity
                    style={[styles.dateButton, formErrors.startDate && styles.inputError]}
                    onPress={() => setShowStartDatePicker(true)}
                  >
                    <Text style={styles.dateButtonText}>
                      {formData.startDate ? formatDateForDisplay(formData.startDate) : t('subscription.modal.datePlaceholder')}
                    </Text>
                    <Text style={styles.dateIcon}>📅</Text>
                  </TouchableOpacity>
                  {formErrors.startDate && <Text style={styles.errorLabel}>{formErrors.startDate}</Text>}
                </View>

                <View style={[styles.formGroup, styles.formGroupHalf]}>
                  <Text style={styles.label}>{t('subscription.modal.endDate')}</Text>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity
                      style={[styles.dateButton, { flex: 1 }]}
                      onPress={() => setShowEndDatePicker(true)}
                    >
                      <Text style={styles.dateButtonText}>
                        {formData.endDate ? formatDateForDisplay(formData.endDate) : t('subscription.modal.datePlaceholder')}
                      </Text>
                      <Text style={styles.dateIcon}>📅</Text>
                    </TouchableOpacity>
                    {formData.endDate && (
                      <TouchableOpacity
                        style={styles.clearButton}
                        onPress={() => setFormData({ ...formData, endDate: undefined })}
                      >
                        <Text style={styles.clearButtonText}>✕</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>

              {/* Date Pickers */}
              {showStartDatePicker && (
                <DateTimePicker
                  value={formData.startDate ? new Date(formData.startDate) : new Date()}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handleStartDateChange}
                />
              )}
              {showEndDatePicker && (
                <DateTimePicker
                  value={formData.endDate ? new Date(formData.endDate) : (formData.startDate ? new Date(formData.startDate) : new Date())}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handleEndDateChange}
                />
              )}
              {showTrialEndDatePicker && (
                <DateTimePicker
                  value={formData.trialEndDate ? new Date(formData.trialEndDate) : new Date()}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handleTrialEndDateChange}
                />
              )}

              <View style={styles.formGroup}>
                <Text style={styles.label}>{t('subscription.modal.reminder')}</Text>
                <TextInput
                  style={styles.input}
                  value={formData.reminderDays > 0 ? formData.reminderDays.toString() : ''}
                  onChangeText={(text) => {
                    const parsed = parseInt(text);
                    setFormData({ ...formData, reminderDays: isNaN(parsed) ? 0 : Math.min(Math.max(parsed, 0), 365) });
                  }}
                  placeholder={t('subscription.modal.reminderPlaceholder')}
                  placeholderTextColor="#9ca3af"
                  keyboardType="number-pad"
                />
                <Text style={{ color: '#9ca3af', fontSize: 11, marginTop: 4 }}>
                  Nombre de jours avant le renouvellement pour recevoir une notification push
                </Text>
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>{t('subscription.modal.cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.submitButton]}
                  onPress={handleSubmit}
                >
                  <Text style={styles.submitButtonText}>
                    {editingSubscription ? t('subscription.modal.update') : t('subscription.modal.create')}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Success Overlay */}
      {showSuccessOverlay && (
        <View style={styles.successOverlay}>
          <View style={styles.successContainer}>
            <Text style={styles.successIcon}>✓</Text>
            <Text style={styles.successText}>{successMessage}</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a3e',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#1a1a3e',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 4,
  },
  addButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  filtersContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    backgroundColor: '#1a1a3e',
  },
  filterGroup: {
    flex: 1,
  },
  filterLabel: {
    color: '#e0e0e0',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  filterPickerContainer: {
    backgroundColor: '#2d2d5f',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3d3d6f',
    overflow: 'hidden',
  },
  filterPicker: {
    color: '#fff',
    backgroundColor: '#2d2d5f',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    color: '#9ca3af',
    marginTop: 12,
    fontSize: 16,
  },
  errorText: {
    color: '#f87171',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtext: {
    color: '#9ca3af',
    fontSize: 14,
    textAlign: 'center',
  },
  listContent: {
    padding: 16,
  },
  subscriptionCard: {
    backgroundColor: '#2d2d5f',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  cardTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    color: '#000',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  cardPrice: {
    color: '#4ade80',
    fontSize: 20,
    fontWeight: 'bold',
  },
  cardDescription: {
    color: '#9ca3af',
    fontSize: 14,
    marginBottom: 8,
  },
  cardDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailText: {
    color: '#e0e0e0',
    fontSize: 14,
  },
  frequencyBadge: {
    backgroundColor: '#4f46e5',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  frequencyText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#1a1a3e',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  categoryIcon: {
    fontSize: 14,
  },
  categoryText: {
    color: '#e0e0e0',
    fontSize: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#3d3d6f',
    paddingTop: 12,
  },
  dateText: {
    color: '#9ca3af',
    fontSize: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    backgroundColor: '#3d3d6f',
    width: 32,
    height: 32,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    backgroundColor: '#7f1d1d',
  },
  actionButtonText: {
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#2d2d5f',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  closeButton: {
    color: '#9ca3af',
    fontSize: 28,
    fontWeight: '300',
  },
  formGroup: {
    marginBottom: 16,
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
  },
  formGroupHalf: {
    flex: 1,
  },
  label: {
    color: '#e0e0e0',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1a1a3e',
    color: '#fff',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#3d3d6f',
  },
  inputError: {
    borderColor: '#f87171',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    backgroundColor: '#1a1a3e',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3d3d6f',
    overflow: 'hidden',
  },
  picker: {
    color: '#fff',
    backgroundColor: '#1a1a3e',
  },
  errorLabel: {
    color: '#f87171',
    fontSize: 12,
    marginTop: 4,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#3d3d6f',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#6366f1',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  successOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  successContainer: {
    backgroundColor: '#2a2a5e',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    minWidth: 200,
  },
  successIcon: {
    fontSize: 48,
    color: '#4ade80',
    marginBottom: 12,
    fontWeight: 'bold',
  },
  successText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  dateButton: {
    backgroundColor: '#3d3d6f',
    borderRadius: 8,
    padding: 14,
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
  dateIcon: {
    fontSize: 20,
  },
  clearButton: {
    backgroundColor: '#ef4444',
    borderRadius: 8,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  clearButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
});
