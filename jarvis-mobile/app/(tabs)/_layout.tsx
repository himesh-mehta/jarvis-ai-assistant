import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';

function TabIcon({ focused, emoji, label }: { focused: boolean; emoji: string; label: string }) {
  return (
    <View style={[styles.tabIcon, focused && styles.tabIconActive]}>
      <Text style={styles.emoji}>{emoji}</Text>
      {focused && <Text style={styles.label}>{label}</Text>}
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false, tabBarStyle: styles.tabBar, tabBarShowLabel: false }}>
      <Tabs.Screen name="chat"     options={{ tabBarIcon: ({ focused }) => <TabIcon focused={focused} emoji="💬" label="Chat"    /> }} />
      <Tabs.Screen name="voice"    options={{ tabBarIcon: ({ focused }) => <TabIcon focused={focused} emoji="🎤" label="Voice"   /> }} />
      <Tabs.Screen name="control"  options={{ tabBarIcon: ({ focused }) => <TabIcon focused={focused} emoji="📱" label="Control" /> }} />
      <Tabs.Screen name="settings" options={{ tabBarIcon: ({ focused }) => <TabIcon focused={focused} emoji="⚙️" label="Settings"/> }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar:        { backgroundColor: '#0a1628', borderTopColor: 'rgba(0,229,255,0.1)', borderTopWidth: 1, height: 70, paddingBottom: 10, paddingTop: 8 },
  tabIcon:       { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, gap: 2 },
  tabIconActive: { backgroundColor: 'rgba(0,229,255,0.1)', borderWidth: 1, borderColor: 'rgba(0,229,255,0.2)' },
  emoji:         { fontSize: 20 },
  label:         { fontSize: 9, color: Colors.neonBlue, fontWeight: '700', letterSpacing: 0.5 },
});