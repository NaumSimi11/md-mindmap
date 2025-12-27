/**
 * Login Page
 * Premium 2025 design with glassmorphism and fluid animations
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2, Mail, Lock, Sparkles, ArrowRight } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

export default function Login() {
  const navigate = useNavigate();
  const { login, isLoading } = useAuth();
  const { toast } = useToast();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('🚀 Login.handleSubmit() called');
    
    try {
      console.log('📞 Calling login()...');
      // Trim email to prevent accidental spaces
      await login({ email: email.trim(), password });
      
      console.log('✅ login() completed, showing toast...');
      toast({
        title: "✨ Welcome back!",
        description: "You've successfully logged in.",
      });
      
      // CRITICAL: Wait for React to finish ALL state updates and WorkspaceContext to initialize
      console.log('⏳ Waiting for WorkspaceContext to initialize (300ms)...');
      await new Promise(resolve => setTimeout(resolve, 300));
      
      console.log('🧭 Navigating to /workspace...');
      navigate('/workspace', { replace: true }); // Use replace to avoid back-button issues
      console.log('✅ Navigation called');
    } catch (error: any) {
      console.error('❌ Login error caught:', error);
      
      // Extract error message from various error formats
      let errorMessage = "Invalid email or password. Please try again.";
      
      if (error.message) {
        errorMessage = error.message;
      } else if (error.detail) {
        errorMessage = error.detail;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      console.error('❌ Showing error toast:', errorMessage);
      
      toast({
        variant: "destructive",
        title: "❌ Login Failed",
        description: errorMessage,
        duration: 5000, // Show for 5 seconds
      });
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/20">
      {/* Animated Background Gradients */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-1/2 -left-1/4 w-96 h-96 bg-gradient-to-br from-blue-400/20 to-indigo-500/20 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute -bottom-1/2 -right-1/4 w-96 h-96 bg-gradient-to-br from-purple-400/20 to-pink-500/20 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [90, 0, 90],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md px-6"
      >
        {/* Glass Card */}
        <div className="relative backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 rounded-3xl shadow-2xl border border-white/20 dark:border-slate-700/50 overflow-hidden">
          {/* Gradient Border Effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 opacity-50" />
          
          {/* Content */}
          <div className="relative p-8 sm:p-10">
            {/* Logo & Header */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-center mb-8"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/30 mb-4">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent mb-2">
                Welcome Back
              </h1>
              <p className="text-slate-600 dark:text-slate-400 text-sm">
                Enter your credentials to continue
              </p>
            </motion.div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email Field */}
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <Label 
                  htmlFor="email" 
                  className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block"
                >
                  Email Address
                </Label>
                <div className="relative group">
                  <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors duration-200 ${
                    focusedField === 'email' 
                      ? 'text-blue-500' 
                      : 'text-slate-400 dark:text-slate-500'
                  }`} />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="you@example.com"
                    required
                    data-testid="login-email-input"
                    className="pl-11 h-12 bg-white/50 dark:bg-slate-800/50 border-slate-200/50 dark:border-slate-700/50 rounded-xl
                      focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200
                      hover:bg-white dark:hover:bg-slate-800"
                  />
                  <motion.div
                    className="absolute inset-0 rounded-xl border-2 border-blue-500 pointer-events-none"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ 
                      opacity: focusedField === 'email' ? 1 : 0,
                      scale: focusedField === 'email' ? 1 : 0.95,
                    }}
                    transition={{ duration: 0.2 }}
                  />
                </div>
              </motion.div>

              {/* Password Field */}
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <div className="flex items-center justify-between mb-2">
                  <Label 
                    htmlFor="password" 
                    className="text-sm font-medium text-slate-700 dark:text-slate-300"
                  >
                    Password
                  </Label>
                  <Link 
                    to="/forgot-password"
                    className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative group">
                  <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors duration-200 ${
                    focusedField === 'password' 
                      ? 'text-blue-500' 
                      : 'text-slate-400 dark:text-slate-500'
                  }`} />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="••••••••"
                    required
                    data-testid="login-password-input"
                    className="pl-11 h-12 bg-white/50 dark:bg-slate-800/50 border-slate-200/50 dark:border-slate-700/50 rounded-xl
                      focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200
                      hover:bg-white dark:hover:bg-slate-800"
                  />
                  <motion.div
                    className="absolute inset-0 rounded-xl border-2 border-blue-500 pointer-events-none"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ 
                      opacity: focusedField === 'password' ? 1 : 0,
                      scale: focusedField === 'password' ? 1 : 0.95,
                    }}
                    transition={{ duration: 0.2 }}
                  />
                </div>
              </motion.div>

              {/* Submit Button */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="pt-2"
              >
                <Button
                  type="submit"
                  disabled={isLoading}
                  data-testid="login-submit-button"
                  className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700
                    text-white rounded-xl font-medium shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40
                    transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]
                    disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none group"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign In
                      <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-200" />
                    </>
                  )}
                </Button>
              </motion.div>
            </form>

            {/* Divider */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="relative my-8"
            >
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200 dark:border-slate-700/50" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white/70 dark:bg-slate-900/70 px-3 text-slate-500 dark:text-slate-400">
                  New here?
                </span>
              </div>
            </motion.div>

            {/* Sign Up Link */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-center"
            >
              <Link to="/signup">
                <Button
                  variant="outline"
                  className="w-full h-12 rounded-xl border-2 border-slate-200 dark:border-slate-700/50
                    hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all duration-200
                    hover:border-blue-300 dark:hover:border-blue-700 group"
                >
                  <span className="text-slate-700 dark:text-slate-300 font-medium">
                    Create an Account
                  </span>
                  <Sparkles className="w-4 h-4 ml-2 text-blue-500 group-hover:rotate-12 transition-transform duration-200" />
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-center text-xs text-slate-500 dark:text-slate-400 mt-6"
        >
          By continuing, you agree to our{' '}
          <Link to="/terms" className="text-blue-600 dark:text-blue-400 hover:underline">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link to="/privacy" className="text-blue-600 dark:text-blue-400 hover:underline">
            Privacy Policy
          </Link>
        </motion.p>
      </motion.div>
    </div>
  );
}

