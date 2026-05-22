export type CoachMarkStep = {
  id: string;
  routeHref: string;
  routePathname: string;
  targetKey: string;
  titleKey: string;
  messageKey: string;
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
    titleKey: 'coach.steps.dashboard.title',
    messageKey: 'coach.steps.dashboard.message',
  },
  {
    id: 'subscription',
    routeHref: '/(tabs)/subscription',
    routePathname: '/subscription',
    targetKey: COACH_MARK_TARGETS.subscriptionAddButton,
    titleKey: 'coach.steps.subscription.title',
    messageKey: 'coach.steps.subscription.message',
  },
  {
    id: 'cloud',
    routeHref: '/(tabs)/cloud',
    routePathname: '/cloud',
    targetKey: COACH_MARK_TARGETS.cloudUploadButton,
    titleKey: 'coach.steps.cloud.title',
    messageKey: 'coach.steps.cloud.message',
  },
  {
    id: 'promotion',
    routeHref: '/(tabs)/promotion',
    routePathname: '/promotion',
    targetKey: COACH_MARK_TARGETS.promotionFirstRow,
    titleKey: 'coach.steps.promotion.title',
    messageKey: 'coach.steps.promotion.message',
  },
  {
    id: 'profile-security',
    routeHref: '/(tabs)/profile-security',
    routePathname: '/profile-security',
    targetKey: COACH_MARK_TARGETS.profileSecurityChangePassword,
    titleKey: 'coach.steps.profile-security.title',
    messageKey: 'coach.steps.profile-security.message',
  },
];
