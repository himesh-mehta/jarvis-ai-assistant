"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Copy,
    RotateCcw,
    ThumbsUp,
    ThumbsDown,
    Clock,
    Zap,
    Check,
    Ghost,
    Terminal,
    Table as TableIcon,
    List,
    MessageSquare,
    Sparkles
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/tokyo-night-dark.css";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: string;
    tokens?: number;
    responseTime?: string;
}

interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: string;
    tokens?: number;
    responseTime?: string;
}

export const ChatInterface = ({ messages, isThinking }: { messages: Message[], isThinking: boolean }) => {
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({
                top: scrollRef.current.scrollHeight,
                behavior: "smooth"
            });
        }
    }, [messages, isThinking]);

    return (
        <div className="flex-1 flex flex-col min-w-0 bg-transparent overflow-hidden">
            <ScrollArea className="flex-1 px-4 lg:px-8 py-6" ref={scrollRef}>
                <div className="max-w-4xl mx-auto space-y-8">
                    <AnimatePresence initial={false}>
                        {messages.map((message) => (
                            <MessageItem key={message.id} message={message} />
                        ))}
                    </AnimatePresence>

                    {isThinking && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-start gap-4"
                        >
                            <Avatar className="w-8 h-8 neon-border animate-pulse">
                                <AvatarImage src="/logo.png" />
                                <AvatarFallback className="bg-blue-950 text-blue-300">AG</AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col gap-2">
                                <p className="text-sm font-medium text-white/40 italic flex items-center gap-2">
                                    <Sparkles className="w-3 h-3 animate-spin" />
                                    Antigravity is thinking...
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
                </div>
            </ScrollArea>
        </div>
    );
};

const MessageItem = ({ message }: { message: Message }) => {
    const isUser = message.role === "user";
    const [copied, setCopied] = useState(false);

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
            className={cn(
                "flex gap-4 group",
                isUser ? "flex-row-reverse" : "flex-row"
            )}
        >
            <Avatar className={cn(
                "w-8 h-8 flex-shrink-0 mt-1",
                isUser ? "neon-border" : "border border-neon-blue/30"
            )}>
                <AvatarFallback className={isUser ? "bg-purple-950 text-purple-200" : "bg-blue-950 text-blue-200"}>
                    {isUser ? "AM" : "AG"}
                </AvatarFallback>
            </Avatar>

            <div className={cn(
                "flex flex-col gap-2 max-w-[85%]",
                isUser ? "items-end" : "items-start"
            )}>
                <div className={cn(
                    "relative p-4 rounded-2xl glass transition-all",
                    isUser
                        ? "rounded-tr-none bg-blue-600/10 border-blue-500/20"
                        : "rounded-tl-none bg-white/5 border-white/10 group-hover:border-neon-blue/30"
                )}>
                    {/* Neon Glow for AI messages */}
                    {!isUser && (
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/0 via-purple-500/0 to-blue-500/0 rounded-2xl blur opacity-0 group-hover:opacity-20 transition duration-1000 group-hover:duration-200"></div>
                    )}

                    <div className="prose prose-invert prose-sm max-w-none">
                        <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            rehypePlugins={[rehypeHighlight]}
                            components={{
                                h1: ({ node, ...props }) => <h1 className="text-xl font-bold mb-4 text-neon-blue" {...props} />,
                                h2: ({ node, ...props }) => <h2 className="text-lg font-bold mb-3 text-white" {...props} />,
                                code: ({ node, inline, className, children, ...props }: any) => {
                                    const match = /language-(\w+)/.exec(className || '');
                                    return !inline && match ? (
                                        <div className="relative group/code my-4">
                                            <div className="absolute top-0 right-0 p-2 flex gap-2">
                                                <span className="text-[10px] text-white/30 uppercase tracking-widest">{match[1]}</span>
                                            </div>
                                            <pre className="!bg-[#0d1117] !p-4 rounded-xl border border-white/5 overflow-x-auto">
                                                <code className={className} {...props}>
                                                    {children}
                                                </code>
                                            </pre>
                                        </div>
                                    ) : (
                                        <code className="bg-white/10 px-1.5 py-0.5 rounded text-neon-blue font-mono text-xs" {...props}>
                                            {children}
                                        </code>
                                    );
                                },
                                table: ({ node, ...props }) => (
                                    <div className="overflow-x-auto my-4 rounded-lg border border-white/10">
                                        <table className="w-full text-left text-xs" {...props} />
                                    </div>
                                ),
                                th: ({ node, ...props }) => <th className="p-2 bg-white/5 font-bold border-b border-white/10" {...props} />,
                                td: ({ node, ...props }) => <td className="p-2 border-b border-white/5" {...props} />,
                            }}
                        >
                            {message.content}
                        </ReactMarkdown>
                    </div>

                    {/* Message Footer Info */}
                    <div className={cn(
                        "flex items-center gap-4 mt-3 text-[10px] text-white/30 font-mono",
                        isUser ? "justify-end" : "justify-start"
                    )}>
                        <span className="flex items-center gap-1"><Clock size={10} /> {message.timestamp}</span>
                        {!isUser && message.tokens && (
                            <>
                                <span className="flex items-center gap-1"><Zap size={10} /> {message.tokens} tokens</span>
                                <span className="flex items-center gap-1">{message.responseTime}</span>
                            </>
                        )}
                    </div>
                </div>

                {/* Action Buttons */}
                <div className={cn(
                    "flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity",
                    isUser ? "flex-row-reverse" : "flex-row"
                )}>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-white/30 hover:text-white" onClick={copyToClipboard}>
                        {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
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
