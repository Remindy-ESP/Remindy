import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BaseSelectionModal from './BaseSelectionModal';
import type { Subscription } from '@/services/api';
import { useTranslation } from '@/context/I18nContext';

interface LinkToSubscriptionModalProps {
  readonly visible: boolean;
  readonly subscriptions: Subscription[];
  readonly currentSubscriptionId?: string;
  readonly onClose: () => void;
  readonly onSubmit: (subscriptionId: string | null) => Promise<void>;
}

export default function LinkToSubscriptionModal({
  visible,
  subscriptions,
  currentSubscriptionId: _currentSubscriptionId,
  onClose,
  onSubmit,
}: LinkToSubscriptionModalProps) {
  const { t } = useTranslation();
  const [selectedSubscriptionId, setSelectedSubscriptionId] = useState<string | null>(null);

  const handleSubmit = async () => {
    await onSubmit(selectedSubscriptionId);
    setSelectedSubscriptionId(null);
  };

  const handleClose = () => {
    setSelectedSubscriptionId(null);
    onClose();
  };

  return (
    <BaseSelectionModal
      visible={visible}
      title={t('cloud.modals.linkToSubscription.title')}
      submitText={t('cloud.modals.linkToSubscription.submit')}
      onClose={handleClose}
      onSubmit={handleSubmit}
    >
      <TouchableOpacity
        style={[styles.subscriptionItem, selectedSubscriptionId === null && styles.selectedItem]}
        onPress={() => setSelectedSubscriptionId(null)}
        activeOpacity={0.7}
      >
        <View style={styles.subscriptionInfo}>
          <Text style={styles.subscriptionName}>{t('cloud.modals.linkToSubscription.noSubscription')}</Text>
          <Text style={styles.subscriptionSubtext}>{t('cloud.modals.linkToSubscription.unlinkSubtext')}</Text>
        </View>
        {selectedSubscriptionId === null && <Ionicons name="checkmark" size={20} color="#6366f1" />}
      </TouchableOpacity>
      {subscriptions.map((subscription) => (
        <TouchableOpacity
          key={subscription.id}
          style={[styles.subscriptionItem, selectedSubscriptionId === subscription.id && styles.selectedItem]}
          onPress={() => setSelectedSubscriptionId(subscription.id)}
          activeOpacity={0.7}
        >
          <View style={styles.subscriptionInfo}>
            <Text style={styles.subscriptionName}>{subscription.name}</Text>
            <Text style={styles.subscriptionSubtext}>
              {subscription.amount} {subscription.currency} - {subscription.frequency}
            </Text>
          </View>
          {selectedSubscriptionId === subscription.id && <Ionicons name="checkmark" size={20} color="#6366f1" />}
        </TouchableOpacity>
      ))}
    </BaseSelectionModal>
  );
}

const styles = StyleSheet.create({
  subscriptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  selectedItem: {
    backgroundColor: '#EEF2FF',
  },
  subscriptionInfo: {
    flex: 1,
  },
  subscriptionName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    marginBottom: 4,
  },
  subscriptionSubtext: {
    fontSize: 14,
    color: '#6b7280',
  },
});
