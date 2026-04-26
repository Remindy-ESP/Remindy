
1. Utilisateurs & Authentification
TABLE: users

JUSTIFICATION:
Table centrale contenant les informations de base de chaque utilisateur. C'est
le point d'entrée principal de l'application - tout utilisateur doit avoir un
compte pour accéder aux fonctionnalités. Gère 4 rôles (freemium, premium,
admin, super_admin) avec permissions définies dynamiquement via la table roles
et role_limits (système flexible, modifiable sans toucher au code).

STRUCTURE:
- id (UUID, PK)
- email (CITEXT, UNIQUE, NOT NULL) -- CITEXT pour unicité case-insensitive
- password_hash (VARCHAR(255), NULLABLE) -- bcrypt ≥12 rounds (NULL pour OAuth uniquement)
- first_name (VARCHAR(100))
- last_name (VARCHAR(100))
- phone (VARCHAR(20), NULLABLE)
- photo_r2_key (VARCHAR(500), NULLABLE) -- Clé R2 Cloudflare pour photo
- role (TEXT, NOT NULL, FK → roles.key) -- Référence vers table roles
- status (ENUM: 'active', 'verified', 'banned', 'inactive')
- timezone (VARCHAR(50), DEFAULT: 'Europe/Paris')
- language (VARCHAR(10), DEFAULT: 'fr')
- email_verified (BOOLEAN, DEFAULT: false)
- mfa_enabled (BOOLEAN, DEFAULT: false)
- mfa_secret (VARCHAR(255), NULLABLE) -- Secret TOTP pour 2FA
- last_login_at (TIMESTAMPTZ, NULLABLE) -- Dernière connexion réussie
- failed_login_count (INTEGER, DEFAULT: 0) -- Compteur d'échecs de connexion
- password_changed_at (TIMESTAMPTZ, NULLABLE) -- Date du dernier changement de MDP
- created_at (TIMESTAMPTZ, DEFAULT: NOW())
- updated_at (TIMESTAMPTZ, DEFAULT: NOW())
- deleted_at (TIMESTAMPTZ, NULLABLE) -- Soft delete pour RGPD

CONTRAINTES:
- CONSTRAINT fk_users_role FOREIGN KEY (role) REFERENCES roles(key)

INDEX:
- UNIQUE idx_users_email ON users(email)
- idx_users_role ON users(role)
- idx_users_status ON users(status)
- idx_users_deleted_at ON users(deleted_at) WHERE deleted_at IS NULL
- idx_users_last_login ON users(last_login_at)
- idx_users_failed_login ON users(failed_login_count) WHERE failed_login_count > 0

PRÉREQUIS:
CREATE EXTENSION IF NOT EXISTS citext;




TABLE: roles

JUSTIFICATION:
Table de référence centrale définissant tous les rôles possibles dans le système.
Permet d'assurer l'intégrité référentielle avec users.role et role_limits.role
via des clés étrangères. Évite les incohérences (ex: role 'user_premium' dans
users mais absent de role_limits). Facilite l'ajout de nouveaux rôles via
l'interface admin sans modification du schéma. La clé TEXT (au lieu d'ENUM)
offre flexibilité et compatibilité avec les FK.

STRUCTURE:
- key (TEXT, PK) -- Ex: 'user_freemium', 'user_premium', 'user_admin', 'super_admin'
- label (VARCHAR(100), NOT NULL) -- Nom affiché dans l'UI (ex: "Utilisateur Premium")
- description (TEXT, NULLABLE) -- Description du rôle et ses permissions
- created_at (TIMESTAMPTZ, DEFAULT: NOW())

INDEX:
- PRIMARY KEY sur key

DONNÉES INITIALES:
INSERT INTO roles (key, label, description) VALUES
('user_freemium', 'Utilisateur Freemium', 'Accès gratuit limité: 5 abonnements, 10 documents, pas d''OCR ni export'),
('user_premium', 'Utilisateur Premium', 'Accès complet: abonnements illimités, OCR, export données, 50MB par document'),
('user_admin', 'Administrateur', 'Gestion des utilisateurs, modération, accès panel admin'),
('super_admin', 'Super Administrateur', 'Accès complet système, gestion rôles, configuration globale');

CAS D'USAGE:
- Garantit que tous les rôles dans users existent dans role_limits
- Interface admin: dropdown des rôles disponibles depuis cette table
- Ajout d'un nouveau rôle 'user_enterprise' sans toucher au code










TABLE: user_sessions


JUSTIFICATION:
Gestion sécurisée des sessions utilisateur avec système JWT. Stocke uniquement 
le refresh token (longue durée 7-30 jours) tandis que l'access token (courte 
durée 15min-1h) reste en mémoire frontend. Permet le tracking multi-device, 
la détection de connexions suspectes (nouveau pays/IP), et la déconnexion à 
distance (ex: "Déconnecter mon ancien iPhone"). Essentiel pour la sécurité et 
la conformité avec les specs (MFA, re-auth pour actions sensibles).

STRUCTURE:
- id (UUID, PK)
- user_id (UUID, FK → users.id, ON DELETE CASCADE, NOT NULL)
- refresh_token_hash (VARCHAR(255), UNIQUE, NOT NULL) -- Hash SHA256 (tokens aléatoires, pas besoin bcrypt)
- device_name (VARCHAR(100), NULLABLE) -- Ex: "iPhone 13", "Chrome - Windows"
- ip_address (INET, NOT NULL)
- user_agent (TEXT, NULLABLE)
- last_activity (TIMESTAMPTZ, DEFAULT: NOW())
- expires_at (TIMESTAMPTZ, NOT NULL) -- Expiration du refresh token
- is_revoked (BOOLEAN, DEFAULT: false) -- Révocation manuelle de la session
- created_at (TIMESTAMPTZ, DEFAULT: NOW())
- deleted_at (TIMESTAMPTZ, NULLABLE) -- Soft delete pour RGPD

INDEX:
- idx_user_sessions_user_id ON user_sessions(user_id)
- UNIQUE idx_user_sessions_refresh_token_hash ON user_sessions(refresh_token_hash)
- idx_user_sessions_expires_at ON user_sessions(expires_at)
- idx_user_sessions_is_revoked ON user_sessions(is_revoked) WHERE is_revoked = false
- UNIQUE idx_user_sessions_active_device ON user_sessions(user_id, device_name)
  WHERE is_revoked = false AND expires_at > NOW() AND deleted_at IS NULL
  -- Évite les doublons de sessions actives pour le même device
- idx_user_sessions_deleted_at ON user_sessions(deleted_at) WHERE deleted_at IS NULL

CAS D'USAGE:
- L'utilisateur voit "Vous êtes connecté sur 3 appareils" et peut déconnecter
  son ancien téléphone → SET is_revoked = true
- Admin peut révoquer toutes les sessions d'un utilisateur →
  UPDATE user_sessions SET is_revoked = true WHERE user_id = '...'
- Alerte si connexion depuis un nouveau pays
- L'access token (15min-1h) est en mémoire frontend, pas en BDD
- Unicité active par device: impossible d'avoir 2 sessions actives "iPhone 13"
  pour le même user (évite doublons bruyants)
- Validation token: vérifier is_revoked = false ET expires_at > NOW()











TABLE: user_preferences


JUSTIFICATION:
Normalisation de la base de données - séparer les préférences UI/notifications 
des données utilisateur critiques évite de surcharger la table users et permet 
des mises à jour fréquentes sans impacter les données sensibles. Chaque 
utilisateur peut personnaliser son expérience (thème sombre, délai de rappel 
par défaut, canaux de notification).

STRUCTURE:
- user_id (UUID, PK, FK → users.id, ON DELETE CASCADE)
- theme (ENUM: 'light', 'dark', 'auto', DEFAULT: 'light')
- notification_email (BOOLEAN, DEFAULT: true)
- notification_push (BOOLEAN, DEFAULT: true)
- notification_sms (BOOLEAN, DEFAULT: false)
- default_reminder_delay (INTEGER, DEFAULT: 3) -- Jours avant échéance
- currency (VARCHAR(3), DEFAULT: 'EUR')
- show_online_status (BOOLEAN, DEFAULT: true)
- created_at (TIMESTAMPTZ, DEFAULT: NOW())
- updated_at (TIMESTAMPTZ, DEFAULT: NOW())
- deleted_at (TIMESTAMPTZ, NULLABLE) -- Soft delete pour RGPD (cascade si user supprimé)

CONTRAINTES:
- CONSTRAINT chk_preferences_reminder_delay CHECK (default_reminder_delay BETWEEN 1 AND 365)

CAS D'USAGE:
- User active le mode sombre
- User désactive les notifications email mais garde les push
- User préfère être rappelé 7 jours avant au lieu de 3



TABLE: role_limits

JUSTIFICATION:
Définit les limites fonctionnelles de chaque rôle (quotas, permissions). Permet
de centraliser toutes les restrictions par rôle dans une seule table. Le lien
avec la table roles via FK garantit qu'on ne peut pas créer de limites pour un
rôle inexistant. Facilite l'ajustement des quotas sans toucher au code (ex:
passer freemium de 5 à 10 abonnements). Les valeurs NULL = illimité.

STRUCTURE:
- role (TEXT, PK, FK → roles.key)
- max_subscriptions (INTEGER, NULLABLE) -- NULL = illimité
- max_documents (INTEGER, NULLABLE) -- NULL = illimité
- max_document_size_mb (INTEGER, NULLABLE) -- NULL = illimité
- max_reminders_per_subscription (INTEGER, NULLABLE) -- NULL = illimité
- can_export_data (BOOLEAN, DEFAULT: true)
- can_use_ocr (BOOLEAN, DEFAULT: true)
- created_at (TIMESTAMPTZ, DEFAULT: NOW())
- updated_at (TIMESTAMPTZ, DEFAULT: NOW())

CONTRAINTES:
- CONSTRAINT fk_role_limits_role FOREIGN KEY (role) REFERENCES roles(key) ON DELETE CASCADE
- CONSTRAINT chk_role_limits_positive CHECK (
    (max_subscriptions IS NULL OR max_subscriptions > 0) AND
    (max_documents IS NULL OR max_documents > 0) AND
    (max_document_size_mb IS NULL OR max_document_size_mb > 0) AND
    (max_reminders_per_subscription IS NULL OR max_reminders_per_subscription > 0)
  )


 Données initiales temporaire 

INSERT INTO role_limits (role, max_subscriptions, max_documents, max_document_size_mb, max_reminders_per_subscription, can_export_data, can_use_ocr) VALUES
('user_freemium', 5, 10, 5, 2, false, false),
('user_premium', NULL, NULL, 50, NULL, true, true),
('user_admin', NULL, NULL, NULL, NULL, true, true),
('super_admin', NULL, NULL, NULL, NULL, true, true);


































 2. DOCUMENTS & CLOUD (CLOUDFLARE R2)

TABLE: contracts

JUSTIFICATION:
Table de référence pour catégoriser les types d'abonnements et documents. 
Permet une gestion centralisée des catégories avec métadonnées (icônes, 
couleurs) réutilisables dans toute l'application. Facilite l'ajout de 
nouvelles catégories via l'interface admin sans modification du code. Supporte 
le filtrage avancé ("Afficher tous mes abonnements Streaming") et les 
statistiques par catégorie ("15% du budget en Énergie").

STRUCTURE:
- id (SERIAL, PK)
- type (VARCHAR(50), UNIQUE, NOT NULL)
- label (VARCHAR(100), NOT NULL)
- icon (VARCHAR(50), NULLABLE) -- Nom de l'icône pour UI (ex: "bolt", "wifi")
- color (VARCHAR(7), NULLABLE) -- Couleur HEX (ex: "#FF5733")
- description (TEXT, NULLABLE)
- created_at (TIMESTAMPTZ, DEFAULT: NOW())
- updated_at (TIMESTAMPTZ, DEFAULT: NOW())

INDEX:
- UNIQUE idx_contracts_type ON contracts(type)

DONNÉES INITIALES:
INSERT INTO contracts (type, label, icon, color) VALUES
  ('energy', 'Énergie', 'bolt', '#FF5733'),
  ('internet', 'Internet & Téléphonie', 'wifi', '#3498DB'),
  ('insurance', 'Assurance', 'shield', '#2ECC71'),
  ('streaming', 'Streaming', 'tv', '#E74C3C'),
  ('saas', 'Logiciels SaaS', 'cloud', '#9B59B6'),
  ('mobile', 'Mobile', 'smartphone', '#F39C12'),
  ('transport', 'Transport', 'car', '#1ABC9C'),
  ('fitness', 'Sport & Fitness', 'dumbbell', '#E67E22'),
  ('other', 'Autre', 'tag', '#95A5A6');



TABLE: documents

JUSTIFICATION:
Stockage et gestion des contrats/factures uploadés avec extraction automatique 
OCR (Tesseract.js). Utilise Cloudflare R2 pour le stockage cloud sécurisé et 
économique (5GB gratuit). Les fichiers ne sont jamais stockés en BDD 
(seulement la clé R2), et les URLs signées temporaires (1h) sont générées à 
la demande pour téléchargement sécurisé. Le hash SHA256 garantit l'intégrité 
des fichiers. L'OCR extrait automatiquement le texte pour recherche full-text 
("Retrouve ma facture EDF d'octobre 2024"). Lien avec subscriptions permet 
d'attacher des justificatifs à chaque abonnement.

STRUCTURE:
- id (UUID, PK)
- user_id (UUID, FK → users.id, ON DELETE CASCADE, NOT NULL)
- subscription_id (UUID, FK → subscriptions.id, ON DELETE SET NULL, NULLABLE)
- contract_id (INTEGER, FK → contracts.id, ON DELETE SET NULL, NULLABLE)
- filename (VARCHAR(255), NOT NULL) -- Nom original du fichier
- r2_key (VARCHAR(500), UNIQUE, NOT NULL) -- Ex: "users/123/docs/facture.pdf"
- r2_bucket (VARCHAR(100), DEFAULT: 'remindy-documents') -- Nom du bucket R2
- file_hash (VARCHAR(64), NOT NULL) -- SHA256 pour vérifier l'intégrité
- file_size (BIGINT, NOT NULL) -- Taille en bytes
- mime_type (VARCHAR(100), NOT NULL) -- 'application/pdf', 'image/jpeg'
- ocr_text (TEXT, NULLABLE) -- Texte extrait par OCR
- ocr_status (ENUM: 'pending', 'processing', 'completed', 'failed')
- ocr_error (TEXT, NULLABLE) -- Raison de l'échec OCR si applicable
- uploaded_at (TIMESTAMPTZ, DEFAULT: NOW())
- updated_at (TIMESTAMPTZ, DEFAULT: NOW())
- deleted_at (TIMESTAMPTZ, NULLABLE)

CONTRAINTES:
- CONSTRAINT chk_documents_file_size CHECK (file_size > 0 AND file_size <= 52428800)
  -- Max 50MB par fichier



INDEX:
- idx_documents_user_id ON documents(user_id)
- idx_documents_subscription_id ON documents(subscription_id)
- idx_documents_contract_id ON documents(contract_id)
- UNIQUE idx_documents_r2_key ON documents(r2_key)
- idx_documents_ocr_status ON documents(ocr_status)
- idx_documents_uploaded_at ON documents(uploaded_at)
- idx_documents_ocr_text_gin ON documents USING GIN(to_tsvector('french', ocr_text))
- idx_documents_deleted_at ON documents(deleted_at) WHERE deleted_at IS NULL

CAS D'USAGE:
- User upload une facture EDF → OCR extrait "Montant: 89€, Date: 15/03/2025"
- Recherche : "Retrouve ma facture d'octobre 2024"
- Backend génère une URL signée temporaire R2 (valide 1h) pour téléchargement
- Les URLs ne sont PAS stockées en BDD, générées à la demande




3. Abonnements

TABLE: subscriptions


JUSTIFICATION:
Cœur métier de l'application - stocke tous les abonnements créés par les 
utilisateurs. Gère les informations essentielles (nom, montant, fréquence) et 
les périodes d'essai (trial_start_date, trial_end_date) cruciales pour les 
notifications ("Votre essai Netflix se termine dans 3 jours"). Le champ 
is_trial_active est calculé automatiquement (GENERATED) pour éviter les 
erreurs. Lié à contracts pour catégorisation et à documents pour justificatifs.

STRUCTURE:
- id (UUID, PK)
- user_id (UUID, FK → users.id, ON DELETE CASCADE, NOT NULL)
- contract_id (INTEGER, FK → contracts.id, ON DELETE SET NULL, NULLABLE)
- name (VARCHAR(255), NOT NULL) -- Ex: "Netflix", "EDF", "Spotify"
- amount (NUMERIC(19,4), NOT NULL) -- Montant haute précision pour multi-devises
- currency (VARCHAR(3), DEFAULT: 'EUR')
- frequency (VARCHAR(20), NOT NULL) -- CHECK: 'weekly', 'monthly', 'quarterly', 'yearly'
- start_date (DATE, NOT NULL) -- Date de début de l'abonnement
- next_due_date (DATE, NOT NULL) -- Prochaine échéance (calculé auto)
- trial_start_date (DATE, NULLABLE) -- Début de la période d'essai
- trial_end_date (DATE, NULLABLE) -- Fin de la période d'essai
- is_trial_active (BOOLEAN GENERATED ALWAYS AS 
                   (trial_end_date IS NOT NULL AND 
                    trial_end_date >= CURRENT_DATE) STORED)
- status (VARCHAR(20), DEFAULT: 'active') -- CHECK: 'active', 'paused', 'cancelled', 'trial'
- color (VARCHAR(7), NULLABLE) -- Couleur HEX pour le calendrier (ex: '#FF5733')
- notes (TEXT, NULLABLE)
- created_at (TIMESTAMPTZ, DEFAULT: NOW())
- updated_at (TIMESTAMPTZ, DEFAULT: NOW())
- deleted_at (TIMESTAMPTZ, NULLABLE) -- Soft delete pour RGPD

CONTRAINTES:
- CONSTRAINT chk_subscriptions_amount_positive CHECK (amount > 0)
- CONSTRAINT chk_subscriptions_trial_dates CHECK (
    trial_start_date IS NULL OR 
    trial_end_date IS NULL OR 
    trial_end_date > trial_start_date
  )
- CONSTRAINT chk_subscriptions_frequency CHECK (
    frequency IN ('weekly', 'monthly', 'quarterly', 'yearly')
  )
- CONSTRAINT chk_subscriptions_status CHECK (
    status IN ('active', 'paused', 'cancelled', 'trial')
  )


INDEX:
- idx_subscriptions_user_id ON subscriptions(user_id)
- idx_subscriptions_contract_id ON subscriptions(contract_id)
- idx_subscriptions_status ON subscriptions(status)
- idx_subscriptions_next_due_date ON subscriptions(next_due_date)
- idx_subscriptions_trial_end_date ON subscriptions(trial_end_date)
  WHERE trial_end_date IS NOT NULL
- idx_subscriptions_deleted_at ON subscriptions(deleted_at)
  WHERE deleted_at IS NULL
- UNIQUE uq_subscriptions_user_name ON subscriptions(user_id, lower(name))
  WHERE deleted_at IS NULL
  -- Empêche les doublons par user (ex: 2x "Netflix" ou "netflix")


CAS D'USAGE:
- User s'abonne à Netflix avec 1 mois d'essai gratuit
- Job quotidien vérifie si période d'essai terminée et passe statut à 'active'
- Affichage dans le calendrier avec couleur personnalisée
- Calcul automatique du next_due_date selon la fréquence

SOFT DELETE CASCADE:
⚠️ Quand un subscription est soft-deleted (deleted_at défini), propager aux tables liées:
- event_series → SET deleted_at = subscriptions.deleted_at WHERE subscription_id = id
- events → SET deleted_at = subscriptions.deleted_at WHERE subscription_id = id
- reminders → SET deleted_at = subscriptions.deleted_at WHERE subscription_id = id
- documents → (optionnel) SET deleted_at si abonnement supprimé

Implémentation recommandée:
1. Trigger PostgreSQL (automatique, synchrone)
2. OU Background Job (asynchrone, plus sûr pour volumes importants)

Exemple trigger complet:
CREATE OR REPLACE FUNCTION soft_delete_subscription_cascade()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
    -- Soft delete event_series first
    UPDATE event_series SET deleted_at = NEW.deleted_at
      WHERE subscription_id = NEW.id AND deleted_at IS NULL;

    -- Then soft delete all events
    UPDATE events SET deleted_at = NEW.deleted_at
      WHERE subscription_id = NEW.id AND deleted_at IS NULL;

    -- Soft delete reminders
    UPDATE reminders SET deleted_at = NEW.deleted_at
      WHERE subscription_id = NEW.id AND deleted_at IS NULL;

    -- Optional: soft delete documents
    -- UPDATE documents SET deleted_at = NEW.deleted_at
    --   WHERE subscription_id = NEW.id AND deleted_at IS NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_soft_delete_subscription
AFTER UPDATE ON subscriptions
FOR EACH ROW
EXECUTE FUNCTION soft_delete_subscription_cascade();





TABLE: event_series

JUSTIFICATION:
Table CRITIQUE pour gérer la récurrence des abonnements selon le standard 
iCalendar (RFC 5545) - le même format utilisé par Google Calendar, Outlook, 
Apple Calendar. Stocke une règle RRULE unique par abonnement définissant 
comment les paiements se répètent dans le temps (mensuel le 15, annuel, tous 
les lundis, etc.). Permet des récurrences complexes ("tous les 15 du mois sauf 
juillet-août") impossibles à gérer avec de simples ENUMs. Le timezone est 
crucial pour les calculs précis (DST, fuseaux horaires). Cette architecture 
évite la duplication massive de données et facilite les modifications globales 
(changer la fréquence met à jour une seule règle, pas 12 lignes).

STRUCTURE:
- id (UUID, PK)
- subscription_id (UUID, FK → subscriptions.id, ON DELETE CASCADE, UNIQUE, NOT NULL)
- rrule (TEXT, NOT NULL) -- Règle de récurrence au format iCalendar RFC 5545 (normalisée uppercase)
- dtstart (TIMESTAMPTZ, NOT NULL) -- Point d'ancrage exact de la RRULE (début de la série)
- timezone (VARCHAR(50), NOT NULL, DEFAULT: 'Europe/Paris')
- exdates (TIMESTAMPTZ[], NULLABLE) -- Dates d'exception à exclure de la récurrence
- rdates (TIMESTAMPTZ[], NULLABLE) -- Dates additionnelles à inclure dans la récurrence
- created_at (TIMESTAMPTZ, DEFAULT: NOW())
- updated_at (TIMESTAMPTZ, DEFAULT: NOW())
- deleted_at (TIMESTAMPTZ, NULLABLE) -- Soft delete pour RGPD

INDEX:
- UNIQUE idx_event_series_subscription_id ON event_series(subscription_id)
- idx_event_series_dtstart ON event_series(dtstart)
- idx_event_series_exdates_gin ON event_series USING GIN(exdates)
- idx_event_series_rdates_gin ON event_series USING GIN(rdates)
- idx_event_series_deleted_at ON event_series(deleted_at) WHERE deleted_at IS NULL

VALIDATION & NORMALISATION:
⚠️ Côté application (avant insertion DB):
1. Parser la RRULE avec une lib iCal (rrule.js, rruleset)
2. Valider strictement la syntaxe RFC 5545
3. Normaliser: UPPERCASE, tri alphabétique des paramètres
   Ex: "freq=monthly;bymonthday=15" → "FREQ=MONTHLY;BYMONTHDAY=15"
4. Vérifier cohérence dtstart/RRULE (ex: si BYDAY=MO, dtstart doit être un lundi)
5. Limiter complexité (ex: max 100 occurrences pour preview)

💾 En base de données:
- rrule stockée normalisée (facilite comparaisons, cache)
- dtstart en UTC (timezone stocké séparément pour calculs DST)
- exdates/rdates en UTC également

EXEMPLES RRULE:
1. Mensuel le 15 du mois :
   FREQ=MONTHLY;INTERVAL=1;BYMONTHDAY=15

2. Annuel le 1er janvier :
   FREQ=YEARLY;INTERVAL=1;BYMONTHDAY=1;BYMONTH=1

3. Hebdomadaire le lundi :
   FREQ=WEEKLY;INTERVAL=1;BYDAY=MO

4. Trimestriel :
   FREQ=MONTHLY;INTERVAL=3

5. Complexe (tous les 15 du mois sauf juillet-août) :
   FREQ=MONTHLY;BYMONTHDAY=15;BYMONTH=1,2,3,4,5,6,9,10,11,12

EXEMPLES EXDATES/RDATES:
1. Abonnement mensuel le 15, mais sauter décembre 2025 :
   rrule: "FREQ=MONTHLY;BYMONTHDAY=15"
   dtstart: 2025-01-15T00:00:00Z
   exdates: ['2025-12-15T00:00:00Z']
   → Génère tous les 15 du mois SAUF 15 décembre 2025

2. Abonnement hebdomadaire le lundi, ajouter un paiement exceptionnel vendredi :
   rrule: "FREQ=WEEKLY;BYDAY=MO"
   dtstart: 2025-01-06T00:00:00Z (un lundi)
   rdates: ['2025-03-21T00:00:00Z'] (un vendredi)
   → Génère tous les lundis + vendredi 21 mars 2025

3. User en vacances du 01/08 au 31/08, suspendre tous les paiements :
   exdates: ['2025-08-05T00:00:00Z', '2025-08-15T00:00:00Z', '2025-08-25T00:00:00Z']

POURQUOI ESSENTIEL:
- Sans cette table : impossible d'afficher le calendrier complet (12 mois)
- Format standard : compatible Google Calendar synchronisation
- Flexibilité : gérer des récurrences complexes sans logique métier compliquée
- Performance : une règle génère des milliers d'événements



























TABLE: events

JUSTIFICATION:
Table FONDAMENTALE contenant chaque occurrence individuelle d'un abonnement 
générée automatiquement par la règle RRULE de event_series. C'est la table la 
plus consultée de l'application (affichage calendrier, envoi notifications, 
statistiques). Permet le tracking précis de chaque paiement avec statuts 
indépendants : "marquer comme payé", "annuler uniquement décembre", "paiement 
échoué". Sans elle, impossible d'avoir un calendrier fonctionnel, des 
notifications ciblées ("dans 3 jours"), ou des statistiques exactes ("1247€ 
dépensés en 2025"). Les événements sont générés à l'avance (12 mois) par un 
job automatique, puis mis à jour selon les actions utilisateur.

STRUCTURE:

- id (UUID, PK)
- subscription_id (UUID, FK → subscriptions.id, ON DELETE CASCADE, NOT NULL)
- event_series_id (UUID, FK → event_series.id, ON DELETE SET NULL, NULLABLE)
- title (VARCHAR(255), NOT NULL) -- Ex: "Paiement Netflix"
- amount (NUMERIC(19,4), NOT NULL) -- Montant haute précision (cohérent avec subscriptions)
- starts_at (TIMESTAMPTZ, NOT NULL) -- Date/heure précise en UTC
- ends_at (TIMESTAMPTZ, NULLABLE) -- Optionnel (pour événements avec durée)
- status (VARCHAR(20), DEFAULT: 'scheduled') -- CHECK: 'scheduled', 'completed', 'canceled', 'failed'
- payment_status (VARCHAR(20), NULLABLE) -- CHECK: 'pending', 'paid', 'failed'
- notes (TEXT, NULLABLE)
- created_at (TIMESTAMPTZ, DEFAULT: NOW())
- updated_at (TIMESTAMPTZ, DEFAULT: NOW())
- deleted_at (TIMESTAMPTZ, NULLABLE) -- Soft delete pour RGPD

CONTRAINTES:
- CONSTRAINT chk_events_amount_positive CHECK (amount > 0)
- CONSTRAINT chk_events_dates CHECK (ends_at IS NULL OR ends_at >= starts_at)
- CONSTRAINT chk_events_status CHECK (
    status IN ('scheduled', 'completed', 'canceled', 'failed')
  )
- CONSTRAINT chk_events_payment_status CHECK (
    payment_status IS NULL OR 
    payment_status IN ('pending', 'paid', 'failed')
  )

INDEX:
- idx_events_subscription_id ON events(subscription_id)
- idx_events_event_series_id ON events(event_series_id)
- idx_events_starts_at ON events(starts_at)
- idx_events_status ON events(status)
- idx_events_payment_status ON events(payment_status)
- idx_events_user_date ON events(subscription_id, starts_at) -- Composite
- idx_events_scheduled_date ON events(status, starts_at)
  WHERE status = 'scheduled'
- idx_events_overdue ON events(status, starts_at, payment_status)
  WHERE status = 'scheduled'
- UNIQUE uq_event_unique ON events(subscription_id, starts_at)
  WHERE status <> 'canceled' AND deleted_at IS NULL
  -- Empêche les doublons d'événements (protection contre bugs de génération)
- idx_events_deleted_at ON events(deleted_at) WHERE deleted_at IS NULL



CAS D'USAGE CRITIQUES:

1. CALENDRIER MENSUEL
Query pour afficher tous les événements de novembre 2025:

SELECT e.*, s.name, s.color, c.label as category
FROM events e
JOIN subscriptions s ON e.subscription_id = s.id
JOIN contracts c ON s.contract_id = c.id
WHERE s.user_id = 'user-123'
  AND e.starts_at >= '2025-11-01'
  AND e.starts_at < '2025-12-01'
ORDER BY e.starts_at;

2. MARQUER COMME PAYÉ
Pierre clique "Marquer comme payé" pour Netflix novembre:

UPDATE events 
SET status = 'completed', 
    payment_status = 'paid', 
    updated_at = NOW()
WHERE id = 'evt-1';

→ Uniquement novembre passe à "payé", décembre reste "scheduled"

3. ANNULER UN SEUL MOIS
Pierre part en vacances, saute décembre:

UPDATE events 
SET status = 'canceled'
WHERE id = 'evt-2' AND subscription_id = 'sub-netflix';

→ Janvier, février, etc. restent actifs

4. NOTIFICATIONS AUTOMATIQUES
Job BullMQ quotidien : trouver events dans 3 jours:

SELECT e.*, s.name, u.email, r.channels
FROM events e
JOIN subscriptions s ON e.subscription_id = s.id
JOIN users u ON s.user_id = u.id
JOIN reminders r ON r.subscription_id = s.id
WHERE e.status = 'scheduled'
  AND e.starts_at::date = (CURRENT_DATE + INTERVAL '3 days')::date
  AND r.enabled = true;

5. STATISTIQUES ANNUELLES
Combien Pierre a dépensé en 2025 ?

SELECT SUM(amount) as total_paid
FROM events
WHERE subscription_id IN (
  SELECT id FROM subscriptions WHERE user_id = 'user-pierre'
)
AND status = 'completed'
AND payment_status = 'paid'
AND EXTRACT(YEAR FROM starts_at) = 2025;

POURQUOI ABSOLUMENT ESSENTIEL:
- Sans events : calendrier impossible (on ne peut pas afficher 12 mois)
- Sans events : notifications impossibles (on ne sait pas quand alerter)
- Sans events : statistiques fausses (on ne sait pas ce qui a été payé)
- Sans events : pas de flexibilité (impossible d'annuler 1 seul paiement)


6. DÉTECTION RETARDS
Job quotidien : détecter paiements en retard (3j+):

SELECT e.*, s.name, u.email
FROM events e
JOIN subscriptions s ON e.subscription_id = s.id
JOIN users u ON s.user_id = u.id
WHERE e.status = 'scheduled'
  AND e.starts_at < NOW() - INTERVAL '3 days'
  AND (e.payment_status IS NULL OR e.payment_status = 'pending');

→ Génère notifications de type 'payment_overdue'

GÉNÉRATION D'ÉVÉNEMENTS (GUARDRAIL):
⚠️ Protection contre l'explosion d'événements infinis:

Stratégie Rolling Window (12 mois):
1. Job quotidien (cron à minuit)
2. Pour chaque event_series active:
   - Vérifie: "Ai-je des events jusqu'à aujourd'hui + 12 mois ?"
   - Si non: génère les events manquants jusqu'à +12 mois
   - Ne jamais générer plus de 12-18 mois à l'avance

Exemple:
- Aujourd'hui: 2025-01-15
- Job génère events: 2025-01-15 → 2026-01-15 (12 mois)
- Demain (2025-01-16): vérifie si 2026-01-16 existe
- Si non, génère 2026-01-16 (maintient fenêtre de 12 mois)

Avantages:
✓ Gère les RRULE infinies ("FREQ=DAILY" pour toujours)
✓ Croissance contrôlée de la DB
✓ Performance prévisible (max ~365 events/subscription/an)
✓ L'index unique uq_event_unique évite les doublons si job re-run








4. Notifications & Alertes

TABLE: reminders

JUSTIFICATION:
Configuration personnalisée des rappels par abonnement et par utilisateur. 
Permet une granularité fine : chaque user peut définir QUAND (delay_days) et 
COMMENT (email, push, SMS) il veut être notifié pour chaque abonnement. Un 
user peut avoir plusieurs rappels pour le même abonnement (ex: 7j avant + 1j 
avant). Le système multi-canaux (ARRAY) permet d'envoyer simultanément par 
email ET push. Le flag enabled permet désactivation temporaire sans suppression. 
Crucial pour le système de notifications automatiques (job BullMQ scan quotidien).

STRUCTURE:
- id (UUID, PK)
- subscription_id (UUID, FK → subscriptions.id, ON DELETE CASCADE, NOT NULL)
- user_id (UUID, FK → users.id, ON DELETE CASCADE, NOT NULL)
- delay_days (INTEGER, NOT NULL) -- Ex: 3 pour "3 jours avant l'échéance"
- channels (TEXT[], NOT NULL) -- ARRAY: ['email', 'push', 'sms']
- color (VARCHAR(7), NULLABLE) -- Couleur HEX pour UI
- enabled (BOOLEAN, DEFAULT: true)
- created_at (TIMESTAMPTZ, DEFAULT: NOW())
- updated_at (TIMESTAMPTZ, DEFAULT: NOW())
- deleted_at (TIMESTAMPTZ, NULLABLE) -- Soft delete pour RGPD


CONTRAINTES: 
- CONSTRAINT chk_reminders_delay_range CHECK (delay_days BETWEEN 1 AND 365)

INDEX:
- idx_reminders_subscription_id ON reminders(subscription_id)
- idx_reminders_user_id ON reminders(user_id)
- idx_reminders_enabled ON reminders(enabled) WHERE enabled = true
- idx_reminders_deleted_at ON reminders(deleted_at) WHERE deleted_at IS NULL

CAS D'USAGE:
- User configure : "Rappelle-moi 3 jours avant le paiement Netflix par email 
  et push"
- User peut avoir plusieurs rappels : 7j avant (email) + 1j avant (push + SMS)
- Désactivation temporaire pendant les vacances



TABLE: notifications

JUSTIFICATION:
Historique complet et traçabilité de toutes les notifications envoyées (email, 
push, SMS). Centralise tous les types de notifications (rappels d'échéance, 
alertes sécurité, confirmations paiement) avec statuts détaillés (pending, 
sent, failed). Le système de "snooze" (snoozed_until) permet à l'utilisateur 
de reporter une notification sans la supprimer. Les timestamps (sent_at, 
read_at) permettent d'analyser les taux d'ouverture et d'optimiser les envois. 
Essentiel pour le centre de notifications dans l'app ("Vous avez 5 
notifications non lues") et pour le debugging (pourquoi un email n'est pas 
arrivé ?).

STRUCTURE:
- id (UUID, PK)
- user_id (UUID, FK → users.id, ON DELETE CASCADE, NOT NULL)
- event_id (UUID, FK → events.id, ON DELETE SET NULL, NULLABLE)
- reminder_id (UUID, FK → reminders.id, ON DELETE SET NULL, NULLABLE)
- type (ENUM: 'reminder', 'payment_overdue', 'trial_ending',
      'subscription_renewed', 'document_processed')
- channel (ENUM: 'email', 'push', 'sms')
- title (VARCHAR(255), NOT NULL)
- body (TEXT, NOT NULL)
- sent_at (TIMESTAMPTZ, NULLABLE) -- NULL si en attente d'envoi
- read_at (TIMESTAMPTZ, NULLABLE)
- status (ENUM: 'pending', 'sent', 'failed', 'snoozed', DEFAULT: 'pending')
- snoozed_until (TIMESTAMPTZ, NULLABLE) -- Si user clique "rappelle-moi plus tard"
- error_message (TEXT, NULLABLE) -- Si échec d'envoi (SMTP error, token invalide)
- metadata (JSONB, NULLABLE) -- Infos supplémentaires (ex: message_id SendGrid)
- created_at (TIMESTAMPTZ, DEFAULT: NOW())
- deleted_at (TIMESTAMPTZ, NULLABLE) -- Soft delete pour RGPD

CONTRAINTES:
- CONSTRAINT chk_notifications_snooze CHECK (
    status <> 'snoozed' OR
    (status = 'snoozed' AND snoozed_until IS NOT NULL AND snoozed_until > NOW())
  )
  -- Si status='snoozed', snoozed_until doit être dans le futur

INDEX:
- idx_notifications_user_id ON notifications(user_id)
- idx_notifications_event_id ON notifications(event_id)
- idx_notifications_status ON notifications(status)
- idx_notifications_sent_at ON notifications(sent_at)
- idx_notifications_snoozed_until ON notifications(snoozed_until)
  WHERE status = 'snoozed'
- idx_notifications_type_channel ON notifications(type, channel)
- idx_notifications_pending ON notifications(status, created_at) WHERE status IN ('pending', 'snoozed')
- idx_notifications_deleted_at ON notifications(deleted_at) WHERE deleted_at IS NULL

CAS D'USAGE:
- User reçoit "Paiement Netflix dans 3 jours"
- Clique "Snooze 1 jour" → status='snoozed', snoozed_until = demain
- Dashboard : "Vous avez 5 notifications non lues"
- Job BullMQ vérifie les notifications en attente et les envoie via 
  Firebase/SendGrid
- Historique : "Email envoyé le 13/10/2025 à 14h30"
- Analytics admin : "Taux d'ouverture email : 45%"




5. Administration & Audit

TABLE: admin_audit_log

JUSTIFICATION:
Table critique pour la traçabilité complète des actions administratives. Enregistre
toutes les modifications effectuées via le panel admin (ban/unban, changement de
rôle, reset MDP, suppression de données). Essentiel pour la conformité (RGPD,
sécurité), le debugging, et la détection d'actions malveillantes ou non autorisées.
Permet de répondre aux questions : "Qui a banni cet utilisateur ?", "Quand cette
permission a été révoquée ?", "Quelle était la valeur avant modification ?". Le
champ JSONB before/after stocke l'état complet pour rollback potentiel.

STRUCTURE:
- id (UUID, PK)
- actor_user_id (UUID, FK → users.id, ON DELETE SET NULL, NULLABLE) -- Admin qui effectue l'action
- action (VARCHAR(100), NOT NULL) -- Ex: 'user.ban', 'role.update', 'data.delete'
- resource_type (VARCHAR(50), NOT NULL) -- Ex: 'user', 'subscription', 'document'
- resource_id (VARCHAR(255), NOT NULL) -- ID de la ressource modifiée
- before (JSONB, NULLABLE) -- État avant modification
- after (JSONB, NULLABLE) -- État après modification
- ip_address (INET, NOT NULL) -- IP de l'admin
- user_agent (TEXT, NULLABLE)
- severity (VARCHAR(20), DEFAULT: 'info') -- CHECK: 'info', 'warning', 'critical'
- success (BOOLEAN, DEFAULT: true) -- Si l'action a réussi ou échoué
- error_message (TEXT, NULLABLE) -- Si échec, détails de l'erreur
- created_at (TIMESTAMPTZ, DEFAULT: NOW())

CONTRAINTES:
- CONSTRAINT chk_admin_audit_severity CHECK (
    severity IN ('info', 'warning', 'critical')
  )

INDEX:
- idx_admin_audit_actor_user_id ON admin_audit_log(actor_user_id)
- idx_admin_audit_action ON admin_audit_log(action)
- idx_admin_audit_resource ON admin_audit_log(resource_type, resource_id)
- idx_admin_audit_created_at ON admin_audit_log(created_at)
- idx_admin_audit_severity ON admin_audit_log(severity)
- idx_admin_audit_success ON admin_audit_log(success) WHERE success = false
- idx_admin_audit_before_gin ON admin_audit_log USING GIN(before)
- idx_admin_audit_after_gin ON admin_audit_log USING GIN(after)

CAS D'USAGE:
- Admin Pierre bannit user@example.com → enregistré avec before: {status: 'active'},
  after: {status: 'banned'}
- Recherche : "Qui a modifié les permissions de cet utilisateur le mois dernier ?"
- Dashboard admin : "Alertes critiques des 24 dernières heures"
- Audit RGPD : "Historique des suppressions de données personnelles"
- Détection anomalie : "10 actions échouées depuis la même IP en 5 minutes"

RÉTENTION:
- Conservation : 18 mois (conformité légale)
- Job de purge automatique des logs > 18 mois




TABLE: rgpd_exports

JUSTIFICATION:
Gestion et traçabilité des demandes d'export de données personnelles (Article 20
RGPD - droit à la portabilité). Permet aux utilisateurs de télécharger toutes
leurs données (profil, abonnements, documents, historique) dans un format
structuré (JSON/CSV). Le système génère des URLs signées temporaires (valides
24-72h) pour téléchargement sécurisé. Les exports sont générés en arrière-plan
via BullMQ pour éviter de bloquer l'interface. Stocke le statut (pending,
processing, completed, failed) pour feedback utilisateur. Essentiel pour
conformité RGPD et transparence.

STRUCTURE:
- id (UUID, PK)
- user_id (UUID, FK → users.id, ON DELETE CASCADE, NOT NULL)
- status (VARCHAR(20), DEFAULT: 'pending') -- CHECK: 'pending', 'processing', 'completed', 'failed', 'expired'
- format (VARCHAR(10), DEFAULT: 'json') -- CHECK: 'json', 'csv'
- file_r2_key (VARCHAR(500), NULLABLE) -- Clé R2 du fichier généré
- file_size (BIGINT, NULLABLE) -- Taille en bytes
- signed_url (TEXT, NULLABLE) -- URL signée temporaire pour téléchargement
- expires_at (TIMESTAMPTZ, NULLABLE) -- Expiration de l'URL signée (24-72h)
- error_message (TEXT, NULLABLE) -- Détails si échec de génération
- requested_by (VARCHAR(20), DEFAULT: 'user') -- CHECK: 'user', 'admin', 'automated'
- ip_address (INET, NULLABLE) -- IP de la requête
- created_at (TIMESTAMPTZ, DEFAULT: NOW())
- completed_at (TIMESTAMPTZ, NULLABLE)

CONTRAINTES:
- CONSTRAINT chk_rgpd_exports_status CHECK (
    status IN ('pending', 'processing', 'completed', 'failed', 'expired')
  )
- CONSTRAINT chk_rgpd_exports_format CHECK (
    format IN ('json', 'csv')
  )
- CONSTRAINT chk_rgpd_exports_requested_by CHECK (
    requested_by IN ('user', 'admin', 'automated')
  )

INDEX:
- idx_rgpd_exports_user_id ON rgpd_exports(user_id)
- idx_rgpd_exports_status ON rgpd_exports(status)
- idx_rgpd_exports_created_at ON rgpd_exports(created_at)
- idx_rgpd_exports_expires_at ON rgpd_exports(expires_at)
  WHERE status = 'completed'
- idx_rgpd_exports_pending ON rgpd_exports(status, created_at)
  WHERE status IN ('pending', 'processing')

CAS D'USAGE:
- User clique "Télécharger mes données" → status='pending'
- Job BullMQ traite la demande → status='processing' → génère JSON avec toutes
  les données (profil, abonnements, documents, logs)
- Fichier uploadé sur R2 → génération URL signée valide 48h → status='completed'
- User télécharge via l'URL signée
- Après 48h, URL expire → status='expired' (fichier supprimé de R2)
- Dashboard admin : "5 demandes d'export en attente"
- Conformité RGPD : historique de toutes les demandes d'export

RÉTENTION:
- Fichiers R2 : suppression automatique après expiration (24-72h)
- Historique BDD : conservation 12 mois pour audit





RELATIONS CLÉS

roles (1) ──< (N) users
  → Un rôle peut être assigné à plusieurs utilisateurs

roles (1) ─── (1) role_limits
  → Chaque rôle a ses limites définies

users (1) ──< (N) subscriptions
  → Un utilisateur peut avoir plusieurs abonnements

users (1) ──< (N) documents
  → Un utilisateur peut uploader plusieurs documents

users (1) ──< (N) user_sessions
  → Un utilisateur peut avoir plusieurs sessions actives

users (1) ─── (1) user_preferences
  → Un utilisateur a un ensemble de préférences

contracts (1) ──< (N) subscriptions
  → Une catégorie contient plusieurs abonnements

contracts (1) ──< (N) documents
  → Une catégorie contient plusieurs documents

subscriptions (1) ──< (N) documents
  → Un abonnement peut avoir plusieurs justificatifs

subscriptions (1) ─── (1) event_series
  → Un abonnement a une règle de récurrence

subscriptions (1) ──< (N) events
  → Un abonnement génère plusieurs occurrences

event_series (1) ──< (N) events
  → Une règle génère plusieurs événements

subscriptions (1) ──< (N) reminders
  → Un abonnement peut avoir plusieurs rappels

 events (1) ──< (N) notifications
  → Un événement peut générer plusieurs notifications

reminders (1) ──< (N) notifications
  → Un rappel génère des notifications

users (1) ──< (N) admin_audit_log
  → Un admin effectue plusieurs actions tracées

users (1) ──< (N) rgpd_exports
  → Un utilisateur peut demander plusieurs exports de données




RÉSUMÉ TECHNIQUE
────────────────────────────────────────────────────────────────────────────

BASE DE DONNÉES       : PostgreSQL (Neon DB)
STOCKAGE FICHIERS     : Cloudflare R2
AUTHENTIFICATION      : JWT (access + refresh tokens)
SÉCURITÉ              : bcrypt, MFA/TOTP, CSRF protection
OCR                   : Tesseract.js
NOTIFICATIONS         : Firebase Cloud Messaging + SendGrid
JOBS ASYNCHRONES      : BullMQ/Redis
RÉCURRENCE            : RRULE (RFC 5545 - standard iCalendar)


POINTS CLÉS D'ARCHITECTURE
────────────────────────────────────────────────────────────────────────────

✓ Séparation users / user_preferences pour performance
✓ Soft delete (deleted_at) pour conformité RGPD
✓ event_series + events pour gestion calendrier flexible
✓ Stockage R2 (pas en BDD) avec URLs signées temporaires
✓ Index optimisés pour requêtes fréquentes (partial indexes, GIN)
✓ Timestamps en UTC (TIMESTAMPTZ) avec timezone stocké
✓ Cascade DELETE pour intégrité référentielle
✓ JSONB pour métadonnées flexibles (logs, notifications)
✓ Full-text search sur OCR avec index GIN

