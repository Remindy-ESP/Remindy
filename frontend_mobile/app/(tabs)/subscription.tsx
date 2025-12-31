import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { subscriptionService } from '../../services/api/subscription.service';
import { categoryService } from '../../services/api/category.service';
import { Subscription, Category, CreateSubscriptionRequest } from '../../services/api/types';

interface SubscriptionFormData {
  name: string;
  description: string;
  price: number;
  billingCycle: 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  startDate: string;
  endDate?: string;
  categoryId: string;
  reminderDays: number;
}

export default function SubscriptionScreen() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null);

  const [formData, setFormData] = useState<SubscriptionFormData>({
    name: '',
    description: '',
    price: 0,
    billingCycle: 'MONTHLY',
    startDate: new Date().toISOString().split('T')[0],
    categoryId: '',
    reminderDays: 3,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [priceInput, setPriceInput] = useState<string>('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [subscriptionsData, categoriesData] = await Promise.all([
        subscriptionService.getAll(),
        categoryService.getAll(),
      ]);
      setSubscriptions(subscriptionsData);
      setCategories(categoriesData);
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load subscriptions');
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
      errors.name = 'Name is required';
    }

    const parsedPrice = parsePriceInput(priceInput);
    if (parsedPrice === null) {
      errors.price = 'Price must be a valid number greater than 0 (e.g., 15.99 or 15,99)';
    }

    if (!formData.startDate) {
      errors.startDate = 'Start date is required';
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
    });
    setFormErrors({});
    setModalVisible(true);
  };

  const openEditModal = (subscription: Subscription) => {
    setEditingSubscription(subscription);
    setPriceInput(subscription.amount?.toString() || '0');

    const frequencyToBillingCycle: Record<string, 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY'> = {
      'weekly': 'WEEKLY',
      'monthly': 'MONTHLY',
      'quarterly': 'QUARTERLY',
      'yearly': 'YEARLY',
    };

    setFormData({
      name: subscription.name,
      description: subscription.notes || '',
      price: subscription.amount || 0, // Internal form uses 'price' for now
      billingCycle: frequencyToBillingCycle[subscription.frequency] || 'MONTHLY',
      startDate: subscription.startDate.split('T')[0],
      endDate: subscription.nextDueDate ? subscription.nextDueDate.split('T')[0] : undefined,
      categoryId: subscription.contractId?.toString() || '',
      reminderDays: 0, // Default value since backend doesn't store this
    });
    setFormErrors({});
    setModalVisible(true);
  };

  /**
   * Map frontend billingCycle to backend frequency format
   */
  const mapBillingCycleToFrequency = (cycle: string): 'weekly' | 'monthly' | 'quarterly' | 'yearly' => {
    const mapping: Record<string, 'weekly' | 'monthly' | 'quarterly' | 'yearly'> = {
      'WEEKLY': 'weekly',
      'MONTHLY': 'monthly',
      'QUARTERLY': 'quarterly',
      'YEARLY': 'yearly',
    };
    return mapping[cycle] || 'monthly'; // Default to monthly
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    // Parse price safely (handles both comma and dot)
    const parsedPrice = parsePriceInput(priceInput);
    if (parsedPrice === null) {
      Alert.alert('Error', 'Invalid price format');
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
        status: 'active',
      };

      // Add optional fields only if they have values
      if (formData.endDate) {
        requestData.nextDueDate = formData.endDate;
      }
      if (formData.description) {
        requestData.notes = formData.description;
      }
      if (formData.reminderDays && requestData.notes) {
        requestData.notes = `${requestData.notes}\nReminder ${formData.reminderDays} days before`;
      } else if (formData.reminderDays) {
        requestData.notes = `Reminder ${formData.reminderDays} days before`;
      }

      // Map categoryId to contractId if it's a valid number
      if (formData.categoryId) {
        const contractId = parseInt(formData.categoryId, 10);
        if (!isNaN(contractId)) {
          requestData.contractId = contractId;
        }
      }

      console.log('[Subscription] Sending request:', JSON.stringify(requestData, null, 2));

      if (editingSubscription) {
        const updated = await subscriptionService.update(editingSubscription.id, requestData);
        setSubscriptions(subscriptions.map(s => s.id === updated.id ? updated : s));
        Alert.alert('Success', 'Subscription updated successfully');
      } else {
        const created = await subscriptionService.create(requestData);
        setSubscriptions([created, ...subscriptions]);
        Alert.alert('Success', 'Subscription created successfully');
      }
      setModalVisible(false);
    } catch (err: any) {
      console.error('[Subscription] Save error:', err);
      console.error('[Subscription] Error response:', err.response?.data);

      // Extract detailed error message
      let errorMessage = 'Failed to save subscription';
      if (err.response?.data) {
        const { message, error, errors } = err.response.data;
        if (Array.isArray(errors) && errors.length > 0) {
          errorMessage = errors.join(', ');
        } else if (message) {
          errorMessage = Array.isArray(message) ? message.join(', ') : message;
        } else if (error) {
          errorMessage = error;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }

      Alert.alert('Error', errorMessage);
    }
  };

  const handleDelete = (subscription: Subscription) => {
    Alert.alert(
      'Delete Subscription',
      `Are you sure you want to delete "${subscription.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await subscriptionService.delete(subscription.id);
              setSubscriptions(subscriptions.filter(s => s.id !== subscription.id));
              Alert.alert('Success', 'Subscription deleted successfully');
            } catch (err: any) {
              Alert.alert('Error', err.response?.data?.message || err.message || 'Failed to delete subscription');
            }
          },
        },
      ]
    );
  };

  const handlePauseResume = async (subscription: Subscription) => {
    try {
      const updated = subscription.status === 'active'
        ? await subscriptionService.pause(subscription.id)
        : await subscriptionService.resume(subscription.id);

      setSubscriptions(subscriptions.map(s => s.id === updated.id ? updated : s));
      Alert.alert('Success', `Subscription ${subscription.status === 'active' ? 'paused' : 'resumed'} successfully`);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || err.message || 'Failed to update subscription');
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
      case 'monthly': return 'Monthly';
      case 'yearly': return 'Yearly';
      case 'weekly': return 'Weekly';
      case 'quarterly': return 'Quarterly';
      default: return cycle;
    }
  };

  const renderSubscriptionItem = ({ item }: { item: Subscription }) => (
    <View style={styles.subscriptionCard}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleContainer}>
          <Text style={styles.cardTitle}>{item.name}</Text>
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
        <Text style={styles.detailText}>
          {getBillingCycleLabel(item.frequency)}
        </Text>
        {item.category && (
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryIcon}>{item.category.icon}</Text>
            <Text style={styles.categoryText}>{item.category.name}</Text>
          </View>
        )}
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.dateText}>
          Start: {new Date(item.startDate).toLocaleDateString()}
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
          <Text style={styles.headerTitle}>Subscriptions</Text>
        </View>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading subscriptions...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Subscriptions</Text>
        </View>
        <View style={styles.centerContent}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchData}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Subscriptions</Text>
          <Text style={styles.headerSubtitle}>
            {subscriptions.length} subscription{subscriptions.length !== 1 ? 's' : ''}
          </Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
          <Text style={styles.addButtonText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {subscriptions.length === 0 ? (
        <View style={styles.centerContent}>
          <Text style={styles.emptyText}>No subscriptions yet</Text>
          <Text style={styles.emptySubtext}>Tap the + Add button to create your first subscription</Text>
        </View>
      ) : (
        <FlatList
          data={subscriptions}
          renderItem={renderSubscriptionItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />
          }
        />
      )}

      {/* Add/Edit Modal */}
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
                  {editingSubscription ? 'Edit Subscription' : 'Add Subscription'}
                </Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Text style={styles.closeButton}>✕</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Name *</Text>
                <TextInput
                  style={[styles.input, formErrors.name && styles.inputError]}
                  value={formData.name}
                  onChangeText={(text) => setFormData({ ...formData, name: text })}
                  placeholder="e.g., Netflix, Spotify"
                  placeholderTextColor="#9ca3af"
                />
                {formErrors.name && <Text style={styles.errorLabel}>{formErrors.name}</Text>}
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Description</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={formData.description}
                  onChangeText={(text) => setFormData({ ...formData, description: text })}
                  placeholder="Optional description"
                  placeholderTextColor="#9ca3af"
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.formRow}>
                <View style={[styles.formGroup, styles.formGroupHalf]}>
                  <Text style={styles.label}>Price *</Text>
                  <TextInput
                    style={[styles.input, formErrors.price && styles.inputError]}
                    value={priceInput}
                    onChangeText={(text) => setPriceInput(text)}
                    placeholder="15.99 or 15,99"
                    placeholderTextColor="#9ca3af"
                    keyboardType="decimal-pad"
                  />
                  {formErrors.price && <Text style={styles.errorLabel}>{formErrors.price}</Text>}
                </View>

                <View style={[styles.formGroup, styles.formGroupHalf]}>
                  <Text style={styles.label}>Billing Cycle *</Text>
                  <View style={styles.pickerContainer}>
                    <Picker
                      selectedValue={formData.billingCycle}
                      onValueChange={(value) => setFormData({ ...formData, billingCycle: value })}
                      style={styles.picker}
                      dropdownIconColor="#fff"
                    >
                      <Picker.Item label="Weekly" value="WEEKLY" />
                      <Picker.Item label="Monthly" value="MONTHLY" />
                      <Picker.Item label="Quarterly" value="QUARTERLY" />
                      <Picker.Item label="Yearly" value="YEARLY" />
                    </Picker>
                  </View>
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Category</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={formData.categoryId}
                    onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
                    style={styles.picker}
                    dropdownIconColor="#fff"
                  >
                    <Picker.Item label="No category" value="" />
                    {categories.map((cat) => (
                      <Picker.Item key={cat.id} label={`${cat.icon} ${cat.name}`} value={cat.id} />
                    ))}
                  </Picker>
                </View>
              </View>

              <View style={styles.formRow}>
                <View style={[styles.formGroup, styles.formGroupHalf]}>
                  <Text style={styles.label}>Start Date *</Text>
                  <TextInput
                    style={[styles.input, formErrors.startDate && styles.inputError]}
                    value={formData.startDate}
                    onChangeText={(text) => setFormData({ ...formData, startDate: text })}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#9ca3af"
                  />
                  {formErrors.startDate && <Text style={styles.errorLabel}>{formErrors.startDate}</Text>}
                </View>

                <View style={[styles.formGroup, styles.formGroupHalf]}>
                  <Text style={styles.label}>End Date</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.endDate || ''}
                    onChangeText={(text) => setFormData({ ...formData, endDate: text || undefined })}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#9ca3af"
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Reminder Days Before</Text>
                <TextInput
                  style={styles.input}
                  value={formData.reminderDays?.toString() || '3'}
                  onChangeText={(text) => setFormData({ ...formData, reminderDays: parseInt(text) || 3 })}
                  placeholder="3"
                  placeholderTextColor="#9ca3af"
                  keyboardType="number-pad"
                />
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.submitButton]}
                  onPress={handleSubmit}
                >
                  <Text style={styles.submitButtonText}>
                    {editingSubscription ? 'Update' : 'Create'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
});
