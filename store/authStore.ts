import { create } from 'zustand';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types';

interface AuthStore {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  supabase: SupabaseClient | null;
  initialize: (supabaseUrl: string, supabaseAnonKey: string) => void;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name?: string, role?: 'PLAYER' | 'VENUE_OWNER') => Promise<void>;
  signOut: () => Promise<void>;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  loadSession: () => Promise<void>;
  /** Refresh the access token using the refresh token. Call before sensitive API calls. */
  refreshSession: () => Promise<boolean>;
}

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

export const useAuthStore = create<AuthStore>((set, get) => {
  let supabaseClient: SupabaseClient | null = null;

  if (supabaseUrl && supabaseAnonKey) {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
      },
    });
  }

  return {
    user: null,
    token: null,
    isLoading: true,
    supabase: supabaseClient,

    initialize: (url: string, key: string) => {
      const client = createClient(url, key);
      supabaseClient = client;
      set({ supabase: client });
    },

    signIn: async (email: string, password: string) => {
      const { supabase } = get();
      if (!supabase) throw new Error('Supabase not initialized');

      set({ isLoading: true });
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        if (data.session?.access_token && data.user) {
          const user: User = {
            id: data.user.id,
            email: data.user.email || '',
            name: data.user.user_metadata?.name,
            role: data.user.user_metadata?.role || 'PLAYER',
          };

          set({
            user,
            token: data.session.access_token,
            isLoading: false,
          });
        }
      } catch (error) {
        set({ isLoading: false });
        throw error;
      }
    },

    signUp: async (email: string, password: string, name?: string, role: 'PLAYER' | 'VENUE_OWNER' = 'PLAYER') => {
      const { supabase } = get();
      if (!supabase) throw new Error('Supabase not initialized');

      set({ isLoading: true });
      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name,
              role: role,
            },
          },
        });

        if (error) throw error;

        if (data.session?.access_token && data.user) {
          const user: User = {
            id: data.user.id,
            email: data.user.email || '',
            name: data.user.user_metadata?.name,
            role: data.user.user_metadata?.role || role,
          };

          set({
            user,
            token: data.session.access_token,
            isLoading: false,
          });
        }
      } catch (error) {
        set({ isLoading: false });
        throw error;
      }
    },

    signOut: async () => {
      const { supabase } = get();
      if (supabase) {
        await supabase.auth.signOut();
      }
      set({ user: null, token: null, isLoading: false });
    },

    setUser: (user: User | null) => set({ user }),
    setToken: (token: string | null) => set({ token }),

    loadSession: async () => {
      const { supabase } = get();
      if (!supabase) {
        set({ isLoading: false });
        return;
      }

      set({ isLoading: true });
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) throw error;

        if (session?.access_token && session.user) {
          const user: User = {
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.user_metadata?.name,
            role: session.user.user_metadata?.role || 'PLAYER',
          };

          set({
            user,
            token: session.access_token,
            isLoading: false,
          });
        } else {
          set({ isLoading: false });
        }
      } catch (error) {
        set({ isLoading: false });
      }
    },

    refreshSession: async () => {
      const { supabase } = get();
      if (!supabase) return false;

      try {
        const { data: { session }, error } = await supabase.auth.refreshSession();

        if (error || !session?.access_token || !session.user) {
          set({ user: null, token: null });
          return false;
        }

        const user: User = {
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.name,
          role: session.user.user_metadata?.role || 'PLAYER',
        };

        set({
          user,
          token: session.access_token,
        });
        return true;
      } catch {
        set({ user: null, token: null });
        return false;
      }
    },
  };
});




