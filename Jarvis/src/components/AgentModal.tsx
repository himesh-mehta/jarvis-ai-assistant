"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    X, Terminal, Zap, ArrowRight,
    Globe, Sparkles, Check, AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { User } from "firebase/auth";

interface AgentModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: User | null;
}

interface Tool {
    name: string;
    url: string;
    reason: string;
    score: number;
}

interface AgentResult {
    bestTool: Tool;
    alternatives: Tool[];
    steps: any[];
    message: string;
}

const EXTENSION_ID = process.env.NEXT_PUBLIC_EXTENSION_ID;

export const AgentModal = ({ isOpen, onClose, user }: AgentModalProps) => {
    const [command, setCommand] = useState("");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<AgentResult | null>(null);
    const [executing, setExecuting] = useState(false);
    const [executed, setExecuted] = useState(false);
    const [error, setError] = useState("");
    const [selectedTool, setSelectedTool] = useState<Tool | null>(null);

    const handleAnalyze = async () => {
        console.log("JARVIS Agent: Analyze started for:", command);
        if (!command.trim()) return;
        if (!user) {
            setError("Please log in to use JARVIS Agent.");
            return;
        }
        setLoading(true);
        setError("");
        setResult(null);
        setExecuted(false);

        try {
            const token = await user.getIdToken();
            const res = await fetch('/api/agent', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ command }),
            });
            
            if (!res.ok) {
                const errBody = await res.text();
                throw new Error(`API returned ${res.status}: ${errBody}`);
            }

            const data = await res.json();
            console.log("JARVIS Agent: Analysis result:", data);
            setResult(data);
            setSelectedTool(data.bestTool);
        } catch (err: any) {
            console.error("Agent Analysis Error:", err);
            setError(`Failed to analyze: ${err.message || 'Unknown error'}`);
        } finally {
            setLoading(false);
        }
    };

    const handleExecute = async (tool: Tool) => {
        if (!result || !EXTENSION_ID) {
            setError("Extension not connected. Make sure JARVIS extension is installed in Chrome.");
            return;
        }

        setExecuting(true);
        setError("");

        try {
            // Send command to Chrome extension
            const extensionMessage = {
                type: "JARVIS_COMMAND",
                command,
                steps: result.steps.map(s => ({
                    ...s,
                    url: s.action === 'open_url' ? tool.url : s.url,
                })),
            };

            // Use chrome extension messaging
            if (typeof window !== 'undefined' && (window as any).chrome?.runtime) {
                (window as any).chrome.runtime.sendMessage(
                    EXTENSION_ID,
                    extensionMessage,
                    (response: any) => {
                        if (response?.status === 'received') {
                            setExecuted(true);
                        }
                    }
                );
            } else {
                // Fallback — open URL directly
                window.open(tool.url, '_blank');
                setExecuted(true);
            }
        } catch (err: any) {
            setError("Failed to send command to extension. Make sure JARVIS extension is installed.");
        } finally {
            setExecuting(false);
        }
    };

    const handleReset = () => {
        setCommand("");
        setResult(null);
        setExecuted(false);
        setError("");
        setSelectedTool(null);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                    onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="w-full max-w-[560px] bg-[#020617] border border-white/10 rounded-3xl shadow-2xl overflow-hidden"
                        style={{ boxShadow: "0 0 60px rgba(0,210,255,0.15)" }}
                    >
                        {/* Header */}
                        <div className="p-5 border-b border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-neon-blue/10 border border-neon-blue/20 flex items-center justify-center">
                                    <Terminal className="w-4 h-4 text-neon-blue" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-white">Command to JARVIS</p>
                                    <p className="text-[10px] text-white/30">AI Browser Agent</p>
                                </div>
                            </div>
                            <Button variant="ghost" size="icon" onClick={onClose} className="text-white/30 hover:text-white rounded-full h-8 w-8">
                                <X className="w-4 h-4" />
                            </Button>
                        </div>

                        <div className="p-5 space-y-4">
                            {/* Command Input */}
                            {!result && (
                                <>
                                    <div>
                                        <p className="text-xs text-white/40 mb-2 font-mono uppercase tracking-wider">What do you want JARVIS to do?</p>
                                        <textarea
                                            value={command}
                                            onChange={(e) => setCommand(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    handleAnalyze();
                                                }
                                            }}
                                            placeholder="e.g. Make a landing page for my fitness app..."
                                            rows={3}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-neon-blue/40 resize-none transition-all"
                                        />
                                    </div>

                                    {/* Examples */}
                                    <div className="flex flex-wrap gap-2">
                                        {[
                                            "Make a landing page for my startup",
                                            "Write a blog post about AI",
                                            "Create a React component for login",
                                            "Research latest AI trends",
                                        ].map((ex, i) => (
                                            <button
                                                key={i}
                                                onClick={() => setCommand(ex)}
                                                className="text-[10px] px-2 py-1 rounded-lg border border-white/5 bg-white/[0.02] text-white/30 hover:text-white hover:border-white/10 transition-all"
                                            >
                                                {ex}
                                            </button>
                                        ))}
                                    </div>

                                    {error && (
                                        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                            {error}
                                        </div>
                                    )}

                                    <Button
                                        onClick={handleAnalyze}
                                        disabled={!command.trim() || loading}
                                        className="w-full h-10 bg-gradient-to-r from-neon-blue/80 to-neon-purple/80 text-white font-bold rounded-xl hover:opacity-90 transition-all"
                                    >
                                        {loading ? (
                                            <div className="flex items-center gap-2">
                                                <Sparkles className="w-4 h-4 animate-spin" />
                                                Analyzing best tools...
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <Zap className="w-4 h-4" />
                                                Analyze & Find Best Tool
                                            </div>
                                        )}
                                    </Button>
                                </>
                            )}

                            {/* Results */}
                            {result && !executed && (
                                <div className="space-y-4">
                                    <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                                        <p className="text-[11px] text-white/40 mb-1 font-mono">YOUR COMMAND</p>
                                        <p className="text-sm text-white">{command}</p>
                                    </div>

                                    {/* Best Tool */}
                                    <div>
                                        <p className="text-[9px] text-white/20 uppercase tracking-wider font-bold mb-2">🥇 Best Option</p>
                                        <motion.div
                                            initial={{ opacity: 0, y: 5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            onClick={() => setSelectedTool(result.bestTool)}
                                            className={cn(
                                                "p-3 rounded-xl border cursor-pointer transition-all",
                                                selectedTool?.name === result.bestTool.name
                                                    ? "border-neon-blue/40 bg-neon-blue/5"
                                                    : "border-white/10 bg-white/[0.02] hover:border-white/20"
                                            )}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Globe className="w-4 h-4 text-neon-blue" />
                                                    <span className="text-sm font-bold text-white">{result.bestTool.name}</span>
                                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-neon-blue/10 text-neon-blue font-mono">{result.bestTool.score}%</span>
                                                </div>
                                                {selectedTool?.name === result.bestTool.name && (
                                                    <Check className="w-4 h-4 text-neon-blue" />
                                                )}
                                            </div>
                                            <p className="text-[11px] text-white/40 mt-1 ml-6">{result.bestTool.reason}</p>
                                        </motion.div>
                                    </div>

                                    {/* Alternatives */}
                                    {result.alternatives.length > 0 && (
                                        <div>
                                            <p className="text-[9px] text-white/20 uppercase tracking-wider font-bold mb-2">🥈 Alternatives</p>
                                            <div className="space-y-2">
                                                {result.alternatives.map((tool, i) => (
                                                    <motion.div
                                                        key={i}
                                                        initial={{ opacity: 0, y: 5 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ delay: i * 0.1 }}
                                                        onClick={() => setSelectedTool(tool)}
                                                        className={cn(
                                                            "p-3 rounded-xl border cursor-pointer transition-all",
                                                            selectedTool?.name === tool.name
                                                                ? "border-neon-blue/40 bg-neon-blue/5"
                                                                : "border-white/5 bg-white/[0.01] hover:border-white/10"
                                                        )}
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-2">
                                                                <Globe className="w-3.5 h-3.5 text-white/30" />
                                                                <span className="text-sm text-white/70">{tool.name}</span>
                                                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-white/30 font-mono">{tool.score}%</span>
                                                            </div>
                                                            {selectedTool?.name === tool.name && (
                                                                <Check className="w-4 h-4 text-neon-blue" />
                                                            )}
                                                        </div>
                                                        <p className="text-[10px] text-white/25 mt-1 ml-5">{tool.reason}</p>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {error && (
                                        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                            {error}
                                        </div>
                                    )}

                                    {/* Action buttons */}
                                    <div className="flex gap-2">
                                        <Button
                                            variant="ghost"
                                            onClick={handleReset}
                                            className="flex-1 h-10 border border-white/10 text-white/50 hover:text-white rounded-xl text-sm"
                                        >
                                            ← Change Command
                                        </Button>
                                        <Button
                                            onClick={() => selectedTool && handleExecute(selectedTool)}
                                            disabled={!selectedTool || executing}
                                            className="flex-1 h-10 bg-gradient-to-r from-neon-blue/80 to-neon-purple/80 text-white font-bold rounded-xl hover:opacity-90 transition-all"
                                        >
                                            {executing ? (
                                                <div className="flex items-center gap-2">
                                                    <Sparkles className="w-4 h-4 animate-spin" />
                                                    Executing...
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    <ArrowRight className="w-4 h-4" />
                                                    Execute with {selectedTool?.name}
                                                </div>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* Success */}
                            {executed && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="text-center py-8 space-y-4"
                                >
                                    <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto">
                                        <Check className="w-8 h-8 text-green-400" />
                                    </div>
                                    <div>
                                        <p className="text-white font-bold">Command Sent!</p>
                                        <p className="text-white/40 text-sm mt-1">
                                            JARVIS is executing your command on {selectedTool?.name}
                                        </p>
                                    </div>
                                    <Button
                                        onClick={handleReset}
                                        className="h-9 px-6 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm"
                                    >
                                        New Command
                                    </Button>
                                </motion.div>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};