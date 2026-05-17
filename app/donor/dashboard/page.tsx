"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Package, Inbox, CheckCircle, XCircle, Loader2, Phone, Mail, UploadCloud, Plus, LayoutDashboard, Settings, LogOut, TrendingUp, HeartHandshake, MessageSquare } from "lucide-react";
import Navbar from "@/components/Navbar";
import { db, auth } from "@/lib/firebase/config";
import { collection, query, where, getDocs, doc, updateDoc, addDoc, onSnapshot, writeBatch } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function DonorDashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [listings, setListings] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: "", clothingType: "casual", size: "m", condition: "good", address: "", deliveryPreference: "pickup", quantity: 1,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!authLoading && user && user.role === "donor") {
      setLoading(true);
      
      const listingsQuery = query(collection(db, "listings"), where("donorId", "==", user.uid));
      const unsubscribeListings = onSnapshot(listingsQuery, (snapshot) => {
        setListings(snapshot.docs.map(d => ({ id: d.id, ...d.data() })).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        setLoading(false);
      });

      const requestsQuery = query(collection(db, "requests"), where("donorId", "==", user.uid));
      const unsubscribeRequests = onSnapshot(requestsQuery, (snapshot) => {
        setRequests(snapshot.docs.map(d => ({ id: d.id, ...d.data() })).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      });

      return () => {
        unsubscribeListings();
        unsubscribeRequests();
      };
    }
  }, [user, authLoading]);

  const handleRequestAction = async (requestId: string, listingId: string, action: "accept" | "reject") => {
    try {
      setActionLoading(requestId);
      if (action === "accept") {
        const batch = writeBatch(db);
        batch.update(doc(db, "requests", requestId), { status: "Accepted" });
        batch.update(doc(db, "listings", listingId), { status: "Accepted" });
        
        const request = requests.find(r => r.id === requestId);
        if (request) {
          batch.set(doc(db, "chats", requestId), {
            listingId,
            donorId: user!.uid,
            receiverId: request.receiverId,
            createdAt: new Date().toISOString()
          });
          
          batch.set(doc(collection(db, "notifications")), {
            userId: request.receiverId,
            type: "request_update",
            message: `Your request for ${request.listingTitle} was accepted!`,
            read: false,
            link: `/chat/${requestId}`,
            createdAt: new Date().toISOString()
          });
        }
        
        const otherRequestsQuery = query(collection(db, "requests"), where("listingId", "==", listingId), where("status", "in", ["pending", "Requested"]));
        const otherRequestsSnap = await getDocs(otherRequestsQuery);
        otherRequestsSnap.forEach((rDoc) => {
          if (rDoc.id !== requestId) batch.update(doc(db, "requests", rDoc.id), { status: "Rejected" });
        });
        await batch.commit();
      } else {
        await updateDoc(doc(db, "requests", requestId), { status: "Rejected" });
        
        const request = requests.find(r => r.id === requestId);
        if (request) {
          await addDoc(collection(db, "notifications"), {
            userId: request.receiverId,
            type: "request_update",
            message: `Your request for ${request.listingTitle} was declined.`,
            read: false,
            link: "/receiver/dashboard",
            createdAt: new Date().toISOString()
          });
        }
        
        const otherRequestsQuery = query(collection(db, "requests"), where("listingId", "==", listingId), where("status", "in", ["pending", "Requested"]));
        const otherRequestsSnap = await getDocs(otherRequestsQuery);
        const remainingPending = otherRequestsSnap.docs.filter(d => d.id !== requestId);
        if (remainingPending.length === 0) {
          await updateDoc(doc(db, "listings", listingId), { status: "Available" });
        }
      }
    } catch (error) {
      console.error("Error updating request:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleCreateListing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    try {
      setUploading(true);
      let imageUrl = "";

      if (imageFile) {
        const uploadData = new FormData();
        uploadData.append('file', imageFile);
        const res = await fetch('/api/upload', { method: 'POST', body: uploadData });
        if (res.ok) imageUrl = (await res.json()).url;
      }

      const newListing = {
        ...formData,
        donorId: user.uid,
        donorName: user.name,
        images: imageUrl ? [imageUrl] : [],
        status: "Available",
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, "listings"), newListing);
      setShowForm(false);
      setImageFile(null);
    } catch (error) {
      console.error("Error creating listing:", error);
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={["donor"]}>
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
        </div>
      </ProtectedRoute>
    );
  }

  // Calculate Stats
  const activeListings = listings.filter(l => l.status === "Available").length;
  const pendingRequests = requests.filter(r => r.status === "pending" || r.status === "Requested").length;
  const totalImpact = listings.filter(l => l.status === "Accepted" || l.status === "Completed").length;

  return (
    <ProtectedRoute allowedRoles={["donor"]}>
      <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 font-sans">
      
      {/* Sidebar Navigation */}
      <aside className="hidden lg:flex flex-col w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 fixed h-full z-20">
        <div className="p-6">
          <Link href="/" className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">
            Dress<span className="text-blue-600">Loop</span>
          </Link>
        </div>
        
        <div className="flex flex-col gap-2 px-4 flex-grow mt-6">
          <button className="flex items-center gap-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-4 py-3 rounded-xl font-bold transition-colors">
            <LayoutDashboard className="w-5 h-5" /> Dashboard
          </button>
          <Link href="/feed" className="flex items-center gap-3 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 px-4 py-3 rounded-xl font-medium transition-colors">
            <Package className="w-5 h-5" /> Browse Feed
          </Link>
          <button className="flex items-center gap-3 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 px-4 py-3 rounded-xl font-medium transition-colors">
            <Settings className="w-5 h-5" /> Settings
          </button>
        </div>

        <div className="p-6 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold uppercase shadow-md">
              {user?.name.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{user?.name}</p>
              <p className="text-xs text-slate-500 truncate capitalize">{user?.role}</p>
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
            Dress<span className="text-blue-600">Loop</span>
          </Link>
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-xs">
            {user?.name.charAt(0)}
          </div>
        </div>

        <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-2">
              Welcome back, {user?.name.split(' ')[0]}
            </h1>
            <p className="text-slate-500 dark:text-slate-400">Here's what's happening with your donations today.</p>
          </div>
          <button 
            onClick={() => setShowForm(!showForm)}
            className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:scale-105 active:scale-95 px-6 py-3.5 rounded-xl font-bold transition flex items-center justify-center gap-2 shadow-xl shadow-slate-900/10"
          >
            {showForm ? <XCircle className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            {showForm ? "Cancel" : "New Donation"}
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-6">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
              <Package className="w-7 h-7 text-blue-500" />
            </div>
            <div>
              <p className="text-3xl font-black text-slate-900 dark:text-white">{activeListings}</p>
              <p className="text-sm font-medium text-slate-500">Active Listings</p>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-6">
            <div className="w-14 h-14 rounded-2xl bg-yellow-50 dark:bg-yellow-900/20 flex items-center justify-center">
              <Inbox className="w-7 h-7 text-yellow-500" />
            </div>
            <div>
              <p className="text-3xl font-black text-slate-900 dark:text-white">{pendingRequests}</p>
              <p className="text-sm font-medium text-slate-500">Pending Requests</p>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-6 relative overflow-hidden group">
            <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-colors"></div>
            <div className="w-14 h-14 rounded-2xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center relative z-10">
              <HeartHandshake className="w-7 h-7 text-purple-500" />
            </div>
            <div className="relative z-10">
              <p className="text-3xl font-black text-slate-900 dark:text-white">{totalImpact}</p>
              <p className="text-sm font-medium text-slate-500">Items Donated</p>
            </div>
          </div>
        </div>

        {/* Creation Form (Animated) */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-10"
            >
              <form onSubmit={handleCreateListing} className="bg-white dark:bg-slate-900 p-8 md:p-10 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none space-y-8">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                    <UploadCloud className="w-5 h-5 text-blue-500" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Create New Listing</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Listing Title</label>
                    <input required type="text" name="title" value={formData.title} onChange={handleFormChange} placeholder="e.g. Winter Jackets Bundle" className="w-full px-5 py-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Quantity</label>
                    <input required type="number" min="1" name="quantity" value={formData.quantity} onChange={handleFormChange} className="w-full px-5 py-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition" />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Category</label>
                    <select name="clothingType" value={formData.clothingType} onChange={handleFormChange} className="w-full px-5 py-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition appearance-none cursor-pointer">
                      <option value="casual">Casual</option>
                      <option value="formal">Formal</option>
                      <option value="winter">Winter</option>
                      <option value="kids">Kids</option>
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Size</label>
                    <select name="size" value={formData.size} onChange={handleFormChange} className="w-full px-5 py-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition appearance-none cursor-pointer">
                      <option value="xs">XS</option>
                      <option value="s">S</option>
                      <option value="m">M</option>
                      <option value="l">L</option>
                      <option value="xl">XL</option>
                    </select>
                  </div>

                  <div className="md:col-span-2 space-y-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Upload Image (Optional)</label>
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-10 text-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition flex flex-col items-center justify-center gap-4 group"
                    >
                      <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                        <UploadCloud className="w-8 h-8 text-blue-500" />
                      </div>
                      <span className="text-slate-600 dark:text-slate-400 font-medium text-lg">
                        {imageFile ? imageFile.name : "Click to browse files"}
                      </span>
                      <input 
                        ref={fileInputRef} type="file" accept="image/*" className="hidden" 
                        onChange={(e) => { if (e.target.files && e.target.files[0]) setImageFile(e.target.files[0]); }}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <button
                    type="submit" disabled={uploading}
                    className="bg-blue-600 text-white px-10 py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 hover:shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all disabled:opacity-70"
                  >
                    {uploading ? <><Loader2 className="w-5 h-5 animate-spin" /> Uploading...</> : "Publish Listing"}
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dash Grids */}
        <div className="grid lg:grid-cols-2 gap-10">
          
          {/* Requests Column */}
          <div className="space-y-6">
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Inbox className="w-5 h-5 text-blue-500" /> Action Required
            </h2>
            
            <div className="space-y-4">
              {requests.length === 0 ? (
                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-3xl p-10 border border-dashed border-slate-200 dark:border-slate-800 text-center">
                  <p className="text-slate-500 font-medium">All caught up! No pending requests.</p>
                </div>
              ) : (
                <AnimatePresence>
                  {requests.map(request => (
                    <motion.div 
                      key={request.id}
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 border border-slate-200 dark:border-slate-800 shadow-sm"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-bold text-slate-900 dark:text-white text-lg">{request.listingTitle}</h3>
                          <p className="text-sm text-slate-500 font-medium mt-1">From: {request.receiverName}</p>
                        </div>
                        <span className={`text-xs px-3 py-1.5 rounded-full font-bold uppercase tracking-wider ${
                          request.status === 'Requested' || request.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                          request.status === 'Accepted' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {request.status}
                        </span>
                      </div>

                      {(request.status === "Requested" || request.status === "pending") && (
                        <div className="flex gap-3 mt-6">
                          <button 
                            onClick={() => handleRequestAction(request.id, request.listingId, "accept")}
                            disabled={actionLoading === request.id}
                            className="flex-1 bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-3 rounded-xl font-bold flex justify-center items-center gap-2 hover:scale-[1.02] active:scale-95 transition-all"
                          >
                            {actionLoading === request.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle className="w-4 h-4" /> Approve</>}
                          </button>
                          <button 
                            onClick={() => handleRequestAction(request.id, request.listingId, "reject")}
                            disabled={actionLoading === request.id}
                            className="flex-1 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 py-3 rounded-xl font-bold flex justify-center items-center gap-2 border border-slate-200 dark:border-slate-700 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all"
                          >
                            <XCircle className="w-4 h-4" /> Decline
                          </button>
                        </div>
                      )}

                      {request.status === "Accepted" && (
                        <div className="mt-6 p-5 bg-purple-50 dark:bg-purple-900/10 rounded-2xl border border-purple-100 dark:border-purple-800/30 space-y-3">
                          <p className="text-xs uppercase font-bold text-purple-600 dark:text-purple-400 tracking-wider">Contact Shared</p>
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300 font-medium bg-white dark:bg-slate-900 px-4 py-2.5 rounded-lg">
                              <Mail className="w-4 h-4 text-purple-400" /> {request.receiverEmail}
                            </div>
                            {request.receiverPhone && (
                              <div className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300 font-medium bg-white dark:bg-slate-900 px-4 py-2.5 rounded-lg">
                                <Phone className="w-4 h-4 text-purple-400" /> {request.receiverPhone}
                              </div>
                            )}
                          </div>
                          <Link 
                            href={`/chat/${request.id}`}
                            className="w-full mt-4 bg-purple-600 text-white py-3 rounded-xl font-bold flex justify-center items-center gap-2 hover:bg-purple-700 transition-colors shadow-md"
                          >
                            <MessageSquare className="w-4 h-4" /> Message NGO
                          </Link>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>
          </div>

          {/* Listings Column */}
          <div className="space-y-6">
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Package className="w-5 h-5 text-purple-500" /> Your Inventory
            </h2>
            
            <div className="space-y-4">
              {listings.length === 0 ? (
                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-3xl p-10 border border-dashed border-slate-200 dark:border-slate-800 text-center">
                  <p className="text-slate-500 font-medium">Your inventory is empty.</p>
                </div>
              ) : (
                <AnimatePresence>
                  {listings.map(listing => (
                    <motion.div 
                      key={listing.id}
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      className="bg-white dark:bg-slate-900 rounded-[2rem] p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-5"
                    >
                      <div className="w-24 h-24 rounded-2xl bg-slate-100 dark:bg-slate-800 overflow-hidden relative flex-shrink-0">
                        {listing.images?.[0] ? (
                          <img src={listing.images[0]} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Package className="w-8 h-8 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-slate-300" />
                        )}
                      </div>
                      <div className="flex-grow py-2">
                        <div className="flex justify-between items-start mb-1">
                          <h3 className="font-bold text-slate-900 dark:text-white line-clamp-1">{listing.title}</h3>
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 capitalize mb-3 font-medium">{listing.clothingType} • Size {listing.size}</p>
                        
                        <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${
                          listing.status === 'Available' ? 'bg-blue-100 text-blue-700' :
                          listing.status === 'Requested' ? 'bg-yellow-100 text-yellow-700' :
                          listing.status === 'Accepted' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {listing.status}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>
          </div>

        </div>
      </main>
    </div>
    </ProtectedRoute>
  );
}
