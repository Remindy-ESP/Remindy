import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { supportService } from '@/services/api/support.service';
import type { SupportTicketSummary } from '@/services/api/support.service';
import { STATUS_LABELS, STATUS_COLORS } from '@/services/api/support-status';
import { useTranslation } from '@/context/I18nContext';
import ScreenHeader from '@/components/ScreenHeader';

function TicketRow({ ticket, onPress }: { ticket: SupportTicketSummary; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.ticketCard} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.ticketHeader}>
        <Text style={styles.ticketSubject} numberOfLines={1}>{ticket.subject}</Text>
        <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[ticket.status] + '22' }]}>
          <Text style={[styles.statusText, { color: STATUS_COLORS[ticket.status] }]}>
            {STATUS_LABELS[ticket.status]}
          </Text>
        </View>
      </View>
      <Text style={styles.ticketDate}>
        {new Date(ticket.createdAt).toLocaleDateString('fr-FR')}
        {ticket.lastReplyAt
          ? ` · Réponse le ${new Date(ticket.lastReplyAt).toLocaleDateString('fr-FR')}`
          : ''}
      </Text>
    </TouchableOpacity>
  );
}

export default function SupportTicketsScreen() {
  const router = useRouter();
  const { t } = useTranslation();

  const [tickets, setTickets] = useState<SupportTicketSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(false);
    try {
      const data = await supportService.listMine({ limit: 50 });
      setTickets(data.items);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.iconButton} onPress={() => router.back()} activeOpacity={0.8}>
          <Ionicons name='chevron-back' size={20} color='#fff' />
        </TouchableOpacity>
        <View style={styles.headerTextWrap}>
          <Text style={styles.headerTitle}>{t('support.tickets.title')}</Text>
          <Text style={styles.headerSubtitle}>{t('support.tickets.subtitle')}</Text>
        </View>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => router.push('/(stack)/support-new')}
          activeOpacity={0.8}
        >
          <Ionicons name='add' size={22} color='#fff' />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color='#4B4FC9' style={{ marginTop: 40 }} />
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{t('support.tickets.error')}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => void load()} activeOpacity={0.8}>
            <Text style={styles.retryText}>{t('support.tickets.retry')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={tickets}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => void load(true)}
              tintColor='#4B4FC9'
            />
          }
          renderItem={({ item }) => (
            <TicketRow
              ticket={item}
              onPress={() => router.push(`/(stack)/support-ticket-detail?id=${item.id}`)}
            />
          )}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name='chatbubble-outline' size={48} color='#4E5498' />
              <Text style={styles.emptyText}>{t('support.tickets.empty')}</Text>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => router.push('/(stack)/support-new')}
                activeOpacity={0.85}
              >
                <Ionicons name='add' size={18} color='#fff' />
                <Text style={styles.primaryButtonText}>{t('support.tickets.newButton')}</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#11112A' },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 20,
    gap: 12,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#373848',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextWrap: { flex: 1 },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: '700', marginBottom: 2 },
  headerSubtitle: { color: '#B8BBD6', fontSize: 13 },
  listContent: { padding: 16, paddingTop: 4, paddingBottom: 32 },
  ticketCard: {
    backgroundColor: '#373848',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  ticketHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
    gap: 8,
  },
  ticketSubject: { color: '#fff', fontSize: 15, fontWeight: '600', flex: 1 },
  statusBadge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusText: { fontSize: 11, fontWeight: '700' },
  ticketDate: { color: '#B8BBD6', fontSize: 12 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyText: { color: '#B8BBD6', fontSize: 14, marginTop: 12, marginBottom: 20, textAlign: 'center' },
  errorText: { color: '#E57373', fontSize: 14, marginBottom: 16, textAlign: 'center' },
  retryButton: {
    backgroundColor: '#373848',
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  retryText: { color: '#DDE1FF', fontSize: 14, fontWeight: '600' },
  primaryButton: {
    backgroundColor: '#4B4FC9',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  primaryButtonText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});
