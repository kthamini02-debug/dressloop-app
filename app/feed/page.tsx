"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Filter, MapPin, Tag, Box, Loader2, Heart, ShieldCheck, ChevronDown } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { db } from "@/lib/firebase/config";
import { collection, query, where, getDocs, addDoc, doc, updateDoc, onSnapshot } from "firebase/firestore";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import ProtectedRoute from "@/components/ProtectedRoute";

interface Listing {
  id: string;
  donorId: string;
  donorName: string;
  title: string;
  clothingType: string;
  size: string;
  condition: string;
  address: string;
  deliveryPreference: string;
  images: string[];
  quantity: number;
  status: string;
  createdAt: string;
}

export default function FeedPage() {
  const { user } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [requestingId, setRequestingId] = useState<string | null>(null);

  // Filters
  const [category, setCategory] = useState("");
  const [size, setSize] = useState("");
  const [condition, setCondition] = useState("");

  useEffect(() => {
    setLoading(true);
    let q = query(collection(db, "listings"), where("status", "==", "Available"));
    
    if (category) q = query(q, where("clothingType", "==", category));
    if (size) q = query(q, where("size", "==", size));
    if (condition) q = query(q, where("condition", "==", condition));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Listing));
      setListings(data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      setLoading(false);
    }, (error) => {
      console.error("Error fetching listings:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [category, size, condition]);

  const handleRequest = async (listing: Listing) => {
    if (!user) {
      alert("You must be logged in to request items.");
      return;
    }
    if (user.role !== "receiver") {
      alert("Only registered Receivers/NGOs can request items.");
      return;
    }

    try {
      setRequestingId(listing.id);
      
      const duplicateQuery = query(collection(db, "requests"), where("listingId", "==", listing.id), where("receiverId", "==", user.uid));
      const duplicateSnap = await getDocs(duplicateQuery);
      
      if (!duplicateSnap.empty) {
        alert("You have already requested this item.");
        setRequestingId(null);
        return;
      }
      
      await addDoc(collection(db, "requests"), {
        listingId: listing.id,
        listingTitle: listing.title,
        donorId: listing.donorId,
        receiverId: user.uid,
        receiverName: user.name,
        receiverEmail: user.email,
        receiverPhone: user.phone || "",
        status: "Requested",
        createdAt: new Date().toISOString()
      });

      await addDoc(collection(db, "notifications"), {
        userId: listing.donorId,
        type: "request_new",
        message: `${user.name} requested your item: ${listing.title}`,
        read: false,
        link: "/donor/dashboard",
        createdAt: new Date().toISOString()
      });

      await updateDoc(doc(db, "listings", listing.id), {
        status: "Requested"
      });

      alert("Request sent successfully! The donor will review your request.");
    } catch (error) {
      console.error("Error requesting item:", error);
      alert("Failed to send request.");
    } finally {
      setRequestingId(null);
    }
  };

  return (
    <ProtectedRoute allowedRoles={["receiver"]}>
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 font-sans">
      <Navbar />

      <main className="flex-grow pt-28 pb-20 px-4 sm:px-6 lg:px-8 max-w-[1400px] mx-auto w-full">
        
        {/* Header Section */}
        <div className="mb-10 text-center md:text-left flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-3">
              Discover <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-500">Donations</span>
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-lg max-w-xl">
              Browse premium clothing items generously donated by our community, available for your organization.
            </p>
          </div>
          <div className="flex-shrink-0 text-slate-500 dark:text-slate-400 font-medium bg-white dark:bg-slate-900 px-5 py-2.5 rounded-full border border-slate-200 dark:border-slate-800 shadow-sm">
            {listings.length} Items Available
          </div>
        </div>

        {/* Filters Section (Pills Style) */}
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-4 md:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm mb-12 flex flex-col md:flex-row flex-wrap gap-6 md:items-center sticky top-24 z-30">
          
          <div className="flex items-center gap-3">
            <Filter className="w-5 h-5 text-slate-400" />
            <span className="font-semibold text-slate-700 dark:text-slate-300">Filters:</span>
          </div>

          <div className="flex flex-wrap gap-3 flex-grow">
            {/* Category Pill Dropdown */}
            <div className="relative group">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="appearance-none bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium py-2 pl-4 pr-10 rounded-full transition-colors cursor-pointer outline-none border border-transparent focus:border-blue-500"
              >
                <option value="">All Categories</option>
                <option value="casual">Casual</option>
                <option value="formal">Formal</option>
                <option value="winter">Winter</option>
                <option value="kids">Kids</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
            </div>

            {/* Size Pill Dropdown */}
            <div className="relative group">
              <select
                value={size}
                onChange={(e) => setSize(e.target.value)}
                className="appearance-none bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium py-2 pl-4 pr-10 rounded-full transition-colors cursor-pointer outline-none border border-transparent focus:border-blue-500"
              >
                <option value="">All Sizes</option>
                <option value="xs">XS</option>
                <option value="s">S</option>
                <option value="m">M</option>
                <option value="l">L</option>
                <option value="xl">XL</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
            </div>

            {/* Condition Pill Dropdown */}
            <div className="relative group">
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                className="appearance-none bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium py-2 pl-4 pr-10 rounded-full transition-colors cursor-pointer outline-none border border-transparent focus:border-blue-500"
              >
                <option value="">All Conditions</option>
                <option value="new">New</option>
                <option value="good">Good</option>
                <option value="fair">Fair</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
            </div>
          </div>

          {(category || size || condition) && (
            <button 
              onClick={() => { setCategory(""); setSize(""); setCondition(""); }}
              className="text-sm text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 font-semibold transition-colors"
            >
              Clear All
            </button>
          )}
        </div>

        {/* Listings Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col animate-pulse">
                <div className="aspect-[4/5] w-full bg-slate-200 dark:bg-slate-800" />
                <div className="p-6 flex flex-col flex-grow">
                  <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-md w-3/4 mb-4" />
                  <div className="flex gap-2 mb-6">
                    <div className="h-8 w-20 bg-slate-200 dark:bg-slate-800 rounded-lg" />
                    <div className="h-8 w-12 bg-slate-200 dark:bg-slate-800 rounded-lg" />
                  </div>
                  <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-md w-1/2 mb-6" />
                  <div className="mt-auto pt-5 border-t border-slate-100 dark:border-slate-800">
                    <div className="h-12 w-full bg-slate-200 dark:bg-slate-800 rounded-xl" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-32 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">No items found</h3>
            <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              Try adjusting your filters or check back later for new donations.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            <AnimatePresence>
              {listings.map((listing) => (
                <motion.div
                  key={listing.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)] transition-all duration-300 overflow-hidden flex flex-col group relative"
                >
                  <Link href={`/listing/${listing.id}`} className="block relative aspect-[4/5] w-full bg-slate-100 dark:bg-slate-800 overflow-hidden cursor-pointer">
                    {listing.images && listing.images.length > 0 ? (
                      <Image 
                        src={listing.images[0]} 
                        alt={listing.title} 
                        fill 
                        className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out" 
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-slate-300 dark:text-slate-700">
                        <Box className="w-16 h-16 opacity-50" />
                      </div>
                    )}
                    
                    {/* Glass Overlay on Hover */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                    
                    <div className="absolute top-4 right-4 bg-white/90 dark:bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-bold shadow-lg">
                      Qty: {listing.quantity}
                    </div>
                  </Link>

                  <div className="p-6 flex flex-col flex-grow relative z-10 bg-white dark:bg-slate-900">
                    <Link href={`/listing/${listing.id}`} className="group-hover:text-blue-500 transition-colors">
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3 line-clamp-1" title={listing.title}>
                        {listing.title}
                      </h3>
                    </Link>
                    
                    <div className="flex flex-wrap gap-2 mb-5">
                      <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs px-3 py-1.5 rounded-lg capitalize font-semibold flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5" /> {listing.clothingType}
                      </span>
                      <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs px-3 py-1.5 rounded-lg uppercase font-bold">
                        {listing.size}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mb-6 text-sm text-slate-500 dark:text-slate-400">
                      <MapPin className="w-4 h-4 text-slate-400" />
                      <span className="truncate">{listing.address}</span>
                    </div>

                    <div className="mt-auto pt-5 border-t border-slate-100 dark:border-slate-800">
                      <button
                        onClick={() => handleRequest(listing)}
                        disabled={requestingId === listing.id}
                        className={`w-full py-3.5 rounded-xl font-bold transition-all flex justify-center items-center gap-2 ${
                          requestingId === listing.id 
                            ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                            : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-slate-900/10 dark:shadow-white/10'
                        }`}
                      >
                        {requestingId === listing.id ? (
                          <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</>
                        ) : (
                          <>Request Item <Heart className="w-4 h-4" /></>
                        )}
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>

      <Footer />
    </div>
    </ProtectedRoute>
  );
}