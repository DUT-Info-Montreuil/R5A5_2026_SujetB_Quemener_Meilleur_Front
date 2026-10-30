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

    if (checkingSession) {
        return (
            <div className="liut-app">
                <ApiState loading={true} error={null} />
            </div>
        );
    }

    // Visiteur : currentUserId = null, isAdmin = false (consultation seule)
    const currentUserId = currentUser?.id ?? null;
    const isAdmin = currentUser?.is_admin ?? false;
    const openTournoi = (id: number) => navigate(`/tournois/${id}`);

    const handleLogout = () => {
        logout();
        navigate("/tournois");
    };

    return (
        <div className="liut-app">
            <div className="app">
                <Sidebar
                    currentUser={currentUser}
                    onLogout={handleLogout}
                    onLogin={() => navigate("/connexion")}
                />
                <main className="main">
                    <Routes>
                        <Route path="/" element={<Navigate to="/tournois" replace />} />

                        {/* --- Pages publiques (consultation) --- */}
                        <Route path="/tournois" element={<TournamentsPage openTournoi={openTournoi} />} />
                        <Route
                            path="/tournois/:tournoiId"
                            element={<TournoiDetailRoute currentUserId={currentUserId} isAdmin={isAdmin} />}
                        />
                        <Route
                            path="/equipes/:equipeId"
                            element={<TeamRoute currentUserId={currentUserId} isAdmin={isAdmin} />}
                        />

                        {/* --- Connexion --- */}
                        <Route
                            path="/connexion"
                            element={
                                currentUser ? (
                                    <Navigate to="/tournois" replace />
                                ) : (
                                    <AuthPage onAuthenticated={handleAuthenticated} />
                                )
                            }
                        />

                        {/* --- Pages privées --- */}
                        <Route
                            path="/equipes"
                            element={
                                currentUser ? (
                                    <TeamRoute currentUserId={currentUserId} isAdmin={isAdmin} />
                                ) : (
                                    <Navigate to="/connexion" replace />
                                )
                            }
                        />
                        <Route
                            path="/admin"
                            element={
                                !currentUser ? (
                                    <Navigate to="/connexion" replace />
                                ) : isAdmin ? (
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
