"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, ArrowLeft, Send, ShieldCheck, Box } from "lucide-react";
import { db } from "@/lib/firebase/config";
import { collection, doc, getDoc, addDoc, query, orderBy, onSnapshot, serverTimestamp } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import ProtectedRoute from "@/components/ProtectedRoute";
import Link from "next/link";

interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: any;
}

export default function ChatPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const router = useRouter();

  const [chatInfo, setChatInfo] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);

  useEffect(() => {
    if (!user || !id) return;

    const fetchChatAndListen = async () => {
      try {
        const chatDocRef = doc(db, "chats", id as string);
        const chatSnap = await getDoc(chatDocRef);

        if (!chatSnap.exists()) {
          router.push("/");
          return;
        }

        const chatData = chatSnap.data();
        
        // Security check: only donor or receiver of this chat can view it
        if (chatData.donorId !== user.uid && chatData.receiverId !== user.uid) {
          router.push("/");
          return;
        }

        setChatInfo(chatData);

        // Listen for messages
        const messagesRef = collection(db, "chats", id as string, "messages");
        const q = query(messagesRef, orderBy("timestamp", "asc"));

        const unsubscribe = onSnapshot(q, (snapshot) => {
          const loadedMessages = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Message[];
          
          setMessages(loadedMessages);
          setLoading(false);
        });

        return () => unsubscribe();
      } catch (error) {
        console.error("Error fetching chat:", error);
        setLoading(false);
      }
    };

    const cleanup = fetchChatAndListen();
    return () => {
      cleanup.then(unsub => {
        if (unsub) unsub();
      });
    };
  }, [id, user, router]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !id) return;

    const text = newMessage;
    setNewMessage(""); // Optimistic UI clear

    try {
      await addDoc(collection(db, "chats", id as string, "messages"), {
        senderId: user.uid,
        text,
        timestamp: serverTimestamp()
      });

      const partnerId = chatInfo.donorId === user.uid ? chatInfo.receiverId : chatInfo.donorId;
      await addDoc(collection(db, "notifications"), {
        userId: partnerId,
        type: "chat_message",
        message: `New message from ${user.name}`,
        read: false,
        link: `/chat/${id}`,
        createdAt: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error sending message:", error);
      setNewMessage(text); // Restore if failed
    }
  };

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={["donor", "receiver"]}>
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
        </div>
      </ProtectedRoute>
    );
  }

  // Determine chat partner identity based on current user role
  const isDonor = user?.role === "donor";
  const partnerRole = isDonor ? "NGO Receiver" : "Donor";
  const backLink = isDonor ? "/donor/dashboard" : "/receiver/dashboard";

  return (
    <ProtectedRoute allowedRoles={["donor", "receiver"]}>
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 font-sans">
        <Navbar />

        <main className="flex-grow pt-24 pb-6 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full flex flex-col h-screen">
          
          {/* Chat Header */}
          <div className="bg-white dark:bg-slate-900 rounded-t-3xl border border-b-0 border-slate-200 dark:border-slate-800 p-4 sm:p-6 flex items-center gap-4 shadow-sm z-10 shrink-0">
            <Link href={backLink} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
              <ArrowLeft className="w-6 h-6 text-slate-600 dark:text-slate-400" />
            </Link>
            
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white flex-shrink-0 shadow-inner">
              <ShieldCheck className="w-6 h-6" />
            </div>
            
            <div>
              <h1 className="font-bold text-slate-900 dark:text-white text-lg leading-tight">Coordination Chat</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Box className="w-3.5 h-3.5" /> Item ID: {chatInfo?.listingId?.substring(0,6)}...
              </p>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-grow bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-4 sm:p-6 overflow-y-auto flex flex-col gap-4 relative min-h-0">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, black 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
            
            {messages.length === 0 ? (
              <div className="flex-grow flex flex-col items-center justify-center text-center p-8 opacity-60">
                <ShieldCheck className="w-16 h-16 text-slate-400 mb-4" />
                <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-2">Secure Chat Initiated</h3>
                <p className="text-sm text-slate-500 max-w-sm">This is a secure channel to coordinate pickup details. Say hello to the {partnerRole}!</p>
              </div>
            ) : (
              messages.map((msg, index) => {
                const isMe = msg.senderId === user?.uid;
                
                return (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={msg.id || index} 
                    className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                  >
                    <div 
                      className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-5 py-3 relative shadow-sm z-10 ${
                        isMe 
                          ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white rounded-br-sm' 
                          : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-sm border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <p className="text-[15px] leading-relaxed break-words">{msg.text}</p>
                      {msg.timestamp && (
                        <span className={`text-[10px] block mt-1.5 font-medium ${isMe ? 'text-blue-100/80 text-right' : 'text-slate-400/80 text-left'}`}>
                          {msg.timestamp?.toDate ? msg.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Sending...'}
                        </span>
                      )}
                    </div>
                  </motion.div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="bg-white dark:bg-slate-900 rounded-b-3xl border border-t-0 border-slate-200 dark:border-slate-800 p-4 sm:p-5 shrink-0 z-10 mb-8 sm:mb-0">
            <form onSubmit={handleSendMessage} className="flex items-end gap-3">
              <div className="flex-grow relative">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-2xl px-5 py-4 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-900 dark:text-white transition-shadow"
                />
              </div>
              <button
                type="submit"
                disabled={!newMessage.trim()}
                className="w-14 h-14 flex items-center justify-center bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:dark:bg-slate-800 text-white disabled:text-slate-400 rounded-2xl transition-all flex-shrink-0 shadow-lg disabled:shadow-none"
              >
                <Send className="w-5 h-5 ml-1" />
              </button>
            </form>
          </div>

        </main>
      </div>
    </ProtectedRoute>
  );
}
