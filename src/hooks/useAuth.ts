import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AUTH_CHANGED_EVENT, authService } from "@/services/api";

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(authService.isAuthenticated());
  const [userName, setUserName] = useState(authService.getUserName() || "");
  const [userEmail, setUserEmail] = useState(authService.getUserEmail() || "");
  const navigate = useNavigate();

  const syncAuthState = () => {
    const token = localStorage.getItem("authToken");
    if (token) {
      setIsAuthenticated(true);
      setUserName(authService.getUserName() || "");
      setUserEmail(authService.getUserEmail() || "");
      return;
    }

    setIsAuthenticated(false);
    setUserName("");
    setUserEmail("");
  };

  useEffect(() => {
    syncAuthState();

    const handleStorage = (event: StorageEvent) => {
      if (event.key && !["authToken", "userName", "userEmail"].includes(event.key)) {
        return;
      }
      syncAuthState();
    };

    const handleAuthChanged = () => {
      syncAuthState();
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener(AUTH_CHANGED_EVENT, handleAuthChanged);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(AUTH_CHANGED_EVENT, handleAuthChanged);
    };
  }, []);

  const handleAuth = () => {
    syncAuthState();
    if (localStorage.getItem("authToken")) {
      navigate("/");
    } else {
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