import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { useSupabaseAuth } from '../contexts/SupabaseAuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const AdminResetPassword: React.FC = () => {
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const { supabase, updateUserPassword } = useSupabaseAuth(); // Make sure supabase client is available
  const navigate = useNavigate();
  const [isPasswordReset, setIsPasswordReset] = useState(false);

  useEffect(() => {
    // This is the key fix. Supabase automatically handles the URL hash
    // and sets the user session when the component loads.
    // We just need to check if a session exists.
    const checkSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (session) {
        setIsPasswordReset(true);
      } else if (error) {
        toast.error('Invalid or expired reset link. Please request a new password reset.');
        navigate('/admin/forgot-password');
      } else {
        // If no session and no error, it means the URL is wrong
        // or the user isn't coming from a reset link.
        toast.error('You need to use a password reset link to access this page.');
        navigate('/admin/forgot-password');
      }
    };

    checkSession();
  }, [supabase, navigate]);

  // If we haven't confirmed a password reset session, show loading or redirect.
  if (!isPasswordReset) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center py-12 px-4">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white">Validating reset link...</p>
        </div>
      </div>
    );
  }

  const validatePassword = (password) => {
    // ... (Your existing validation logic)
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    const passwordError = validatePassword(formData.password);
    if (passwordError) {
      toast.error(passwordError);
      return;
    }

    setIsLoading(true);

    try {
      // Use updateUserPassword, which should internally call supabase.auth.updateUser()
      // The session is already set by the getSession() call in useEffect.
      const { data, error } = await supabase.auth.updateUser({ password: formData.password });

      if (error) {
        toast.error(error.message || 'Failed to update password');
      } else {
        setIsSuccess(true);
        toast.success('Password updated successfully!');
        setTimeout(() => navigate('/admin'), 3000);
      }
    } catch (error) {
      toast.error(error.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    // ... (Your existing success component)
  }

  return (
    // ... (Your existing form component)
  );
};

export default AdminResetPassword;