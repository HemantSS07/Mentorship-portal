"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { Loader2 } from "lucide-react";

interface RouteGuardProps {
  children: React.ReactNode;
  allowedRoles: string[];
}

export default function RouteGuard({ children, allowedRoles }: RouteGuardProps) {
  const { user, loading } = useAuthStore();
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (loading) return;
    
    if (!user) {
      router.replace("/auth");
      return;
    }

    if (!allowedRoles.includes(user.role)) {
      if (user.role === "teacher_mentor") router.replace("/teacher-dashboard");
      else if (user.role === "mentor") router.replace("/mentor-dashboard");
      else router.replace("/dashboard");
      return;
    }

    setAuthorized(true);
  }, [user, loading, router, allowedRoles]);

  if (!authorized) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#0a0a0a]">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return <>{children}</>;
}
