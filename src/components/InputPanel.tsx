"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import {
    Mic,
    Paperclip,
    ArrowUp,
    Sparkles,
    MicOff,
    Image as ImageIcon,
    FileUp,
    Square
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export const InputPanel = ({
    openControls,
    onSend,
    isLoading,
    onVoiceChat,
    onStop,
}: {
    openControls: () => void;
    onSend: (content: string) => void;
    isLoading: boolean;
    onVoiceChat?: () => void;
    onStop?: () => void;
}) => {
    const [input, setInput] = useState("");
    const [isRecording, setIsRecording] = useState(false);
    const [interimText, setInterimText] = useState("");
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
        }
    }, [input, interimText]);

    const handleSend = () => {
        if (!input.trim() || isLoading) return;
        onSend(input);
        setInput("");
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    // ─── Voice to Text (word by word) ──────────────────────────────────
    const toggleRecording = () => {
        const SpeechRecognition =
            (window as any).SpeechRecognition ||
            (window as any).webkitSpeechRecognition;

        if (!SpeechRecognition) {
            alert("Speech recognition not supported. Please use Chrome or Edge.");
            return;
        }

        if (isRecording) {
            recognitionRef.current?.stop();
            setIsRecording(false);
            setInterimText("");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = true;       // keep listening
        recognition.interimResults = true;   // word by word
        recognition.lang = "en-US";

        recognition.onresult = (event: any) => {
            let interim = "";
            let final = "";

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    final += transcript + " ";
                } else {
                    interim += transcript;
                }
            }

            // Add final words to input
            if (final) {
                setInput(prev => prev + final);
                setInterimText("");
            }

            // Show interim words live in placeholder
            if (interim) {
                setInterimText(interim);
            }
        };

        recognition.onend = () => {
            setIsRecording(false);
            setInterimText("");
        };

        recognition.onerror = () => {
            setIsRecording(false);
            setInterimText("");
        };

        recognitionRef.current = recognition;
        recognition.start();
        setIsRecording(true);
    };

    return (
        <div className="pb-4 px-4 lg:px-6 bg-transparent">
            <div className="max-w-4xl mx-auto relative">
                <div className={cn(
                    "relative glass-dark rounded-2xl border p-1 shadow-2xl transition-all duration-300",
                    isRecording
                        ? "border-red-500/60 shadow-[0_0_25px_rgba(239,68,68,0.3)] ring-1 ring-red-500/30"
                        : "border-white/20 hover:border-neon-blue/50 hover:shadow-[0_0_25px_rgba(0,210,255,0.2)] focus-within:border-neon-blue/50 focus-within:ring-1 focus-within:ring-neon-blue/30 shadow-[0_0_15px_rgba(0,210,255,0.08)]"
                )}>
                    <div className="flex flex-col gap-0.5">
                        <Textarea
                            ref={textareaRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={
                                isRecording
                                    ? interimText
                                        ? `🔴 ${interimText}...`
                                        : "🔴 Listening..."
                                    : "Ask anything to JARVIS..."
                            }
                            className="min-h-[44px] w-full bg-transparent border-none focus-visible:ring-0 resize-none text-[15px] py-1.5 px-3.5 placeholder:text-white/40"
                            disabled={isLoading}
                        />

                        {/* Live interim text display */}
                        {isRecording && interimText && (
                            <div className="px-3.5 pb-1 text-sm text-white/50 italic">
                                {interimText}
                                <span className="animate-pulse">|</span>
                            </div>
                        )}

                        <div className="flex items-center justify-between px-2 pb-1.5">
                            <div className="flex items-center gap-1">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <div>
                                            <InputIconButton icon={<Paperclip className="w-4 h-4" />} label="Add photos & files" />
                                        </div>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent side="top" align="start" className="w-40 glass-dark border-white/10 text-white p-1 mb-2">
                                        <DropdownMenuItem className="flex items-center gap-2.5 cursor-pointer focus:bg-white/10 focus:text-white rounded-lg transition-colors py-2 px-3">
                                            <ImageIcon className="w-4 h-4 text-neon-blue" />
                                            <span className="text-[13px] font-medium">Add photo</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem className="flex items-center gap-2.5 cursor-pointer focus:bg-white/10 focus:text-white rounded-lg transition-colors py-2 px-3">
                                            <FileUp className="w-4 h-4 text-purple-400" />
                                            <span className="text-[13px] font-medium">Add File</span>
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>

                            <div className="flex items-center gap-3">
                                {/* Mic Button — Voice to Text */}
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={toggleRecording}
                                            className={cn(
                                                "h-8 w-8 rounded-full transition-all duration-300",
                                                isRecording
                                                    ? "text-red-400 bg-red-500/20 hover:bg-red-500/30 animate-pulse"
                                                    : "text-white/40 hover:text-neon-blue hover:bg-neon-blue/10"
                                            )}
                                        >
                                            {isRecording
                                                ? <MicOff className="w-3.5 h-3.5" />
                                                : <Mic className="w-3.5 h-3.5" />
                                            }
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent side="top" className="glass-dark border-white/10 text-xs text-white">
                                        {isRecording ? "Stop Recording" : "Voice to Text"}
                                    </TooltipContent>
                                </Tooltip>

                                {/* Send / Stop Button */}
                                <Button
                                    onClick={isLoading ? onStop : handleSend}
                                    disabled={!isLoading && !input.trim()}
                                    className={cn(
                                        "h-9 w-9 rounded-full transition-all duration-300",
                                        (input.trim() || isLoading)
                                            ? "bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)] scale-105"
                                            : "bg-white/5 text-white/20 border border-white/10"
                                    )}
                                >
                                    {isLoading ? (
                                        <Square className="w-3.5 h-3.5 fill-current" />
                                    ) : (
                                        <ArrowUp className="w-4 h-4" />
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div >
        </div >
    );
};

const InputIconButton = ({ icon, label, onClick }: {
    icon: React.ReactNode;
    label: string;
    onClick?: () => void
}) => (
    <Tooltip>
        <TooltipTrigger asChild>
            <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white/30 hover:text-white hover:bg-white/5 rounded-full"
                onClick={onClick}
            >
                {icon}
            </Button>
        </TooltipTrigger>
        <TooltipContent side="top" className="glass-dark border-white/10 text-xs text-white">
            {label}
        </TooltipContent>
    </Tooltip>
);