import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "@/services/api";

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(authService.isAuthenticated());
  const [userName, setUserName] = useState(authService.getUserName() || "");
  const [userEmail, setUserEmail] = useState(authService.getUserEmail() || "");
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (token) {
      setIsAuthenticated(true);
      setUserName(authService.getUserName() || "");
      setUserEmail(authService.getUserEmail() || "");
    } else {
      setIsAuthenticated(false);
      setUserName("");
      setUserEmail("");
    }
  }, []);

  const handleAuth = () => {
    const token = localStorage.getItem("authToken");
    if (token) {
      setIsAuthenticated(true);
      setUserName(authService.getUserName() || "");
      setUserEmail(authService.getUserEmail() || "");
      navigate("/");
    } else {
      setIsAuthenticated(false);
      setUserName("");
      setUserEmail("");
      navigate("/login");
    }
  };

  const handleLogout = () => {
    authService.logout();
    setIsAuthenticated(false);
    setUserName("");
    setUserEmail("");
    navigate("/login");
  };

  return {
    isAuthenticated,
    userName,
    setUserName,
    userEmail,
    setUserEmail,
    handleAuth,
    handleLogout,
  };
} 