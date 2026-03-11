import React, { useEffect, useRef, useState, useMemo } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, 
  ScrollView, Animated, useWindowDimensions, 
  Platform, ActivityIndicator
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';

interface VoiceMessage {
  role: 'user' | 'assistant';
  content: string;
  provider?: string;
  isInterim?: boolean;
}

const PROVIDER_ICONS: Record<string, string> = {
  groq: "⚡",
  gemini: "💎",
  cohere: "🌿",
  huggingface: "🤗",
};

// ── WordByWord for Mobile (Simulated with simple fading) ────────────────
const WordByWord = ({ text, isInterim }: { text: string; isInterim?: boolean }) => {
  return (
    <Text style={[styles.messageText, isInterim && styles.interimText]}>
      {text}
      {isInterim && <Text style={styles.cursor}>|</Text>}
    </Text>
  );
};

// ── Real-time Audio Visualizer ────────────────────────────
const LiveVisualizer = ({ isActive, theme = 'blue' }: { isActive: boolean; theme?: 'blue' | 'red' | 'purple' }) => {
  const bars = Array.from({ length: 20 }).map((_, i) => useRef(new Animated.Value(4)).current);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive) {
      interval = setInterval(() => {
        bars.forEach(bar => {
          Animated.spring(bar, {
            toValue: Math.random() * 32 + 4,
            useNativeDriver: false, // height doesn't support native driver in most RN versions
            friction: 7,
            tension: 50,
          }).start();
        });
      }, 150);
    } else {
      bars.forEach(bar => {
        Animated.spring(bar, {
          toValue: 4,
          useNativeDriver: false,
        }).start();
      });
    }
    return () => clearInterval(interval);
  }, [isActive]);

  const barColor = theme === 'red' ? '#EF4444' : theme === 'purple' ? '#9D50BB' : Colors.neonBlue;

  return (
    <View style={styles.visualizerContainer}>
      {bars.map((bar, i) => (
        <Animated.View
          key={i}
          style={[
            styles.visualizerBar,
            { height: bar, backgroundColor: barColor }
          ]}
        />
      ))}
    </View>
  );
};

interface VoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  isVoiceRecording: boolean;
  isSpeaking: boolean;
  voiceLoading: boolean;
  voiceMessages: VoiceMessage[];
  onToggleRecording: () => void;
  interimTranscript?: string;
}

export default function VoiceModal({
  isOpen,
  onClose,
  isVoiceRecording,
  isSpeaking,
  voiceLoading,
  voiceMessages,
  onToggleRecording,
  interimTranscript = ""
}: VoiceModalProps) {
  const { width, height } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    if (isOpen) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true })
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 50, duration: 300, useNativeDriver: true })
      ]).start();
    }
  }, [isOpen]);

  useEffect(() => {
    if (scrollRef.current) {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [voiceMessages, interimTranscript]);

  const status = useMemo(() => {
    if (voiceLoading) return { label: 'Processing', color: '#F59E0B', theme: 'purple' as const };
    if (isVoiceRecording) return { label: 'Listening', color: '#EF4444', theme: 'red' as const };
    if (isSpeaking) return { label: 'Speaking', color: '#10B981', theme: 'blue' as const };
    return { label: 'Ready', color: Colors.neonBlue, theme: 'blue' as const };
  }, [voiceLoading, isVoiceRecording, isSpeaking]);

  if (!isOpen) return null;

  return (
    <Animated.View 
      style={[styles.overlay, { opacity: fadeAnim }]}
      pointerEvents={isOpen ? 'auto' : 'none'}
    >
      <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1} />
        
        <View style={styles.modalContainer}>
          <Animated.View 
            style={[
              styles.modalContent, 
              { 
                width: width * 0.9, 
                height: height * 0.8,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerInfo}>
                <View style={styles.botIconContainer}>
                  <MaterialCommunityIcons name="robot-outline" size={24} color={Colors.neonBlue} />
                  <View style={[styles.statusDot, { backgroundColor: status.color }]} />
                </View>
                <View>
                  <Text style={styles.headerTitle}>JARVIS MODE</Text>
                  <Text style={styles.headerStatus}>Link: {status.label}</Text>
                </View>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color="rgba(255,255,255,0.4)" />
              </TouchableOpacity>
            </View>

            {/* Messages Feed */}
            <ScrollView 
              ref={scrollRef}
              style={styles.messageFeed}
              contentContainerStyle={styles.messageFeedContent}
              showsVerticalScrollIndicator={false}
            >
              {voiceMessages.length === 0 && !interimTranscript && (
                <View style={styles.emptyState}>
                  <MaterialCommunityIcons name="robot" size={64} color="rgba(255,255,255,0.1)" />
                  <Text style={styles.emptyStateText}>WAITING FOR INPUT...</Text>
                </View>
              )}

              {voiceMessages.map((msg, idx) => (
                <View 
                  key={idx} 
                  style={[
                    styles.messageGroup, 
                    msg.role === 'user' ? styles.userGroup : styles.assistantGroup
                  ]}
                >
                  <View style={[
                    styles.avatar, 
                    msg.role === 'user' ? styles.userAvatar : styles.assistantAvatar
                  ]}>
                    <Ionicons 
                      name={msg.role === 'user' ? "person-outline" : "hardware-chip-outline"} 
                      size={14} 
                      color={msg.role === 'user' ? Colors.neonPurple : Colors.neonBlue} 
                    />
                  </View>
                  <View style={[
                    styles.bubble, 
                    msg.role === 'user' ? styles.userBubble : styles.assistantBubble
                  ]}>
                    <WordByWord text={msg.content} />
                    {msg.provider && (
                      <View style={styles.providerBadge}>
                        <Text style={styles.providerText}>
                          {PROVIDER_ICONS[msg.provider.toLowerCase()] || "●"} {msg.provider}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              ))}

              {interimTranscript ? (
                <View style={[styles.messageGroup, styles.userGroup]}>
                  <View style={[styles.avatar, styles.userAvatar]}>
                    <Ionicons name="person-outline" size={14} color={Colors.neonPurple} />
                  </View>
                  <View style={[styles.bubble, styles.userBubble, styles.interimBubble]}>
                    <WordByWord text={interimTranscript} isInterim />
                  </View>
                </View>
              ) : null}
            </ScrollView>

            {/* Footer */}
            <View style={styles.footer}>
              <LiveVisualizer isActive={isVoiceRecording || isSpeaking} theme={status.theme} />
              
              <View style={styles.micContainer}>
                {isVoiceRecording && (
                  <View style={styles.micAura} />
                )}
                <TouchableOpacity 
                  onPress={onToggleRecording}
                  style={[
                    styles.micButton, 
                    isVoiceRecording ? styles.micButtonActive : styles.micButtonInactive
                  ]}
                >
                  {voiceLoading ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <Ionicons 
                      name={isVoiceRecording ? "mic-off" : "mic"} 
                      size={32} 
                      color="#FFF" 
                    />
                  )}
                </TouchableOpacity>
              </View>

              <Text style={[styles.statusLabel, { color: status.color }]}>
                {isVoiceRecording ? "PROTOCOL: LISTENING" : isSpeaking ? "COMMUNICATION: ACTIVE" : "STANDBY: ONLINE"}
              </Text>
            </View>
          </Animated.View>
        </View>
      </BlurView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#0F172A',
    borderRadius: 40,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
    shadowColor: Colors.neonBlue,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 30,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  botIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 229, 255, 0.05)',
  },
  statusDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#0F172A',
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 2,
    fontStyle: 'italic',
  },
  headerStatus: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  messageFeed: {
    flex: 1,
  },
  messageFeedContent: {
    padding: 24,
    gap: 24,
  },
  emptyState: {
    flex: 1,
    height: 300,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.5,
  },
  emptyStateText: {
    color: 'rgba(255,255,255,0.2)',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 2,
    marginTop: 20,
  },
  messageGroup: {
    flexDirection: 'row',
    gap: 12,
    maxWidth: '85%',
  },
  userGroup: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
  },
  assistantGroup: {
    alignSelf: 'flex-start',
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginTop: 4,
  },
  userAvatar: {
    backgroundColor: 'rgba(157, 80, 187, 0.1)',
    borderColor: 'rgba(157, 80, 187, 0.2)',
  },
  assistantAvatar: {
    backgroundColor: 'rgba(0, 229, 255, 0.1)',
    borderColor: 'rgba(0, 229, 255, 0.2)',
  },
  bubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  userBubble: {
    backgroundColor: 'rgba(157, 80, 187, 0.15)',
    borderColor: 'rgba(157, 80, 187, 0.2)',
    borderTopRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: 'rgba(0, 229, 255, 0.08)',
    borderColor: 'rgba(0, 229, 255, 0.2)',
    borderTopLeftRadius: 4,
  },
  interimBubble: {
    opacity: 0.7,
    fontStyle: 'italic',
  },
  messageText: {
    color: '#F1F5F9',
    fontSize: 15,
    lineHeight: 22,
  },
  interimText: {
    color: 'rgba(255,255,255,0.6)',
  },
  cursor: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  providerBadge: {
    marginTop: 8,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  providerText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  footer: {
    padding: 32,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  visualizerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    height: 40,
    marginBottom: 24,
  },
  visualizerBar: {
    width: 3,
    borderRadius: 1.5,
  },
  micContainer: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  micAura: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#EF4444',
    opacity: 0.2,
  },
  micButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  micButtonActive: {
    backgroundColor: '#EF4444',
  },
  micButtonInactive: {
    backgroundColor: Colors.neonBlue,
  },
  statusLabel: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 4,
    textTransform: 'uppercase',
  },
});
