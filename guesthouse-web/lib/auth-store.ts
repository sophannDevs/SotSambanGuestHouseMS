import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface UserSession {
  userId: string;
  propertyId: string | null;
  email: string;
  displayName: string;
  roles: string[];
  permissions: string[];
}

interface AuthState {
  user: UserSession | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setSession: (user: UserSession, accessToken: string, refreshToken: string) => void;
  clearSession: () => void;
  hasPermission: (permissionKey: string) => boolean;
  hasRole: (roleName: string) => boolean;
  hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      setSession: (user, accessToken, refreshToken) =>
        set({
          user,
          accessToken,
          refreshToken,
          isAuthenticated: true,
        }),

      clearSession: () =>
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        }),

      hasPermission: (permissionKey: string) => {
        const { user } = get();
        if (!user) return false;
        // OWNER implicitly has all permissions
        if (user.roles.includes("OWNER")) return true;
        return user.permissions.includes(permissionKey);
      },

      hasRole: (roleName: string) => {
        const { user } = get();
        if (!user) return false;
        return user.roles.includes(roleName);
      },

      hasHydrated: false,
      setHasHydrated: (value: boolean) => set({ hasHydrated: value }),
    }),
    {
      name: "gh-auth-storage",
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
