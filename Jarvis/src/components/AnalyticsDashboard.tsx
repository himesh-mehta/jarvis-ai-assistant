"use client";

import React from "react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    ResponsiveContainer,
    AreaChart,
    Area,
    LineChart,
    Line
} from "recharts";
import {
    TrendingUp,
    Zap,
    Coins,
    Clock,
    X,
    Target,
    Cpu,
    Activity
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const data = [
    { name: "Mon", tokens: 2400, cost: 0.12 },
    { name: "Tue", tokens: 1398, cost: 0.07 },
    { name: "Wed", tokens: 9800, cost: 0.49 },
    { name: "Thu", tokens: 3908, cost: 0.19 },
    { name: "Fri", tokens: 4800, cost: 0.24 },
    { name: "Sat", tokens: 3800, cost: 0.19 },
    { name: "Sun", tokens: 4300, cost: 0.21 },
];

export const AnalyticsDashboard = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 lg:p-12 bg-black/60 backdrop-blur-md"
                >
                    <motion.div
                        initial={{ scale: 0.9, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.9, y: 20 }}
                        className="w-full max-w-6xl h-full max-h-[90vh] glass-dark border border-white/10 rounded-3xl flex flex-col overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]"
                    >
                        <div className="p-6 border-b border-white/10 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-neon-blue/10 rounded-xl">
                                    <Activity className="w-5 h-5 text-neon-blue" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold tracking-tight">Intelligence Analytics</h2>
                                    <p className="text-xs text-white/40 font-mono uppercase tracking-widest">Model: JARVIS Core v2.4</p>
                                </div>
                            </div>
                            <Button variant="ghost" size="icon" onClick={onClose} className="text-white/40 hover:text-white">
                                <X className="w-6 h-6" />
                            </Button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 space-y-8">
                            {/* Stats Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <StatCard icon={<Zap className="text-neon-blue" />} label="Total Chats" value="1,284" trend="+12.5%" />
                                <StatCard icon={<Coins className="text-neon-purple" />} label="Tokens Used" value="842.5k" trend="+5.2%" />
                                <StatCard icon={<Target className="text-green-400" />} label="Est. Cost" value="$42.12" trend="-2.1%" />
                                <StatCard icon={<Clock className="text-amber-400" />} label="Avg Response" value="0.8s" trend="-0.4s" />
                            </div>

                            {/* Charts Grid */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <Card className="bg-white/5 border-white/10 p-6 rounded-2xl">
                                    <CardHeader className="px-0 pt-0">
                                        <CardTitle className="text-sm font-bold text-white/60 uppercase tracking-widest flex items-center gap-2">
                                            <TrendingUp className="w-4 h-4" /> Daily Usage Trend
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="px-0 h-[250px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={data}>
                                                <defs>
                                                    <linearGradient id="colorTokens" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                                <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} />
                                                <YAxis stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} />
                                                <RechartsTooltip
                                                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                                                    itemStyle={{ color: '#fff' }}
                                                />
                                                <Area type="monotone" dataKey="tokens" stroke="#3b82f6" fillOpacity={1} fill="url(#colorTokens)" strokeWidth={2} />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </CardContent>
                                </Card>

                                <Card className="bg-white/5 border-white/10 p-6 rounded-2xl">
                                    <CardHeader className="px-0 pt-0">
                                        <CardTitle className="text-sm font-bold text-white/60 uppercase tracking-widest flex items-center gap-2">
                                            <Cpu className="w-4 h-4" /> Model Comparison
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="px-0 h-[250px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={data}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                                <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} />
                                                <YAxis stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} />
                                                <RechartsTooltip
                                                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                                                />
                                                <Bar dataKey="cost" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

const StatCard = ({ icon, label, value, trend }: any) => (
    <Card className="bg-white/5 border-white/10 p-5 rounded-2xl overflow-hidden relative group">
        <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/5 rounded-full blur-2xl group-hover:bg-neon-blue/10 transition-colors" />
        <div className="flex flex-col gap-3 relative z-10">
            <div className="flex items-center justify-between">
                <div className="p-2 bg-white/5 rounded-lg border border-white/5">
                    {icon}
                </div>
                <span className={cn(
                    "text-[10px] font-bold px-2 py-0.5 rounded-full",
                    trend.startsWith('+') ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"
                )}>
                    {trend}
                </span>
            </div>
            <div>
                <h4 className="text-2xl font-bold tracking-tight">{value}</h4>
                <p className="text-xs text-white/40 font-medium uppercase tracking-wider">{label}</p>
            </div>
        </div>
    </Card>
);
