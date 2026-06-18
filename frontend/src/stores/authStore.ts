import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '../services/api';

interface AuthState {
  isAdmin: boolean;
  login: (password: string) => Promise<boolean>;
  setup: (password: string) => Promise<boolean>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAdmin: false,
      login: async (password: string) => {
        const { valid } = await api.settings.verifyAdmin(password);
        if (valid) set({ isAdmin: true });
        return valid;
      },
      setup: async (password: string) => {
        try {
          await api.settings.setupAdmin(password);
          set({ isAdmin: true });
          return true;
        } catch {
          return false;
        }
      },
      logout: () => set({ isAdmin: false }),
    }),
    { name: 'label-print-auth' }
  )
);
