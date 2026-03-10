import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View, ActivityIndicator, Text } from 'react-native';
import { useAuth } from '../hooks/auth';

export default function Index() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (user) {
      router.replace('/(tabs)/chat');
    } else {
      router.replace('/(auth)/login');
    }
  }, [user, loading]);

  return (
    <View style={{ flex: 1, backgroundColor: '#020617', alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator size="large" color="#00E5FF" />
      <Text style={{ color: 'rgba(255,255,255,0.4)', marginTop: 16, fontSize: 12 }}>
        Initializing JARVIS...
      </Text>
    </View>
  );
}