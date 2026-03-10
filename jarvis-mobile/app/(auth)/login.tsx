import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ActivityIndicator, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../hooks/auth';
import { Colors } from '../../constants/colors';

export default function LoginScreen() {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const { login } = useAuth();
  const router    = useRouter();

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }
    setLoading(true);
    try {
      await login(email.trim(), password);
      router.replace('/(tabs)/chat');
    } catch (err: any) {
      Alert.alert('Login Failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.glow} />
      <View style={styles.logoContainer}>
        <Text style={styles.logo}>JARVIS</Text>
        <Text style={styles.logoSub}>AI ASSISTANT</Text>
      </View>
      <View style={styles.form}>
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Sign in to continue</Text>
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={Colors.muted}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor={Colors.muted}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <TouchableOpacity
          style={[styles.button, loading && { opacity: 0.6 }]}
          onPress={handleLogin}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading
            ? <ActivityIndicator color="#000" />
            : <Text style={styles.buttonText}>Sign In</Text>
          }
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.registerLink}
          onPress={() => router.push('/(auth)/register')}
        >
          <Text style={styles.registerText}>
            Don't have an account?{' '}
            <Text style={{ color: Colors.neonBlue }}>Register</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center', padding: 24 },
  glow:           { position: 'absolute', top: -200, width: 400, height: 400, borderRadius: 200, backgroundColor: 'rgba(0,229,255,0.05)' },
  logoContainer:  { alignItems: 'center', marginBottom: 48 },
  logo:           { fontSize: 52, fontWeight: '900', color: Colors.neonBlue, letterSpacing: 8, textShadowColor: 'rgba(0,229,255,0.5)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 20 },
  logoSub:        { fontSize: 10, color: Colors.muted, letterSpacing: 6, marginTop: 4 },
  form:           { width: '100%', maxWidth: 380 },
  title:          { fontSize: 24, fontWeight: '700', color: Colors.white, marginBottom: 4 },
  subtitle:       { fontSize: 14, color: Colors.muted, marginBottom: 28 },
  input:          { backgroundColor: Colors.mutedLight, borderWidth: 1, borderColor: Colors.border, borderRadius: 14, padding: 16, color: Colors.white, fontSize: 15, marginBottom: 12 },
  button:         { backgroundColor: Colors.neonBlue, borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 8 },
  buttonText:     { color: '#000', fontWeight: '800', fontSize: 15, letterSpacing: 1 },
  registerLink:   { alignItems: 'center', marginTop: 20 },
  registerText:   { color: Colors.muted, fontSize: 14 },
});