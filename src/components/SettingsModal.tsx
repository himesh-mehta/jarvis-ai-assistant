"use client";

import React from "react";
import {
    X,
    User,
    Key,
    Palette,
    Shield,
    Download,
    Trash2,
    Globe,
    Lock,
    Moon,
    Sun,
    Monitor
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

export const SettingsModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
                >
                    <motion.div
                        initial={{ scale: 0.9, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.9, y: 20 }}
                        className="w-full max-w-2xl glass-dark border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
                    >
                        <div className="p-6 border-b border-white/10 flex items-center justify-between">
                            <h2 className="text-xl font-bold tracking-tight">Systems & Preferences</h2>
                            <Button variant="ghost" size="icon" onClick={onClose} className="text-white/40 hover:text-white">
                                <X className="w-5 h-5" />
                            </Button>
                        </div>

                        <div className="flex flex-col md:flex-row h-[500px]">
                            <Tabs defaultValue="account" orientation="vertical" className="flex-1 flex flex-col md:flex-row">
                                <TabsList className="flex flex-row md:flex-col h-auto bg-white/5 p-2 rounded-none md:w-[200px] gap-1">
                                    <TabTrigger value="account" icon={<User className="w-4 h-4" />} label="Account" />
                                    <TabTrigger value="api" icon={<Key className="w-4 h-4" />} label="API Keys" />
                                    <TabTrigger value="theme" icon={<Palette className="w-4 h-4" />} label="Appearance" />
                                    <TabTrigger value="security" icon={<Shield className="w-4 h-4" />} label="Data & Privacy" />
                                </TabsList>

                                <div className="flex-1 p-8 overflow-y-auto">
                                    <TabsContent value="account" className="space-y-6 mt-0">
                                        <div className="space-y-4">
                                            <div className="flex flex-col gap-2">
                                                <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Public Name</label>
                                                <Input placeholder="Aman Gupta" className="bg-white/5 border-white/10" />
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Email Address</label>
                                                <Input placeholder="aman@example.com" disabled className="bg-white/5 border-white/10 opacity-50" />
                                            </div>
                                        </div>
                                        <Separator className="bg-white/10" />
                                        <div className="flex items-center justify-between">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-sm font-medium">Subscription Plan</span>
                                                <span className="text-xs text-neon-blue">Diamond Tier - Life Membership</span>
                                            </div>
                                            <Button variant="outline" className="border-neon-blue/30 text-neon-blue hover:bg-neon-blue/10">Manage</Button>
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="api" className="space-y-6 mt-0">
                                        <div className="space-y-4">
                                            <div className="flex flex-col gap-2">
                                                <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Master API Key</label>
                                                <div className="flex gap-2">
                                                    <Input type="password" value="sk-jarvis-••••••••••••••••" readOnly className="bg-white/5 border-white/10 font-mono" />
                                                    <Button className="bg-white/10 hover:bg-white/20">Rotate</Button>
                                                </div>
                                            </div>
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="theme" className="space-y-6 mt-0">
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-sm font-medium">Auto-Dark Mode</span>
                                                    <span className="text-xs text-white/40">Sync with system preferences</span>
                                                </div>
                                                <Switch defaultChecked />
                                            </div>
                                            <div className="flex flex-col gap-3">
                                                <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Accent Color</label>
                                                <div className="flex gap-3">
                                                    <div className="w-6 h-6 rounded-full bg-blue-500 ring-2 ring-white ring-offset-2 ring-offset-black cursor-pointer" />
                                                    <div className="w-6 h-6 rounded-full bg-purple-500 cursor-pointer" />
                                                    <div className="w-6 h-6 rounded-full bg-emerald-500 cursor-pointer" />
                                                    <div className="w-6 h-6 rounded-full bg-amber-500 cursor-pointer" />
                                                </div>
                                            </div>
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="security" className="space-y-6 mt-0">
                                        <div className="space-y-4">
                                            <Button variant="outline" className="w-full justify-start gap-3 bg-white/5 border-white/10 text-white/80">
                                                <Download className="w-4 h-4" /> Export All Conversations (JSON)
                                            </Button>
                                            <Button variant="outline" className="w-full justify-start gap-3 bg-white/5 border-white/10 text-white/80">
                                                <Trash2 className="w-4 h-4 text-red-400" /> Clear Memory Bank
                                            </Button>
                                            <div className="pt-4 border-t border-white/10">
                                                <Button className="w-full bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500/20">
                                                    Delete Instance Permanently
                                                </Button>
                                            </div>
                                        </div>
                                    </TabsContent>
                                </div>
                            </Tabs>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

interface TabTriggerProps {
    value: string;
    icon: React.ReactNode;
    label: string;
}

const TabTrigger = ({ value, icon, label }: TabTriggerProps) => (
    <TabsTrigger
        value={value}
        className="w-full justify-start gap-3 px-4 py-2 text-white/40 data-[state=active]:text-white data-[state=active]:bg-white/10 transition-all text-xs font-medium border-none"
    >
        {icon}
        {label}
    </TabsTrigger>
);
