"use client";

import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Plus,
    MessageSquare,
    Edit2,
    Settings,
    LogOut,
    Sparkles,
    PanelLeft,
    MessageCircle,
    Info,
    Library,
    Mic,
    MicOff,
    X,
    Volume2,
    VolumeX,
    Bot,
    User,
    Trash2,
    Pin,
    Check,
    MoreHorizontal,
    Calendar,
    Clock as ClockIcon,
    ChevronRight,
    Search,
    Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { auth } from "@/lib/firebase";
import { User as FirebaseUser, signOut } from "firebase/auth";
import { useRouter } from "next/navigation";

interface SidebarProps {
    isCollapsed: boolean;
    setIsCollapsed: (value: boolean) => void;
    openSettings: () => void;
    openAuth: () => void;
    onNewChat: () => void;
    onSelectChat: (id: string, title: string) => void;
    onDeleteChat?: (id: string) => void;
    onRenameChat?: (id: string, newTitle: string) => void;
    onPinChat?: (id: string) => void;
    onMobileClose?: () => void;
    chats: { id: string | number; title: string; pinned?: boolean; updatedAt?: string }[];
    user: FirebaseUser | null;
    userPrompts?: any[];
    currentChatId?: string;
    onSyncHistory?: () => void;
}

interface VoiceMessage {
    role: "user" | "assistant";
    content: string;
    provider?: string;
}

const PROVIDER_COLORS: Record<string, string> = {
    groq: "text-orange-400",
    gemini: "text-green-400",
    cohere: "text-yellow-400",
    huggingface: "text-pink-400",
};

const PROVIDER_ICONS: Record<string, string> = {
    groq: "⚡",
    gemini: "🤖",
    cohere: "🧠",
    huggingface: "🤗",
};

function detectLanguage(text: string): "hi-IN" | "en-US" {
    const isHindi = /[\u0900-\u097F]/.test(text);
    return isHindi ? "hi-IN" : "en-US";
}

export const Sidebar = React.memo(({
    isCollapsed,
    setIsCollapsed,
    openSettings,
    openAuth,
    onNewChat,
    onSelectChat,
    onDeleteChat,
    onRenameChat,
    onPinChat,
    chats,
    user,
    userPrompts = [],
    currentChatId,
    onMobileClose,
    onSyncHistory,
}: SidebarProps) => {
    const router = useRouter();
    const { logout } = useAuth();

    const scrollToPrompt = (id: string) => {
        const el = document.getElementById(id);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    const [activeTab, setActiveTab] = useState("Chats");
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [isSearching, setIsSearching] = useState(false);

    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [voiceOpen, setVoiceOpen] = useState(false);
    const [isUserTalking, setIsUserTalking] = useState(false);
    const [voiceMessages, setVoiceMessages] = useState<VoiceMessage[]>([]);
    const [isVoiceRecording, setIsVoiceRecording] = useState(false);
    const [voiceLoading, setVoiceLoading] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isProjectsOpen, setIsProjectsOpen] = useState(false);
    const voiceRecognitionRef = useRef<any>(null);
    const voiceBottomRef = useRef<HTMLDivElement>(null);
    const voiceMessagesRef = useRef<VoiceMessage[]>([]);
    const voiceSessionIdRef = useRef<string>("");

    useEffect(() => {
        voiceMessagesRef.current = voiceMessages;
    }, [voiceMessages]);

    useEffect(() => {
        if (voiceOpen && !voiceSessionIdRef.current) {
            voiceSessionIdRef.current = "jarvis-voice-" + Math.random().toString(36).slice(2, 9);
        }
    }, [voiceOpen]);

    const summarizeTitle = useCallback((text: string) => {
        const clean = text.replace(/\[Reply strictly in .+? only\]\s*/i, '').replace(/\[.*?\]\s*/g, '').trim();
        const words = clean.split(/\s+/);
        if (words.length > 3) {
            return words.slice(0, 3).join(' ') + '...';
        }
        return clean.slice(0, 20) + (clean.length > 20 ? '...' : '') || "New Chat";
    }, []);

    const closeVoiceMode = useCallback(() => {
        window.speechSynthesis.cancel();
        if (voiceRecognitionRef.current) {
            voiceRecognitionRef.current.stop();
            voiceRecognitionRef.current = null;
        }
        setVoiceOpen(false);
        setIsVoiceRecording(false);
        setIsUserTalking(false);

        if (voiceMessages.length > 0 && voiceSessionIdRef.current) {
            const firstUserMsg = voiceMessages.find(m => m.role === 'user')?.content || "Voice Session";
            const title = summarizeTitle(firstUserMsg);
            onSyncHistory?.();
            onSelectChat(voiceSessionIdRef.current, title);
            setVoiceMessages([]);
            voiceSessionIdRef.current = "";
        }
    }, [voiceMessages, onSelectChat, onSyncHistory, summarizeTitle]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                if (voiceOpen) {
                    closeVoiceMode();
                } else {
                    setIsHistoryOpen(false);
                }
            }
            if (e.ctrlKey && e.key.toLowerCase() === 'h') {
                e.preventDefault();
                setIsHistoryOpen(prev => !prev);
            }
            if (e.ctrlKey && e.key.toLowerCase() === 'm') {
                e.preventDefault();
                if (voiceOpen) {
                    closeVoiceMode();
                } else {
                    setVoiceOpen(true);
                }
            }
            if (e.code === 'Space' && voiceOpen) {
                const target = e.target as HTMLElement;
                if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
                    e.preventDefault();
                    toggleVoiceRecording();
                }
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [voiceOpen, closeVoiceMode]);

    const navItems = [
        { id: "new", icon: <Plus className="w-4.5 h-4.5" />, label: "New chat" },
        { id: "Chats", icon: <MessageCircle className="w-4.5 h-4.5" />, label: "Chats" },
        { id: "voice", icon: <Mic className="w-4.5 h-4.5" />, label: "Talk to Jarvis" },
        { id: "projects", icon: <Library className="w-4.5 h-4.5" />, label: "Projects" },
    ];

    function speakText(text: string) {
        window.speechSynthesis.cancel();

        setTimeout(() => {
            const lang = detectLanguage(text);
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 0.95;
            utterance.pitch = 1;
            utterance.volume = 1;
            utterance.lang = lang;

            const trySpeak = () => {
                const voices = window.speechSynthesis.getVoices();

                if (lang === "hi-IN") {
                    const hindiVoice = voices.find(v =>
                        v.lang === "hi-IN" ||
                        v.lang.startsWith("hi") ||
                        v.name.toLowerCase().includes("hindi")
                    );
                    if (hindiVoice) utterance.voice = hindiVoice;
                } else {
                    const englishVoice = voices.find(v =>
                        v.name === "Google US English" ||
                        v.name === "Samantha" ||
                        (v.lang === "en-US" && v.localService)
                    );
                    if (englishVoice) utterance.voice = englishVoice;
                }

                utterance.onstart = () => setIsSpeaking(true);
                utterance.onend = () => setIsSpeaking(false);
                utterance.onerror = () => setIsSpeaking(false);
                window.speechSynthesis.speak(utterance);
            };

            if (window.speechSynthesis.getVoices().length > 0) {
                trySpeak();
            } else {
                window.speechSynthesis.onvoiceschanged = trySpeak;
            }
        }, 150);
    }

    async function getAIResponse(
        userMessage: string,
        history: VoiceMessage[]
    ): Promise<{ content: string; provider: string }> {
        const token = user ? await user.getIdToken() : null;
        if (!token) throw new Error("Please log in to use voice chat.");

        const res = await fetch("/api/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                message: userMessage,
                sessionId: voiceSessionIdRef.current,
                history: history.slice(-10).map(m => ({
                    role: m.role,
                    content: m.content,
                })),
            }),
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const reader = res.body!.getReader();
        const decoder = new TextDecoder();
        let acumulData = "";
        let fullCont = "";
        let prov = "";

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            acumulData += decoder.decode(value, { stream: true });
            const lines = acumulData.split("\n");
            acumulData = lines.pop() || "";

            for (const line of lines) {
                if (!line.trim() || !line.startsWith("data:")) continue;
                const data = line.replace("data: ", "").trim();
                if (data === "[DONE]") continue;
                try {
                    const parsed = JSON.parse(data);
                    if (parsed.content) {
                        fullCont += parsed.content;
                        if (parsed.provider) prov = parsed.provider;
                    }
                } catch (e) { }
            }
        }

        if (!fullCont) throw new Error("Empty response");
        return { content: fullCont, provider: prov };
    }

    function toggleVoiceRecording() {
        if (!user) {
            openAuth();
            return;
        }

        const SpeechRecognition =
            (window as any).SpeechRecognition ||
            (window as any).webkitSpeechRecognition;

        if (!SpeechRecognition) {
            alert("Speech recognition not supported.");
            return;
        }

        if (isVoiceRecording) {
            voiceRecognitionRef.current?.stop();
            setIsVoiceRecording(false);
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = navigator.language || "en-US";

        let silenceTimer: any = null;

        recognition.onstart = () => {
            setIsVoiceRecording(true);
            setIsUserTalking(false);
        };

        recognition.onspeechstart = () => setIsUserTalking(true);
        recognition.onspeechend = () => setIsUserTalking(false);

        recognition.onresult = async (event: any) => {
            setIsUserTalking(true);
            clearTimeout(silenceTimer);
            silenceTimer = setTimeout(() => setIsUserTalking(false), 400);

            const lastResult = event.results[event.results.length - 1];
            if (lastResult.isFinal) {
                const transcript = lastResult[0].transcript;
                handleVoiceCommand(transcript);
            }
        };

        recognition.onend = () => {
            setIsVoiceRecording(false);
            setIsUserTalking(false);
            clearTimeout(silenceTimer);
        };
        recognition.onerror = () => {
            setIsVoiceRecording(false);
            setIsUserTalking(false);
            clearTimeout(silenceTimer);
        };

        voiceRecognitionRef.current = recognition;
        recognition.start();
    }

    async function handleVoiceCommand(transcript: string) {
        if (!transcript.trim()) return;

        const isHindi = /[\u0900-\u097F]/.test(transcript);
        const langLabel = isHindi ? "Hindi" : "English";

        const currentHistory = voiceMessagesRef.current;
        const userMsg: VoiceMessage = { role: "user", content: transcript };

        setVoiceMessages(prev => [...prev, userMsg, { role: "assistant", content: "" }]);
        setVoiceLoading(true);

        try {
            const messageWithLang = `[Reply strictly in ${langLabel} only] ${transcript}`;
            const { content, provider } = await getAIResponse(messageWithLang, currentHistory);

            setVoiceMessages(prev => {
                const newMsgs = [...prev];
                newMsgs[newMsgs.length - 1] = { role: "assistant", content, provider };
                return newMsgs;
            });

            speakText(content);
            setTimeout(() => voiceBottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
        } catch (err: any) {
            setVoiceMessages(prev => {
                const newMsgs = [...prev];
                newMsgs[newMsgs.length - 1] = {
                    role: "assistant",
                    content: err.message || "Error occurred",
                };
                return newMsgs;
            });
        } finally {
            setVoiceLoading(false);
        }
    }

    return (
        <>
            <motion.aside
                initial={false}
                animate={{ width: isCollapsed ? 52 : 260 }}
                className="flex h-[100dvh] flex-col bg-[#020617]/90 backdrop-blur-2xl relative z-50 overflow-hidden border-r border-white/10"
            >
                <div className="h-14 flex items-center justify-between px-3 flex-shrink-0">
                    {!isCollapsed && (
                        <motion.span
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ 
                                opacity: 1, 
                                scale: 1,
                                filter: ["drop-shadow(0 0 2px rgba(0,210,255,0.3))", "drop-shadow(0 0 8px rgba(0,210,255,0.5))", "drop-shadow(0 0 2px rgba(0,210,255,0.3))"]
                            }}
                            transition={{ 
                                filter: { repeat: Infinity, duration: 4, ease: "easeInOut" },
                                duration: 0.5 
                            }}
                            className="text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-neon-blue via-white to-neon-purple pl-2 drop-shadow-[0_0_10px_rgba(0,210,255,0.2)]"
                        >
                            JARVIS
                        </motion.span>
                    )}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onMobileClose ? onMobileClose() : setIsCollapsed(!isCollapsed)}
                        className={cn("text-white/40 hover:text-white hover:bg-white/5 rounded-lg h-9 w-9", isCollapsed && "w-full")}
                    >
                        {onMobileClose ? <X className="w-5 h-5" /> : <PanelLeft className="w-5 h-5" />}
                    </Button>
                </div>

                <div className="flex flex-col pt-12 pb-2 px-2 gap-0.5 flex-shrink-0">
                    {navItems.map((item) => (
                        <React.Fragment key={item.id}>
                            <Tooltip delayDuration={isCollapsed ? 0 : 500}>
                                <TooltipTrigger asChild>
                                    <div
                                        onClick={() => {
                                            if (item.id === "voice") {
                                                setVoiceOpen(true);
                                                return;
                                            }
                                            if (item.id === "Chats") {
                                                setIsHistoryOpen(true);
                                                return;
                                            }
                                            if (item.id === "new") onNewChat();
                                            if (item.id === "projects") {
                                                setIsProjectsOpen(true);
                                                return;
                                            }
                                        }}
                                        className={cn(
                                            "flex items-center gap-3 px-2 py-2 rounded-xl cursor-pointer transition-all group text-white/40 hover:text-white hover:bg-white/5",
                                            isCollapsed && "justify-center px-0"
                                        )}
                                    >
                                        <div className="flex-shrink-0">{item.icon}</div>
                                        {!isCollapsed && <span className="text-[13.5px] font-medium">{item.label}</span>}
                                    </div>
                                </TooltipTrigger>
                                {isCollapsed && <TooltipContent side="right">{item.label}</TooltipContent>}
                            </Tooltip>
                        </React.Fragment>
                    ))}

                    <AnimatePresence>
                        {userPrompts.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.3, ease: "easeOut" }}
                            >
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <div className={cn(
                                            "flex items-center gap-3 px-2 py-2 rounded-xl cursor-pointer transition-all group text-white/40 hover:text-white hover:bg-white/5 mt-0.5 outline-none relative",
                                            isCollapsed && "justify-center px-0"
                                        )}>
                                            <div className={cn(
                                                "flex flex-col gap-[1.5px] items-center justify-center w-[18px] h-[18px] shrink-0",
                                                isCollapsed ? "mx-auto" : ""
                                            )}>
                                                {userPrompts.slice(-3).map((p: any) => (
                                                    <div
                                                        key={p.id}
                                                        className="w-3.5 h-[1.5px] bg-jarvis-neon/40 shadow-[0_0_5px_rgba(0,229,255,0.2)] group-hover:bg-jarvis-neon group-hover:shadow-[0_0_8px_rgba(0,229,255,0.4)] transition-all"
                                                    />
                                                ))}
                                                {userPrompts.length === 0 && <Activity className="w-4 h-4" />}
                                            </div>
                                            {!isCollapsed && (
                                                <span className="text-[13px] font-semibold tracking-wide truncate">
                                                    ACTIVITY <span className="text-jarvis-neon">({userPrompts.length})</span>
                                                </span>
                                            )}
                                        </div>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent
                                        side="right"
                                        sideOffset={12}
                                        align="start"
                                        className="p-0 border-none bg-transparent shadow-none z-[100]"
                                    >
                                        <div className="w-[280px] sm:w-64 backdrop-blur-3xl bg-[linear-gradient(145deg,#07152f,#0b1f45)] border border-[rgba(0,170,255,0.25)] rounded-2xl overflow-hidden shadow-[0_0_25px_rgba(0,170,255,0.15)] animate-in fade-in slide-in-from-top-2 lg:slide-in-from-left-2 duration-300">
                                            <div className="p-3 border-b border-white/5 bg-white/5 flex items-center justify-between">
                                                <p className="text-[9px] font-bold text-neon-blue uppercase tracking-[0.2em] drop-shadow-[0_0_8px_rgba(0,210,255,0.4)]">Conversation Timeline</p>
                                                <span className="text-[9px] text-neon-blue font-bold px-1.5 py-0.5 bg-neon-blue/10 rounded-md border border-neon-blue/20">
                                                    {userPrompts.length} Prompts
                                                </span>
                                            </div>
                                            <ScrollArea className="max-h-[300px]">
                                                <div className="p-1.5 space-y-0.5">
                                                    {userPrompts.map((p: any, i: number) => (
                                                        <DropdownMenuItem
                                                            key={p.id}
                                                            onClick={() => {
                                                                scrollToPrompt(p.id);
                                                                onMobileClose?.();
                                                            }}
                                                            className="w-full text-left px-2.5 py-2 rounded-lg focus:bg-neon-blue/10 text-[12px] text-white/70 focus:text-white transition-all flex items-start gap-3 group/item border border-transparent outline-none cursor-pointer"
                                                        >
                                                            <span className="text-[9px] font-mono text-neon-blue/40 mt-0.5 min-w-[12px]">{i + 1}</span>
                                                            <span className="line-clamp-2 leading-tight">{p.content.trim()}</span>
                                                        </DropdownMenuItem>
                                                    ))}
                                                </div>
                                            </ScrollArea>
                                        </div>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {!isCollapsed && (
                    <div className="mt-6 flex flex-col flex-1 min-h-0 overflow-hidden">
                        <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] mb-2 px-6">Recents</p>
                        <ScrollArea className="flex-1 jarvis-scrollbar pr-1">
                            <div className="pl-3 pr-2 space-y-0.5 pb-6">
                                {chats.map(chat => {
                                    const isActive = chat.id.toString() === currentChatId;
                                    return (
                                        <div
                                            key={chat.id}
                                            className={cn(
                                                "group flex items-center justify-between gap-2 text-[14px] cursor-pointer py-1.5 px-3 rounded-xl transition-all duration-300 relative overflow-hidden mr-1",
                                                isActive
                                                    ? "bg-blue-500/10 text-white font-bold shadow-[0_0_20px_rgba(0,210,255,0.15)] ring-1 ring-white/5"
                                                    : "text-white/40 hover:text-white hover:bg-white/5"
                                            )}
                                        >
                                            {editingId === chat.id.toString() ? (
                                                <div className="flex items-center gap-1 w-full" onClick={(e) => e.stopPropagation()}>
                                                    <Input
                                                        autoFocus
                                                        value={editTitle}
                                                        onChange={(e) => setEditTitle(e.target.value)}
                                                        onBlur={() => {
                                                            if (onRenameChat && editTitle.trim()) {
                                                                onRenameChat(chat.id.toString(), editTitle);
                                                            }
                                                            setEditingId(null);
                                                        }}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') {
                                                                if (onRenameChat && editTitle.trim()) {
                                                                    onRenameChat(chat.id.toString(), editTitle);
                                                                }
                                                                setEditingId(null);
                                                            }
                                                        }}
                                                        className="h-6 bg-white/10 border-white/20 text-[13px] py-0 px-2 flex-1"
                                                    />
                                                    <button className="text-neon-blue hover:text-white" onClick={() => {
                                                        if (onRenameChat && editTitle.trim()) {
                                                            onRenameChat(chat.id.toString(), editTitle);
                                                        }
                                                        setEditingId(null);
                                                    }}>
                                                        <Check className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <>
                                                    <div
                                                        onClick={() => onSelectChat(chat.id.toString(), chat.title)}
                                                        className="flex-1 min-w-0 flex items-center gap-2"
                                                    >
                                                        {chat.pinned && <Pin className="w-3 h-3 text-neon-blue rotate-45 fill-neon-blue shrink-0" />}
                                                        <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                                            {chat.title.includes('[Reply strictly in ') && <Mic className="w-3 h-3 text-blue-400 shrink-0" />}
                                                            <span className={cn(
                                                                "truncate flex-1 min-w-0 transition-all duration-300",
                                                                isActive ? "text-white font-bold" : "text-white/50 group-hover:text-white"
                                                            )}>
                                                                {chat.title.replace(/\[Reply strictly in .+? only\]\s*/i, '')}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="flex shrink-0 items-center opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-all duration-300">
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <button
                                                                    onClick={(e) => e.stopPropagation()}
                                                                    className="p-1 text-white/30 hover:text-white rounded-lg transition-colors"
                                                                >
                                                                    <MoreHorizontal className="w-4 h-4" />
                                                                </button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end" className="w-40 glass-dark border-white/10 text-white p-1">
                                                                <DropdownMenuItem
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setEditingId(chat.id.toString());
                                                                        setEditTitle(chat.title);
                                                                    }}
                                                                    className="flex items-center gap-2 cursor-pointer focus:bg-white/10"
                                                                >
                                                                    <Edit2 className="w-3.5 h-3.5 text-neon-blue" />
                                                                    <span>Rename</span>
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        if (onPinChat) onPinChat(chat.id.toString());
                                                                    }}
                                                                    className="flex items-center gap-2 cursor-pointer focus:bg-white/10"
                                                                >
                                                                    <Pin className={cn("w-3.5 h-3.5 text-purple-400", chat.pinned && "fill-purple-400")} />
                                                                    <span>{chat.pinned ? "Unpin Chat" : "Pin Chat"}</span>
                                                                </DropdownMenuItem>
                                                                {onDeleteChat && (
                                                                    <DropdownMenuItem
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            onDeleteChat(chat.id.toString());
                                                                        }}
                                                                        className="flex items-center gap-2 cursor-pointer focus:bg-red-500/20 text-red-400 focus:text-red-400"
                                                                    >
                                                                        <Trash2 className="w-3.5 h-3.5" />
                                                                        <span>Delete</span>
                                                                    </DropdownMenuItem>
                                                                )}
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        </ScrollArea>
                    </div>
                )}

                <div className="mt-auto p-2 border-t border-white/5">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <div className={cn("flex items-center justify-between p-2 rounded-xl hover:bg-white/5 cursor-pointer", isCollapsed && "justify-center px-0")}>
                                <div className="flex items-center gap-3 truncate">
                                    <Avatar className="w-8 h-8 flex-shrink-0">
                                        <AvatarFallback className="bg-white/10 text-white text-xs">
                                            {(user?.displayName?.[0] || user?.email?.[0] || "?").toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    {!isCollapsed && <span className="text-sm font-bold text-white truncate">{user?.displayName || "Anonymous"}</span>}
                                </div>
                                {!isCollapsed && <Settings className="w-4 h-4 text-white/20" />}
                            </div>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 glass-dark border-white/10 text-white p-1">
                            {user ? (
                                <>
                                    <DropdownMenuItem onClick={openSettings} className="cursor-pointer">Settings</DropdownMenuItem>
                                    <Separator className="bg-white/5 my-1" />
                                    <DropdownMenuItem onClick={() => logout()} className="text-red-400 cursor-pointer">Logout</DropdownMenuItem>
                                </>
                            ) : (
                                <DropdownMenuItem onClick={openAuth} className="cursor-pointer">Login</DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </motion.aside>

            {/* Voice Modal */}
            <AnimatePresence>
                {voiceOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] flex items-center justify-center sm:p-4 bg-black/80 backdrop-blur-md"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="w-full h-full sm:w-[500px] sm:h-[85vh] sm:max-h-[750px] bg-[#020617] sm:border border-blue-500/20 sm:rounded-[40px] flex flex-col relative overflow-hidden shadow-[0_0_100px_rgba(59,130,246,0.15)]"
                        >
                            <div className="absolute inset-0 opacity-10 pointer-events-none">
                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,#3b82f6_1px,transparent_1px)] bg-[size:32px_32px]" />
                                <div className="absolute top-0 left-0 w-full h-[1px] bg-blue-500/30 animate-scan" />
                            </div>

                            <div className="p-3 border-b border-white/5 flex items-center justify-between bg-white/[0.02] relative z-10">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                                        <Bot className={cn("w-4 h-4", isSpeaking ? "text-blue-400 animate-pulse" : "text-blue-500/40")} />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-black text-white tracking-widest uppercase italic">Talk to Jarvis</h3>
                                        <p className="text-[10px] text-blue-400/50 font-mono flex items-center gap-2">
                                            {isVoiceRecording ? (
                                                <>
                                                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                                                    VOICE UPLINK ACTIVE
                                                </>
                                            ) : (
                                                "STANDBY MODE"
                                            )}
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={closeVoiceMode}
                                    className="text-white/20 hover:text-white hover:bg-white/5 rounded-full"
                                >
                                    <X className="w-5 h-5" />
                                </Button>
                            </div>

                            <div className="h-40 sm:h-32 relative overflow-hidden bg-gradient-to-b from-blue-500/15 via-transparent to-transparent border-b border-white/5 shrink-0">
                                <div className="absolute inset-0 [perspective:800px] opacity-10">
                                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#3b82f6_2px,transparent_2px),linear-gradient(to_bottom,#3b82f6_2px,transparent_2px)] bg-[size:50px_50px] [transform:rotateX(75deg)_translateY(-30%)] animate-data-stream" />
                                </div>

                                <div className="absolute inset-0 pointer-events-none">
                                    {[...Array(15)].map((_, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ x: "120%", y: Math.random() * 80 + 10 + "%" }}
                                            animate={{ x: "-120%" }}
                                            transition={{
                                                duration: 0.8 + Math.random() * 1.5,
                                                repeat: Infinity,
                                                ease: "linear",
                                                delay: Math.random() * 3
                                            }}
                                            className="absolute h-[2px] w-12 bg-gradient-to-r from-transparent via-blue-500 to-transparent"
                                        />
                                    ))}
                                </div>

                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="relative">
                                        <AnimatePresence>
                                            {isUserTalking && (
                                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                    {[1, 2, 3].map((v) => (
                                                        <motion.div
                                                            key={v}
                                                            initial={{ scale: 0.8, opacity: 0 }}
                                                            animate={{ scale: 1.5 + v * 0.2, opacity: 0.1 / v }}
                                                            exit={{ scale: 1.2, opacity: 0 }}
                                                            transition={{ duration: 0.6, repeat: Infinity }}
                                                            className="absolute w-32 h-32 rounded-full border border-blue-400"
                                                        />
                                                    ))}
                                                </div>
                                            )}
                                        </AnimatePresence>

                                        <motion.div
                                            className={cn(
                                                "relative w-14 h-14 flex items-center justify-center transition-all duration-500",
                                                isUserTalking ? "animate-runner scale-110" : "scale-100 opacity-80"
                                            )}
                                        >
                                            <div className="w-16 h-16 relative flex items-center justify-center">
                                                <div className="absolute inset-0 bg-blue-600/30 rounded-2xl rotate-45 border-2 border-blue-400/50 shadow-[0_0_30px_rgba(59,130,246,0.6)]" />
                                                <motion.div
                                                    animate={{ rotate: 360 }}
                                                    transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                                                    className="w-10 h-10 bg-white rounded-full flex items-center justify-center relative shadow-[0_0_20px_white]"
                                                >
                                                    <Bot className="w-5 h-5 text-blue-600" />
                                                    <div className="absolute -inset-2 border-2 border-blue-500/20 rounded-full border-t-blue-400 animate-spin" />
                                                </motion.div>
                                                {isUserTalking && (
                                                    <div className="absolute -bottom-4 left-0 right-0 flex justify-between px-2">
                                                        <motion.div animate={{ height: [4, 12, 4] }} transition={{ duration: 0.2, repeat: Infinity }} className="w-1 bg-blue-400 rounded-full" />
                                                        <motion.div animate={{ height: [12, 4, 12] }} transition={{ duration: 0.2, repeat: Infinity }} className="w-1 bg-blue-400 rounded-full" />
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    </div>

                                    <div className="absolute bottom-4 flex flex-col items-center gap-1">
                                        <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.5em] italic drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]">
                                            {isUserTalking ? "Streaming Neural Data" : "Stable Connection"}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <ScrollArea className="flex-1 p-4 relative jarvis-scrollbar">
                                <div className="space-y-6">
                                    {voiceMessages.map((msg, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, x: msg.role === "user" ? 20 : -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className={cn("flex flex-col", msg.role === "user" ? "items-end" : "items-start")}
                                        >
                                            <div className={cn(
                                                "max-w-[85%] rounded-3xl px-6 py-3 text-sm font-medium",
                                                msg.role === "user"
                                                    ? "bg-blue-600/20 text-blue-100 border border-blue-500/20 rounded-tr-none shadow-[0_0_20px_rgba(59,130,246,0.1)]"
                                                    : "bg-white/5 text-gray-200 rounded-tl-none border border-white/5"
                                            )}>
                                                {msg.content ? (
                                                    msg.content.includes('[Reply strictly in ') ? (
                                                        <div className="flex flex-col gap-1">
                                                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-[10px] font-bold uppercase w-fit border border-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.2)] mb-1">
                                                                <Mic className="w-2.5 h-2.5" /> Voice
                                                            </span>
                                                            <span>{msg.content.replace(/\[Reply strictly in .+? only\]\s*/i, '')}</span>
                                                        </div>
                                                    ) : msg.content
                                                ) : (
                                                    <div className="flex gap-1 py-1">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500/50 animate-bounce" style={{ animationDelay: '0s' }} />
                                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500/50 animate-bounce" style={{ animationDelay: '0.2s' }} />
                                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500/50 animate-bounce" style={{ animationDelay: '0.4s' }} />
                                                    </div>
                                                )}
                                            </div>
                                            {msg.provider && (
                                                <span className="text-[10px] text-blue-400/30 mt-2 font-mono uppercase tracking-tighter">
                                                    Processed via {msg.provider} neural mesh
                                                </span>
                                            )}
                                        </motion.div>
                                    ))}
                                    <div ref={voiceBottomRef} />
                                </div>
                            </ScrollArea>

                            <div className="p-6 sm:p-3 pb-10 sm:pb-3 border-t border-white/5 bg-white/[0.01] flex flex-col items-center gap-3 relative shrink-0">
                                <div className="absolute inset-0 bg-blue-500/[0.02] pointer-events-none" />
                                <div className="flex items-center gap-8 relative z-10 w-full justify-center">
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={toggleVoiceRecording}
                                        className={cn(
                                            "w-16 h-16 rounded-full flex items-center justify-center transition-all duration-500 relative group",
                                            isVoiceRecording
                                                ? "bg-red-500/20 shadow-[0_0_50px_rgba(239,68,68,0.3)] border-2 border-red-500"
                                                : "bg-gradient-to-br from-blue-500 to-blue-700 shadow-[0_0_50px_rgba(59,130,246,0.3)] border border-blue-400/50"
                                        )}
                                    >
                                        <div className="absolute inset-2 rounded-full border border-white/10 group-hover:border-white/30 transition-all" />
                                        {isVoiceRecording ? (
                                            <MicOff className="w-6 h-6 text-white" />
                                        ) : (
                                            <Mic className="w-6 h-6 text-white" />
                                        )}
                                    </motion.button>
                                </div>
                                <div className="text-center relative z-10">
                                    <p className={cn(
                                        "text-xs font-bold transition-all uppercase tracking-[0.3em]",
                                        isVoiceRecording ? "text-red-400" : "text-blue-400/60"
                                    )}>
                                        {isVoiceRecording ? "System Listening..." : "Talk to Jarvis"}
                                    </p>
                                    <p className="text-[10px] text-white/20 mt-2 font-light italic">
                                        Multi-language synaptic processing enabled
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Chat History Modal */}
            <AnimatePresence>
                {isHistoryOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[150] flex items-center justify-center p-2 sm:p-8 bg-[#020617]/80 backdrop-blur-md"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="relative w-full max-w-5xl h-full max-h-[85vh] bg-[#020617] border-y border-jarvis-neon/10 rounded-3xl shadow-[0_0_30px_rgba(0,229,255,0.05)] overflow-hidden flex flex-col"
                        >
                            <div className="flex items-center justify-between px-6 py-7 border-b border-jarvis-neon/10 bg-jarvis-card/50 backdrop-blur-2xl sticky top-0 z-10 animate-jarvis-line">
                                <div className="flex items-center gap-4 flex-1">
                                    {!isSearching ? (
                                        <h2 className="text-2xl font-bold text-jarvis-text jarvis-title-glow uppercase tracking-widest">
                                            Chats
                                        </h2>
                                    ) : (
                                        <motion.div
                                            initial={{ width: 0, opacity: 0 }}
                                            animate={{ width: "100%", opacity: 1 }}
                                            className="relative flex-1 max-w-md"
                                        >
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-jarvis-neon/40" />
                                            <Input
                                                autoFocus
                                                placeholder="Search neural archives..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className="w-full pl-10 bg-jarvis-neon/5 border-jarvis-neon/20 text-jarvis-text placeholder:text-jarvis-muted/40 rounded-xl h-10 focus-visible:ring-jarvis-neon/30"
                                            />
                                        </motion.div>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => {
                                            setIsSearching(!isSearching);
                                            if (isSearching) setSearchQuery("");
                                        }}
                                        className={`rounded-xl h-10 w-10 transition-all border border-transparent ${isSearching ? 'text-jarvis-neon bg-jarvis-neon/10 border-jarvis-neon/30' : 'text-jarvis-muted hover:text-jarvis-neon hover:bg-jarvis-neon/10 hover:border-jarvis-neon/30'}`}
                                    >
                                        <Search className="w-5 h-5" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setIsHistoryOpen(false)}
                                        className="text-jarvis-muted hover:text-jarvis-neon hover:bg-jarvis-neon/10 rounded-xl h-10 w-10 transition-all border border-transparent hover:border-jarvis-neon/30"
                                    >
                                        <X className="w-6 h-6" />
                                    </Button>
                                </div>
                            </div>

                            <ScrollArea className="flex-1 pl-6 pr-4 pb-8 pt-2 jarvis-scrollbar">
                                {chats.filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-20 text-center opacity-50">
                                        <div className="w-20 h-20 rounded-full bg-jarvis-neon/5 flex items-center justify-center mb-4 border border-jarvis-neon/10">
                                            <MessageCircle className="w-10 h-10 text-jarvis-neon/40" />
                                        </div>
                                        <h3 className="text-lg font-medium text-jarvis-text mb-1">
                                            {searchQuery ? "NO MATCHING DATA" : "DATA CORE EMPTY"}
                                        </h3>
                                        <p className="text-jarvis-muted text-sm max-w-[200px]">
                                            {searchQuery ? `No signals found for "${searchQuery}"` : "No neural patterns detected in memory banks."}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-3 py-2 pr-2">
                                        {chats
                                            .filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase()))
                                            .map((chat) => {
                                                const dateObj = chat.updatedAt ? new Date(chat.updatedAt) : null;
                                                const timeString = dateObj ? dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
                                                const dateString = dateObj ? dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '';
                                                const isActive = chat.id.toString() === currentChatId;

                                                return (
                                                    <motion.div
                                                        key={chat.id}
                                                        className={cn(
                                                            "group flex items-center gap-3 sm:gap-6 p-3 sm:p-4 cursor-pointer transition-all duration-300 rounded-[10px] relative overflow-hidden",
                                                            isActive
                                                                ? "bg-blue-600/15 text-white border-l-[4px] border-neon-blue shadow-[0_0_25px_rgba(0,170,255,0.2),inset_6px_0_20px_rgba(0,229,255,0.1)] scale-[1.02] ring-1 ring-white/10"
                                                                : "bg-white/[0.02] border border-white/5 opacity-60 hover:opacity-100 hover:bg-white/5"
                                                        )}
                                                        onClick={() => {
                                                            onSelectChat(chat.id.toString(), chat.title);
                                                            setTimeout(() => setIsHistoryOpen(false), 150);
                                                        }}
                                                    >
                                                        <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-jarvis-neon/5 border border-jarvis-neon/10 text-jarvis-neon/60 group-hover:text-jarvis-neon group-hover:bg-jarvis-neon/20 transition-all duration-500 shrink-0">
                                                            <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6" />
                                                        </div>

                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                <h3 className={cn(
                                                                    "font-semibold text-sm sm:text-base transition-all truncate max-w-[150px] sm:max-w-[300px] flex items-center gap-2",
                                                                    isActive ? "text-white text-shadow-neon" : "text-jarvis-text group-hover:text-white"
                                                                )}>
                                                                    {chat.title.includes('[Reply strictly in ') && <Mic className="w-3 h-3 text-blue-400 shrink-0" />}
                                                                    <span className={cn("truncate", isActive && "font-bold")}>
                                                                        {chat.title.replace(/\[Reply strictly in .+? only\]\s*/i, '')}
                                                                    </span>
                                                                </h3>
                                                                {chat.pinned && (
                                                                    <Pin className="w-3.5 h-3.5 text-jarvis-neon fill-jarvis-neon/20 animate-pulse" />
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-4 mt-1.5">
                                                                <div className="flex items-center gap-1.5 text-[11px] text-jarvis-muted group-hover:text-jarvis-secondary/70 transition-colors">
                                                                    <Calendar className="w-3 h-3" />
                                                                    <span className="uppercase tracking-wider">{dateString}</span>
                                                                </div>
                                                                <div className="flex items-center gap-1.5 text-[11px] text-jarvis-muted group-hover:text-jarvis-secondary/70 transition-colors">
                                                                    <ClockIcon className="w-3 h-3" />
                                                                    <span className="uppercase tracking-wider">{timeString}</span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-1 sm:gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-all duration-300 sm:translate-x-4 group-hover:translate-x-0 shrink-0">
                                                            <div className="hidden sm:flex items-center bg-black/40 p-1 rounded-xl border border-jarvis-neon/10 backdrop-blur-md">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-9 w-9 text-jarvis-muted hover:text-jarvis-neon rounded-lg hover:bg-jarvis-neon/10"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setEditingId(chat.id.toString());
                                                                        setEditTitle(chat.title);
                                                                    }}
                                                                >
                                                                    <Edit2 className="w-4 h-4" />
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className={cn("h-9 w-9 text-jarvis-muted hover:text-purple-400 rounded-lg hover:bg-purple-400/10", chat.pinned && "text-purple-400")}
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        onPinChat?.(chat.id.toString());
                                                                    }}
                                                                >
                                                                    <Pin className={cn("w-4 h-4", chat.pinned && "fill-purple-400/20")} />
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-9 w-9 text-jarvis-muted hover:text-red-400 rounded-lg hover:bg-red-400/10"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        onDeleteChat?.(chat.id.toString());
                                                                    }}
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </Button>
                                                            </div>

                                                            <div className="flex sm:hidden">
                                                                <DropdownMenu>
                                                                    <DropdownMenuTrigger asChild>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="h-9 w-9 text-jarvis-muted hover:text-jarvis-neon rounded-lg bg-black/40 border border-jarvis-neon/10"
                                                                            onClick={(e) => e.stopPropagation()}
                                                                        >
                                                                            <MoreHorizontal className="w-5 h-5" />
                                                                        </Button>
                                                                    </DropdownMenuTrigger>
                                                                    <DropdownMenuContent align="end" className="w-40 glass-dark border-white/10 text-white p-1">
                                                                        <DropdownMenuItem
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                setEditingId(chat.id.toString());
                                                                                setEditTitle(chat.title);
                                                                            }}
                                                                            className="flex items-center gap-2 cursor-pointer focus:bg-white/10 px-3 py-2"
                                                                        >
                                                                            <Edit2 className="w-4 h-4 text-jarvis-neon" />
                                                                            <span>Rename</span>
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                onPinChat?.(chat.id.toString());
                                                                            }}
                                                                            className="flex items-center gap-2 cursor-pointer focus:bg-white/10 px-3 py-2"
                                                                        >
                                                                            <Pin className={cn("w-4 h-4", chat.pinned ? "text-purple-400 fill-purple-400/20" : "text-purple-400")} />
                                                                            <span>{chat.pinned ? 'Unpin' : 'Pin'}</span>
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                onDeleteChat?.(chat.id.toString());
                                                                            }}
                                                                            className="flex items-center gap-2 cursor-pointer focus:bg-red-500/10 text-red-400 focus:text-red-400 px-3 py-2"
                                                                        >
                                                                            <Trash2 className="w-4 h-4" />
                                                                            <span>Delete</span>
                                                                        </DropdownMenuItem>
                                                                    </DropdownMenuContent>
                                                                </DropdownMenu>
                                                            </div>

                                                            <div className="hidden sm:flex jarvis-neon-btn px-5 py-2 rounded-full items-center gap-2 text-[10px] font-bold uppercase tracking-[0.15em] ml-2">
                                                                <span>Go to Chat</span>
                                                                <ChevronRight className="w-4 h-4" />
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                );
                                            })}
                                    </div>
                                )}
                            </ScrollArea>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Projects Modal */}
            <AnimatePresence>
                {isProjectsOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsProjectsOpen(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="w-full max-w-lg aspect-video bg-[linear-gradient(145deg,#07152f,#1e3a8a)] border border-neon-blue/20 rounded-2xl shadow-[0_0_50px_rgba(30,58,138,0.5)] relative z-10 flex flex-col items-center justify-center overflow-hidden"
                        >
                            <button
                                onClick={() => setIsProjectsOpen(false)}
                                className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors z-20"
                            >
                                <X className="w-6 h-6" />
                            </button>
                            <div className="relative w-full overflow-hidden flex justify-center items-center h-full">
                                <motion.div
                                    animate={{ x: [-400, 400] }}
                                    transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                                    className="text-4xl sm:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-neon-blue via-white to-neon-blue tracking-tighter whitespace-nowrap drop-shadow-[0_0_15px_rgba(0,210,255,0.5)]"
                                >
                                    Coming Soon
                                </motion.div>
                            </div>
                            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,rgba(0,170,255,0.15)_0%,transparent_70%)]" />
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
});