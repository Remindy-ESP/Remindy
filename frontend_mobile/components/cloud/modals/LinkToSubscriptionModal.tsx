import React, { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, Pressable, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Subscription } from '@/services/api';

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
  currentSubscriptionId,
  onClose,
  onSubmit,
}: LinkToSubscriptionModalProps) {
  const [selectedSubscriptionId, setSelectedSubscriptionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      await onSubmit(selectedSubscriptionId);
      setSelectedSubscriptionId(null);
      onClose();
    } catch (error) {
      console.error('Error linking document:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedSubscriptionId(null);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <Pressable style={styles.overlay} onPress={handleClose}>
        <Pressable style={styles.modal} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>Lier à un abonnement</Text>
          <ScrollView style={styles.list}>
            <TouchableOpacity
              style={[styles.subscriptionItem, selectedSubscriptionId === null && styles.selectedItem]}
              onPress={() => setSelectedSubscriptionId(null)}
              activeOpacity={0.7}
            >
              <View style={styles.subscriptionInfo}>
                <Text style={styles.subscriptionName}>Aucun abonnement</Text>
                <Text style={styles.subscriptionSubtext}>Dissocier ce document</Text>
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
          </ScrollView>
          <View style={styles.buttons}>
            <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={handleClose} activeOpacity={0.7}>
              <Text style={styles.cancelText}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.submitButton, loading && styles.disabledButton]}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.7}
            >
              {loading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.submitText}>Lier</Text>}
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    width: '85%',
    maxWidth: 400,
    maxHeight: '70%',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
  },
  list: {
    maxHeight: 300,
    marginBottom: 16,
  },
  subscriptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 4,
  },
  selectedItem: {
    backgroundColor: '#F3F4F6',
  },
  subscriptionInfo: {
    flex: 1,
  },
  subscriptionName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    marginBottom: 2,
  },
  subscriptionSubtext: {
    fontSize: 12,
    color: '#666',
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
  },
  submitButton: {
    backgroundColor: '#6366f1',
  },
  disabledButton: {
    opacity: 0.5,
  },
  cancelText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '500',
  },
  submitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
