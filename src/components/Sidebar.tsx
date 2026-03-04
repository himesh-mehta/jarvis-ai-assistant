"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Plus,
    MessageSquare,
    Search,
    Pin,
    Trash2,
    Edit2,
    Folder,
    ChevronDown,
    Cpu,
    Zap,
    Code,
    Palette,
    Settings,
    LogOut,
    ChevronLeft,
    ChevronRight,
    Globe,
    BrainCircuit,
    Database
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
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface SidebarProps {
    isCollapsed: boolean;
    setIsCollapsed: (value: boolean) => void;
    openSettings: () => void;
}

export const Sidebar = ({ isCollapsed, setIsCollapsed, openSettings }: SidebarProps) => {
    const [activeModel, setActiveModel] = useState("Antigravity Core");
    const [searchQuery, setSearchQuery] = useState("");

    const chats = [
        { id: 1, title: "Quantum Physics Exploration", pinned: true },
        { id: 2, title: "Next.js 15 Implementation", pinned: true },
        { id: 3, title: "Marketing Strategy AI", pinned: false },
        { id: 4, title: "Creative Writing Prompt", pinned: false },
    ];

    const models = [
        { name: "Antigravity Core", icon: <BrainCircuit className="w-4 h-4" /> },
        { name: "Antigravity Pro", icon: <Zap className="w-4 h-4 text-neon-blue" /> },
        { name: "GPT-4", icon: <Database className="w-4 h-4" /> },
        { name: "Custom Model", icon: <Cpu className="w-4 h-4" /> },
    ];

    return (
        <motion.aside
            initial={false}
            animate={{ width: isCollapsed ? 80 : 280 }}
            className={cn(
                "h-screen glass-dark border-r border-white/10 flex flex-col relative z-50",
                isCollapsed ? "items-center" : ""
            )}
        >
            {/* Collapse Toggle */}
            <Button
                variant="ghost"
                size="icon"
                className="absolute -right-4 top-10 w-8 h-8 rounded-full border border-white/10 bg-black/50 text-white hover:text-neon-blue z-[60]"
                onClick={() => setIsCollapsed(!isCollapsed)}
            >
                {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            </Button>

            {/* New Chat Button */}
            <div className="p-4">
                <Button
                    className={cn(
                        "w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90 text-white font-medium neon-border transition-all flex gap-3",
                        isCollapsed && "justify-center px-0"
                    )}
                >
                    <Plus size={18} />
                    {!isCollapsed && <span>New Chat</span>}
                </Button>
            </div>

            {!isCollapsed && (
                <div className="px-4 mb-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                        <Input
                            placeholder="Search chats..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 bg-white/5 border-white/10 focus:border-neon-blue/50"
                        />
                    </div>
                </div>
            )}

            {/* Navigation / History */}
            <ScrollArea className="flex-1 px-3">
                {!isCollapsed && (
                    <div className="space-y-4">
                        <div>
                            <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest px-2 mb-2">Pinned</p>
                            <div className="space-y-1">
                                {chats.filter(c => c.pinned).map(chat => (
                                    <ChatItem key={chat.id} title={chat.title} pinned />
                                ))}
                            </div>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest px-2 mb-2">Recent</p>
                            <div className="space-y-1">
                                {chats.filter(c => !c.pinned).map(chat => (
                                    <ChatItem key={chat.id} title={chat.title} />
                                ))}
                            </div>
                        </div>
                    </div>
                )}
                {isCollapsed && (
                    <div className="flex flex-col items-center gap-4 py-2">
                        <MessageSquare className="w-5 h-5 text-white/60 hover:text-neon-blue cursor-pointer" />
                        <Folder className="w-5 h-5 text-white/60 hover:text-neon-blue cursor-pointer" />
                        <Separator className="bg-white/10 w-8" />
                    </div>
                )}
            </ScrollArea>

            {/* Bottom Section */}
            <div className="mt-auto p-4 space-y-4">
                {!isCollapsed && (
                    <div className="space-y-3 glass bg-white/5 p-3 rounded-xl border-white/10">
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-white/60 flex items-center gap-2">
                                <BrainCircuit className="w-3 h-3" /> Memory
                            </span>
                            <Switch size="sm" />
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-white/60 flex items-center gap-2">
                                <Globe className="w-3 h-3" /> Web Mode
                            </span>
                            <Switch size="sm" />
                        </div>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="w-full justify-between h-9 px-3 bg-white/5 border-white/5 hover:bg-white/10">
                                    <div className="flex items-center gap-2 text-xs">
                                        {models.find(m => m.name === activeModel)?.icon}
                                        {activeModel}
                                    </div>
                                    <ChevronDown className="w-3 h-3" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-[200px] glass-dark border-white/10 text-white">
                                {models.map(model => (
                                    <DropdownMenuItem
                                        key={model.name}
                                        onClick={() => setActiveModel(model.name)}
                                        className="flex items-center gap-2 cursor-pointer focus:bg-white/10"
                                    >
                                        {model.icon}
                                        {model.name}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                )}

                {/* User Profile */}
                <div className={cn(
                    "flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 cursor-pointer transition-colors group",
                    isCollapsed && "justify-center"
                )}>
                    <Avatar className="w-8 h-8 neon-border">
                        <AvatarImage src="/avatar.png" />
                        <AvatarFallback className="bg-purple-950 text-purple-300 text-xs">AM</AvatarFallback>
                    </Avatar>
                    {!isCollapsed && (
                        <div className="flex-1 overflow-hidden">
                            <p className="text-sm font-medium truncate">Aman Gupta</p>
                            <p className="text-[10px] text-white/40 truncate">Pro Plan</p>
                        </div>
                    )}
                    {!isCollapsed && (
                        <div className="flex items-center gap-2">
                            <Settings
                                className="w-4 h-4 text-white/40 hover:text-white transition-colors"
                                onClick={(e) => { e.stopPropagation(); openSettings(); }}
                            />
                            <Link href="/login">
                                <LogOut className="w-4 h-4 text-white/40 hover:text-red-400 transition-colors" />
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </motion.aside>
    );
};

const ChatItem = ({ title, pinned }: { title: string; pinned?: boolean }) => {
    return (
        <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/5 group relative cursor-pointer">
            <MessageSquare className="w-4 h-4 text-white/40 group-hover:text-neon-blue" />
            <span className="text-sm text-white/70 group-hover:text-white truncate flex-1">{title}</span>
            <div className="hidden group-hover:flex items-center gap-1">
                <Edit2 className="w-3 h-3 text-white/30 hover:text-white" />
                <Trash2 className="w-3 h-3 text-white/30 hover:text-red-400" />
            </div>
            {pinned && !title.includes("hover") && (
                <Pin className="w-2.4 h-2.4 absolute right-2 top-2 text-neon-blue rotate-45" size={10} />
            )}
        </div>
    );
};
