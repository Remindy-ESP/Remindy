import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Event } from '@/services/api';
import { useTranslation } from '@/context/I18nContext';
import { formatLongDate, formatCurrency } from '@/utils/format';

interface DailyExpensesSummaryProps {
    date: string | null;
    events: Event[];
}

export const DailyExpensesSummary: React.FC<DailyExpensesSummaryProps> = ({ date, events }) => {
    const { t, language } = useTranslation();

    if (!date) return null;

    const totalAmount = events.reduce((sum, event) => {
        return sum + (event.subscription?.amount || 0);
    }, 0);

    const formattedDate = formatLongDate(new Date(date), language);

    return (
        <View style={styles.container}>
            <View style={styles.iconContainer}>
                <Ionicons name="receipt-outline" size={24} color="#1F1F39" />
            </View>
            <View style={styles.textContainer}>
                <Text style={styles.title}>{t('common.dailyExpenses.title')}</Text>
                <Text style={styles.date}>{formattedDate}</Text>
            </View>
            <View style={styles.amountContainer}>
                <Text style={styles.amount}>{formatCurrency(totalAmount, language)}</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1F1F39', // Dark background matching the theme
        borderRadius: 12,
        padding: 16,
        marginHorizontal: 16,
        marginTop: 16,
        borderWidth: 1,
        borderColor: '#373848',
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    textContainer: {
        flex: 1,
    },
    title: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    date: {
        color: '#999',
        fontSize: 12,
        marginTop: 2,
    },
    amountContainer: {
        justifyContent: 'center',
    },
    amount: {
        color: '#fff',
        fontSize: 24,
        fontWeight: 'bold',
    },
});
