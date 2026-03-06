"use client";

import React, { useState, useEffect, useRef } from "react";
import { Sidebar } from "@/components/Sidebar";
import { ChatInterface } from "@/components/ChatInterface";
import { InputPanel } from "@/components/InputPanel";
import { AdvancedControls } from "@/components/AdvancedControls";
import { AnalyticsDashboard } from "@/components/AnalyticsDashboard";
import { SettingsModal } from "@/components/SettingsModal";
import { AuthModal } from "@/components/AuthModal";
import ParticleBackground from "@/components/ParticleBackground";
import { useAuth } from "@/context/AuthContext";

export default function Home() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isControlsOpen, setIsControlsOpen]         = useState(false);
  const [isAnalyticsOpen, setIsAnalyticsOpen]       = useState(false);
  const [isSettingsOpen, setIsSettingsOpen]         = useState(false);
  const [isAuthOpen, setIsAuthOpen]                 = useState(false);

  const { user, loading: authLoading } = useAuth();

  const [messages, setMessages]               = useState<any[]>([]);
  const [isLoading, setIsLoading]             = useState(false);
  const [sessionId, setSessionId]             = useState('');
  const [chatHistoryList, setChatHistoryList] = useState<{ id: string; title: string; pinned?: boolean }[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);

  // ── Generate sessionId after user loads ──────────────────
  useEffect(() => {
    if (user) {
      setSessionId('session-' + Math.random().toString(36).slice(2, 9));
    } else {
      setSessionId('');
      setMessages([]);
      setChatHistoryList([]);
    }
  }, [user]);

  // ── Sync history on login ─────────────────────────────────
  useEffect(() => {
    if (!user || authLoading) return;
    syncHistory();
  }, [user, authLoading]);

  // ── Helper: refresh sidebar ───────────────────────────────
  const syncHistory = async () => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const res   = await fetch('/api/history', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.sessions?.length > 0) {
        setChatHistoryList(
          data.sessions.map((s: any) => ({
            id:     s.sessionId,
            title:  s.title || 'New Chat',
            pinned: s.pinned || false,
          }))
        );
      }
    } catch (e) {
      console.error('History sync failed:', e);
    }
  };

  // ── Load a chat session ───────────────────────────────────
  const handleSelectChat = async (id: string, title: string) => {
    if (!user) return;
    setSessionId(id);
    setMessages([]);
    try {
      const token = await user.getIdToken();
      const res   = await fetch(`/api/history?sessionId=${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.messages?.length > 0) {
        setMessages(
          data.messages.map((m: any, i: number) => ({
            ...m,
            id:        m._id || `${id}-${i}`,
            timestamp: new Date(m.timestamp).toLocaleTimeString([], {
              hour: '2-digit', minute: '2-digit',
            }),
          }))
        );
      }
    } catch (e) {
      console.error('Load chat failed:', e);
    }
  };

  // ── New chat ──────────────────────────────────────────────
  const handleNewChat = () => {
    setMessages([]);
    setSessionId('session-' + Math.random().toString(36).slice(2, 9));
    setIsLoading(false);
  };

  // ── Delete chat ───────────────────────────────────────────
  const handleDeleteChat = async (id: string) => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      await fetch('/api/history', {
        method:  'DELETE',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body:    JSON.stringify({ sessionId: id }),
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
      prev.map(c => c.id === id ? { ...c, pinned: !c.pinned } : c)
    );
  };

  // ── Stop generation ───────────────────────────────────────
  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  // ── Send text message ─────────────────────────────────────
  const handleSendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;
    if (!user) { setIsAuthOpen(true); return; }

    const timestampStr = new Date().toLocaleTimeString([], {
      hour: '2-digit', minute: '2-digit',
    });

    const userMsg = {
      id:        Date.now().toString(),
      role:      'user' as const,
      content,
      timestamp: timestampStr,
    };

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
        return [{ id: sessionId, title: content.slice(0, 40) + (content.length > 40 ? '...' : '') }, ...prev];
      });
    }

    try {
      const token      = await user.getIdToken();
      const apiHistory = messages.slice(-10).map(m => ({ role: m.role, content: m.content }));

      const res = await fetch('/api/chat', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ message: content, sessionId, history: apiHistory }),
        signal:  controller.signal,
      });

      if (!res.ok) throw new Error(`API error: ${res.status}`);

      const reader  = res.body!.getReader();
      const decoder = new TextDecoder();
      let accumulated    = '';
      let fullAIResponse = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        accumulated += decoder.decode(value, { stream: true });
        const lines  = accumulated.split('\n');
        accumulated  = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim() || !line.startsWith('data:')) continue;
          const data = line.replace('data: ', '').trim();
          if (data === '[DONE]') { syncHistory(); continue; }

          try {
            const parsed = JSON.parse(data);
            if (parsed.content) {
              fullAIResponse += parsed.content;
              setMessages(prev => {
                const updated = [...prev];
                const last    = updated[updated.length - 1];
                if (last?.role === 'assistant') {
                  updated[updated.length - 1] = { ...last, content: fullAIResponse };
                }
                return updated;
              });
            }
          } catch (e) { console.error('Stream parse error:', e); }
        }
      }
    } catch (error: any) {
      if (error.name === 'AbortError') return;
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          ...updated[updated.length - 1],
          content: '⚠️ Error: Failed to get response. Please try again.',
        };
        return updated;
      });
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  // ── Send image ────────────────────────────────────────────
  const handleSendWithImage = async (formData: FormData) => {
    if (!user) { setIsAuthOpen(true); return; }

    const message      = formData.get('message') as string;
    const file         = formData.get('image') as File;
    const timestampStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const localPreview = URL.createObjectURL(file);
    const userMsgId    = Date.now().toString();

    setMessages(prev => [
      ...prev,
      { id: userMsgId, role: 'user' as const, content: message || 'What is in this image?', imageUrl: localPreview, timestamp: timestampStr },
      { id: (Date.now() + 1).toString(), role: 'assistant' as const, content: '', timestamp: timestampStr },
    ]);
    setIsLoading(true);

    if (messages.length === 0) {
      setChatHistoryList(prev => {
        if (prev.some(c => c.id === sessionId)) return prev;
        return [{ id: sessionId, title: (message || 'Image upload').slice(0, 40) }, ...prev];
      });
    }

    try {
      const token = await user.getIdToken();
      formData.append('sessionId', sessionId);
      formData.append('history', JSON.stringify(
        messages.slice(-6).map(m => ({ role: m.role, content: m.content }))
      ));

      const res = await fetch('/api/vision', {
        method:  'POST',
        headers: { Authorization: `Bearer ${token}` },
        body:    formData,
      });

      if (!res.ok) throw new Error(`Vision API error: ${res.status}`);

      const reader  = res.body!.getReader();
      const decoder = new TextDecoder();
      let accumulated   = '';
      let fullResponse  = '';
      let cloudinaryUrl = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        accumulated += decoder.decode(value, { stream: true });
        const lines  = accumulated.split('\n');
        accumulated  = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim() || !line.startsWith('data:')) continue;
          const data = line.replace('data: ', '').trim();
          if (data === '[DONE]') { syncHistory(); continue; }

          try {
            const parsed = JSON.parse(data);

            if (parsed.imageUrl && !cloudinaryUrl) {
              cloudinaryUrl = parsed.imageUrl;
              setMessages(prev =>
                prev.map(m => m.id === userMsgId ? { ...m, imageUrl: cloudinaryUrl } : m)
              );
            }

            if (parsed.content) {
              fullResponse += parsed.content;
              setMessages(prev => {
                const updated = [...prev];
                const last    = updated[updated.length - 1];
                if (last?.role === 'assistant') {
                  updated[updated.length - 1] = { ...last, content: fullResponse };
                }
                return updated;
              });
            }
          } catch (e) { console.error('Vision stream error:', e); }
        }
      }
    } catch (error: any) {
      console.error('Vision error:', error);
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          ...updated[updated.length - 1],
          content: '⚠️ Failed to analyze image. Please try again.',
        };
        return updated;
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ── Send file (PDF/DOCX/TXT/CSV) ─────────────────────────  ← NEW
  const handleSendFile = async (file: File) => {
    if (!user) { setIsAuthOpen(true); return; }

    const timestampStr  = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const uploadingMsgId = Date.now().toString();

    // Show uploading state immediately
    setMessages(prev => [
      ...prev,
      {
        id:        uploadingMsgId,
        role:      'user' as const,
        content:   `Uploading ${file.name}...`,
        timestamp: timestampStr,
      },
      {
        id:        (Date.now() + 1).toString(),
        role:      'assistant' as const,
        content:   '⏳ Uploading your file, please wait...',
        timestamp: timestampStr,
      },
    ]);

    setIsLoading(true);

    // Add to sidebar immediately
    if (messages.length === 0) {
      setChatHistoryList(prev => {
        if (prev.some(c => c.id === sessionId)) return prev;
        return [{ id: sessionId, title: `📎 ${file.name.slice(0, 35)}` }, ...prev];
      });
    }

    try {
      const token    = await user.getIdToken();
      const formData = new FormData();
      formData.append('file',      file);
      formData.append('sessionId', sessionId);

      const res  = await fetch('/api/upload', {
        method:  'POST',
        headers: { Authorization: `Bearer ${token}` },
        body:    formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');

      // ── Replace uploading messages with real data ────────
      setMessages(prev => {
        const updated = [...prev];

        // Replace user "uploading..." message with real file card
        const userIdx = updated.findIndex(m => m.id === uploadingMsgId);
        if (userIdx !== -1) {
          updated[userIdx] = {
            id:        uploadingMsgId,
            role:      'user' as const,
            content:   `Uploaded: ${data.fileName}`,
            fileUrl:   data.url,
            fileName:  data.fileName,
            fileType:  data.fileType,
            fileSize:  data.fileSize,
            timestamp: timestampStr,
          };
        }

        // Replace assistant "uploading..." with acknowledgment
        updated[updated.length - 1] = {
          ...updated[updated.length - 1],
          content: `${data.icon} I've received **${data.fileName}** (${(data.fileSize / 1024).toFixed(1)} KB).\n\nThe file has been uploaded successfully! Once LangChain is set up, I'll be able to read and answer questions about its content. For now, feel free to ask me anything else!`,
        };

        return updated;
      });

      syncHistory();

    } catch (err: any) {
      console.error('File upload error:', err);
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          ...updated[updated.length - 1],
          content: `⚠️ Upload failed: ${err.message}. Please try again.`,
        };
        return updated;
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ── Auth loading spinner ──────────────────────────────────
  if (authLoading) {
    return (
      <main className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-white/40 text-sm font-mono">Initializing JARVIS...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex h-screen w-full overflow-hidden bg-background text-foreground relative">
      <ParticleBackground />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(15,23,42,0.5),rgba(2,6,23,1))] pointer-events-none z-0" />

      <Sidebar
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        openSettings={() => setIsSettingsOpen(true)}
        openAuth={() => setIsAuthOpen(true)}
        onNewChat={handleNewChat}
        onSelectChat={handleSelectChat}
        onDeleteChat={handleDeleteChat}
        onRenameChat={handleRenameChat}
        onPinChat={handlePinChat}
        chats={[...chatHistoryList].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0))}
        user={user}
      />

      <div className="flex-1 flex flex-col relative z-10 overflow-hidden">
        <div className="flex-1 flex flex-col relative overflow-hidden">
          <ChatInterface messages={messages} isThinking={isLoading} />
          <div className="mt-auto">
            <InputPanel
              onSend={handleSendMessage}
              onSendImage={handleSendWithImage}
              onSendFile={handleSendFile}        // ← NEW
              isLoading={isLoading}
              onStop={handleStopGeneration}
              sessionId={sessionId}
              history={messages}
              openControls={() => setIsControlsOpen(true)}
            />
          </div>
        </div>
      </div>

      <AdvancedControls   isOpen={isControlsOpen}  onClose={() => setIsControlsOpen(false)} />
      <AnalyticsDashboard isOpen={isAnalyticsOpen} onClose={() => setIsAnalyticsOpen(false)} />
      <SettingsModal      isOpen={isSettingsOpen}  onClose={() => setIsSettingsOpen(false)} />
      <AuthModal          isOpen={isAuthOpen}      onClose={() => setIsAuthOpen(false)} />
    </main>
  );
}
// ```

// ---

// ## What Changed
// ```
// ✅ handleSendFile function added (NEW)
// ✅ syncHistory helper replaces duplicate refreshHistory calls
// ✅ onSendFile={handleSendFile} passed to InputPanel
// ✅ File upload shows instant "uploading..." state in chat
// ✅ On success → replaced with real file card + AI acknowledgment
// ✅ On error → shows error message in chat
// ✅ Sidebar updates after successful upload
// ✅ Auth guard on file upload (opens login modal)