"use client";

import React from "react";
import {
    Settings2,
    X,
    Info,
    Sparkles,
    Zap,
    ShieldCheck,
    Brain,
    SlidersHorizontal,
    Bot
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";

export const AdvancedControls = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Overlay */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        role="dialog"
                        aria-modal="true"
                        className="fixed top-0 right-0 h-full w-[350px] glass-dark border-l border-white/10 z-[70] shadow-2xl flex flex-col"
                    >
                        <div className="p-6 border-b border-white/10 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Settings2 className="w-5 h-5 text-neon-blue" />
                                <h2 className="font-bold text-lg tracking-tight">AI Configuration</h2>
                            </div>
                            <Button variant="ghost" size="icon" onClick={onClose} className="text-white/40 hover:text-white">
                                <X className="w-5 h-5" />
                            </Button>
                        </div>

                        <ScrollArea className="flex-1">
                            <div className="p-6 space-y-8">
                                {/* System Prompt */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-bold text-white/40 uppercase tracking-widest flex items-center gap-2">
                                            <ShieldCheck className="w-3.5 h-3.5" /> System Persona
                                        </label>
                                        <Info className="w-3.5 h-3.5 text-white/20" />
                                    </div>
                                    <Textarea
                                        placeholder="Define the AI's persona, tone, and behavior. E.g., 'You are a helpful assistant.'"
                                        className="bg-white/5 border-white/10 min-h-[100px] text-sm focus:border-neon-blue/50"
                                    />
                                </div>

                                {/* Response Style */}
                                <div className="space-y-3">
                                    <label className="text-xs font-bold text-white/40 uppercase tracking-widest flex items-center gap-2">
                                        <Sparkles className="w-3.5 h-3.5" /> Response Style
                                    </label>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="outline" className="w-full justify-between bg-white/5 border-white/10">
                                                Creative / Storytelling
                                                <SlidersHorizontal className="w-4 h-4 ml-2" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent className="w-[300px] glass-dark border-white/10 text-white">
                                            <DropdownMenuItem className="focus:bg-white/10">Professional / Concise</DropdownMenuItem>
                                            <DropdownMenuItem className="focus:bg-white/10">Creative / Storytelling</DropdownMenuItem>
                                            <DropdownMenuItem className="focus:bg-white/10">Developer / Technical</DropdownMenuItem>
                                            <DropdownMenuItem className="focus:bg-white/10">Minimalist</DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>

                                {/* Sliders */}
                                <div className="space-y-6">
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-medium text-white/80">Temperature</span>
                                            <span className="text-xs font-mono text-neon-blue">0.7</span>
                                        </div>
                                        <Slider defaultValue={[70]} max={100} step={1} className="py-2" />
                                        <p className="text-[10px] text-white/30">Controls randomness: Lower is more focused, higher is more creative.</p>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-medium text-white/80">Max Response Length</span>
                                            <span className="text-xs font-mono text-neon-purple">2,048 tokens</span>
                                        </div>
                                        <Slider defaultValue={[50]} max={100} step={1} className="py-2" />
                                    </div>
                                </div>

                                {/* Toggles */}
                                <div className="space-y-4 pt-4 border-t border-white/10">
                                    <div className="flex items-center justify-between">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-xs font-medium text-white/80">Multi-Model Routing</span>
                                            <span className="text-[10px] text-white/30">Auto-switch based on complexity</span>
                                        </div>
                                        <Switch />
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-xs font-medium text-white/80">AI-as-Judge Mode</span>
                                            <span className="text-[10px] text-white/30">Verify responses via secondary model</span>
                                        </div>
                                        <Switch defaultChecked />
                                    </div>
                                </div>
                            </div>
                        </ScrollArea>

                        <div className="p-6 border-t border-white/10">
                            <Button className="w-full bg-neon-blue/10 border border-neon-blue/20 text-neon-blue hover:bg-neon-blue/20">
                                Reset to Defaults
                            </Button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
