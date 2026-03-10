"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    X,
    Mic,
    MicOff,
    Bot,
    User,
    Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface VoiceMessage {
    role: "user" | "assistant";
    content: string;
    provider?: string;
    isInterim?: boolean;
}

const PROVIDER_COLORS: Record<string, string> = {
    groq: "text-orange-400",
    gemini: "text-blue-400",
    cohere: "text-emerald-400",
    huggingface: "text-yellow-400",
};

const PROVIDER_ICONS: Record<string, string> = {
    groq: "⚡",
    gemini: "💎",
    cohere: "🌿",
    huggingface: "🤗",
};

// ── Word by Word Animation ────────────────────────────────
const WordByWord = ({ text, isInterim }: { text: string; isInterim?: boolean }) => {
    const words = useMemo(() => text.split(" "), [text]);
    
    return (
        <span className={cn("inline-block", isInterim && "opacity-60")}>
            {words.map((word, i) => (
                <motion.span
                    key={i}
                    initial={{ opacity: 0, filter: "blur(4px)", y: 5 }}
                    animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
                    transition={{
                        duration: 0.3,
                        delay: i * 0.05,
                        ease: "easeOut"
                    }}
                    className="inline-block mr-[0.25em]"
                >
                    {word}
                </motion.span>
            ))}
            {isInterim && <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 0.8 }} className="inline-block w-1.5 h-4 bg-white/40 ml-1 translate-y-0.5" />}
        </span>
    );
};

// ── Real-time Audio Visualizer ────────────────────────────
const LiveVisualizer = ({ isActive, colorTheme = "blue" }: { isActive: boolean; colorTheme?: "blue" | "red" | "purple" }) => {
    const [amplitudes, setAmplitudes] = useState<number[]>(new Array(24).fill(4));
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyzerRef = useRef<AnalyserNode | null>(null);
    const dataArrayRef = useRef<Uint8Array | null>(null);
    const animationRef = useRef<number | null>(null);

    useEffect(() => {
        if (!isActive) {
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
            setAmplitudes(new Array(24).fill(4));
            return;
        }

        const startAudio = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
                const audioCtx = new AudioContextClass();
                const analyser = audioCtx.createAnalyser();
                const source = audioCtx.createMediaStreamSource(stream);
                
                source.connect(analyser);
                analyser.fftSize = 64;
                const bufferLength = analyser.frequencyBinCount;
                const dataArray = new Uint8Array(bufferLength);
                
                audioContextRef.current = audioCtx;
                analyzerRef.current = analyser;
                dataArrayRef.current = dataArray;

                const update = () => {
                    if (!analyzerRef.current || !dataArrayRef.current) return;
                    analyzerRef.current.getByteFrequencyData(dataArrayRef.current as any);
                    
                    // Map frequency data to 24 bars
                    const newAmps = Array.from({ length: 24 }).map((_, i) => {
                        const val = dataArrayRef.current![i % bufferLength];
                        return Math.max(4, (val / 255) * 32);
                    });
                    
                    setAmplitudes(newAmps);
                    animationRef.current = requestAnimationFrame(update);
                };
                
                update();
            } catch (err) {
                console.error("Audio visualization failed", err);
            }
        };

        startAudio();

        return () => {
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
            if (audioContextRef.current) audioContextRef.current.close();
        };
    }, [isActive]);

    const themeMap = {
        blue: "from-cyan-400 to-blue-500 shadow-[0_0_12px_rgba(34,211,238,0.5)]",
        red: "from-red-400 to-pink-600 shadow-[0_0_12px_rgba(239,68,68,0.5)]",
        purple: "from-purple-400 to-indigo-600 shadow-[0_0_12px_rgba(168,85,247,0.5)]"
    };

    return (
        <div className="flex items-center justify-center gap-[4px] h-12 w-full max-w-[320px]">
            {amplitudes.map((amp, i) => (
                <motion.div
                    key={i}
                    animate={{ height: amp }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className={cn(
                        "w-[3.5px] rounded-full bg-gradient-to-t transition-colors duration-500",
                        isActive ? themeMap[colorTheme] : "bg-white/10"
                    )}
                />
            ))}
        </div>
    );
};

interface VoiceModalProps {
    isOpen: boolean;
    onClose: () => void;
    isVoiceRecording: boolean;
    isSpeaking: boolean;
    voiceLoading: boolean;
    voiceMessages: VoiceMessage[];
    onToggleRecording: () => void;
    interimTranscript?: string;
}
// ...
export const VoiceModal = ({
    isOpen,
    onClose,
    isVoiceRecording,
    isSpeaking,
    voiceLoading,
    voiceMessages,
    onToggleRecording,
    interimTranscript = "",
}: VoiceModalProps) => {
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll logic
    useEffect(() => {
        if (scrollRef.current) {
            const scrollContainer = scrollRef.current;
            scrollContainer.scrollTo({
                top: scrollContainer.scrollHeight,
                behavior: "auto"
            });
        }
    }, [voiceMessages, interimTranscript]);

    const status = useMemo(() => {
        if (voiceLoading) return { label: "Processing", color: "bg-yellow-400", theme: "purple" as const };
        if (isVoiceRecording) return { label: "Listening", color: "bg-red-500", theme: "red" as const };
        if (isSpeaking) return { label: "Speaking", color: "bg-green-500", theme: "blue" as const };
        return { label: "Ready", color: "bg-blue-500", theme: "blue" as const };
    }, [voiceLoading, isVoiceRecording, isSpeaking]);

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-hidden">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-[#020617]/90 backdrop-blur-2xl"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 30 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 30 }}
                        className="relative w-full max-w-[500px] h-[700px] bg-gradient-to-b from-[#0f172a] to-[#020617] border border-white/10 rounded-[2.5rem] shadow-[0_0_80px_rgba(0,210,255,0.2)] overflow-hidden flex flex-col"
                    >
                        {/* Futuristic Grid Overlay */}
                        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none opacity-40" />
                        
                        {/* Header */}
                        <div className="relative px-8 py-6 flex items-center justify-between border-b border-white/5 bg-white/[0.03] backdrop-blur-xl">
                            <div className="flex items-center gap-4">
                                <div className="relative w-12 h-12 flex items-center justify-center">
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                                        className="absolute inset-0 rounded-full border-2 border-dashed border-cyan-500/30"
                                    />
                                    <Bot className="w-6 h-6 text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
                                </div>
                                <div>
                                    <h3 className="text-white font-black tracking-tight text-xl uppercase italic">JARVIS Mode</h3>
                                    <div className="flex items-center gap-2.5 mt-1">
                                        <motion.div
                                            animate={status.label !== "Ready" ? { scale: [1, 1.3, 1], opacity: [1, 0.5, 1] } : {}}
                                            transition={{ repeat: Infinity, duration: 1 }}
                                            className={cn("w-2.5 h-2.5 rounded-full shadow-[0_0_8px_rgba(255,255,255,0.3)]", status.color)}
                                        />
                                        <span className="text-[11px] uppercase tracking-[0.2em] text-white/50 font-black">
                                            Link: {status.label}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={onClose}
                                className="rounded-full w-10 h-10 hover:bg-white/10 text-white/30 hover:text-white transition-all shadow-inner"
                            >
                                <X size={20} />
                            </Button>
                        </div>

                        {/* Message Feed */}
                        <div
                            ref={scrollRef}
                            className="flex-1 overflow-y-auto px-8 py-10 space-y-10 scroll-smooth no-scrollbar"
                        >
                            {voiceMessages.length === 0 && !interimTranscript && (
                                <motion.div 
                                    initial={{ opacity: 0 }} 
                                    animate={{ opacity: 0.15 }}
                                    className="h-full flex flex-col items-center justify-center text-center italic"
                                >
                                    <Bot size={64} className="mb-6 opacity-30 animate-pulse" />
                                    <p className="text-lg font-mono tracking-widest uppercase">Waiting for Input...</p>
                                </motion.div>
                            )}

                            {voiceMessages.map((msg, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={cn(
                                        "flex gap-4",
                                        msg.role === "user" ? "flex-row-reverse" : "flex-row"
                                    )}
                                >
                                    <div className={cn(
                                        "w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0 mt-1 shadow-inner border",
                                        msg.role === "user" ? "bg-purple-500/20 border-purple-500/30 text-purple-400" : "bg-cyan-500/20 border-cyan-500/30 text-cyan-400"
                                    )}>
                                        {msg.role === "user" ? <User size={18} /> : <Bot size={18} />}
                                    </div>
                                    <div className={cn("flex flex-col gap-2.5 max-w-[85%]", msg.role === "user" ? "items-end" : "items-start")}>
                                        <div className={cn(
                                            "px-5 py-3.5 rounded-[1.5rem] text-[15px] font-medium leading-relaxed shadow-2xl transition-all duration-500 backdrop-blur-md",
                                            msg.role === "user"
                                                ? "bg-gradient-to-br from-indigo-600/30 to-purple-700/30 border border-purple-500/20 rounded-tr-none text-purple-50"
                                                : "bg-gradient-to-br from-cyan-600/20 to-blue-700/20 border border-cyan-500/20 rounded-tl-none text-cyan-50"
                                        )}>
                                            <WordByWord text={msg.content} />
                                        </div>
                                        {msg.provider && (
                                            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/5 shadow-sm">
                                                <span className="text-[10px] font-black uppercase text-white/30 tracking-tight">AI Engine</span>
                                                <span className={cn("text-[10px] font-black uppercase flex items-center gap-1.5", PROVIDER_COLORS[msg.provider.toLowerCase()] || "text-white/60")}>
                                                    {PROVIDER_ICONS[msg.provider.toLowerCase()] || "●"} {msg.provider}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            ))}

                            {/* Interim Transcript (Real-time Speech-to-Text) */}
                            {interimTranscript && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex gap-4 flex-row-reverse"
                                >
                                    <div className="w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0 mt-1 bg-white/10 border border-white/10 text-white/40">
                                        <User size={18} />
                                    </div>
                                    <div className="flex flex-col gap-2.5 items-end max-w-[85%]">
                                        <div className="px-5 py-3.5 rounded-[1.5rem] rounded-tr-none bg-white/5 border border-white/10 text-[15px] font-medium leading-relaxed italic text-white/60 shadow-lg">
                                            <WordByWord text={interimTranscript} isInterim />
                                        </div>
                                        <div className="flex items-center gap-1.5 px-3 py-1">
                                            <span className="text-[10px] font-black uppercase text-red-500/80 tracking-widest animate-pulse">Capturing Voice...</span>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </div>

                        {/* Footer Controls */}
                        <div className="p-10 bg-white/[0.04] border-t border-white/5 backdrop-blur-3xl flex flex-col items-center gap-10">
                            {/* Real-time Waveform Bars */}
                            <LiveVisualizer isActive={isVoiceRecording || isSpeaking} colorTheme={status.theme} />

                            <div className="relative group/mic">
                                <AnimatePresence>
                                    {isVoiceRecording && (
                                        <motion.div
                                            initial={{ scale: 1, opacity: 0 }}
                                            animate={{ scale: [1, 1.8, 1], opacity: [0, 0.5, 0] }}
                                            transition={{ repeat: Infinity, duration: 2, ease: "easeOut" }}
                                            className="absolute inset-0 rounded-full border-4 border-red-500/40"
                                        />
                                    )}
                                </AnimatePresence>

                                <motion.button
                                    whileHover={{ scale: 1.1, rotate: isVoiceRecording ? 0 : 5 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={onToggleRecording}
                                    className={cn(
                                        "relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-700 shadow-[0_0_40px_rgba(0,0,0,0.5)] z-20 border-4",
                                        isVoiceRecording
                                            ? "bg-red-500 border-white/20 shadow-[0_0_60px_rgba(239,68,68,0.7)]"
                                            : "bg-gradient-to-tr from-cyan-500 to-indigo-600 border-white/10 shadow-[0_0_40px_rgba(34,211,238,0.5)]"
                                    )}
                                >
                                    {voiceLoading ? (
                                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}>
                                            <Sparkles size={32} className="text-white drop-shadow-[0_0_8px_white]" />
                                        </motion.div>
                                    ) : isVoiceRecording ? (
                                        <MicOff size={32} className="text-white animate-pulse" />
                                    ) : (
                                        <Mic size={32} className="text-white" />
                                    )}
                                </motion.button>
                                
                                {/* Background Aura */}
                                <div className={cn(
                                    "absolute inset-0 blur-3xl rounded-full opacity-30 transition-all duration-1000",
                                    isVoiceRecording ? "bg-red-500 scale-150" : "bg-cyan-500 scale-125"
                                )} />
                            </div>

                            <div className="flex flex-col items-center gap-2">
                                <motion.p 
                                    animate={isVoiceRecording ? { scale: [1, 1.05, 1], opacity: [0.6, 1, 0.6] } : {}}
                                    transition={{ repeat: Infinity, duration: 2 }}
                                    className={cn(
                                        "text-xs font-black uppercase tracking-[0.4em] transition-all duration-500",
                                        isVoiceRecording ? "text-red-400 drop-shadow-[0_0_5px_rgba(239,68,68,0.5)]" : "text-white/40"
                                    )}
                                >
                                    {isVoiceRecording ? "Protocol: Listening" : isSpeaking ? "Communication: Active" : "Standby: Online"}
                                </motion.p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
