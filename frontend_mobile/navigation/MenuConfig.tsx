export interface AppRoute {
    key: string;
    label: string;
    route: string;
    showInBurger: boolean;
    showInFooter: boolean;
    footerIcon?: string;
}

export const APP_ROUTES: AppRoute[] = [
    {
        key: 'dashboard',
        label: 'Accueil',
        route: '/(tabs)/dashboard',
        showInBurger: true,
        showInFooter: true,
        footerIcon: 'home',
    },
    {
        key: 'statistics',
        label: 'Statistiques',
        route: '/(tabs)/statistics',
        showInBurger: true,
        showInFooter: true,
        footerIcon: 'stats-chart',
    },
    {
        key: 'subscription',
        label: 'Opérations',
        route: '/(tabs)/subscription',
        showInBurger: true,
        showInFooter: true,
        footerIcon: 'swap-horizontal',
    },
    {
        key: 'notifications',
        label: 'Notifications',
        route: '/(tabs)/notifications',
        showInBurger: true,
        showInFooter: true,
        footerIcon: 'notifications',
    },
    {
        key: 'cloud',
        label: 'Cloud',
        route: '/(tabs)/cloud',
        showInBurger: true,
        showInFooter: false,
    },
    {
        key: 'promotion',
        label: 'Promos',
        route: '/(tabs)/promotion',
        showInBurger: true,
        showInFooter: false,
    },
    {
        key: 'legal',
        label: 'Légal',
        route: '/(tabs)/legal',
        showInBurger: true,
        showInFooter: false,
    },
];