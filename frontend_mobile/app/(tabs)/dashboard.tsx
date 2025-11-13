import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { styles } from './dashboard.styles';

type TimePeriod = 'day' | 'week' | 'month' | 'year';

export default function DashboardScreen() {
  const [selected, setSelected] = useState('');
  const [activePeriod, setActivePeriod] = useState<TimePeriod>('day');

  const timePeriods: { key: TimePeriod; label: string; value: string }[] = [
    { key: 'day', label: 'Ce jour', value: '1' },
    { key: 'week', label: 'Semaine', value: '2' },
    { key: 'month', label: 'Mensuel', value: '3' },
    { key: 'year', label: 'Année', value: '4' },
  ];

  const getContentForPeriod = (period: TimePeriod): string => {
    const periodData = timePeriods.find((p) => p.key === period);
    return periodData?.value || '1';
  };

  return (
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
              selectedColor: '#4f46e5',
            },
          }}
          theme={{
            backgroundColor: '#2a2a5e',
            calendarBackground: '#2a2a5e',
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

      {/* Contenu en fonction de la période sélectionnée */}
      <View style={styles.contentSection}>
        <Text style={styles.contentText} testID="period-content">
          {getContentForPeriod(activePeriod)}
        </Text>
      </View>
    </ScrollView>
  );
}
