import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./store/authStore";
import { Auth } from "./pages/Auth";
import { Dashboard } from "./pages/Dashboard";

function App() {
  const { isAuthenticated } = useAuthStore();

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
