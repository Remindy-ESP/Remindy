import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/context/I18nContext';
import { userService } from '@/services/api';
import type { UpdateUserRequest } from '@/services/api';
import UserAvatar from '@/components/profile/UserAvatar';
import ScreenHeader from '@/components/ScreenHeader';

type FieldKey = 'firstName' | 'lastName' | 'phone' | 'language' | 'timezone';

type FormState = {
  firstName: string;
  lastName: string;
  phone: string;
  language: string;
  timezone: string;
};

type FormFieldProps = {
  label: string;
  value: string;
  placeholder: string;
  onChangeText: (value: string) => void;
  onClear?: () => void;
  clearLabel?: string;
  keyboardType?: 'default' | 'phone-pad';
  autoCapitalize?: 'none' | 'words';
  testID?: string;
};

function FormField({
  label,
  value,
  placeholder,
  onChangeText,
  onClear,
  clearLabel,
  keyboardType = 'default',
  autoCapitalize = 'none',
  testID,
}: FormFieldProps) {
  return (
    <View style={styles.fieldBlock}>
      <View style={styles.fieldHeader}>
        <Text style={styles.fieldLabel}>{label}</Text>
        {onClear ? (
          <TouchableOpacity onPress={onClear} activeOpacity={0.8}>
            <Text style={styles.clearText}>{clearLabel}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
      <TextInput
        testID={testID}
        style={styles.input}
        value={value}
        placeholder={placeholder}
        placeholderTextColor="#8E93B7"
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
      />
    </View>
  );
}

export default function ProfileEditScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { user, refreshUser } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [isPhotoUploading, setIsPhotoUploading] = useState(false);
  const [isPhotoDeleting, setIsPhotoDeleting] = useState(false);

  const [form, setForm] = useState<FormState>({
    firstName: user?.firstName ?? '',
    lastName: user?.lastName ?? '',
    phone: user?.phone ?? '',
    language: user?.language ?? '',
    timezone: user?.timezone ?? '',
  });

  const isDirty = useMemo(() => {
    return (
      (user?.firstName ?? '') !== form.firstName ||
      (user?.lastName ?? '') !== form.lastName ||
      (user?.phone ?? '') !== form.phone ||
      (user?.language ?? '') !== form.language ||
      (user?.timezone ?? '') !== form.timezone
    );
  }, [form, user]);

  const setField = (key: FieldKey, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (!user) {
      Alert.alert(t('profile.edit.errorTitle'), t('profile.edit.userNotFound'));
      return;
    }

    const payload: UpdateUserRequest = {
      firstName: form.firstName,
      lastName: form.lastName,
      phone: form.phone,
      language: form.language.trim() || undefined,
      timezone: form.timezone.trim() || undefined,
    };

    try {
      setIsSaving(true);
      await userService.updateMe(payload);
      await refreshUser();
      Alert.alert(t('profile.edit.successTitle'), t('profile.edit.successMessage'));
      router.back();
    } catch (error: any) {
      console.error('Profile update failed:', error);
      const message =
        error?.response?.data?.message ||
        error?.message ||
        t('profile.edit.updateFailed');
      Alert.alert(t('profile.edit.errorTitle'), String(message));
    } finally {
      setIsSaving(false);
    }
  };

  const buildPhotoFilePayload = (asset: ImagePicker.ImagePickerAsset) => {
    if (!asset.uri) {
      throw new Error('Image selection returned no file URI.');
    }

    const fileNameFromPicker = asset.fileName?.trim();
    const extensionMatch = asset.uri.match(/\.([a-zA-Z0-9]+)(?:\?|$)/);
    const extension = extensionMatch?.[1]?.toLowerCase();

    const mimeType =
      asset.mimeType ||
      (extension === 'png'
        ? 'image/png'
        : extension === 'webp'
          ? 'image/webp'
          : extension === 'jpg' || extension === 'jpeg'
            ? 'image/jpeg'
            : undefined);

    if (!mimeType || !mimeType.startsWith('image/')) {
      throw new Error('Unsupported image type.');
    }

    const normalizedExt =
      mimeType === 'image/png'
        ? 'png'
        : mimeType === 'image/webp'
          ? 'webp'
          : 'jpg';

    const fileName = fileNameFromPicker || `profile-photo-${Date.now()}.${normalizedExt}`;

    return {
      uri: asset.uri,
      type: mimeType,
      name: fileName,
    };
  };

  const handleChoosePhoto = async () => {
    if (!user || isPhotoUploading || isPhotoDeleting || isSaving) {
      return;
    }

    try {
      setIsPhotoUploading(true);

      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(t('profile.edit.photo.permissionTitle'), t('profile.edit.photo.permissionMessage'));
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.9,
      });

      if (result.canceled || result.assets.length === 0) {
        return;
      }

      const asset = result.assets[0];

      if (typeof asset.fileSize === 'number' && asset.fileSize <= 0) {
        Alert.alert(t('profile.edit.errorTitle'), t('profile.edit.photo.emptyFile'));
        return;
      }

      await userService.uploadMyPhoto(buildPhotoFilePayload(asset));
      await refreshUser();
      Alert.alert(t('profile.edit.successTitle'), t('profile.edit.photo.uploadSuccess'));
    } catch (error: any) {
      console.error('Profile photo upload failed:', error);
      const message =
        error?.response?.data?.message ||
        error?.message ||
        t('profile.edit.photo.uploadFailed');
      Alert.alert(t('profile.edit.errorTitle'), String(message));
    } finally {
      setIsPhotoUploading(false);
    }
  };

  const handleRemovePhoto = async () => {
    if (!user?.photoR2Key || isPhotoUploading || isPhotoDeleting || isSaving) {
      return;
    }

    Alert.alert(t('profile.edit.photo.deleteConfirmTitle'), t('profile.edit.photo.deleteConfirmMessage'), [
      { text: t('profile.logout.cancel'), style: 'cancel' },
      {
        text: t('profile.privacy.delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            setIsPhotoDeleting(true);
            await userService.deleteMyPhoto();
            await refreshUser();
            Alert.alert(t('profile.edit.successTitle'), t('profile.edit.photo.deleteSuccess'));
          } catch (error: any) {
            console.error('Profile photo delete failed:', error);
            const message =
              error?.response?.data?.message ||
              error?.message ||
              t('profile.edit.photo.deleteFailed');
            Alert.alert(t('profile.edit.errorTitle'), String(message));
          } finally {
            setIsPhotoDeleting(false);
          }
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <ScreenHeader title={t('profile.edit.title')} subtitle={t('profile.edit.subtitle')} testID="back-button" />

      <View style={styles.card}>
        <View style={styles.avatarSection}>
          <UserAvatar
            testID="profile-edit-avatar"
            firstName={user?.firstName}
            lastName={user?.lastName}
            photoUrl={user?.photoUrl}
            size={88}
          />
          <View style={styles.avatarButtonsRow}>
            <TouchableOpacity
              testID="choose-photo-button"
              style={[styles.avatarActionButton, (isPhotoUploading || isPhotoDeleting) && styles.avatarActionButtonDisabled]}
              onPress={handleChoosePhoto}
              disabled={isPhotoUploading || isPhotoDeleting || isSaving}
              activeOpacity={0.85}
            >
              {isPhotoUploading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name="image-outline" size={16} color="#fff" />
                  <Text style={styles.avatarActionButtonText}>
                    {user?.photoR2Key ? t('profile.edit.photo.change') : t('profile.edit.photo.add')}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            {user?.photoR2Key ? (
              <TouchableOpacity
                testID="remove-photo-button"
                style={[styles.avatarRemoveButton, (isPhotoUploading || isPhotoDeleting) && styles.avatarActionButtonDisabled]}
                onPress={handleRemovePhoto}
                disabled={isPhotoUploading || isPhotoDeleting || isSaving}
                activeOpacity={0.85}
              >
                {isPhotoDeleting ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Ionicons name="trash-outline" size={16} color="#fff" />
                    <Text style={styles.avatarActionButtonText}>{t('profile.edit.photo.remove')}</Text>
                  </>
                )}
              </TouchableOpacity>
            ) : null}
          </View>
          <Text style={styles.avatarHint}>
            {t('profile.edit.photo.hint')}
          </Text>
        </View>

        <FormField
          label={t('profile.edit.fields.firstName')}
          value={form.firstName}
          placeholder={t('profile.edit.fields.firstNamePlaceholder')}
          autoCapitalize="words"
          onChangeText={(value) => setField('firstName', value)}
          onClear={() => setField('firstName', '')}
          clearLabel={t('profile.edit.clear')}
          testID="input-firstName"
        />
        <FormField
          label={t('profile.edit.fields.lastName')}
          value={form.lastName}
          placeholder={t('profile.edit.fields.lastNamePlaceholder')}
          autoCapitalize="words"
          onChangeText={(value) => setField('lastName', value)}
          onClear={() => setField('lastName', '')}
          clearLabel={t('profile.edit.clear')}
          testID="input-lastName"
        />
        <FormField
          label={t('profile.edit.fields.phone')}
          value={form.phone}
          placeholder={t('profile.edit.fields.phonePlaceholder')}
          keyboardType="phone-pad"
          onChangeText={(value) => setField('phone', value)}
          onClear={() => setField('phone', '')}
          clearLabel={t('profile.edit.clear')}
          testID="input-phone"
        />
        <FormField
          label={t('profile.edit.fields.language')}
          value={form.language}
          placeholder={t('profile.edit.fields.languagePlaceholder')}
          onChangeText={(value) => setField('language', value)}
          testID="input-language"
        />
        <FormField
          label={t('profile.edit.fields.timezone')}
          value={form.timezone}
          placeholder={t('profile.edit.fields.timezonePlaceholder')}
          onChangeText={(value) => setField('timezone', value)}
          testID="input-timezone"
        />
      </View>

      <Text style={styles.helpText}>
        {t('profile.edit.helpText')}
      </Text>

      <TouchableOpacity
        testID="save-profile-button"
        style={[
          styles.saveButton,
          (!isDirty || isSaving) && styles.saveButtonDisabled,
        ]}
        onPress={handleSave}
        disabled={!isDirty || isSaving}
        activeOpacity={0.85}
      >
        {isSaving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Ionicons name="save-outline" size={18} color="#fff" />
            <Text style={styles.saveButtonText}>{t('profile.edit.save')}</Text>
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#11112A',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 28,
  },
  card: {
    backgroundColor: '#373848',
    borderRadius: 16,
    padding: 14,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  avatarButtonsRow: {
    width: '100%',
    marginTop: 12,
    gap: 10,
  },
  avatarActionButton: {
    backgroundColor: '#4B4FC9',
    borderRadius: 12,
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
  },
  avatarRemoveButton: {
    backgroundColor: '#D94A58',
    borderRadius: 12,
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
  },
  avatarActionButtonDisabled: {
    opacity: 0.65,
  },
  avatarActionButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  avatarHint: {
    marginTop: 10,
    color: '#B8BBD6',
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
  },
  fieldBlock: {
    marginBottom: 12,
  },
  fieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
    paddingHorizontal: 2,
  },
  fieldLabel: {
    color: '#D3D6E8',
    fontSize: 13,
    fontWeight: '600',
  },
  clearText: {
    color: '#AEB4FF',
    fontSize: 12,
    fontWeight: '700',
  },
  input: {
    backgroundColor: '#1F2140',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#4A4E75',
    color: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 14,
  },
  helpText: {
    color: '#B8BBD6',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 12,
    marginHorizontal: 2,
  },
  saveButton: {
    marginTop: 16,
    backgroundColor: '#4B4FC9',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#767AA2',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});
