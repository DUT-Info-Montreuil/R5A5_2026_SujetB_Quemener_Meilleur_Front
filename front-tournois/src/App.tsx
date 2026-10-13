import { useEffect, useState } from "react";
import type { Screen } from "./types.ts";
import type { Utilisateur } from "./api/types.ts";
import { utilisateursApi } from "./api/utilisateurs.ts";
import Sidebar from "./components/Sidebar.tsx";
import ApiState from "./components/ApiState.tsx";
import TournamentsPage from "./pages/TournamentsPage.tsx";
import TournamentDetailPage from "./pages/TournamentDetailPage.tsx";
import TeamPage from "./pages/TeamPage.tsx";
import AdminPage from "./pages/AdminPage.tsx";
import "./App.css";

const CURRENT_USER_KEY = "liut.currentUserId";

export default function App() {
  const [screen, setScreen] = useState<Screen>("tournaments");
  const [selectedTournoiId, setSelectedTournoiId] = useState<number | null>(null);
  const [selectedEquipeId, setSelectedEquipeId] = useState<number | null>(null);

  const [users, setUsers] = useState<Utilisateur[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(() => {
    const stored = localStorage.getItem(CURRENT_USER_KEY);
    return stored ? Number(stored) : null;
  });

  function loadUsers() {
    setUsersLoading(true);
    setUsersError(null);
    utilisateursApi
      .lister()
      .then(setUsers)
      .catch((e) => setUsersError(e.message ?? "Erreur de chargement des utilisateurs"))
      .finally(() => setUsersLoading(false));
  }

  useEffect(loadUsers, []);

  function handleChangeUser(id: number | null) {
    setCurrentUserId(id);
    if (id) localStorage.setItem(CURRENT_USER_KEY, String(id));
    else localStorage.removeItem(CURRENT_USER_KEY);
    // Si l'utilisateur quitte le rôle admin, on sort de l'écran Administration.
    if (!users.find((u) => u.id === id)?.is_admin && screen === "admin") {
      setScreen("tournaments");
    }
  }

  function goTo(next: Screen) {
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

  return (
    <div className="liut-app">
      <div className="app">
        <Sidebar
          screen={screen}
          goTo={goTo}
          users={users}
          currentUserId={currentUserId}
          onChangeUser={handleChangeUser}
        />
        <main className="main">
          {(usersLoading || usersError) && (
            <ApiState loading={usersLoading} error={usersError} onRetry={loadUsers} />
          )}

          {!usersLoading && !usersError && currentUserId === null && (
            <p className="search-hint" style={{ marginBottom: 18 }}>
              Choisissez un utilisateur dans la barre latérale pour simuler une connexion (le backend fourni
              n'expose pas encore de route d'authentification).
            </p>
          )}

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

          {screen === "admin" && <AdminPage currentUserId={currentUserId} openTournoi={openTournoi} />}
        </main>
      </div>
    </div>
  );
}
