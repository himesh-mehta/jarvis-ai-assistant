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
  const giantTitleSize = width * 0.15 > 64 ? 64 : width * 0.15;
  
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [thinkingMsg, setThinkingMsg] = useState(THINKING_MESSAGES[0]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

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
      const data = await response.json();
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

  const handleSendMessage = async () => {
    if (!input.trim() || isThinking || !user) return;
    
    const userMessage = input.trim();
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

      const reader = response.body as any;
      if (reader && typeof reader.getReader === 'function') {
        const streamReader = reader.getReader();
        const decoder = new TextDecoder();
        let fullContent = '';

        while (true) {
          const { done, value } = await streamReader.read();
          if (done) break;
          
          const chunk = decoder.decode(value);
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
            next[next.length - 1] = { ...last, content: fullContent || "Understood. How else can I assist you?" };
          }
          return next;
        });
      }
      if (isNewSession) syncHistory();
    } catch (error) {
      console.error("[Chat Error]", error);
      setMessages(prev => {
        const next = [...prev];
        const last = next[next.length - 1];
        if (last && last.role === 'assistant') {
          next[next.length - 1] = { ...last, content: "⚠️ Connection to JARVIS core lost. Please check your network." };
        }
        return next;
      });
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: Colors.background }]}>
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
      />

      <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) }]}>
        <TouchableOpacity 
          style={styles.menuButton} 
          onPress={() => setIsSidebarOpen(true)}
        >
          <Ionicons name="menu-outline" size={24} color="#FFF" />
        </TouchableOpacity>

        <View style={styles.headerLogo}>
          <View style={styles.logoPill}>
            <Text style={styles.logoText}>JARVIS</Text>
          </View>
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
              <Text style={styles.sloganHighlight}>curious </Text>
              <Text style={styles.sloganText}>about today?</Text>
            </View>
            <View style={styles.emptyAura}>
              <View style={styles.auraRing} />
              <View style={styles.auraCore}>
                <Ionicons name="hardware-chip" size={16} color="rgba(255,255,255,0.2)" />
              </View>
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
        <View style={[styles.inputWrapper, { paddingBottom: Math.max(insets.bottom, 15) }]}>
          <View style={styles.inputContainer}>
            <TouchableOpacity style={styles.attachBtn}>
              <Ionicons name="add" size={24} color="rgba(255,255,255,0.4)" />
            </TouchableOpacity>
            
            <TextInput
              style={styles.input}
              placeholder="Message JARVIS..."
              placeholderTextColor="rgba(255,255,255,0.3)"
              value={input}
              onChangeText={setInput}
              multiline
            />

            <TouchableOpacity 
              style={[styles.sendBtn, !input.trim() && styles.sendBtnDisabled]}
              onPress={handleSendMessage}
              disabled={!input.trim()}
            >
              <Ionicons name="arrow-up" size={20} color={input.trim() ? "#000" : "rgba(255,255,255,0.2)"} />
            </TouchableOpacity>
          </View>
          <Text style={styles.footerText}>JARVIS can make mistakes. Verify important info.</Text>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

function MessageBubble({ message }: any) {
  const isUser = message.role === 'user';
  
  return (
    <View style={[styles.messageContainer, isUser ? styles.userContainer : styles.assistantContainer]}>
      <View style={styles.avatarContainer}>
        <View style={[styles.avatar, isUser ? styles.userAvatar : styles.assistantAvatar]}>
          {isUser ? (
            <Ionicons name="person" size={14} color="#FFF" />
          ) : (
            <MaterialCommunityIcons name="robot" size={14} color={Colors.jarvisNeon} />
          )}
        </View>
      </View>
      
      <View style={[styles.bubble, isUser ? styles.userBubble : styles.assistantBubble]}>
        <View style={styles.bubbleHeader}>
          <Text style={styles.senderName}>{isUser ? 'You' : 'JARVIS'}</Text>
          <Text style={styles.timestamp}>{message.timestamp}</Text>
        </View>
        
        <View style={styles.bubbleContent}>
          <Markdown style={markdownStyles}>
            {message.content}
          </Markdown>
        </View>

        <View style={[styles.actions, isUser ? styles.userActions : styles.assistantActions]}>
          <TouchableOpacity style={styles.actionBtn}>
            <Ionicons name="copy-outline" size={12} color="rgba(255,255,255,0.2)" />
          </TouchableOpacity>
          {!isUser && (
            <>
              <TouchableOpacity style={styles.actionBtn}>
                <Ionicons name="refresh-outline" size={12} color="rgba(255,255,255,0.2)" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn}>
                <Ionicons name="thumbs-up-outline" size={12} color="rgba(255,255,255,0.2)" />
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
    paddingHorizontal: 15,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  menuButton: {
    padding: 8,
    zIndex: 10,
  },
  headerLogo: {
    flex: 1,
    alignItems: 'center',
    marginRight: 40,
  },
  logoPill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  logoText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
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
    paddingBottom: 80,
  },
  giantTitle: {
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: -1,
    opacity: 0.9,
    textShadowColor: 'rgba(0, 210, 255, 0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  sloganContainer: {
    flexDirection: 'row',
    marginTop: 15,
    alignItems: 'center',
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
  emptyAura: {
    marginTop: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  auraRing: {
    width: 60,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  auraCore: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(2, 6, 23, 1)',
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 24,
    maxWidth: '90%',
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
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginLeft: 10,
  },
  assistantAvatar: {
    backgroundColor: 'rgba(0, 229, 255, 0.1)',
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.2)',
  },
  bubble: {
    padding: 12,
    borderRadius: 18,
  },
  userBubble: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderBottomRightRadius: 4,
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
    fontSize: 12,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.4)',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  timestamp: {
    fontSize: 10,
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
    padding: 4,
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
    backgroundColor: 'rgba(0, 229, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thinkingTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  thinkingText: {
    color: 'rgba(255, 255, 255, 0.4)',
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
    padding: 12,
    paddingBottom: Platform.OS === 'ios' ? 30 : 15,
    backgroundColor: Colors.background,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 24,
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  attachBtn: {
    padding: 8,
  },
  input: {
    flex: 1,
    color: '#FFF',
    fontSize: 15,
    maxHeight: 120,
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 8,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.jarvisNeon,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  sendBtnDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  footerText: {
    textAlign: 'center',
    color: 'rgba(255, 255, 255, 0.2)',
    fontSize: 10,
    marginTop: 8,
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
