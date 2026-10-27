import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { useAuth } from "./hooks/useAuth.ts";
import Sidebar from "./components/Sidebar.tsx";
import ApiState from "./components/ApiState.tsx";
import AuthPage from "./pages/AuthPage.tsx";
import TournamentsPage from "./pages/TournamentsPage.tsx";
import AdminPage from "./pages/AdminPage.tsx";
import TournoiDetailRoute from "./routes/TournoiDetailRoute.tsx";
import TeamRoute from "./routes/TeamRoute.tsx";
import "./App.css";

export default function App() {
  const navigate = useNavigate();
  const { currentUser, checkingSession, handleAuthenticated, logout } = useAuth();

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

  const { id: currentUserId, is_admin: isAdmin } = currentUser;
  const openTournoi = (id: number) => navigate(`/tournois/${id}`);

  return (
      <div className="liut-app">
        <div className="app">
          <Sidebar currentUser={currentUser} onLogout={logout} />
          <main className="main">
            <Routes>
              <Route path="/" element={<Navigate to="/tournois" replace />} />

              <Route path="/tournois" element={<TournamentsPage openTournoi={openTournoi} />} />
              <Route
                  path="/tournois/:tournoiId"
                  element={<TournoiDetailRoute currentUserId={currentUserId} isAdmin={isAdmin} />}
              />

              <Route
                  path="/equipes"
                  element={<TeamRoute currentUserId={currentUserId} isAdmin={isAdmin} />}
              />
              <Route
                  path="/equipes/:equipeId"
                  element={<TeamRoute currentUserId={currentUserId} isAdmin={isAdmin} />}
              />

              <Route
                  path="/admin"
                  element={
                    isAdmin ? (
                        <AdminPage currentUserId={currentUserId} openTournoi={openTournoi} />
                    ) : (
                        <Navigate to="/tournois" replace />
                    )
                  }
              />

              <Route path="*" element={<Navigate to="/tournois" replace />} />
            </Routes>
          </main>
        </div>
      </div>
  );
}