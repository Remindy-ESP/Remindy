import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supportService } from '@/services/api/support.service';
import type { SupportTicketDetail, SupportTicketMessage } from '@/services/api/support.service';
import { useTranslation } from '@/context/I18nContext';

function MessageBubble({ message }: { message: SupportTicketMessage }) {
  const isUser = message.authorType === 'user';
  const isSystem = message.authorType === 'system';

  const authorLabel = isSystem
    ? 'Système'
    : message.author
      ? [message.author.firstName, message.author.lastName].filter(Boolean).join(' ') ||
        message.author.email
      : isUser
        ? 'Vous'
        : 'Support';

  return (
    <View style={[styles.bubbleWrap, isUser ? styles.bubbleRight : styles.bubbleLeft]}>
      <Text style={styles.bubbleMeta}>
        {authorLabel} · {new Date(message.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
      </Text>
      <View
        style={[
          styles.bubble,
          isUser ? styles.bubbleUser : isSystem ? styles.bubbleSystem : styles.bubbleAdmin,
        ]}
      >
        <Text style={[styles.bubbleText, isUser && styles.bubbleTextUser]}>
          {message.body}
        </Text>
      </View>
    </View>
  );
}

const STATUS_LABELS: Record<string, string> = {
  open: 'Ouvert',
  pending_user: 'En attente',
  resolved: 'Résolu',
  closed: 'Fermé',
};

const STATUS_COLORS: Record<string, string> = {
  open: '#E8A838',
  pending_user: '#4B9BE8',
  resolved: '#4CAF82',
  closed: '#6B6E8A',
};

export default function SupportTicketDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const flatListRef = useRef<FlatList>(null);

  const [ticket, setTicket] = useState<SupportTicketDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (!id) return;
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const data = await supportService.getById(id);
      setTicket(data);
    } catch {
      Alert.alert(t('support.detail.errorTitle'), t('support.detail.errorMessage'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id, t]);

  useEffect(() => { void load(); }, [load]);

  const handleReply = async () => {
    if (!id || !replyText.trim()) return;
    setSending(true);
    try {
      await supportService.reply(id, replyText.trim());
      setReplyText('');
      await load(true);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 200);
    } catch {
      Alert.alert(t('support.detail.errorTitle'), t('support.detail.sendErrorMessage'));
    } finally {
      setSending(false);
    }
  };

  const isClosed = ticket?.status === 'closed';

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator color='#4B4FC9' size='large' />
      </View>
    );
  }

  if (!ticket) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.errorText}>{t('support.detail.notFound')}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => router.back()} activeOpacity={0.8}>
          <Text style={styles.retryText}>{t('support.detail.back')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.iconButton} onPress={() => router.back()} activeOpacity={0.8}>
          <Ionicons name='chevron-back' size={20} color='#fff' />
        </TouchableOpacity>
        <View style={styles.headerTextWrap}>
          <Text style={styles.headerTitle} numberOfLines={1}>{ticket.subject}</Text>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: STATUS_COLORS[ticket.status] }]} />
            <Text style={[styles.statusLabel, { color: STATUS_COLORS[ticket.status] }]}>
              {STATUS_LABELS[ticket.status] ?? ticket.status}
            </Text>
          </View>
        </View>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={ticket.messages}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.messageList}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void load(true)}
            tintColor='#4B4FC9'
          />
        }
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        renderItem={({ item }) => <MessageBubble message={item} />}
        ListEmptyComponent={
          <Text style={styles.emptyText}>{t('support.detail.noMessages')}</Text>
        }
      />

      {/* Reply bar */}
      {!isClosed ? (
        <View style={styles.replyBar}>
          <TextInput
            style={styles.replyInput}
            placeholder={t('support.detail.replyPlaceholder')}
            placeholderTextColor='#6B6E8A'
            value={replyText}
            onChangeText={setReplyText}
            multiline
            maxLength={5000}
          />
          <TouchableOpacity
            style={[styles.sendButton, (!replyText.trim() || sending) && styles.sendButtonDisabled]}
            onPress={() => void handleReply()}
            disabled={!replyText.trim() || sending}
            activeOpacity={0.8}
          >
            {sending ? (
              <ActivityIndicator color='#fff' size='small' />
            ) : (
              <Ionicons name='send' size={18} color='#fff' />
            )}
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.closedBar}>
          <Ionicons name='lock-closed-outline' size={16} color='#6B6E8A' />
          <Text style={styles.closedText}>{t('support.detail.closed')}</Text>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#11112A' },
  center: { alignItems: 'center', justifyContent: 'center' },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 20,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2C45',
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
  headerTitle: { color: '#fff', fontSize: 17, fontWeight: '700', marginBottom: 4 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusLabel: { fontSize: 12, fontWeight: '600' },
  messageList: { padding: 16, paddingBottom: 8 },
  bubbleWrap: { marginBottom: 14 },
  bubbleLeft: { alignItems: 'flex-start' },
  bubbleRight: { alignItems: 'flex-end' },
  bubbleMeta: { color: '#6B6E8A', fontSize: 11, marginBottom: 4, paddingHorizontal: 4 },
  bubble: { maxWidth: '80%', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleUser: { backgroundColor: '#4B4FC9' },
  bubbleAdmin: { backgroundColor: '#373848' },
  bubbleSystem: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#4E5498',
  },
  bubbleText: { color: '#D3D6E8', fontSize: 14, lineHeight: 20 },
  bubbleTextUser: { color: '#fff' },
  emptyText: { color: '#6B6E8A', fontSize: 14, textAlign: 'center', marginTop: 40 },
  errorText: { color: '#E57373', fontSize: 14, marginBottom: 16 },
  retryButton: {
    backgroundColor: '#373848',
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  retryText: { color: '#DDE1FF', fontSize: 14, fontWeight: '600' },
  replyBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#2A2C45',
    backgroundColor: '#1A1B35',
  },
  replyInput: {
    flex: 1,
    backgroundColor: '#373848',
    borderRadius: 12,
    color: '#fff',
    fontSize: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#4B4FC9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: { opacity: 0.4 },
  closedBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: '#2A2C45',
    backgroundColor: '#1A1B35',
  },
  closedText: { color: '#6B6E8A', fontSize: 13 },
});
