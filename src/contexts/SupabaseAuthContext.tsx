import React, { createContext, useContext, useState, useEffect } from 'react';
import { signInAdmin, signOutAdmin, getCurrentAdmin, resetPassword, updatePassword, onAuthStateChange, AdminUser } from '../lib/supabaseAuth';

interface SupabaseAuthContextType {
  user: AdminUser | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<{ success: boolean; error?: string }>;
  resetUserPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  updateUserPassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
  isAdmin: () => boolean;
}

const SupabaseAuthContext = createContext<SupabaseAuthContextType | undefined>(undefined);

export const useSupabaseAuth = () => {
  const context = useContext(SupabaseAuthContext);
  if (!context) {
    throw new Error('useSupabaseAuth must be used within a SupabaseAuthProvider');
  }
  return context;
};

export const SupabaseAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session on mount
    const checkUser = async () => {
      try {
        const { user: currentUser } = await getCurrentAdmin();
        setUser(currentUser);
      } catch (error) {
        console.error('Error checking current user:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkUser();

    // Listen for auth state changes
    const { data: { subscription } } = onAuthStateChange((user) => {
      setUser(user);
      setIsLoading(false);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const result = await signInAdmin(email, password);
      if (result.success && result.user) {
        setUser(result.user);
      }
      return result;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    try {
      const result = await signOutAdmin();
      if (result.success) {
        setUser(null);
      }
      return result;
    } finally {
      setIsLoading(false);
    }
  };

  const resetUserPassword = async (email: string) => {
    return await resetPassword(email);
  };

  const updateUserPassword = async (newPassword: string) => {
    return await updatePassword(newPassword);
  };

  const isAdmin = () => {
    return user?.role === 'admin';
  };

  return (
    <SupabaseAuthContext.Provider
      value={{
        user,
        isLoading,
        signIn,
        signOut,
        resetUserPassword,
        updateUserPassword,
        isAdmin,
      }}
    >
      {children}
    </SupabaseAuthContext.Provider>
  );
};