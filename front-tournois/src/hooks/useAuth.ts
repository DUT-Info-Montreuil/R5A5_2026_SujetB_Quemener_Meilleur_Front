import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authApi } from "../api/auth.ts";
import type { AuthUser } from "../api/auth.ts";
import { tokenStore, UNAUTHORIZED_EVENT } from "../api/token.ts";

export function useAuth() {
  const navigate = useNavigate();

  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  // true tant qu'on vérifie le jeton stocké au démarrage
  const [checkingSession, setCheckingSession] = useState<boolean>(
    () => tokenStore.get() !== null,
  );

  // Au chargement : si un jeton existe, on vérifie qu'il est toujours valide
  useEffect(() => {
    if (!tokenStore.get()) return;
    authApi
      .me()
      .then(setCurrentUser)
      .catch(() => tokenStore.clear())
      .finally(() => setCheckingSession(false));
  }, []);

  const logout = useCallback(() => {
    authApi.logout();
    setCurrentUser(null);
    navigate("/tournois", { replace: true });
  }, [navigate]);

  const handleAuthenticated = useCallback(
    (user: AuthUser) => {
      setCurrentUser(user);
      navigate("/tournois", { replace: true });
    },
    [navigate],
  );

  // Si n'importe quel appel API reçoit un 401, on renvoie vers la connexion
  useEffect(() => {
    window.addEventListener(UNAUTHORIZED_EVENT, logout);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, logout);
  }, [logout]);

  return { currentUser, checkingSession, handleAuthenticated, logout };
}
