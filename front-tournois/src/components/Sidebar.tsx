import { NavLink } from "react-router-dom";
import type { AuthUser } from "../api/auth.ts";
import { IconTrophy, IconTeam, IconShield } from "./Icons.tsx";

interface SidebarProps {
    currentUser: AuthUser | null;
    onLogout: () => void;
    onLogin: () => void;
}

const footButtonStyle = {
    marginTop: 4,
    width: "100%",
    fontSize: 11,
    cursor: "pointer",
    background: "#2A2534",
    color: "#C8C2D6",
    border: "1px solid #3A3448",
    borderRadius: 4,
    padding: "3px 5px",
} as const;

export default function Sidebar({ currentUser, onLogout, onLogin }: SidebarProps) {
    return (
        <aside className="rail">
            <div className="rail-brand">
                <div className="mark">LIGUE IUT</div>
                <div className="sub">Tournois inter-IUT</div>
            </div>

            <nav>
                <NavLink
                    to="/tournois"
                    className={({ isActive }) =>
                        `rail-item ${isActive ? "active" : ""}`
                    }
                >
                    <IconTrophy /> Tournois
                </NavLink>

                {currentUser && !currentUser.is_admin && (
                    <NavLink
                        to="/equipes"
                        className={({ isActive }) =>
                            `rail-item ${isActive ? "active" : ""}`
                        }
                    >
                        <IconTeam /> Mon équipe
                    </NavLink>
                )}

                {currentUser?.is_admin && (
                    <NavLink
                        to="/admin"
                        className={({ isActive }) =>
                            `rail-item ${isActive ? "active" : ""}`
                        }
                    >
                        <IconShield /> Administration
                    </NavLink>
                )}
            </nav>

            <div className="rail-foot">
                <div className="rail-user">
                    {currentUser ? (
                        <>
                            <div className="rail-avatar">
                                {currentUser.login.slice(0, 2).toUpperCase()}
                            </div>

                            <div className="rail-user-meta" style={{ width: "100%" }}>
                                <div className="name">
                                    {currentUser.login}{" "}
                                    {currentUser.is_admin ? "(admin)" : ""}
                                </div>

                                <button onClick={onLogout} style={footButtonStyle}>
                                    Se déconnecter
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="rail-user-meta" style={{ width: "100%" }}>
                            <div className="name">Visiteur</div>

                            <button onClick={onLogin} style={footButtonStyle}>
                                Se connecter
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </aside>
    );
}
