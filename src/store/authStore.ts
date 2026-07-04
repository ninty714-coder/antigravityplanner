import { create } from 'zustand';
import { api, ApiError } from '../lib/api';
import { usePlannerStore } from './plannerStore';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatarColor: string;
  createdAt: string;
}

type AuthStatus = 'checking' | 'authenticated' | 'unauthenticated';

interface AuthState {
  user: AuthUser | null;
  status: AuthStatus;

  init: () => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  login: (email: string, password: string, rememberMe: boolean) => Promise<void>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<string>;
  resetPassword: (token: string, password: string) => Promise<string>;
  updateProfile: (data: { name?: string; avatarColor?: string }) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  deleteAccount: (password: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  status: 'checking',

  init: async () => {
    try {
      const res = await api.get('/api/auth/me');
      set({ user: res.user, status: 'authenticated' });
    } catch {
      set({ user: null, status: 'unauthenticated' });
    }
  },

  register: async (email, password, name) => {
    const res = await api.post('/api/auth/register', { email, password, name });
    set({ user: res.user, status: 'authenticated' });
  },

  login: async (email, password, rememberMe) => {
    const res = await api.post('/api/auth/login', { email, password, rememberMe });
    set({ user: res.user, status: 'authenticated' });
  },

  logout: async () => {
    try {
      await api.post('/api/auth/logout');
    } catch {
      // Même en cas d'échec réseau, on déconnecte localement pour ne jamais
      // bloquer l'utilisateur dans un état incohérent.
    }
    await usePlannerStore.getState().resetLocal();
    set({ user: null, status: 'unauthenticated' });
  },

  forgotPassword: async (email) => {
    const res = await api.post('/api/auth/forgot-password', { email });
    return res.message as string;
  },

  resetPassword: async (token, password) => {
    const res = await api.post('/api/auth/reset-password', { token, password });
    return res.message as string;
  },

  updateProfile: async (data) => {
    const res = await api.patch('/api/account/profile', data);
    set({ user: res.user });
  },

  changePassword: async (currentPassword, newPassword) => {
    await api.post('/api/account/change-password', { currentPassword, newPassword });
    // Le serveur révoque toutes les sessions actives par sécurité : on aligne l'état local.
    await usePlannerStore.getState().resetLocal();
    set({ user: null, status: 'unauthenticated' });
  },

  deleteAccount: async (password) => {
    await api.delete('/api/account', { password });
    await usePlannerStore.getState().resetLocal();
    set({ user: null, status: 'unauthenticated' });
  },
}));

// Petit utilitaire partagé par les pages pour transformer une ApiError en message affichable.
export function authErrorMessage(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  return 'Impossible de contacter le serveur. Vérifiez votre connexion.';
}
