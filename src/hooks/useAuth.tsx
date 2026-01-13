import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAccountActive: boolean;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithPhone: (phone: string) => Promise<{ error: Error | null }>;
  verifyPhoneOtp: (phone: string, token: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signInWithApple: () => Promise<{ error: Error | null }>;
  resetPasswordForEmail: (email: string) => Promise<{ error: Error | null }>;
  resetPasswordForPhone: (phone: string) => Promise<{ error: Error | null }>;
  verifyResetOtp: (emailOrPhone: string, token: string, type: 'email' | 'phone') => Promise<{ error: Error | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: Error | null }>;
  verifyOtpAndResetPassword: (emailOrPhone: string, token: string, newPassword: string, type: 'email' | 'phone') => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAccountActive, setIsAccountActive] = useState(true);

  // Check if user account is active
  const checkAccountStatus = useCallback(async (userId: string) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('is_active')
        .eq('user_id', userId)
        .single();
      
      if (error) {
        // If profile doesn't exist yet, treat as active (new user)
        if (error.code === 'PGRST116') {
          setIsAccountActive(true);
          return true;
        }
        console.error('Error checking account status:', error);
        return true;
      }
      
      const isActive = profile?.is_active !== false;
      setIsAccountActive(isActive);
      
      if (!isActive) {
        // Account is deactivated - sign out immediately
        toast.error('Your account has been deactivated. Please contact support.');
        await supabase.auth.signOut();
        setUser(null);
        setSession(null);
        return false;
      }
      
      return true;
    } catch (err) {
      console.error('Error in checkAccountStatus:', err);
      return true;
    }
  }, []);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Check account status when user signs in
          // Use setTimeout to avoid potential Supabase deadlock
          setTimeout(() => {
            checkAccountStatus(session.user.id);
          }, 0);
        } else {
          setIsAccountActive(true);
        }
        
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await checkAccountStatus(session.user.id);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [checkAccountStatus]);

  // Set up realtime listener for profile changes (account deactivation)
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('profile-status')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `user_id=eq.${user.id}`
        },
        async (payload) => {
          // Check if account was deactivated
          if (payload.new && payload.new.is_active === false) {
            toast.error('Your account has been deactivated. Please contact support.');
            setIsAccountActive(false);
            await supabase.auth.signOut();
            setUser(null);
            setSession(null);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const signUp = async (email: string, password: string, displayName?: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          display_name: displayName || email.split('@')[0],
          username: email.split('@')[0],
        }
      }
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signInWithPhone = async (phone: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      phone,
    });
    return { error };
  };

  const verifyPhoneOtp = async (phone: string, token: string) => {
    const { error } = await supabase.auth.verifyOtp({
      phone,
      token,
      type: 'sms',
    });
    return { error };
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,
      }
    });
    return { error };
  };

  const signInWithApple = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: {
        redirectTo: `${window.location.origin}/`,
      }
    });
    return { error };
  };

  const resetPasswordForEmail = async (email: string) => {
    // Generate a 6-digit OTP for password recovery
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store OTP temporarily (it will be verified later)
    // We'll use Supabase's built-in recovery flow
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth?mode=reset`,
    });
    
    if (!error) {
      // Also send a custom OTP email via our edge function
      try {
        await supabase.functions.invoke('send-otp-email', {
          body: { to: email, otp, type: 'recovery' },
        });
      } catch (e) {
        console.error('Failed to send custom OTP email:', e);
      }
    }
    
    return { error };
  };

  const resetPasswordForPhone = async (phone: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      phone,
    });
    return { error };
  };

  const verifyResetOtp = async (emailOrPhone: string, token: string, type: 'email' | 'phone') => {
    const { data, error } = await supabase.auth.verifyOtp(
      type === 'phone'
        ? { phone: emailOrPhone, token, type: 'sms' }
        : { email: emailOrPhone, token, type: 'email' }
    );

    if (error) return { error };

    // Ensure the session is persisted for the next step (update password).
    if (data?.session?.access_token && data?.session?.refresh_token) {
      const { error: setSessionError } = await supabase.auth.setSession({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      });
      if (setSessionError) return { error: setSessionError };
    }

    return { error: null };
  };

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    return { error };
  };

  const verifyOtpAndResetPassword = async (emailOrPhone: string, token: string, newPassword: string, type: 'email' | 'phone') => {
    const { error: verifyError } = await verifyResetOtp(emailOrPhone, token, type);
    if (verifyError) return { error: verifyError };

    const { error } = await updatePassword(newPassword);
    return { error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUser(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      loading,
      isAccountActive,
      signUp, 
      signIn, 
      signInWithPhone,
      verifyPhoneOtp,
      signInWithGoogle, 
      signInWithApple,
      resetPasswordForEmail,
      resetPasswordForPhone,
      verifyResetOtp,
      updatePassword,
      verifyOtpAndResetPassword,
      signOut 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
