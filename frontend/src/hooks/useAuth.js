import { useEffect, useState } from "react";

import { fetchMe, localizeApiMessage, loginUser, registerUser } from "../api";

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
    const normalizedMessage = String(errMessage || "");
    const lowerMessage = normalizedMessage.toLowerCase();

    if (
      lowerMessage.includes("could not validate credentials") ||
      lowerMessage.includes("not authenticated") ||
      lowerMessage.includes("invalid authentication credentials") ||
      normalizedMessage.includes("无法验证登录凭证") ||
      normalizedMessage.includes("未登录") ||
      normalizedMessage.includes("登录凭证无效")
    ) {
      logout();
      onError("登录已过期，请重新登录。");
      return true;
    }

    return false;
  }

  async function handleAuthSubmit() {
    if (!authUsername.trim() || !authPassword.trim()) {
      onError("请输入用户名和密码。");
      return;
    }

    setAuthSubmitting(true);
    onError("");
    onInfo("");

    try {
      if (authMode === "register") {
        await registerUser({ username: authUsername.trim(), password: authPassword });
        onInfo("注册成功，请登录。");
        setAuthMode("login");
        return;
      }

      const data = await loginUser({ username: authUsername.trim(), password: authPassword });
      localStorage.setItem(tokenKey, data.access_token);
      setToken(data.access_token);
      onInfo("登录成功。");
    } catch (err) {
      onError(localizeApiMessage(err.message) || "身份验证失败");
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
        const message = localizeApiMessage(err.message);

        if (!handleAuthError(message)) {
          onError(message || "加载用户信息失败");
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
