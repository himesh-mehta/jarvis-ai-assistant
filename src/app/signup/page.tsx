"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Mail,
  Lock,
  Github,
  ArrowRight,
  AtSign,
  ShieldCheck,
  Cpu,
  Sparkles,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import ParticleBackground from "@/components/ParticleBackground";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Security Cipher Weak. Use at least 6 characters.");
      return;
    }

    setIsLoading(true);

    try {
      await createUserWithEmailAndPassword(auth, email, password);
      // Identity successfully initialized
      router.push("/");
    } catch (err: any) {
      console.error("Signup Error:", err);
      if (err.code === "auth/email-already-in-use") {
        setError("Identity Already Exists. Please Recall your Identity instead.");
      } else if (err.code === "auth/weak-password") {
        setError("Security Cipher Weak. Use at least 6 characters.");
      } else if (err.code === "auth/invalid-email") {
        setError("Invalid Email Protocol. Check your formatting.");
      } else {
        setError("Protocol Rejected. Security breach or link failure.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-background">
      {/* Background Effects */}
      <div className="absolute inset-0 z-0">
        <ParticleBackground />
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/10 via-transparent to-purple-600/10" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 w-full max-w-md px-6"
      >
        <div className="glass p-8 md:p-10 rounded-3xl border-white/10 shadow-2xl backdrop-blur-3xl">
          {/* Header */}
          <div className="text-center mb-10">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 p-3.5 mb-6 shadow-lg shadow-blue-500/20"
            >
              <Cpu className="w-full h-full text-white" />
            </motion.div>
            <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
              Initialize Link
            </h1>
            <p className="text-white/50 text-sm">
              Create your neural identity to access JARVIS AI
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-400 text-sm"
            >
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              {error}
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-mono font-bold text-white/40 uppercase tracking-widest ml-1">
                Full Name
              </label>
              <div className="relative">
                <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <Input
                  placeholder="Commander Shepard"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="pl-10 bg-white/5 border-white/10 focus:border-neon-blue/50 transition-all h-12"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-mono font-bold text-white/40 uppercase tracking-widest ml-1">
                Email Protocol
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <Input
                  type="email"
                  placeholder="identity@neural.link"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="pl-10 bg-white/5 border-white/10 focus:border-neon-blue/50 transition-all h-12"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-mono font-bold text-white/40 uppercase tracking-widest ml-1">
                Security Cipher
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <Input
                  type="password"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pl-10 bg-white/5 border-white/10 focus:border-neon-blue/50 transition-all h-12"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 px-1">
              <ShieldCheck className="w-4 h-4 text-green-400" />
              <span className="text-[10px] text-white/40 font-mono">ENCRYPTION: AES-256 ACTIVE</span>
            </div>

            <Button
              disabled={isLoading}
              className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold rounded-xl border-none shadow-lg shadow-blue-500/20 group relative overflow-hidden"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  Processing...
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  Finalize Protocol
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              )}
            </Button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[#0f172a] px-2 text-white/30 font-mono tracking-widest">or bridge via</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Button variant="outline" className="bg-white/5 border-white/10 hover:bg-white/10 h-11 flex items-center gap-2">
              <Github className="w-4 h-4" />
              <span className="text-xs">GitHub</span>
            </Button>
            <Button variant="outline" className="bg-white/5 border-white/10 hover:bg-white/10 h-11 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-neon-blue" />
              <span className="text-xs">Google</span>
            </Button>
          </div>

          <p className="text-center mt-8 text-sm text-white/40">
            Already have a link?{" "}
            <Link href="/login" className="text-neon-blue hover:text-white transition-colors font-medium">
              Recall Identity
            </Link>
          </p>
        </div>

        {/* Footer Info */}
        <div className="mt-8 flex justify-center gap-6 text-[10px] text-white/20 font-mono uppercase tracking-[0.2em]">
          <span>Terms of Service</span>
          <span>Privacy Protocol</span>
          <span>v2.4.0</span>
        </div>
      </motion.div>
    </div>
  );
}