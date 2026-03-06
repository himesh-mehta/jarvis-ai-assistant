"use client";

import React, { useState, useRef, useEffect } from "react";
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
    MoreHorizontal
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
    chats: { id: string | number; title: string; pinned?: boolean }[];
    user: FirebaseUser | null;
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

// ✅ Detect language of text
function detectLanguage(text: string): "hi-IN" | "en-US" {
    const isHindi = /[\u0900-\u097F]/.test(text);
    return isHindi ? "hi-IN" : "en-US";
}

export const Sidebar = ({
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
    onMobileClose
}: SidebarProps) => {
    const router = useRouter();
    const { logout } = useAuth();
    const [activeTab, setActiveTab] = useState("Chats");
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState("");

    // ─── Voice Chat State ──────────────────────────────────────────────
    const [voiceOpen, setVoiceOpen] = useState(false);
    const [voiceMessages, setVoiceMessages] = useState<VoiceMessage[]>([]);
    const [isVoiceRecording, setIsVoiceRecording] = useState(false);
    const [voiceLoading, setVoiceLoading] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
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

    const navItems = [
        { id: "new", icon: <Plus className="w-4.5 h-4.5" />, label: "New chat" },
        { id: "Chats", icon: <MessageCircle className="w-4.5 h-4.5" />, label: "Chats" },
        { id: "voice", icon: <Mic className="w-4.5 h-4.5" />, label: "Talk to Jarvis" },
        { id: "projects", icon: <Library className="w-4.5 h-4.5" />, label: "Projects" },
    ];

    // ✅ Hindi + English voice support
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
                utterance.onend = () => {
                    setIsSpeaking(false);
                };
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
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = navigator.language || "en-US";

        recognition.onresult = async (event: any) => {
            const transcript = event.results[0][0].transcript;
            setIsVoiceRecording(false);

            const isHindi = /[\u0900-\u097F]/.test(transcript);
            const langLabel = isHindi ? "Hindi" : "English";

            const currentHistory = voiceMessagesRef.current;
            const userMsg: VoiceMessage = { role: "user", content: transcript };

            setVoiceMessages([...currentHistory, userMsg, { role: "assistant", content: "" }]);
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
        };

        recognition.onend = () => setIsVoiceRecording(false);
        recognition.onerror = () => setIsVoiceRecording(false);

        voiceRecognitionRef.current = recognition;
        recognition.start();
        setIsVoiceRecording(true);
    }

    return (
        <>
            <motion.aside
                initial={false}
                animate={{ width: isCollapsed ? 52 : 260 }}
                className="flex h-screen flex-col bg-[#020617]/90 backdrop-blur-2xl relative z-50 overflow-hidden border-r border-white/10"
            >
                <div className="h-14 flex items-center justify-between px-3 flex-shrink-0">
                    {!isCollapsed && (
                        <motion.span
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-neon-blue via-white to-neon-purple pl-2"
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

                <ScrollArea className="flex-1 no-scrollbar">
                    <div className="flex flex-col pt-12 pb-2 px-2 gap-0.5">
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
                                                if (item.id === "new") onNewChat();
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


                        {!isCollapsed && (
                            <div className="mt-14 pl-0 pr-6 flex flex-col flex-1 min-h-0">
                                <p className="text-[12px] font-bold text-white/40 uppercase tracking-[0.2em] mb-4 pl-3">Recents</p>
                                <div className="space-y-0.5 pb-4">
                                    {chats.map(chat => (
                                        <div
                                            key={chat.id}
                                            className={cn(
                                                "group flex items-center justify-between gap-2 text-[14px] text-white/50 hover:text-white cursor-pointer py-1.5 px-2 rounded-xl transition-all duration-300",
                                                chat.pinned ? "bg-white/5 text-white" : "hover:bg-white/5"
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
                                                        <span className="truncate text-white/50 group-hover:text-white transition-colors">{chat.title}</span>
                                                    </div>
                                                    <div className="flex shrink-0 items-center opacity-0 group-hover:opacity-100 transition-all duration-300">
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
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </ScrollArea>


                <div className="p-2 border-t border-white/5">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <div className={cn("flex items-center justify-between p-2 rounded-xl hover:bg-white/5 cursor-pointer", isCollapsed && "justify-center px-0")}>
                                <div className="flex items-center gap-3 truncate">
                                    <Avatar className="w-8 h-8 flex-shrink-0">
                                        <AvatarFallback className="bg-white/10 text-white text-xs">
                                            {user?.email?.[0].toUpperCase() || "?"}
                                        </AvatarFallback>
                                    </Avatar>
                                    {!isCollapsed && <span className="text-sm font-bold text-white truncate">{user?.displayName || user?.email?.split('@')[0] || "User"}</span>}
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

            <AnimatePresence>
                {voiceOpen && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md">
                        <div
                            role="dialog"
                            aria-modal="true"
                            className="w-[420px] h-[600px] bg-[#020617] border border-white/10 rounded-3xl flex flex-col relative overflow-hidden shadow-2xl"
                        >
                            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
                                <div className="flex items-center gap-3">
                                    <Mic className="w-5 h-5 text-neon-blue" />
                                    <div>
                                        <p className="text-sm font-bold text-white">JARVIS Voice Mode</p>
                                        <p className="text-[10px] text-white/40">{isSpeaking ? "Speaking..." : isVoiceRecording ? "Listening..." : "Hindi & English supported"}</p>
                                    </div>
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => { window.speechSynthesis.cancel(); setVoiceOpen(false); }} className="text-white/40 hover:text-white">
                                    <X className="w-5 h-5" />
                                </Button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                {voiceMessages.map((msg, i) => (
                                    <div key={i} className={cn("flex flex-col", msg.role === "user" ? "items-end" : "items-start")}>
                                        <div className={cn("max-w-[85%] rounded-2xl px-4 py-2 text-sm", msg.role === "user" ? "bg-blue-600/30 text-white" : "bg-white/5 text-gray-200")}>
                                            {msg.content || "..."}
                                        </div>
                                        {msg.provider && <span className="text-[10px] text-white/20 mt-1 capitalize">{msg.provider} won race</span>}
                                    </div>
                                ))}
                                <div ref={voiceBottomRef} />
                            </div>

                            <div className="p-6 border-t border-white/10 flex flex-col items-center gap-4 bg-white/[0.02]">
                                {isSpeaking && (
                                    <button onClick={() => { window.speechSynthesis.cancel(); setIsSpeaking(false); }} className="text-xs text-red-400 hover:underline">Stop JARVIS Speaking</button>
                                )}
                                <motion.button
                                    whileTap={{ scale: 0.9 }}
                                    onClick={toggleVoiceRecording}
                                    disabled={voiceLoading || isSpeaking}
                                    className={cn(
                                        "w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-xl",
                                        isVoiceRecording ? "bg-red-500 animate-pulse" : "bg-gradient-to-br from-blue-500 to-purple-600"
                                    )}
                                >
                                    {voiceLoading ? <Sparkles className="w-8 h-8 animate-spin text-white" /> : isVoiceRecording ? <MicOff className="w-8 h-8 text-white" /> : <Mic className="w-8 h-8 text-white" />}
                                </motion.button>
                                <p className="text-xs text-white/40">{isVoiceRecording ? "Click to stop" : voiceLoading ? "AI Race in progress..." : "Click to Speak"}</p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};