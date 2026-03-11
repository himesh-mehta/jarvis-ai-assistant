import React, { useEffect, useRef, useState, useMemo } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, 
  Animated, useWindowDimensions, 
  Platform, ActivityIndicator
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';

interface VoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  isVoiceRecording: boolean;
  isSpeaking: boolean;
  voiceLoading: boolean;
  voiceMessages: any[]; 
  onToggleRecording: () => void;
  interimTranscript?: string;
}

const GridBackground = () => {
  return (
    <View style={StyleSheet.absoluteFill}>
      {/* Perspective Grid */}
      <View style={styles.perspectiveContainer}>
        {Array.from({ length: 6 }).map((_, i) => (
          <View key={`h-${i}`} style={[styles.horizontalLine, { top: i * 25, opacity: 0.05 + (i * 0.05) }]} />
        ))}
        {Array.from({ length: 9 }).map((_, i) => (
          <View 
            key={`v-${i}`} 
            style={[
              styles.slantedLine, 
              { 
                left: `${10 + i * 10}%`, 
                transform: [{ rotate: `${(i - 4) * 15}deg` }] 
              }
            ]} 
          />
        ))}
      </View>

      {/* Background Dots */}
      {Array.from({ length: 30 }).map((_, i) => (
        <View 
          key={`dot-${i}`} 
          style={[
            styles.bgDot, 
            { 
              top: `${Math.random() * 100}%`, 
              left: `${Math.random() * 100}%`,
              opacity: 0.05 + Math.random() * 0.1
            }
          ]} 
        />
      ))}
    </View>
  );
};

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
  const { width } = useWindowDimensions();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0.5)).current;

  // Get the most relevant text to show in the central area
  const displayTranscript = useMemo(() => {
    if (interimTranscript) return interimTranscript;
    if (voiceLoading) return "Establishing neural link...";
    
    // Show last assistant message or user message if we just sent one
    if (voiceMessages && voiceMessages.length > 0) {
      const last = voiceMessages[voiceMessages.length - 1];
      return last.content;
    }
    
    return isVoiceRecording ? "System ready. Speak now..." : "";
  }, [interimTranscript, voiceLoading, voiceMessages, isVoiceRecording]);

  useEffect(() => {
    if (isOpen) {
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
      
    } else {
      Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start();
    }
  }, [isOpen]);

  useEffect(() => {
    let animation: Animated.CompositeAnimation;
    if (isVoiceRecording || isSpeaking) {
      animation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.08, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      );
      animation.start();
    } else {
      pulseAnim.setValue(1);
    }
    return () => animation?.stop();
  }, [isVoiceRecording, isSpeaking]);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0.5, duration: 2000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  if (!isOpen) return null;

  return (
    <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
      <GridBackground />
      

      {/* Content */}
      <View style={styles.safeContent}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            <View style={styles.botIconCircle}>
              <MaterialCommunityIcons name="robot" size={20} color={Colors.neonBlue} />
            </View>
            <View>
              <Text style={styles.headerTitleText}>TALK TO JARVIS</Text>
              <Text style={styles.headerStatusText}>
                {isVoiceRecording ? "LISTENING..." : isSpeaking ? "SPEAKING..." : voiceLoading ? "CONNECTING..." : "STANDBY MODE"}
              </Text>
            </View>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={26} color="rgba(255,255,255,0.4)" />
          </TouchableOpacity>
        </View>

        {/* Center UI */}
        <View style={styles.centerArea}>
          <Animated.View style={[styles.mainOrbWrapper, { transform: [{ scale: pulseAnim }] }]}>
            {/* Diamond shape container */}
            <View style={styles.diamondOuter}>
              <View style={styles.diamondInner}>
                <View style={styles.diamondCore}>
                  <MaterialCommunityIcons name="robot" size={38} color={Colors.neonBlue} />
                </View>
              </View>
            </View>
            
            <Animated.View style={[styles.orbitingDiamond, { opacity: Animated.multiply(glowAnim, 0.2) }]} />
            <Animated.View style={[styles.orbitingDiamondSmall, { opacity: Animated.multiply(glowAnim, 0.4) }]} />
          </Animated.View>

          <Text style={styles.stableLinkText}>STABLE CONNECTION</Text>

          <View style={styles.transcriptWrap}>
            <Text style={styles.transcriptText} numberOfLines={3}>
              {displayTranscript}
            </Text>
          </View>
        </View>

        {/* Bottom UI */}
        <View style={styles.bottomArea}>
          <Text style={styles.bottomInstruction}>TALK TO JARVIS</Text>
          
          <View style={styles.micStage}>
            <Animated.View style={[
              styles.micRipple, 
              { 
                transform: [{ scale: pulseAnim }],
                opacity: isVoiceRecording ? 0.15 : 0 
              }
            ]} />
            <TouchableOpacity 
              onPress={onToggleRecording}
              style={[styles.micBtn, isVoiceRecording && styles.micBtnActive]}
            >
              {voiceLoading ? (
                <ActivityIndicator color="#FFF" size="large" />
              ) : (
                <View style={styles.micInnerGlow}>
                  <MaterialCommunityIcons 
                    name={isVoiceRecording ? "microphone-off" : "microphone"} 
                    size={40} 
                    color="#FFF" 
                  />
                </View>
              )}
            </TouchableOpacity>
          </View>

          <Text style={styles.synapticBranding}>Multi-language synaptic processing enabled</Text>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#020617',
    zIndex: 9999,
  },
  safeContent: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 100 : 80,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 25,
    marginBottom: 20,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  botIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 210, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 210, 255, 0.05)',
  },
  headerTitleText: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '900',
    fontStyle: 'italic',
    letterSpacing: 1,
  },
  headerStatusText: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 2,
    marginTop: 2,
  },
  closeBtn: {
    padding: 5,
  },
  perspectiveContainer: {
    position: 'absolute',
    top: '15%',
    width: '100%',
    height: 250,
    alignItems: 'center',
  },
  horizontalLine: {
    position: 'absolute',
    width: '150%',
    height: 1,
    backgroundColor: Colors.neonBlue,
  },
  slantedLine: {
    position: 'absolute',
    height: 400,
    width: 0.5,
    backgroundColor: Colors.neonBlue,
    opacity: 0.1,
  },
  bgDot: {
    position: 'absolute',
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: Colors.neonBlue,
  },
  centerArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainOrbWrapper: {
    width: 160,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  diamondOuter: {
    width: 100,
    height: 100,
    borderWidth: 1.5,
    borderColor: 'rgba(0, 210, 255, 0.4)',
    transform: [{ rotate: '45deg' }],
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 210, 255, 0.05)',
    zIndex: 5,
  },
  diamondInner: {
    width: 80,
    height: 80,
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: 'rgba(0, 210, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  diamondCore: {
    width: 70,
    height: 70,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-45deg' }], // Counter-rotate icon
  },
  orbitingDiamond: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderWidth: 1,
    borderColor: Colors.neonBlue,
    transform: [{ rotate: '45deg' }],
  },
  orbitingDiamondSmall: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderWidth: 0.5,
    borderColor: Colors.neonBlue,
    transform: [{ rotate: '45deg' }],
  },
  stableLinkText: {
    color: Colors.neonBlue,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 4,
    fontStyle: 'italic',
    opacity: 0.9,
    marginTop: 10,
  },
  transcriptWrap: {
    marginTop: 40,
    paddingHorizontal: 40,
    height: 120,
    justifyContent: 'center',
  },
  transcriptText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 17,
    textAlign: 'center',
    lineHeight: 26,
    fontWeight: '500',
  },
  bottomArea: {
    paddingBottom: Platform.OS === 'ios' ? 70 : 40,
    alignItems: 'center',
  },
  bottomInstruction: {
    color: Colors.neonBlue,
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 3,
    marginBottom: 25,
  },
  micStage: {
    width: 150,
    height: 150,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
  },
  micRipple: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: Colors.neonBlue,
  },
  micBtn: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.neonBlue,
    shadowRadius: 20,
    shadowOpacity: 0.6,
    elevation: 20,
    zIndex: 10,
  },
  micBtnActive: {
    backgroundColor: Colors.neonBlue,
    shadowRadius: 30,
    shadowColor: '#FFF',
  },
  micInnerGlow: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FFF',
    shadowRadius: 10,
    shadowOpacity: 0.2,
  },
  synapticBranding: {
    color: 'rgba(255, 255, 255, 0.2)',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
