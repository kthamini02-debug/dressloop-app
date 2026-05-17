"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ListOrdered, CheckCircle, Clock, Loader2, Phone, Mail, LayoutDashboard, Settings, LogOut, Search, Activity, Sparkles, MessageSquare } from "lucide-react";
import { db } from "@/lib/firebase/config";
import { collection, query, where, getDocs, doc, getDoc, onSnapshot } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import { auth } from "@/lib/firebase/config";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function ReceiverDashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && user && user.role === "receiver") {
      setLoading(true);
      const requestsQuery = query(collection(db, "requests"), where("receiverId", "==", user.uid));
      
      const unsubscribe = onSnapshot(requestsQuery, async (snapshot) => {
        try {
          const reqData = [];
          for (const d of snapshot.docs) {
            const req = { id: d.id, ...d.data() } as any;
            
            if (req.status === "Accepted" || req.status === "Completed") {
              const listingDoc = await getDoc(doc(db, "listings", req.listingId));
              if (listingDoc.exists()) {
                const donorId = listingDoc.data().donorId;
                const donorDoc = await getDoc(doc(db, "users", donorId));
                if (donorDoc.exists()) {
                  req.donorContact = {
                    name: donorDoc.data().name,
                    email: donorDoc.data().email,
                    phone: donorDoc.data().phone
                  };
                }
              }
            }
            reqData.push(req);
          }
          
          reqData.sort((a, b) => {
            if (a.status === "Accepted" && b.status !== "Accepted") return -1;
            if (a.status !== "Accepted" && b.status === "Accepted") return 1;
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          });

          setRequests(reqData);
        } catch (error) {
          console.error("Error processing receiver data:", error);
        } finally {
          setLoading(false);
        }
      });

      return () => unsubscribe();
    }
  }, [user, authLoading]);

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={["receiver"]}>
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
          <Loader2 className="w-12 h-12 text-purple-500 animate-spin" />
        </div>
      </ProtectedRoute>
    );
  }

  // Calculate Stats
  const activeRequests = requests.filter(r => r.status === "Requested" || r.status === "pending").length;
  const approvedRequests = requests.filter(r => r.status === "Accepted").length;

  return (
    <ProtectedRoute allowedRoles={["receiver"]}>
      <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 font-sans">
      
      {/* Sidebar Navigation */}
      <aside className="hidden lg:flex flex-col w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 fixed h-full z-20">
        <div className="p-6">
          <Link href="/" className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">
            Dress<span className="text-purple-600">Loop</span>
          </Link>
        </div>
        
        <div className="flex flex-col gap-2 px-4 flex-grow mt-6">
          <button className="flex items-center gap-3 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 px-4 py-3 rounded-xl font-bold transition-colors">
            <LayoutDashboard className="w-5 h-5" /> Dashboard
          </button>
          <Link href="/feed" className="flex items-center gap-3 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 px-4 py-3 rounded-xl font-medium transition-colors">
            <Search className="w-5 h-5" /> Find Items
          </Link>
          <button className="flex items-center gap-3 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 px-4 py-3 rounded-xl font-medium transition-colors">
            <Settings className="w-5 h-5" /> Settings
          </button>
        </div>

        <div className="p-6 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center text-white font-bold uppercase shadow-md">
              {user?.name.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{user?.name}</p>
              <p className="text-xs text-slate-500 truncate capitalize">NGO / Receiver</p>
            </div>
          </div>
          <button onClick={() => auth.signOut()} className="flex items-center gap-2 text-slate-500 hover:text-red-500 text-sm font-medium transition-colors">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-grow lg:ml-64 p-4 sm:p-8 md:p-10 w-full max-w-7xl mx-auto">
        
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between mb-8 bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
          <Link href="/" className="text-xl font-black text-slate-900 dark:text-white tracking-tighter">
            Dress<span className="text-purple-600">Loop</span>
          </Link>
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center text-white font-bold text-xs">
            {user?.name.charAt(0)}
          </div>
        </div>

        <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-2">
              Welcome, {user?.name.split(' ')[0]}
            </h1>
            <p className="text-slate-500 dark:text-slate-400">Track your community requests and coordinate pickups.</p>
          </div>
          <Link 
            href="/feed"
            className="bg-purple-600 text-white hover:bg-purple-700 px-6 py-3.5 rounded-xl font-bold transition flex items-center justify-center gap-2 shadow-xl shadow-purple-600/20"
          >
            <Search className="w-5 h-5" /> Browse Donations
          </Link>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-6">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
              <Activity className="w-7 h-7 text-blue-500" />
            </div>
            <div>
              <p className="text-3xl font-black text-slate-900 dark:text-white">{activeRequests}</p>
              <p className="text-sm font-medium text-slate-500">Pending Requests</p>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-6 relative overflow-hidden group">
            <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-colors"></div>
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center relative z-10">
              <Sparkles className="w-7 h-7 text-emerald-500" />
            </div>
            <div className="relative z-10">
              <p className="text-3xl font-black text-slate-900 dark:text-white">{approvedRequests}</p>
              <p className="text-sm font-medium text-slate-500">Approved Ready</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none p-6 md:p-10">
          <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-6 mb-8">
            <ListOrdered className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Active Requests</h2>
          </div>

          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
            {requests.length === 0 ? (
              <div className="md:col-span-2 xl:col-span-3 text-center py-20 bg-slate-50 dark:bg-slate-800/30 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                <p className="text-slate-500 dark:text-slate-400 font-medium text-lg">You haven't requested any items yet.</p>
                <Link href="/feed" className="inline-block mt-6 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-8 py-3 rounded-xl font-bold hover:scale-105 transition-transform shadow-lg">
                  Explore Catalog
                </Link>
              </div>
            ) : (
              <AnimatePresence>
                {requests.map(request => (
                  <motion.div 
                    key={request.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`rounded-[2rem] p-6 border transition-all flex flex-col ${
                      request.status === 'Accepted' 
                        ? 'bg-gradient-to-b from-white to-emerald-50/50 border-emerald-200 dark:from-slate-900 dark:to-emerald-900/10 dark:border-emerald-800/30 shadow-md' 
                        : 'bg-slate-50 border-slate-200 dark:bg-slate-800/50 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <Link href={`/listing/${request.listingId}`} className="font-bold text-slate-900 dark:text-white text-lg line-clamp-2 hover:text-purple-600 transition-colors">{request.listingTitle}</Link>
                    </div>
                    
                    <div className="mb-6 flex items-center gap-2">
                      <span className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-bold uppercase tracking-wider ${
                        request.status === 'Requested' || request.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        request.status === 'Accepted' ? 'bg-emerald-100 text-emerald-700' :
                        'bg-slate-200 text-slate-700'
                      }`}>
                        {(request.status === 'Requested' || request.status === 'pending') && <Clock className="w-3.5 h-3.5" />}
                        {request.status === 'Accepted' && <CheckCircle className="w-3.5 h-3.5" />}
                        {request.status}
                      </span>
                      <span className="text-xs font-medium text-slate-400">
                        {new Date(request.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    {request.status === "Accepted" && request.donorContact ? (
                      <div className="mt-auto bg-white dark:bg-slate-900 rounded-2xl p-5 border border-emerald-100 dark:border-emerald-800/30 shadow-sm">
                        <p className="text-xs uppercase font-extrabold text-emerald-600 dark:text-emerald-500 tracking-wider mb-4">Donor Information</p>
                        <div className="space-y-3">
                          <div className="font-bold text-slate-900 dark:text-white text-lg">{request.donorContact.name}</div>
                          <div className="flex items-center gap-3 text-sm font-medium text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 px-3 py-2 rounded-lg">
                            <Mail className="w-4 h-4 text-emerald-500 flex-shrink-0" /> 
                            <a href={`mailto:${request.donorContact.email}`} className="truncate hover:text-emerald-600">{request.donorContact.email}</a>
                          </div>
                          {request.donorContact.phone && (
                            <div className="flex items-center gap-3 text-sm font-medium text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 px-3 py-2 rounded-lg">
                              <Phone className="w-4 h-4 text-emerald-500 flex-shrink-0" /> 
                              <a href={`tel:${request.donorContact.phone}`} className="truncate hover:text-emerald-600">{request.donorContact.phone}</a>
                            </div>
                          )}
                          <Link 
                            href={`/chat/${request.id}`}
                            className="w-full mt-5 bg-emerald-600 text-white py-3 rounded-xl font-bold flex justify-center items-center gap-2 hover:bg-emerald-700 transition-colors shadow-md"
                          >
                            <MessageSquare className="w-4 h-4" /> Message Donor
                          </Link>
                        </div>
                      </div>
                    ) : (request.status === "Requested" || request.status === "pending") ? (
                      <div className="mt-auto bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 text-center flex flex-col items-center justify-center min-h-[140px]">
                        <Loader2 className="w-6 h-6 text-slate-300 animate-spin mb-3" />
                        <p className="text-sm font-medium text-slate-500">Awaiting donor approval</p>
                      </div>
                    ) : request.status === "Rejected" ? (
                      <div className="mt-auto bg-white dark:bg-slate-900 rounded-2xl p-5 border border-red-100 dark:border-red-900/30 text-center flex flex-col items-center justify-center min-h-[140px]">
                        <p className="text-sm font-bold text-red-500">Request Declined</p>
                      </div>
                    ) : null}
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </div>
      </main>
    </div>
    </ProtectedRoute>
  );
}
