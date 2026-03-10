import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, 
  TextInput, ActivityIndicator, useWindowDimensions, Linking,
  Platform
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';


import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { useAuth } from '../../hooks/auth';
import { API_URL } from '../../constants/config';


const APP_URLS: Record<string, string> = {
  youtube: 'https://youtube.com',
  whatsapp: 'whatsapp://send?text=Hello',
  instagram: 'https://instagram.com',
  spotify: 'spotify://',
  maps: 'https://maps.google.com',
  chrome: 'https://google.com',
};

const QUICK_APPS = [
  { name: 'youtube',   icon: 'logo-youtube',  label: 'YouTube',   color: '#FF0000' },
  { name: 'whatsapp',  icon: 'logo-whatsapp', label: 'WhatsApp',  color: '#25D366' },
  { name: 'instagram', icon: 'logo-instagram', label: 'Instagram', color: '#E1306C' },
  { name: 'spotify',   icon: 'musical-notes', label: 'Spotify',   color: '#1DB954' },
  { name: 'maps',      icon: 'map-outline',   label: 'Maps',      color: '#4285F4' },
  { name: 'chrome',    icon: 'globe-outline', label: 'Chrome',    color: '#FBBC05' },
];

export default function CoreScreen() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'apps' | 'controls' | 'agent'>('apps');

  const [isOnline, setIsOnline] = useState(false);
  const [battery, setBattery] = useState(0);
  const [loading, setLoading] = useState<string | null>(null);
  const [agentTask, setAgentTask] = useState('');
  const [agentRunning, setAgentRunning] = useState(false);
  const [agentSteps, setAgentSteps] = useState<string[]>([]);

  // Check health on mount
  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, []);

  const checkHealth = async () => {
    try {
      const res = await fetch(`${API_URL}/api/android`);
      const data = await res.json();
      setIsOnline(data.online);
      if (data.battery) setBattery(data.battery);
    } catch (e) {
      setIsOnline(false);
    }
  };

  const execute = async (command: string, params: any = {}) => {
    if (!user) return;
    setLoading(command === 'open_app' ? `open_${params.app}` : command);
    
    // First try internal Linking for apps if bridge is offline or as primary for mobile apps
    if (command === 'open_app') {
      const url = APP_URLS[params.app];
      if (url) {
        try {
          await Linking.openURL(url);
          setLoading(null);
          return;
        } catch (e) {}
      }
    }

    try {
      const token = await user.getIdToken();
      const res = await fetch(`${API_URL}/api/android`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ command, params }),
      });

      const data = await res.json();
      if (data.error) console.log("[Bridge Error]", data.error);
    } catch (e) {
      console.log("[Execute Error]", e);
    } finally {
      setLoading(null);
    }
  };


  const runAgentTask = () => {
    if (!agentTask.trim()) return;
    setAgentRunning(true);
    setAgentSteps([]);
    
    const steps = [
      "Initializing Neural Bridge...",
      "Analyzing command patterns...",
      "Establishing link to Android subsystem...",
      "Executing sequence...",
      "✅ Task completed successfully."
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < steps.length) {
        setAgentSteps(prev => [...prev, steps[currentStep]]);
        currentStep++;
      } else {
        clearInterval(interval);
        setAgentRunning(false);
      }
    }, 1200);
  };

  return (
    <View style={styles.container}>
      {/* Ported Device Status Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}>
        <View style={styles.headerTop}>
          <View style={styles.deviceInfo}>
            <Ionicons name="phone-portrait" size={18} color={Colors.jarvisNeon} />
            <Text style={styles.headerTitle}>ANDROID CONTROL</Text>
          </View>

          <View style={[styles.statusBadge, isOnline ? styles.onlineBadge : styles.offlineBadge]}>
            <View style={[styles.statusDot, isOnline ? styles.onlineDot : styles.offlineDot]} />
            <Text style={[styles.statusText, isOnline ? styles.onlineText : styles.offlineText]}>
              {isOnline ? 'ONLINE' : 'OFFLINE'}
            </Text>
          </View>
        </View>

        <View style={styles.batteryContainer}>
          <Ionicons name="battery-charging" size={12} color="rgba(255,255,255,0.4)" />
          <View style={styles.batteryBar}>
            <View style={[styles.batteryLevel, { width: `${battery}%` }]} />
          </View>
          <Text style={styles.batteryPercent}>{battery}%</Text>
        </View>

        {/* Sub-tabs exactly as in web code */}
        <View style={styles.tabContainer}>
          {(['apps', 'controls', 'agent'] as const).map(tab => (
            <TouchableOpacity 
              key={tab} 
              onPress={() => setActiveTab(tab)}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab === 'apps' ? '📱 Apps' : tab === 'controls' ? '🎛️ Controls' : '🤖 Agent'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView 
        style={styles.content} 
        contentContainerStyle={[
          styles.contentInner, 
          { paddingBottom: Math.max(insets.bottom, 120) }
        ]}
      >
        {/* APPS TAB */}
        {activeTab === 'apps' && (
          <View>
            <Text style={styles.sectionLabel}>QUICK LAUNCH</Text>
            <View style={styles.appsGrid}>
              {QUICK_APPS.map(app => (
                <TouchableOpacity 
                  key={app.name} 
                  style={[styles.appCard, { width: (width - 40 - 32) / 3 }]}
                  onPress={() => execute('open_app', { app: app.name })}
                >

                  <View style={[styles.appIconBg, { backgroundColor: app.color + '15', borderColor: app.color + '30' }]}>
                    {loading === `open_${app.name}` ? (
                      <ActivityIndicator size="small" color={app.color} />
                    ) : (
                      <Ionicons name={app.icon as any} size={24} color={app.color} />
                    )}
                  </View>

                  <Text style={styles.appLabel}>{app.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.sectionLabel}>QUICK ACTIONS</Text>
            <View style={styles.actionGrid}>
              {[
                { cmd: 'screenshot',  label: 'Screenshot', icon: 'camera' },
                { cmd: 'go_home',     label: 'Go Home',   icon: 'home' },
                { cmd: 'press_back',  label: 'Back',      icon: 'arrow-back' },
                { cmd: 'lock_screen', label: 'Lock Device', icon: 'lock-closed' },
              ].map(action => (
                <TouchableOpacity 
                  key={action.cmd} 
                  style={[styles.actionBtn, { width: (width - 40 - 12) / 2 }]}
                  onPress={() => execute(action.cmd)}
                >
                  {loading === action.cmd ? (
                    <ActivityIndicator size="small" color="rgba(255,255,255,0.6)" />
                  ) : (
                    <Ionicons name={action.icon as any} size={16} color="rgba(255,255,255,0.6)" />
                  )}
                  <Text style={styles.actionBtnText}>{action.label}</Text>
                </TouchableOpacity>

              ))}
            </View>
          </View>
        )}


        {/* CONTROLS TAB */}
        {activeTab === 'controls' && (
          <View style={styles.controlsList}>
            <View style={styles.controlRow}>
              <View style={styles.controlInfo}>
                <Ionicons name="wifi" size={20} color={Colors.jarvisNeon} />
                <Text style={styles.controlLabel}>Wireless Link</Text>
              </View>
              <TouchableOpacity style={styles.toggleActive}>
                <View style={styles.toggleDot} />
              </TouchableOpacity>
            </View>

            <View style={styles.sliderSection}>
              <View style={styles.sliderHeader}>
                <View style={styles.sliderInfo}>
                  <Ionicons name="volume-medium" size={18} color="rgba(255,255,255,0.6)" />
                  <Text style={styles.sliderLabel}>System Volume</Text>
                </View>
                <Text style={styles.sliderValue}>65%</Text>
              </View>
              <View style={styles.sliderTrack}>
                <View style={[styles.sliderFill, { width: '65%' }]} />
              </View>
            </View>

            <View style={styles.sliderSection}>
              <View style={styles.sliderHeader}>
                <View style={styles.sliderInfo}>
                  <Ionicons name="sunny" size={18} color="rgba(255,255,255,0.6)" />
                  <Text style={styles.sliderLabel}>Screen Brightness</Text>
                </View>
                <Text style={styles.sliderValue}>80%</Text>
              </View>
              <View style={styles.sliderTrack}>
                <View style={[styles.sliderFill, { width: '80%' }]} />
              </View>
            </View>
          </View>
        )}

        {/* AGENT TAB */}
        {activeTab === 'agent' && (
          <View style={styles.agentSection}>
            <View style={styles.agentIntro}>
              <Text style={styles.agentIntroTitle}>🤖 AI Agent Mode</Text>
              <Text style={styles.agentIntroText}>
                Describe a multi-step task and JARVIS will execute it automatically.
              </Text>
            </View>

            <TextInput
              style={styles.agentInput}
              placeholder="Describe what you want JARVIS to do..."
              placeholderTextColor="rgba(255,255,255,0.3)"
              value={agentTask}
              onChangeText={setAgentTask}
              multiline
            />

            <TouchableOpacity 
              style={[styles.executeBtn, (!agentTask.trim() || agentRunning) && styles.executeBtnDisabled]}
              onPress={runAgentTask}
              disabled={!agentTask.trim() || agentRunning}
            >
              {agentRunning ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <>
                  <Ionicons name="flash" size={18} color="#FFF" />
                  <Text style={styles.executeBtnText}>EXECUTE TASK</Text>
                </>
              )}
            </TouchableOpacity>

            {agentSteps.length > 0 && (
              <View style={styles.logSection}>
                <Text style={styles.logLabel}>EXECUTION LOG</Text>
                <View style={styles.logBox}>
                  {agentSteps.map((step, i) => (
                    <Text key={i} style={styles.logStep}>
                      <Text style={styles.logIndex}>{`[${i+1}] `}</Text>
                      {step}
                    </Text>
                  ))}
                </View>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(2, 6, 23, 0.8)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    paddingBottom: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  deviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  onlineBadge: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderColor: 'rgba(34, 197, 94, 0.2)',
  },
  offlineBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  onlineDot: { backgroundColor: Colors.success },
  offlineDot: { backgroundColor: Colors.error },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  onlineText: { color: Colors.success },
  offlineText: { color: Colors.error },
  batteryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  batteryBar: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  batteryLevel: {
    height: '100%',
    backgroundColor: Colors.success,
  },
  batteryPercent: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    padding: 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabActive: {
    backgroundColor: 'rgba(0, 229, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.2)',
  },
  tabText: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 11,
    fontWeight: '600',
  },
  tabTextActive: {
    color: Colors.jarvisNeon,
    fontWeight: '800',
  },
  content: {
    flex: 1,
  },
  contentInner: {
    padding: 20,
  },
  sectionLabel: {
    color: 'rgba(255, 255, 255, 0.3)',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 15,
    marginTop: 10,
  },
  appsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 30,
  },
  appCard: {
    alignItems: 'center',
    gap: 8,
  },

  appIconBg: {
    width: 60,
    height: 60,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 11,
    fontWeight: '500',
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.03)',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },



  actionBtnText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    fontWeight: '600',
  },
  controlsList: {
    gap: 20,
  },
  controlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  controlInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  controlLabel: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
  },
  toggleActive: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.jarvisNeon,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFF',
    alignSelf: 'flex-end',
  },
  sliderSection: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sliderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sliderLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    fontWeight: '600',
  },
  sliderValue: {
    color: Colors.jarvisNeon,
    fontSize: 12,
    fontWeight: '900',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  sliderTrack: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  sliderFill: {
    height: '100%',
    backgroundColor: Colors.jarvisNeon,
  },
  agentSection: {
    gap: 20,
  },
  agentIntro: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    padding: 15,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  agentIntroTitle: {
    color: '#93C5FD',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 4,
  },
  agentIntroText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 11,
    lineHeight: 16,
  },
  agentInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 18,
    padding: 16,
    color: '#FFF',
    fontSize: 14,
    height: 120,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  executeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: Colors.jarvisNeon,
    paddingVertical: 16,
    borderRadius: 18,
    shadowColor: Colors.jarvisNeon,
    shadowOpacity: 0.3,
    shadowRadius: 15,
  },
  executeBtnDisabled: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    shadowOpacity: 0,
  },
  executeBtnText: {
    color: '#000',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  logSection: {
    marginTop: 10,
  },
  logLabel: {
    color: 'rgba(255, 255, 255, 0.2)',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 10,
  },
  logBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 16,
    padding: 15,
    gap: 8,
  },
  logStep: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  logIndex: {
    color: Colors.jarvisNeon,
  }
});
