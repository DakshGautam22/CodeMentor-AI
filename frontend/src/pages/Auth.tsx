import React, { useState, useEffect } from "react";
import { useAuthStore } from "../store/authStore";
import { useUiStore } from "../store/uiStore";
import { motion, AnimatePresence } from "framer-motion";
import { Terminal, Mail, Lock, User, ArrowRight, Sun, Moon, Sparkles, AlertCircle } from "lucide-react";

export const Auth: React.FC = () => {
  const { login, register, isLoading, error, clearError } = useAuthStore();
  const { themeMode, toggleTheme, showToast } = useUiStore();

  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [auraClickCount, setAuraClickCount] = useState(0);

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
      if (success) showToast("Aura authenticated. Welcome back!", "success");
    } else {
      const success = await register({ name, email, password });
      if (success) showToast("Workspace created. Aura points +1000!", "success");
    }
  };

  const handleAuraClick = () => {
    const counts = auraClickCount + 1;
    setAuraClickCount(counts);
    if (counts === 1) {
      showToast("Aura points +100! Keep clicking ⚡", "success");
    } else if (counts === 5) {
      showToast("GigaChad developer mode unlocked 💅", "success");
    } else if (counts === 10) {
      showToast("Absolute code god status achieved 👑", "success");
    }
  };

  return (
    <div className={`min-h-screen flex flex-col justify-center items-center p-4 relative overflow-hidden transition-colors duration-500 bg-grid-pattern ${
      themeMode === "dark" ? "bg-dark-950 text-slate-100" : "bg-[#f8fafc] text-slate-900"
    }`}>
      
      {/* Dynamic Background Glowing Blobs */}
      <AnimatePresence>
        {themeMode === "dark" ? (
          <>
            <motion.div 
              key="dark-blob-1"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 0.15, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.8 }}
              className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-500 rounded-full blur-[120px] pointer-events-none animate-pulse-slow" 
            />
            <motion.div 
              key="dark-blob-2"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 0.1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.8 }}
              className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500 rounded-full blur-[120px] pointer-events-none animate-pulse-slow" 
            />
          </>
        ) : (
          <>
            <motion.div 
              key="light-blob-1"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 0.25, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.8 }}
              className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-300 rounded-full blur-[120px] pointer-events-none" 
            />
            <motion.div 
              key="light-blob-2"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 0.2, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.8 }}
              className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-sky-300 rounded-full blur-[120px] pointer-events-none" 
            />
          </>
        )}
      </AnimatePresence>

      {/* Floating Theme Toggler */}
      <motion.button
        onClick={toggleTheme}
        whileHover={{ scale: 1.1, rotate: 15 }}
        whileTap={{ scale: 0.9, rotate: -15 }}
        className={`absolute top-6 right-6 p-3 rounded-full border shadow-xl flex items-center justify-center cursor-pointer transition-colors duration-300 z-50 ${
          themeMode === "dark" 
            ? "bg-dark-900 border-dark-800 text-amber-400 hover:bg-dark-850" 
            : "bg-white border-slate-200 text-indigo-600 hover:bg-slate-50"
        }`}
        title={`Switch to ${themeMode === "dark" ? "Light" : "Dark"} Mode`}
      >
        {themeMode === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      </motion.button>

      {/* Main card */}
      <div className="w-full max-w-md z-10 flex flex-col items-center">
        
        {/* Branding header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 100, damping: 15 }}
          className="text-center mb-6"
        >
          {/* Logo container with rotation */}
          <motion.div 
            whileHover={{ rotate: 360, scale: 1.05 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className={`w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-600 via-brand-500 to-indigo-400 flex items-center justify-center shadow-lg shadow-brand-500/25 mx-auto mb-4 cursor-pointer`}
          >
            <Terminal className="w-7 h-7 text-white" />
          </motion.div>
          
          <h1 className={`text-3xl font-extrabold tracking-tight bg-gradient-to-r from-brand-400 via-indigo-500 to-pink-500 bg-clip-text text-transparent`}>
            CodeMentor AI
          </h1>
          
          {/* GenZ Badge */}
          <motion.div 
            onClick={handleAuraClick}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`inline-flex items-center gap-1 mt-2.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider cursor-pointer shadow-sm ${
              themeMode === "dark"
                ? "bg-dark-850 border border-dark-800 text-brand-300"
                : "bg-white border border-slate-100 text-indigo-600"
            }`}
          >
            <Sparkles className="w-3 h-3 text-amber-400 animate-pulse" />
            <span>aura: {auraClickCount > 0 ? `+${auraClickCount * 100} points` : "click to claim points"} ⚡</span>
          </motion.div>
        </motion.div>

        {/* Form container */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 120, damping: 18 }}
          className={`w-full glass-panel rounded-3xl p-8 shadow-2xl relative border ${
            themeMode === "dark" 
              ? "border-white/5 shadow-brand-500/5" 
              : "border-black/5 shadow-indigo-500/5"
          }`}
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Title / Action Subtext */}
            <div className="mb-2">
              <h2 className={`text-lg font-bold ${themeMode === "dark" ? "text-slate-100" : "text-slate-900"}`}>
                {isLogin ? "Welcome Back, Bestie" : "Join the Dev Cult"}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {isLogin ? "Aura checks are online. Log in to start coding." : "Sign up and secure 1000 aura points instantly."}
              </p>
            </div>

            <AnimatePresence mode="popLayout">
              {/* Name Input (Register only) */}
              {!isLogin && (
                <motion.div 
                  key="name-input"
                  initial={{ opacity: 0, height: 0, y: -10 }}
                  animate={{ opacity: 1, height: "auto", y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-1.5 overflow-hidden"
                >
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Full Name</label>
                  <div className="relative flex items-center">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 z-20" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your name"
                      className="w-full pl-10 pr-4 py-3 bg-dark-900/50 border border-dark-850 rounded-2xl text-sm placeholder:text-slate-500 focus:outline-none glass-input"
                      required={!isLogin}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Email Input */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Email Address</label>
              <div className="relative flex items-center">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 z-20" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@domain.com"
                  className="w-full pl-10 pr-4 py-3 bg-dark-900/50 border border-dark-850 rounded-2xl text-sm placeholder:text-slate-500 focus:outline-none glass-input"
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Vibe Key (Password)</label>
              <div className="relative flex items-center">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 z-20" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 bg-dark-900/50 border border-dark-850 rounded-2xl text-sm placeholder:text-slate-500 focus:outline-none glass-input"
                  required
                />
              </div>
            </div>

            {/* Error Message banner */}
            <AnimatePresence>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="text-rose-400 text-xs py-2 px-3 bg-rose-950/15 border border-rose-900/20 rounded-xl flex items-center gap-2"
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={isLoading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-brand-600 via-brand-500 to-indigo-500 hover:from-brand-750 hover:to-indigo-650 text-white rounded-2xl py-3.5 font-bold transition-all shadow-lg shadow-brand-500/20 hover:shadow-brand-500/35 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
              ) : (
                <>
                  <span>{isLogin ? "Authenticate Aura" : "Claim Workspace"}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </motion.button>
          </form>

          {/* Toggle link */}
          <div className={`text-center mt-6 pt-6 border-t ${themeMode === "dark" ? "border-dark-800" : "border-slate-100"}`}>
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-xs font-semibold text-slate-500 hover:text-brand-500 dark:hover:text-brand-400 transition-colors cursor-pointer"
            >
              {isLogin ? "New user? Mint your aura card ✨" : "Registered? Log in to lock in 🔒"}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
