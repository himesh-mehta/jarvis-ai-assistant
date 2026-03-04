"use client";

import React from "react";
import {
    Menu,
    Bell,
    Share2,
    LayoutDashboard,
    Zap,
    ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export const Header = ({ openAnalytics }: { openAnalytics: () => void }) => {
    return (
        <header className="h-16 border-b border-white/10 glass flex items-center justify-between px-6 z-40">
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-1.5 shadow-lg shadow-blue-500/20">
                        <div className="w-full h-full rounded-full bg-white/20 blur-[1px] animate-pulse" />
                    </div>
                    <span className="font-bold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
                        ANTIGRAVITY
                    </span>
                    <Badge variant="outline" className="text-[10px] h-5 border-neon-blue/30 text-neon-blue bg-neon-blue/5 ml-2 font-mono px-1.5">
                        PLATINUM v2.4
                    </Badge>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={openAnalytics}
                    className="hidden lg:flex items-center gap-2 text-white/60 hover:text-white bg-white/5 border border-white/5 rounded-full px-4 h-9"
                >
                    <LayoutDashboard className="w-4 h-4" />
                    Analytics
                </Button>

                <div className="h-6 w-[1px] bg-white/10 mx-2 hidden lg:block" />

                <Button variant="ghost" size="icon" className="text-white/40 hover:text-white relative">
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-2 right-2 w-2 h-2 bg-neon-purple rounded-full border-2 border-background" />
                </Button>
                <Button variant="ghost" size="icon" className="text-white/40 hover:text-white">
                    <Share2 className="w-5 h-5" />
                </Button>

                <div className="h-6 w-[1px] bg-white/10 mx-2" />

                <Link href="/signup">
                    <Button
                        variant="outline"
                        size="sm"
                        className="bg-neon-blue/5 border-neon-blue/30 text-neon-blue hover:bg-neon-blue/10 rounded-full px-4 h-9 font-mono text-xs uppercase tracking-wider"
                    >
                        Join Protocol
                    </Button>
                </Link>
            </div>
        </header>
    );
};

export const StatusIndicator = () => {
    return (
        <div className="fixed bottom-24 right-8 z-40 pointer-events-none lg:pointer-events-auto">
            <div className="flex flex-col items-end gap-2">
                <div className="glass-dark border-white/10 rounded-full py-1.5 px-4 flex items-center gap-3 backdrop-blur-3xl shadow-2xl animate-float">
                    <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                        <span className="text-[10px] font-mono font-bold text-white/60 uppercase tracking-widest">Neural Link: Stable</span>
                    </div>
                    <div className="h-3 w-[1px] bg-white/20" />
                    <div className="flex items-center gap-1.5">
                        <Zap className="w-3 h-3 text-neon-blue" />
                        <span className="text-[10px] font-mono font-bold text-white/60 uppercase tracking-widest">Latency: 24ms</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
