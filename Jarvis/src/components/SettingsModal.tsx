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
    Monitor,
    Brain,
    Bot,
    Sparkles,
    RefreshCw
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { 
    Plus,
    Copy,
    Check,
    AlertTriangle
} from "lucide-react";


export const SettingsModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
    const { user, updateUserProfile } = useAuth();
    const [username, setUsername] = React.useState("");

    React.useEffect(() => {
        if (user?.displayName) {
            setUsername(user.displayName);
        }
    }, [user]);

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
                        role="dialog"
                        aria-modal="true"
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
                                    <TabTrigger value="ai" icon={<Brain className="w-4 h-4" />} label="AI Model" />
                                    <TabTrigger value="api" icon={<Key className="w-4 h-4" />} label="API Keys" />
                                    <TabTrigger value="memory" icon={<Brain className="w-4 h-4 text-neon-blue" />} label="Memory Bank" />
                                    <TabTrigger value="theme" icon={<Palette className="w-4 h-4" />} label="Appearance" />
                                    <TabTrigger value="security" icon={<Shield className="w-4 h-4" />} label="Data & Privacy" />
                                </TabsList>

                                <div className="flex-1 p-8 overflow-y-auto">
                                    <TabsContent value="account" className="space-y-6 mt-0">
                                        <div className="space-y-4">
                                            <div className="flex flex-col gap-2">
                                                <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Public Name</label>
                                                <div className="flex gap-2">
                                                    <Input
                                                        value={username}
                                                        onChange={(e) => setUsername(e.target.value)}
                                                        placeholder="Enter your name"
                                                        className="bg-white/5 border-white/10"
                                                    />
                                                    <Button
                                                        onClick={async () => {
                                                            try {
                                                                await updateUserProfile(username);
                                                                alert("Username updated!");
                                                            } catch (err) {
                                                                alert("Failed to update username.");
                                                            }
                                                        }}
                                                        disabled={!username || username === user?.displayName}
                                                        className="bg-neon-blue text-black hover:bg-neon-blue/80 font-bold px-4"
                                                    >
                                                        Save
                                                    </Button>
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Email Address</label>
                                                <Input value={user?.email || ""} disabled className="bg-white/5 border-white/10 opacity-50" />
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

                                    <TabsContent value="ai" className="space-y-6 mt-0">
                                        <div className="space-y-4">
                                            <div className="flex flex-col gap-3">
                                                <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Core Intelligence</label>
                                                <div className="grid grid-cols-1 gap-2">
                                                    <AIModelOption
                                                        icon={<Sparkles className="w-4 h-4 text-blue-400" />}
                                                        title="JARVIS-4 Ultra"
                                                        description="Most capable model for complex reasoning"
                                                        active
                                                    />
                                                    <AIModelOption
                                                        icon={<Bot className="w-4 h-4 text-purple-400" />}
                                                        title="JARVIS-3.5 Turbo"
                                                        description="Blazing fast for everyday tasks"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="api" className="space-y-6 mt-0">
                                        <ApiKeyManager />
                                    </TabsContent>

                                    <TabsContent value="memory" className="mt-0">
                                        <MemoryPanel />
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

// ── Memory Panel inside SettingsModal ──────
const MemoryPanel = () => {
    const { user } = useAuth();
    const [memory, setMemory] = React.useState<any>(null);
    const [loading, setLoading] = React.useState(false);

    const loadMemory = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const token = await user.getIdToken();
            const res = await fetch('/api/memory', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            setMemory(data.memory);
        } catch (error) {
            console.error("Failed to load memory:", error);
        } finally {
            setLoading(false);
        }
    };

    const deleteFact = async (factId: string) => {
        if (!user) return;
        const token = await user.getIdToken();
        await fetch('/api/memory', {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ factId }),
        });
        loadMemory();
    };

    const clearAll = async () => {
        if (!user || !confirm('Clear all JARVIS memory? This cannot be undone.')) return;
        const token = await user.getIdToken();
        await fetch('/api/memory', {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ clearAll: true }),
        });
        setMemory(null);
    };

    React.useEffect(() => { loadMemory(); }, [user]);

    const CATEGORY_COLORS: Record<string, string> = {
        personal: 'bg-blue-500/20   text-blue-300   border-blue-500/30',
        preference: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
        technical: 'bg-green-500/20  text-green-300  border-green-500/30',
        behavioral: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
        goal: 'bg-pink-500/20   text-pink-300   border-pink-500/30',
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Brain className="w-4 h-4 text-neon-blue" />
                    <h3 className="text-sm font-semibold text-white">Memory Bank</h3>
                    <span className="text-[10px] text-white/40 font-mono">
                        {memory?.facts?.length || 0} facts stored
                    </span>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={loadMemory}
                        className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-all"
                    >
                        <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
                    </button>
                    {memory?.facts?.length > 0 && (
                        <button
                            onClick={clearAll}
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-red-400 hover:bg-red-500/20 text-xs transition-all border border-red-500/20"
                        >
                            <Trash2 className="w-3 h-3" />
                            Clear All
                        </button>
                    )}
                </div>
            </div>

            {/* Summary */}
            {memory?.summary && (
                <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                    <p className="text-[11px] text-white/50 font-mono mb-1">USER SYNOPSIS</p>
                    <p className="text-sm text-white/80">{memory.summary}</p>
                </div>
            )}

            {/* Facts list */}
            {loading ? (
                <div className="flex items-center justify-center py-8">
                    <div className="w-6 h-6 border-2 border-neon-blue border-t-transparent rounded-full animate-spin" />
                </div>
            ) : memory?.facts?.length > 0 ? (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-2 no-scrollbar">
                    {memory.facts.map((fact: any) => (
                        <div
                            key={fact._id}
                            className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-white/5 border border-white/5 group hover:border-white/10 transition-all"
                        >
                            <div className="flex items-center gap-2 min-w-0">
                                <span className={cn(
                                    "text-[9px] px-1.5 py-0.5 rounded-full border font-mono uppercase tracking-wide flex-shrink-0",
                                    CATEGORY_COLORS[fact.category] || ''
                                )}>
                                    {fact.category}
                                </span>
                                <p className="text-xs text-white/70 truncate">{fact.fact}</p>
                            </div>
                            <button
                                onClick={() => deleteFact(fact._id)}
                                className="opacity-0 group-hover:opacity-100 p-1 rounded text-red-400 hover:bg-red-500/20 transition-all flex-shrink-0"
                            >
                                <Trash2 className="w-3 h-3" />
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-8 text-white/30 text-sm">
                    <Brain className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p>No memories yet</p>
                    <p className="text-xs mt-1 text-white/20">JARVIS will learn about you as you chat</p>
                </div>
            )}
        </div>
    );
};

const ApiKeyManager = () => {
    const { user } = useAuth();
    const [keys, setKeys] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(false);
    const [newKeyName, setNewKeyName] = React.useState("");
    const [createdKey, setCreatedKey] = React.useState<string | null>(null);
    const [copied, setCopied] = React.useState(false);

    const fetchKeys = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const token = await user.getIdToken();
            const res = await fetch('/api/keys', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            setKeys(data.keys || []);
        } catch (err) {
            console.error("Failed to fetch keys:", err);
        } finally {
            setLoading(false);
        }
    };

    const createKey = async () => {
        if (!user || !newKeyName.trim()) return;
        setLoading(true);
        try {
            const token = await user.getIdToken();
            const res = await fetch('/api/keys', {
                method: 'POST',
                headers: { 
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name: newKeyName })
            });
            const data = await res.json();
            if (data.success) {
                setCreatedKey(data.key);
                setNewKeyName("");
                fetchKeys();
            } else {
                alert(data.error || "Failed to create key");
            }
        } catch (err) {
            alert("Error creating API key");
        } finally {
            setLoading(false);
        }
    };

    const deleteKey = async (keyId: string) => {
        if (!user || !confirm("Revoke this API key? Apps using it will stop working.")) return;
        try {
            const token = await user.getIdToken();
            await fetch('/api/keys', {
                method: 'DELETE',
                headers: { 
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ keyId })
            });
            fetchKeys();
        } catch (err) {
            alert("Failed to delete key");
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    React.useEffect(() => { fetchKeys(); }, [user]);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex flex-col">
                    <h3 className="text-sm font-semibold text-white">Project API Keys</h3>
                    <p className="text-[11px] text-white/40">Manage keys for the embeddable JARVIS widget</p>
                </div>
                <span className="text-[10px] font-mono text-neon-blue bg-neon-blue/10 px-2 py-0.5 rounded border border-neon-blue/20">
                    {keys.length}/5 Keys
                </span>
            </div>

            {/* Create New Key Section */}
            {!createdKey && keys.length < 5 && (
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Create New Key</label>
                    <div className="flex gap-2">
                        <Input 
                            placeholder="Key name (e.g. My Website)" 
                            value={newKeyName}
                            onChange={(e) => setNewKeyName(e.target.value)}
                            className="bg-black/20 border-white/5 h-9 text-sm"
                        />
                        <Button 
                            onClick={createKey}
                            disabled={loading || !newKeyName.trim()}
                            className="bg-neon-blue text-black hover:bg-neon-blue/80 h-9 px-4 font-bold text-xs"
                        >
                            {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5 mr-1" />}
                            Create
                        </Button>
                    </div>
                </div>
            )}

            {/* Show Newly Created Key (Once) */}
            {createdKey && (
                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-xl bg-neon-blue/5 border border-neon-blue/30 space-y-3"
                >
                    <div className="flex items-center gap-2 text-neon-blue">
                        <AlertTriangle className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase tracking-tight">Key Generated Successfully</span>
                    </div>
                    <p className="text-[11px] text-white/60">Copy this key now. For your security, it will not be shown again.</p>
                    <div className="flex gap-2">
                        <Input 
                            readOnly 
                            value={createdKey} 
                            className="bg-black/40 border-neon-blue/20 h-10 font-mono text-neon-blue text-xs" 
                        />
                        <Button 
                            onClick={() => copyToClipboard(createdKey)}
                            className="bg-white/10 hover:bg-white/20 h-10 px-3"
                        >
                            {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                        </Button>
                    </div>
                    <Button 
                        variant="link" 
                        onClick={() => setCreatedKey(null)}
                        className="text-[10px] text-white/40 hover:text-white p-0 h-auto"
                    >
                        Done, I've saved it
                    </Button>
                </motion.div>
            )}

            {/* Keys List */}
            <div className="space-y-2">
                <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Active Keys</label>
                {keys.length > 0 ? (
                    <div className="space-y-2">
                        {keys.map((k) => (
                            <div key={k._id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 group hover:border-white/10 transition-all">
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium text-white/90">{k.name}</span>
                                    <span className="text-[10px] font-mono text-white/30">{k.keyPreview}</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="flex flex-col items-end">
                                        <span className="text-[9px] text-white/20 font-mono uppercase">Created</span>
                                        <span className="text-[10px] text-white/40">{new Date(k.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <Button 
                                        variant="ghost" 
                                        size="icon"
                                        onClick={() => deleteKey(k._id)}
                                        className="opacity-0 group-hover:opacity-100 h-8 w-8 text-white/20 hover:text-red-400 hover:bg-red-400/10 transition-all"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 border border-dashed border-white/10 rounded-2xl">
                        <Key className="w-8 h-8 mx-auto mb-2 opacity-20" />
                        <p className="text-xs text-white/40">No API keys generated yet</p>
                    </div>
                )}
            </div>
        </div>
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

const AIModelOption = ({ icon, title, description, active = false }: { icon: React.ReactNode; title: string; description: string; active?: boolean }) => (
    <div className={cn(
        "flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all border",
        active ? "bg-white/10 border-white/20 shadow-xl" : "bg-transparent border-white/5 hover:bg-white/5 hover:border-white/10"
    )}>
        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
            {icon}
        </div>
        <div className="flex-1 flex flex-col gap-0.5">
            <span className="text-sm font-bold">{title}</span>
            <span className="text-xs text-white/40">{description}</span>
        </div>
        {active && <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]" />}
    </div>
);
