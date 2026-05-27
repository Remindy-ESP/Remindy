import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet, Alert, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Calendar } from 'react-native-calendars';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import * as Localization from 'expo-localization';
import { useDashboard } from '@/modules/dashboard/application/useDashboard';
import type { AggregatedEvent } from '@/modules/dashboard/application/useDashboard';
import { useTranslation } from '@/shared/application/I18nContext';
import Button from '@/shared/ui/Button';
import AddOperationButton from '@/modules/dashboard/ui/AddOperationButton';
import CoachMarkTarget from '@/shared/ui/system/CoachMarkTarget';
import { COACH_MARK_TARGETS } from '@/features/coach-marks/coach-marks.config';
import { DailyExpensesSummary } from '@/modules/dashboard/ui/DailyExpensesSummary';
import AddOperationModal from '@/modules/dashboard/ui/AddOperationModal';
import { documentService, folderService } from '@/services/api';
import CategoryDropdown from '@/modules/dashboard/ui/CategoryDropdown';
import BrandLogo from '@/modules/dashboard/ui/BrandLogo';

function ModalDetailRow({
  icon,
  label,
  children,
}: Readonly<{
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  children: React.ReactNode;
}>) {
  return (
    <View style={styles.modalRow}>
      <View style={styles.modalRowLeft}>
        <Ionicons name={icon} size={18} color="#6366f1" />
        <Text style={styles.modalLabel}>{label}</Text>
      </View>
      <Text style={styles.modalValue}>{children}</Text>
    </View>
  );
}

export default function DashboardScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const {
    selected,
    setSelected,
    activePeriod,
    setActivePeriod,
    categoriesOpen,
    setCategoriesOpen,
    selectedCategory,
    setSelectedCategory,
    addOperationModalOpen,
    setAddOperationModalOpen,
    timePeriods,
    getEventsForPeriod,
    categories,
    events,
    loading,
    error,
    getEventsForDate,
    getEventsByCategory,
    fetchDashboardData,
  } = useDashboard();

  const [uploadingDocument, setUploadingDocument] = React.useState(false);
  const [selectedExpense, setSelectedExpense] = React.useState<AggregatedEvent | null>(null);

  useFocusEffect(
    React.useCallback(() => {
      fetchDashboardData();
    }, [])
  );

  const selectedDateEvents = selected
    ? getEventsForDate(selected).filter((e) =>
        selectedCategory ? e.subscription?.category?.name === selectedCategory : true
      )
    : [];
  const filteredEvents = selectedCategory
    ? getEventsByCategory(selectedCategory)
    : events;

  const markedDates = React.useMemo(() => {
    const marks: any = {};

    filteredEvents.forEach((event) => {
      if (!event.dueDate) return;
      try {
        const eventDateObj = new Date(event.dueDate);
        if (Number.isNaN(eventDateObj.getTime())) return;
        const dateKey = eventDateObj.toISOString().split('T')[0];
        marks[dateKey] = {
          marked: true,
          dotColor: '#32c80e',
        };
      } catch (error) {
        console.error('Error parsing event date:', error);
      }
    });

    if (selected) {
      marks[selected] = {
        ...marks[selected],
        selected: true,
        selectedColor: '#4f46e5',
      };
    }

    return marks;
  }, [filteredEvents, selected]);

  // Loading state
  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#4f46e5" />
        <Text style={{ color: '#fff', marginTop: 16 }}>{t('dashboard.loading')}</Text>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
        <Text style={{ color: '#ff6b6b', fontSize: 16, textAlign: 'center' }}>
          {t('dashboard.errorPrefix', { message: String(error) })}
        </Text>
        <Text style={{ color: '#999', marginTop: 8, textAlign: 'center' }}>
          {t('dashboard.errorHint')}
        </Text>
      </View>
    );
  }

  const handleManualEntry = () => {
    setAddOperationModalOpen(false);
    router.push({ pathname: '/(tabs)/subscription', params: { openAdd: Date.now().toString() } });
  };

  /**
   * Get the default "Subscriptions" folder ID based on device language
   * Creates the folder if it doesn't exist
   */
  const getDefaultSubscriptionFolderId = async (): Promise<string | undefined> => {
    try {
      const locale = Localization.getLocales()[0];
      const isFrench = locale?.languageCode === 'fr';
      const folderName = isFrench ? 'Abonnements' : 'Subscriptions';

      // Get all folders
      const folders = await folderService.getAllFolders();

      // Find the default folder by name (no parent)
      const defaultFolder = folders.find(
        folder => folder.name === folderName && !folder.parentId
      );

      return defaultFolder?.id;
    } catch (error) {
      console.error('Error getting default subscription folder:', error);
      return undefined;
    }
  };

  const handlePdfInsert = async () => {
    setAddOperationModalOpen(false);

    try {
      // Open document picker for PDF files only
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled) {
        console.log('Document selection cancelled');
        return;
      }

      const selectedFile = result.assets[0];
      console.log('File selected:', {
        name: selectedFile.name,
        size: selectedFile.size,
        type: selectedFile.mimeType,
        uri: selectedFile.uri,
      });

      // Check file size (max 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB in bytes
      if (selectedFile.size && selectedFile.size > maxSize) {
        Alert.alert(
          t('dashboard.fileTooLargeTitle'),
          t('dashboard.fileTooLargeMessage'),
          [{ text: t('common.ok') }]
        );
        return;
      }

      // Set loading state
      setUploadingDocument(true);

      // Get the default subscription folder ID
      const folderId = await getDefaultSubscriptionFolderId();

      // Upload document to backend
      const uploadedDocument = await documentService.uploadDocument({
        file: {
          uri: selectedFile.uri,
          name: selectedFile.name,
          type: selectedFile.mimeType || 'application/pdf',
          size: selectedFile.size,
        },
        folder_id: folderId,
      });

      console.log('Document uploaded successfully:', uploadedDocument);

      // Wait for OCR and parsing to complete (poll every 2 seconds, max 30 seconds)
      let documentWithParsedData = uploadedDocument;
      const maxAttempts = 15; // 15 attempts * 2 seconds = 30 seconds max
      let attempts = 0;

      while (
        attempts < maxAttempts &&
        documentWithParsedData.ocr_status !== 'completed' &&
        documentWithParsedData.ocr_status !== 'failed'
      ) {
        console.log(`Polling document status... attempt ${attempts + 1}/${maxAttempts}`);
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds

        try {
          documentWithParsedData = await documentService.getDocument(uploadedDocument.id);
          console.log('Document status:', documentWithParsedData.ocr_status);
        } catch (error) {
          console.error('Error polling document:', error);
          break;
        }

        attempts++;
      }

      if (documentWithParsedData.ocr_status === 'failed') {
        Alert.alert(
          t('dashboard.ocrFailedTitle'),
          t('dashboard.ocrFailedMessage'),
          [{ text: t('common.ok') }]
        );
      }

      // Navigate to subscription page with parsed data
      router.push({
        pathname: '/(tabs)/subscription',
        params: {
          openAdd: Date.now().toString(),
          documentId: documentWithParsedData.id,
          // Pre-fill with parsed data
          parsedProvider: documentWithParsedData.parsed_provider || '',
          parsedAmount: documentWithParsedData.parsed_amount?.toString() || '',
          parsedCurrency: documentWithParsedData.parsed_currency || 'EUR',
          parsedDate: documentWithParsedData.parsed_date || '',
          parsedFrequency: documentWithParsedData.parsed_frequency || '',
          parsedCategory: documentWithParsedData.parsed_category || '',
        },
      });

    } catch (error: any) {
      console.error('Error uploading document:', error);

      let errorMessage = t('dashboard.uploadErrorFallback');

      if (error.message) {
        errorMessage = error.message;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      Alert.alert(
        t('common.error'),
        errorMessage,
        [{ text: t('common.ok') }]
      );
    } finally {
      setUploadingDocument(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={styles.container}>
        <View style={styles.header} />

        <Button
          onPress={() => setCategoriesOpen(!categoriesOpen)}
          label={selectedCategory || t('dashboard.categoriesDropdown')}
          isOpen={categoriesOpen}
        />

        {categoriesOpen && (
          <CategoryDropdown
            categories={categories}
            emptyLabel={t('dashboard.categoriesEmpty')}
            allLabel={t('dashboard.allCategories')}
            onSelectAll={() => { setSelectedCategory(null); setCategoriesOpen(false); }}
            onSelect={(name) => { setSelectedCategory(name); setCategoriesOpen(false); }}
          />
        )}

        <CoachMarkTarget targetKey={COACH_MARK_TARGETS.dashboardCalendar}>
        <View style={styles.calendarContainer}>
          <Calendar
            testID="calendar"
            onDayPress={(day) => {
              setSelected(day.dateString);
            }}
            markedDates={markedDates}
            theme={{
              backgroundColor: '#2a2a5e',
              calendarBackground: '#373848',
              textSectionTitleColor: '#fff',
              selectedDayBackgroundColor: '#4f46e5',
              selectedDayTextColor: '#ffffff',
              todayTextColor: '#4f46e5',
              dayTextColor: '#e0e0e0',
              textDisabledColor: '#5a5a7a',
              dotColor: '#4f46e5',
              selectedDotColor: '#ffffff',
              arrowColor: '#fff',
              monthTextColor: '#fff',
              indicatorColor: '#4f46e5',
              textDayFontWeight: '300',
              textMonthFontWeight: 'bold',
              textDayHeaderFontWeight: '500',
              textDayFontSize: 16,
              textMonthFontSize: 18,
              textDayHeaderFontSize: 14,
            }}
          />
        </View>
        </CoachMarkTarget>

        <DailyExpensesSummary
          date={selected}
          events={selectedDateEvents}
        />


        <View style={styles.timePeriodSection}>
          <Text style={styles.timePeriodTitle}>{t('dashboard.expensesTitle')}</Text>
          <View style={styles.timePeriodMenu}>
            {timePeriods.map((period) => (
              <TouchableOpacity
                key={period.key}
                testID={`period-${period.key}`}
                style={[
                  styles.timePeriodTab,
                  activePeriod === period.key
                    ? styles.timePeriodTabActive
                    : styles.timePeriodTabInactive,
                ]}
                onPress={() => setActivePeriod(period.key)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.timePeriodTabText,
                    activePeriod === period.key
                      ? styles.timePeriodTabTextActive
                      : styles.timePeriodTabTextInactive,
                  ]}
                >
                  {period.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.contentSection}>
          {getEventsForPeriod(activePeriod, selected, selectedCategory).length === 0 ? (
            <Text style={{ color: '#999', textAlign: 'center', marginVertical: 20 }}>
              {t('dashboard.noExpenses')}
            </Text>
          ) : (
            <ScrollView
              style={{ maxHeight: 325 }}
              nestedScrollEnabled={true}
              showsVerticalScrollIndicator={true}
            >
              {getEventsForPeriod(activePeriod, selected, selectedCategory).map((event) => (
                <TouchableOpacity
                  key={event.id}
                  testID={`expense-item-${event.id}`}
                  style={styles.expenseItem}
                  activeOpacity={0.6}
                  onPress={() => setSelectedExpense(event)}
                >
                  <View style={styles.expenseLeft}>
                    <View style={{ marginRight: 12 }}>
                      <BrandLogo
                        name={event.subscription?.name || event.title}
                        categoryIcon={event.subscription?.category?.icon}
                        categoryColor={event.subscription?.category?.color}
                        size={40}
                      />
                    </View>
                    <View>
                      <Text style={styles.expenseTitle}>
                        {event.subscription?.name || event.title}
                      </Text>
                      <Text style={styles.expenseCategory}>
                        {event.subscription?.category?.name || t('dashboard.generalCategory')}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.expenseAmount}>
                    {Number.parseFloat(event.totalAmount.toFixed(2))}€
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>
      </ScrollView>

      <AddOperationButton
        onPress={() => setAddOperationModalOpen(true)}
      />

      <AddOperationModal
        visible={addOperationModalOpen}
        onClose={() => setAddOperationModalOpen(false)}
        onManualEntry={handleManualEntry}
        onPdfInsert={handlePdfInsert}
      />

      {uploadingDocument && (
        <View style={styles.uploadOverlay}>
          <View style={styles.uploadContainer}>
            <ActivityIndicator size="large" color="#4f46e5" />
            <Text style={styles.uploadText}>{t('dashboard.uploading')}</Text>
            <Text style={styles.uploadSubtext}>{t('dashboard.uploadingHint')}</Text>
            <Text style={styles.uploadSubtext2}>{t('dashboard.uploadingHint2')}</Text>
          </View>
        </View>
      )}

      {/* Subscription Detail Modal */}
      <Modal
        visible={selectedExpense !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedExpense(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setSelectedExpense(null)}
        >
          <TouchableOpacity activeOpacity={1} style={styles.modalContent} testID="expense-details-modal">
            {/* Close button */}
            <TouchableOpacity
              testID="expense-details-close"
              style={styles.modalCloseButton}
              onPress={() => setSelectedExpense(null)}
            >
              <Ionicons name="close" size={24} color="#999" />
            </TouchableOpacity>

            {/* Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalIconCircle}>
                <BrandLogo
                  name={selectedExpense?.subscription?.name || selectedExpense?.title || ''}
                  categoryIcon={selectedExpense?.subscription?.category?.icon}
                  categoryColor={selectedExpense?.subscription?.category?.color}
                  size={50}
                />
              </View>
              <Text style={styles.modalTitle}>
                {selectedExpense?.subscription?.name || selectedExpense?.title || ''}
              </Text>
              <Text style={styles.modalPrice}>
                {selectedExpense?.subscription?.amount?.toFixed(2) ?? selectedExpense?.totalAmount?.toFixed(2) ?? '0.00'}
                {' '}
                {selectedExpense?.subscription?.currency || '€'}
              </Text>
            </View>

            {/* Separator */}
            <View style={styles.modalSeparator} />

            {/* Details */}
            <View style={styles.modalDetails}>
              <ModalDetailRow icon="pricetag-outline" label="Catégorie">
                {selectedExpense?.subscription?.category?.name || 'Général'}
              </ModalDetailRow>

              <ModalDetailRow icon="repeat-outline" label="Type de paiement">
                {(() => {
                  const freq = selectedExpense?.subscription?.frequency;
                  switch (freq) {
                    case 'one-time': return 'Achat unique';
                    case 'weekly': return 'Hebdomadaire';
                    case 'monthly': return 'Mensuel';
                    case 'quarterly': return 'Trimestriel';
                    case 'yearly': return 'Annuel';
                    default: return freq || '—';
                  }
                })()}
              </ModalDetailRow>

              <ModalDetailRow icon="calendar-outline" label="Date de début">
                {selectedExpense?.subscription?.startDate
                  ? new Date(selectedExpense.subscription.startDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
                  : '—'}
              </ModalDetailRow>

              <ModalDetailRow icon="calendar-clear-outline" label="Date de fin">
                {selectedExpense?.subscription?.endDate
                  ? new Date(selectedExpense.subscription.endDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
                  : 'Aucune'}
              </ModalDetailRow>

              <View style={styles.modalRow}>
                <View style={styles.modalRowLeft}>
                  <Ionicons name="pulse-outline" size={18} color="#6366f1" />
                  <Text style={styles.modalLabel}>Statut</Text>
                </View>
                <View style={[
                  styles.modalStatusBadge,
                  { backgroundColor: (() => {
                    const status = selectedExpense?.subscription?.status;
                    switch (status) {
                      case 'active': return 'rgba(76, 175, 80, 0.15)';
                      case 'trial': return 'rgba(255, 193, 7, 0.15)';
                      case 'paused': return 'rgba(255, 152, 0, 0.15)';
                      default: return 'rgba(244, 67, 54, 0.15)';
                    }
                  })() },
                ]}>
                  <Text style={[
                    styles.modalStatusText,
                    { color: (() => {
                      const status = selectedExpense?.subscription?.status;
                      switch (status) {
                        case 'active': return '#4CAF50';
                        case 'trial': return '#FFC107';
                        case 'paused': return '#FF9800';
                        default: return '#F44336';
                      }
                    })() },
                  ]}>
                    {(() => {
                      const status = selectedExpense?.subscription?.status;
                      switch (status) {
                        case 'active': return 'Actif';
                        case 'trial': return 'Essai';
                        case 'paused': return 'En pause';
                        case 'cancelled': return 'Annulé';
                        default: return status || '—';
                      }
                    })()}
                  </Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#11112A',
  },
  header: {
    padding: 20,
    backgroundColor: '#11112A',
  },
  calendarContainer: {
    margin: 16,
    marginTop: 0,
    backgroundColor: '#373848',
    borderRadius: 12,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  timePeriodSection: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
  },
  timePeriodTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
    textAlign: 'left',
  },
  timePeriodMenu: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  timePeriodTab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timePeriodTabActive: {
    backgroundColor: '#000',
  },
  timePeriodTabInactive: {
    backgroundColor: 'transparent',
  },
  timePeriodTabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  timePeriodTabTextActive: {
    color: '#fff',
  },
  timePeriodTabTextInactive: {
    color: '#000',
    opacity: 0.6,
  },
  contentSection: {
    backgroundColor: '#2a2a5e',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 20,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  contentTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  contentText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#6366f1',
    textAlign: 'center',
    marginVertical: 20,
  },
  expenseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  expenseLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  expenseIconPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#000',
    marginRight: 12,
  },
  expenseTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  expenseCategory: {
    color: '#999',
    fontSize: 13,
  },
  expenseAmount: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '400',
  },
  uploadOverlay: {
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
  uploadContainer: {
    backgroundColor: '#2a2a5e',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    minWidth: 200,
  },
  uploadText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  uploadSubtext: {
    color: '#999',
    fontSize: 14,
    marginTop: 8,
  },
  uploadSubtext2: {
    color: '#666',
    fontSize: 12,
    marginTop: 4,
    fontStyle: 'italic',
  },
  // ─── Subscription Detail Modal ─────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalContent: {
    backgroundColor: '#1e1e42',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    position: 'relative',
  },
  modalCloseButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 1,
    padding: 4,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 8,
    paddingTop: 8,
  },
  modalIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
    textAlign: 'center',
  },
  modalPrice: {
    fontSize: 28,
    fontWeight: '800',
    color: '#6366f1',
    marginTop: 4,
  },
  modalSeparator: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginVertical: 16,
  },
  modalDetails: {
    gap: 14,
  },
  modalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalLabel: {
    color: '#aaa',
    fontSize: 14,
  },
  modalValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    maxWidth: '50%',
    textAlign: 'right',
  },
  modalStatusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  modalStatusText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
