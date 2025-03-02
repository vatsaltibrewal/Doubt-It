'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { supabaseClient } from '@/lib/supabase';
import { Session, User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

type AuthContextType = {
  user: User | null;
  session: Session | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Initialize auth state on mount
  useEffect(() => {
    const setupAuth = async () => {
      console.log("Setting up auth...");
      try {
        // Get initial session
        const { data, error } = await supabaseClient.auth.getSession();
        
        if (error) {
          throw error;
        }
        
        console.log("Initial session:", data.session ? "exists" : "none");
        setSession(data.session);
        setUser(data.session?.user ?? null);
        
        // Listen for auth changes
        const { data: { subscription } } = supabaseClient.auth.onAuthStateChange(
          (event, updatedSession) => {
            console.log("Auth state changed:", event);
            setSession(updatedSession);
            setUser(updatedSession?.user ?? null);
          }
        );

        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error("Auth setup error:", error);
      } finally {
        setLoading(false);
      }
    };

    setupAuth();
  }, []);

  const signIn = async (email: string, password: string) => {
    console.log("Signing in...", email);
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      console.error("Sign in error:", error);
      throw error;
    }
    
    console.log("Sign in successful, user:", data.user?.email);
    setSession(data.session);
    setUser(data.user);
  };

  const signOut = async () => {
    const { error } = await supabaseClient.auth.signOut();
    if (error) console.error("Sign out error:", error);
    
    setSession(null);
    setUser(null);
    router.push('/login');
  };

  const value = {
    user,
    session,
    signIn,
    signOut,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};