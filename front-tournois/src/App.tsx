import { useEffect, useState } from "react";
import type { Screen } from "./types.ts";
import { authApi } from "./api/auth.ts";
import type { AuthUser } from "./api/auth.ts";
import { tokenStore, UNAUTHORIZED_EVENT } from "./api/token.ts";
import Sidebar from "./components/Sidebar.tsx";
import ApiState from "./components/ApiState.tsx";
import AuthPage from "./pages/AuthPage.tsx";
import TournamentsPage from "./pages/TournamentsPage.tsx";
import TournamentDetailPage from "./pages/TournamentDetailPage.tsx";
import TeamPage from "./pages/TeamPage.tsx";
import AdminPage from "./pages/AdminPage.tsx";
import "./App.css";

export default function App() {
  const [screen, setScreen] = useState<Screen>("tournaments");
  const [selectedTournoiId, setSelectedTournoiId] = useState<number | null>(null);
  const [selectedEquipeId, setSelectedEquipeId] = useState<number | null>(null);

  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  // true tant qu'on vérifie le jeton stocké au démarrage
  const [checkingSession, setCheckingSession] = useState<boolean>(() => tokenStore.get() !== null);

  // Au chargement : si un jeton existe, on vérifie qu'il est toujours valide
  useEffect(() => {
    if (!tokenStore.get()) return;
    authApi
        .me()
        .then(setCurrentUser)
        .catch(() => tokenStore.clear())
        .finally(() => setCheckingSession(false));
  }, []);

  // Si n'importe quel appel API reçoit un 401, on renvoie vers la connexion
  useEffect(() => {
    const onUnauthorized = () => handleLogout();
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
  }, []);

  function handleAuthenticated(user: AuthUser) {
    setCurrentUser(user);
    setScreen("tournaments");
  }

  function handleLogout() {
    authApi.logout();
    setCurrentUser(null);
    setScreen("tournaments");
    setSelectedTournoiId(null);
    setSelectedEquipeId(null);
  }

  function goTo(next: Screen) {
    if (next === "admin" && !currentUser?.is_admin) return;
    setScreen(next);
    window.scrollTo?.(0, 0);
  }

  function openTournoi(id: number) {
    setSelectedTournoiId(id);
    goTo("detail");
  }

  function openEquipe(id: number) {
    setSelectedEquipeId(id);
    goTo("team");
  }

  // --- Pas connecté : seule la page de connexion est accessible ---
  if (checkingSession) {
    return (
        <div className="liut-app">
          <ApiState loading={true} error={null} />
        </div>
    );
  }

  if (!currentUser) {
    return (
        <div className="liut-app">
          <AuthPage onAuthenticated={handleAuthenticated} />
        </div>
    );
  }

  const currentUserId = currentUser.id;

  return (
      <div className="liut-app">
        <div className="app">
          <Sidebar screen={screen} goTo={goTo} currentUser={currentUser} onLogout={handleLogout} />
          <main className="main">
            {screen === "tournaments" && <TournamentsPage openTournoi={openTournoi} />}

            {screen === "detail" && selectedTournoiId !== null && (
                <TournamentDetailPage
                    tournoiId={selectedTournoiId}
                    currentUserId={currentUserId}
                    openEquipe={openEquipe}
                    goBack={() => goTo("tournaments")}
                />
            )}
            {screen === "detail" && selectedTournoiId === null && (
                <p className="search-hint">Sélectionnez d'abord un tournoi depuis l'écran « Tournois ».</p>
            )}

            {screen === "team" && (
                <TeamPage
                    equipeId={selectedEquipeId}
                    currentUserId={currentUserId}
                    onPickEquipe={setSelectedEquipeId}
                    onClearEquipe={() => setSelectedEquipeId(null)}
                />
            )}

            {screen === "admin" && currentUser.is_admin && (
                <AdminPage currentUserId={currentUserId} openTournoi={openTournoi} />
            )}
          </main>
        </div>
      </div>
  );
}