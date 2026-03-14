import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TextInput,
  TouchableOpacity, ScrollView, KeyboardAvoidingView,
  ActivityIndicator, useWindowDimensions,
  Platform, Image, Modal, Linking, Dimensions, Alert
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
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
  const params = useLocalSearchParams();
  const router = useRouter();
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
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [mediaViewer, setMediaViewer] = useState<{uri: string; type: 'image'|'file'; name?: string} | null>(null);

  // Handle session from params
  useEffect(() => {
    if (user && params.new === 'true') {
      setMessages([]);
      setSessionId('session-' + Math.random().toString(36).slice(2, 9));
      router.setParams({ new: undefined }); // Clear the param
    } else if (user && params.sessionId) {
      onSelectChat(params.sessionId as string, params.title as string);
    } else if (user && !sessionId) {
      setSessionId('session-' + Math.random().toString(36).slice(2, 9));
    }

    if (params.voice === 'true') {
      setIsVoiceModalOpen(true);
      router.setParams({ voice: undefined });
    }
  }, [user, params.sessionId, params.new, params.voice]);

  // Sync history
  useEffect(() => {
    if (user) {
      syncHistory();
      // Prepare Audio mode early for faster voice response
      Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
        staysActiveInBackground: false,
      }).catch(e => console.log("[Audio Init Error]", e));
    }
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
    if (!user) return;
    const currentChat = chatHistory.find(c => c.id === id);
    
    Alert.prompt(
      "Rename Transmission",
      "Assign new designation",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Update", 
          onPress: async (newTitle: string | undefined) => {
            if (!newTitle) return;
            try {
              const token = await user.getIdToken();
              const response = await fetch(`${API_URL}/api/history`, {
                method: 'PUT',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({ sessionId: id, title: newTitle })
              });
              if (response.ok) {
                setChatHistory(prev => prev.map(c => 
                  c.id === id ? { ...c, title: newTitle } : c
                ));
              }
            } catch (error) {
              console.error("[Rename Error]", error);
            }
          }
        }
      ],
      "plain-text",
      currentChat?.title
    );
  };

  const startNewChat = () => {
    setMessages([]);
    setAttachments([]);
    setSessionId('session-' + Math.random().toString(36).slice(2, 9));
    setIsSidebarOpen(false);
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      const newAttachments = result.assets.map(asset => ({
        uri: asset.uri,
        name: asset.fileName || `image-${Date.now()}.jpg`,
        type: 'image',
      }));
      setAttachments(prev => [...prev, ...newAttachments]);
    }
  };

  const pickDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: '*/*',
      multiple: true,
    });

    if (!result.canceled) {
      const newAttachments = result.assets.map(asset => ({
        uri: asset.uri,
        name: asset.name,
        type: 'file',
      }));
      setAttachments(prev => [...prev, ...newAttachments]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
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
      console.log("[Voice] Configuring Audio Mode...");
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
        staysActiveInBackground: false,
      });

      console.log("[Voice] Requesting permissions...");
      const { status } = await Audio.requestPermissionsAsync();
      console.log("[Voice] Permission status:", status);
      
      if (status !== 'granted') {
        Alert.alert("Permission Required", "Microphone access is needed for JARVIS to hear you.");
        setInterimTranscript('Mic permission denied');
        return;
      }

      console.log("[Voice] Starting recording...");
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      recordingRef.current = recording;
      setIsRecording(true);
      setInterimTranscript('Listening...');
      console.log("[Voice] Recording active");
    } catch (err: any) {
      console.error("[Voice Start]", err);
      Alert.alert("Recording Error", err.message || "Failed to start neural link");
    }
  };

  const stopRecordingAndProcess = async () => {
    if (!recordingRef.current) return;
    setIsRecording(false);
    setVoiceLoading(true);
    setInterimTranscript('Decrypting audio signal...');

    try {
      console.log("[Voice] Stopping recording...");
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      console.log("[Voice] Audio URI:", uri);
      
      if (!uri) {
        setInterimTranscript('Neural link failed: No data');
        return;
      }

      const formData = new FormData();
      // Ensure Android URI is compatible
      const finalUri = Platform.OS === 'android' ? uri : uri.replace('file://', '');
      
      formData.append('file', {
        uri: finalUri,
        type: 'audio/m4a',
        name: 'voice.m4a',
      } as any);

      console.log("[Voice] Sending to Whisper API: ", `${API_URL}/api/whisper`);
      setInterimTranscript('Transcribing neural patterns...');
      
      const token = await user?.getIdToken();
      const res = await fetch(`${API_URL}/api/whisper`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) {
        console.log(`[Voice Fail] 404/Error at: ${API_URL}/api/whisper`);
        throw new Error(`Whisper API error: ${res.status}`);
      }

      const data = await res.json();
      if (data.text) {
        console.log("[Voice] Transcribed Text:", data.text);
        setInterimTranscript(data.text); // Show what was recognized

        if (isVoiceModalOpen) {
          // Keep transcript visible while JARVIS thinks
          await handleSendMessage(data.text);
        } else {
          setInput(prev => prev + (prev.length > 0 ? ' ' : '') + data.text);
          setInterimTranscript('');
        }
      } else {
        setInterimTranscript('Could not clarify voice... try again');
      }
    } catch (err: any) {
      console.error("[Voice Process]", err);
      setInterimTranscript(`Link error: ${err.message}`);
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
  }, [messages, isVoiceModalOpen]);

  const speak = async (text: string) => {
    try {
      setIsSpeaking(true);
      await Speech.stop(); // Clear any existing speech
      Speech.speak(text, {
        onDone: () => setIsSpeaking(false),
        onStopped: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false),
        rate: 1.05,
        pitch: 0.95, 
      });
    } catch (e) {
      setIsSpeaking(false);
    }
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
    if ((!content.trim() && attachments.length === 0) || isThinking) return;

    console.log("[Chat] handleSendMessage triggered. Content length:", content.length, "Attachments:", attachments.length);
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

    const userMessage = content.trim();
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const currentAttachments = [...attachments];

    // Add messages to local state for instant UI update
    const userMsg = {
      id: Date.now().toString(),
      role: 'user',
      content: userMessage || (currentAttachments.length > 0 ? "Uploaded an attachment" : ""),
      timestamp,
      attachments: currentAttachments
    };

    const assistantMsgId = (Date.now() + 1).toString();
    const placeholderMsg = { id: assistantMsgId, role: 'assistant', content: '', timestamp };

    const isNewSession = messages.length === 0;
    setMessages(prev => [...prev, userMsg, placeholderMsg]);
    setAttachments([]); // Clear picker row
    setIsThinking(true);
    setInput('');

    try {
      const token = await user.getIdToken();
      let response;

      const imageAtt = currentAttachments.find(a => a.type === 'image');
      const fileAtt = currentAttachments.find(a => !imageAtt && a.type === 'file');

      if (imageAtt) {
        // Multi-modal Vision Pipeline
        console.log("[Chat] Calling Multi-Modal Vision Bridge with image:", imageAtt.name);
        const formData = new FormData();
        const fileObj = {
          uri: Platform.OS === 'android' ? imageAtt.uri : imageAtt.uri.replace('file://', ''),
          type: 'image/jpeg',
          name: imageAtt.name || 'image.jpg',
        } as any;

        formData.append('image', fileObj);
        formData.append('message', userMessage || "What is in this image?");
        formData.append('sessionId', sessionId);
        formData.append('history', JSON.stringify(messages.slice(-6).map(m => ({ role: m.role, content: m.content }))));

        response = await fetch(`${API_URL}/api/vision`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData,
        });
      } else if (fileAtt) {
        // Document Processing Pipeline
        console.log("[Chat] Calling Document Processing Bridge with file:", fileAtt.name);
        const formData = new FormData();
        const fileObj = {
          uri: Platform.OS === 'android' ? fileAtt.uri : fileAtt.uri.replace('file://', ''),
          type: 'application/pdf',
          name: fileAtt.name || 'document.pdf',
        } as any;

        formData.append('file', fileObj);
        formData.append('sessionId', sessionId);

        response = await fetch(`${API_URL}/api/upload`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData,
        });
      } else {
        // Standard Neural Pipeline
        response = await fetch(`${API_URL}/api/chat`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: userMessage || "Analyze context",
            sessionId,
            history: messages.slice(-6).map(m => ({ role: m.role, content: m.content })),
          }),
        });
      }

      if (!response.ok) throw new Error(`API returned ${response.status}`);

      const reader = response.body;
      const contentType = response.headers.get('Content-Type') || '';

      if (reader && contentType.includes('text/event-stream') && Platform.OS === 'web') {
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
              const dataStr = line.slice(6).trim();
              if (dataStr === '[DONE]') continue;
              try {
                const parsed = JSON.parse(dataStr);

                // If vision API sends the remote URL first
                if (parsed.imageUrl) {
                  setMessages(prev => {
                    const next = [...prev];
                    const userIdx = next.length - 2;
                    if (userIdx >= 0 && next[userIdx].role === 'user') {
                      next[userIdx] = { ...next[userIdx], imageUrl: parsed.imageUrl };
                    }
                    return next;
                  });
                }

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
              } catch (e) { }
            }
          }
        }
      } else {
        // Fallback or Native/Upload non-streaming response
        const text = await response.text();

        // Handle direct JSON (Upload / Error)
        if (text.trim().startsWith('{')) {
          try {
            const data = JSON.parse(text);
            if (data.success || data.content) {
              setMessages(prev => {
                const next = [...prev];
                const lastIdx = next.length - 1;
                const userIdx = next.length - 2;

                if (next[lastIdx] && next[lastIdx].role === 'assistant') {
                  next[lastIdx] = {
                    ...next[lastIdx],
                    content: data.content || (data.pdfChunks ? `📄 Indexing complete. Processed ${data.pdfChunks} chunks.` : `✅ File ${data.fileName || 'uploaded'} successfully.`)
                  };
                }
                if (userIdx >= 0 && next[userIdx].role === 'user') {
                  next[userIdx] = {
                    ...next[userIdx],
                    imageUrl: data.imageUrl || data.url || next[userIdx].imageUrl,
                    fileUrl: data.url || next[userIdx].fileUrl,
                    fileName: data.fileName || next[userIdx].fileName
                  };
                }
                return next;
              });
              setIsThinking(false);
              if (isNewSession) syncHistory();
              return;
            }
          } catch (e) { }
        }

        const lines = text.split('\n');
        let fullContent = '';
        let remoteImageUrl = '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6).trim();
            if (dataStr === '[DONE]') continue;
            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.imageUrl) remoteImageUrl = parsed.imageUrl;
              if (parsed.content) fullContent += parsed.content;
            } catch (e) { }
          }
        }

        setMessages(prev => {
          const next = [...prev];
          const lastIdx = next.length - 1;
          const userIdx = next.length - 2;
          if (next[lastIdx]) {
            next[lastIdx] = {
              ...next[lastIdx],
              content: fullContent || "I've analyzed your request."
            };
          }
          if (remoteImageUrl && userIdx >= 0 && next[userIdx].role === 'user') {
            next[userIdx] = { ...next[userIdx], imageUrl: remoteImageUrl };
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

      <View style={[styles.header, { paddingTop: Math.max(insets.top, 50) }]}>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => setIsSidebarOpen(true)}
        >
          <Ionicons name="menu-outline" size={26} color="rgba(255,255,255,0.6)" />
        </TouchableOpacity>

        <View style={styles.headerLogo}>
          <Text style={styles.logoText}>
            <Text style={{ color: Colors.jarvisNeon }}>JAR</Text>
            <Text style={{ color: Colors.neonPurple }}>VIS</Text>
          </Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerIconBtn} onPress={startNewChat}>
            <Ionicons name="add" size={24} color="rgba(255,255,255,0.6)" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.chatArea}
        contentContainerStyle={[styles.chatContent, messages.length === 0 && { flex: 1 }]}
        ref={scrollViewRef}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        keyboardShouldPersistTaps="handled"
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
            <MessageBubble key={msg.id} message={msg} onOpenMedia={setMediaViewer} />
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
          {attachments.length > 0 && (
            <View style={styles.attachmentScrollContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.attachmentRow} keyboardShouldPersistTaps="handled">
                {attachments.map((file, idx) => (
                  <View key={idx} style={styles.attachmentPreview}>
                    {file.type === 'image' ? (
                      <Image source={{ uri: file.uri }} style={styles.previewImage} />
                    ) : (
                      <View style={styles.previewFileIcon}>
                        <Ionicons name="document-text-outline" size={20} color={Colors.neonPurple} />
                      </View>
                    )}
                    <TouchableOpacity style={styles.removeBtn} onPress={() => removeAttachment(idx)}>
                      <Ionicons name="close-circle" size={18} color={Colors.error} />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          <View style={styles.inputContainerWeb}>
            {showAttachMenu && (
              <View style={styles.attachMenu}>
                <TouchableOpacity style={styles.attachMenuItem} onPress={() => { setShowAttachMenu(false); pickImage(); }}>
                  <Ionicons name="image-outline" size={20} color={Colors.jarvisNeon} />
                  <Text style={styles.attachMenuText}>Add photo</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.attachMenuItem} onPress={() => { setShowAttachMenu(false); pickDocument(); }}>
                  <MaterialCommunityIcons name="file-upload-outline" size={20} color={Colors.neonPurple} />
                  <Text style={styles.attachMenuText}>Add File</Text>
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity
              style={styles.attachBtnWeb}
              onPress={() => setShowAttachMenu(!showAttachMenu)}
            >
              <Ionicons name="add" size={22} color="rgba(255,255,255,0.4)" />
            </TouchableOpacity>

            <TextInput
              style={styles.inputWeb}
              placeholder={isRecording && !isVoiceModalOpen ? "Listening..." : voiceLoading && !isVoiceModalOpen ? "Transcribing..." : "Ask anything"}
              placeholderTextColor="rgba(255,255,255,0.3)"
              value={input}
              onChangeText={setInput}
              multiline
            />

            <View style={styles.inputActionsRight}>
              <TouchableOpacity
                style={styles.micBtn}
                onPress={toggleVoiceRecording}
              >
                {isRecording && !isVoiceModalOpen ? (
                  <ActivityIndicator size="small" color={Colors.jarvisNeon} />
                ) : (
                  <Ionicons
                    name={isRecording && !isVoiceModalOpen ? "mic" : "mic-outline"}
                    size={20}
                    color={isRecording && !isVoiceModalOpen ? Colors.jarvisNeon : "rgba(255,255,255,0.4)"}
                  />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.sendBtnWeb, (!input.trim() && attachments.length === 0) && styles.sendBtnDisabledWeb]}
                onPress={() => handleSendMessage()}
                disabled={!input.trim() && attachments.length === 0}
              >
                <Ionicons
                  name="arrow-up"
                  size={18}
                  color={(input.trim() || attachments.length > 0) ? "#FFF" : "rgba(255,255,255,0.2)"}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* ── Media Viewer Modal ─────────────────────────── */}
      <Modal
        visible={!!mediaViewer}
        transparent
        animationType="fade"
        onRequestClose={() => setMediaViewer(null)}
      >
        <View style={styles.mediaViewerOverlay}>
          <TouchableOpacity style={styles.mediaViewerClose} onPress={() => setMediaViewer(null)}>
            <Ionicons name="close" size={28} color="#FFF" />
          </TouchableOpacity>
          {mediaViewer?.type === 'image' ? (
            <Image
              source={{ uri: mediaViewer.uri }}
              style={styles.mediaViewerImage}
              resizeMode="contain"
            />
          ) : (
            <View style={styles.mediaViewerFile}>
              <Ionicons name="document-text" size={64} color={Colors.neonPurple} />
              <Text style={styles.mediaViewerFileName}>{mediaViewer?.name || 'File'}</Text>
              <TouchableOpacity
                style={styles.mediaViewerOpenBtn}
                onPress={() => mediaViewer?.uri && Linking.openURL(mediaViewer.uri)}
              >
                <Text style={styles.mediaViewerOpenText}>Open File</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>

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

function MessageBubble({ message, onOpenMedia }: { message: any; onOpenMedia?: (m: {uri:string;type:'image'|'file';name?:string}) => void }) {
  const isUser = message.role === 'user';

  return (
    <View style={[styles.messageContainer, isUser ? styles.userContainer : styles.assistantContainer]}>
      <View style={[styles.bubble, isUser ? styles.userBubble : styles.assistantBubble]}>

        {/* Attachment rendering */}
        {(message.attachments?.length > 0 || message.imageUrl || message.fileUrl) && (
          <View style={styles.bubbleAttachments}>
            {message.attachments?.map((att: any, idx: number) => (
              <TouchableOpacity
                key={idx}
                style={styles.bubbleAttachmentItem}
                onPress={() => onOpenMedia?.({ uri: att.uri, type: att.type === 'image' ? 'image' : 'file', name: att.name })}
                activeOpacity={0.8}
              >
                {att.type === 'image' ? (
                  <Image source={{ uri: att.uri }} style={styles.bubbleAttachmentImage} />
                ) : (
                  <View style={styles.bubbleAttachmentFile}>
                    <Ionicons name="document-text-outline" size={20} color={Colors.neonPurple} />
                    <Text style={styles.bubbleAttachmentFileName} numberOfLines={1}>{decodeURIComponent(att.name || '')}</Text>
                    <Ionicons name="chevron-forward-outline" size={16} color="rgba(255,255,255,0.4)" />
                  </View>
                )}
              </TouchableOpacity>
            ))}
            {message.imageUrl && !message.attachments?.length && (
              <TouchableOpacity onPress={() => onOpenMedia?.({ uri: message.imageUrl, type: 'image' })} activeOpacity={0.8} style={styles.bubbleAttachmentItem}>
                <Image source={{ uri: message.imageUrl }} style={styles.bubbleAttachmentImage} />
              </TouchableOpacity>
            )}
            {message.fileUrl && !message.attachments?.length && (
              <TouchableOpacity onPress={() => onOpenMedia?.({ uri: message.fileUrl, type: 'file', name: message.fileName })} activeOpacity={0.8}>
                <View style={styles.bubbleAttachmentFile}>
                  <Ionicons name="document-text-outline" size={20} color={Colors.neonPurple} />
                  <Text style={styles.bubbleAttachmentFileName} numberOfLines={1}>{decodeURIComponent(message.fileName || 'File')}</Text>
                  <Ionicons name="chevron-forward-outline" size={16} color="rgba(255,255,255,0.4)" />
                </View>
              </TouchableOpacity>
            )}
          </View>
        )}

        <View style={styles.bubbleContent}>
          <Markdown style={markdownStyles}>
            {message.content}
          </Markdown>
        </View>

        {!isUser && (
          <View style={styles.actions}>
            <TouchableOpacity style={styles.actionBtn}>
              <Ionicons name="copy-outline" size={16} color="rgba(255,255,255,0.7)" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn}>
              <Ionicons name="refresh-outline" size={16} color="rgba(255,255,255,0.7)" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn}>
              <Ionicons name="thumbs-up-outline" size={16} color="rgba(255,255,255,0.7)" />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050a14', // Deeper background
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
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 20,
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
    paddingHorizontal: 4, // Extremely tight as requested
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
    marginBottom: 1, // Reduced from 24
    maxWidth: '96%',
  },
  userContainer: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
    marginRight: 8,
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
    marginRight: 6, // Reduced from 10
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.25)',
  },
  bubble: {
    paddingHorizontal: 14,
    paddingVertical: 6, // Reduced height
    borderRadius: 18,
  },
  userBubble: {
    backgroundColor: '#0c1d3c', // Deep navy
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
  bubbleFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 2,
  },
  timestampText: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.3)',
  },
  bubbleContent: {
  },
  actions: {
    flexDirection: 'row',
    marginTop: 4, // Reduced from 8
    gap: 4,       // Reduced from 12
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
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    backgroundColor: 'transparent',
  },
  inputContainerWeb: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 28,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
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
  },
  // ── Custom Attachment Menu ──────────────────────────────
  attachMenu: {
    position: 'absolute',
    bottom: 50,
    left: 10,
    backgroundColor: '#0a0f1d',
    borderRadius: 16,
    padding: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
    zIndex: 1000,
    minWidth: 150,
  },
  attachMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 12,
  },
  attachMenuText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  // ── Attachment Previews ──────────────────────────────
  attachmentScrollContainer: {
    marginBottom: 8,
  },
  attachmentRow: {
    gap: 12,
    paddingHorizontal: 4,
  },
  attachmentPreview: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  previewFileIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeBtn: {
    position: 'absolute',
    top: -2,
    right: -2,
    zIndex: 10,
    backgroundColor: '#050a14',
    borderRadius: 10,
  },
  bubbleAttachments: {
    gap: 8,
    marginBottom: 8,
  },
  bubbleAttachmentItem: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  bubbleAttachmentImage: {
    width: 250,
    height: 180,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  bubbleAttachmentFile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  bubbleAttachmentFileName: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  // ── Media Viewer ─────────────────────────────────────────
  mediaViewerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaViewerClose: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
  },
  mediaViewerImage: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height * 0.75,
  },
  mediaViewerFile: {
    alignItems: 'center',
    gap: 16,
    padding: 30,
  },
  mediaViewerFileName: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  mediaViewerOpenBtn: {
    marginTop: 10,
    backgroundColor: Colors.neonBlue,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 24,
  },
  mediaViewerOpenText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 15,
  },
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
