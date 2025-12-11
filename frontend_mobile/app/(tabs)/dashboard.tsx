import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { ScreenWithFooter } from '@/components/ui/ScreenWithFooter';

export default function DashboardScreen() {
  const [selected, setSelected] = useState('');

  return (
    <ScreenWithFooter>
      <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Dashboard</Text>
        <Text style={styles.headerSubtitle}>
          Gérez vos rappels et événements
        </Text>
      </View>

      <View style={styles.calendarContainer}>
        <Calendar
          testID="calendar"
          onDayPress={(day) => {
            setSelected(day.dateString);
          }}
          markedDates={{
            [selected]: {
              selected: true,
              selectedColor: '#6366f1',
            },
          }}
          theme={{
            backgroundColor: '#ffffff',
            calendarBackground: '#ffffff',
            textSectionTitleColor: '#6366f1',
            selectedDayBackgroundColor: '#6366f1',
            selectedDayTextColor: '#ffffff',
            todayTextColor: '#6366f1',
            dayTextColor: '#2d4150',
            textDisabledColor: '#d9e1e8',
            dotColor: '#6366f1',
            selectedDotColor: '#ffffff',
            arrowColor: '#6366f1',
            monthTextColor: '#6366f1',
            indicatorColor: '#6366f1',
            textDayFontWeight: '300',
            textMonthFontWeight: 'bold',
            textDayHeaderFontWeight: '500',
            textDayFontSize: 16,
            textMonthFontSize: 18,
            textDayHeaderFontSize: 14,
          }}
        />
      </View>

      <View style={styles.remindersSection}>
        <Text style={styles.sectionTitle}>Rappels du jour</Text>
        {selected ? (
          <View style={styles.reminderCard}>
            <Text style={styles.reminderText}>
              Aucun rappel pour le {selected}
            </Text>
          </View>
        ) : (
          <View style={styles.reminderCard}>
            <Text style={styles.reminderText}>
              Sélectionnez une date pour voir vos rappels
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
    </ScreenWithFooter>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 20,
    backgroundColor: '#6366f1',
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
    backgroundColor: '#fff',
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
  remindersSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  reminderCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  reminderText: {
    fontSize: 16,
    color: '#666',
  },
});
