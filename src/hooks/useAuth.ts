import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "@/services/api";

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(authService.isAuthenticated());
  const [userName, setUserName] = useState(authService.getUserName() || "");
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (token) {
      setIsAuthenticated(true);
      setUserName(authService.getUserName() || "");
    } else {
      setIsAuthenticated(false);
      setUserName("");
    }
  }, []);

  const handleAuth = () => {
    const token = localStorage.getItem("authToken");
    if (token) {
      setIsAuthenticated(true);
      setUserName(authService.getUserName() || "");
      navigate("/");
    } else {
      setIsAuthenticated(false);
      setUserName("");
      navigate("/login");
    }
  };

  const handleLogout = () => {
    authService.logout();
    setIsAuthenticated(false);
    setUserName("");
    navigate("/login");
  };

  return {
    isAuthenticated,
    userName,
    setUserName,
    handleAuth,
    handleLogout,
  };
} 