"use client";

import { useState, Suspense, useEffect } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "@/lib/firebase/config";
import { doc, setDoc } from "firebase/firestore";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Mail, Lock, User, Phone, AlertCircle, ArrowRight, Heart, ShieldCheck } from "lucide-react";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";

function RegisterContent() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultRole = searchParams.get("role") === "receiver" ? "receiver" : "donor";

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: defaultRole,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && user) {
      if (user.role === "donor") {
        router.push("/donor/dashboard");
      } else if (user.role === "receiver") {
        router.push("/receiver/dashboard");
      }
    }
  }, [user, authLoading, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        role: formData.role,
        createdAt: new Date().toISOString()
      });

      if (formData.role === "donor") {
        router.push("/donor/dashboard");
      } else {
        router.push("/receiver/dashboard");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to create an account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-indigo-500/30">
      <Navbar />
      
      <main className="flex-grow flex items-center justify-center relative overflow-hidden bg-slate-900 pt-24 pb-12">
        {/* Animated Background */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-blue-600/30 rounded-full blur-[120px] mix-blend-screen animate-pulse"></div>
          <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-purple-600/30 rounded-full blur-[120px] mix-blend-screen animate-pulse" style={{ animationDelay: '1.5s' }}></div>
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-[2px]"></div>
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative z-10 w-full max-w-xl p-8 md:p-10 mx-4"
        >
          <div className="absolute inset-0 bg-white/10 backdrop-blur-2xl rounded-3xl border border-white/20 shadow-[0_0_40px_rgba(0,0,0,0.3)]"></div>
          
          <div className="relative z-10">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-extrabold text-white tracking-tight mb-2">Create an Account</h1>
              <p className="text-slate-400 text-sm">Join the platform redefining clothing donation.</p>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }} 
                  animate={{ opacity: 1, height: 'auto' }} 
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl flex items-center gap-3 mb-6"
                >
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm">{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleRegister} className="space-y-5">
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: "donor" })}
                  className={`relative p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                    formData.role === "donor" 
                      ? "bg-blue-500/20 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.2)]" 
                      : "bg-white/5 border-white/10 hover:bg-white/10"
                  }`}
                >
                  <Heart className={`w-6 h-6 ${formData.role === "donor" ? "text-blue-400" : "text-slate-400"}`} />
                  <span className={`text-sm font-semibold ${formData.role === "donor" ? "text-white" : "text-slate-400"}`}>Donor</span>
                  {formData.role === "donor" && (
                    <motion.div layoutId="role-indicator" className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.8)]" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: "receiver" })}
                  className={`relative p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                    formData.role === "receiver" 
                      ? "bg-purple-500/20 border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.2)]" 
                      : "bg-white/5 border-white/10 hover:bg-white/10"
                  }`}
                >
                  <ShieldCheck className={`w-6 h-6 ${formData.role === "receiver" ? "text-purple-400" : "text-slate-400"}`} />
                  <span className={`text-sm font-semibold ${formData.role === "receiver" ? "text-white" : "text-slate-400"}`}>Receiver (NGO)</span>
                  {formData.role === "receiver" && (
                    <motion.div layoutId="role-indicator" className="absolute -top-1 -right-1 w-3 h-3 bg-purple-500 rounded-full shadow-[0_0_10px_rgba(168,85,247,0.8)]" />
                  )}
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-5">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider ml-1">{formData.role === 'donor' ? 'Full Name' : 'Organization Name'}</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-400 transition-colors">
                      <User className="w-5 h-5" />
                    </div>
                    <input 
                      required 
                      type="text" name="name" value={formData.name} onChange={handleChange} 
                      className="w-full pl-12 pr-4 py-3.5 bg-slate-900/50 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                      placeholder="Jane Doe"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider ml-1">Phone Number</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-400 transition-colors">
                      <Phone className="w-5 h-5" />
                    </div>
                    <input 
                      required 
                      type="tel" name="phone" value={formData.phone} onChange={handleChange} 
                      className="w-full pl-12 pr-4 py-3.5 bg-slate-900/50 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider ml-1">Email Address</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-400 transition-colors">
                    <Mail className="w-5 h-5" />
                  </div>
                  <input 
                    required 
                    type="email" name="email" value={formData.email} onChange={handleChange} 
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-900/50 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider ml-1">Password</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-purple-400 transition-colors">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input 
                    required 
                    type="password" name="password" value={formData.password} onChange={handleChange} 
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-900/50 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all"
                    placeholder="••••••••"
                    minLength={6}
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
                    <>Create Account <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></>
                  )}
                </div>
              </button>
            </form>

            <div className="mt-8 text-center text-slate-400 text-sm">
              Already have an account?{" "}
              <Link href="/login" className="text-white font-semibold hover:text-purple-400 transition-colors">
                Sign in here
              </Link>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-900"><Loader2 className="w-8 h-8 text-blue-500 animate-spin" /></div>}>
      <RegisterContent />
    </Suspense>
  );
}