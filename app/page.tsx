"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Heart, ShieldCheck, ArrowRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/context/AuthContext";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      if (user.role === "donor") {
        router.push("/donor/dashboard");
      } else if (user.role === "receiver") {
        router.push("/receiver/dashboard");
      }
    }
  }, [user, loading, router]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-black font-sans selection:bg-indigo-500/30">
      <Navbar />

      {/* Premium Hero Section */}
      <main className="relative flex-grow flex flex-col items-center justify-center text-center p-6 md:p-10 min-h-[90vh] overflow-hidden">
        
        {/* Background Image & Overlay */}
        <div className="absolute inset-0 z-0">
          <img 
            src="/hero-bg.png" 
            alt="Clothing Donation" 
            className="w-full h-full object-cover opacity-80"
          />
          {/* Complex Gradient Overlay for Glassmorphism depth */}
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/60 via-slate-900/80 to-slate-900/95 dark:from-black/60 dark:via-black/80 dark:to-black"></div>
          {/* Subtle colorful light orbs */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-[120px] mix-blend-screen pointer-events-none"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[120px] mix-blend-screen pointer-events-none"></div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 w-full max-w-5xl mx-auto flex flex-col items-center pt-20 pb-16">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="inline-block px-4 py-1.5 mb-6 rounded-full border border-white/10 bg-white/5 backdrop-blur-md text-white/80 text-sm font-medium tracking-wide uppercase shadow-2xl"
          >
            Welcome to the Future of Giving
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
            className="text-5xl md:text-7xl font-extrabold text-white mb-6 tracking-tight leading-[1.1]"
          >
            Donate Clothes. <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
              Change Lives.
            </span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.3 }}
            className="text-lg md:text-xl text-slate-300 max-w-2xl mb-12 leading-relaxed"
          >
            Join our premium marketplace connecting generous donors with verified NGOs. 
            Sustainable fashion starts with sharing what you no longer need.
          </motion.p>

          {/* Role Selection Cards */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="grid md:grid-cols-2 gap-6 w-full max-w-3xl"
          >
            <Link href="/register?role=donor" className="group">
              <div className="h-full bg-white/10 hover:bg-white/15 border border-white/10 hover:border-white/20 backdrop-blur-xl p-8 rounded-3xl transition-all duration-300 transform hover:-translate-y-2 shadow-2xl flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-inner">
                  <Heart className="w-8 h-8 text-blue-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">I am a Donor</h3>
                <p className="text-slate-400 text-sm mb-6 flex-grow">
                  Clear out your closet and directly support verified organizations in need of clothing.
                </p>
                <div className="flex items-center gap-2 text-blue-400 font-semibold group-hover:gap-3 transition-all">
                  Start Donating <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </Link>

            <Link href="/register?role=receiver" className="group">
              <div className="h-full bg-white/10 hover:bg-white/15 border border-white/10 hover:border-white/20 backdrop-blur-xl p-8 rounded-3xl transition-all duration-300 transform hover:-translate-y-2 shadow-2xl flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-purple-500/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-inner">
                  <ShieldCheck className="w-8 h-8 text-purple-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">I am an NGO</h3>
                <p className="text-slate-400 text-sm mb-6 flex-grow">
                  Browse available donations in your area and request items for your community.
                </p>
                <div className="flex items-center gap-2 text-purple-400 font-semibold group-hover:gap-3 transition-all">
                  Request Items <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </Link>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.8 }}
            className="mt-12 text-slate-400 text-sm"
          >
            Already a member? <Link href="/login" className="text-white font-medium hover:underline">Sign in here</Link>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
}