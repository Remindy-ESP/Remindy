import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useDashboard } from '@/hooks/useDashboard';
import { useAuth } from '@/context/AuthContext';
import Button from '@/components/Button';
import AddOperationButton from '@/components/AddOperationButton';
import type { Category } from '@/services/api';
import { translateEventStatus, getEventStatusColor } from '@/utils/translations';
import AddOperationModal from '@/components/AddOperationModal';

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
    getContentForPeriod,
    categories,
    events,
    loading,
    error,
    getEventsForDate,
    getEventsByCategory,
    fetchDashboardData,
  } = useDashboard();

    const { token } = useAuth();
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
    router.push('/manual-entry');
  };

  const handlePdfInsert = () => {
    setAddOperationModalOpen(false);
    console.log('PDF insert selected');
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

        {/* Events for selected date */}
        {selected && (
          <View style={{ padding: 16, backgroundColor: '#2a2a5e', marginTop: 16, borderRadius: 8 }}>
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 12 }}>
              Événements du {selected}
            </Text>
            {selectedDateEvents.length === 0 ? (
              <Text style={{ color: '#999', fontStyle: 'italic' }}>
                Aucun événement pour cette date
              </Text>
            ) : (
              selectedDateEvents.map((event) => (
                <View
                  key={event.id}
                  style={{
                    backgroundColor: '#373848',
                    padding: 12,
                    borderRadius: 6,
                    marginBottom: 8,
                    borderLeftWidth: 4,
                    borderLeftColor: getEventStatusColor(event.status),
                  }}
                >
                  <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>
                    {event.title}
                  </Text>
                  {event.description && (
                    <Text style={{ color: '#999', fontSize: 12, marginTop: 4 }}>
                      {event.description}
                    </Text>
                  )}
                  {event.subscription && (
                    <Text style={{ color: '#4f46e5', fontSize: 12, marginTop: 4 }}>
                      {event.subscription.name} - {event.subscription.amount}€
                    </Text>
                  )}
                  <Text
                    style={{
                      color: getEventStatusColor(event.status),
                      fontSize: 11,
                      marginTop: 4,
                      fontWeight: '500',
                    }}
                  >
                    {translateEventStatus(event.status)}
                  </Text>
                </View>
              ))
            )}
          </View>
        )}

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
          <Text style={styles.contentText} testID="period-content">
            {getContentForPeriod(activePeriod)}
          </Text>
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
});