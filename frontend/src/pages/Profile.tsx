import React, { useState } from "react";
import { useAuthStore } from "../store/authStore";
import { useUiStore } from "../store/uiStore";
import { X, User, Mail, Lock, Shield } from "lucide-react";

interface ProfileProps {
  onClose: () => void;
}

export const Profile: React.FC<ProfileProps> = ({ onClose }) => {
  const { user, updateProfile, isLoading, error } = useAuthStore();
  const { showToast } = useUiStore();

  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password && password !== confirmPassword) {
      showToast("Passwords do not match!", "error");
      return;
    }

    const payload: any = { name, email };
    if (password) {
      payload.password = password;
    }

    const success = await updateProfile(payload);
    if (success) {
      showToast("Profile settings updated successfully!", "success");
      setPassword("");
      setConfirmPassword("");
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div 
        className="w-full max-w-md glass-panel rounded-2xl border border-dark-800 shadow-2xl overflow-hidden animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-dark-800 flex items-center justify-between bg-dark-950/40">
          <div className="flex items-center gap-2 text-brand-400">
            <Shield className="w-5 h-5" />
            <h2 className="font-semibold text-slate-100">Workspace Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/5 border border-dark-800 rounded-lg text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleUpdate} className="p-6 space-y-4">
          {/* Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" /> Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="w-full bg-dark-900 border border-dark-800 focus:border-brand-500 rounded-xl px-3 py-2 text-sm text-slate-200"
              required
            />
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" /> Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
              className="w-full bg-dark-900 border border-dark-800 focus:border-brand-500 rounded-xl px-3 py-2 text-sm text-slate-200"
              required
            />
          </div>

          <div className="border-t border-dark-800 my-4 pt-4 space-y-4">
            <p className="text-[10px] text-slate-500 uppercase font-semibold tracking-wider">Change Password (Optional)</p>
            
            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" /> New Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Leave blank to keep current password"
                className="w-full bg-dark-900 border border-dark-800 focus:border-brand-500 rounded-xl px-3 py-2 text-sm text-slate-200"
              />
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" /> Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
                className="w-full bg-dark-900 border border-dark-800 focus:border-brand-500 rounded-xl px-3 py-2 text-sm text-slate-200"
              />
            </div>
          </div>

          {/* Validation Error banner */}
          {error && (
            <div className="text-rose-400 text-xs py-2 px-3 bg-rose-950/15 border border-rose-900/35 rounded-xl text-center">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2.5 justify-end pt-4 border-t border-dark-800">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 bg-dark-900 border border-dark-800 hover:border-dark-700 text-slate-400 hover:text-slate-200 rounded-xl text-sm font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="py-2.5 px-4 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-sm font-semibold transition-colors shadow-lg shadow-brand-500/20 active:scale-[0.98] disabled:opacity-50"
            >
              {isLoading ? "Saving changes..." : "Save Settings"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
