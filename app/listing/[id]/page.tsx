"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, MapPin, Tag, Box, Loader2, Heart, ShieldCheck, Clock, Share2, Info } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { db } from "@/lib/firebase/config";
import { doc, getDoc, addDoc, collection, updateDoc, onSnapshot, query, where, getDocs } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import Image from "next/image";
import Link from "next/link";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function ListingDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  
  const [listing, setListing] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    if (params.id) {
      setLoading(true);
      const docRef = doc(db, "listings", params.id as string);
      
      const unsubscribe = onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
          setListing({ id: docSnap.id, ...docSnap.data() });
        } else {
          setListing(null);
        }
        setLoading(false);
      }, (error) => {
        console.error("Error fetching listing:", error);
        setLoading(false);
      });

      return () => unsubscribe();
    }
  }, [params.id]);

  const handleRequest = async () => {
    if (!user) {
      alert("You must be logged in to request items.");
      return;
    }
    if (user.role !== "receiver") {
      alert("Only registered Receivers/NGOs can request items.");
      return;
    }

    try {
      setRequesting(true);
      
      const duplicateQuery = query(collection(db, "requests"), where("listingId", "==", listing.id), where("receiverId", "==", user.uid));
      const duplicateSnap = await getDocs(duplicateQuery);
      
      if (!duplicateSnap.empty) {
        alert("You have already requested this item.");
        setRequesting(false);
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
      router.push("/receiver/dashboard");
    } catch (error) {
      console.error("Error requesting item:", error);
      alert("Failed to send request.");
    } finally {
      setRequesting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 font-sans">
        <Navbar />
        <main className="flex-grow flex flex-col items-center justify-center p-4">
          <Box className="w-20 h-20 text-slate-300 mb-6" />
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-4 tracking-tight">Listing Not Found</h1>
          <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-md text-center">This item may have been removed by the donor or no longer exists in our system.</p>
          <Link href="/feed" className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-8 py-3.5 rounded-xl font-bold hover:scale-105 transition-transform shadow-xl">
            Return to Feed
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <ProtectedRoute allowedRoles={["receiver"]}>
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 font-sans selection:bg-blue-500/30">
      <Navbar />

      <main className="flex-grow pt-28 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <Link href="/feed" className="inline-flex items-center gap-2 text-slate-500 hover:text-blue-500 dark:hover:text-blue-400 transition-colors mb-8 font-semibold tracking-wide text-sm uppercase">
          <ArrowLeft className="w-4 h-4" /> Back to Feed
        </Link>

        <div className="flex flex-col lg:flex-row gap-12 lg:gap-16">
          
          {/* Left: Image Gallery */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="lg:w-3/5"
          >
            <div className="relative aspect-[4/5] md:aspect-square w-full rounded-[2.5rem] bg-slate-100 dark:bg-slate-900 overflow-hidden shadow-2xl border border-slate-200/50 dark:border-slate-800/50 group">
              {listing.images && listing.images.length > 0 ? (
                <Image 
                  src={listing.images[0]} 
                  alt={listing.title} 
                  fill 
                  className="object-cover transition-transform duration-700 group-hover:scale-105" 
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-slate-300 dark:text-slate-700">
                  <Box className="w-24 h-24 opacity-30" />
                </div>
              )}
              
              {/* Floating badges on image */}
              <div className="absolute top-6 right-6 flex flex-col gap-3">
                <div className="bg-white/90 dark:bg-black/80 backdrop-blur-md px-4 py-2 rounded-2xl text-sm font-extrabold shadow-xl flex items-center justify-center">
                  Qty: {listing.quantity}
                </div>
                <button className="bg-white/90 dark:bg-black/80 backdrop-blur-md w-10 h-10 rounded-full flex items-center justify-center shadow-xl hover:scale-110 transition-transform">
                  <Share2 className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                </button>
              </div>
            </div>
          </motion.div>

          {/* Right: Details Panel */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="lg:w-2/5 flex flex-col pt-4 lg:pt-8"
          >
            <div className="mb-4 flex items-center gap-3">
              <span className={`text-xs px-3.5 py-1.5 rounded-full font-bold uppercase tracking-wider ${
                listing.status === 'Available' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                listing.status === 'Requested' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                listing.status === 'Accepted' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
                'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
              }`}>
                {listing.status}
              </span>
              <span className="text-sm text-slate-500 font-medium flex items-center gap-1.5">
                <Clock className="w-4 h-4" /> {new Date(listing.createdAt).toLocaleDateString()}
              </span>
            </div>

            <h1 className="text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white mb-6 leading-tight tracking-tight">
              {listing.title}
            </h1>
            
            <div className="flex flex-wrap gap-3 mb-10">
              <span className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-sm px-5 py-2.5 rounded-xl capitalize font-semibold shadow-sm flex items-center gap-2">
                <Tag className="w-4 h-4 text-slate-400" /> {listing.clothingType}
              </span>
              <span className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-sm px-5 py-2.5 rounded-xl uppercase font-extrabold shadow-sm">
                Size {listing.size}
              </span>
              <span className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-sm px-5 py-2.5 rounded-xl capitalize font-semibold shadow-sm">
                {listing.condition} Condition
              </span>
            </div>

            {/* Information Cards */}
            <div className="space-y-4 mb-10">
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex gap-4 items-start">
                <div className="bg-blue-50 dark:bg-blue-900/20 w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <p className="font-bold text-slate-900 dark:text-white text-lg">Location</p>
                  <p className="text-slate-500 dark:text-slate-400 leading-relaxed mt-1">{listing.address}</p>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex gap-4 items-start">
                <div className="bg-purple-50 dark:bg-purple-900/20 w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Box className="w-6 h-6 text-purple-500" />
                </div>
                <div>
                  <p className="font-bold text-slate-900 dark:text-white text-lg">Delivery Method</p>
                  <p className="text-slate-500 dark:text-slate-400 leading-relaxed mt-1 capitalize">{listing.deliveryPreference}</p>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex gap-4 items-center">
                <div className="bg-emerald-50 dark:bg-emerald-900/20 w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0">
                  <ShieldCheck className="w-6 h-6 text-emerald-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Verified Donor</p>
                  <p className="font-bold text-slate-900 dark:text-white">{listing.donorName}</p>
                </div>
              </div>
            </div>

            {/* Sticky Action Area */}
            <div className="mt-auto sticky bottom-6 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl p-4 -mx-4 sm:mx-0 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] dark:shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-20">
              <button
                onClick={handleRequest}
                disabled={listing.status !== "Available" || requesting}
                className={`w-full py-4 rounded-xl font-extrabold transition-all duration-300 flex justify-center items-center gap-2 text-lg relative overflow-hidden group ${
                  listing.status !== "Available"
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-[0_0_30px_rgba(59,130,246,0.4)] hover:scale-[1.02] active:scale-[0.98]'
                }`}
              >
                {requesting ? (
                  <><Loader2 className="w-6 h-6 animate-spin" /> Processing...</>
                ) : listing.status !== "Available" ? (
                  listing.status
                ) : (
                  <>
                    <span className="relative z-10 flex items-center gap-2">Request Item <Heart className="w-5 h-5 group-hover:fill-current" /></span>
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
                  </>
                )}
              </button>
              
              {!user && (
                <div className="mt-4 flex items-center justify-center gap-2 text-sm text-slate-500">
                  <Info className="w-4 h-4" />
                  <p>
                    Please <Link href="/login" className="text-blue-500 font-bold hover:underline">log in</Link> as an NGO to request.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
    </ProtectedRoute>
  );
}
