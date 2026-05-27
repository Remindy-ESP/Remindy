import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  ScrollView,
  RefreshControl,
  Platform,
  Switch,
} from 'react-native';
import AppPicker, { PickerItem } from '@/shared/ui/AppPicker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Subscription, Category } from '@/services/api';
import CoachMarkTarget from '@/shared/ui/system/CoachMarkTarget';
import { COACH_MARK_TARGETS } from '@/features/coach-marks/coach-marks.config';
import BrandLogo from '@/modules/dashboard/ui/BrandLogo';
import { useSubscriptionScreen, SubscriptionFormData } from '@/modules/subscriptions/application/useSubscriptionScreen';

type SubscriptionFormModalProps = Readonly<{
  visible: boolean;
  onClose: () => void;
  editingSubscription: Subscription | null;
  formData: SubscriptionFormData;
  setFormData: (d: SubscriptionFormData) => void;
  formErrors: Record<string, string>;
  priceInput: string;
  setPriceInput: (s: string) => void;
  categories: Category[];
  showStartDatePicker: boolean;
  setShowStartDatePicker: (b: boolean) => void;
  showEndDatePicker: boolean;
  setShowEndDatePicker: (b: boolean) => void;
  showTrialEndDatePicker: boolean;
  setShowTrialEndDatePicker: (b: boolean) => void;
  handleStartDateChange: (e: any, d?: Date) => void;
  handleEndDateChange: (e: any, d?: Date) => void;
  handleTrialEndDateChange: (e: any, d?: Date) => void;
  handleSubmit: () => void;
  formatDateForDisplay: (s: string) => string;
  t: (k: string, p?: any) => string;
}>;

function SubscriptionFormModal({
  visible, onClose, editingSubscription, formData, setFormData, formErrors,
  priceInput, setPriceInput, categories,
  showStartDatePicker, setShowStartDatePicker,
  showEndDatePicker, setShowEndDatePicker,
  showTrialEndDatePicker, setShowTrialEndDatePicker,
  handleStartDateChange, handleEndDateChange, handleTrialEndDateChange,
  handleSubmit, formatDateForDisplay, t,
}: SubscriptionFormModalProps) {
  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingSubscription ? t('subscription.modal.titleEdit') : t('subscription.modal.titleAdd')}
              </Text>
              <TouchableOpacity onPress={onClose}>
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
              {!!formErrors.name && <Text style={styles.errorLabel}>{formErrors.name}</Text>}
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
                {!!formErrors.price && <Text style={styles.errorLabel}>{formErrors.price}</Text>}
              </View>

              <View style={[styles.formGroup, styles.formGroupHalf]}>
                <Text style={styles.label}>{t('subscription.modal.billingCycle')}</Text>
                <AppPicker
                  selectedValue={formData.billingCycle}
                  onValueChange={(value) => setFormData({ ...formData, billingCycle: value as SubscriptionFormData['billingCycle'] })}
                  items={[
                    { label: t('subscription.cycle.oneTime'), value: 'ONE_TIME' },
                    { label: t('subscription.cycle.weeklyShort'), value: 'WEEKLY' },
                    { label: t('subscription.cycle.monthlyShort'), value: 'MONTHLY' },
                    { label: t('subscription.cycle.quarterlyShort'), value: 'QUARTERLY' },
                    { label: t('subscription.cycle.yearly'), value: 'YEARLY' },
                  ]}
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>{t('subscription.modal.category')}</Text>
              <AppPicker
                selectedValue={formData.categoryId}
                onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
                items={[
                  { label: t('subscription.modal.noCategory'), value: '' },
                  ...categories.map((cat): PickerItem => ({ label: cat.name, value: cat.id })),
                ]}
              />
            </View>

            <View style={styles.formGroup}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={styles.label}>Période d'essai</Text>
                <Switch
                  value={formData.isTrial}
                  onValueChange={(value) => {
                    const updates: Partial<SubscriptionFormData> = { isTrial: value };
                    if (value && !formData.trialEndDate) {
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
                  <TouchableOpacity style={styles.dateButton} onPress={() => setShowTrialEndDatePicker(true)}>
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
                {!!formErrors.startDate && <Text style={styles.errorLabel}>{formErrors.startDate}</Text>}
              </View>

              <View style={[styles.formGroup, styles.formGroupHalf]}>
                <Text style={styles.label}>{t('subscription.modal.endDate')}</Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TouchableOpacity style={[styles.dateButton, { flex: 1 }]} onPress={() => setShowEndDatePicker(true)}>
                    <Text style={styles.dateButtonText}>
                      {formData.endDate ? formatDateForDisplay(formData.endDate) : t('subscription.modal.datePlaceholder')}
                    </Text>
                    <Text style={styles.dateIcon}>📅</Text>
                  </TouchableOpacity>
                  {formData.endDate && (
                    <TouchableOpacity style={styles.clearButton} onPress={() => setFormData({ ...formData, endDate: undefined })}>
                      <Text style={styles.clearButtonText}>✕</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>

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
                value={new Date(formData.endDate || formData.startDate || Date.now())}
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
                  const parsed = Number.parseInt(text, 10);
                  setFormData({ ...formData, reminderDays: Number.isNaN(parsed) ? 0 : Math.min(Math.max(parsed, 0), 365) });
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
              <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={onClose}>
                <Text style={styles.cancelButtonText}>{t('subscription.modal.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.submitButton]} onPress={handleSubmit}>
                <Text style={styles.submitButtonText}>
                  {editingSubscription ? t('subscription.modal.update') : t('subscription.modal.create')}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

type SubscriptionCardProps = Readonly<{
  item: Subscription;
  getStatusColor: (s: string) => string;
  getBillingCycleLabel: (c: string) => string;
  formatDate: (d: string | undefined) => string;
  handlePauseResume: (s: Subscription) => void;
  openEditModal: (s: Subscription) => void;
  handleDelete: (s: Subscription) => void;
  t: (k: string, p?: any) => string;
}>;

function SubscriptionCard({ item, getStatusColor, getBillingCycleLabel, formatDate, handlePauseResume, openEditModal, handleDelete, t }: SubscriptionCardProps) {
  return (
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
          <TouchableOpacity style={styles.actionButton} onPress={() => handlePauseResume(item)}>
            <Text style={styles.actionButtonText}>
              {item.status === 'active' ? '⏸' : '▶️'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => openEditModal(item)}>
            <Text style={styles.actionButtonText}>✏️</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, styles.deleteButton]} onPress={() => handleDelete(item)}>
            <Text style={styles.actionButtonText}>🗑️</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

export default function SubscriptionScreen() {
  const {
    t,
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
    fetchData, onRefresh,
    handleStartDateChange, handleEndDateChange, handleTrialEndDateChange,
    openAddModal, openEditModal, handleSubmit, handleDelete, handlePauseResume,
    getStatusColor, getBillingCycleLabel, formatDate, formatDateForDisplay,
  } = useSubscriptionScreen();

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
          <AppPicker
            selectedValue={filterFrequency}
            onValueChange={(value) => setFilterFrequency(value)}
            items={[
              { label: t('subscription.filterAll'), value: '' },
              { label: t('subscription.cycle.oneTime'), value: 'one-time' },
              { label: t('subscription.cycle.weekly'), value: 'weekly' },
              { label: t('subscription.cycle.monthly'), value: 'monthly' },
              { label: t('subscription.cycle.quarterly'), value: 'quarterly' },
              { label: t('subscription.cycle.yearly'), value: 'yearly' },
            ]}
          />
        </View>

        <View style={styles.filterGroup}>
          <Text style={styles.filterLabel}>{t('subscription.filterCategoryLabel')}</Text>
          <AppPicker
            selectedValue={filterCategoryId}
            onValueChange={(value) => setFilterCategoryId(value)}
            items={[
              { label: t('subscription.filterAllCategories'), value: '' },
              ...categories.map((cat): PickerItem => ({ label: cat.name, value: cat.id })),
            ]}
          />
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
          renderItem={({ item }) => (
            <SubscriptionCard
              item={item}
              getStatusColor={getStatusColor}
              getBillingCycleLabel={getBillingCycleLabel}
              formatDate={formatDate}
              handlePauseResume={handlePauseResume}
              openEditModal={openEditModal}
              handleDelete={handleDelete}
              t={t}
            />
          )}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />
          }
        />
      )}

      <SubscriptionFormModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        editingSubscription={editingSubscription}
        formData={formData}
        setFormData={setFormData}
        formErrors={formErrors}
        priceInput={priceInput}
        setPriceInput={setPriceInput}
        categories={categories}
        showStartDatePicker={showStartDatePicker}
        setShowStartDatePicker={setShowStartDatePicker}
        showEndDatePicker={showEndDatePicker}
        setShowEndDatePicker={setShowEndDatePicker}
        showTrialEndDatePicker={showTrialEndDatePicker}
        setShowTrialEndDatePicker={setShowTrialEndDatePicker}
        handleStartDateChange={handleStartDateChange}
        handleEndDateChange={handleEndDateChange}
        handleTrialEndDateChange={handleTrialEndDateChange}
        handleSubmit={handleSubmit}
        formatDateForDisplay={formatDateForDisplay}
        t={t}
      />

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
