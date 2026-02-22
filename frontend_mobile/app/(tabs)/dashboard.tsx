import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import * as Localization from 'expo-localization';
import { useDashboard } from '@/hooks/useDashboard';
import { useAuth } from '@/context/AuthContext';
import Button from '@/components/Button';
import AddOperationButton from '@/components/AddOperationButton';
import type { Category } from '@/services/api';
import { DailyExpensesSummary } from '@/components/DailyExpensesSummary';
import AddOperationModal from '@/components/AddOperationModal';
import { documentService, folderService } from '@/services/api';
LocaleConfig.locales['fr'] = {
  monthNames: [
    'Janvier',
    'Février',
    'Mars',
    'Avril',
    'Mai',
    'Juin',
    'Juillet',
    'Août',
    'Septembre',
    'Octobre',
    'Novembre',
    'Décembre'
  ],
  monthNamesShort: ['Janv.', 'Févr.', 'Mars', 'Avr.', 'Mai', 'Juin', 'Juil.', 'Août', 'Sept.', 'Oct.', 'Nov.', 'Déc.'],
  dayNames: ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'],
  dayNamesShort: ['Dim.', 'Lun.', 'Mar.', 'Mer.', 'Jeu.', 'Ven.', 'Sam.'],
  today: "Aujourd'hui"
};
LocaleConfig.defaultLocale = 'fr';

export default function DashboardScreen() {
  const router = useRouter();
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

  const { token } = useAuth();
  const [uploadingDocument, setUploadingDocument] = React.useState(false);
  console.log("Current token : ", token);

  useFocusEffect(
    React.useCallback(() => {
      fetchDashboardData();
    }, [])
  );

  const selectedDateEvents = selected ? getEventsForDate(selected) : [];
  const filteredEvents = selectedCategory
    ? getEventsByCategory(selectedCategory)
    : events;

  const markedDates = React.useMemo(() => {
    const marks: any = {};

    filteredEvents.forEach((event) => {
      if (!event.dueDate) return;
      try {
        const eventDateObj = new Date(event.dueDate);
        if (isNaN(eventDateObj.getTime())) return;
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
        <Text style={{ color: '#fff', marginTop: 16 }}>Chargement de la page d'accueil...</Text>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
        <Text style={{ color: '#ff6b6b', fontSize: 16, textAlign: 'center' }}>
          Error: {error}
        </Text>
        <Text style={{ color: '#999', marginTop: 8, textAlign: 'center' }}>
          Make sure the backend server is running and your network connection is stable
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
          'Fichier trop volumineux',
          'Le fichier ne peut pas dépasser 10 MB. Veuillez choisir un fichier plus petit.',
          [{ text: 'OK' }]
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
          'Analyse échouée',
          'L\'analyse automatique du document a échoué. Vous pouvez saisir les informations manuellement.',
          [{ text: 'OK' }]
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

      let errorMessage = 'Une erreur est survenue lors de l\'upload du document.';

      if (error.message) {
        errorMessage = error.message;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      Alert.alert(
        'Erreur',
        errorMessage,
        [{ text: 'OK' }]
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
          label={selectedCategory || "Catégories"}
          isOpen={categoriesOpen}
        />

        {categoriesOpen && (
          <View style={styles.categoriesContainer}>
            {categories.length === 0 ? (
              <Text style={{ color: '#999', padding: 16, textAlign: 'center' }}>
                No categories available. Please add some categories first.
              </Text>
            ) : (
              <>
                <TouchableOpacity
                  style={styles.categoryItem}
                  onPress={() => {
                    setSelectedCategory(null);
                    setCategoriesOpen(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.categoryText}>Toutes les catégories</Text>
                </TouchableOpacity>
                {categories.map((category: Category) => (
                  <TouchableOpacity
                    key={category.id}
                    style={styles.categoryItem}
                    onPress={() => {
                      setSelectedCategory(category.name);
                      setCategoriesOpen(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.categoryText}>
                      {category.icon} {category.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </>
            )}
          </View>
        )}

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

        <DailyExpensesSummary
          date={selected}
          events={selectedDateEvents}
        />


        <View style={styles.timePeriodSection}>
          <Text style={styles.timePeriodTitle}>Détails de vos dépenses</Text>
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
          {getEventsForPeriod(activePeriod, selected).length === 0 ? (
            <Text style={{ color: '#999', textAlign: 'center', marginVertical: 20 }}>
              Aucune dépense pour cette période
            </Text>
          ) : (
            <ScrollView
              style={{ maxHeight: 325 }}
              nestedScrollEnabled={true}
              showsVerticalScrollIndicator={true}
            >
              {getEventsForPeriod(activePeriod, selected).map((event) => (
                <View key={event.id} style={styles.expenseItem}>
                  <View style={styles.expenseLeft}>
                    <View style={styles.expenseIconPlaceholder} />
                    <View>
                      <Text style={styles.expenseTitle}>
                        {event.subscription?.name || event.title}
                      </Text>
                      <Text style={styles.expenseCategory}>
                        {event.subscription?.category?.name || 'Général'}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.expenseAmount}>
                    {event.subscription?.amount ? `${event.subscription.amount}€` : '-'}
                  </Text>
                </View>
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
            <Text style={styles.uploadText}>Analyse en cours...</Text>
            <Text style={styles.uploadSubtext}>Extraction des données par IA</Text>
            <Text style={styles.uploadSubtext2}>Cela peut prendre jusqu'à 30 secondes</Text>
          </View>
        </View>
      )}
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
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#e0e7ff',
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
  categoriesContainer: {
    position: 'absolute',
    top: 64,
    alignSelf: 'center',
    minWidth: 146,
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
    overflow: 'hidden',
    zIndex: 1000,
  },
  categoryItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F1F39',
    textAlign: 'center',
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
});