import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function StackLayout() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#11112A' }} edges={['top']}>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#11112A' } }} />
    </SafeAreaView>
  );
}
