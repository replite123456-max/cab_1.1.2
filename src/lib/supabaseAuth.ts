import { supabase } from './supabase';

export interface AdminUser {
  id: string;
  email: string;
  role: string;
  created_at: string;
}

export interface AuthResponse {
  success: boolean;
  user?: AdminUser;
  error?: string;
}

// Sign in admin user
export const signInAdmin = async (email: string, password: string): Promise<AuthResponse> => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    if (!data.user) {
      return { success: false, error: 'No user data returned' };
    }

    // Check if user is admin
    const { data: adminData, error: adminError } = await supabase
      .from('admin_users')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (adminError || !adminData) {
      // Sign out the user since they're not an admin
      await supabase.auth.signOut();
      return { success: false, error: 'Access denied. Admin privileges required.' };
    }

    return {
      success: true,
      user: {
        id: adminData.id,
        email: adminData.email,
        role: adminData.role,
        created_at: adminData.created_at,
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message || 'Authentication failed' };
  }
};

// Sign out admin user
export const signOutAdmin = async (): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Sign out failed' };
  }
};

// Get current admin user
export const getCurrentAdmin = async (): Promise<{ user: AdminUser | null; error?: string }> => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return { user: null, error: error?.message || 'No user found' };
    }

    // Check if user is admin
    const { data: adminData, error: adminError } = await supabase
      .from('admin_users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (adminError || !adminData) {
      return { user: null, error: 'User is not an admin' };
    }

    return {
      user: {
        id: adminData.id,
        email: adminData.email,
        role: adminData.role,
        created_at: adminData.created_at,
      },
    };
  } catch (error: any) {
    return { user: null, error: error.message || 'Failed to get current user' };
  }
};

// Reset password
export const resetPassword = async (email: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/admin/reset-password`
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Password reset failed' };
  }
};

// Update password
export const updatePassword = async (newPassword: string, accessToken?: string): Promise<{ success: boolean; error?: string }> => {
  try {
    // If access token is provided (from reset link), set the session first
    if (accessToken) {
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: '', // Not needed for password reset
      });
      
      if (sessionError) {
        return { success: false, error: sessionError.message };
      }
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Password update failed' };
  }
};

// Listen to auth state changes
export const onAuthStateChange = (callback: (user: AdminUser | null) => void) => {
  return supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN' && session?.user) {
      const { user } = await getCurrentAdmin();
      callback(user);
    } else if (event === 'SIGNED_OUT') {
      callback(null);
    }
  });
};