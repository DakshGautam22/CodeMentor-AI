import React, { useState, useEffect } from "react";
import { useAuthStore } from "../store/authStore";
import { useUiStore } from "../store/uiStore";
import { Terminal, Mail, Lock, User, ArrowRight } from "lucide-react";

export const Auth: React.FC = () => {
  const { login, register, isLoading, error, clearError } = useAuthStore();
  const { showToast } = useUiStore();

  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    clearError();
  }, [isLogin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      showToast("Please fill in all credentials", "error");
      return;
    }
    if (!isLogin && !name.trim()) {
      showToast("Please provide your name", "error");
      return;
    }

    if (isLogin) {
      const success = await login({ email, password });
      if (success) showToast("Welcome back!", "success");
    } else {
      const success = await register({ name, email, password });
      if (success) showToast("Registration successful! Welcome.", "success");
    }
  };

  return (
    <div className="min-h-screen bg-dark-950 flex flex-col justify-center items-center p-4 relative overflow-hidden bg-grid-pattern">
      
      {/* Background ambient glowing circles */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-500/10 rounded-full blur-[120px] pointer-events-none animate-pulse-slow" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-brand-600/10 rounded-full blur-[120px] pointer-events-none animate-pulse-slow" />

      {/* Main card */}
      <div className="w-full max-w-md z-10 animate-fade-in-up">
        {/* Branding header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-brand-400 flex items-center justify-center shadow-lg shadow-brand-500/25 mx-auto mb-4">
            <Terminal className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            CodeMentor AI
          </h1>
          <p className="text-sm text-slate-500 mt-2">
            {isLogin ? "Log in to access your coding workspace" : "Create an account to begin pairing with AI"}
          </p>
        </div>

        {/* Form container */}
        <div className="glass-panel rounded-2xl border border-dark-800 p-8 shadow-2xl relative">
          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Name Input (Register only) */}
            {!isLogin && (
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 block">Full Name</label>
                <div className="relative flex items-center">
                  <User className="w-4 h-4 text-slate-500 absolute left-3" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full pl-10 pr-4 py-2.5 bg-dark-900 border border-dark-800 rounded-xl text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20"
                    required={!isLogin}
                  />
                </div>
              </div>
            )}

            {/* Email Input */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 block">Email Address</label>
              <div className="relative flex items-center">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@domain.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-dark-900 border border-dark-800 rounded-xl text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20"
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 block">Password</label>
              <div className="relative flex items-center">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-dark-900 border border-dark-800 rounded-xl text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20"
                  required
                />
              </div>
            </div>

            {/* Error Message banner */}
            {error && (
              <div className="text-rose-400 text-xs py-1.5 px-3 bg-rose-950/15 border border-rose-900/30 rounded-lg text-center animate-pulse">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl py-3 font-semibold transition-all hover:shadow-lg hover:shadow-brand-500/20 active:scale-[0.98] disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
              ) : (
                <>
                  <span>{isLogin ? "Authenticate" : "Create Account"}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Toggle link */}
          <div className="text-center mt-6 pt-6 border-t border-dark-800">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-xs font-medium text-slate-400 hover:text-brand-400 transition-colors"
            >
              {isLogin ? "Need a new workspace? Sign up" : "Already have a workspace? Log in"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
