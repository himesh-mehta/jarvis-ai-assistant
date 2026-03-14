import { Redirect } from 'expo-router';
import { useAuth } from '../hooks/auth';
import { View, ActivityIndicator } from 'react-native';

export default function Index() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#020617', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#00E5FF" />
      </View>
    );
  }

  if (user) {
    return <Redirect href="/(tabs)/chat" />;
  }

  return <Redirect href="/(auth)/login" />;
}
