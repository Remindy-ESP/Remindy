import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { userService } from '@/services/api';
import type { UserPreferences } from '@/services/api/types';

/**
 * Notification category config for UI display.
 * Maps backend notification/reminder types to user-friendly labels.
 */
const NOTIFICATION_CATEGORIES = [
  {
    key: 'subscription_renewal',
    icon: 'calendar-outline' as const,
    label: 'Renouvellement d\'abonnement',
    description: 'Rappel avant le renouvellement de vos abonnements',
    color: '#4CAF50',
  },
  {
    key: 'trial_ending',
    icon: 'hourglass-outline' as const,
    label: 'Fin de période d\'essai',
    description: 'Alerte avant la fin d\'une période d\'essai',
    color: '#FF9800',
  },
  {
    key: 'payment_overdue',
    icon: 'alert-circle-outline' as const,
    label: 'Paiement en retard',
    description: 'Notification quand un paiement est en retard',
    color: '#F44336',
  },
  {
    key: 'document_processed',
    icon: 'document-text-outline' as const,
    label: 'Document traité',
    description: 'Quand un document a été analysé par OCR',
    color: '#2196F3',
  },
] as const;

export default function ProfilePreferencesScreen() {
  const router = useRouter();
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Per-category push toggle state (local UI state — not persisted per-type yet)
  // When the global push is ON, each category defaults to ON
  const [categoryToggles, setCategoryToggles] = useState<Record<string, boolean>>({});

  const fetchPreferences = useCallback(async () => {
    try {
      setError(null);
      const prefs = await userService.getPreferences();
      setPreferences(prefs);

      // Initialize category toggles — all ON when global push is ON
      const toggles: Record<string, boolean> = {};
      NOTIFICATION_CATEGORIES.forEach((cat) => {
        toggles[cat.key] = prefs.notificationPush;
      });
      setCategoryToggles(toggles);
    } catch (err: any) {
      console.error('Failed to fetch preferences:', err);
      setError(err.response?.data?.message || 'Impossible de charger les préférences');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 2500);
  };

  /**
   * Toggle global push notification preference
   */
  const handleGlobalPushToggle = async (value: boolean) => {
    if (!preferences || saving) return;

    // Optimistic update
    const prev = preferences;
    setPreferences({ ...preferences, notificationPush: value });

    // Update all category toggles accordingly
    const newToggles: Record<string, boolean> = {};
    NOTIFICATION_CATEGORIES.forEach((cat) => {
      newToggles[cat.key] = value;
    });
    setCategoryToggles(newToggles);

    try {
      setSaving(true);
      const updated = await userService.updatePreferences({ notificationPush: value });
      setPreferences(updated);
      showSuccess(value ? 'Notifications push activées' : 'Notifications push désactivées');
    } catch {
      // Rollback
      setPreferences(prev);
      const rollbackToggles: Record<string, boolean> = {};
      NOTIFICATION_CATEGORIES.forEach((cat) => {
        rollbackToggles[cat.key] = prev.notificationPush;
      });
      setCategoryToggles(rollbackToggles);
      setError('Impossible de mettre à jour les préférences');
      setTimeout(() => setError(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  /**
   * Toggle a specific notification category (local state for now)
   * When any category is toggled ON and global is OFF → turn global ON
   * When all categories toggled OFF → turn global OFF
   */
  const handleCategoryToggle = async (key: string, value: boolean) => {
    if (!preferences || saving) return;

    const newToggles = { ...categoryToggles, [key]: value };
    setCategoryToggles(newToggles);

    // If toggling ON a category but global is OFF → enable global
    if (value && !preferences.notificationPush) {
      await handleGlobalPushToggle(true);
      // Re-set only this category as ON (global toggle sets all to true)
      return;
    }

    // If all categories are now OFF → disable global
    const anyOn = Object.values(newToggles).some((v) => v);
    if (!anyOn && preferences.notificationPush) {
      await handleGlobalPushToggle(false);
    }
  };

  const globalPushOn = preferences?.notificationPush ?? false;

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Chargement des préférences...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => router.back()}
          activeOpacity={0.8}
          testID="preferences-back-button"
        >
          <Ionicons name="chevron-back" size={20} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerTextWrap}>
          <Text style={styles.headerTitle}>Préférences</Text>
          <Text style={styles.headerSubtitle}>Gérer vos notifications push</Text>
        </View>
      </View>

      {/* Status messages */}
      {error && (
        <View style={styles.errorBox}>
          <Ionicons name="warning-outline" size={16} color="#FFD7DE" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {successMessage && (
        <View style={styles.successBox}>
          <Ionicons name="checkmark-circle-outline" size={16} color="#D3FFEA" />
          <Text style={styles.successText}>{successMessage}</Text>
        </View>
      )}

      {/* Global Push Toggle */}
      <View style={styles.card}>
        <View style={styles.globalToggleRow}>
          <View style={styles.globalToggleLeft}>
            <View style={[styles.globalIconWrap, { backgroundColor: globalPushOn ? '#6366f120' : '#ffffff10' }]}>
              <Ionicons
                name={globalPushOn ? 'notifications' : 'notifications-off-outline'}
                size={24}
                color={globalPushOn ? '#6366f1' : '#8E93B7'}
              />
            </View>
            <View style={styles.globalToggleTextWrap}>
              <Text style={styles.globalToggleLabel}>Notifications push</Text>
              <Text style={styles.globalToggleHint}>
                {globalPushOn ? 'Activées' : 'Désactivées'}
              </Text>
            </View>
          </View>
          <Switch
            value={globalPushOn}
            onValueChange={handleGlobalPushToggle}
            trackColor={{ false: '#3A3C5A', true: '#6366f180' }}
            thumbColor={globalPushOn ? '#6366f1' : '#8E93B7'}
            ios_backgroundColor="#3A3C5A"
            disabled={saving}
            testID="global-push-toggle"
          />
        </View>

        {!globalPushOn && (
          <View style={styles.disabledBanner}>
            <Ionicons name="information-circle-outline" size={16} color="#C8CBE6" />
            <Text style={styles.disabledBannerText}>
              Activez les notifications push pour recevoir des alertes sur votre appareil.
            </Text>
          </View>
        )}
      </View>

      {/* Per-category toggles */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Types de notifications</Text>
        <Text style={styles.sectionSubtitle}>
          Choisissez quelles notifications push vous souhaitez recevoir
        </Text>

        {NOTIFICATION_CATEGORIES.map((cat, index) => {
          const isOn = categoryToggles[cat.key] ?? false;
          const isLast = index === NOTIFICATION_CATEGORIES.length - 1;

          return (
            <View
              key={cat.key}
              style={[styles.categoryRow, !isLast && styles.categoryRowBorder]}
            >
              <View style={styles.categoryLeft}>
                <View style={[styles.categoryIconWrap, { backgroundColor: cat.color + '20' }]}>
                  <Ionicons name={cat.icon} size={20} color={cat.color} />
                </View>
                <View style={styles.categoryTextWrap}>
                  <Text style={[styles.categoryLabel, !globalPushOn && styles.textDisabled]}>
                    {cat.label}
                  </Text>
                  <Text style={[styles.categoryDescription, !globalPushOn && styles.textDisabled]}>
                    {cat.description}
                  </Text>
                </View>
              </View>
              <Switch
                value={isOn && globalPushOn}
                onValueChange={(value) => handleCategoryToggle(cat.key, value)}
                trackColor={{ false: '#3A3C5A', true: cat.color + '80' }}
                thumbColor={isOn && globalPushOn ? cat.color : '#8E93B7'}
                ios_backgroundColor="#3A3C5A"
                disabled={!globalPushOn || saving}
                testID={`toggle-${cat.key}`}
              />
            </View>
          );
        })}
      </View>

      {/* Info card */}
      <View style={styles.infoCard}>
        <Ionicons name="information-circle-outline" size={20} color="#C8CBE6" />
        <View style={styles.infoTextWrap}>
          <Text style={styles.infoTitle}>À propos des notifications</Text>
          <Text style={styles.infoBody}>
            Les notifications push vous alertent X jours avant l'échéance de vos abonnements.
            Vous pouvez configurer le délai de rappel pour chaque abonnement depuis sa page de détail.
          </Text>
        </View>
      </View>

      {/* Saving indicator */}
      {saving && (
        <View style={styles.savingOverlay}>
          <ActivityIndicator size="small" color="#6366f1" />
          <Text style={styles.savingText}>Enregistrement...</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#11112A',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  loadingText: {
    marginTop: 12,
    color: '#D3D6E8',
    fontSize: 14,
  },

  // Header
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#373848',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTextWrap: {
    flex: 1,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  headerSubtitle: {
    color: '#B8BBD6',
    fontSize: 13,
  },

  // Status messages
  errorBox: {
    backgroundColor: '#4B242C',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#A6475A',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  errorText: {
    color: '#FFD7DE',
    fontSize: 13,
    flex: 1,
  },
  successBox: {
    backgroundColor: '#1E4732',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#3C9B6A',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  successText: {
    color: '#D3FFEA',
    fontSize: 13,
    flex: 1,
  },

  // Cards
  card: {
    backgroundColor: '#373848',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
  },

  // Global toggle
  globalToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  globalToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  globalIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  globalToggleTextWrap: {
    flex: 1,
  },
  globalToggleLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  globalToggleHint: {
    color: '#B8BBD6',
    fontSize: 12,
  },
  disabledBanner: {
    backgroundColor: '#1F2140',
    borderRadius: 10,
    padding: 12,
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  disabledBannerText: {
    color: '#C8CBE6',
    fontSize: 12,
    lineHeight: 18,
    flex: 1,
  },

  // Section title
  sectionTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  sectionSubtitle: {
    color: '#B8BBD6',
    fontSize: 12,
    marginBottom: 16,
  },

  // Category rows
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  categoryRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  categoryIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  categoryTextWrap: {
    flex: 1,
  },
  categoryLabel: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  categoryDescription: {
    color: '#9CA0C2',
    fontSize: 11,
    lineHeight: 16,
  },
  textDisabled: {
    opacity: 0.4,
  },

  // Info card
  infoCard: {
    backgroundColor: '#1B1D42',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#343B78',
    padding: 16,
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  infoTextWrap: {
    flex: 1,
  },
  infoTitle: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  infoBody: {
    color: '#C8CBE6',
    fontSize: 12,
    lineHeight: 18,
  },

  // Saving overlay
  savingOverlay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  savingText: {
    color: '#B8BBD6',
    fontSize: 13,
  },
});
