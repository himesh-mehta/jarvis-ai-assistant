"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Copy, RotateCcw, ThumbsUp, ThumbsDown, Clock,
    Zap, Check, Sparkles, Bot, User, ArrowDown
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/tokyo-night-dark.css";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Mic } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

// ── Message Interface ─────────────────────────────────────
interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: string;
    imageUrl?: string;
    fileUrl?: string;
    fileName?: string;
    fileType?: string;
    fileSize?: number;
    tokens?: number;
    responseTime?: string;
}

interface ChatInterfaceProps {
    messages: Message[];
    isThinking: boolean;
    isHistoryLoading?: boolean;
    sessionId?: string;
    onSuggestionClick?: (text: string) => void;
}

// ── File Icons Map ────────────────────────────────────────
const FILE_ICONS: Record<string, string> = {
    pdf: '📄',
    docx: '📝',
    txt: '📃',
    csv: '📊',
};

// ── Thinking Messages ─────────────────────────────────────
const THINKING_MESSAGES = [
    "JARVIS is thinking...",
    "Processing your request...",
    "Analyzing...",
    "Let me think about that...",
    "Running calculations...",
    "Accessing knowledge base...",
    "Formulating response...",
    "Cross-referencing data...",
    "One moment...",
];

// ── ChatInterface Component ───────────────────────────────
export const ChatInterface = ({ messages, isThinking, isHistoryLoading = false, sessionId, onSuggestionClick }: ChatInterfaceProps) => {
    const [showScrollButton, setShowScrollButton] = useState(false);
    const [autoScroll, setAutoScroll] = useState(true);
    const bottomRef = useRef<HTMLDivElement>(null);

    const [thinkingMsg, setThinkingMsg] = useState(THINKING_MESSAGES[0]);


    useEffect(() => {
        if (!isThinking) {
            setThinkingMsg(THINKING_MESSAGES[0]);
            return;
        }
        let i = 0;
        const interval = setInterval(() => {
            i = (i + 1) % THINKING_MESSAGES.length;
            setThinkingMsg(THINKING_MESSAGES[i]);
        }, 2000);
        return () => clearInterval(interval);
    }, [isThinking]);

    const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
        if (bottomRef.current) {
            bottomRef.current.scrollIntoView({ behavior, block: "end" });
        }
    };

    useEffect(() => {
        if (autoScroll) {
            scrollToBottom(isThinking ? "auto" : "smooth");
        }
    }, [messages, isThinking, autoScroll]);

    const lastScrollCheck = useRef(0);
    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const now = Date.now();
        // Only trigger state updates every 100ms during manual scrolling for better perf
        if (now - lastScrollCheck.current < 100) return;
        lastScrollCheck.current = now;

        const target = e.currentTarget;
        const isAtBottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 100;
        setAutoScroll(isAtBottom);
        setShowScrollButton(!isAtBottom);
    };

    return (
        <div className="flex-1 flex flex-col min-w-0 bg-transparent overflow-hidden relative">
            <ScrollArea
                className="flex-1 px-4 lg:px-8 pb-2 no-scrollbar"
                onScroll={handleScroll}
                style={{
                  maskImage: 'linear-gradient(to bottom, transparent 0%, black 20px, black calc(100% - 20px), transparent 100%)',
                  WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 20px, black calc(100% - 20px), transparent 100%)'
                }}
            >
                <div className="max-w-4xl mx-auto space-y-4 pt-20 pb-0">

                    {/* ── Empty State ── */}
                    {!isHistoryLoading && messages.length === 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8 }}
                            className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4"
                        >

                            <h1 className="text-5xl sm:text-8xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white via-white/80 to-white/20 select-none drop-shadow-[0_0_40px_rgba(0,210,255,0.2)]">
                                JARVIS
                            </h1>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{
                                    opacity: 1,
                                    y: 0,
                                }}
                                transition={{ delay: 0.4, duration: 0.8 }}
                                className="mt-4 relative group"
                            >
                                <motion.h2
                                    animate={{ opacity: [0.8, 1, 0.8] }}
                                    transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                                    className="text-[15px] sm:text-4xl font-light tracking-tight text-white/80 flex flex-row items-center justify-center gap-1.5 sm:gap-3 whitespace-nowrap mb-2"
                                >
                                    <span>What are you</span>
                                    <span className="relative inline-block text-white font-bold italic drop-shadow-[0_0_12px_rgba(255,255,255,0.4)]">
                                        curious
                                        <motion.div
                                            className="absolute -bottom-1 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-neon-blue to-transparent"
                                            initial={{ scaleX: 0, opacity: 0 }}
                                            animate={{ scaleX: 1, opacity: 1 }}
                                            transition={{ delay: 1.2, duration: 1 }}
                                        />
                                        <motion.div
                                            className="absolute -inset-1 bg-neon-blue/10 blur-md rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                                        />
                                    </span>
                                    <span>about today?</span>
                                </motion.h2>

                                {/* Subtle animated particles or glow under slogan */}
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-24 -z-10 bg-[radial-gradient(circle,rgba(0,210,255,0.05)_0%,transparent_70%)] rounded-full blur-2xl" />

                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: [0.2, 0.4, 0.2] }}
                                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                    className="mt-6 flex items-center justify-center gap-2 text-white/20"
                                >
                                    <div className="w-12 h-[1px] bg-gradient-to-r from-transparent to-white/10" />
                                    <Bot className="w-4 h-4" />
                                    <div className="w-12 h-[1px] bg-gradient-to-l from-transparent to-white/10" />
                                </motion.div>
                            </motion.div>
                        </motion.div>
                    )}

                    {/* ── Chat Switching Overlay (Non-shifting) ── */}
                    {isHistoryLoading && (
                        <div className="absolute inset-0 z-50 flex items-start justify-center pt-40 pointer-events-none">
                            <div className="bg-[#020617]/40 backdrop-blur-sm px-6 py-3 rounded-full border border-white/5 flex items-center gap-3 shadow-2xl">
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                                    className="w-4 h-4 border-2 border-[#00D2FF]/20 border-t-[#00D2FF] rounded-full"
                                />
                                <p className="text-[10px] font-mono text-white/60 tracking-widest uppercase">Syncing</p>
                            </div>
                        </div>
                    )}

                    {/* ── Messages Area ── */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={sessionId || "empty"}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: isHistoryLoading ? 0.3 : 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="space-y-6"
                        >
                            {messages.map((message) => (
                                <MessageItem key={message.id} message={message} />
                            ))}
                        </motion.div>
                    </AnimatePresence>

                    {/* ── Thinking Indicator ── */}
                    {isThinking && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-start gap-3 sm:gap-4"
                        >
                            <Avatar className="w-6 h-6 sm:w-7 sm:h-7 border border-neon-blue/20 bg-blue-950/50 flex items-center justify-center overflow-hidden">
                                <Bot className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-neon-blue drop-shadow-[0_0_8px_rgba(0,210,255,0.5)]" />
                            </Avatar>
                            <div className="flex flex-col gap-2">
                                <p className="text-sm font-medium text-white/40 italic flex items-center gap-2">
                                    <Sparkles className="w-3 h-3 animate-spin" />
                                    {thinkingMsg}
                                </p>
                                <div className="flex gap-1">
                                    <motion.span
                                        animate={{ scale: [1, 1.2, 1] }}
                                        transition={{ repeat: Infinity, duration: 1 }}
                                        className="w-1.5 h-1.5 bg-neon-blue rounded-full"
                                    />
                                    <motion.span
                                        animate={{ scale: [1, 1.2, 1] }}
                                        transition={{ repeat: Infinity, duration: 1, delay: 0.2 }}
                                        className="w-1.5 h-1.5 bg-neon-purple rounded-full"
                                    />
                                    <motion.span
                                        animate={{ scale: [1, 1.2, 1] }}
                                        transition={{ repeat: Infinity, duration: 1, delay: 0.4 }}
                                        className="w-1.5 h-1.5 bg-neon-blue rounded-full"
                                    />
                                </div>
                            </div>
                        </motion.div>
                    )}

                    <div ref={bottomRef} className="h-0" />
                </div>
            </ScrollArea>

            {/* ── Scroll to Bottom Button ── */}
            <AnimatePresence>
                {showScrollButton && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 20 }}
                        className="absolute bottom-4 sm:bottom-8 right-4 sm:right-8 z-50"
                    >
                        <Button
                            onClick={() => scrollToBottom()}
                            size="icon"
                            className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-blue-600/80 hover:bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)] backdrop-blur-md border border-white/10"
                        >
                            <ArrowDown className="w-5 h-5" />
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// ── MessageItem Component ─────────────────────────────────
const MessageItem = ({ message }: { message: Message }) => {
    const isUser = message.role === "user";
    const [copied, setCopied] = useState(false);
    const { user } = useAuth();

    const copyToClipboard = () => {
        navigator.clipboard.writeText(message.content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <motion.div
            id={message.id}
            variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 }
            }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className={cn("flex gap-2 sm:gap-3 group scroll-mt-20 mb-6", isUser ? "flex-row-reverse" : "flex-row")}
        >
            {/* ── Avatar ── */}
            <Avatar className={cn(
                "w-6 h-6 sm:w-7 sm:h-7 flex-shrink-0 mt-0.5 flex items-center justify-center overflow-hidden transition-all duration-300 hover:scale-110",
                isUser
                    ? "bg-purple-600/20 border border-purple-500/30"
                    : "bg-blue-600/20 border border-blue-500/30"
            )}>
                {isUser ? (
                    user?.photoURL
                        ? <AvatarImage src={user.photoURL} alt="User" className="rounded-full object-cover" />
                        : <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-400 drop-shadow-[0_0_5px_rgba(168,85,247,0.4)]" />
                ) : (
                    <Bot className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-400 drop-shadow-[0_0_8px_rgba(0,210,255,0.4)]" />
                )}
            </Avatar>

            {/* ── Bubble ── */}
            <div className={cn(
                "flex flex-col gap-2 max-w-[95%] sm:max-w-[85%] min-w-0",
                isUser ? "items-end" : "items-start"
            )}>
                <div className={cn(
                    "relative py-3 px-5 rounded-xl transition-all duration-300",
                    isUser
                        ? "rounded-tr-none bg-blue-600/10 border-blue-500/20 hover:border-blue-500/40 hover:bg-blue-600/15 hover:shadow-[0_0_20px_rgba(0,210,255,0.1)]"
                        : "rounded-tl-none bg-white/5 border-white/10 group-hover:border-neon-blue/40 group-hover:bg-white/[0.08]"
                )}>
                    {/* Glow effects */}
                    {isUser && (
                        <div className="absolute -inset-0.5 bg-blue-500/0 rounded-2xl blur opacity-0 group-hover:opacity-20 transition duration-500 group-hover:bg-blue-500/10" />
                    )}


                    {/* ── Image Preview ── */}
                    {message.imageUrl && (
                        <div className="mb-3">
                            <img
                                src={message.imageUrl}
                                alt="Uploaded"
                                className="max-w-full max-h-64 rounded-lg border border-white/10 object-contain cursor-pointer hover:opacity-90 transition-opacity"
                                onClick={() => window.open(message.imageUrl, '_blank')}
                            />
                        </div>
                    )}

                    {/* ── File Card ── */}
                    {message.fileUrl && message.fileName && (
                        <a
                            href={message.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 mb-3 p-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all group/file"
                        >
                            <div className="w-10 h-10 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-xl flex-shrink-0">
                                {FILE_ICONS[message.fileType || ''] || '📎'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white truncate">
                                    {message.fileName}
                                </p>
                                <p className="text-[10px] text-white/40 font-mono uppercase mt-0.5">
                                    {message.fileType} · {message.fileSize
                                        ? (message.fileSize / 1024).toFixed(1) + ' KB'
                                        : ''}
                                </p>
                            </div>
                            <div className="text-white/20 group-hover/file:text-neon-blue transition-colors text-xs">
                                ↗
                            </div>
                        </a>
                    )}

                    {/* ── Message Text ── */}
                    <div className="prose prose-invert prose-sm max-w-none">
                        <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            rehypePlugins={[rehypeHighlight]}
                            components={{
                                h1: ({ node, ...props }) => (
                                    <h1 className="text-xl font-bold mb-4 text-neon-blue" {...props} />
                                ),
                                h2: ({ node, ...props }) => (
                                    <h2 className="text-lg font-bold mb-3 text-white" {...props} />
                                ),
                                code: ({ node, inline, className, children, ...props }: any) => {
                                    const match = /language-(\w+)/.exec(className || '');
                                    return !inline && match ? (
                                        <div className="relative group/code my-4">
                                            <div className="absolute top-0 right-0 p-2 flex gap-2">
                                                <span className="text-[10px] text-white/30 uppercase tracking-widest">
                                                    {match[1]}
                                                </span>
                                            </div>
                                             <pre className="!bg-[#080b12] !p-4 rounded-xl border border-white/5 overflow-x-auto max-h-[500px] scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                                                <code className={cn(className, "text-[13px] leading-relaxed")} {...props}>
                                                    {children}
                                                </code>
                                             </pre>
                                        </div>
                                    ) : (
                                        <code
                                            className="bg-white/10 px-1.5 py-0.5 rounded text-neon-blue font-mono text-xs"
                                            {...props}
                                        >
                                            {children}
                                        </code>
                                    );
                                },
                                p: ({ children }) => {
                                    if (typeof children === 'string' && children.includes('[Reply strictly in ')) {
                                        const parts = children.split(/(\[Reply strictly in .+? only\])/g);
                                        return (
                                            <p>
                                                {parts.map((part, i) => {
                                                    if (part.startsWith('[Reply strictly in ')) {
                                                        return (
                                                            <span key={i} className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-[10px] font-bold uppercase mr-1 align-middle border border-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.2)]">
                                                                <Mic className="w-2.5 h-2.5" /> Voice
                                                            </span>
                                                        );
                                                    }
                                                    return part;
                                                })}
                                            </p>
                                        );
                                    }
                                    return <p>{children}</p>;
                                },
                                table: ({ node, ...props }) => (
                                    <div className="overflow-x-auto my-4 rounded-lg border border-white/10">
                                        <table className="w-full text-left text-xs" {...props} />
                                    </div>
                                ),
                                th: ({ node, ...props }) => (
                                    <th className="p-2 bg-white/5 font-bold border-b border-white/10" {...props} />
                                ),
                                td: ({ node, ...props }) => (
                                    <td className="p-2 border-b border-white/5" {...props} />
                                ),
                            }}
                        >
                            {message.content}
                        </ReactMarkdown>
                    </div>

                    {/* ── Footer ── */}
                    <div className={cn(
                        "flex items-center gap-3 mt-1.5 text-[10px] text-white/20 font-mono",
                        isUser ? "justify-end" : "justify-start"
                    )}>
                        {!isUser && (
                            <span className="flex items-center gap-1">
                                <Clock size={10} /> {message.timestamp}
                            </span>
                        )}
                        {!isUser && message.tokens && (
                            <>
                                <span className="flex items-center gap-1">
                                    <Zap size={10} /> {message.tokens} tokens
                                </span>
                                <span className="flex items-center gap-1">
                                    {message.responseTime}
                                </span>
                            </>
                        )}
                    </div>
                </div>

                {/* ── Action Buttons ── */}
                <div className={cn(
                    "flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity",
                    isUser ? "flex-row-reverse" : "flex-row"
                )}>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-white/30 hover:text-white"
                        onClick={copyToClipboard}
                    >
                        {copied
                            ? <Check className="w-3 h-3 text-green-400" />
                            : <Copy className="w-3 h-3" />
                        }
                    </Button>
                    {!isUser && (
                        <>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-white/30 hover:text-white">
                                <RotateCcw className="w-3 h-3" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-white/30 hover:text-white group-hover:hover:text-green-400">
                                <ThumbsUp className="w-3 h-3" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-white/30 hover:text-white group-hover:hover:text-red-400">
                                <ThumbsDown className="w-3 h-3" />
                            </Button>
                        </>
                    )}
                </div>
            </div>
        </motion.div>
    );
};