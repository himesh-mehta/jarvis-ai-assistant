import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ActivityIndicator, Alert, ScrollView,
} from 'react-native';

import { useRouter } from 'expo-router';
import { useAuth } from '../../hooks/auth';
import { Colors } from '../../constants/colors';

export default function RegisterScreen() {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [loading,  setLoading]  = useState(false);
  const { register } = useAuth();
  const router = useRouter();

  const handleRegister = async () => {
    if (!email || !password || !confirm) { Alert.alert('Error', 'Fill all fields'); return; }
    if (password !== confirm) { Alert.alert('Error', 'Passwords do not match'); return; }
    if (password.length < 6) { Alert.alert('Error', 'Password min 6 characters'); return; }
    setLoading(true);
    try {
      await register(email.trim(), password);
      router.replace('/(tabs)/chat');
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.logoContainer}>
          <Text style={styles.logo}>JARVIS</Text>
          <Text style={styles.logoSub}>CREATE ACCOUNT</Text>
        </View>
        <View style={styles.form}>
          <Text style={styles.title}>Get Started</Text>
          <Text style={styles.subtitle}>Create your JARVIS account</Text>
          <TextInput style={styles.input} placeholder="Email" placeholderTextColor={Colors.muted} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          <TextInput style={styles.input} placeholder="Password" placeholderTextColor={Colors.muted} value={password} onChangeText={setPassword} secureTextEntry />
          <TextInput style={styles.input} placeholder="Confirm Password" placeholderTextColor={Colors.muted} value={confirm} onChangeText={setConfirm} secureTextEntry />

          <TouchableOpacity style={[styles.button, loading && { opacity: 0.6 }]} onPress={handleRegister} disabled={loading} activeOpacity={0.8}>
            {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.buttonText}>Create Account</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={styles.loginLink} onPress={() => router.back()}>
            <Text style={styles.loginText}>Already have an account? <Text style={{ color: Colors.neonBlue }}>Sign In</Text></Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );

}

const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: Colors.background, padding: 24 },
  scrollContent: { flexGrow: 1, alignItems: 'center', justifyContent: 'center' },

  logoContainer: { alignItems: 'center', marginBottom: 48 },
  logo:          { fontSize: 52, fontWeight: '900', color: Colors.neonBlue, letterSpacing: 8, textShadowColor: 'rgba(0,229,255,0.5)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 20 },
  logoSub:       { fontSize: 10, color: Colors.muted, letterSpacing: 6, marginTop: 4 },
  form:          { width: '100%', maxWidth: 380 },
  title:         { fontSize: 24, fontWeight: '700', color: Colors.white, marginBottom: 4 },
  subtitle:      { fontSize: 14, color: Colors.muted, marginBottom: 28 },
  input:         { backgroundColor: Colors.mutedLight, borderWidth: 1, borderColor: Colors.border, borderRadius: 14, padding: 16, color: Colors.white, fontSize: 15, marginBottom: 12 },
  button:        { backgroundColor: Colors.neonBlue, borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 8 },
  buttonText:    { color: '#000', fontWeight: '800', fontSize: 15 },
  loginLink:     { alignItems: 'center', marginTop: 20 },
  loginText:     { color: Colors.muted, fontSize: 14 },
});