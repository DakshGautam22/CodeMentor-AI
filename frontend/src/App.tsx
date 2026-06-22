import { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./store/authStore";
import { useUiStore } from "./store/uiStore";
import { Auth } from "./pages/Auth";
import { Dashboard } from "./pages/Dashboard";

function App() {
  const { isAuthenticated } = useAuthStore();
  const { themeMode } = useUiStore();

  // Keep html class in sync with the Zustan store themeMode
  useEffect(() => {
    if (themeMode === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [themeMode]);

  return (
    <Router>
      <Routes>
        <Route 
          path="/" 
          element={isAuthenticated ? <Dashboard /> : <Navigate to="/auth" replace />} 
        />
        <Route 
          path="/auth" 
          element={!isAuthenticated ? <Auth /> : <Navigate to="/" replace />} 
        />
        {/* Wildcard redirect to safety */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;

