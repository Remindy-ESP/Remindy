export interface AppRoute {
    key: string;
    labelKey: string;
    route: string;
    showInBurger: boolean;
    showInFooter: boolean;
    burgerIcon?: string;
    footerIcon?: string;
}

export const APP_ROUTES: AppRoute[] = [
    {
        key: 'dashboard',
        labelKey: 'nav.dashboard',
        route: '/(tabs)/dashboard',
        showInBurger: true,
        showInFooter: true,
        footerIcon: 'home',
    },
    {
        key: 'statistics',
        labelKey: 'nav.statistics',
        route: '/(tabs)/statistics',
        showInBurger: true,
        showInFooter: true,
        footerIcon: 'stats-chart',
    },
    {
        key: 'subscription',
        labelKey: 'nav.subscription',
        route: '/(tabs)/subscription',
        showInBurger: true,
        showInFooter: true,
        footerIcon: 'swap-horizontal',
    },
    {
        key: 'notifications',
        labelKey: 'nav.notifications',
        route: '/(tabs)/notifications',
        showInBurger: true,
        showInFooter: true,
        footerIcon: 'notifications',
    },
    {
        key: 'cloud',
        labelKey: 'nav.cloud',
        route: '/(tabs)/cloud',
        showInBurger: true,
        showInFooter: false,
    },
    {
        key: 'promotion',
        labelKey: 'nav.promotion',
        route: '/(tabs)/promotion',
        showInBurger: true,
        showInFooter: false,
    },
    {
        key: 'legal',
        labelKey: 'nav.legal',
        route: '/(tabs)/legal',
        showInBurger: true,
        showInFooter: false,
    },
];
