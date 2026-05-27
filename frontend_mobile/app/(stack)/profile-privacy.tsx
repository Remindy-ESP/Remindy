import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { toast } from '@/context/ToastContext';
import { showConfirm } from '@/context/ConfirmContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/context/I18nContext';
import { userService } from '@/services/api';
import ScreenHeader from '@/components/ScreenHeader';
import { profileCardStyles as shared } from '@/styles/profileCard';

export default function ProfilePrivacyScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { logout } = useAuth();
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleExportData = async () => {
    try {
      setIsExporting(true);
      const result = await userService.exportData({ format: 'json' });

      toast.success(t('profile.privacy.data.exportStatus', {
        status: result.status,
        format: result.format,
        id: result.id,
      }));
    } catch (error: any) {
      console.error('RGPD export request failed:', error);
      const message =
        error?.response?.data?.message ||
        error?.message ||
        t('profile.privacy.data.exportFailed');
      toast.error(String(message));
    } finally {
      setIsExporting(false);
    }
  };

  const performDeleteAccount = async () => {
    try {
      setIsDeleting(true);
      await userService.deleteMe();
      await logout();
      toast.info(t('profile.privacy.danger.deletedMessage'));
      router.replace('/');
    } catch (error: any) {
      console.error('Delete account failed:', error);
      const message =
        error?.response?.data?.message ||
        error?.message ||
        t('profile.privacy.danger.deleteFailed');
      toast.error(String(message));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = await showConfirm({
      title: t('profile.privacy.danger.confirmTitle'),
      message: t('profile.privacy.danger.confirmMessage'),
      confirmText: t('profile.privacy.delete'),
      cancelText: t('profile.privacy.cancel'),
      destructive: true,
    });
    if (confirmed) {
      void performDeleteAccount();
    }
  };

  return (
    <ScrollView style={shared.container} contentContainerStyle={shared.contentContainer}>
      <ScreenHeader title={t('profile.privacy.title')} subtitle={t('profile.privacy.subtitle')} />

      <View style={shared.card}>
        <Text style={shared.cardTitle}>{t('profile.privacy.data.title')}</Text>
        <Text style={shared.cardBody}>
          {t('profile.privacy.data.body')}
        </Text>

        <TouchableOpacity
          testID="export-data-button"
          style={[styles.actionButton, isExporting && shared.buttonDisabled]}
          onPress={handleExportData}
          disabled={isExporting || isDeleting}
          activeOpacity={0.85}
        >
          {isExporting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="download-outline" size={18} color="#fff" />
              <Text style={styles.actionButtonText}>{t('profile.privacy.data.exportButton')}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.warningCard}>
        <Text style={styles.warningTitle}>{t('profile.privacy.danger.title')}</Text>
        <Text style={styles.warningBody}>
          {t('profile.privacy.danger.body')}
        </Text>

        <TouchableOpacity
          testID="delete-account-button"
          style={[styles.deleteButton, isDeleting && shared.buttonDisabled]}
          onPress={handleDeleteAccount}
          disabled={isDeleting || isExporting}
          activeOpacity={0.85}
        >
          {isDeleting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="trash-outline" size={18} color="#fff" />
              <Text style={styles.deleteButtonText}>{t('profile.privacy.danger.deleteButton')}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  actionButton: {
    backgroundColor: '#4B4FC9',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  warningCard: {
    backgroundColor: '#3E2630',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#8A4358',
    padding: 16,
  },
  warningTitle: {
    color: '#FFD7DE',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  warningBody: {
    color: '#FFD7DE',
    opacity: 0.9,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 14,
  },
  deleteButton: {
    backgroundColor: '#D94A58',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
});
