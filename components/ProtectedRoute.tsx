"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Array<"donor" | "receiver" | "admin">;
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      // Redirect unauthenticated users to login
      router.push("/login");
      return;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
      // User is logged in but doesn't have the right role
      if (user.role === "donor") {
        router.push("/donor/dashboard");
      } else if (user.role === "receiver") {
        router.push("/receiver/dashboard");
      } else {
        router.push("/");
      }
      return;
    }

    setIsAuthorized(true);
  }, [user, loading, router, allowedRoles]);

  if (loading || !isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
