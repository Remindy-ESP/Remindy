import { useEffect } from 'react';
import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, ActivityIndicator } from 'react-native';
import GlobalHeader from '../../components/GlobalHeader';
import { useAuth } from '@/context/AuthContext';

interface TabIconProps {
  color: string;
  size: number;
}

function CalendarIcon({ color, size }: Readonly<TabIconProps>) {
  return <Ionicons name="calendar" size={size} color={color} />;
}

function StatsIcon({ color, size }: Readonly<TabIconProps>) {
  return <Ionicons name="stats-chart-outline" size={size} color={color} />;
}

function SubscriptionIcon({ color, size }: Readonly<TabIconProps>) {
  return <Ionicons name="document-text-outline" size={size} color={color} />;
}


function NotificationsIcon({ color, size }: Readonly<TabIconProps>) {
  return <Ionicons name="notifications-outline" size={size} color={color} />;
}

export default function TabLayout() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  // Protected route: redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/');
    }
  }, [isAuthenticated, isLoading]);

  // Show loading while checking auth
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#06071D' }}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  // Don't render tabs if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#06071D' }} edges={['bottom']}>
      <GlobalHeader />
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: '#6366f1',
          tabBarInactiveTintColor: '#9ca3af',
          headerShown: false,
          tabBarStyle: {
            backgroundColor: '#06071D',
            height: 60,
            paddingBottom: 8,
            paddingTop: 8,
          },
          headerStyle: {
            backgroundColor: '#11112A',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Tabs.Screen
          name="dashboard"
          options={{
            tabBarLabel: '',
            title: ' ',
            tabBarIcon: CalendarIcon,
          }}
        />
        <Tabs.Screen
          name="statistics"
          options={{
            tabBarLabel: '',
            title: ' ',
            tabBarIcon: StatsIcon,
          }}
        />
        <Tabs.Screen
          name="subscription"
          options={{
            tabBarLabel: '',
            title: ' ',
            tabBarIcon: SubscriptionIcon,
          }}
        />
        <Tabs.Screen
          name="notifications"
          options={{
            tabBarLabel: '',
            title: ' ',
            tabBarIcon: NotificationsIcon,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            href: null,
          }}
        />
      </Tabs>
    </SafeAreaView>
  );
}
