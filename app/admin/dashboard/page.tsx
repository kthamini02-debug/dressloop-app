"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, Package, Inbox, CheckCircle, Loader2, TrendingUp, BarChart3, Box } from "lucide-react";
import { db } from "@/lib/firebase/config";
import { collection, getDocs } from "firebase/firestore";
import Navbar from "@/components/Navbar";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    donors: 0,
    receivers: 0,
    admins: 0,
    totalListings: 0,
    activeListings: 0,
    totalRequests: 0,
    activeRequests: 0,
    completedExchanges: 0
  });

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);

        // Fetch Users
        const usersSnap = await getDocs(collection(db, "users"));
        const usersData = usersSnap.docs.map(d => d.data());
        const totalUsers = usersData.length;
        const donors = usersData.filter(u => u.role === "donor").length;
        const receivers = usersData.filter(u => u.role === "receiver").length;
        const admins = usersData.filter(u => u.role === "admin").length;

        // Fetch Listings
        const listingsSnap = await getDocs(collection(db, "listings"));
        const listingsData = listingsSnap.docs.map(d => d.data());
        const totalListings = listingsData.length;
        const activeListings = listingsData.filter(l => l.status === "Available").length;

        // Fetch Requests
        const requestsSnap = await getDocs(collection(db, "requests"));
        const requestsData = requestsSnap.docs.map(d => d.data());
        const totalRequests = requestsData.length;
        const activeRequests = requestsData.filter(r => r.status === "pending" || r.status === "Requested").length;
        const completedExchanges = requestsData.filter(r => r.status === "Accepted").length;

        setStats({
          totalUsers, donors, receivers, admins,
          totalListings, activeListings,
          totalRequests, activeRequests, completedExchanges
        });

      } catch (error) {
        console.error("Error fetching analytics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={["admin"]}>
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 font-sans">
        <Navbar />

        <main className="flex-grow pt-28 pb-20 px-4 sm:px-6 lg:px-8 max-w-[1400px] mx-auto w-full">
          <div className="mb-10 text-center md:text-left">
            <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-3">
              Platform <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-indigo-500">Analytics</span>
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-lg max-w-xl">
              Monitor real-time impact and activity across the DressLoop community.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            {/* Stat Cards */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-6">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
                <Users className="w-7 h-7 text-blue-500" />
              </div>
              <div>
                <p className="text-3xl font-black text-slate-900 dark:text-white">{stats.totalUsers}</p>
                <p className="text-sm font-medium text-slate-500">Total Users</p>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-6">
              <div className="w-14 h-14 rounded-2xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center flex-shrink-0">
                <Package className="w-7 h-7 text-purple-500" />
              </div>
              <div>
                <p className="text-3xl font-black text-slate-900 dark:text-white">{stats.totalListings}</p>
                <p className="text-sm font-medium text-slate-500">Total Donations</p>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-6">
              <div className="w-14 h-14 rounded-2xl bg-yellow-50 dark:bg-yellow-900/20 flex items-center justify-center flex-shrink-0">
                <Inbox className="w-7 h-7 text-yellow-500" />
              </div>
              <div>
                <p className="text-3xl font-black text-slate-900 dark:text-white">{stats.activeRequests}</p>
                <p className="text-sm font-medium text-slate-500">Active Requests</p>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-6 relative overflow-hidden group">
              <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-colors"></div>
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center flex-shrink-0 relative z-10">
                <CheckCircle className="w-7 h-7 text-emerald-500" />
              </div>
              <div className="relative z-10">
                <p className="text-3xl font-black text-slate-900 dark:text-white">{stats.completedExchanges}</p>
                <p className="text-sm font-medium text-slate-500">Completed Exchanges</p>
              </div>
            </motion.div>
          </div>

          {/* Breakdown Section */}
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-500" /> User Distribution
              </h2>
              
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Donors</span>
                    <span className="font-bold text-slate-900 dark:text-white">{stats.donors}</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3">
                    <div className="bg-blue-500 h-3 rounded-full" style={{ width: `${stats.totalUsers > 0 ? (stats.donors / stats.totalUsers) * 100 : 0}%` }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">NGOs / Receivers</span>
                    <span className="font-bold text-slate-900 dark:text-white">{stats.receivers}</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3">
                    <div className="bg-purple-500 h-3 rounded-full" style={{ width: `${stats.totalUsers > 0 ? (stats.receivers / stats.totalUsers) * 100 : 0}%` }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Admins</span>
                    <span className="font-bold text-slate-900 dark:text-white">{stats.admins}</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3">
                    <div className="bg-emerald-500 h-3 rounded-full" style={{ width: `${stats.totalUsers > 0 ? (stats.admins / stats.totalUsers) * 100 : 0}%` }}></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-indigo-500" /> Platform Health
              </h2>
              
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center rounded-xl">
                      <Box className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">Active Listings</p>
                      <p className="text-xs text-slate-500">Available for request</p>
                    </div>
                  </div>
                  <span className="text-xl font-black text-slate-900 dark:text-white">{stats.activeListings}</span>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center rounded-xl">
                      <CheckCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">Match Rate</p>
                      <p className="text-xs text-slate-500">Accepted vs Total Requests</p>
                    </div>
                  </div>
                  <span className="text-xl font-black text-emerald-500">
                    {stats.totalRequests > 0 ? Math.round((stats.completedExchanges / stats.totalRequests) * 100) : 0}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
