"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { Menu, PanelLeft, Plus, Terminal } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Sidebar } from "@/components/Sidebar";
import { ChatInterface } from "@/components/ChatInterface";
import { InputPanel } from "@/components/InputPanel";
import dynamic from "next/dynamic";
const ParticleBackground = dynamic(() => import("@/components/ParticleBackground"), { ssr: false });
const AdvancedControls = dynamic(() => import("@/components/AdvancedControls").then(m => m.AdvancedControls), { ssr: false });
const AnalyticsDashboard = dynamic(() => import("@/components/AnalyticsDashboard").then(m => m.AnalyticsDashboard), { ssr: false });
const SettingsModal = dynamic(() => import("@/components/SettingsModal").then(m => m.SettingsModal), { ssr: false });
const AuthModal = dynamic(() => import("@/components/AuthModal").then(m => m.AuthModal), { ssr: false });
const VoiceModal = dynamic(() => import("@/components/VoiceModal").then(m => m.VoiceModal), { ssr: false });
import { useAuth } from "@/context/AuthContext";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

export default function Home() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isControlsOpen, setIsControlsOpen] = useState(false);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const { user, loading: authLoading } = useAuth();

  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [chatHistoryList, setChatHistoryList] = useState<{ id: string; title: string; pinned?: boolean }[]>([]);

  const userPrompts = useMemo(() =>
    messages.filter(m => m.role === 'user'),
    [messages]);

  const abortControllerRef = useRef<AbortController | null>(null);

  // ── Voice State ──────────────────────────────────────────
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const [isVoiceRecording, setIsVoiceRecording] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (!isVoiceRecording) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
      setInterimTranscript("");
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    let finalTranscript = "";

    recognition.onresult = (event: any) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          if (!isVoiceOpen) {
            setInput(prev => prev + (prev.endsWith(" ") || !prev ? "" : " ") + transcript.trim());
          } else {
            finalTranscript += transcript + " ";
          }
        } else {
          interim += transcript;
        }
      }
      setInterimTranscript(interim);
    };

    recognition.onend = () => {
      if (isVoiceOpen && finalTranscript.trim()) {
        handleSendMessage(finalTranscript.trim());
      }
      setIsVoiceRecording(false);
    };

    recognition.start();
    recognitionRef.current = recognition;

    return () => { recognition.stop(); };
  }, [isVoiceRecording]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsSidebarCollapsed(true);
      } else {
        setIsSidebarCollapsed(false);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (user) {
      // Only set a new session ID if one doesn't exist (to preserve chat during auth if possible)
      if (!sessionId) {
        setSessionId('session-' + Math.random().toString(36).slice(2, 9));
      }
    } else if (!authLoading) {
      setSessionId('');
      setMessages([]);
      setChatHistoryList([]);
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (!user || authLoading) return;
    syncHistory();
  }, [user, authLoading]);

  const syncHistory = async () => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/history', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 204) return;
      const text = await res.text();
      if (!text) return;
      const data = JSON.parse(text);
      if (data.sessions) {
        setChatHistoryList(
          data.sessions.map((s: any) => ({
            id: s.sessionId,
            title: s.title || 'New Chat',
            pinned: s.pinned || false,
            updatedAt: s.updatedAt
          }))
        );
      }
    } catch (e) {
      console.error('History sync failed:', e);
    }
  };

   const handleSelectChat = async (id: string, title: string) => {
    if (!user) return;
    setSessionId(id);
    setIsHistoryLoading(true);
    // Don't clear messages immediately to avoid jarring empty state
    setIsMobileMenuOpen(false);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/history?sessionId=${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.messages?.length > 0) {
        setMessages(
          data.messages.map((m: any, i: number) => ({
            ...m,
            id: m._id || `${id}-${i}`,
            timestamp: new Date(m.timestamp).toLocaleTimeString([], {
              hour: '2-digit', minute: '2-digit',
            }),
          }))
        );
      } else {
        setMessages([]);
      }
    } catch (e) {
      console.error('Load chat failed:', e);
      setMessages([]);
    } finally {
      setIsHistoryLoading(false);
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setSessionId('session-' + Math.random().toString(36).slice(2, 9));
    setIsLoading(false);
    setIsMobileMenuOpen(false);
  };

  const handleDeleteChat = async (id: string) => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      await fetch('/api/history', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: id }),
      });
      setChatHistoryList(prev => prev.filter(c => c.id !== id));
      if (id === sessionId) handleNewChat();
    } catch (e) {
      console.error('Delete chat failed:', e);
    }
  };

  const handleRenameChat = (id: string, newTitle: string) => {
    setChatHistoryList(prev =>
      prev.map(c => c.id === id ? { ...c, title: newTitle } : c)
    );
  };

  const handlePinChat = (id: string) => {
    setChatHistoryList(prev =>
      prev.map((c: any) => c.id === id ? { ...c, pinned: !c.pinned } : c)
    );
  };

  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        handleNewChat();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        setIsSidebarCollapsed(prev => !prev);
        return;
      }
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        const scrollArea = document.querySelector('#main-chat-scroll-area [data-radix-scroll-area-viewport]');
        if (scrollArea) {
          e.preventDefault();
          if (e.repeat) {
            const scrollStep = e.key === 'ArrowUp' ? -40 : 40;
            scrollArea.scrollBy({ top: scrollStep, behavior: 'auto' });
          } else {
            const scrollStep = e.key === 'ArrowUp' ? -250 : 250;
            scrollArea.scrollBy({ top: scrollStep, behavior: 'smooth' });
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sessionId, chatHistoryList, isSidebarCollapsed]);

  const handleSendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;
    if (!user) { setIsAuthOpen(true); return; }

    const timestampStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg = { id: Date.now().toString(), role: 'user' as const, content, timestamp: timestampStr };

    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setMessages(prev => [
      ...prev,
      { id: (Date.now() + 1).toString(), role: 'assistant' as const, content: '', timestamp: timestampStr },
    ]);

    if (messages.length === 0) {
      setChatHistoryList(prev => {
        if (prev.some(c => c.id === sessionId)) return prev;
        const cleanTitle = content.replace(/\[.*?\]\s*/g, '').trim();
        const displayTitle = cleanTitle.length > 35 ? cleanTitle.slice(0, 35) + '...' : cleanTitle;
        return [{ id: sessionId, title: displayTitle || 'New Chat' }, ...prev];
      });
    }

    try {
      const token = await user.getIdToken();
      const apiHistory = messages.slice(-10).map(m => ({ role: m.role, content: m.content }));
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ message: content, sessionId, history: apiHistory }),
        signal: controller.signal,
      });

      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';
      let fullAIResponse = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        const lines = accumulated.split('\n');
        accumulated = lines.pop() || '';
        for (const line of lines) {
          if (!line.trim() || !line.startsWith('data:')) continue;
          const data = line.replace('data: ', '').trim();
          if (!data || data === '[DONE]') {
            if (data === '[DONE]') syncHistory();
            continue;
          }
          try {
            const parsed = JSON.parse(data);
            if (parsed.content) {
              fullAIResponse += parsed.content;
              setMessages(prev => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last?.role === 'assistant') {
                  updated[updated.length - 1] = { ...last, content: fullAIResponse };
                }
                return updated;
              });
            }
            if (parsed.title) {
              setChatHistoryList(prev => prev.map(c => 
                c.id === sessionId ? { ...c, title: parsed.title } : c
              ));
            }
          } catch (e) { }
        }
      }
    } catch (error: any) {
      if (error.name === 'AbortError') return;
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = { ...updated[updated.length - 1], content: '⚠️ Error: Failed to get response.' };
        return updated;
      });
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleSendWithImage = async (formData: FormData) => {
    if (!user) { setIsAuthOpen(true); return; }
    const message = formData.get('message') as string;
    const file = formData.get('image') as File;
    const timestampStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const localPreview = URL.createObjectURL(file);
    const userMsgId = Date.now().toString();

    setMessages(prev => [
      ...prev,
      { id: userMsgId, role: 'user' as const, content: message || 'What is in this image?', imageUrl: localPreview, timestamp: timestampStr },
      { id: (Date.now() + 1).toString(), role: 'assistant' as const, content: '', timestamp: timestampStr },
    ]);
    if (messages.length === 0) {
      setChatHistoryList(prev => {
        if (prev.some(c => c.id === sessionId)) return prev;
        const baseContent = message || 'Image Analysis';
        const cleanTitle = baseContent.replace(/\[.*?\]\s*/g, '').trim();
        const words = cleanTitle.split(/\s+/);
        const title = words.length > 3 ? words.slice(0, 3).join(' ') + '...' : (cleanTitle.slice(0, 20) + (cleanTitle.length > 20 ? '...' : ''));
        return [{ id: sessionId, title }, ...prev];
      });
    }

    setIsLoading(true);
    try {
      const token = await user.getIdToken();
      formData.append('sessionId', sessionId);
      formData.append('history', JSON.stringify(messages.slice(-6).map(m => ({ role: m.role, content: m.content }))));
      const res = await fetch('/api/vision', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: formData });
      if (!res.ok) throw new Error(`Vision API error: ${res.status}`);
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';
      let fullResponse = '';
      let cloudinaryUrl = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        const lines = accumulated.split('\n');
        accumulated = lines.pop() || '';
        for (const line of lines) {
          if (!line.trim() || !line.startsWith('data:')) continue;
          const data = line.replace('data: ', '').trim();
          if (!data || data === '[DONE]') {
            if (data === '[DONE]') syncHistory();
            continue;
          }
          try {
            const parsed = JSON.parse(data);
            if (parsed.imageUrl && !cloudinaryUrl) {
              cloudinaryUrl = parsed.imageUrl;
              setMessages(prev => prev.map(m => m.id === userMsgId ? { ...m, imageUrl: cloudinaryUrl } : m));
            }
            if (parsed.content) {
              fullResponse += parsed.content;
              setMessages(prev => {
                const lastIdx = prev.length - 1;
                const newMsgs = [...prev];
                newMsgs[lastIdx] = { ...newMsgs[lastIdx], content: fullResponse };
                return newMsgs;
              });
            }
            if (parsed.title) {
              setChatHistoryList(prev => prev.map(c => 
                c.id === sessionId ? { ...c, title: parsed.title } : c
              ));
            }
          } catch (e) { }
        }
      }
    } catch (e) {
      console.error(e);
      setMessages(prev => {
        const updated = [...prev];
        if (updated.length > 0) {
          updated[updated.length - 1] = { ...updated[updated.length - 1], content: '⚠️ Error occurred during processing.' };
        }
        return updated;
      });
    } finally { setIsLoading(false); }
  };

  const handleSendFile = async (file: File) => {
    if (!user) { setIsAuthOpen(true); return; }
    const timestampStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const uploadingMsgId = Date.now().toString();
    setMessages(prev => [
      ...prev,
      { id: uploadingMsgId, role: 'user' as const, content: `Uploading ${file.name}...`, timestamp: timestampStr },
      { id: (Date.now() + 1).toString(), role: 'assistant' as const, content: '⏳ Uploading...', timestamp: timestampStr },
    ]);
    if (messages.length === 0) {
      setChatHistoryList(prev => {
        if (prev.some(c => c.id === sessionId)) return prev;
        return [{ id: sessionId, title: `File: ${file.name}` }, ...prev];
      });
    }

    setIsLoading(true);
    try {
      const token = await user.getIdToken();
      const formData = new FormData();
      formData.append('file', file);
      formData.append('sessionId', sessionId);
      const res = await fetch('/api/upload', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessages(prev => {
        const updated = [...prev];
        const userIdx = updated.findIndex(m => m.id === uploadingMsgId);
        if (userIdx !== -1) updated[userIdx] = { id: uploadingMsgId, role: 'user' as const, content: `Uploaded: ${data.fileName}`, fileUrl: data.url, fileName: data.fileName, fileType: data.fileType, fileSize: data.fileSize, timestamp: timestampStr };
        updated[updated.length - 1] = { ...updated[updated.length - 1], content: `${data.icon} I've received **${data.fileName}**.` };
        return updated;
      });
      syncHistory();
    } catch (err: any) {
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = { ...updated[updated.length - 1], content: `⚠️ Upload failed: ${err.message}` };
        return updated;
      });
    } finally { setIsLoading(false); }
  };

  if (authLoading) {
    return (
      <main className="flex h-screen w-full items-center justify-center bg-background relative overflow-hidden">
        <ParticleBackground reducedDensity={false} intensity={0.33} />
        <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(15,23,42,0.5),rgba(2,6,23,1))] pointer-events-none z-0" />
        <div className="flex flex-col items-center gap-4 relative z-10">
          <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-white/40 text-sm font-mono">Initializing JARVIS...</p>
        </div>
      </main>
    );
  }

  const sidebarProps = {
    isCollapsed: isSidebarCollapsed,
    setIsCollapsed: setIsSidebarCollapsed,
    openSettings: () => { setIsSettingsOpen(true); setIsMobileMenuOpen(false); },
    openAuth: () => { setIsAuthOpen(true); setIsMobileMenuOpen(false); },
    onNewChat: handleNewChat,
    onSelectChat: handleSelectChat,
    onDeleteChat: handleDeleteChat,
    onRenameChat: handleRenameChat,
    onPinChat: handlePinChat,
    chats: [...chatHistoryList].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0)),
    user: user,
    userPrompts: userPrompts,
    currentChatId: sessionId,
    onSyncHistory: syncHistory,
  };

  return (
    <main className="flex h-[100dvh] w-full overflow-hidden bg-background text-foreground relative">
      <ParticleBackground reducedDensity={messages.length > 0} intensity={0.33} />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(15,23,42,0.5),rgba(2,6,23,1))] pointer-events-none z-0" />
      

      {/* ── Mobile Sidebar ── */}
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetContent side="left" className="p-0 border-none bg-transparent w-[280px]" showCloseButton={false}>
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation Menu</SheetTitle>
            <SheetDescription>Access chat history and settings</SheetDescription>
          </SheetHeader>
          <div className="h-full bg-[#020617]">
            <Sidebar {...sidebarProps} isCollapsed={false} onMobileClose={() => setIsMobileMenuOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>

      {/* ── Desktop Sidebar ── */}
      <div className="hidden lg:block">
        <Sidebar {...sidebarProps} />
      </div>

      <div className="flex-1 flex flex-col relative z-10 overflow-hidden">
        {/* ── Mobile Header ── */}
        <div className="lg:hidden flex items-center justify-between px-4 h-14 pb-[5px] border-b border-white/5 bg-background/50 backdrop-blur-md relative">
          <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(true)} className="text-white/40 hover:text-white relative z-10">
            <Menu className="w-6 h-6" />
          </Button>
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="px-3 py-1.5 rounded-full border border-white/20 bg-white/5 backdrop-blur-sm relative group overflow-hidden shadow-[0_0_15px_rgba(0,210,255,0.1)]">
              {/* Shimmer Effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-400/20 to-transparent -skew-x-12"
                initial={{ x: '-150%' }}
                animate={{ x: '150%' }}
                transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
              />
              <span className="text-[10px] font-bold tracking-[0.3em] text-white uppercase pl-[0.3em] relative z-10 transition-all group-hover:tracking-[0.4em]">
                JARVIS
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 relative z-10">
            <Button variant="ghost" size="icon" onClick={handleNewChat} className="text-white/40 hover:text-white">
              <Plus className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* ── Desktop Header ── */}
        <div className="hidden lg:flex items-center justify-center px-6 h-14 pb-[5px] border-b border-white/5 bg-background/20 backdrop-blur-sm relative">
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="px-3 py-1.5 rounded-full border border-white/20 bg-white/5 backdrop-blur-sm relative group overflow-hidden shadow-[0_0_15px_rgba(0,210,255,0.1)]">
              {/* Shimmer Effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-400/20 to-transparent -skew-x-12"
                initial={{ x: '-150%' }}
                animate={{ x: '150%' }}
                transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
              />
              <span className="text-[10px] font-bold tracking-[0.3em] text-white uppercase pl-[0.3em] relative z-10 transition-all group-hover:tracking-[0.4em]">
                JARVIS
              </span>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-3">
            {/* Any future right-aligned items can go here */}
          </div>
        </div>

        <div className="flex-1 flex flex-col relative overflow-hidden">
          <ChatInterface 
            messages={messages} 
            isThinking={isLoading} 
            isHistoryLoading={isHistoryLoading}
            sessionId={sessionId}
            onSuggestionClick={(text) => handleSendMessage(text)} 
          />
          <div className="mt-auto">
            <InputPanel
              input={input}
              onInputChange={setInput}
              onSend={handleSendMessage}
              onSendImage={handleSendWithImage}
              onSendFile={handleSendFile}
              isLoading={isLoading}
              onVoiceChat={() => setIsVoiceRecording(!isVoiceRecording)}
              onStop={handleStopGeneration}
              sessionId={sessionId}
              history={messages}
              openControls={() => setIsControlsOpen(true)}
              isVoiceRecording={isVoiceRecording}
              interimTranscript={interimTranscript}
            />
          </div>
        </div>
      </div>

      <AdvancedControls isOpen={isControlsOpen} onClose={() => setIsControlsOpen(false)} />
      <AnalyticsDashboard isOpen={isAnalyticsOpen} onClose={() => setIsAnalyticsOpen(false)} />
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} onSuccess={syncHistory} />

      <VoiceModal
        isOpen={isVoiceOpen}
        onClose={() => { setIsVoiceOpen(false); setIsVoiceRecording(false); }}
        isVoiceRecording={isVoiceRecording}
        isSpeaking={isLoading}
        voiceLoading={isLoading}
        voiceMessages={messages.slice(-10).map(m => ({
          role: m.role,
          content: m.content,
          provider: m.role === 'assistant' ? 'Groq' : undefined
        }))}
        onToggleRecording={() => setIsVoiceRecording(!isVoiceRecording)}
        interimTranscript={interimTranscript}
      />



    </main>
  );
}