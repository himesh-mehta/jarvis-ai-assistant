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
import { motion, AnimatePresence } from "framer-motion";

const UserSecretIcon = ({ className }: { className?: string }) => (
    <svg
        viewBox="0 0 448 512"
        className={className}
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
    >
        <path d="M224 256c70.7 0 128-57.3 128-128S294.7 0 224 0 96 57.3 96 128s57.3 128 128 128zm-45.7 48C79.8 304 0 383.8 0 482.3C0 498.7 13.3 512 29.7 512H418.3c16.4 0 29.7-13.3 29.7-29.7C448 383.8 368.2 304 269.7 304H178.3zM320 128a32 32 0 1 1 -64 0 32 32 0 1 1 64 0zm-128 0a32 32 0 1 1 -64 0 32 32 0 1 1 64 0z" />
        <path d="M312 32c-29.9 0-54.7 20.5-61.8 48.2l-1.3-1c-24.6 1.8-44.4 19.8-44.4 44.4l1.3 10.4 192 0 1.3-10.4c0-24.6-19.8-44.4-44.4-44.4l-1.3 1c-7.1-27.7-31.9-48.2-61.8-48.2z" opacity="0.8" />
    </svg>
);

export const Header = ({ openAnalytics }: { openAnalytics: () => void }) => {
    const [isDarkMode, setIsDarkMode] = React.useState(true);
    const [isIncognito, setIsIncognito] = React.useState(false);

    const toggleTheme = () => {
        setIsDarkMode(!isDarkMode);
        if (isDarkMode) {
            document.documentElement.classList.remove('dark');
        } else {
            document.documentElement.classList.add('dark');
        }
    };

    const toggleIncognito = () => {
        setIsIncognito(!isIncognito);
    };

    return (
        <header className="h-16 border-b border-white/10 glass flex items-center justify-between px-6 z-40">
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <motion.div
                        whileHover={{ rotate: 15 }}
                        className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-1.5 shadow-lg shadow-blue-500/20"
                    >
                        <div className="w-full h-full rounded-full bg-white/20 blur-[1px] animate-pulse" />
                    </motion.div>
                    <span className="font-black text-2xl tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-neon-blue via-white to-neon-purple drop-shadow-[0_0_20px_rgba(0,210,255,0.6)]">
                        JARVIS
                    </span>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleIncognito}
                        className={`transition-all duration-300 relative ${isIncognito ? 'bg-white/20 shadow-[0_0_20px_rgba(255,255,255,0.25)]' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                        title="Incognito Mode"
                    >
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={isIncognito ? "incognito-on" : "incognito-off"}
                                initial={{ opacity: 0, scale: 0.5, rotate: -30 }}
                                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                                exit={{ opacity: 0, scale: 0.5, rotate: 30 }}
                                transition={{ duration: 0.2 }}
                                className="w-5 h-5"
                            >
                                <UserSecretIcon className="w-full h-full" />
                            </motion.div>
                        </AnimatePresence>
                        {isIncognito && (
                            <motion.div
                                layoutId="active-glow"
                                className="absolute inset-0 rounded-full border border-white/30"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                            />
                        )}
                    </Button>
                </motion.div>

                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleTheme}
                        className={`text-xl transition-all duration-300 ${!isDarkMode ? 'bg-yellow-500/10' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                        title="Toggle Theme"
                    >
                        <AnimatePresence mode="wait">
                            <motion.span
                                key={isDarkMode ? "moon" : "sun"}
                                initial={{ opacity: 0, scale: 0.5, y: 10, rotate: -90 }}
                                animate={{ opacity: 1, scale: 1, y: 0, rotate: 0 }}
                                exit={{ opacity: 0, scale: 0.5, y: -10, rotate: 90 }}
                                transition={{ duration: 0.3 }}
                            >
                                {isDarkMode ? "🌙" : "☀️"}
                            </motion.span>
                        </AnimatePresence>
                    </Button>
                </motion.div>
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
