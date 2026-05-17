"use client";

import { useState, useEffect } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "@/lib/firebase/config";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Loader2, Mail, Lock, AlertCircle, ArrowRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const { user, loading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && user) {
      if (user.role === "donor") {
        router.push("/donor/dashboard");
      } else if (user.role === "receiver") {
        router.push("/receiver/dashboard");
      }
    }
  }, [user, authLoading, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));
      if (userDoc.exists()) {
        const role = userDoc.data().role;
        if (role === "donor") {
          router.push("/donor/dashboard");
        } else {
          router.push("/receiver/dashboard");
        }
      } else {
        router.push("/feed");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to log in.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-indigo-500/30">
      <Navbar />
      
      <main className="flex-grow flex items-center justify-center relative overflow-hidden bg-slate-900">
        {/* Animated Background */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-600/30 rounded-full blur-[120px] mix-blend-screen animate-pulse"></div>
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-600/30 rounded-full blur-[120px] mix-blend-screen animate-pulse" style={{ animationDelay: '2s' }}></div>
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-[2px]"></div>
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative z-10 w-full max-w-md p-8 md:p-10 mx-4"
        >
          <div className="absolute inset-0 bg-white/10 backdrop-blur-2xl rounded-3xl border border-white/20 shadow-[0_0_40px_rgba(0,0,0,0.3)]"></div>
          
          <div className="relative z-10">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-extrabold text-white tracking-tight mb-2">Welcome Back</h1>
              <p className="text-slate-400 text-sm">Sign in to continue making an impact.</p>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }} 
                animate={{ opacity: 1, height: 'auto' }} 
                className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl flex items-center gap-3 mb-6"
              >
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </motion.div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider ml-1">Email Address</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-400 transition-colors">
                    <Mail className="w-5 h-5" />
                  </div>
                  <input 
                    required 
                    type="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-900/50 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Password</label>
                  <a href="#" className="text-xs text-blue-400 hover:text-blue-300 transition-colors">Forgot?</a>
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-purple-400 transition-colors">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input 
                    required 
                    type="password" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-900/50 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full relative group overflow-hidden rounded-xl p-[1px] mt-8"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl opacity-80 group-hover:opacity-100 transition-opacity duration-300"></span>
                <div className="relative bg-black/20 backdrop-blur-sm flex items-center justify-center gap-2 w-full py-3.5 rounded-xl text-white font-bold transition-all">
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>Sign In <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></>
                  )}
                </div>
              </button>
            </form>

            <div className="mt-8 text-center text-slate-400 text-sm">
              Don't have an account?{" "}
              <Link href="/register" className="text-white font-semibold hover:text-blue-400 transition-colors">
                Create one now
              </Link>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}