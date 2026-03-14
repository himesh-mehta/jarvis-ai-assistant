"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Mic, Paperclip, ArrowUp, Plus,
    MicOff, Image as ImageIcon, FileUp, Square, X
} from "lucide-react";
import {
    DropdownMenu, DropdownMenuContent,
    DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

// ── Accepted file types ───────────────────────────────────
const ACCEPTED_DOC_TYPES = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'text/csv',
    'application/csv',
];

const FILE_ICONS: Record<string, string> = {
    'application/pdf': '📄',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '📝',
    'text/plain': '📃',
    'text/csv': '📊',
    'application/csv': '📊',
};

// ── Props ─────────────────────────────────────────────────
export const InputPanel = ({
    openControls,
    onSend,
    onSendImage,
    onSendFile,
    isLoading,
    onVoiceChat,
    onStop,
    sessionId,
    history,
    isVoiceRecording = false,
    interimTranscript = "",
    input = "",
    onInputChange,
}: {
    openControls: () => void;
    onSend: (content: string) => void;
    onSendImage?: (formData: FormData) => void;
    onSendFile?: (file: File) => void;
    isLoading: boolean;
    onVoiceChat?: () => void;
    onStop?: () => void;
    sessionId?: string;
    history?: any[];
    isVoiceRecording?: boolean;
    interimTranscript?: string;
    input?: string;
    onInputChange?: (val: string) => void;
}) => {

    // ── Image states ──────────────────────────────────────
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    // ── File states ───────────────────────────────────────
    const [selectedFile, setSelectedFile] = useState<File | null>(null);  // ← NEW

    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const recognitionRef = useRef<any>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);   // for images
    const fileDocRef = useRef<HTMLInputElement>(null);   // for docs  ← NEW

    // ── Auto-focus & Global Type-to-Chat ────────────────────
    useEffect(() => {
        // 1. Auto-focus on mount
        textareaRef.current?.focus();

        // 2. Global keydown listener
        const handleGlobalKeyDown = (e: KeyboardEvent) => {


            // Ignore if user is already typing in an input, textarea or content-editable
            const activeElement = document.activeElement;
            const isInputFocused =
                activeElement instanceof HTMLInputElement ||
                activeElement instanceof HTMLTextAreaElement ||
                (activeElement as HTMLElement)?.isContentEditable ||
                activeElement?.getAttribute('role') === 'textbox';

            if (isInputFocused) return;

            // Search for visible modals or overlays that should block redirection
            const modalOpen = !!document.querySelector('[role="dialog"], [data-state="open"]');
            if (modalOpen) return;

            // Ignore modifier shortcuts (Cmd+C, Ctrl+V, etc.)
            if (e.metaKey || e.ctrlKey || e.altKey) return;

            // Focus for printable characters (length 1)
            // Or special characters like Backspace/Delete to allow starting with a correction
            const isPrintableKey = e.key.length === 1;
            const isCorrectionKey = e.key === "Backspace" || e.key === "Delete";

            if (isPrintableKey || isCorrectionKey) {
                textareaRef.current?.focus();
            }
        };

        window.addEventListener("keydown", handleGlobalKeyDown);
        return () => {
            window.removeEventListener("keydown", handleGlobalKeyDown);
        };
    }, []);

    // Also focus when session changes
    useEffect(() => {
        textareaRef.current?.focus();
    }, [sessionId]);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
        }
    }, [input, interimTranscript]);

    // ── Image selection ───────────────────────────────────
    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            alert('Please select an image file');
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            alert('Image must be under 10MB');
            return;
        }

        setSelectedFile(null);              // clear any file if image picked
        setSelectedImage(file);
        setImagePreview(URL.createObjectURL(file));
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    // ── File (doc) selection ──────────────────────────────  ← NEW
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!ACCEPTED_DOC_TYPES.includes(file.type)) {
            alert('Unsupported file. Please use PDF, DOCX, TXT, or CSV.');
            return;
        }
        if (file.size > 20 * 1024 * 1024) {
            alert('File too large. Maximum size is 20MB.');
            return;
        }

        setSelectedImage(null);             // clear any image if file picked
        setImagePreview(null);
        setSelectedFile(file);
        if (fileDocRef.current) fileDocRef.current.value = '';
    };

    // ── Remove handlers ───────────────────────────────────
    const removeImage = () => { setSelectedImage(null); setImagePreview(null); };
    const removeFile = () => { setSelectedFile(null); };   // ← NEW

    // ── Send handler ──────────────────────────────────────
    const handleSend = () => {
        if (isLoading) return;

        // 1️⃣ File takes priority
        if (selectedFile && onSendFile) {
            onSendFile(selectedFile);
            setSelectedFile(null);
            onInputChange?.('');
            return;
        }

        // 2️⃣ Image
        if (selectedImage && onSendImage) {
            const formData = new FormData();
            formData.append('image', selectedImage);
            formData.append('message', input.trim() || 'What is in this image?');
            formData.append('sessionId', sessionId || '');
            formData.append('history', JSON.stringify(
                (history || []).slice(-6).map((m: { role: string; content: string }) => ({ role: m.role, content: m.content }))
            ));
            onSendImage(formData);
            setSelectedImage(null);
            setImagePreview(null);
            onInputChange?.('');
            return;
        }

        // 3️⃣ Normal text
        if (!input.trim()) return;
        onSend(input);
        onInputChange?.("");
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    // ── Voice to Text ─────────────────────────────────────
    // ── Voice to Text ─────────────────────────────────────
    const toggleRecording = () => {
        onVoiceChat?.();
    };

    // ── canSend logic ─────────────────────────────────────
    const canSend = !isLoading && (input.length > 0 || !!selectedImage || !!selectedFile);

    // ── Paperclip highlight ───────────────────────────────
    const hasAttachment = !!selectedImage || !!selectedFile;

    return (
        <div className="pb-4 px-2 sm:pb-2 sm:px-4 lg:px-6 bg-transparent pb-[calc(env(safe-area-inset-bottom)+0.5rem)]">

            {/* ── Hidden: image input ── */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageSelect}
            />

            {/* ── Hidden: doc input ── */}
            <input
                ref={fileDocRef}
                type="file"
                accept=".pdf,.docx,.txt,.csv"
                className="hidden"
                onChange={handleFileSelect}
            />

            <div className="max-w-4xl mx-auto relative">
                <div className={cn(
                    "relative glass-dark rounded-2xl border p-1 shadow-2xl transition-all duration-300",
                    isVoiceRecording
                        ? "border-red-500/60 shadow-[0_0_25px_rgba(239,68,68,0.3)] ring-1 ring-red-500/30"
                        : "border-white/20 hover:border-neon-blue/50 hover:shadow-[0_0_25px_rgba(0,210,255,0.2)] focus-within:border-neon-blue/50 focus-within:ring-1 focus-within:ring-neon-blue/30 shadow-[0_0_15px_rgba(0,210,255,0.08)]"
                )}>
                    <div className="flex flex-col gap-0.5">

                        {/* ── File Preview ── */}
                        <AnimatePresence>
                            {selectedFile && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="px-3.5 pt-2"
                                >
                                    <div className="flex items-center gap-3 p-2.5 rounded-xl border border-white/10 bg-white/5 w-fit max-w-xs">
                                        <div className="w-9 h-9 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-lg flex-shrink-0">
                                            {FILE_ICONS[selectedFile.type] || '📎'}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-medium text-white truncate">
                                                {selectedFile.name}
                                            </p>
                                            <p className="text-[10px] text-white/40 font-mono mt-0.5">
                                                {(selectedFile.size / 1024).toFixed(1)} KB
                                            </p>
                                        </div>
                                        <button
                                            onClick={removeFile}
                                            className="w-5 h-5 bg-red-500 hover:bg-red-600 rounded-full text-white flex items-center justify-center flex-shrink-0 transition-colors"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>

                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* ── Image Preview ── */}
                        <AnimatePresence>
                            {imagePreview && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="px-3.5 pt-2"
                                >
                                    <div className="relative inline-block">
                                        <img
                                            src={imagePreview}
                                            alt="Preview"
                                            className="h-24 w-24 object-cover rounded-xl border border-white/20 shadow-lg"
                                        />
                                        <button
                                            onClick={removeImage}
                                            className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 hover:bg-red-600 rounded-full text-white flex items-center justify-center transition-colors shadow-md"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                        <div className="absolute bottom-1 left-1 right-1 bg-black/60 rounded-lg px-1.5 py-0.5">
                                            <p className="text-[9px] text-white/70 truncate text-center">
                                                {selectedImage?.name}
                                            </p>
                                        </div>
                                    </div>

                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* ── Textarea ── */}
                        <Textarea
                            ref={textareaRef}
                            value={input}
                            onChange={(e) => onInputChange?.(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={
                                isVoiceRecording
                                    ? interimTranscript
                                        ? `🔴 ${interimTranscript}...`
                                        : "🔴 Listening..."
                                    : selectedFile
                                        ? "Add a message or press send to upload..."
                                        : selectedImage
                                            ? "Ask something about this image..."
                                            : "Ask anything to JARVIS..."
                            }
                            className="min-h-[44px] w-full bg-transparent border-none focus-visible:ring-0 resize-none text-[15px] py-1.5 px-3.5 placeholder:text-white/40"
                            disabled={isLoading}
                        />

                        {/* Live interim voice text */}
                        {isVoiceRecording && interimTranscript && (
                            <div className="px-3.5 pb-1 text-sm text-white/50 italic">
                                {interimTranscript}
                                <span className="animate-pulse">|</span>
                            </div>
                        )}

                        {/* ── Bottom Bar ── */}
                        <div className="flex items-center justify-between px-2 pb-1.5">
                            <div className="flex items-center gap-1">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <div>
                                            <InputIconButton
                                                icon={
                                                    <Plus className={cn(
                                                        "w-4 h-4 transition-colors",
                                                        hasAttachment && "text-neon-blue"
                                                    )} />
                                                }
                                                label="Add photos & files"
                                            />
                                        </div>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent
                                        side="top"
                                        align="start"
                                        className="w-40 glass-dark border-white/10 text-white p-1 mb-2"
                                    >
                                        {/* Add photo */}
                                        <DropdownMenuItem
                                            className="flex items-center gap-2.5 cursor-pointer focus:bg-white/10 focus:text-white rounded-lg transition-colors py-2 px-3"
                                            onClick={() => fileInputRef.current?.click()}
                                        >
                                            <ImageIcon className="w-4 h-4 text-neon-blue" />
                                            <span className="text-[13px] font-medium">Add photo</span>
                                        </DropdownMenuItem>

                                        {/* Add file ← WIRED UP */}
                                        <DropdownMenuItem
                                            className="flex items-center gap-2.5 cursor-pointer focus:bg-white/10 focus:text-white rounded-lg transition-colors py-2 px-3"
                                            onClick={() => fileDocRef.current?.click()}
                                        >
                                            <FileUp className="w-4 h-4 text-purple-400" />
                                            <span className="text-[13px] font-medium">Add File</span>
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>

                            <div className="flex items-center gap-3">
                                {/* Mic */}
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={onVoiceChat}
                                            className="h-8 w-8 rounded-full text-white/40 hover:text-neon-blue hover:bg-neon-blue/10 transition-all duration-300"
                                        >
                                            <Mic className="w-3.5 h-3.5" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent side="top" className="glass-dark border-white/10 text-xs text-white">
                                        Voice Chat Mode
                                    </TooltipContent>
                                </Tooltip>

                                {/* Send / Stop */}
                                <Button
                                    onClick={isLoading ? onStop : handleSend}
                                    disabled={!isLoading && !canSend}
                                    className={cn(
                                        "h-9 w-9 rounded-full transition-all duration-300",
                                        (canSend || isLoading)
                                            ? "bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)] scale-105"
                                            : "bg-white/5 text-white/20 border border-white/10"
                                    )}
                                >
                                    {isLoading
                                        ? <Square className="w-3.5 h-3.5 fill-current" />
                                        : <ArrowUp className="w-4 h-4" />
                                    }
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ── Icon Button ───────────────────────────────────────────
const InputIconButton = ({ icon, label, onClick }: {
    icon: React.ReactNode;
    label: string;
    onClick?: () => void;
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
