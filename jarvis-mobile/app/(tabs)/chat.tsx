import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, StyleSheet, TextInput, 
  TouchableOpacity, ScrollView, KeyboardAvoidingView, 
  ActivityIndicator, useWindowDimensions,
  Platform
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Markdown from 'react-native-markdown-display';
import { Colors } from '../../constants/colors';
import Sidebar from '../../components/Sidebar';
import { useAuth } from '../../hooks/auth';
import { API_URL } from '../../constants/config';
import { parseCommand } from '../../lib/commandParser';
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import VoiceModal from '../../components/VoiceModal';

const THINKING_MESSAGES = [
  "JARVIS is thinking...",
  "Processing your request...",
  "Analyzing...",
  "Let me think about that...",
  "Running calculations...",
  "Accessing knowledge base...",
  "Formulating response...",
  "Cross-referencing data...",
  "One moment...",
];

export default function ChatScreen() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const giantTitleSize = width * 0.14 > 64 ? 64 : width * 0.14;
  
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [thinkingMsg, setThinkingMsg] = useState(THINKING_MESSAGES[0]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  // ── Voice Modal State ────────────────────────────────────
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceMessages, setVoiceMessages] = useState<any[]>([]);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [voiceLoading, setVoiceLoading] = useState(false);
  const recordingRef = useRef<Audio.Recording | null>(null);

  // Initialize sessionId
  useEffect(() => {
    if (user && !sessionId) {
      setSessionId('session-' + Math.random().toString(36).slice(2, 9));
    }
  }, [user]);

  // Sync history
  useEffect(() => {
    if (user) syncHistory();
  }, [user]);

  const syncHistory = async () => {
    if (!user) return;
    setIsHistoryLoading(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch(`${API_URL}/api/history`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log("[Sync History] Status:", response.status);
      const data = await response.json();
      console.log("[Sync History] Data count:", data.sessions?.length || 0);
      if (data.sessions) {
        setChatHistory(data.sessions.map((s: any) => ({
          id: s.sessionId,
          title: s.title,
          updatedAt: s.updatedAt
        })));
      }
    } catch (error) {
      console.error("[Sync Error]", error);
    } finally {
      setIsHistoryLoading(false);
    }
  };

  const onSelectChat = async (id: string, title: string) => {
    if (!user) return;
    setSessionId(id);
    setIsSidebarOpen(false);
    setIsThinking(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch(`${API_URL}/api/history?sessionId=${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.messages) {
        setMessages(data.messages.map((m: any, idx: number) => ({
          id: idx.toString(),
          role: m.role,
          content: m.content,
          timestamp: new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        })));
      }
    } catch (error) {
      console.error("[Load Chat Error]", error);
    } finally {
      setIsThinking(false);
    }
  };

  const handleDeleteChat = async (id: string) => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const response = await fetch(`${API_URL}/api/history`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ sessionId: id })
      });
      if (response.ok) {
        setChatHistory(prev => prev.filter(chat => chat.id !== id));
        if (id === sessionId) {
          setMessages([]);
          setSessionId('session-' + Math.random().toString(36).slice(2, 9));
        }
      }
    } catch (error) {
      console.error("[Delete Error]", error);
    }
  };

  const handlePinChat = async (id: string) => {
    if (!user) return;
    const chat = chatHistory.find(c => c.id === id);
    const newPinned = !chat?.pinned;
    
    // Update locally
    setChatHistory(prev => {
      const updated = prev.map(c => 
        c.id === id ? { ...c, pinned: newPinned } : c
      );
      return updated.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));
    });

    try {
      const token = await user.getIdToken();
      await fetch(`${API_URL}/api/history`, {
        method: 'PATCH',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ sessionId: id, pinned: newPinned })
      });
    } catch (e) {
      console.error("[Pin Error]", e);
    }
  };

  const handleRenameChat = async (id: string) => {
    // For now, let's prompt the user or use a simple logic. 
    // In a future update, we can add a dedicated modal.
    console.log("Rename requested:", id);
  };

  // ── VOICE MODAL LOGIC ──────────────────────────────────────
  const toggleVoiceRecording = async () => {
    if (isRecording) {
      await stopRecordingAndProcess();
    } else {
      await startVoiceRecording();
    }
  };

  const startVoiceRecording = async () => {
    try {
      console.log("[Voice] Requesting permissions...");
      const permission = await Audio.requestPermissionsAsync();
      console.log("[Voice] Permission status:", permission.status);
      if (permission.status !== 'granted') {
        setInterimTranscript('Mic permission denied');
        return;
      }

      console.log("[Voice] Configuring Audio Mode...");
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
        staysActiveInBackground: true,
      });

      console.log("[Voice] Starting recording...");
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      recordingRef.current = recording;
      setIsRecording(true);
      setInterimTranscript('Listening...');
      console.log("[Voice] Recording active");
    } catch (err) {
      console.error("[Voice Start]", err);
    }
  };

  const stopRecordingAndProcess = async () => {
    if (!recordingRef.current) return;
    setIsRecording(false);
    setVoiceLoading(true);
    setInterimTranscript('Establishing link...');

    try {
      console.log("[Voice] Stopping recording...");
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      console.log("[Voice] Audio URI:", uri);
      if (!uri) {
        setInterimTranscript('No recording data');
        return;
      }

      const formData = new FormData();
      formData.append('file', {
        uri,
        type: 'audio/m4a',
        name: 'voice.m4a',
      } as any);

      console.log("[Voice] Sending to Whisper API: ", `${API_URL}/api/whisper`);
      const token = await user?.getIdToken();
      const res = await fetch(`${API_URL}/api/whisper`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      console.log("[Voice] Whisper Response Status:", res.status);
      const data = await res.json();
      if (data.text) {
        console.log("[Voice] Transcribed Text:", data.text);
        setInterimTranscript('');
        await handleSendMessage(data.text);
      } else {
        console.log("[Voice] No text returned from Whisper", data);
        setInterimTranscript('Could not clarify voice...');
      }
    } catch (err) {
      console.error("[Voice Process]", err);
    } finally {
      setVoiceLoading(false);
      recordingRef.current = null;
    }
  };

  // Speaker effect whenever assistant sends message during voice mode
  useEffect(() => {
    if (isVoiceModalOpen && messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.role === 'assistant' && lastMsg.content && !isSpeaking) {
        speak(lastMsg.content);
      }
    }
  }, [messages]);

  const speak = (text: string) => {
    setIsSpeaking(true);
    Speech.speak(text, {
      onDone: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
      rate: 1.05,
      pitch: 0.95, // JARVIS typical tone
    });
  };

  const closeVoiceModal = () => {
    setIsVoiceModalOpen(false);
    Speech.stop();
  };

  useEffect(() => {
    if (!isThinking) {
      setThinkingMsg(THINKING_MESSAGES[0]);
      return;
    }
    let i = 0;
    const interval = setInterval(() => {
      i = (i + 1) % THINKING_MESSAGES.length;
      setThinkingMsg(THINKING_MESSAGES[i]);
    }, 2000);
    return () => clearInterval(interval);
  }, [isThinking]);

  const handleSendMessage = async (overrideContent?: string) => {
    const content = overrideContent || input;
    if (!content.trim() || isThinking) return;
    if (!user) return;

    // ── INTERCEPT COMMANDS (Logic Paried with Web) ───────
    const parsed = parseCommand(content);
    if (parsed.isCommand && parsed.command !== 'agent_task') {
      const timestampStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setMessages(prev => [
        ...prev,
        { id: Date.now().toString(), role: 'user', content, timestamp: timestampStr },
        { id: (Date.now() + 1).toString(), role: 'assistant', content: '⚡ Executing on your phone...', timestamp: timestampStr },
      ]);
      setIsThinking(true);
      setInput('');

      try {
        const token = await user.getIdToken();
        const res = await fetch(`${API_URL}/api/android`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ command: parsed.command, params: parsed.params }),
        });
        const data = await res.json();
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            ...updated[updated.length - 1],
            content: data.success ? `✅ ${data.result}` : `❌ ${data.error || 'Bridge offline'}`,
          };
          return updated;
        });
      } catch {
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            ...updated[updated.length - 1],
            content: '❌ Android bridge offline. Ensure the bridge server is running.',
          };
          return updated;
        });
      } finally {
        setIsThinking(false);
      }
      return;
    }
    // ─────────────────────────────────────────────────────

    setInput('');
    const userMessage = content.trim();
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg = { 
      id: Date.now().toString(), 
      role: 'user', 
      content: userMessage, 
      timestamp 
    };
    
    const assistantMsgId = (Date.now() + 1).toString();
    const placeholderMsg = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp
    };

    const isNewSession = messages.length === 0;
    setMessages(prev => [...prev, userMsg, placeholderMsg]);
    setInput('');
    setIsThinking(true);
    console.log("[Chat] Sending message to:", API_URL, "Session:", sessionId);

    try {
      const token = await user.getIdToken();
      
      const response = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          sessionId,
          history: messages.slice(-6).map(m => ({ role: m.role, content: m.content })),
        }),
      });

      if (!response.ok) throw new Error(`API returned ${response.status}`);

      const reader = response.body;
      if (reader && Platform.OS === 'web') {
        const streamReader = (reader as any).getReader();
        const decoder = new TextDecoder();
        let fullContent = '';

        while (true) {
          const { done, value } = await streamReader.read();
          if (done) break;
          
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6).trim();
              if (data === '[DONE]') continue;
              try {
                const parsed = JSON.parse(data);
                if (parsed.content) {
                  fullContent += parsed.content;
                  setMessages(prev => {
                    const next = [...prev];
                    const last = next[next.length - 1];
                    if (last && last.role === 'assistant') {
                      next[next.length - 1] = { ...last, content: fullContent };
                    }
                    return next;
                  });
                }
              } catch (e) {}
            }
          }
        }
      } else {
        // Fallback for native or non-streaming capable web environments
        const text = await response.text();
        const lines = text.split('\n');
        let fullContent = '';
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (data === '[DONE]') continue;
            try {
              const parsed = JSON.parse(data);
              if (parsed.content) fullContent += parsed.content;
            } catch (e) {}
          }
        }
        
        setMessages(prev => {
          const next = [...prev];
          const last = next[next.length - 1];
          if (last && last.role === 'assistant') {
            next[next.length - 1] = { 
              ...last, 
              content: fullContent || "I've processed your request. How else can I help?" 
            };
          }
          return next;
        });
      }
      if (isNewSession) syncHistory();
    } catch (error: any) {
      console.error("[Chat Error]", error);
      const errorMsg = error.message || "Unknown network error";
      setMessages(prev => {
        const next = [...prev];
        const last = next[next.length - 1];
        if (last && last.role === 'assistant') {
          next[next.length - 1] = { 
            ...last, 
            content: `⚠️ Connection to JARVIS core lost (${errorMsg}). Please check your console/network.` 
          };
        }
        return next;
      });
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: Colors.background }]}>

      <View style={[styles.header, { paddingTop: Math.max(insets.top, 45) }]}>
        <TouchableOpacity 
          style={styles.menuButton} 
          onPress={() => setIsSidebarOpen(true)}
        >
          <Ionicons name="menu-outline" size={26} color="rgba(255,255,255,0.6)" />
        </TouchableOpacity>


        <View style={styles.headerActions}>
           <TouchableOpacity style={styles.headerIconBtn}>
             <Ionicons name="add" size={24} color="rgba(255,255,255,0.6)" />
           </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.chatArea}
        contentContainerStyle={[styles.chatContent, messages.length === 0 && { flex: 1 }]}
        ref={scrollViewRef}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={[styles.giantTitle, { fontSize: giantTitleSize }]}>JARVIS</Text>
            <View style={styles.sloganContainer}>
              <Text style={styles.sloganText}>What are you </Text>
              <View>
                <Text style={styles.sloganHighlight}>curious </Text>
                <View style={styles.sloganUnderline} />
              </View>
              <Text style={styles.sloganText}>about today?</Text>
            </View>
            
          </View>
        ) : (
          messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))
        )}

        {isThinking && (
          <View style={styles.thinkingContainer}>
            <View style={styles.brainIcon}>
              <ActivityIndicator size="small" color={Colors.jarvisNeon} />
            </View>
            <View style={styles.thinkingTextContainer}>
              <Text style={styles.thinkingText}>{thinkingMsg}</Text>
              <View style={styles.dotContainer}>
                <View style={styles.dot} />
                <View style={[styles.dot, { opacity: 0.6 }]} />
                <View style={[styles.dot, { opacity: 0.3 }]} />
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <View style={styles.inputWrapper}>
          <View style={styles.inputContainerWeb}>
            <TouchableOpacity style={styles.attachBtnWeb}>
              <Ionicons name="add" size={22} color="rgba(255,255,255,0.4)" />
            </TouchableOpacity>
            
            <TextInput
              style={styles.inputWeb}
              placeholder="Ask anything"
              placeholderTextColor="rgba(255,255,255,0.3)"
              value={input}
              onChangeText={setInput}
              multiline
            />

            <View style={styles.inputActionsRight}>
              <TouchableOpacity style={styles.micBtn}>
                <Ionicons name="mic-outline" size={20} color="rgba(255,255,255,0.4)" />
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.sendBtnWeb, !input.trim() && styles.sendBtnDisabledWeb]}
                onPress={() => handleSendMessage()}
                disabled={!input.trim()}
              >
                <Ionicons name="arrow-up" size={18} color={input.trim() ? "#FFF" : "rgba(255,255,255,0.2)"} />
              </TouchableOpacity>
            </View>
          </View>
          <Text style={styles.footerText}>JARVIS can make mistakes. Verify important info.</Text>
        </View>
      </KeyboardAvoidingView>

      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)}
        onNewChat={() => {
          setMessages([]);
          setSessionId('session-' + Math.random().toString(36).slice(2, 9));
          setIsSidebarOpen(false);
        }}
        onSelectChat={onSelectChat}
        recentChats={chatHistory}
        isHistoryLoading={isHistoryLoading}
        activeSessionId={sessionId}
        onDeleteChat={handleDeleteChat}
        onPinChat={handlePinChat}
        onRenameChat={handleRenameChat}
        onVoicePress={() => {
          setIsVoiceModalOpen(true);
          setIsSidebarOpen(false);
        }}
      />

      <VoiceModal 
        isOpen={isVoiceModalOpen}
        onClose={closeVoiceModal}
        isVoiceRecording={isRecording}
        isSpeaking={isSpeaking}
        voiceLoading={voiceLoading}
        voiceMessages={messages.slice(-6)} // Show last few pairs
        onToggleRecording={toggleVoiceRecording}
        interimTranscript={interimTranscript}
      />
    </View>
  );
}

function MessageBubble({ message }: any) {
  const isUser = message.role === 'user';
  
  return (
    <View style={[styles.messageContainer, isUser ? styles.userContainer : styles.assistantContainer]}>
      <View style={[styles.bubble, isUser ? styles.userBubble : styles.assistantBubble]}>
        <View style={styles.bubbleContent}>
          <Markdown style={markdownStyles}>
            {message.content}
          </Markdown>
        </View>

        <View style={[styles.actions, isUser ? styles.userActions : styles.assistantActions]}>
          {!isUser && (
            <>
              <TouchableOpacity style={styles.actionBtn}>
                <Ionicons name="copy-outline" size={13} color="rgba(255,255,255,0.15)" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn}>
                <Ionicons name="refresh-outline" size={13} color="rgba(255,255,255,0.15)" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn}>
                <Ionicons name="thumbs-up-outline" size={13} color="rgba(255,255,255,0.15)" />
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: 5,
    paddingVertical: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  menuButton: {
    padding: 4,
    zIndex: 10,
  },
  headerLogo: {
    flex: 1,
    alignItems: 'center',
    marginLeft: 10,
  },
  logoTextWeb: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 4,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIconBtn: {
    padding: 4,
  },
  chatArea: {
    flex: 1,
  },
  chatContent: {
    padding: 16,
    paddingBottom: 40,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 60,
  },
  giantTitle: {
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: -2,
    opacity: 0.9,
    textShadowColor: 'rgba(0, 210, 255, 0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 25,
  },
  sloganContainer: {
    flexDirection: 'row',
    marginTop: 2,
    alignItems: 'center',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  sloganText: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 16,
    fontWeight: '300',
  },
  sloganHighlight: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    fontStyle: 'italic',
  },
  sloganUnderline: {
    height: 1.5,
    backgroundColor: Colors.neonBlue,
    opacity: 0.6,
    marginTop: -2,
    width: '100%',
  },
  emptyAura: {
    marginTop: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  auraCore: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(0, 210, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 210, 255, 0.08)',
    shadowColor: Colors.neonBlue,
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 24,
    maxWidth: '96%',
  },
  userContainer: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
  },
  assistantContainer: {
    alignSelf: 'flex-start',
  },
  avatarContainer: {
    marginTop: 4,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatar: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    marginLeft: 10,
  },
  assistantAvatar: {
    backgroundColor: 'rgba(0, 229, 255, 0.12)',
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.25)',
  },
  bubble: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 18,
  },
  userBubble: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderBottomRightRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  assistantBubble: {
    backgroundColor: 'transparent',
  },
  bubbleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  senderName: {
    fontSize: 11,
    fontWeight: '900',
    color: 'rgba(255, 255, 255, 0.3)',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  timestamp: {
    fontSize: 9,
    color: 'rgba(255, 255, 255, 0.2)',
  },
  bubbleContent: {
  },
  actions: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 12,
  },
  userActions: {
    justifyContent: 'flex-end',
  },
  assistantActions: {
    justifyContent: 'flex-start',
  },
  actionBtn: {
    padding: 6,
    opacity: 0.8,
  },
  thinkingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginLeft: 4,
  },
  brainIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 229, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thinkingTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  thinkingText: {
    color: 'rgba(255, 255, 255, 0.45)',
    fontSize: 13,
    fontStyle: 'italic',
  },
  dotContainer: {
    flexDirection: 'row',
    gap: 3,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: Colors.jarvisNeon,
  },
  inputWrapper: {
    paddingHorizontal: 12,
    paddingTop: 10,
    backgroundColor: Colors.background,
  },
  inputContainerWeb: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 24,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  attachBtnWeb: {
    padding: 8,
  },
  inputWeb: {
    flex: 1,
    color: '#FFF',
    fontSize: 15,
    maxHeight: 120,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  inputActionsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  micBtn: {
    padding: 8,
  },
  sendBtnWeb: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.neonBlue,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.neonBlue,
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  sendBtnDisabledWeb: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    shadowOpacity: 0,
    elevation: 0,
  },
  footerText: {
    textAlign: 'center',
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 9,
    marginTop: 1,
    marginBottom: 3,
  }
});

const markdownStyles = {
  body: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 15,
    lineHeight: 22,
  },
  link: {
    color: Colors.jarvisNeon,
  },
  code_inline: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    color: Colors.jarvisNeon,
    borderRadius: 4,
    paddingHorizontal: 4,
  },
  code_block: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 8,
    padding: 12,
    color: '#A9B1D6',
    marginVertical: 10,
  },
  fence: {
    backgroundColor: '#1A1B26',
    borderRadius: 8,
    padding: 12,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
};
