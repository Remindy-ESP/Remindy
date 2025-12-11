import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import GlobalHeader from '../../components/GlobalHeader';

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

function ProfileIcon({ color, size }: Readonly<TabIconProps>) {
  return <Ionicons name="person" size={size} color={color} />;
}

export default function TabLayout() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#06071D' }} edges={['bottom']}>
      <GlobalHeader />
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: '#6366f1',
          tabBarInactiveTintColor: '#9ca3af',
          headerShown: false, // Hide default tab headers
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
          name="stats"
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
          name="profile"
          options={{
            tabBarLabel: '',
            title: ' ',
            tabBarIcon: ProfileIcon,
          }}
        />
      </Tabs>
    </SafeAreaView>
  );
}
