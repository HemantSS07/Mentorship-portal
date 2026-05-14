"use client";
import React, { createContext, useContext, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createUser, getUser } from "@/lib/db";
import { useAuthStore } from "@/store/authStore";
import toast from "react-hot-toast";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

interface AuthContextValue {
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  signInWithGoogle: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { setUser, setLoading } = useAuthStore();

  useEffect(() => {
    const supabaseEnabled = isSupabaseConfigured();

    if (!supabaseEnabled) {
      setLoading(false);
      return;
    }

    const handleSupabaseUser = async (supabaseUser: any | null) => {
      if (!supabaseUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const existing = await getUser(supabaseUser.id);
        setUser(
          existing ?? {
            uid: supabaseUser.id,
            name: supabaseUser.user_metadata?.full_name ?? supabaseUser.email?.split("@")[0] ?? "User",
            email: supabaseUser.email ?? "",
            photoURL: supabaseUser.user_metadata?.avatar_url ?? undefined,
            role: "junior",
            branch: "",
            year: "",
            createdAt: new Date(),
          }
        );
      } catch {
        setUser({
          uid: supabaseUser.id,
          name: supabaseUser.user_metadata?.full_name ?? supabaseUser.email?.split("@")[0] ?? "User",
          email: supabaseUser.email ?? "",
          photoURL: supabaseUser.user_metadata?.avatar_url ?? undefined,
          role: "junior",
          branch: "",
          year: "",
          createdAt: new Date(),
        });
      }
      setLoading(false);
    };

    let mounted = true;
    const init = async () => {
      const { data } = await supabase.auth.getUser();
      if (mounted) {
        await handleSupabaseUser(data.user ?? null);
      }
    };
    init();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (mounted) {
        await handleSupabaseUser(session?.user ?? null);
      }
    });

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [setUser, setLoading]);

  const signInWithGoogle = async () => {
    const supabaseEnabled = isSupabaseConfigured();

    if (!supabaseEnabled) {
      setLoading(true);
      setTimeout(() => {
        setUser({
          uid: "demo_user_123",
          name: "Demo Student",
          email: "student@demo.app",
          role: "junior",
          branch: "",
          year: "",
          createdAt: new Date(),
        });
        setLoading(false);
        toast.success("Signed in with Demo Account!");
      }, 150);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: window.location.origin },
      });
      if (error) {
        setLoading(false);
        throw error;
      }
      if (data?.url) {
        window.location.href = data.url;
        return;
      }
    } catch (err: any) {
      setLoading(false);
      toast.error(err.message || "Failed to sign in with Google.");
      return;
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      if (isSupabaseConfigured()) {
        await supabase.auth.signOut();
      }
    } catch (err) {
      console.error("Sign out error:", err);
    } finally {
      setUser(null);
      toast.success("Signed out successfully!");
      // Using window.location.href instead of router.push to ensure a full clean state
      window.location.href = "/auth";
    }
  };

  return (
    <AuthContext.Provider value={{ signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
