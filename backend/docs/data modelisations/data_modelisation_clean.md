# REMINDY - MODÉLISATION BASE DE DONNÉES

---

## PRÉREQUIS

```sql
CREATE EXTENSION IF NOT EXISTS citext;
```

---

## 1. Utilisateurs & Authentification

### TABLE: roles

**STRUCTURE:**
- key (TEXT, PK)
- label (VARCHAR(100), NOT NULL)
- description (TEXT, NULLABLE)
- created_at (TIMESTAMPTZ, DEFAULT: NOW())

**INDEX:**
- PRIMARY KEY sur key

**DONNÉES INITIALES:**
```sql
INSERT INTO roles (key, label, description) VALUES
('user_freemium', 'Utilisateur Freemium', 'Accès gratuit limité: 5 abonnements, 10 documents, pas d''OCR ni export'),
('user_premium', 'Utilisateur Premium', 'Accès complet: abonnements illimités, OCR, export données, 50MB par document'),
('user_admin', 'Administrateur', 'Gestion des utilisateurs, modération, accès panel admin'),
('super_admin', 'Super Administrateur', 'Accès complet système, gestion rôles, configuration globale');
```

---

### TABLE: users

**STRUCTURE:**
- id (UUID, PK)
- email (CITEXT, UNIQUE, NOT NULL)
- password_hash (VARCHAR(255), NULLABLE)
- first_name (VARCHAR(100))
- last_name (VARCHAR(100))
- phone (VARCHAR(20), NULLABLE)
- photo_r2_key (VARCHAR(500), NULLABLE)
- role (TEXT, NOT NULL, FK → roles.key)
- status (ENUM: 'active', 'verified', 'banned', 'inactive')
- timezone (VARCHAR(50), DEFAULT: 'Europe/Paris')
- language (VARCHAR(10), DEFAULT: 'fr')
- email_verified (BOOLEAN, DEFAULT: false)
- mfa_enabled (BOOLEAN, DEFAULT: false)
- mfa_secret (VARCHAR(255), NULLABLE)
- last_login_at (TIMESTAMPTZ, NULLABLE)
- failed_login_count (INTEGER, DEFAULT: 0)
- password_changed_at (TIMESTAMPTZ, NULLABLE)
- created_at (TIMESTAMPTZ, DEFAULT: NOW())
- updated_at (TIMESTAMPTZ, DEFAULT: NOW())
- deleted_at (TIMESTAMPTZ, NULLABLE)

**CONTRAINTES:**
- CONSTRAINT fk_users_role FOREIGN KEY (role) REFERENCES roles(key)

**INDEX:**
- UNIQUE idx_users_email ON users(email)
- idx_users_role ON users(role)
- idx_users_status ON users(status)
- idx_users_deleted_at ON users(deleted_at) WHERE deleted_at IS NULL
- idx_users_last_login ON users(last_login_at)
- idx_users_failed_login ON users(failed_login_count) WHERE failed_login_count > 0

---

### TABLE: user_sessions

**STRUCTURE:**
- id (UUID, PK)
- user_id (UUID, FK → users.id, ON DELETE CASCADE, NOT NULL)
- refresh_token_hash (VARCHAR(255), UNIQUE, NOT NULL)
- device_name (VARCHAR(100), NULLABLE)
- ip_address (INET, NOT NULL)
- user_agent (TEXT, NULLABLE)
- last_activity (TIMESTAMPTZ, DEFAULT: NOW())
- expires_at (TIMESTAMPTZ, NOT NULL)
- is_revoked (BOOLEAN, DEFAULT: false)
- created_at (TIMESTAMPTZ, DEFAULT: NOW())
- deleted_at (TIMESTAMPTZ, NULLABLE)

**INDEX:**
- idx_user_sessions_user_id ON user_sessions(user_id)
- UNIQUE idx_user_sessions_refresh_token_hash ON user_sessions(refresh_token_hash)
- idx_user_sessions_expires_at ON user_sessions(expires_at)
- idx_user_sessions_is_revoked ON user_sessions(is_revoked) WHERE is_revoked = false
- UNIQUE idx_user_sessions_active_device ON user_sessions(user_id, device_name)
  WHERE is_revoked = false AND expires_at > NOW() AND deleted_at IS NULL
- idx_user_sessions_deleted_at ON user_sessions(deleted_at) WHERE deleted_at IS NULL

---

### TABLE: user_preferences

**STRUCTURE:**
- user_id (UUID, PK, FK → users.id, ON DELETE CASCADE)
- theme (ENUM: 'light', 'dark', 'auto', DEFAULT: 'light')
- notification_email (BOOLEAN, DEFAULT: true)
- notification_push (BOOLEAN, DEFAULT: true)
- notification_sms (BOOLEAN, DEFAULT: false)
- default_reminder_delay (INTEGER, DEFAULT: 3)
- currency (VARCHAR(3), DEFAULT: 'EUR')
- show_online_status (BOOLEAN, DEFAULT: true)
- created_at (TIMESTAMPTZ, DEFAULT: NOW())
- updated_at (TIMESTAMPTZ, DEFAULT: NOW())
- deleted_at (TIMESTAMPTZ, NULLABLE)

**CONTRAINTES:**
- CONSTRAINT chk_preferences_reminder_delay CHECK (default_reminder_delay BETWEEN 1 AND 365)

---

### TABLE: role_limits

**STRUCTURE:**
- role (TEXT, PK, FK → roles.key)
- max_subscriptions (INTEGER, NULLABLE)
- max_documents (INTEGER, NULLABLE)
- max_document_size_mb (INTEGER, NULLABLE)
- max_reminders_per_subscription (INTEGER, NULLABLE)
- can_export_data (BOOLEAN, DEFAULT: true)
- can_use_ocr (BOOLEAN, DEFAULT: true)
- created_at (TIMESTAMPTZ, DEFAULT: NOW())
- updated_at (TIMESTAMPTZ, DEFAULT: NOW())

**CONTRAINTES:**
- CONSTRAINT fk_role_limits_role FOREIGN KEY (role) REFERENCES roles(key) ON DELETE CASCADE
- CONSTRAINT chk_role_limits_positive CHECK (
    (max_subscriptions IS NULL OR max_subscriptions > 0) AND
    (max_documents IS NULL OR max_documents > 0) AND
    (max_document_size_mb IS NULL OR max_document_size_mb > 0) AND
    (max_reminders_per_subscription IS NULL OR max_reminders_per_subscription > 0)
  )

**DONNÉES INITIALES:**
```sql
INSERT INTO role_limits (role, max_subscriptions, max_documents, max_document_size_mb, max_reminders_per_subscription, can_export_data, can_use_ocr) VALUES
('user_freemium', 5, 10, 5, 2, false, false),
('user_premium', NULL, NULL, 50, NULL, true, true),
('user_admin', NULL, NULL, NULL, NULL, true, true),
('super_admin', NULL, NULL, NULL, NULL, true, true);
```

---

## 2. Documents & Cloud

### TABLE: contracts

**STRUCTURE:**
- id (SERIAL, PK)
- type (VARCHAR(50), UNIQUE, NOT NULL)
- label (VARCHAR(100), NOT NULL)
- icon (VARCHAR(50), NULLABLE)
- color (VARCHAR(7), NULLABLE)
- description (TEXT, NULLABLE)
- created_at (TIMESTAMPTZ, DEFAULT: NOW())
- updated_at (TIMESTAMPTZ, DEFAULT: NOW())

**INDEX:**
- UNIQUE idx_contracts_type ON contracts(type)

**DONNÉES INITIALES:**
```sql
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
```

---

### TABLE: documents

**STRUCTURE:**
- id (UUID, PK)
- user_id (UUID, FK → users.id, ON DELETE CASCADE, NOT NULL)
- subscription_id (UUID, FK → subscriptions.id, ON DELETE SET NULL, NULLABLE)
- contract_id (INTEGER, FK → contracts.id, ON DELETE SET NULL, NULLABLE)
- filename (VARCHAR(255), NOT NULL)
- r2_key (VARCHAR(500), UNIQUE, NOT NULL)
- r2_bucket (VARCHAR(100), DEFAULT: 'remindy-documents')
- file_hash (VARCHAR(64), NOT NULL)
- file_size (BIGINT, NOT NULL)
- mime_type (VARCHAR(100), NOT NULL)
- ocr_text (TEXT, NULLABLE)
- ocr_status (ENUM: 'pending', 'processing', 'completed', 'failed')
- ocr_error (TEXT, NULLABLE)
- uploaded_at (TIMESTAMPTZ, DEFAULT: NOW())
- updated_at (TIMESTAMPTZ, DEFAULT: NOW())
- deleted_at (TIMESTAMPTZ, NULLABLE)

**CONTRAINTES:**
- CONSTRAINT chk_documents_file_size CHECK (file_size > 0 AND file_size <= 52428800)

**INDEX:**
- idx_documents_user_id ON documents(user_id)
- idx_documents_subscription_id ON documents(subscription_id)
- idx_documents_contract_id ON documents(contract_id)
- UNIQUE idx_documents_r2_key ON documents(r2_key)
- idx_documents_ocr_status ON documents(ocr_status)
- idx_documents_uploaded_at ON documents(uploaded_at)
- idx_documents_ocr_text_gin ON documents USING GIN(to_tsvector('french', ocr_text))
- idx_documents_deleted_at ON documents(deleted_at) WHERE deleted_at IS NULL

---

## 3. Abonnements

### TABLE: subscriptions

**STRUCTURE:**
- id (UUID, PK)
- user_id (UUID, FK → users.id, ON DELETE CASCADE, NOT NULL)
- contract_id (INTEGER, FK → contracts.id, ON DELETE SET NULL, NULLABLE)
- name (VARCHAR(255), NOT NULL)
- amount (NUMERIC(19,4), NOT NULL)
- currency (VARCHAR(3), DEFAULT: 'EUR')
- frequency (VARCHAR(20), NOT NULL)
- start_date (DATE, NOT NULL)
- next_due_date (DATE, NOT NULL)
- trial_start_date (DATE, NULLABLE)
- trial_end_date (DATE, NULLABLE)
- is_trial_active (BOOLEAN GENERATED ALWAYS AS
                   (trial_end_date IS NOT NULL AND
                    trial_end_date >= CURRENT_DATE) STORED)
- status (VARCHAR(20), DEFAULT: 'active')
- color (VARCHAR(7), NULLABLE)
- notes (TEXT, NULLABLE)
- created_at (TIMESTAMPTZ, DEFAULT: NOW())
- updated_at (TIMESTAMPTZ, DEFAULT: NOW())
- deleted_at (TIMESTAMPTZ, NULLABLE)

**CONTRAINTES:**
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

**INDEX:**
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

---

### TABLE: event_series

**STRUCTURE:**
- id (UUID, PK)
- subscription_id (UUID, FK → subscriptions.id, ON DELETE CASCADE, UNIQUE, NOT NULL)
- rrule (TEXT, NOT NULL)
- dtstart (TIMESTAMPTZ, NOT NULL)
- timezone (VARCHAR(50), NOT NULL, DEFAULT: 'Europe/Paris')
- exdates (TIMESTAMPTZ[], NULLABLE)
- rdates (TIMESTAMPTZ[], NULLABLE)
- created_at (TIMESTAMPTZ, DEFAULT: NOW())
- updated_at (TIMESTAMPTZ, DEFAULT: NOW())
- deleted_at (TIMESTAMPTZ, NULLABLE)

**INDEX:**
- UNIQUE idx_event_series_subscription_id ON event_series(subscription_id)
- idx_event_series_dtstart ON event_series(dtstart)
- idx_event_series_exdates_gin ON event_series USING GIN(exdates)
- idx_event_series_rdates_gin ON event_series USING GIN(rdates)
- idx_event_series_deleted_at ON event_series(deleted_at) WHERE deleted_at IS NULL

---

### TABLE: events

**STRUCTURE:**
- id (UUID, PK)
- subscription_id (UUID, FK → subscriptions.id, ON DELETE CASCADE, NOT NULL)
- event_series_id (UUID, FK → event_series.id, ON DELETE SET NULL, NULLABLE)
- title (VARCHAR(255), NOT NULL)
- amount (NUMERIC(19,4), NOT NULL)
- starts_at (TIMESTAMPTZ, NOT NULL)
- ends_at (TIMESTAMPTZ, NULLABLE)
- status (VARCHAR(20), DEFAULT: 'scheduled')
- payment_status (VARCHAR(20), NULLABLE)
- notes (TEXT, NULLABLE)
- created_at (TIMESTAMPTZ, DEFAULT: NOW())
- updated_at (TIMESTAMPTZ, DEFAULT: NOW())
- deleted_at (TIMESTAMPTZ, NULLABLE)

**CONTRAINTES:**
- CONSTRAINT chk_events_amount_positive CHECK (amount > 0)
- CONSTRAINT chk_events_dates CHECK (ends_at IS NULL OR ends_at >= starts_at)
- CONSTRAINT chk_events_status CHECK (
    status IN ('scheduled', 'completed', 'canceled', 'failed')
  )
- CONSTRAINT chk_events_payment_status CHECK (
    payment_status IS NULL OR
    payment_status IN ('pending', 'paid', 'failed')
  )

**INDEX:**
- idx_events_subscription_id ON events(subscription_id)
- idx_events_event_series_id ON events(event_series_id)
- idx_events_starts_at ON events(starts_at)
- idx_events_status ON events(status)
- idx_events_payment_status ON events(payment_status)
- idx_events_user_date ON events(subscription_id, starts_at)
- idx_events_scheduled_date ON events(status, starts_at)
  WHERE status = 'scheduled'
- idx_events_overdue ON events(status, starts_at, payment_status)
  WHERE status = 'scheduled'
- UNIQUE uq_event_unique ON events(subscription_id, starts_at)
  WHERE status <> 'canceled' AND deleted_at IS NULL
- idx_events_deleted_at ON events(deleted_at) WHERE deleted_at IS NULL

---

## 4. Notifications & Alertes

### TABLE: reminders

**STRUCTURE:**
- id (UUID, PK)
- subscription_id (UUID, FK → subscriptions.id, ON DELETE CASCADE, NOT NULL)
- user_id (UUID, FK → users.id, ON DELETE CASCADE, NOT NULL)
- delay_days (INTEGER, NOT NULL)
- channels (TEXT[], NOT NULL)
- color (VARCHAR(7), NULLABLE)
- enabled (BOOLEAN, DEFAULT: true)
- created_at (TIMESTAMPTZ, DEFAULT: NOW())
- updated_at (TIMESTAMPTZ, DEFAULT: NOW())
- deleted_at (TIMESTAMPTZ, NULLABLE)

**CONTRAINTES:**
- CONSTRAINT chk_reminders_delay_range CHECK (delay_days BETWEEN 1 AND 365)

**INDEX:**
- idx_reminders_subscription_id ON reminders(subscription_id)
- idx_reminders_user_id ON reminders(user_id)
- idx_reminders_enabled ON reminders(enabled) WHERE enabled = true
- idx_reminders_deleted_at ON reminders(deleted_at) WHERE deleted_at IS NULL

---

### TABLE: notifications

**STRUCTURE:**
- id (UUID, PK)
- user_id (UUID, FK → users.id, ON DELETE CASCADE, NOT NULL)
- event_id (UUID, FK → events.id, ON DELETE SET NULL, NULLABLE)
- reminder_id (UUID, FK → reminders.id, ON DELETE SET NULL, NULLABLE)
- type (ENUM: 'reminder', 'payment_overdue', 'trial_ending',
      'subscription_renewed', 'document_processed')
- channel (ENUM: 'email', 'push', 'sms')
- title (VARCHAR(255), NOT NULL)
- body (TEXT, NOT NULL)
- sent_at (TIMESTAMPTZ, NULLABLE)
- read_at (TIMESTAMPTZ, NULLABLE)
- status (ENUM: 'pending', 'sent', 'failed', 'snoozed', DEFAULT: 'pending')
- snoozed_until (TIMESTAMPTZ, NULLABLE)
- error_message (TEXT, NULLABLE)
- metadata (JSONB, NULLABLE)
- created_at (TIMESTAMPTZ, DEFAULT: NOW())
- deleted_at (TIMESTAMPTZ, NULLABLE)

**CONTRAINTES:**
- CONSTRAINT chk_notifications_snooze CHECK (
    status <> 'snoozed' OR
    (status = 'snoozed' AND snoozed_until IS NOT NULL AND snoozed_until > NOW())
  )

**INDEX:**
- idx_notifications_user_id ON notifications(user_id)
- idx_notifications_event_id ON notifications(event_id)
- idx_notifications_status ON notifications(status)
- idx_notifications_sent_at ON notifications(sent_at)
- idx_notifications_snoozed_until ON notifications(snoozed_until)
  WHERE status = 'snoozed'
- idx_notifications_type_channel ON notifications(type, channel)
- idx_notifications_pending ON notifications(status, created_at) WHERE status IN ('pending', 'snoozed')
- idx_notifications_deleted_at ON notifications(deleted_at) WHERE deleted_at IS NULL

---

## 5. Administration & Audit

### TABLE: admin_audit_log

**STRUCTURE:**
- id (UUID, PK)
- actor_user_id (UUID, FK → users.id, ON DELETE SET NULL, NULLABLE)
- action (VARCHAR(100), NOT NULL)
- resource_type (VARCHAR(50), NOT NULL)
- resource_id (VARCHAR(255), NOT NULL)
- before (JSONB, NULLABLE)
- after (JSONB, NULLABLE)
- ip_address (INET, NOT NULL)
- user_agent (TEXT, NULLABLE)
- severity (VARCHAR(20), DEFAULT: 'info')
- success (BOOLEAN, DEFAULT: true)
- error_message (TEXT, NULLABLE)
- created_at (TIMESTAMPTZ, DEFAULT: NOW())

**CONTRAINTES:**
- CONSTRAINT chk_admin_audit_severity CHECK (
    severity IN ('info', 'warning', 'critical')
  )

**INDEX:**
- idx_admin_audit_actor_user_id ON admin_audit_log(actor_user_id)
- idx_admin_audit_action ON admin_audit_log(action)
- idx_admin_audit_resource ON admin_audit_log(resource_type, resource_id)
- idx_admin_audit_created_at ON admin_audit_log(created_at)
- idx_admin_audit_severity ON admin_audit_log(severity)
- idx_admin_audit_success ON admin_audit_log(success) WHERE success = false
- idx_admin_audit_before_gin ON admin_audit_log USING GIN(before)
- idx_admin_audit_after_gin ON admin_audit_log USING GIN(after)

---

### TABLE: rgpd_exports

**STRUCTURE:**
- id (UUID, PK)
- user_id (UUID, FK → users.id, ON DELETE CASCADE, NOT NULL)
- status (VARCHAR(20), DEFAULT: 'pending')
- format (VARCHAR(10), DEFAULT: 'json')
- file_r2_key (VARCHAR(500), NULLABLE)
- file_size (BIGINT, NULLABLE)
- signed_url (TEXT, NULLABLE)
- expires_at (TIMESTAMPTZ, NULLABLE)
- error_message (TEXT, NULLABLE)
- requested_by (VARCHAR(20), DEFAULT: 'user')
- ip_address (INET, NULLABLE)
- created_at (TIMESTAMPTZ, DEFAULT: NOW())
- completed_at (TIMESTAMPTZ, NULLABLE)

**CONTRAINTES:**
- CONSTRAINT chk_rgpd_exports_status CHECK (
    status IN ('pending', 'processing', 'completed', 'failed', 'expired')
  )
- CONSTRAINT chk_rgpd_exports_format CHECK (
    format IN ('json', 'csv')
  )
- CONSTRAINT chk_rgpd_exports_requested_by CHECK (
    requested_by IN ('user', 'admin', 'automated')
  )

**INDEX:**
- idx_rgpd_exports_user_id ON rgpd_exports(user_id)
- idx_rgpd_exports_status ON rgpd_exports(status)
- idx_rgpd_exports_created_at ON rgpd_exports(created_at)
- idx_rgpd_exports_expires_at ON rgpd_exports(expires_at)
  WHERE status = 'completed'
- idx_rgpd_exports_pending ON rgpd_exports(status, created_at)
  WHERE status IN ('pending', 'processing')

---

## TRIGGERS

### Soft Delete Cascade

```sql
CREATE OR REPLACE FUNCTION soft_delete_subscription_cascade()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
        UPDATE event_series SET deleted_at = NEW.deleted_at
            WHERE subscription_id = NEW.id AND deleted_at IS NULL;
        UPDATE events SET deleted_at = NEW.deleted_at
            WHERE subscription_id = NEW.id AND deleted_at IS NULL;
        UPDATE reminders SET deleted_at = NEW.deleted_at
            WHERE subscription_id = NEW.id AND deleted_at IS NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_soft_delete_subscription
AFTER UPDATE ON subscriptions
FOR EACH ROW
EXECUTE FUNCTION soft_delete_subscription_cascade();
```

---

## RELATIONS CLÉS

```
roles (1) ──< (N) users
roles (1) ─── (1) role_limits
users (1) ──< (N) subscriptions
users (1) ──< (N) documents
users (1) ──< (N) user_sessions
users (1) ─── (1) user_preferences
users (1) ──< (N) admin_audit_log
users (1) ──< (N) rgpd_exports
contracts (1) ──< (N) subscriptions
contracts (1) ──< (N) documents
subscriptions (1) ──< (N) documents
subscriptions (1) ─── (1) event_series
subscriptions (1) ──< (N) events
subscriptions (1) ──< (N) reminders
event_series (1) ──< (N) events
events (1) ──< (N) notifications
reminders (1) ──< (N) notifications
```

---

## RÉSUMÉ TECHNIQUE

**BASE DE DONNÉES:** PostgreSQL (Neon DB)
**STOCKAGE FICHIERS:** Cloudflare R2
**AUTHENTIFICATION:** JWT (access + refresh tokens)
**SÉCURITÉ:** bcrypt, MFA/TOTP, CSRF protection
**OCR:** Tesseract.js
**NOTIFICATIONS:** Firebase Cloud Messaging + SendGrid
**JOBS ASYNCHRONES:** BullMQ/Redis
**RÉCURRENCE:** RRULE (RFC 5545 - standard iCalendar)

---

## POINTS CLÉS D'ARCHITECTURE

✓ Séparation users / user_preferences pour performance
✓ Soft delete (deleted_at) pour conformité RGPD
✓ event_series + events pour gestion calendrier flexible
✓ Stockage R2 (pas en BDD) avec URLs signées temporaires
✓ Index optimisés pour requêtes fréquentes (partial indexes, GIN)
✓ Timestamps en UTC (TIMESTAMPTZ) avec timezone stocké
✓ Cascade DELETE pour intégrité référentielle
✓ JSONB pour métadonnées flexibles (logs, notifications)
✓ Full-text search sur OCR avec index GIN
