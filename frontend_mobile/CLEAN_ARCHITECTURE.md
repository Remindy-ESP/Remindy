# 📱 Clean Architecture - Frontend Mobile (React Native)

## Table des matières

1. [Philosophie](#philosophie)
2. [Structure du projet](#structure-du-projet)
3. [Les 4 couches](#les-4-couches)
4. [Exemple concret : Module Reminders](#exemple-concret--module-reminders)
5. [Patterns React Native](#patterns-react-native)
6. [Navigation](#navigation)
7. [État local et global](#état-local-et-global)
8. [Permissions et services natifs](#permissions-et-services-natifs)
9. [Tests](#tests)
10. [Checklist](#checklist)

---

## Philosophie

### 🎯 Objectif

Appliquer Clean Architecture au mobile React Native de manière **pragmatique** :
- ✅ Code maintenable cross-platform (iOS/Android)
- ✅ Logique métier réutilisable
- ✅ Gestion des features natives (notifications, localisation, etc.)
- ❌ Pas de sur-ingénierie
- ❌ Simple mais structuré

### 🏛️ Principes adaptés au mobile

```
Screens/Components → Application Logic → Domain Logic → Infrastructure
       ↓                    ↓                  ↓               ↓
    Screens/           Hooks/Stores/      Entities/       API/Native
  Components          Use Cases          Models          Services
```

---

## Structure du projet

### 📁 Organisation générale

```
frontend_mobile/
├── src/
│   ├── modules/              # Modules métier
│   │   ├── auth/
│   │   ├── reminders/
│   │   └── profile/
│   ├── shared/               # Code partagé
│   │   ├── domain/          # Entités, types métier
│   │   ├── infrastructure/  # API, services natifs
│   │   ├── application/     # Hooks, stores
│   │   └── ui/              # Composants UI réutilisables
│   ├── navigation/          # Navigation
│   ├── config/              # Configuration
│   ├── App.tsx
│   └── index.ts
```

### 🏗️ Structure d'un module (exemple: reminders)

```
reminders/
├── domain/                   # 🏛️ LOGIQUE MÉTIER PURE
│   ├── entities/
│   │   └── reminder.entity.ts
│   ├── models/
│   │   └── reminder.model.ts
│   ├── types/
│   │   └── reminder.types.ts
│   └── validators/
│       └── reminder.validator.ts
│
├── application/              # 🎯 LOGIQUE APPLICATIVE
│   ├── hooks/
│   │   ├── useReminders.ts
│   │   ├── useReminderForm.ts
│   │   └── useReminderNotifications.ts
│   ├── stores/
│   │   └── reminderStore.ts   # Zustand
│   └── services/
│       └── reminderService.ts  # Orchestration
│
├── infrastructure/           # ⚙️ DÉTAILS TECHNIQUES
│   ├── api/
│   │   └── reminderApi.ts     # Appels HTTP
│   ├── storage/
│   │   └── reminderStorage.ts # AsyncStorage
│   ├── notifications/
│   │   └── reminderNotifications.ts
│   ├── mappers/
│   │   └── reminderMapper.ts
│   └── repositories/
│       └── reminderRepository.ts
│
└── ui/                       # 🌐 INTERFACE MOBILE
    ├── screens/
    │   ├── ReminderListScreen.tsx
    │   ├── ReminderDetailScreen.tsx
    │   └── ReminderFormScreen.tsx
    ├── components/
    │   ├── ReminderCard.tsx
    │   ├── ReminderList.tsx
    │   └── ReminderForm.tsx
    └── styles/
        └── reminder.styles.ts
```

---

## Les 4 couches

### 🏛️ Domain Layer (Logique Métier)

**Responsabilité** : Règles métier pures, indépendantes de React Native.

**Exemples :**

```typescript
// domain/entities/reminder.entity.ts
export class Reminder {
  constructor(
    public readonly id: string,
    public title: string,
    public description: string,
    public dueDate: Date,
    public status: ReminderStatus,
    public priority: ReminderPriority,
    public tags: string[],
  ) {}

  // 👍 Logique métier pure
  isOverdue(): boolean {
    return this.status !== ReminderStatus.COMPLETED && new Date() > this.dueDate;
  }

  isHighPriority(): boolean {
    return this.priority === ReminderPriority.HIGH;
  }

  isDueSoon(hoursThreshold: number = 24): boolean {
    const now = new Date();
    const diffHours = (this.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    return diffHours > 0 && diffHours <= hoursThreshold;
  }

  canBeEdited(): boolean {
    return this.status !== ReminderStatus.COMPLETED;
  }

  complete(): void {
    if (!this.canBeEdited()) {
      throw new Error('Cannot complete an already completed reminder');
    }
    this.status = ReminderStatus.COMPLETED;
  }

  snooze(minutes: number): void {
    if (this.status === ReminderStatus.COMPLETED) {
      throw new Error('Cannot snooze a completed reminder');
    }
    this.dueDate = new Date(this.dueDate.getTime() + minutes * 60 * 1000);
  }
}

// domain/types/reminder.types.ts
export enum ReminderStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum ReminderPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

export interface ReminderFilters {
  status?: ReminderStatus;
  priority?: ReminderPriority;
  tags?: string[];
  dueDateFrom?: Date;
  dueDateTo?: Date;
}
```

---

### 🎯 Application Layer (Logique Applicative)

**Responsabilité** : Hooks, stores, orchestration avec React Native.

**Exemples :**

```typescript
// application/hooks/useReminders.ts
import { useQuery } from '@tanstack/react-query';
import { reminderRepository } from '../../infrastructure/repositories/reminderRepository';
import { ReminderFilters } from '../../domain/types/reminder.types';

export function useReminders(filters?: ReminderFilters) {
  return useQuery({
    queryKey: ['reminders', filters],
    queryFn: () => reminderRepository.findAll(filters),
    staleTime: 30 * 1000, // 30 secondes
  });
}

export function useReminder(id: string) {
  return useQuery({
    queryKey: ['reminder', id],
    queryFn: () => reminderRepository.findById(id),
    enabled: !!id,
  });
}

// application/hooks/useReminderActions.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { reminderRepository } from '../../infrastructure/repositories/reminderRepository';
import { Reminder } from '../../domain/entities/reminder.entity';
import { Toast } from 'react-native-toast-message';
import { reminderNotificationService } from '../../infrastructure/notifications/reminderNotifications';

export function useReminderActions() {
  const queryClient = useQueryClient();

  const createReminder = useMutation({
    mutationFn: async (data: Partial<Reminder>) => {
      const reminder = await reminderRepository.create(data);

      // Planifier la notification
      await reminderNotificationService.scheduleNotification(reminder);

      return reminder;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      Toast.show({
        type: 'success',
        text1: 'Rappel créé',
        text2: 'Votre rappel a été créé avec succès',
      });
    },
  });

  const completeReminder = useMutation({
    mutationFn: async (id: string) => {
      const reminder = await reminderRepository.findById(id);
      reminder.complete();

      // Annuler la notification
      await reminderNotificationService.cancelNotification(id);

      return reminderRepository.update(id, reminder);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      Toast.show({
        type: 'success',
        text1: 'Rappel terminé',
      });
    },
  });

  const snoozeReminder = useMutation({
    mutationFn: async ({ id, minutes }: { id: string; minutes: number }) => {
      const reminder = await reminderRepository.findById(id);
      reminder.snooze(minutes);

      // Replanifier la notification
      await reminderNotificationService.rescheduleNotification(reminder);

      return reminderRepository.update(id, reminder);
    },
  });

  return {
    createReminder,
    completeReminder,
    snoozeReminder,
  };
}

// application/hooks/useReminderForm.ts
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const reminderSchema = z.object({
  title: z.string().min(1, 'Le titre est requis'),
  description: z.string().optional(),
  dueDate: z.date(),
  priority: z.enum(['low', 'medium', 'high']),
  tags: z.array(z.string()).optional(),
});

export type ReminderFormData = z.infer<typeof reminderSchema>;

export function useReminderForm(initialData?: ReminderFormData) {
  return useForm<ReminderFormData>({
    resolver: zodResolver(reminderSchema),
    defaultValues: initialData || {
      title: '',
      description: '',
      dueDate: new Date(),
      priority: 'medium',
      tags: [],
    },
  });
}

// application/stores/reminderStore.ts
import { create } from 'zustand';
import { Reminder } from '../../domain/entities/reminder.entity';

interface ReminderStore {
  selectedReminder: Reminder | null;
  setSelectedReminder: (reminder: Reminder | null) => void;

  filters: ReminderFilters;
  setFilters: (filters: ReminderFilters) => void;

  syncStatus: 'idle' | 'syncing' | 'success' | 'error';
  setSyncStatus: (status: ReminderStore['syncStatus']) => void;
}

export const useReminderStore = create<ReminderStore>((set) => ({
  selectedReminder: null,
  setSelectedReminder: (reminder) => set({ selectedReminder: reminder }),

  filters: {},
  setFilters: (filters) => set({ filters }),

  syncStatus: 'idle',
  setSyncStatus: (status) => set({ syncStatus: status }),
}));
```

---

### ⚙️ Infrastructure Layer (Services Natifs)

**Responsabilité** : API, AsyncStorage, notifications, géolocalisation, etc.

**Exemples :**

```typescript
// infrastructure/api/reminderApi.ts
import axios from 'axios';
import { API_URL } from '../../config/env';

export const reminderApi = {
  async getAll(filters?: any) {
    const { data } = await axios.get(`${API_URL}/reminders`, { params: filters });
    return data;
  },

  async getById(id: string) {
    const { data } = await axios.get(`${API_URL}/reminders/${id}`);
    return data;
  },

  async create(reminderData: any) {
    const { data } = await axios.post(`${API_URL}/reminders`, reminderData);
    return data;
  },

  async update(id: string, reminderData: any) {
    const { data } = await axios.put(`${API_URL}/reminders/${id}`, reminderData);
    return data;
  },

  async delete(id: string) {
    await axios.delete(`${API_URL}/reminders/${id}`);
  },
};

// infrastructure/storage/reminderStorage.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Reminder } from '../../domain/entities/reminder.entity';

const REMINDERS_KEY = '@reminders';

export const reminderStorage = {
  async saveReminders(reminders: Reminder[]): Promise<void> {
    await AsyncStorage.setItem(REMINDERS_KEY, JSON.stringify(reminders));
  },

  async getReminders(): Promise<Reminder[]> {
    const data = await AsyncStorage.getItem(REMINDERS_KEY);
    return data ? JSON.parse(data) : [];
  },

  async saveReminder(reminder: Reminder): Promise<void> {
    const reminders = await this.getReminders();
    const index = reminders.findIndex((r) => r.id === reminder.id);

    if (index >= 0) {
      reminders[index] = reminder;
    } else {
      reminders.push(reminder);
    }

    await this.saveReminders(reminders);
  },

  async deleteReminder(id: string): Promise<void> {
    const reminders = await this.getReminders();
    const filtered = reminders.filter((r) => r.id !== id);
    await this.saveReminders(filtered);
  },

  async clear(): Promise<void> {
    await AsyncStorage.removeItem(REMINDERS_KEY);
  },
};

// infrastructure/notifications/reminderNotifications.ts
import notifee, { TimestampTrigger, TriggerType } from '@notifee/react-native';
import { Reminder } from '../../domain/entities/reminder.entity';

export const reminderNotificationService = {
  async requestPermission(): Promise<boolean> {
    const settings = await notifee.requestPermission();
    return settings.authorizationStatus >= 1;
  },

  async scheduleNotification(reminder: Reminder): Promise<string> {
    const trigger: TimestampTrigger = {
      type: TriggerType.TIMESTAMP,
      timestamp: reminder.dueDate.getTime(),
    };

    const notificationId = await notifee.createTriggerNotification(
      {
        id: reminder.id,
        title: reminder.title,
        body: reminder.description,
        android: {
          channelId: 'reminders',
          pressAction: {
            id: 'default',
          },
        },
        ios: {
          sound: 'default',
        },
      },
      trigger,
    );

    return notificationId;
  },

  async cancelNotification(id: string): Promise<void> {
    await notifee.cancelNotification(id);
  },

  async rescheduleNotification(reminder: Reminder): Promise<void> {
    await this.cancelNotification(reminder.id);
    await this.scheduleNotification(reminder);
  },

  async createChannel(): Promise<void> {
    await notifee.createChannel({
      id: 'reminders',
      name: 'Rappels',
      importance: 4,
    });
  },
};

// infrastructure/repositories/reminderRepository.ts
import { Reminder } from '../../domain/entities/reminder.entity';
import { ReminderFilters } from '../../domain/types/reminder.types';
import { reminderApi } from '../api/reminderApi';
import { reminderStorage } from '../storage/reminderStorage';
import { reminderMapper } from '../mappers/reminderMapper';
import NetInfo from '@react-native-community/netinfo';

export const reminderRepository = {
  async findAll(filters?: ReminderFilters): Promise<Reminder[]> {
    const isConnected = (await NetInfo.fetch()).isConnected;

    if (isConnected) {
      try {
        const dtos = await reminderApi.getAll(filters);
        const reminders = reminderMapper.toDomainList(dtos);

        // Sauvegarder en local pour offline
        await reminderStorage.saveReminders(reminders);

        return reminders;
      } catch (error) {
        console.warn('API failed, using local storage', error);
        return reminderStorage.getReminders();
      }
    }

    // Mode offline
    return reminderStorage.getReminders();
  },

  async findById(id: string): Promise<Reminder> {
    const isConnected = (await NetInfo.fetch()).isConnected;

    if (isConnected) {
      const dto = await reminderApi.getById(id);
      return reminderMapper.toDomain(dto);
    }

    const reminders = await reminderStorage.getReminders();
    const reminder = reminders.find((r) => r.id === id);
    if (!reminder) throw new Error('Reminder not found');
    return reminder;
  },

  async create(data: Partial<Reminder>): Promise<Reminder> {
    const isConnected = (await NetInfo.fetch()).isConnected;

    if (isConnected) {
      const dto = await reminderApi.create(data);
      const reminder = reminderMapper.toDomain(dto);
      await reminderStorage.saveReminder(reminder);
      return reminder;
    }

    // Mode offline : créer localement
    const tempId = `temp-${Date.now()}`;
    const reminder = new Reminder(
      tempId,
      data.title!,
      data.description || '',
      data.dueDate!,
      data.status!,
      data.priority!,
      data.tags || [],
    );
    await reminderStorage.saveReminder(reminder);
    return reminder;
  },

  async update(id: string, data: Partial<Reminder>): Promise<Reminder> {
    const isConnected = (await NetInfo.fetch()).isConnected;

    if (isConnected) {
      const dto = await reminderApi.update(id, data);
      const reminder = reminderMapper.toDomain(dto);
      await reminderStorage.saveReminder(reminder);
      return reminder;
    }

    // Mode offline
    const reminder = await this.findById(id);
    Object.assign(reminder, data);
    await reminderStorage.saveReminder(reminder);
    return reminder;
  },

  async delete(id: string): Promise<void> {
    const isConnected = (await NetInfo.fetch()).isConnected;

    if (isConnected) {
      await reminderApi.delete(id);
    }

    await reminderStorage.deleteReminder(id);
  },
};
```

---

### 🌐 UI Layer (Écrans et Composants)

**Responsabilité** : Interface utilisateur React Native.

**Exemples :**

```typescript
// ui/screens/ReminderListScreen.tsx
import React, { useState } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { useReminders } from '../../application/hooks/useReminders';
import { useReminderActions } from '../../application/hooks/useReminderActions';
import { ReminderCard } from '../components/ReminderCard';
import { ReminderFilters } from '../../domain/types/reminder.types';

export function ReminderListScreen({ navigation }) {
  const [filters, setFilters] = useState<ReminderFilters>({});
  const { data: reminders, isLoading, refetch } = useReminders(filters);
  const { completeReminder, snoozeReminder } = useReminderActions();

  const handleComplete = (id: string) => {
    completeReminder.mutate(id);
  };

  const handleSnooze = (id: string) => {
    snoozeReminder.mutate({ id, minutes: 15 });
  };

  const handlePress = (id: string) => {
    navigation.navigate('ReminderDetail', { id });
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={reminders || []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ReminderCard
            reminder={item}
            onPress={() => handlePress(item.id)}
            onComplete={() => handleComplete(item.id)}
            onSnooze={() => handleSnooze(item.id)}
          />
        )}
        refreshing={isLoading}
        onRefresh={refetch}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
});

// ui/components/ReminderCard.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Reminder } from '../../domain/entities/reminder.entity';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface ReminderCardProps {
  reminder: Reminder;
  onPress: () => void;
  onComplete: () => void;
  onSnooze: () => void;
}

export function ReminderCard({ reminder, onPress, onComplete, onSnooze }: ReminderCardProps) {
  // ✅ Utilise la logique métier de l'entité
  const isOverdue = reminder.isOverdue();
  const isDueSoon = reminder.isDueSoon();
  const isHighPriority = reminder.isHighPriority();

  return (
    <TouchableOpacity
      style={[
        styles.card,
        isOverdue && styles.overdueCard,
        isDueSoon && styles.dueSoonCard,
      ]}
      onPress={onPress}
    >
      <View style={styles.header}>
        <Text style={styles.title}>{reminder.title}</Text>
        {isHighPriority && (
          <Icon name="alert-circle" size={20} color="#ff4444" />
        )}
      </View>

      {reminder.description && (
        <Text style={styles.description} numberOfLines={2}>
          {reminder.description}
        </Text>
      )}

      <View style={styles.footer}>
        <Text style={styles.date}>
          {reminder.dueDate.toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>

        <View style={styles.actions}>
          <TouchableOpacity onPress={onSnooze} style={styles.actionButton}>
            <Icon name="clock-outline" size={20} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity onPress={onComplete} style={styles.actionButton}>
            <Icon name="check-circle" size={20} color="#4caf50" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  overdueCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#ff4444',
  },
  dueSoonCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#ffa500',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  date: {
    fontSize: 12,
    color: '#999',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    padding: 4,
  },
});

// ui/screens/ReminderFormScreen.tsx
import React from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useReminderForm } from '../../application/hooks/useReminderForm';
import { useReminderActions } from '../../application/hooks/useReminderActions';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Controller } from 'react-hook-form';

export function ReminderFormScreen({ navigation, route }) {
  const isEditMode = !!route.params?.reminder;
  const { control, handleSubmit, formState: { errors } } = useReminderForm(
    route.params?.reminder
  );
  const { createReminder, updateReminder } = useReminderActions();

  const onSubmit = async (data) => {
    if (isEditMode) {
      await updateReminder.mutateAsync({ id: route.params.reminder.id, data });
    } else {
      await createReminder.mutateAsync(data);
    }
    navigation.goBack();
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        <Text style={styles.label}>Titre *</Text>
        <Controller
          control={control}
          name="title"
          render={({ field: { onChange, value } }) => (
            <TextInput
              style={styles.input}
              value={value}
              onChangeText={onChange}
              placeholder="Titre du rappel"
            />
          )}
        />
        {errors.title && (
          <Text style={styles.error}>{errors.title.message}</Text>
        )}

        <Text style={styles.label}>Description</Text>
        <Controller
          control={control}
          name="description"
          render={({ field: { onChange, value } }) => (
            <TextInput
              style={[styles.input, styles.textArea]}
              value={value}
              onChangeText={onChange}
              placeholder="Description"
              multiline
              numberOfLines={4}
            />
          )}
        />

        <Text style={styles.label}>Date et heure *</Text>
        <Controller
          control={control}
          name="dueDate"
          render={({ field: { onChange, value } }) => (
            <DateTimePicker
              value={value}
              mode="datetime"
              onChange={(event, date) => date && onChange(date)}
            />
          )}
        />

        <Text style={styles.label}>Priorité</Text>
        <Controller
          control={control}
          name="priority"
          render={({ field: { onChange, value } }) => (
            <View style={styles.priorityButtons}>
              {['low', 'medium', 'high'].map((priority) => (
                <TouchableOpacity
                  key={priority}
                  style={[
                    styles.priorityButton,
                    value === priority && styles.priorityButtonActive,
                  ]}
                  onPress={() => onChange(priority)}
                >
                  <Text
                    style={[
                      styles.priorityButtonText,
                      value === priority && styles.priorityButtonTextActive,
                    ]}
                  >
                    {priority === 'low' ? 'Basse' : priority === 'medium' ? 'Moyenne' : 'Haute'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        />

        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSubmit(onSubmit)}
        >
          <Text style={styles.submitButtonText}>
            {isEditMode ? 'Mettre à jour' : 'Créer'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  form: {
    padding: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  error: {
    color: '#ff4444',
    fontSize: 12,
    marginTop: 4,
  },
  priorityButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityButton: {
    flex: 1,
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  priorityButtonActive: {
    backgroundColor: '#2196f3',
    borderColor: '#2196f3',
  },
  priorityButtonText: {
    color: '#666',
    fontWeight: '500',
  },
  priorityButtonTextActive: {
    color: '#fff',
  },
  submitButton: {
    backgroundColor: '#2196f3',
    padding: 16,
    borderRadius: 8,
    marginTop: 24,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
```

---

## Navigation

```typescript
// navigation/RootNavigator.tsx
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ReminderListScreen } from '../modules/reminders/ui/screens/ReminderListScreen';
import { ReminderDetailScreen } from '../modules/reminders/ui/screens/ReminderDetailScreen';
import { ReminderFormScreen } from '../modules/reminders/ui/screens/ReminderFormScreen';

const Stack = createNativeStackNavigator();

export function RootNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="ReminderList"
        component={ReminderListScreen}
        options={{ title: 'Mes rappels' }}
      />
      <Stack.Screen
        name="ReminderDetail"
        component={ReminderDetailScreen}
        options={{ title: 'Détails' }}
      />
      <Stack.Screen
        name="ReminderForm"
        component={ReminderFormScreen}
        options={({ route }) => ({
          title: route.params?.reminder ? 'Modifier' : 'Nouveau rappel',
        })}
      />
    </Stack.Navigator>
  );
}
```

---

## État local et global

### Zustand (Recommandé pour mobile)

```typescript
// Simple, performant, petit bundle
import { create } from 'zustand';

const useStore = create((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
}));
```

### React Query (Pour données serveur)

```typescript
// Gestion du cache, offline, sync
const { data } = useQuery(['reminders'], fetchReminders);
```

---

## Tests

```typescript
// domain/entities/__tests__/reminder.entity.test.ts
describe('Reminder Entity', () => {
  it('should detect overdue reminders', () => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const reminder = new Reminder('1', 'Test', '', yesterday, 'pending', 'medium', []);

    expect(reminder.isOverdue()).toBe(true);
  });
});
```

---

## Checklist

- [ ] Structure des dossiers (domain, application, infrastructure, ui)
- [ ] Entités Domain avec logique métier
- [ ] Hooks applicatifs
- [ ] Repository avec support offline
- [ ] Services natifs (notifications, storage)
- [ ] Composants UI
- [ ] Navigation
- [ ] Tests
- [ ] Permissions

---

**Créé pour Remindy - Frontend Mobile React Native**