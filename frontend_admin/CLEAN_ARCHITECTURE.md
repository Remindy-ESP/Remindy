# 🎨 Clean Architecture - Frontend Admin (React)

## Table des matières

1. [Philosophie](#philosophie)
2. [Structure du projet](#structure-du-projet)
3. [Les 4 couches](#les-4-couches)
4. [Exemple concret : Module User](#exemple-concret--module-user)
5. [Patterns et bonnes pratiques](#patterns-et-bonnes-pratiques)
6. [Gestion d'état](#gestion-détat)
7. [Tests](#tests)
8. [Checklist](#checklist)

---

## Philosophie

### 🎯 Objectif

Appliquer Clean Architecture au frontend React de manière **pragmatique** :
- ✅ Code maintenable et testable
- ✅ Séparation des responsabilités
- ✅ Indépendance vis-à-vis des frameworks
- ❌ Pas de sur-ingénierie
- ❌ Pas de boilerplate inutile

### 🏛️ Principes adaptés au frontend

```
UI Components → Application Logic → Domain Logic → Infrastructure
    ↓                 ↓                  ↓              ↓
  Pages/          Use Cases/         Entities/      API Clients/
 Components       Hooks/Stores       Models         Services
```

---

## Structure du projet

### 📁 Organisation générale

```
frontend_admin/
├── src/
│   ├── modules/              # Modules métier
│   │   ├── auth/
│   │   ├── users/
│   │   └── dashboard/
│   ├── shared/               # Code partagé
│   │   ├── domain/          # Entités, VO, types métier
│   │   ├── infrastructure/  # API, services externes
│   │   ├── application/     # Hooks, stores partagés
│   │   └── ui/              # Composants UI réutilisables
│   ├── config/              # Configuration
│   ├── App.tsx              # Point d'entrée
│   └── main.tsx
```

### 🏗️ Structure d'un module (exemple: users)

```
users/
├── domain/                   # 🏛️ LOGIQUE MÉTIER PURE
│   ├── entities/
│   │   └── user.entity.ts
│   ├── models/
│   │   └── user.model.ts
│   ├── types/
│   │   └── user.types.ts
│   └── validators/
│       └── user.validator.ts
│
├── application/              # 🎯 LOGIQUE APPLICATIVE
│   ├── hooks/
│   │   ├── useUsers.ts
│   │   ├── useUserForm.ts
│   │   └── useUserActions.ts
│   ├── stores/
│   │   └── userStore.ts      # Zustand/Redux/Context
│   └── services/
│       └── userService.ts     # Orchestration business
│
├── infrastructure/           # ⚙️ DÉTAILS TECHNIQUES
│   ├── api/
│   │   └── userApi.ts        # Appels HTTP
│   ├── mappers/
│   │   └── userMapper.ts     # DTO ↔ Domain
│   └── repositories/
│       └── userRepository.ts  # Abstraction API
│
└── ui/                       # 🌐 INTERFACE UTILISATEUR
    ├── pages/
    │   ├── UserListPage.tsx
    │   ├── UserDetailPage.tsx
    │   └── UserFormPage.tsx
    ├── components/
    │   ├── UserCard.tsx
    │   ├── UserTable.tsx
    │   └── UserForm.tsx
    └── layouts/
        └── UserLayout.tsx
```

---

## Les 4 couches

### 🏛️ Domain Layer (Logique Métier)

**Responsabilité** : Contenir les règles métier pures, indépendantes de React.

**Exemples :**

```typescript
// domain/entities/user.entity.ts
export class User {
  constructor(
    public readonly id: string,
    public email: string,
    public name: string,
    public role: UserRole,
    public status: UserStatus,
  ) {}

  // 👍 Logique métier pure
  canEditProfile(): boolean {
    return this.status === UserStatus.ACTIVE;
  }

  isAdmin(): boolean {
    return this.role === UserRole.ADMIN;
  }

  canAccessFeature(feature: string): boolean {
    // Règles d'accès métier
    if (this.status !== UserStatus.ACTIVE) return false;
    if (this.role === UserRole.ADMIN) return true;

    // Logique selon les features...
    return false;
  }

  // 👍 Validation métier
  static validate(data: Partial<User>): string[] {
    const errors: string[] = [];

    if (!data.email || !data.email.includes('@')) {
      errors.push('Email invalide');
    }

    if (!data.name || data.name.length < 2) {
      errors.push('Le nom doit contenir au moins 2 caractères');
    }

    return errors;
  }
}

// domain/types/user.types.ts
export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  MODERATOR = 'moderator',
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
}

export interface UserFilters {
  role?: UserRole;
  status?: UserStatus;
  searchQuery?: string;
}
```

---

### 🎯 Application Layer (Logique Applicative)

**Responsabilité** : Orchestrer la logique métier avec des hooks et services.

**Exemples :**

```typescript
// application/hooks/useUsers.ts
import { useQuery } from '@tanstack/react-query';
import { userRepository } from '../../infrastructure/repositories/userRepository';
import { UserFilters } from '../../domain/types/user.types';

export function useUsers(filters?: UserFilters) {
  return useQuery({
    queryKey: ['users', filters],
    queryFn: () => userRepository.findAll(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useUser(id: string) {
  return useQuery({
    queryKey: ['user', id],
    queryFn: () => userRepository.findById(id),
    enabled: !!id,
  });
}

// application/hooks/useUserActions.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { userRepository } from '../../infrastructure/repositories/userRepository';
import { User } from '../../domain/entities/user.entity';
import { toast } from 'react-hot-toast';

export function useUserActions() {
  const queryClient = useQueryClient();

  const createUser = useMutation({
    mutationFn: (data: Partial<User>) => userRepository.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Utilisateur créé avec succès');
    },
    onError: (error) => {
      toast.error('Erreur lors de la création');
    },
  });

  const updateUser = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<User> }) =>
      userRepository.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user', id] });
      toast.success('Utilisateur mis à jour');
    },
  });

  const deleteUser = useMutation({
    mutationFn: (id: string) => userRepository.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Utilisateur supprimé');
    },
  });

  return {
    createUser,
    updateUser,
    deleteUser,
  };
}

// application/hooks/useUserForm.ts
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User } from '../../domain/entities/user.entity';

const userSchema = z.object({
  email: z.string().email('Email invalide'),
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  role: z.enum(['user', 'admin', 'moderator']),
});

export type UserFormData = z.infer<typeof userSchema>;

export function useUserForm(initialData?: User) {
  return useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: initialData
      ? {
          email: initialData.email,
          name: initialData.name,
          role: initialData.role,
        }
      : {
          email: '',
          name: '',
          role: 'user',
        },
  });
}
```

---

### ⚙️ Infrastructure Layer (Détails Techniques)

**Responsabilité** : Implémenter les appels API et mappers.

**Exemples :**

```typescript
// infrastructure/api/userApi.ts
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export const userApi = {
  async getAll(filters?: any) {
    const { data } = await axios.get(`${API_URL}/users`, { params: filters });
    return data;
  },

  async getById(id: string) {
    const { data } = await axios.get(`${API_URL}/users/${id}`);
    return data;
  },

  async create(userData: any) {
    const { data } = await axios.post(`${API_URL}/users`, userData);
    return data;
  },

  async update(id: string, userData: any) {
    const { data } = await axios.put(`${API_URL}/users/${id}`, userData);
    return data;
  },

  async delete(id: string) {
    await axios.delete(`${API_URL}/users/${id}`);
  },
};

// infrastructure/mappers/userMapper.ts
import { User } from '../../domain/entities/user.entity';
import { UserRole, UserStatus } from '../../domain/types/user.types';

// DTO venant de l'API
interface UserDTO {
  id: string;
  email: string;
  name: string;
  role: string;
  status: string;
}

export const userMapper = {
  // DTO → Domain Entity
  toDomain(dto: UserDTO): User {
    return new User(
      dto.id,
      dto.email,
      dto.name,
      dto.role as UserRole,
      dto.status as UserStatus,
    );
  },

  // Domain Entity → DTO
  toDTO(user: User): UserDTO {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status,
    };
  },

  // Array mapping
  toDomainList(dtos: UserDTO[]): User[] {
    return dtos.map((dto) => this.toDomain(dto));
  },
};

// infrastructure/repositories/userRepository.ts
import { User } from '../../domain/entities/user.entity';
import { UserFilters } from '../../domain/types/user.types';
import { userApi } from '../api/userApi';
import { userMapper } from '../mappers/userMapper';

export const userRepository = {
  async findAll(filters?: UserFilters): Promise<User[]> {
    const dtos = await userApi.getAll(filters);
    return userMapper.toDomainList(dtos);
  },

  async findById(id: string): Promise<User> {
    const dto = await userApi.getById(id);
    return userMapper.toDomain(dto);
  },

  async create(data: Partial<User>): Promise<User> {
    const dto = await userApi.create(data);
    return userMapper.toDomain(dto);
  },

  async update(id: string, data: Partial<User>): Promise<User> {
    const dto = await userApi.update(id, data);
    return userMapper.toDomain(dto);
  },

  async delete(id: string): Promise<void> {
    await userApi.delete(id);
  },
};
```

---

### 🌐 UI Layer (Interface Utilisateur)

**Responsabilité** : Composants React, pages, formulaires.

**Exemples :**

```typescript
// ui/pages/UserListPage.tsx
import { useState } from 'react';
import { useUsers } from '../../application/hooks/useUsers';
import { useUserActions } from '../../application/hooks/useUserActions';
import { UserTable } from '../components/UserTable';
import { UserFilters } from '../../domain/types/user.types';

export function UserListPage() {
  const [filters, setFilters] = useState<UserFilters>({});
  const { data: users, isLoading, error } = useUsers(filters);
  const { deleteUser } = useUserActions();

  const handleDelete = (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      deleteUser.mutate(id);
    }
  };

  if (isLoading) return <div>Chargement...</div>;
  if (error) return <div>Erreur lors du chargement</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Utilisateurs</h1>

      <UserTable
        users={users || []}
        onDelete={handleDelete}
      />
    </div>
  );
}

// ui/components/UserTable.tsx
import { User } from '../../domain/entities/user.entity';
import { UserCard } from './UserCard';

interface UserTableProps {
  users: User[];
  onDelete: (id: string) => void;
}

export function UserTable({ users, onDelete }: UserTableProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {users.map((user) => (
        <UserCard
          key={user.id}
          user={user}
          onDelete={() => onDelete(user.id)}
        />
      ))}
    </div>
  );
}

// ui/components/UserCard.tsx
import { User } from '../../domain/entities/user.entity';

interface UserCardProps {
  user: User;
  onDelete: () => void;
}

export function UserCard({ user, onDelete }: UserCardProps) {
  // ✅ Utilise la logique métier de l'entité
  const canEdit = user.canEditProfile();
  const isAdmin = user.isAdmin();

  return (
    <div className="border rounded-lg p-4 shadow-sm">
      <h3 className="text-lg font-semibold">{user.name}</h3>
      <p className="text-gray-600">{user.email}</p>

      <div className="mt-2 flex gap-2">
        <span className={`badge ${isAdmin ? 'badge-admin' : 'badge-user'}`}>
          {user.role}
        </span>
        <span className={`badge badge-${user.status}`}>
          {user.status}
        </span>
      </div>

      <div className="mt-4 flex gap-2">
        {canEdit && (
          <button className="btn-primary">Modifier</button>
        )}
        <button className="btn-danger" onClick={onDelete}>
          Supprimer
        </button>
      </div>
    </div>
  );
}

// ui/pages/UserFormPage.tsx
import { useNavigate, useParams } from 'react-router-dom';
import { useUser } from '../../application/hooks/useUsers';
import { useUserForm } from '../../application/hooks/useUserForm';
import { useUserActions } from '../../application/hooks/useUserActions';

export function UserFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const { data: user } = useUser(id!);
  const { createUser, updateUser } = useUserActions();

  const { register, handleSubmit, formState: { errors } } = useUserForm(user);

  const onSubmit = async (data: any) => {
    if (isEditMode) {
      await updateUser.mutateAsync({ id: id!, data });
    } else {
      await createUser.mutateAsync(data);
    }
    navigate('/users');
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">
        {isEditMode ? 'Modifier' : 'Créer'} un utilisateur
      </h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block mb-2">Email</label>
          <input
            type="email"
            {...register('email')}
            className="input"
          />
          {errors.email && (
            <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label className="block mb-2">Nom</label>
          <input
            type="text"
            {...register('name')}
            className="input"
          />
          {errors.name && (
            <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
          )}
        </div>

        <div>
          <label className="block mb-2">Rôle</label>
          <select {...register('role')} className="input">
            <option value="user">Utilisateur</option>
            <option value="admin">Administrateur</option>
            <option value="moderator">Modérateur</option>
          </select>
        </div>

        <div className="flex gap-2">
          <button type="submit" className="btn-primary">
            {isEditMode ? 'Mettre à jour' : 'Créer'}
          </button>
          <button type="button" onClick={() => navigate('/users')} className="btn-secondary">
            Annuler
          </button>
        </div>
      </form>
    </div>
  );
}
```

---

## Patterns et bonnes pratiques

### 1. Custom Hooks pour la logique réutilisable

```typescript
// ✅ Bon - Hook réutilisable
export function usePagination<T>(items: T[], itemsPerPage = 10) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(items.length / itemsPerPage);
  const paginatedItems = items.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return {
    items: paginatedItems,
    currentPage,
    totalPages,
    nextPage: () => setCurrentPage((p) => Math.min(p + 1, totalPages)),
    prevPage: () => setCurrentPage((p) => Math.max(p - 1, 1)),
    goToPage: setCurrentPage,
  };
}
```

### 2. Composition de composants

```typescript
// ✅ Bon - Composants composables
export function UserList({ users }: { users: User[] }) {
  return (
    <div className="space-y-4">
      {users.map((user) => (
        <UserListItem key={user.id} user={user} />
      ))}
    </div>
  );
}

function UserListItem({ user }: { user: User }) {
  return (
    <div className="flex items-center gap-4 p-4 border rounded">
      <UserAvatar user={user} />
      <UserInfo user={user} />
      <UserActions user={user} />
    </div>
  );
}
```

### 3. Gestion des erreurs

```typescript
// shared/ui/components/ErrorBoundary.tsx
export class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />;
    }
    return this.props.children;
  }
}
```

---

## Gestion d'état

### Option 1 : React Query (Recommandé pour les données serveur)

```typescript
// ✅ Parfait pour les données serveur
const { data, isLoading, error, refetch } = useQuery({
  queryKey: ['users'],
  queryFn: () => userRepository.findAll(),
});
```

### Option 2 : Zustand (État global simple)

```typescript
// application/stores/userStore.ts
import { create } from 'zustand';
import { User } from '../../domain/entities/user.entity';

interface UserStore {
  selectedUser: User | null;
  setSelectedUser: (user: User | null) => void;

  filters: UserFilters;
  setFilters: (filters: UserFilters) => void;
}

export const useUserStore = create<UserStore>((set) => ({
  selectedUser: null,
  setSelectedUser: (user) => set({ selectedUser: user }),

  filters: {},
  setFilters: (filters) => set({ filters }),
}));
```

---

## Tests

### Tests unitaires (Domain)

```typescript
// domain/entities/__tests__/user.entity.test.ts
describe('User Entity', () => {
  it('should validate user can edit profile when active', () => {
    const user = new User('1', 'test@test.com', 'Test', UserRole.USER, UserStatus.ACTIVE);
    expect(user.canEditProfile()).toBe(true);
  });

  it('should not allow editing when suspended', () => {
    const user = new User('1', 'test@test.com', 'Test', UserRole.USER, UserStatus.SUSPENDED);
    expect(user.canEditProfile()).toBe(false);
  });
});
```

### Tests de hooks

```typescript
// application/hooks/__tests__/useUsers.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { useUsers } from '../useUsers';

describe('useUsers', () => {
  it('should fetch users', async () => {
    const { result } = renderHook(() => useUsers());

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeDefined();
  });
});
```

---

## Checklist

### ✅ Pour chaque nouveau module

- [ ] Créer la structure des dossiers (domain, application, infrastructure, ui)
- [ ] Définir les entités Domain avec logique métier
- [ ] Créer les types TypeScript
- [ ] Implémenter les hooks applicatifs
- [ ] Créer le repository et les mappers
- [ ] Implémenter les composants UI
- [ ] Ajouter les tests
- [ ] Documenter les cas d'usage

---

**Créé pour Remindy - Frontend Admin React**
