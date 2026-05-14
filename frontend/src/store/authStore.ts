import { create } from "zustand";
import { persist } from "zustand/middleware";
import { AppUser } from "@/types";

interface AuthState {
  user: AppUser | null;
  loading: boolean;
  setUser: (user: AppUser | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      loading: true,
      setUser: (user) => set({ user, loading: false }),
      setLoading: (loading) => set({ loading }),
    }),
    {
      name: "mentorship-auth",
      partialize: (state) => ({ user: state.user }),
      onRehydrateStorage: () => (state) => {
        // Once hydration is complete, always set loading to false
        if (state) state.setLoading(false);
      },
    }
  )
);
