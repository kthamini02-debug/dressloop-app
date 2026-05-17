"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { db, auth } from "@/lib/firebase/config";
import { collection, query, where, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, User, LogOut, CheckCircle, Clock, MessageSquare, LayoutDashboard } from "lucide-react";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading && user) {
      const q = query(
        collection(db, "notifications"), 
        where("userId", "==", user.uid)
      );
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const notifs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        // Client side sort since we can't easily compound index where + orderBy without creating it in firebase console
        notifs.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setNotifications(notifs);
      });

      return () => unsubscribe();
    }
  }, [user, loading]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfile(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNotificationClick = async (notif: any) => {
    if (!notif.read) {
      try {
        await updateDoc(doc(db, "notifications", notif.id), { read: true });
      } catch (error) {
        console.error("Error updating notification:", error);
      }
    }
    setShowNotifications(false);
    if (notif.link) {
      router.push(notif.link);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <nav className="fixed top-0 w-full bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 z-50 transition-colors">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <Link href="/" className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">
            Dress<span className="text-blue-600 dark:text-blue-500">Loop</span>
          </Link>

          <div className="flex items-center gap-4 sm:gap-6">
            {!loading && user ? (
              <>
                <Link href={user.role === 'admin' ? '/admin/dashboard' : user.role === 'donor' ? '/donor/dashboard' : '/receiver/dashboard'} className="hidden sm:flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-blue-600 transition-colors">
                  <LayoutDashboard className="w-4 h-4" /> Dashboard
                </Link>

                <div className="relative" ref={notifRef}>
                  <button 
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="relative p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                  >
                    <Bell className="w-6 h-6" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white dark:border-slate-950">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  <AnimatePresence>
                    {showNotifications && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 mt-3 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden z-50"
                      >
                        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
                          <h3 className="font-bold text-slate-900 dark:text-white">Notifications</h3>
                          {unreadCount > 0 && (
                            <span className="text-xs font-bold text-blue-600 bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded-md">{unreadCount} New</span>
                          )}
                        </div>
                        <div className="max-h-96 overflow-y-auto">
                          {notifications.length === 0 ? (
                            <div className="p-8 text-center text-slate-500">
                              <Bell className="w-8 h-8 mx-auto mb-3 opacity-20" />
                              <p>You're all caught up!</p>
                            </div>
                          ) : (
                            notifications.map(notif => (
                              <div 
                                key={notif.id} 
                                onClick={() => handleNotificationClick(notif)}
                                className={`p-4 border-b border-slate-50 dark:border-slate-800/50 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex gap-4 ${!notif.read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                              >
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                                  notif.type === 'request_new' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30' :
                                  notif.type === 'request_update' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30' :
                                  notif.type === 'chat_message' ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30' :
                                  'bg-slate-100 text-slate-600'
                                }`}>
                                  {notif.type === 'request_new' && <Clock className="w-5 h-5" />}
                                  {notif.type === 'request_update' && <CheckCircle className="w-5 h-5" />}
                                  {notif.type === 'chat_message' && <MessageSquare className="w-5 h-5" />}
                                </div>
                                <div className="flex-grow">
                                  <p className={`text-sm ${!notif.read ? 'font-bold text-slate-900 dark:text-white' : 'font-medium text-slate-600 dark:text-slate-300'}`}>
                                    {notif.message}
                                  </p>
                                  <p className="text-xs text-slate-400 mt-1">
                                    {new Date(notif.createdAt).toLocaleDateString()} at {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </p>
                                </div>
                                {!notif.read && <div className="w-2 h-2 rounded-full bg-blue-600 self-center"></div>}
                              </div>
                            ))
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="relative" ref={profileRef}>
                  <button 
                    onClick={() => setShowProfile(!showProfile)}
                    className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm shadow-md hover:scale-105 transition-transform"
                  >
                    {user.name.charAt(0)}
                  </button>

                  <AnimatePresence>
                    {showProfile && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 mt-3 w-56 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden z-50"
                      >
                        <div className="p-4 border-b border-slate-100 dark:border-slate-800">
                          <p className="font-bold text-slate-900 dark:text-white truncate">{user.name}</p>
                          <p className="text-xs text-slate-500 capitalize">{user.role}</p>
                        </div>
                        <div className="p-2">
                          <button 
                            onClick={() => { auth.signOut(); router.push('/'); }}
                            className="w-full text-left px-4 py-2 text-sm text-red-600 font-bold hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg flex items-center gap-2 transition-colors"
                          >
                            <LogOut className="w-4 h-4" /> Sign Out
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : !loading ? (
              <Link href="/login" className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-2.5 rounded-full font-bold hover:scale-105 transition-transform shadow-md">
                Sign In
              </Link>
            ) : (
              <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse"></div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}