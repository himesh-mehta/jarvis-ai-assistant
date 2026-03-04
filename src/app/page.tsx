"use client";

import React, { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { ChatInterface } from "@/components/ChatInterface";
import { InputPanel } from "@/components/InputPanel";
import { Header, StatusIndicator } from "@/components/Header";
import { AdvancedControls } from "@/components/AdvancedControls";
import { AnalyticsDashboard } from "@/components/AnalyticsDashboard";
import { SettingsModal } from "@/components/SettingsModal";
import ParticleBackground from "@/components/ParticleBackground";
import { motion, AnimatePresence } from "framer-motion";

export default function Home() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isControlsOpen, setIsControlsOpen] = useState(false);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Chat Logic
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const sessionId = React.useMemo(() => 'home-' + Math.random().toString(36).slice(2, 9), []);

  React.useEffect(() => {
    fetch(`/api/history?sessionId=${sessionId}`)
      .then(res => res.json())
      .then(data => setMessages(data.messages || []));
  }, [sessionId]);

  const handleSendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMsg = { id: Date.now().toString(), role: 'user', content, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    const aiMsg = { id: (Date.now() + 1).toString(), role: 'assistant', content: '', timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    setMessages(prev => [...prev, aiMsg]);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content,
          sessionId,
          history: messages.slice(-10).map(m => ({ role: m.role, content: m.content })),
        }),
      });

      if (!res.ok) throw new Error('API request failed');

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        accumulated += decoder.decode(value, { stream: true });
        const lines = accumulated.split('\n');
        accumulated = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim() || !line.startsWith('data:')) continue;
          const data = line.replace('data: ', '').trim();
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);
            if (parsed.content) {
              setMessages(prev => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last && last.role === 'assistant') {
                  updated[updated.length - 1] = { ...last, content: last.content + parsed.content };
                }
                return updated;
              });
            }
          } catch (e) {
            console.error('Error parsing streaming data', e);
          }
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = { ...updated[updated.length - 1], content: 'Error: Failed to get response.' };
        return updated;
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex h-screen w-full overflow-hidden bg-background text-foreground relative">
      <ParticleBackground />

      {/* Animated Deep Space Gradient Overlay */}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(15,23,42,0.5),rgba(2,6,23,1))] pointer-events-none z-0" />

      {/* Sidebar */}
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        openSettings={() => setIsSettingsOpen(true)}
      />

      {/* Main Content Area */}
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


      {/* Overlays / Modals */}
      <AdvancedControls
        isOpen={isControlsOpen}
        onClose={() => setIsControlsOpen(false)}
      />

      <AnalyticsDashboard
        isOpen={isAnalyticsOpen}
        onClose={() => setIsAnalyticsOpen(false)}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </main>
  );
}
