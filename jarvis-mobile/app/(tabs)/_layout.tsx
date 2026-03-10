import { Tabs } from 'expo-router';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';

function TabIcon({ focused, icon, label }: { focused: boolean; icon: any; label: string }) {
  return (
    <View style={styles.tabIconGroup}>
      <View style={[styles.iconWrapper, focused && styles.iconWrapperActive]}>
        <Ionicons 
          name={icon} 
          size={22} 
          color={focused ? Colors.jarvisNeon : 'rgba(255, 255, 255, 0.4)'} 
        />
      </View>
      <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>{label}</Text>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ 
      headerShown: false, 
      tabBarStyle: styles.tabBar,
      tabBarShowLabel: false,
      tabBarActiveTintColor: Colors.jarvisNeon,
      tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.4)',
    }}>
      <Tabs.Screen 
        name="chat" 
        options={{ 
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} icon={focused ? "chatbubble-ellipses" : "chatbubble-ellipses-outline"} label="Jarvis" /> 
        }} 
      />
      <Tabs.Screen 
        name="core" 
        options={{ 
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} icon={focused ? "hardware-chip" : "hardware-chip-outline"} label="Core" /> 
        }} 
      />
    </Tabs>

  );
}

const styles = StyleSheet.create({
  tabBar: {
    display: 'none',
  },
  tabIconGroup: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },

  iconWrapper: {
    width: 60,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  iconWrapperActive: {
    backgroundColor: 'rgba(0, 229, 255, 0.1)',
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.4)',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  tabLabelActive: {
    color: Colors.jarvisNeon,
    fontWeight: '700',
  },
});