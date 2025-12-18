import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Mail, Lock, User, Phone, ArrowLeft } from "lucide-react";
import { z } from "zod";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

const emailSchema = z.string().email("Please enter a valid email");
const passwordSchema = z.string().min(6, "Password must be at least 6 characters");
const phoneSchema = z.string().min(10, "Please enter a valid phone number");

type AuthMode = 'login' | 'signup' | 'phone' | 'forgot' | 'otp' | 'reset';

const Auth = () => {
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resetType, setResetType] = useState<'email' | 'phone'>('email');
  const [errors, setErrors] = useState<{ email?: string; password?: string; phone?: string }>({});
  
  const { 
    user, 
    signIn, 
    signUp, 
    signInWithPhone, 
    verifyPhoneOtp, 
    signInWithGoogle, 
    signInWithApple,
    resetPasswordForEmail,
    resetPasswordForPhone,
    verifyOtpAndResetPassword
  } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  useEffect(() => {
    if (searchParams.get('mode') === 'reset') {
      setMode('reset');
    }
  }, [searchParams]);

  const validateForm = () => {
    const newErrors: { email?: string; password?: string; phone?: string } = {};
    
    if (mode === 'login' || mode === 'signup' || mode === 'forgot') {
      if (resetType === 'email' || mode !== 'forgot') {
        const emailResult = emailSchema.safeParse(email);
        if (!emailResult.success) {
          newErrors.email = emailResult.error.errors[0].message;
        }
      }
    }
    
    if (mode === 'login' || mode === 'signup' || mode === 'reset') {
      const passwordResult = passwordSchema.safeParse(mode === 'reset' ? newPassword : password);
      if (!passwordResult.success) {
        newErrors.password = passwordResult.error.errors[0].message;
      }
    }

    if (mode === 'phone' || (mode === 'forgot' && resetType === 'phone')) {
      const phoneResult = phoneSchema.safeParse(phone);
      if (!phoneResult.success) {
        newErrors.phone = phoneResult.error.errors[0].message;
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      if (mode === 'login') {
        const { error } = await signIn(email, password);
        if (error) {
          toast({
            title: "Login failed",
            description: error.message.includes("Invalid login credentials") 
              ? "Invalid email or password. Please try again."
              : error.message,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Welcome back!",
            description: "You have successfully logged in.",
          });
        }
      } else if (mode === 'signup') {
        const { error } = await signUp(email, password, displayName);
        if (error) {
          toast({
            title: "Sign up failed",
            description: error.message.includes("User already registered")
              ? "This email is already registered. Please log in instead."
              : error.message,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Account created!",
            description: "Welcome to Fitkits. Start your fitness journey!",
          });
        }
      } else if (mode === 'phone') {
        const { error } = await signInWithPhone(phone);
        if (error) {
          toast({
            title: "Failed to send OTP",
            description: error.message,
            variant: "destructive",
          });
        } else {
          toast({
            title: "OTP Sent!",
            description: "Please check your phone for the verification code.",
          });
          setMode('otp');
        }
      } else if (mode === 'forgot') {
        if (resetType === 'email') {
          const { error } = await resetPasswordForEmail(email);
          if (error) {
            toast({
              title: "Failed to send reset link",
              description: error.message,
              variant: "destructive",
            });
          } else {
            toast({
              title: "Reset link sent!",
              description: "Please check your email for the password reset link.",
            });
          }
        } else {
          const { error } = await resetPasswordForPhone(phone);
          if (error) {
            toast({
              title: "Failed to send OTP",
              description: error.message,
              variant: "destructive",
            });
          } else {
            toast({
              title: "OTP Sent!",
              description: "Please check your phone for the verification code.",
            });
            setMode('otp');
          }
        }
      } else if (mode === 'otp') {
        const { error } = await verifyPhoneOtp(phone, otp);
        if (error) {
          toast({
            title: "Verification failed",
            description: error.message,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Success!",
            description: "Phone verified successfully.",
          });
        }
      } else if (mode === 'reset') {
        const { error } = await verifyOtpAndResetPassword(
          resetType === 'email' ? email : phone,
          otp,
          newPassword,
          resetType
        );
        if (error) {
          toast({
            title: "Failed to reset password",
            description: error.message,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Password reset!",
            description: "You can now log in with your new password.",
          });
          setMode('login');
        }
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'apple') => {
    setIsSubmitting(true);
    try {
      const { error } = provider === 'google' 
        ? await signInWithGoogle() 
        : await signInWithApple();
      
      if (error) {
        toast({
          title: `${provider === 'google' ? 'Google' : 'Apple'} login failed`,
          description: error.message,
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderContent = () => {
    if (mode === 'otp') {
      return (
        <div className="space-y-6">
          <button 
            onClick={() => setMode('phone')} 
            className="flex items-center gap-2 text-auth-amber hover:text-auth-orange transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          
          <div className="text-center">
            <h2 className="text-xl font-semibold text-foreground mb-2">Enter Verification Code</h2>
            <p className="text-text-secondary text-sm">We sent a code to {phone}</p>
          </div>
          
          <div className="flex justify-center">
            <InputOTP maxLength={6} value={otp} onChange={setOtp}>
              <InputOTPGroup>
                <InputOTPSlot index={0} className="border-auth-orange/30 focus:border-auth-amber" />
                <InputOTPSlot index={1} className="border-auth-orange/30 focus:border-auth-amber" />
                <InputOTPSlot index={2} className="border-auth-orange/30 focus:border-auth-amber" />
                <InputOTPSlot index={3} className="border-auth-orange/30 focus:border-auth-amber" />
                <InputOTPSlot index={4} className="border-auth-orange/30 focus:border-auth-amber" />
                <InputOTPSlot index={5} className="border-auth-orange/30 focus:border-auth-amber" />
              </InputOTPGroup>
            </InputOTP>
          </div>
          
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || otp.length < 6}
            className="w-full h-12 rounded-xl bg-auth-amber hover:bg-auth-orange text-white font-semibold"
          >
            {isSubmitting ? "Verifying..." : "Verify Code"}
          </Button>
        </div>
      );
    }

    if (mode === 'forgot') {
      return (
        <div className="space-y-6">
          <button 
            onClick={() => setMode('login')} 
            className="flex items-center gap-2 text-auth-amber hover:text-auth-orange transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Login
          </button>
          
          <div className="text-center">
            <h2 className="text-xl font-semibold text-foreground mb-2">Reset Password</h2>
            <p className="text-text-secondary text-sm">Choose how you'd like to reset your password</p>
          </div>
          
          {/* Reset Type Toggle */}
          <div className="flex bg-auth-coral/30 rounded-xl p-1">
            <button
              onClick={() => setResetType('email')}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                resetType === 'email' 
                  ? "bg-card text-foreground shadow-sm" 
                  : "text-text-secondary hover:text-foreground"
              }`}
            >
              Email
            </button>
            <button
              onClick={() => setResetType('phone')}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                resetType === 'phone' 
                  ? "bg-card text-foreground shadow-sm" 
                  : "text-text-secondary hover:text-foreground"
              }`}
            >
              Phone
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {resetType === 'email' ? (
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-auth-orange" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-12 rounded-xl border-auth-cream/50 bg-background focus:border-auth-amber"
                  />
                </div>
                {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-foreground">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-auth-orange" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+1 234 567 8900"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="pl-10 h-12 rounded-xl border-auth-cream/50 bg-background focus:border-auth-amber"
                  />
                </div>
                {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
              </div>
            )}
            
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 rounded-xl bg-auth-amber hover:bg-auth-orange text-white font-semibold"
            >
              {isSubmitting ? "Sending..." : resetType === 'email' ? "Send Reset Link" : "Send OTP"}
            </Button>
          </form>
        </div>
      );
    }

    if (mode === 'reset') {
      return (
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-foreground mb-2">Create New Password</h2>
            <p className="text-text-secondary text-sm">Enter your new password below</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-foreground">New Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-auth-orange" />
                <Input
                  id="newPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="pl-10 pr-10 h-12 rounded-xl border-auth-cream/50 bg-background focus:border-auth-amber"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
            </div>
            
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 rounded-xl bg-auth-amber hover:bg-auth-orange text-white font-semibold"
            >
              {isSubmitting ? "Resetting..." : "Reset Password"}
            </Button>
          </form>
        </div>
      );
    }

    if (mode === 'phone') {
      return (
        <div className="space-y-6">
          <button 
            onClick={() => setMode('login')} 
            className="flex items-center gap-2 text-auth-amber hover:text-auth-orange transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          
          <div className="text-center">
            <h2 className="text-xl font-semibold text-foreground mb-2">Sign in with Phone</h2>
            <p className="text-text-secondary text-sm">We'll send you a verification code</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-foreground">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-auth-orange" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+1 234 567 8900"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="pl-10 h-12 rounded-xl border-auth-cream/50 bg-background focus:border-auth-amber"
                />
              </div>
              {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
            </div>
            
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 rounded-xl bg-auth-amber hover:bg-auth-orange text-white font-semibold"
            >
              {isSubmitting ? "Sending..." : "Send OTP"}
            </Button>
          </form>
        </div>
      );
    }

    // Login / Signup modes
    return (
      <>
        {/* Toggle */}
        <div className="flex bg-auth-coral/30 rounded-xl p-1 mb-6">
          <button
            onClick={() => setMode('login')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
              mode === 'login' 
                ? "bg-card text-foreground shadow-sm" 
                : "text-text-secondary hover:text-foreground"
            }`}
          >
            Log In
          </button>
          <button
            onClick={() => setMode('signup')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
              mode === 'signup' 
                ? "bg-card text-foreground shadow-sm" 
                : "text-text-secondary hover:text-foreground"
            }`}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Display Name (Sign Up only) */}
          {mode === 'signup' && (
            <div className="space-y-2">
              <Label htmlFor="displayName" className="text-foreground">Display Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-auth-orange" />
                <Input
                  id="displayName"
                  type="text"
                  placeholder="Your name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="pl-10 h-12 rounded-xl border-auth-cream/50 bg-background focus:border-auth-amber"
                />
              </div>
            </div>
          )}

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-foreground">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-auth-orange" />
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors({ ...errors, email: undefined });
                }}
                className={`pl-10 h-12 rounded-xl border-auth-cream/50 bg-background focus:border-auth-amber ${
                  errors.email ? "border-destructive" : ""
                }`}
              />
            </div>
            {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password" className="text-foreground">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-auth-orange" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors({ ...errors, password: undefined });
                }}
                className={`pl-10 pr-10 h-12 rounded-xl border-auth-cream/50 bg-background focus:border-auth-amber ${
                  errors.password ? "border-destructive" : ""
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-foreground"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-12 rounded-xl bg-auth-amber hover:bg-auth-orange text-white font-semibold mt-2"
          >
            {isSubmitting ? "Please wait..." : mode === 'login' ? "Log In" : "Create Account"}
          </Button>
        </form>

        {/* Forgot Password (Login only) */}
        {mode === 'login' && (
          <p className="text-center text-sm text-text-secondary mt-4">
            Forgot your password?{" "}
            <button 
              onClick={() => setMode('forgot')}
              className="text-auth-amber font-medium hover:underline"
            >
              Reset it
            </button>
          </p>
        )}

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-auth-cream/50" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-text-tertiary">Or continue with</span>
          </div>
        </div>

        {/* Social & Alternative Login Options */}
        <div className="space-y-3">
          {/* Phone Login */}
          <Button
            type="button"
            variant="outline"
            onClick={() => setMode('phone')}
            className="w-full h-12 rounded-xl border-auth-cream/50 hover:bg-auth-coral/20 hover:border-auth-orange/50"
          >
            <Phone className="w-5 h-5 mr-2 text-auth-orange" />
            Continue with Phone
          </Button>

          {/* Google Login */}
          <Button
            type="button"
            variant="outline"
            onClick={() => handleSocialLogin('google')}
            disabled={isSubmitting}
            className="w-full h-12 rounded-xl border-auth-cream/50 hover:bg-auth-coral/20 hover:border-auth-orange/50"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </Button>

          {/* Apple Login */}
          <Button
            type="button"
            variant="outline"
            onClick={() => handleSocialLogin('apple')}
            disabled={isSubmitting}
            className="w-full h-12 rounded-xl border-auth-cream/50 hover:bg-auth-coral/20 hover:border-auth-orange/50"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
            </svg>
            Continue with Apple
          </Button>
        </div>
      </>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-auth-cream/30 via-background to-auth-coral/20 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-auth-amber to-auth-orange rounded-full mx-auto mb-4 flex items-center justify-center shadow-lg">
            <span className="text-white text-2xl font-bold tracking-tight">FK</span>
          </div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Fitkits</h1>
          <p className="text-text-secondary mt-2 text-sm">Your complete fitness companion — find venues, join activities, build your community</p>
        </div>

        {/* Auth Card */}
        <div className="bg-card rounded-3xl shadow-soft p-6 border border-auth-cream/30">
          {renderContent()}
        </div>

        {/* Terms */}
        <p className="text-center text-xs text-text-tertiary mt-6">
          By continuing, you agree to our{" "}
          <span className="text-auth-amber hover:underline cursor-pointer">Terms of Service</span> and{" "}
          <span className="text-auth-amber hover:underline cursor-pointer">Privacy Policy</span>
        </p>
      </div>
    </div>
  );
};

export default Auth;