'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Smartphone, Wifi, WifiOff, Battery, Volume2,
  Sun, Camera, Home, ArrowLeft, Lock, Power,
  Play, MessageCircle, Instagram, Music, Map,
  Chrome, Settings, Zap, RefreshCw, Terminal,
  CheckCircle, XCircle, Loader
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

// ── Quick apps ────────────────────────────────────────
const QUICK_APPS = [
  { name: 'youtube',   icon: '▶️',  label: 'YouTube',   color: 'bg-red-500/20    border-red-500/30'    },
  { name: 'whatsapp',  icon: '💬',  label: 'WhatsApp',  color: 'bg-green-500/20  border-green-500/30'  },
  { name: 'instagram', icon: '📸',  label: 'Instagram', color: 'bg-pink-500/20   border-pink-500/30'   },
  { name: 'spotify',   icon: '🎵',  label: 'Spotify',   color: 'bg-green-600/20  border-green-600/30'  },
  { name: 'maps',      icon: '🗺️', label: 'Maps',      color: 'bg-blue-500/20   border-blue-500/30'   },
  { name: 'chrome',    icon: '🌐',  label: 'Chrome',    color: 'bg-yellow-500/20 border-yellow-500/30' },
  { name: 'camera',    icon: '📷',  label: 'Camera',    color: 'bg-purple-500/20 border-purple-500/30' },
  { name: 'settings',  icon: '⚙️', label: 'Settings',  color: 'bg-gray-500/20   border-gray-500/30'   },
  { name: 'telegram',  icon: '✈️',  label: 'Telegram',  color: 'bg-blue-400/20   border-blue-400/30'   },
  { name: 'netflix',   icon: '🎬',  label: 'Netflix',   color: 'bg-red-600/20    border-red-600/30'    },
  { name: 'twitter',   icon: '🐦',  label: 'Twitter',   color: 'bg-sky-500/20    border-sky-500/30'    },
  { name: 'facebook',  icon: '👤',  label: 'Facebook',  color: 'bg-blue-600/20   border-blue-600/30'   },
];

export const AndroidControl = ({
  isOpen,
  onClose,
}: {
  isOpen:  boolean;
  onClose: () => void;
}) => {
  const { user }                          = useAuth();
  const [isOnline, setIsOnline]           = useState(false);
  const [battery, setBattery]             = useState<number | null>(null);
  const [volume, setVolume]               = useState(50);
  const [brightness, setBrightness]       = useState(50);
  const [wifi, setWifi]                   = useState(true);
  const [loading, setLoading]             = useState<string | null>(null);
  const [feedback, setFeedback]           = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [agentTask, setAgentTask]         = useState('');
  const [agentRunning, setAgentRunning]   = useState(false);
  const [agentSteps, setAgentSteps]       = useState<string[]>([]);
  const [screenshot, setScreenshot]       = useState<string | null>(null);
  const [activeTab, setActiveTab]         = useState<'apps' | 'controls' | 'agent'>('apps');

  // ── Execute command ───────────────────────────────
  const execute = useCallback(async (
    command: string,
    params:  Record<string, any> = {},
    label?:  string
  ) => {
    if (!user) return;
    setLoading(command);

    try {
      const token = await user.getIdToken();
      const res   = await fetch('/api/android', {
        method:  'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization:  `Bearer ${token}`,
        },
        body: JSON.stringify({ command, params }),
      });

      const data = await res.json();

      if (data.success) {
        setFeedback({ msg: label || data.result, type: 'success' });
      } else {
        setFeedback({ msg: data.error || 'Command failed', type: 'error' });
      }

      setTimeout(() => setFeedback(null), 3000);
      return data;
    } catch {
      setFeedback({ msg: 'Bridge offline — run: node android-bridge/server.js', type: 'error' });
      setTimeout(() => setFeedback(null), 4000);
    } finally {
      setLoading(null);
    }
  }, [user]);

  // ── Check bridge status ───────────────────────────
  const checkStatus = useCallback(async () => {
    try {
      const res  = await fetch('/api/android');
      const data = await res.json();
      setIsOnline(data.online);

      if (data.online) {
        // Get battery
        const bat = await execute('battery_info', {});
        if (bat?.result) {
          const level = bat.result.match(/(\d+)%/)?.[1];
          if (level) setBattery(parseInt(level));
        }
      }
    } catch {
      setIsOnline(false);
    }
  }, [execute]);

  useEffect(() => {
    if (isOpen) checkStatus();
  }, [isOpen, checkStatus]);

  // ── Run AI agent task ─────────────────────────────
  const runAgentTask = async () => {
    if (!agentTask.trim() || !user) return;
    setAgentRunning(true);
    setAgentSteps([]);

    try {
      const token = await user.getIdToken();
      const res   = await fetch('/api/android/agent', {
        method:  'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization:  `Bearer ${token}`,
        },
        body: JSON.stringify({ task: agentTask }),
      });

      const reader  = res.body!.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text  = decoder.decode(value);
        const lines = text.split('\n').filter(l => l.startsWith('data:'));

        for (const line of lines) {
          const data = JSON.parse(line.replace('data: ', ''));
          if (data.step)  setAgentSteps(prev => [...prev, data.step]);
          if (data.done)  setAgentSteps(prev => [...prev, `✅ ${data.done}`]);
          if (data.error) setAgentSteps(prev => [...prev, `❌ ${data.error}`]);
        }
      }
    } catch (err) {
      setAgentSteps(prev => [...prev, '❌ Agent failed']);
    } finally {
      setAgentRunning(false);
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: 400 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 400 }}
      className="fixed right-0 top-0 h-full w-80 z-50 glass-dark border-l border-white/10 flex flex-col"
    >
      {/* ── Header ── */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-neon-blue" />
            <h2 className="font-bold text-white">Android Control</h2>
          </div>
          <div className="flex items-center gap-2">
            <div className={cn(
              'flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-mono border',
              isOnline
                ? 'bg-green-500/20 border-green-500/30 text-green-400'
                : 'bg-red-500/20 border-red-500/30 text-red-400'
            )}>
              <div className={cn(
                'w-1.5 h-1.5 rounded-full',
                isOnline ? 'bg-green-400 animate-pulse' : 'bg-red-400'
              )} />
              {isOnline ? 'Online' : 'Offline'}
            </div>
            <Button
              variant="ghost" size="icon"
              className="h-7 w-7 text-white/40 hover:text-white"
              onClick={onClose}
            >
              ✕
            </Button>
          </div>
        </div>

        {/* Battery */}
        {battery !== null && (
          <div className="flex items-center gap-2 text-xs text-white/50">
            <Battery className="w-3.5 h-3.5" />
            <div className="flex-1 h-1.5 bg-white/10 rounded-full">
              <div
                className={cn('h-full rounded-full', battery > 20 ? 'bg-green-400' : 'bg-red-400')}
                style={{ width: `${battery}%` }}
              />
            </div>
            <span>{battery}%</span>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mt-3">
          {(['apps', 'controls', 'agent'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'flex-1 py-1.5 rounded-lg text-[11px] font-medium capitalize transition-all',
                activeTab === tab
                  ? 'bg-neon-blue/20 text-neon-blue border border-neon-blue/30'
                  : 'text-white/40 hover:text-white hover:bg-white/5'
              )}
            >
              {tab === 'apps' ? '📱 Apps' : tab === 'controls' ? '🎛️ Controls' : '🤖 Agent'}
            </button>
          ))}
        </div>
      </div>

      {/* ── Feedback toast ── */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={cn(
              'mx-4 mt-3 p-2.5 rounded-xl text-xs font-medium flex items-center gap-2',
              feedback.type === 'success'
                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                : 'bg-red-500/20 text-red-400 border border-red-500/30'
            )}
          >
            {feedback.type === 'success'
              ? <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
              : <XCircle className="w-3.5 h-3.5 flex-shrink-0" />
            }
            {feedback.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Content ── */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">

        {/* ── APPS TAB ── */}
        {activeTab === 'apps' && (
          <div>
            <p className="text-[10px] text-white/30 font-mono uppercase tracking-widest mb-3">
              Quick Launch
            </p>
            <div className="grid grid-cols-3 gap-2">
              {QUICK_APPS.map(app => (
                <motion.button
                  key={app.name}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => execute('open_app', { app: app.name }, `${app.label} opened ✅`)}
                  disabled={!!loading || !isOnline}
                  className={cn(
                    'flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all',
                    'hover:scale-105 active:scale-95 disabled:opacity-40',
                    app.color
                  )}
                >
                  {loading === 'open_app' ? (
                    <Loader className="w-5 h-5 animate-spin text-white/50" />
                  ) : (
                    <span className="text-xl">{app.icon}</span>
                  )}
                  <span className="text-[10px] text-white/70 font-medium">{app.label}</span>
                </motion.button>
              ))}
            </div>

            {/* Quick actions */}
            <p className="text-[10px] text-white/30 font-mono uppercase tracking-widest mb-3 mt-4">
              Quick Actions
            </p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { cmd: 'screenshot',  label: '📸 Screenshot', icon: Camera  },
                { cmd: 'go_home',     label: '🏠 Home',        icon: Home    },
                { cmd: 'press_back',  label: '⬅️ Back',        icon: ArrowLeft },
                { cmd: 'lock_screen', label: '🔒 Lock',        icon: Lock    },
              ].map(action => (
                <button
                  key={action.cmd}
                  onClick={() => execute(action.cmd, {})}
                  disabled={!!loading || !isOnline}
                  className="flex items-center gap-2 p-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all text-sm text-white/70 hover:text-white disabled:opacity-40"
                >
                  {loading === action.cmd
                    ? <Loader className="w-4 h-4 animate-spin" />
                    : <span>{action.label}</span>
                  }
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── CONTROLS TAB ── */}
        {activeTab === 'controls' && (
          <div className="space-y-5">
            {/* WiFi Toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl border border-white/10 bg-white/5">
              <div className="flex items-center gap-2">
                {wifi ? <Wifi className="w-4 h-4 text-neon-blue" /> : <WifiOff className="w-4 h-4 text-white/40" />}
                <span className="text-sm text-white">WiFi</span>
              </div>
              <button
                onClick={() => {
                  const newState = !wifi;
                  setWifi(newState);
                  execute('wifi', { state: newState ? 'enable' : 'disable' });
                }}
                className={cn(
                  'w-12 h-6 rounded-full transition-all relative',
                  wifi ? 'bg-neon-blue' : 'bg-white/20'
                )}
              >
                <div className={cn(
                  'absolute top-1 w-4 h-4 bg-white rounded-full transition-all',
                  wifi ? 'left-7' : 'left-1'
                )} />
              </button>
            </div>

            {/* Volume Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-white/60" />
                  <span className="text-sm text-white">Volume</span>
                </div>
                <span className="text-xs text-white/40 font-mono">{volume}%</span>
              </div>
              <input
                type="range" min="0" max="100"
                value={volume}
                onChange={(e) => setVolume(parseInt(e.target.value))}
                onMouseUp={() => execute('set_volume', { level: volume })}
                onTouchEnd={() => execute('set_volume', { level: volume })}
                className="w-full accent-neon-blue"
              />
            </div>

            {/* Brightness Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sun className="w-4 h-4 text-white/60" />
                  <span className="text-sm text-white">Brightness</span>
                </div>
                <span className="text-xs text-white/40 font-mono">{brightness}%</span>
              </div>
              <input
                type="range" min="0" max="100"
                value={brightness}
                onChange={(e) => setBrightness(parseInt(e.target.value))}
                onMouseUp={() => execute('set_brightness', { level: brightness })}
                onTouchEnd={() => execute('set_brightness', { level: brightness })}
                className="w-full accent-neon-blue"
              />
            </div>

            {/* Refresh status */}
            <button
              onClick={checkStatus}
              className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all text-sm text-white/60 hover:text-white"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh Status
            </button>
          </div>
        )}

        {/* ── AGENT TAB ── */}
        {activeTab === 'agent' && (
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
              <p className="text-xs text-blue-300 font-medium mb-1">🤖 AI Agent Mode</p>
              <p className="text-[11px] text-white/50">
                Describe a multi-step task and JARVIS will
                execute it automatically on your phone
              </p>
            </div>

            {/* Examples */}
            <div className="space-y-1.5">
              <p className="text-[10px] text-white/30 font-mono uppercase">Examples</p>
              {[
                'Open YouTube and search lo-fi music',
                'Generate a nature prompt in ChatGPT and paste in Canva',
                'Open WhatsApp and type hello',
                'Search React tutorials on Google',
              ].map(example => (
                <button
                  key={example}
                  onClick={() => setAgentTask(example)}
                  className="w-full text-left p-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-white/50 hover:text-white transition-all border border-white/5"
                >
                  {example}
                </button>
              ))}
            </div>

            {/* Task input */}
            <textarea
              value={agentTask}
              onChange={(e) => setAgentTask(e.target.value)}
              placeholder="Describe what you want JARVIS to do on your phone..."
              className="w-full h-24 bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white placeholder:text-white/30 resize-none focus:outline-none focus:border-neon-blue/50"
            />

            <button
              onClick={runAgentTask}
              disabled={!agentTask.trim() || agentRunning || !isOnline}
              className={cn(
                'w-full py-2.5 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2',
                agentTask.trim() && !agentRunning && isOnline
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-[0_0_20px_rgba(59,130,246,0.3)]'
                  : 'bg-white/5 text-white/30 border border-white/10'
              )}
            >
              {agentRunning
                ? <><Loader className="w-4 h-4 animate-spin" /> Running...</>
                : <><Zap className="w-4 h-4" /> Execute Task</>
              }
            </button>

            {/* Agent steps log */}
            {agentSteps.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-[10px] text-white/30 font-mono uppercase">Execution Log</p>
                <div className="bg-black/30 rounded-xl p-3 space-y-1.5 max-h-48 overflow-y-auto">
                  {agentSteps.map((step, i) => (
                    <motion.p
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="text-xs text-white/70 font-mono"
                    >
                      {step}
                    </motion.p>
                  ))}
                  {agentRunning && (
                    <div className="flex gap-1 pt-1">
                      <motion.span animate={{ scale: [1,1.2,1] }} transition={{ repeat: Infinity, duration: 0.8 }} className="w-1.5 h-1.5 bg-neon-blue rounded-full" />
                      <motion.span animate={{ scale: [1,1.2,1] }} transition={{ repeat: Infinity, duration: 0.8, delay: 0.2 }} className="w-1.5 h-1.5 bg-neon-blue rounded-full" />
                      <motion.span animate={{ scale: [1,1.2,1] }} transition={{ repeat: Infinity, duration: 0.8, delay: 0.4 }} className="w-1.5 h-1.5 bg-neon-blue rounded-full" />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Offline warning */}
            {!isOnline && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400">
                ⚠️ Bridge offline. Run in terminal:
                <code className="block mt-1 bg-black/30 p-1.5 rounded font-mono">
                  node android-bridge/server.js
                </code>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};