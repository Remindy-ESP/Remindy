# User Module - Remindy

Module de gestion des utilisateurs, préférences et exports RGPD.

## Architecture Clean (DDD)

```
user/
├── application/
│   └── services/           # Business logic
│       ├── user.service.ts
│       ├── user-preferences.service.ts
│       └── rgpd-export.service.ts
├── infrastructure/
│   └── repositories/       # Data access layer
│       ├── user.repository.ts
│       ├── user-preferences.repository.ts
│       └── rgpd-export.repository.ts
├── presentation/
│   ├── controllers/        # HTTP endpoints
│   │   └── user.controller.ts
│   └── dto/               # Data Transfer Objects
│       ├── user-profile.dto.ts
│       ├── user-preferences.dto.ts
│       └── rgpd-export.dto.ts
└── user.module.ts         # Module configuration
```

## Entities

### Database Entities (Infrastructure)

Located in: `backend/src/infrastructure/database/entities/`

- **EUser**: Utilisateur principal avec authentification
- **UserPreferenceEntity**: Préférences UI et notifications
- **UserSessionEntity**: Sessions JWT et gestion multi-device
- **RgpdExportEntity**: Exports de données RGPD
- **RoleEntity**: Rôles utilisateur (freemium, premium, admin, super_admin)

## Endpoints API

### User Profile

#### `GET /users/profile`

Récupère le profil de l'utilisateur connecté.

**Response**: `UserProfileResponseDto`

```json
{
  "id": "uuid",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+33612345678",
  "photoR2Key": "users/uuid/photo.jpg",
  "role": "user_premium",
  "status": "verified",
  "timezone": "Europe/Paris",
  "language": "fr",
  "emailVerified": true,
  "mfaEnabled": false,
  "lastLoginAt": "2025-01-15T10:30:00Z",
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2025-01-15T10:30:00Z"
}
```

#### `PUT /users/profile`

Met à jour le profil de l'utilisateur.

**Request Body**: `UpdateUserProfileDto`

```json
{
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+33612345678",
  "timezone": "Europe/Paris",
  "language": "fr"
}
```

**Response**: `UserProfileResponseDto`

---

### User Preferences

#### `GET /users/preferences`

Récupère les préférences de l'utilisateur.

**Response**: `UserPreferencesResponseDto`

```json
{
  "userId": "uuid",
  "theme": "dark",
  "notificationEmail": true,
  "notificationPush": true,
  "notificationSms": false,
  "defaultReminderDelay": 3,
  "currency": "EUR",
  "showOnlineStatus": true,
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2025-01-15T10:30:00Z"
}
```

#### `PUT /users/preferences`

Met à jour les préférences de l'utilisateur.

**Request Body**: `UpdateUserPreferencesDto`

```json
{
  "theme": "dark",
  "notificationEmail": true,
  "notificationPush": true,
  "notificationSms": false,
  "defaultReminderDelay": 7,
  "currency": "EUR",
  "showOnlineStatus": false
}
```

**Response**: `UserPreferencesResponseDto`

---

### RGPD Data Export

#### `POST /users/export-data`

Crée une demande d'export de données RGPD.

**Request Body**: `CreateRgpdExportDto`

```json
{
  "format": "json" // ou "csv"
}
```

**Response** (202 Accepted): `RgpdExportResponseDto`

```json
{
  "id": "uuid",
  "userId": "uuid",
  "status": "pending",
  "format": "json",
  "requestedBy": "user",
  "createdAt": "2025-01-15T10:30:00Z"
}
```

#### `GET /users/exports`

Liste tous les exports de l'utilisateur.

**Response**: `RgpdExportResponseDto[]`

#### `GET /users/exports/:exportId`

Récupère le statut d'un export spécifique.

**Response**: `RgpdExportResponseDto`

```json
{
  "id": "uuid",
  "userId": "uuid",
  "status": "completed",
  "format": "json",
  "fileR2Key": "exports/uuid/data.json",
  "fileSize": 1024768,
  "signedUrl": "https://r2.example.com/...",
  "expiresAt": "2025-01-16T10:30:00Z",
  "requestedBy": "user",
  "createdAt": "2025-01-15T10:30:00Z",
  "completedAt": "2025-01-15T10:35:00Z"
}
```

---

## Services

### UserService

Gestion du profil utilisateur.

- `getUserProfile(userId)`: Récupère le profil
- `updateUserProfile(userId, updateDto)`: Met à jour le profil

### UserPreferencesService

Gestion des préférences utilisateur.

- `getUserPreferences(userId)`: Récupère les préférences (crée par défaut si inexistantes)
- `updateUserPreferences(userId, updateDto)`: Met à jour les préférences

### RgpdExportService

Gestion des exports RGPD.

- `createExportRequest(userId, createDto, ipAddress)`: Crée une demande d'export
- `getExportStatus(userId, exportId)`: Récupère le statut d'un export
- `getUserExports(userId)`: Liste tous les exports de l'utilisateur
- `processExport(exportId)`: Traite un export (appelé par un worker en arrière-plan)

---

## Security

### JWT Authentication

Tous les endpoints requièrent une authentification JWT (à activer en décommentant `@UseGuards(JwtAuthGuard)` dans le contrôleur).

---

## TODO

- [ ] Implémenter JWT Guard et extraire userId depuis le token
- [ ] Implémenter la logique d'export RGPD (génération fichier, upload R2)
- [ ] Ajouter BullMQ pour traiter les exports en arrière-plan
- [ ] Ajouter rate limiting sur les endpoints
- [ ] Implémenter la gestion des photos (upload vers R2)
- [ ] Ajouter des tests unitaires et d'intégration
- [ ] Ajouter logging et monitoring (Sentry)

---
