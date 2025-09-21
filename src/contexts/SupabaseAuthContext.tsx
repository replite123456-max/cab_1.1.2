// src/lib/supabaseAuth.ts

import { supabase } from './supabase'; // Your Supabase client instance
import { AdminUser } from './types'; // Assuming you have a type definition

// --- Sign In ---
export const signInAdmin = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, user: data.user };
  } catch (error: any) {
    return { success: false, error: error.message || 'An unexpected error occurred.' };
  }
};

// --- Sign Out ---
export const signOutAdmin = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'An unexpected error occurred.' };
  }
};

// --- Get Current User ---
export const getCurrentAdmin = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return { user: user as AdminUser | null };
};

// --- Password Reset Request (FIXED) ---
export const resetPassword = async (email: string) => {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      // ✅ This is the crucial fix.
      redirectTo: 'http://localhost:3000/admin/reset-password',
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'An unexpected error occurred.' };
  }
};

// --- Password Update ---
export const updatePassword = async (newPassword: string) => {
  try {
    const { data, error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, user: data.user };
  } catch (error: any) {
    return { success: false, error: error.message || 'An unexpected error occurred.' };
  }
};

// --- Auth State Change Listener ---
export const onAuthStateChange = (callback: (user: AdminUser | null) => void) => {
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(session?.user as AdminUser | null);
  });
};