import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supportService } from '@/services/api/support.service';
import type { SupportTicketCategory } from '@/services/api/support.service';
import { useTranslation } from '@/context/I18nContext';
import ScreenHeader from '@/shared/ui/ScreenHeader';

const CATEGORY_LABELS: Record<SupportTicketCategory, string> = {
  technical: 'Technique / Technical',
  billing: 'Facturation / Billing',
  account: 'Compte / Account',
  subscription: 'Abonnement / Subscription',
  bug: 'Bug',
  feature_request: 'Fonctionnalité / Feature',
  other: 'Autre / Other',
};

export default function SupportNewScreen() {
  const router = useRouter();
  const { t } = useTranslation();

  const [categories, setCategories] = useState<SupportTicketCategory[]>([]);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState<SupportTicketCategory | ''>('');
  const [submitting, setSubmitting] = useState(false);
  const [showCategories, setShowCategories] = useState(false);

  useEffect(() => {
    void supportService.getCategories().then(setCategories).catch(() => {});
  }, []);

  const handleSubmit = async () => {
    if (!subject.trim() || !message.trim()) {
      Alert.alert(
        t('support.new.validationTitle'),
        t('support.new.validationMessage')
      );
      return;
    }
    try {
      setSubmitting(true);
      await supportService.create({
        subject: subject.trim(),
        message: message.trim(),
        category: category || undefined,
      });
      setSubject('');
      setMessage('');
      setCategory('');
      Alert.alert(t('support.new.successTitle'), t('support.new.successMessage'), [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch {
      Alert.alert(t('support.new.errorTitle'), t('support.new.errorMessage'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps='handled'>
      <ScreenHeader title={t('support.new.title')} subtitle={t('support.new.subtitle')} />

      <View style={styles.card}>
        <Text style={styles.label}>{t('support.new.subjectLabel')}</Text>
        <TextInput
          style={styles.input}
          placeholder={t('support.new.subjectPlaceholder')}
          placeholderTextColor='#6B6E8A'
          value={subject}
          onChangeText={setSubject}
          maxLength={255}
        />

        <Text style={[styles.label, { marginTop: 16 }]}>{t('support.new.categoryLabel')}</Text>
        <TouchableOpacity
          style={styles.select}
          onPress={() => setShowCategories(v => !v)}
          activeOpacity={0.8}
        >
          <Text style={category ? styles.selectValue : styles.selectPlaceholder}>
            {category
              ? CATEGORY_LABELS[category]
              : t('support.new.categoryPlaceholder')}
          </Text>
          <Ionicons
            name={showCategories ? 'chevron-up' : 'chevron-down'}
            size={18}
            color='#B8BBD6'
          />
        </TouchableOpacity>

        {showCategories && (
          <View style={styles.dropdown}>
            <TouchableOpacity
              style={styles.dropdownItem}
              onPress={() => { setCategory(''); setShowCategories(false); }}
              activeOpacity={0.8}
            >
              <Text style={styles.dropdownText}>{t('support.new.categoryNone')}</Text>
            </TouchableOpacity>
            {categories.map(c => (
              <TouchableOpacity
                key={c}
                style={[styles.dropdownItem, category === c && styles.dropdownItemSelected]}
                onPress={() => { setCategory(c); setShowCategories(false); }}
                activeOpacity={0.8}
              >
                <Text style={[styles.dropdownText, category === c && styles.dropdownTextSelected]}>
                  {CATEGORY_LABELS[c]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <Text style={[styles.label, { marginTop: 16 }]}>{t('support.new.messageLabel')}</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          placeholder={t('support.new.messagePlaceholder')}
          placeholderTextColor='#6B6E8A'
          value={message}
          onChangeText={setMessage}
          multiline
          maxLength={5000}
          textAlignVertical='top'
        />
      </View>

      <TouchableOpacity
        style={[styles.primaryButton, (submitting || !subject.trim() || !message.trim()) && styles.buttonDisabled]}
        onPress={() => void handleSubmit()}
        disabled={submitting || !subject.trim() || !message.trim()}
        activeOpacity={0.85}
      >
        {submitting ? (
          <ActivityIndicator color='#fff' />
        ) : (
          <>
            <Ionicons name='send-outline' size={18} color='#fff' />
            <Text style={styles.primaryButtonText}>{t('support.new.submitButton')}</Text>
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#11112A' },
  content: { padding: 16, paddingBottom: 32 },
  card: { backgroundColor: '#373848', borderRadius: 16, padding: 16, marginBottom: 16 },
  label: { color: '#B8BBD6', fontSize: 13, fontWeight: '600', marginBottom: 8 },
  input: {
    backgroundColor: '#1F2140',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#4E5498',
    color: '#fff',
    fontSize: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  textarea: { minHeight: 120, paddingTop: 12 },
  select: {
    backgroundColor: '#1F2140',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#4E5498',
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectValue: { color: '#fff', fontSize: 14 },
  selectPlaceholder: { color: '#6B6E8A', fontSize: 14 },
  dropdown: {
    backgroundColor: '#1F2140',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#4E5498',
    marginTop: 4,
    overflow: 'hidden',
  },
  dropdownItem: { paddingHorizontal: 14, paddingVertical: 12 },
  dropdownItemSelected: { backgroundColor: '#2E3066' },
  dropdownText: { color: '#D3D6E8', fontSize: 14 },
  dropdownTextSelected: { color: '#fff', fontWeight: '700' },
  primaryButton: {
    backgroundColor: '#4B4FC9',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  primaryButtonText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  buttonDisabled: { opacity: 0.5 },
});
