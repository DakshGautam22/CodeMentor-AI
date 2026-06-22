import { create } from "zustand";
import axios from "axios";

// Standard user interface
export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: any) => Promise<boolean>;
  register: (data: any) => Promise<boolean>;
  logout: () => void;
  getProfile: () => Promise<void>;
  updateProfile: (data: any) => Promise<boolean>;
  clearError: () => void;
}

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

export const useAuthStore = create<AuthState>((set, get) => ({
  user: JSON.parse(localStorage.getItem("codementor_user") || "null"),
  token: localStorage.getItem("codementor_token") || null,
  isAuthenticated: !!localStorage.getItem("codementor_token"),
  isLoading: false,
  error: null,

  clearError: () => set({ error: null }),

  login: async (credentials) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.post(`${API_URL}/api/auth/login`, credentials);
      const { access_token, user } = response.data;
      
      localStorage.setItem("codementor_token", access_token);
      localStorage.setItem("codementor_user", JSON.stringify(user));
      
      set({
        token: access_token,
        user,
        isAuthenticated: true,
        isLoading: false
      });
      return true;
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || "Invalid login credentials.";
      set({ error: errorMsg, isLoading: false });
      return false;
    }
  },

  register: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.post(`${API_URL}/api/auth/register`, data);
      const { access_token, user } = response.data;
      
      localStorage.setItem("codementor_token", access_token);
      localStorage.setItem("codementor_user", JSON.stringify(user));
      
      set({
        token: access_token,
        user,
        isAuthenticated: true,
        isLoading: false
      });
      return true;
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || "Registration failed. Try again.";
      set({ error: errorMsg, isLoading: false });
      return false;
    }
  },

  logout: () => {
    localStorage.removeItem("codementor_token");
    localStorage.removeItem("codementor_user");
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      error: null
    });
  },

  getProfile: async () => {
    const { token } = get();
    if (!token) return;
    
    set({ isLoading: true });
    try {
      const response = await axios.get(`${API_URL}/api/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      set({ user: response.data, isLoading: false });
      localStorage.setItem("codementor_user", JSON.stringify(response.data));
    } catch (err: any) {
      if (err.response?.status === 401) {
        get().logout();
      }
      set({ isLoading: false });
    }
  },

  updateProfile: async (data) => {
    const { token } = get();
    if (!token) return false;
    
    set({ isLoading: true, error: null });
    try {
      const response = await axios.put(`${API_URL}/api/profile`, data, {
        headers: { Authorization: `Bearer ${token}` }
      });
      set({ user: response.data, isLoading: false });
      localStorage.setItem("codementor_user", JSON.stringify(response.data));
      return true;
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || "Failed to update profile settings.";
      set({ error: errorMsg, isLoading: false });
      return false;
    }
  }
}));
