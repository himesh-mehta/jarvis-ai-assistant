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
    Database,
    Menu,
    Sparkles,
    PanelLeft,
    Briefcase,
    MessageCircle,
    Download,
    Info,
    User,
    Sliders,
    Library
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
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface SidebarProps {
    isCollapsed: boolean;
    setIsCollapsed: (value: boolean) => void;
    openSettings: () => void;
    onNewChat: () => void;
    chats: { id: string | number; title: string }[];
}

export const Sidebar = ({ isCollapsed, setIsCollapsed, openSettings, onNewChat, chats }: SidebarProps) => {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState("Chats");
    const [isSearching, setIsSearching] = useState(false);

    const navItems = [
        { id: "new", icon: <Plus className="w-4.5 h-4.5" />, label: "New chat" },
        { id: "search", icon: <Search className="w-4.5 h-4.5" />, label: "Search" },
        { id: "customize", icon: <Sliders className="w-4.5 h-4.5" />, label: "Customize" },
        { id: "Chats", icon: <MessageCircle className="w-4.5 h-4.5" />, label: "Chats" },
        { id: "projects", icon: <Library className="w-4.5 h-4.5" />, label: "Projects" },
    ];

    return (
        <motion.aside
            initial={false}
            animate={{ width: isCollapsed ? 52 : 260 }}
            className="h-screen flex flex-col bg-[#020617]/90 backdrop-blur-2xl relative z-50 overflow-hidden border-r border-white/10"
        >
            {/* Header */}
            <div className="h-14 flex items-center justify-between px-3 flex-shrink-0">
                {!isCollapsed && (
                    <motion.span
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-2xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-neon-blue via-white to-neon-purple pl-2 drop-shadow-[0_0_15px_rgba(0,210,255,0.5)]"
                    >
                        JARVIS
                    </motion.span>
                )}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setIsCollapsed(!isCollapsed)}
                            className={cn(
                                "text-white/40 hover:text-white hover:bg-white/5 rounded-lg transition-all h-9 w-9",
                                isCollapsed && "w-full mx-0"
                            )}
                        >
                            <PanelLeft className="w-5 h-5" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right">{isCollapsed ? "Expand" : "Collapse"}</TooltipContent>
                </Tooltip>
            </div>

            {/* Navigation Section */}
            <ScrollArea className="flex-1 no-scrollbar">
                <div className="flex flex-col py-2 px-2 gap-0.5">
                    {navItems.map((item) => (
                        <Tooltip key={item.id} delayDuration={isCollapsed ? 0 : 500}>
                            <TooltipTrigger asChild>
                                <motion.div
                                    onClick={() => {
                                        setActiveTab(item.id);
                                        if (item.id === "new") onNewChat();
                                        if (item.id === "customize") openSettings();
                                        if (item.id === "search") setIsSearching(!isSearching);
                                    }}
                                    className={cn(
                                        "flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer transition-all group",
                                        activeTab === item.id ? "bg-white/10 text-white" : "text-white/40 hover:text-white hover:bg-white/5",
                                        isCollapsed && "justify-center px-0"
                                    )}
                                >
                                    <div className="flex-shrink-0">
                                        {item.id === "new" ? (
                                            <div className={cn(
                                                "flex items-center justify-center rounded-full bg-white/5 group-hover:bg-white/10",
                                                isCollapsed ? "w-7 h-7" : "w-5 h-5 mr-1"
                                            )}>
                                                <Plus className="w-3.5 h-3.5" />
                                            </div>
                                        ) : (
                                            <div className={cn(isCollapsed && "w-7 h-7 flex items-center justify-center")}>
                                                {item.icon}
                                            </div>
                                        )}
                                    </div>
                                    {!isCollapsed && (
                                        <span className="text-[13.5px] font-medium">{item.label}</span>
                                    )}
                                </motion.div>
                            </TooltipTrigger>
                            {isCollapsed && <TooltipContent side="right">{item.label}</TooltipContent>}
                        </Tooltip>
                    ))}

                    <AnimatePresence>
                        {isSearching && !isCollapsed && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="px-3 overflow-hidden mt-1"
                            >
                                <div className="relative">
                                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/20" />
                                    <Input
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search history..."
                                        className="h-8 bg-white/5 border-white/5 pl-8 text-[12px] placeholder:text-white/20 rounded-lg focus-visible:ring-neon-blue/20"
                                    />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {!isCollapsed && (
                        <div className="mt-8 px-3 flex flex-col flex-1 min-h-0">
                            <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.1em] mb-4">Recents</p>
                            <ScrollArea className="flex-1 -mx-2 px-2">
                                <div className="space-y-1 pb-4">
                                    {chats
                                        .filter(chat => chat.title.toLowerCase().includes(searchQuery.toLowerCase()))
                                        .map(chat => (
                                            <div key={chat.id} className="text-[13px] text-white/50 hover:text-white transition-colors cursor-pointer truncate py-1.5 rounded-lg hover:bg-white/5 px-2">
                                                {chat.title}
                                            </div>
                                        ))}
                                </div>
                            </ScrollArea>
                        </div>
                    )}
                </div>
            </ScrollArea>

            {/* Footer Section */}
            <div className="p-2 border-t border-white/5">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <div className={cn(
                            "flex items-center justify-between p-2 rounded-xl hover:bg-white/5 transition-all group cursor-pointer",
                            isCollapsed && "justify-center px-0"
                        )}>
                            <div className="flex items-center gap-3 truncate">
                                <Avatar className="w-8 h-8 flex-shrink-0 border border-white/10">
                                    <AvatarFallback className="bg-[#aca796] text-[#1c1c1c] text-xs font-bold font-mono">H</AvatarFallback>
                                </Avatar>
                                {!isCollapsed && (
                                    <div className="flex flex-col truncate">
                                        <span className="text-sm font-bold text-white/90 leading-tight">himesh</span>
                                        <span className="text-[11px] text-white/30 font-medium tracking-tight">Pro plan</span>
                                    </div>
                                )}
                            </div>
                            {!isCollapsed && <Settings className="w-4 h-4 text-white/20 group-hover:text-white transition-colors" />}
                        </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 glass-dark border-white/10 text-white p-1 mb-2">
                        <DropdownMenuItem className="focus:bg-white/10 rounded-lg cursor-pointer flex items-center gap-2 py-2" onClick={openSettings}>
                            <Settings className="w-4 h-4" /> Settings
                        </DropdownMenuItem>
                        <DropdownMenuItem className="focus:bg-white/10 rounded-lg cursor-pointer flex items-center gap-2 py-2">
                            <Info className="w-4 h-4" /> About
                        </DropdownMenuItem>
                        <Separator className="bg-white/5 my-1" />
                        <DropdownMenuItem
                            className="focus:bg-white/10 rounded-lg cursor-pointer flex items-center gap-2 py-2 text-red-400 focus:text-red-300"
                            onClick={() => router.push("/signup")}
                        >
                            <LogOut className="w-4 h-4" /> Logout
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </motion.aside>
    );
};

const ChatItem = ({ title }: { title: string }) => {
    return (
        <motion.div
            whileHover={{ x: 4 }}
            className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 group cursor-pointer transition-colors"
        >
            <MessageSquare className="w-4 h-4 text-white/20 group-hover:text-blue-400 transition-colors" />
            <span className="text-sm text-white/60 group-hover:text-white truncate flex-1 font-medium transition-colors">
                {title}
            </span>
            <Edit2 className="w-3.5 h-3.5 text-white/0 group-hover:text-white/20 hover:text-white transition-all scale-0 group-hover:scale-100" />
        </motion.div>
    );
};
