import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '@/context/I18nContext';

// ─── Types ───────────────────────────────────────────────────────────────────

interface LegalSection {
    id: string;
    titleKey: string;
    icon: string;
    content: LegalParagraph[];
}

interface LegalParagraph {
    type: 'heading' | 'text' | 'bold' | 'alert';
    text: string;
}

// ─── Legal Data (extracted from T_LAW_ESP.docx) ─────────────────────────────

const LEGAL_SECTIONS: LegalSection[] = [
    {
        id: 'aspects',
        titleKey: 'legal.sections.aspects',
        icon: '⚖️',
        content: [
            { type: 'bold', text: 'Protection des données (UE/FR)' },
            { type: 'text', text: 'RGPD (principes, bases légales, droits, sécurité, DPIA éventuelle, registres, sous-traitants, transferts hors UE) ; Loi Informatique & Libertés (not. art. 82 "traceurs").' },
            { type: 'bold', text: 'Traceurs/SDK en app & publicité' },
            { type: 'text', text: 'ePrivacy (via LIL art. 82) et lignes directrices CNIL (consentement, exemptions analytics). ATT (Apple) et CMP/UMP (Google AdMob) pour l\'EEA/UK.' },
            { type: 'bold', text: 'Prospection & notifications' },
            { type: 'text', text: 'Prospection électronique (email/SMS/automates) = opt-in (CPCE art. L34-5). À traiter par analogie pour push marketing + RGPD (base consentement).' },
            { type: 'bold', text: 'Publicité & DSA' },
            { type: 'text', text: 'Transparence publicitaire, interdiction de ciblage sur données sensibles et sur mineurs ; obligations renforcées pour plateformes.' },
            { type: 'bold', text: 'Consommation (B2C)' },
            { type: 'text', text: 'Informations précontractuelles (prix TTC, caractéristiques essentielles, conditions), droit de rétractation (digital), reconduction tacite/information & résiliation en "3 clics" en cas de souscription en ligne ; affichage des prix & annonces de réduction ; médiation de la consommation obligatoire.' },
            { type: 'bold', text: 'Cloud & transferts internationaux' },
            { type: 'text', text: 'Choix des sous-traitants (art. 28 RGPD), sécurité (art. 32), notification des violations (art. 33–34), transferts vers les USA sous DPF (adéquation 10/07/2023 confirmée par le Tribunal de l\'UE en 2025).' },
            { type: 'bold', text: 'Intégrations calendriers' },
            { type: 'text', text: 'EventKit (Apple) et Google Calendar API ⇒ permissions explicites, scopes "sensibles", vérification Google OAuth si nécessaire.' },
            { type: 'bold', text: 'Mineurs' },
            { type: 'text', text: 'Majorité numérique en France à 15 ans (art. 45 LIL) : en-dessous, consentement conjoint parent/enfant. Interdiction de publicité ciblée aux mineurs (DSA).' },
            { type: 'bold', text: 'Responsabilité contenu stocké' },
            { type: 'text', text: 'Stockage privé de documents (PDF) — régime d\'hébergeur/DSA peu sensible car non public, mais prévoir procédure de retrait si partage public était offert.' },
            { type: 'bold', text: 'Droits de PI & app stores' },
            { type: 'text', text: 'Dépôt de marque (INPI), licences SDK, politiques Apple/Google (not. ATT).' },
            { type: 'bold', text: 'Évolutif (open-banking)' },
            { type: 'text', text: 'Si demain vous importez des données bancaires via APIs PSD2, statut AISP/partenaire agréé (ACPR).' },
        ],
    },
    {
        id: 'alerts',
        titleKey: 'legal.sections.alerts',
        icon: '🚨',
        content: [
            { type: 'heading', text: 'Bases légales & info RGPD' },
            { type: 'alert', text: '⚠️ Absence de base claire (contrat vs intérêt légitime vs consentement) et mentions RGPD incomplètes.' },
            { type: 'text', text: 'Cartographier les traitements ; pour les fonctionnalités cœur (gestion budget, stockage, rappels) → art. 6(1)(b) contrat ; sécurité/anti-fraude → intérêt légitime documenté ; publicité ciblée/traceurs/push marketing → consentement. Rédiger politique de confidentialité art. 13/14, interface "just-in-time".' },

            { type: 'heading', text: 'Traceurs & pubs (SDK)' },
            { type: 'alert', text: '⚠️ Dépôt/lecture d\'identifiants publicitaires sans consentement (LIL art. 82) ; non-conformité CMP (AdMob/TCF).' },
            { type: 'text', text: 'Implémenter CMP certifiée Google (TCF v2.2) ; bloquer tous SDK pub/mesure non exemptés tant que pas d\'opt-in ; analytics "exemptés" uniquement si critères CNIL respectés (finalités limitées, durée 13 mois/25 mois). Respecter ATT (iOS) et UMP (Android).' },

            { type: 'heading', text: 'Push & marketing' },
            { type: 'alert', text: '⚠️ Push marketing sans opt-in conforme ; emails/SMS sans consentement.' },
            { type: 'text', text: 'Séparer push fonctionnels (base contrat/intérêt légitime) des push marketing (opt-in explicite) ; pour emails/SMS → respect CPCE L34-5 (opt-in B2C) ; lien de désinscription et retrait aussi simple que l\'accord.' },

            { type: 'heading', text: 'Mineurs' },
            { type: 'alert', text: '⚠️ Utilisateurs < 15 ans : absence de mécanisme de vérification parentale.' },
            { type: 'text', text: 'Age-gate à l\'inscription ; si app ouverte aux < 15 ans et que certaines opérations reposent sur le consentement non contractuel, prévoir double consentement parent/enfant ; pas de ciblage publicitaire des mineurs (DSA).' },

            { type: 'heading', text: 'DSA : transparence pub' },
            { type: 'alert', text: '⚠️ Publicités/promo non signalées ; ciblage sensible/minors.' },
            { type: 'text', text: 'Étiqueter clairement les contenus sponsorisés ("Publicité"/"Partenaire" + pourquoi l\'utilisateur la voit) ; interdire ciblage fondé sur données sensibles ou sur mineurs ; conserver un registre interne de partenariats.' },

            { type: 'heading', text: 'Abonnements & rétractation' },
            { type: 'alert', text: '⚠️ Manquements info précontractuelle/droit de rétractation pour service numérique ; reconduction tacite.' },
            { type: 'text', text: 'CGV conformes (prix TTC, caractéristiques, rétractation selon L221-18 s. / L221-28 exceptions si exécution immédiate avec accord) ; rappel avant reconduction ; mentions claires des périodes d\'engagement.' },

            { type: 'heading', text: 'Résiliation "en 3 clics"' },
            { type: 'alert', text: '⚠️ Parcours de résiliation non conforme (B2C).' },
            { type: 'text', text: 'Mettre une fonctionnalité de résiliation en ligne, identifiable, directe, permanente, confirmant la date d\'effet, conformément à L215-1-1 et au décret 2023-417 (1/06/2023).' },

            { type: 'heading', text: 'Promos/affiliation' },
            { type: 'alert', text: '⚠️ Allégations trompeuses ; non-respect règles des annonces de réduction.' },
            { type: 'text', text: 'Libellés non ambigus, conditions d\'éligibilité et dates de validité ; afficher le prix de référence lorsque requis ; transparence sur liens d\'affiliation.' },

            { type: 'heading', text: 'Cloud & transferts' },
            { type: 'alert', text: '⚠️ Sous-traitants hors UE ; transferts USA non fondés ; sécurité insuffisante.' },
            { type: 'text', text: 'Choisir hébergement UE/EEE quand possible ; pour USA, ne transférer qu\'à des entités certifiées DPF ou encadrer par SCC ; chiffrement au repos/en transit ; contrôle d\'accès ; plan de gestion des violations (art. 33/34).' },

            { type: 'heading', text: 'Sous-traitants' },
            { type: 'alert', text: '⚠️ Absence de DPA (art. 28) et de registre (art. 30).' },
            { type: 'text', text: 'DPA complet (objet, durée, sécurité, sous-traitance ultérieure, assistance droits) ; tenue d\'un registre de traitements.' },

            { type: 'heading', text: 'Intégrations calendriers' },
            { type: 'alert', text: '⚠️ Accès excessif aux données calendrier ; non-respect des politiques Apple/Google.' },
            { type: 'text', text: 'Utiliser EventKit avec write-only si possible ; expliciter les permissions iOS ; côté Google Calendar, n\'utiliser que les scopes minimaux et prévoir vérification OAuth pour scopes sensibles.' },

            { type: 'heading', text: 'Hébergement / responsabilité contenu' },
            { type: 'alert', text: '⚠️ Si partage de documents au public : responsabilité en cas de contenu illicite.' },
            { type: 'text', text: 'Prévoir procédure de notification & retrait ; aujourd\'hui, pas de diffusion publique = risque faible, mais anticiper si un jour partage public/URL.' },

            { type: 'heading', text: 'Médiation de la consommation' },
            { type: 'alert', text: '⚠️ Oubli de désigner un médiateur et d\'informer les consommateurs.' },
            { type: 'text', text: 'Désigner un médiateur référencé CECMC et mentionner ses coordonnées dans CGV/site/app (obligatoire depuis 2016).' },

            { type: 'heading', text: 'Évolutif PSD2 (banking)' },
            { type: 'alert', text: '⚠️ Ajout futur d\'agrégation bancaire sans statut.' },
            { type: 'text', text: 'Passer par un AISP agréé (ou obtenir l\'agrément) ; contrat + DPIA spécifique.' },
        ],
    },
    {
        id: 'actions',
        titleKey: 'legal.sections.actions',
        icon: '📋',
        content: [
            { type: 'heading', text: 'Gouvernance RGPD' },
            { type: 'text', text: 'Registre art. 30, PIA screening ; nomination DPO si cœur d\'activité implique un suivi régulier à grande échelle (à réévaluer en croissance).' },
            { type: 'text', text: 'Politique de confidentialité UX (multi-niveaux) + tableau bases légales/finalités + durées de conservation (ex. : compte actif = durée du contrat ; pièces justificatives = durée du compte + 5 ans max à des fins probatoires ; mesures d\'audience exemptées : 13 mois/25 mois selon CNIL).' },
            { type: 'bold', text: 'Procédure d\'exercice des droits (accès, effacement, portabilité CSV/JSON pour opérations/abonnements).' },

            { type: 'heading', text: 'Traceurs/ads' },
            { type: 'bold', text: 'CMP certifiée Google (TCF v2.2), blocage par défaut ; ATT iOS avant toute collecte IDFA ; UMP Android ; journaliser les preuves de consentement.' },
            { type: 'text', text: 'Segmenter "analytics exemptés" vs "publicitaires" ; documenter la configuration pour l\'exemption.' },

            { type: 'heading', text: 'Prospection & notifications' },
            { type: 'text', text: 'Cases d\'opt-in distinctes : (i) emails/SMS, (ii) push marketing ; désinscription simple ; ne pas conditionner l\'accès au service au consentement marketing.' },

            { type: 'heading', text: 'Consommation' },
            { type: 'text', text: 'CGV claires (prix TTC 3 €/mois, reconduction, rétractation, conditions promos).' },
            { type: 'bold', text: 'Résiliation "en 3 clics" dans l\'app (entrée directe depuis l\'écran Compte → Résilier), confirmation de réception + date d\'effet sur support durable (email).' },
            { type: 'bold', text: 'Médiateur de la consommation : adhérer et afficher (site/app/CGV).' },

            { type: 'heading', text: 'Sécurité & cloud' },
            { type: 'text', text: 'Chiffrement TLS/at-rest ; gestion clés ; journalisation et MFA ; audits sécurité ; cloisonnement locataire ; tests d\'intrusion ; politique de sauvegarde.' },
            { type: 'text', text: 'DPA art. 28 avec chaque prestataire (hébergeur, envoi email, push, analytics, AdTech).' },
            { type: 'bold', text: 'Transferts : privilégier UE/EEE ; pour USA → DPF ou SCC + TIAs ; référencer dans registre.' },
            { type: 'bold', text: 'Breach : runbook + notification CNIL < 72 h & personnes si risque élevé.' },

            { type: 'heading', text: 'Calendriers (Apple/Google)' },
            { type: 'bold', text: 'iOS : n\'utiliser write-only si suffisant ; messages Info.plist explicites ; ne pas lire l\'ensemble du calendrier par défaut.' },
            { type: 'bold', text: 'Google Calendar : limiter scopes ; prévoir vérification OAuth si scope sensible ; politique "User Data" respectée.' },

            { type: 'heading', text: 'Mineurs' },
            { type: 'text', text: 'Age-gate + mécanisme de consentement parental si l\'app vise les < 15 ans ; interdiction de ciblage pub mineurs (et pas de "profilage marketing" pour mineurs).' },

            { type: 'heading', text: 'Juridique & PI' },
            { type: 'bold', text: 'Dépôt de marque auprès INPI ; inventaire des licences SDK ; CGU/CGV/Politique confidentialité ; mentions légales ; charte promos/affiliations.' },
        ],
    },
    {
        id: 'sources',
        titleKey: 'legal.sections.sources',
        icon: '📚',
        content: [
            { type: 'heading', text: 'Données personnelles / traceurs' },
            { type: 'bold', text: 'Règlement (UE) 2016/679 (RGPD), chap. II–IV (art. 6, 13, 20, 25, 28, 30, 32–34). Eur-Lex & CNIL.' },
            { type: 'bold', text: 'CNIL – Lignes directrices & pages cookies/traceurs (exemptions analytics ; 13 mois / 25 mois). 04/07/2025 & 29/09/2020.' },
            { type: 'bold', text: 'Loi Informatique & Libertés, art. 82 (traceurs). CNIL/Legifrance.' },

            { type: 'heading', text: 'Prospection & push' },
            { type: 'bold', text: 'CPCE art. L34-5 (opt-in B2C). CNIL/Legifrance. 04/02/2022.' },

            { type: 'heading', text: 'DSA / Publicité' },
            { type: 'bold', text: 'Règlement (UE) 2022/2065 (DSA) – interdiction ciblage mineurs & données sensibles ; transparence publicitaire. Commission/eur-lex.' },

            { type: 'heading', text: 'Consommation' },
            { type: 'bold', text: 'Code de la consommation (précontractuel, rétractation digital, reconduction) ; art. L215-1-1 et Décret n° 2023-417 (résiliation en ligne). Legifrance/Min. Économie.' },
            { type: 'bold', text: 'Médiation de la consommation — art. L612-1 ; fiches pratiques (économie.gouv).' },

            { type: 'heading', text: 'Transferts internationaux' },
            { type: 'bold', text: 'Décision d\'adéquation DPF (10/07/2023) + validation par le Tribunal de l\'UE (03/09/2025). CNIL/Eur-Lex.' },

            { type: 'heading', text: 'Intégrations calendriers / app stores / AdTech' },
            { type: 'bold', text: 'Apple EventKit & ATT (docs développeur). 2023–2025.' },
            { type: 'bold', text: 'Google Calendar API & Sensitive scopes (OAuth verification) ; Google AdMob UMP & TCF v2.2 (docs). 2024–2025.' },

            { type: 'heading', text: 'Mineurs' },
            { type: 'bold', text: 'LIL art. 45 (majorité numérique 15 ans) ; CNIL recommandations. 2021–2025.' },

            { type: 'heading', text: 'Hébergeur / responsabilité' },
            { type: 'bold', text: 'LCEN / DSA – responsabilité et procédures de retrait (si diffusion publique). Legifrance.' },

            { type: 'text', text: 'Note de mise en page : pour un rendu académique (inspiré ISO 690), citez ainsi : Auteur/Institution, Titre, Éditeur/URL, date (dernière mise à jour), consulté le 13 novembre 2025. Pour les textes officiels : Intitulé exact, source (Eur-Lex/Legifrance), référence (numéro, date), consulté le 13 novembre 2025.' },
        ],
    },
    {
        id: 'conclusion',
        titleKey: 'legal.sections.conclusion',
        icon: '🎯',
        content: [
            { type: 'bold', text: '1. Mettre en place la CMP (TCF v2.2) + ATT/UMP et bloquer tout tracking non exempté avant consentement.' },
            { type: 'bold', text: '2. Publier CGU/CGV/Politique de confidentialité (bases légales par finalité, durées, transferts, droits) ; activer portabilité (CSV/JSON).' },
            { type: 'bold', text: '3. Parcours "Résiliation en 3 clics" dans l\'app + médiateur consommation désigné et affiché.' },
            { type: 'bold', text: '4. DPA avec tous prestataires + registre art. 30 ; plan de sécurité et runbook data breach (72 h CNIL).' },
            { type: 'bold', text: '5. Permissions "calendrier" minimales (write-only si possible) ; vérification OAuth si scopes sensibles Google.' },
            { type: 'bold', text: '6. Mineurs : age-gate + interdiction de ciblage ; si utilisateurs < 15 ans visés, mécanisme de consentement parental.' },
            { type: 'bold', text: '7. Promos/affiliation : libellés "Publicité/Partenaire", conditions claires, conformité "annonces de réduction".' },
        ],
    },
];

// ─── Collapsible Section Component ──────────────────────────────────────────

function CollapsibleSection({ section }: { section: LegalSection }) {
    const { t } = useTranslation();
    const [expanded, setExpanded] = useState(false);

    return (
        <View style={styles.sectionContainer}>
            <TouchableOpacity
                style={styles.sectionHeader}
                onPress={() => setExpanded(!expanded)}
                activeOpacity={0.7}
                testID={`section-${section.id}`}
            >
                <View style={styles.sectionTitleRow}>
                    <Text style={styles.sectionIcon}>{section.icon}</Text>
                    <Text style={styles.sectionTitle} numberOfLines={2}>
                        {t(section.titleKey)}
                    </Text>
                </View>
                <Text style={styles.chevron}>{expanded ? '▲' : '▼'}</Text>
            </TouchableOpacity>

            {expanded && (
                <View style={styles.sectionContent}>
                    {section.content.map((paragraph, index) => {
                        switch (paragraph.type) {
                            case 'heading':
                                return (
                                    <Text key={index} style={styles.contentHeading}>
                                        {paragraph.text}
                                    </Text>
                                );
                            case 'bold':
                                return (
                                    <Text key={index} style={styles.contentBold}>
                                        {paragraph.text}
                                    </Text>
                                );
                            case 'alert':
                                return (
                                    <View key={index} style={styles.alertBox}>
                                        <Text style={styles.alertText}>{paragraph.text}</Text>
                                    </View>
                                );
                            case 'text':
                            default:
                                return (
                                    <Text key={index} style={styles.contentText}>
                                        {paragraph.text}
                                    </Text>
                                );
                        }
                    })}
                </View>
            )}
        </View>
    );
}

// ─── Main Screen ────────────────────────────────────────────────────────────

export default function LegalScreen() {
    const { t } = useTranslation();
    return (
        <View style={styles.container}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>{t('legal.headerTitle')}</Text>
                    <Text style={styles.headerSubtitle}>
                        {t('legal.headerSubtitle')}
                    </Text>
                    <View style={styles.headerBadge}>
                        <Text style={styles.headerBadgeText}>
                            {t('legal.lastUpdate')}
                        </Text>
                    </View>
                </View>

                {/* Introduction */}
                <View style={styles.introCard}>
                    <Text style={styles.introText}>
                        {t('legal.intro')}
                    </Text>
                </View>

                {/* Sections */}
                {LEGAL_SECTIONS.map((section) => (
                    <CollapsibleSection key={section.id} section={section} />
                ))}
            </ScrollView>
        </View>
    );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1a1a3e',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 40,
    },

    // Header
    header: {
        padding: 20,
        paddingTop: 16,
        backgroundColor: '#1a1a3e',
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 8,
    },
    headerSubtitle: {
        fontSize: 16,
        color: '#c7c7e0',
        marginBottom: 12,
    },
    headerBadge: {
        alignSelf: 'flex-start',
        backgroundColor: 'rgba(99, 102, 241, 0.2)',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 4,
    },
    headerBadgeText: {
        fontSize: 12,
        color: '#a5b4fc',
        fontWeight: '600',
    },

    // Introduction card
    introCard: {
        marginHorizontal: 16,
        marginBottom: 16,
        padding: 16,
        backgroundColor: 'rgba(99, 102, 241, 0.08)',
        borderRadius: 12,
        borderLeftWidth: 3,
        borderLeftColor: '#6366f1',
    },
    introText: {
        fontSize: 14,
        color: '#c7c7e0',
        lineHeight: 22,
    },

    // Section
    sectionContainer: {
        marginHorizontal: 16,
        marginBottom: 12,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        overflow: 'hidden',
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
    },
    sectionTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginRight: 12,
    },
    sectionIcon: {
        fontSize: 20,
        marginRight: 12,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
        flex: 1,
    },
    chevron: {
        fontSize: 12,
        color: '#6366f1',
    },

    // Section content
    sectionContent: {
        paddingHorizontal: 16,
        paddingBottom: 16,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.06)',
    },
    contentHeading: {
        fontSize: 15,
        fontWeight: '700',
        color: '#a5b4fc',
        marginTop: 16,
        marginBottom: 8,
    },
    contentBold: {
        fontSize: 14,
        fontWeight: '600',
        color: '#e0e0f0',
        lineHeight: 22,
        marginBottom: 8,
    },
    contentText: {
        fontSize: 14,
        color: '#b0b0d0',
        lineHeight: 22,
        marginBottom: 8,
    },

    // Alert box
    alertBox: {
        backgroundColor: 'rgba(251, 191, 36, 0.1)',
        borderLeftWidth: 3,
        borderLeftColor: '#fbbf24',
        borderRadius: 8,
        padding: 12,
        marginVertical: 8,
    },
    alertText: {
        fontSize: 13,
        color: '#fde68a',
        lineHeight: 20,
    },

    // Footer
    footer: {
        marginTop: 24,
        paddingHorizontal: 16,
        alignItems: 'center',
    },
    footerText: {
        fontSize: 12,
        color: '#6b7280',
        textAlign: 'center',
        marginBottom: 4,
    },
});
