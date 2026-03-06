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
export const ChatInterface = ({ messages, isThinking, onSuggestionClick }: ChatInterfaceProps) => {
    const [showScrollButton, setShowScrollButton] = useState(false);
    const [autoScroll, setAutoScroll] = useState(true);
    const bottomRef = useRef<HTMLDivElement>(null);

    const [thinkingMsg, setThinkingMsg] = useState(THINKING_MESSAGES[0]);

    const SUGGESTIONS = [
        { icon: "⚡", text: "What can you help me with?" },
        { icon: "🧠", text: "Explain something complex simply" },
        { icon: "💻", text: "Help me debug my code" },
        { icon: "🚀", text: "What are the latest AI trends?" },
        { icon: "📄", text: "Analyze a document for me" },
        { icon: "🎯", text: "Help me plan my project" },
    ];

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

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const target = e.currentTarget;
        const isAtBottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 100;
        setAutoScroll(isAtBottom);
        setShowScrollButton(!isAtBottom);
    };

    return (
        <div className="flex-1 flex flex-col min-w-0 bg-transparent overflow-hidden relative">
            <ScrollArea
                className="flex-1 px-4 lg:px-8 py-6 no-scrollbar"
                onScroll={handleScroll}
            >
                <div className="max-w-4xl mx-auto space-y-8 pb-0">

                    {/* ── Empty State ── */}
                    {messages.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8 }}
                            className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4"
                        >
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/10 to-purple-600/10 flex items-center justify-center border border-white/5 mb-8 group hover:border-blue-500/30 transition-all duration-500">
                                <Sparkles className="w-8 h-8 text-blue-400 group-hover:scale-110 transition-transform" />
                            </div>
                            <h1 className="text-4xl sm:text-7xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-neon-blue via-white to-neon-purple drop-shadow-[0_0_30px_rgba(0,210,255,0.3)] mb-3">
                                JARVIS
                            </h1>

                            {onSuggestionClick && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-8 w-full max-w-lg">
                                    {SUGGESTIONS.map((s, i) => (
                                        <motion.button
                                            key={i}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.1 }}
                                            onClick={() => onSuggestionClick(s.text)}
                                            className="flex items-center gap-2 p-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-neon-blue/30 transition-all text-left text-sm text-white/50 hover:text-white group"
                                        >
                                            <span className="text-lg group-hover:scale-110 transition-transform">
                                                {s.icon}
                                            </span>
                                            <span className="text-xs leading-snug">{s.text}</span>
                                        </motion.button>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="pt-2 pb-12 flex items-center justify-center"
                        >
                            <div className="px-3 py-1 rounded-full border border-white/80 bg-white/5 backdrop-blur-sm">
                                <span className="text-[10px] font-bold tracking-[0.3em] text-white uppercase pl-[0.3em]">
                                    JARVIS
                                </span>
                            </div>
                        </motion.div>
                    )}

                    {/* ── Messages ── */}
                    <AnimatePresence initial={false}>
                        {messages.map((message) => (
                            <MessageItem key={message.id} message={message} />
                        ))}
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
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className={cn("flex gap-2 sm:gap-3 group", isUser ? "flex-row-reverse" : "flex-row")}
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
                "flex flex-col gap-2 max-w-[95%] sm:max-w-[85%]",
                isUser ? "items-end" : "items-start"
            )}>
                <div className={cn(
                    "relative py-1.5 px-3.5 rounded-xl transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,210,255,0.1)]",
                    isUser
                        ? "rounded-tr-none bg-blue-600/10 border-blue-500/20 hover:border-blue-500/40 hover:bg-blue-600/15"
                        : "rounded-tl-none bg-white/5 border-white/10 group-hover:border-neon-blue/40 group-hover:bg-white/[0.08]"
                )}>
                    {/* Glow effects */}
                    {!isUser && (
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/0 via-purple-500/0 to-blue-500/0 rounded-2xl blur opacity-0 group-hover:opacity-40 transition duration-500" />
                    )}
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
                                            <pre className="!bg-[#0d1117] !p-4 rounded-xl border border-white/5 overflow-x-auto">
                                                <code className={className} {...props}>
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
                        <span className="flex items-center gap-1">
                            <Clock size={10} /> {message.timestamp}
                        </span>
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