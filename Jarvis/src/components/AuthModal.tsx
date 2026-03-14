    "use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    AlertCircle, X, Eye, EyeOff, CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export const AuthModal = ({ isOpen, onClose, onSuccess }: AuthModalProps) => {
    const [isLogin, setIsLogin] = useState(true);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [isLoadingLocal, setIsLoadingLocal] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    
    const { loginWithEmail, registerWithEmail, loginWithGoogle } = useAuth();

    // Reset fields when switching between login and signup
    useEffect(() => {
        setError("");
        setPassword("");
        setShowSuccess(false);
    }, [isLogin]);

    // Handle Escape key to close modal
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        if (isOpen) {
            window.addEventListener("keydown", handleEsc);
        }
        return () => window.removeEventListener("keydown", handleEsc);
    }, [isOpen, onClose]);

    const handleSubmit = async (e: React.FormEvent) => {
        if (isLoadingLocal || showSuccess) return;
        e.preventDefault();
        e.stopPropagation();
        setError("");
        setIsLoadingLocal(true);

        try {
            if (isLogin) {
                await loginWithEmail(email, password);
            } else {
                if (password.length < 6) {
                    throw new Error("Password must be at least 6 characters long.");
                }
                await registerWithEmail(email, password, name);
            }
            
            if (onSuccess) onSuccess();
            setShowSuccess(true);
            
            // Close modal after showing success state for a moment
            setTimeout(() => {
                onClose();
            }, 1500);
        } catch (err: any) {
            console.error("Auth Error:", err);
            let userMsg = "Something went wrong. Please check your details.";
            if (err.code === 'auth/invalid-credential') {
                userMsg = "Invalid email or password.";
            } else if (err.code === 'auth/email-already-in-use') {
                userMsg = "This email is already registered.";
            } else if (err.code === 'auth/weak-password') {
                userMsg = "Password must be at least 6 characters.";
            } else if (err.message) {
                userMsg = err.message;
            }
            setError(userMsg);
        } finally {
            setIsLoadingLocal(false);
        }
    };

    const handleGoogleLogin = async () => {
        if (isLoadingLocal || showSuccess) return;
        setIsLoadingLocal(true);
        setError("");
        try {
            await loginWithGoogle();
            if (onSuccess) onSuccess();
            setShowSuccess(true);
            setTimeout(() => {
                if (isOpen) onClose();
            }, 1000);
        } catch (err: any) {
            console.error("Google Login Error:", err);
            if (err.code === 'auth/popup-closed-by-user') {
                setError("Google login cancelled.");
            } else {
                setError(err.message || "Google login failed.");
            }
        } finally {
            setIsLoadingLocal(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/60 backdrop-blur-[3px] overflow-y-auto">
                    
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        role="dialog"
                        aria-modal="true"
                        className="relative w-full max-w-[330px] md:max-w-[400px] bg-[#020617] p-6 md:p-8 rounded-[32px] border border-white/5 z-10 flex flex-col items-center shadow-2xl overflow-hidden"
                    >
                        {/* Background Decor Shape - Styled like the reference photo */}
                        <div 
                            className="absolute top-0 left-0 w-full h-[160px] md:h-[180px] bg-[#0f172a] -z-0 pointer-events-none" 
                            style={{ clipPath: 'polygon(0 0, 100% 0, 100% 70%, 50% 100%, 0 70%)' }}
                        />
                        
                        {/* Animated Glowing Orbs (Balls Animation) */}
                        <div className="absolute inset-0 overflow-hidden pointer-events-none">
                            <motion.div
                                animate={{
                                    x: [0, 100, 0],
                                    y: [0, 50, 0],
                                    scale: [1, 1.2, 1],
                                }}
                                transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                                className="absolute -top-10 -left-10 w-40 h-40 bg-neon-blue/20 blur-[60px] rounded-full"
                            />
                            <motion.div
                                animate={{
                                    x: [0, -80, 0],
                                    y: [0, 100, 0],
                                    scale: [1, 1.3, 1],
                                }}
                                transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                                className="absolute -bottom-20 -right-20 w-60 h-60 bg-purple-500/10 blur-[80px] rounded-full"
                            />
                            <motion.div
                                animate={{
                                    scale: [1, 1.5, 1],
                                    opacity: [0.1, 0.3, 0.1],
                                }}
                                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-40 bg-blue-400/5 blur-[100px] rounded-full"
                            />
                        </div>

                        <div className="absolute top-[60px] left-1/2 -translate-x-1/2 w-[200px] h-[80px] bg-[#00D2FF]/10 blur-[40px] z-0 pointer-events-none" />
                        
                        {/* Content Container */}
                        <div className="relative z-10 w-full flex flex-col items-center">
                            {/* Close button */}
                            <button
                                onClick={onClose}
                                className="absolute top-[-5px] right-[-5px] md:top-[-10px] md:right-[-10px] p-1 text-[#64748B] hover:text-white transition-colors z-20"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <AnimatePresence mode="wait">
                                {showSuccess ? (
                                    <motion.div
                                        key="success"
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="py-12 flex flex-col items-center text-center"
                                    >
                                        <div className="w-20 h-20 rounded-full bg-[#00D2FF]/10 flex items-center justify-center mb-6">
                                            <CheckCircle2 className="w-10 h-10 text-[#00D2FF]" />
                                        </div>
                                        <h3 className="text-2xl font-bold text-white mb-2">
                                            Success!
                                        </h3>
                                        <p className="text-[#64748B] text-sm">
                                            {isLogin ? "Welcome back to JARVIS." : "Your account has been created."}
                                        </p>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="form"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="w-full flex flex-col items-center"
                                    >
                                        <div className="flex flex-col items-center mb-10 md:mb-12">
                                            <h1 className="text-[38px] md:text-[48px] font-[900] tracking-[3px] md:tracking-[4px] text-[#00D2FF] leading-tight select-none">
                                                JARVIS
                                            </h1>
                                            <p className="text-white text-[8px] tracking-[4px] mt-1 font-medium uppercase select-none">
                                                AI ASSISTANT
                                            </p>
                                        </div>

                                        <div className="w-full mb-6 text-center">
                                            <h2 className="text-xl md:text-2xl font-bold text-white mb-0.5">
                                                {isLogin ? "Welcome Back" : "Get Started"}
                                            </h2>
                                            <p className="text-[#64748B] text-xs md:text-sm">
                                                {isLogin ? "Sign in to continue" : "Create your JARVIS account"}
                                            </p>
                                        </div>

                                        {error && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -5 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="w-full mb-5 p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-2 text-red-400 text-xs"
                                            >
                                                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                                {error}
                                            </motion.div>
                                        )}

                                        <form onSubmit={handleSubmit} className="w-full space-y-3.5">
                                            {!isLogin && (
                                                <Input
                                                    type="text"
                                                    placeholder="Name"
                                                    value={name}
                                                    onChange={(e) => setName(e.target.value)}
                                                    required={!isLogin}
                                                    className="bg-[#0f172a] border-white/10 focus:border-[#00D2FF]/50 h-11 md:h-12 rounded-xl text-base text-white transition-all shadow-none outline-none focus:ring-0 placeholder:text-[#64748B] px-4 [WebkitBoxShadow:0_0_0_30px_#0f172a_inset!important] [WebkitTextFillColor:white!important]"
                                                />
                                            )}

                                            <Input
                                                type="email"
                                                placeholder="Email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                required
                                                className="bg-[#0f172a] border-white/10 focus:border-[#00D2FF]/50 h-11 md:h-12 rounded-xl text-base text-white transition-all shadow-none outline-none focus:ring-0 placeholder:text-[#64748B] px-4 [WebkitBoxShadow:0_0_0_30px_#0f172a_inset!important] [WebkitTextFillColor:white!important]"
                                            />

                                            <div className="relative">
                                                <Input
                                                    type={showPassword ? "text" : "password"}
                                                    placeholder="Password"
                                                    value={password}
                                                    onChange={(e) => setPassword(e.target.value)}
                                                    required
                                                    className="bg-[#0f172a] border-white/10 focus:border-[#00D2FF]/50 h-11 md:h-12 rounded-xl text-base text-white transition-all shadow-none outline-none focus:ring-0 placeholder:text-[#64748B] px-4 pr-11 [WebkitBoxShadow:0_0_0_30px_#0f172a_inset!important] [WebkitTextFillColor:white!important]"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-white"
                                                >
                                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                </button>
                                            </div>

                                            <Button
                                                type="submit"
                                                disabled={isLoadingLocal}
                                                className="w-full h-11 md:h-12 bg-[#00D2FF] text-black hover:bg-[#00D2FF]/90 font-black text-xs md:text-sm tracking-[1px] md:tracking-[2px] rounded-xl mt-3 transition-all active:scale-[0.98]"
                                            >
                                                {isLoadingLocal ? (
                                                    <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                                                ) : (
                                                    isLogin ? "SIGN IN" : "CREATE ACCOUNT"
                                                )}
                                            </Button>
                                        </form>

                                        <div className="relative w-full my-6 md:my-7">
                                            <div className="absolute inset-0 flex items-center">
                                                <div className="w-full border-t border-white/10"></div>
                                            </div>
                                            <div className="relative flex justify-center text-[10px] uppercase">
                                                <span className="bg-[#020617] px-3 text-[#64748B] tracking-[1.5px]">Or continue with</span>
                                            </div>
                                        </div>

                                        {/* Google Login Option */}
                                        <button
                                            onClick={handleGoogleLogin}
                                            disabled={isLoadingLocal}
                                            className="w-full h-11 md:h-12 bg-white/5 border border-white/10 text-white hover:bg-white/10 rounded-xl flex items-center justify-center gap-2.5 transition-all mb-6 md:mb-7 font-semibold text-sm"
                                        >
                                            <svg className="w-4 h-4" viewBox="0 0 24 24">
                                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                            </svg>
                                            Explore with Google
                                        </button>

                                        <div className="text-center text-[#64748B] text-xs">
                                            {isLogin ? "Don't have an account? " : "Already have an account? "}
                                            <button
                                                onClick={() => setIsLogin(!isLogin)}
                                                className="text-[#00D2FF] hover:underline font-bold ml-0.5"
                                            >
                                                {isLogin ? "Register" : "Sign In"}
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );

};