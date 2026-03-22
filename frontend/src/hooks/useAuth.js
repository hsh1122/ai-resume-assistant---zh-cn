import { useEffect, useState } from "react";

import { fetchMe, loginUser, registerUser } from "../api";

export default function useAuth({ tokenKey, onError, onInfo, onAuthenticated, onLogout }) {
  const [token, setToken] = useState(localStorage.getItem(tokenKey) || "");
  const [currentUser, setCurrentUser] = useState(null);
  const [authMode, setAuthMode] = useState("login");
  const [authUsername, setAuthUsername] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authSubmitting, setAuthSubmitting] = useState(false);

  function logout() {
    localStorage.removeItem(tokenKey);
    setToken("");
    setCurrentUser(null);
    onLogout();
  }

  function handleAuthError(errMessage) {
    if (String(errMessage).toLowerCase().includes("could not validate credentials")) {
      logout();
      onError("Session expired. Please login again.");
      return true;
    }

    return false;
  }

  async function handleAuthSubmit() {
    if (!authUsername.trim() || !authPassword.trim()) {
      onError("Please input username and password.");
      return;
    }

    setAuthSubmitting(true);
    onError("");
    onInfo("");

    try {
      if (authMode === "register") {
        await registerUser({ username: authUsername.trim(), password: authPassword });
        onInfo("Registration successful. Please login.");
        setAuthMode("login");
        return;
      }

      const data = await loginUser({ username: authUsername.trim(), password: authPassword });
      localStorage.setItem(tokenKey, data.access_token);
      setToken(data.access_token);
      onInfo("Login successful.");
    } catch (err) {
      onError(err.message || "Authentication failed");
    } finally {
      setAuthSubmitting(false);
    }
  }

  useEffect(() => {
    async function bootstrap() {
      if (!token) {
        return;
      }

      try {
        const me = await fetchMe(token);
        setCurrentUser(me);
        await onAuthenticated(token);
      } catch (err) {
        if (!handleAuthError(err.message)) {
          onError(err.message || "Failed to load profile");
        }
      }
    }

    bootstrap();
  }, [token]);

  return {
    token,
    currentUser,
    authMode,
    setAuthMode,
    authUsername,
    setAuthUsername,
    authPassword,
    setAuthPassword,
    authSubmitting,
    logout,
    handleAuthError,
    handleAuthSubmit,
  };
}
