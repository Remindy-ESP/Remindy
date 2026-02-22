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
import { useAuth } from '@/context/AuthContext';
import { userService } from '@/services/api';
import type { UpdateUserRequest } from '@/services/api';

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
            <Text style={styles.clearText}>Effacer</Text>
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
  const { user, refreshUser } = useAuth();
  const [isSaving, setIsSaving] = useState(false);

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
      Alert.alert('Erreur', 'Utilisateur introuvable.');
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
      Alert.alert('Succes', 'Profil mis a jour.');
      router.back();
    } catch (error: any) {
      console.error('Profile update failed:', error);
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Impossible de mettre a jour le profil.';
      Alert.alert('Erreur', String(message));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.headerRow}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => router.back()}
          activeOpacity={0.8}
          testID="back-button"
        >
          <Ionicons name="chevron-back" size={20} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerTextWrap}>
          <Text style={styles.headerTitle}>Modifier le profil</Text>
          <Text style={styles.headerSubtitle}>Edition des informations du profil</Text>
        </View>
      </View>

      <View style={styles.card}>
        <FormField
          label="Prenom"
          value={form.firstName}
          placeholder="Prenom"
          autoCapitalize="words"
          onChangeText={(value) => setField('firstName', value)}
          onClear={() => setField('firstName', '')}
          testID="input-firstName"
        />
        <FormField
          label="Nom"
          value={form.lastName}
          placeholder="Nom"
          autoCapitalize="words"
          onChangeText={(value) => setField('lastName', value)}
          onClear={() => setField('lastName', '')}
          testID="input-lastName"
        />
        <FormField
          label="Telephone"
          value={form.phone}
          placeholder="+33612345678"
          keyboardType="phone-pad"
          onChangeText={(value) => setField('phone', value)}
          onClear={() => setField('phone', '')}
          testID="input-phone"
        />
        <FormField
          label="Langue"
          value={form.language}
          placeholder="fr"
          onChangeText={(value) => setField('language', value)}
          testID="input-language"
        />
        <FormField
          label="Fuseau horaire"
          value={form.timezone}
          placeholder="Europe/Paris"
          onChangeText={(value) => setField('timezone', value)}
          testID="input-timezone"
        />
      </View>

      <Text style={styles.helpText}>
        Les champs optionnels peuvent etre vides. Laisser "Telephone", "Prenom" ou "Nom" vide efface la valeur.
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
            <Text style={styles.saveButtonText}>Enregistrer</Text>
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
  card: {
    backgroundColor: '#373848',
    borderRadius: 16,
    padding: 14,
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

