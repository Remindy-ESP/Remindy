import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { styles } from './dashboard.styles';
import { useDashboard } from '@/hooks/useDashboard';
import Button from '@/components/Button';

export default function DashboardScreen() {
  const {
    selected,
    setSelected,
    activePeriod,
    setActivePeriod,
    filtersOpen,
    setFiltersOpen,
    timePeriods,
    getContentForPeriod,
  } = useDashboard();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
      </View>

      {/* Bouton Filtres */}
     <Button
        onPress={() => setFiltersOpen(!filtersOpen)}
        label="Filtres"
        isOpen={filtersOpen}
      />

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