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

      {/* Menu de filtrage temporel - Détails de vos dépenses */}
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
