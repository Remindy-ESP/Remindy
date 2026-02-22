export type CoachMarkStep = {
  id: string;
  routeHref: string;
  routePathname: string;
  targetKey: string;
  title: string;
  message: string;
};

export const COACH_MARK_TARGETS = {
  dashboardCalendar: 'dashboard-calendar',
  subscriptionAddButton: 'subscription-add-button',
  cloudUploadButton: 'cloud-upload-button',
  promotionFirstRow: 'promotion-first-row',
  profileSecurityChangePassword: 'profile-security-change-password',
} as const;

export const DEFAULT_COACH_MARK_STEPS: CoachMarkStep[] = [
  {
    id: 'dashboard',
    routeHref: '/(tabs)/dashboard',
    routePathname: '/dashboard',
    targetKey: COACH_MARK_TARGETS.dashboardCalendar,
    title: 'Dashboard',
    message: 'Le calendrier vous aide a visualiser vos dates et evenements en un coup d oeil.',
  },
  {
    id: 'subscription',
    routeHref: '/(tabs)/subscription',
    routePathname: '/subscription',
    targetKey: COACH_MARK_TARGETS.subscriptionAddButton,
    title: 'Abonnements',
    message: 'Ajoutez et gerez vos abonnements depuis ce bouton.',
  },
  {
    id: 'cloud',
    routeHref: '/(tabs)/cloud',
    routePathname: '/cloud',
    targetKey: COACH_MARK_TARGETS.cloudUploadButton,
    title: 'Cloud / Documents',
    message: 'Importez vos documents ici pour les classer et les relier a vos abonnements.',
  },
  {
    id: 'promotion',
    routeHref: '/(tabs)/promotion',
    routePathname: '/promotion',
    targetKey: COACH_MARK_TARGETS.promotionFirstRow,
    title: 'Promotions',
    message: 'Chaque ligne promo est cliquable, avec copie du code et acces au site partenaire.',
  },
  {
    id: 'profile-security',
    routeHref: '/(tabs)/profile-security',
    routePathname: '/profile-security',
    targetKey: COACH_MARK_TARGETS.profileSecurityChangePassword,
    title: 'Securite',
    message: 'Modifiez votre mot de passe ici et accedez au flux de reinitialisation si besoin.',
  },
];
