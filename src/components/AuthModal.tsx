"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Mail,
    Lock,
    User,
    ArrowRight,
    AlertCircle,
    X,
    Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const AuthModal = ({ isOpen, onClose }: AuthModalProps) => {
    const [isLogin, setIsLogin] = useState(true);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [isLoadingLocal, setIsLoadingLocal] = useState(false);
    const { loginWithEmail, registerWithEmail, loginWithGoogle } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoadingLocal(true);

        try {
            if (isLogin) {
                await loginWithEmail(email, password);
            } else {
                await registerWithEmail(email, password, name);
            }
            onClose();
        } catch (err: any) {
            console.error("Auth Error:", err);
            setError(err.message || "Something went wrong. Please check your details.");
        } finally {
            setIsLoadingLocal(false);
        }
    };

    const handleGoogleLogin = async () => {
        setIsLoadingLocal(true);
        setError("");
        try {
            await loginWithGoogle();
            onClose();
        } catch (err: any) {
            setError(err.message || "Google login failed.");
        } finally {
            setIsLoadingLocal(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 overflow-y-auto min-h-screen">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
                    />

                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        role="dialog"
                        aria-modal="true"
                        className="relative w-full max-w-[400px] bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl z-10 my-auto"
                    >
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="p-8">
                            <div className="text-center mb-8">

                                <h2 className="text-2xl font-bold text-white mb-2">
                                    {isLogin ? "Login" : "Create Account"}
                                </h2>
                                <p className="text-zinc-500 text-sm">
                                    {isLogin ? "Welcome back to JARVIS" : "Get started with your AI assistant"}
                                </p>
                            </div>

                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mb-6 p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-400 text-xs font-medium"
                                >
                                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                    {error}
                                </motion.div>
                            )}

                            {success && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mb-6 p-3 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center gap-3 text-green-400 text-xs font-medium"
                                >
                                    <Sparkles className="w-4 h-4 flex-shrink-0" />
                                    {success}
                                </motion.div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-4">
                                {!isLogin && (
                                    <div className="space-y-2">
                                        <label className="text-xs font-medium text-zinc-400 ml-1">Full Name</label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                                            <Input
                                                placeholder="John Doe"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                required={!isLogin}
                                                className="pl-10 bg-zinc-900 border-zinc-800 focus:border-white/20 h-11 rounded-xl text-base transition-all shadow-none outline-none focus:ring-0"
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-zinc-400 ml-1">Email Address</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                                        <Input
                                            type="email"
                                            placeholder="john@example.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            className="pl-10 bg-zinc-900 border-zinc-800 focus:border-white/20 h-11 rounded-xl text-base transition-all shadow-none outline-none focus:ring-0"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-zinc-400 ml-1">Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                                        <Input
                                            type="password"
                                            placeholder="••••••••"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                            className="pl-10 bg-zinc-900 border-zinc-800 focus:border-zinc-700 h-11 rounded-xl text-base transition-all shadow-none outline-none focus:ring-0"
                                        />
                                    </div>
                                </div>

                                <Button
                                    disabled={isLoadingLocal}
                                    className="w-full h-11 bg-white text-black hover:bg-zinc-200 font-bold rounded-xl mt-4 transition-all active:scale-[0.98]"
                                >
                                    {isLoadingLocal ? (
                                        <div className="flex items-center gap-2">
                                            <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                                            Please wait
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-center gap-2">
                                            {isLogin ? "Login" : "Sign Up"}
                                            <ArrowRight className="w-4 h-4" />
                                        </div>
                                    )}
                                </Button>

                                <div className="relative my-6">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-zinc-800"></div>
                                    </div>
                                    <div className="relative flex justify-center text-xs uppercase">
                                        <span className="bg-zinc-950 px-2 text-zinc-500">Or continue with</span>
                                    </div>
                                </div>

                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleGoogleLogin}
                                    disabled={isLoadingLocal}
                                    className="w-full h-11 bg-transparent border-zinc-800 text-white hover:bg-zinc-900 rounded-xl transition-all"
                                >
                                    <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                                        <path
                                            fill="currentColor"
                                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                        />
                                        <path
                                            fill="currentColor"
                                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                        />
                                        <path
                                            fill="currentColor"
                                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                                        />
                                        <path
                                            fill="currentColor"
                                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                        />
                                    </svg>
                                    Google
                                </Button>
                            </form>

                            <div className="mt-6 text-center text-sm">
                                <span className="text-zinc-500">
                                    {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
                                </span>
                                <button
                                    onClick={() => {
                                        setIsLogin(!isLogin);
                                        setError("");
                                    }}
                                    className="text-white hover:underline transition-all font-medium"
                                >
                                    {isLogin ? "Sign up" : "Login"}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
