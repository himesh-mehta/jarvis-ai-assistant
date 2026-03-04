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
        <Header openAnalytics={() => setIsAnalyticsOpen(true)} />

        <div className="flex-1 flex flex-col relative overflow-hidden">
          <ChatInterface />

          <div className="mt-auto">
            <InputPanel openControls={() => setIsControlsOpen(true)} />
          </div>
        </div>

        <StatusIndicator />
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
