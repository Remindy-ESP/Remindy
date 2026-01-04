import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import GlobalHeader from '@/components/GlobalHeader';
import { useAuth } from '@/context/AuthContext';
import { APP_ROUTES } from '@/navigation/MenuConfig';

export default function TabLayout() {
    const router = useRouter();
    const { isAuthenticated, isLoading } = useAuth();

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.replace('/');
        }
    }, [isAuthenticated, isLoading]);

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#06071D' }}>
                <ActivityIndicator size="large" color="#6366f1" />
            </View>
        );
    }

    if (!isAuthenticated) return null;

    const footerRoutes = APP_ROUTES.filter(r => r.showInFooter);
    const hiddenRoutes = APP_ROUTES.filter(r => !r.showInFooter);

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#06071D' }} edges={['bottom']}>
            <GlobalHeader />

            <Tabs
                screenOptions={{
                    headerShown: false,
                    tabBarActiveTintColor: '#6366f1',
                    tabBarInactiveTintColor: '#9ca3af',
                    tabBarStyle: {
                        backgroundColor: '#06071D',
                        height: 60,
                        paddingBottom: 8,
                        paddingTop: 8,
                        borderTopWidth: 0,
                    },
                }}
            >
                {footerRoutes.map(route => (
                    <Tabs.Screen
                        key={route.key}
                        name={route.route.replace('/(tabs)/', '')}
                        options={{
                            title: ' ',
                            tabBarLabel: '',
                            tabBarIcon: ({ color, size }) => (
                                <Ionicons
                                    name={route.footerIcon as any}
                                    size={size}
                                    color={color}
                                />
                            ),
                        }}
                    />
                ))}
                {hiddenRoutes.map(route => (
                    <Tabs.Screen
                        key={route.key}
                        name={route.route.replace('/(tabs)/', '')}
                        options={{ href: null }}
                    />
                ))}
                <Tabs.Screen name="profile" options={{ href: null }} />
            </Tabs>
        </SafeAreaView>
    );
}