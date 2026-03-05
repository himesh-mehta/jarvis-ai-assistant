"use client";

import React, { useState, useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { ChatInterface } from "@/components/ChatInterface";
import { InputPanel } from "@/components/InputPanel";
import { AdvancedControls } from "@/components/AdvancedControls";
import { AnalyticsDashboard } from "@/components/AnalyticsDashboard";
import { SettingsModal } from "@/components/SettingsModal";
import { AuthModal } from "@/components/AuthModal";
import ParticleBackground from "@/components/ParticleBackground";
import { useAuth } from "@/context/AuthContext";

// ── Removed Firestore imports — MongoDB handles all storage now ──

export default function Home() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isControlsOpen, setIsControlsOpen] = useState(false);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  const { user, loading: authLoading } = useAuth();

  const [messages, setMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [chatHistoryList, setChatHistoryList] = useState<{ id: string; title: string }[]>([]);

  // ── Generate sessionId only after user is ready ──────────────
  useEffect(() => {
    if (user) {
      setSessionId('session-' + Math.random().toString(36).slice(2, 9));
    } else {
      setSessionId('');
      setMessages([]);
      setChatHistoryList([]);
    }
  }, [user]);

  // ── Sync chat history from MongoDB when user logs in ─────────
  useEffect(() => {
    if (!user || authLoading) return;

    const syncHistory = async () => {
      try {
        const token = await user.getIdToken();
        const res = await fetch('/api/history', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();

        if (data.sessions?.length > 0) {
          setChatHistoryList(
            data.sessions.map((s: any) => ({ id: s.sessionId, title: s.title || 'New Chat' }))
          );
        }
      } catch (e) {
        console.error('History sync failed:', e);
      }
    };

    syncHistory();
  }, [user, authLoading]);

  // ── Load a specific chat session ─────────────────────────────
  const handleSelectChat = async (id: string, title: string) => {
    if (!user) return;

    setSessionId(id);
    setMessages([]);

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
              hour: '2-digit',
              minute: '2-digit',
            }),
          }))
        );
      }
    } catch (e) {
      console.error('Load chat failed:', e);
    }
  };

  // ── Start a new chat ──────────────────────────────────────────
  const handleNewChat = () => {
    setMessages([]);
    setSessionId('session-' + Math.random().toString(36).slice(2, 9));
    setIsLoading(false);
  };

  // ── Delete a chat session ─────────────────────────────────────
  const handleDeleteChat = async (id: string) => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      await fetch('/api/history', {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId: id }),
      });
      setChatHistoryList(prev => prev.filter(c => c.id !== id));
      if (id === sessionId) handleNewChat();
    } catch (e) {
      console.error('Delete chat failed:', e);
    }
  };

  // ── Send message ──────────────────────────────────────────────
  const handleSendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    // ── Guard: must be logged in ──────────────────────────────
    if (!user) {
      setIsAuthOpen(true);   // open login modal if not logged in
      return;
    }

    const timestampStr = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    const userMsg = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: timestampStr,
    };

    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);
    setMessages(prev => [
      ...prev,
      { id: (Date.now() + 1).toString(), role: 'assistant', content: '', timestamp: timestampStr },
    ]);

    // ── Add to sidebar history on first message ───────────────
    if (messages.length === 0) {
      setChatHistoryList(prev => {
        if (prev.some(c => c.id === sessionId)) return prev;
        return [{ id: sessionId, title: content.slice(0, 40) + (content.length > 40 ? '...' : '') }, ...prev];
      });
    }

    try {
      const token = await user.getIdToken();   // ← always get fresh token
      const apiHistory = messages.slice(-10).map(m => ({ role: m.role, content: m.content }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,   // ← always send token
        },
        body: JSON.stringify({ message: content, sessionId, history: apiHistory }),
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
          if (data === '[DONE]') {
            // ── Refresh sidebar history after response ────────
            const t = await user.getIdToken();
            fetch('/api/history', { headers: { Authorization: `Bearer ${t}` } })
              .then(r => r.json())
              .then(d => {
                if (d.sessions?.length > 0) {
                  setChatHistoryList(d.sessions.map((s: any) => ({
                    id: s.sessionId,
                    title: s.title || 'New Chat',
                  })));
                }
              });
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
          } catch (e) {
            console.error('Stream parse error:', e);
          }
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
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
    }
  };

  // ── Show loading spinner while auth initializes ───────────────
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
        chats={chatHistoryList}
        user={user}
      />

      <div className="flex-1 flex flex-col relative z-10 overflow-hidden">
        <div className="flex-1 flex flex-col relative overflow-hidden">
          <ChatInterface messages={messages} isThinking={isLoading} />
          <div className="mt-auto">
            <InputPanel
              onSend={handleSendMessage}
              isLoading={isLoading}
              openControls={() => setIsControlsOpen(true)}
            />
          </div>
        </div>
      </div>

      <AdvancedControls isOpen={isControlsOpen} onClose={() => setIsControlsOpen(false)} />
      <AnalyticsDashboard isOpen={isAnalyticsOpen} onClose={() => setIsAnalyticsOpen(false)} />
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </main>
  );
}
// ```

// ---

// ## Summary of All Changes
// ```
// ✅ Removed all Firestore imports       → MongoDB only, no duplicate saves
// ✅ sessionId set after user loads      → no empty session on startup
// ✅ Auth guard in handleSendMessage     → opens login modal if not logged in
// ✅ Token always sent to /api/chat      → secure, server verifies every request
// ✅ handleDeleteChat added              → delete sessions from MongoDB
// ✅ Sidebar history refreshes on [DONE] → live updates after each response
// ✅ authLoading spinner                 → clean UX while Firebase initializes
// ✅ Removed Firestore dual-save         → single source of truth (MongoDB)