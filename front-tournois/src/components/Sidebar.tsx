import type { Screen } from "../types.ts";
import type { Utilisateur } from "../api/types.ts";
import { IconTrophy, IconTeam, IconShield } from "./Icons.tsx";

interface SidebarProps {
  screen: Screen;
  goTo: (screen: Screen) => void;
  users: Utilisateur[];
  currentUserId: number | null;
  onChangeUser: (id: number | null) => void;
}

export default function Sidebar({ screen, goTo, users, currentUserId, onChangeUser }: SidebarProps) {
  const currentUser = users.find((u) => u.id === currentUserId) ?? null;

  return (
    <aside className="rail">
      <div className="rail-brand">
        <div className="mark">LIGUE IUT</div>
        <div className="sub">Tournois inter-IUT</div>
      </div>
      <nav>
        <button
          className={`rail-item ${screen === "tournaments" || screen === "detail" ? "active" : ""}`}
          onClick={() => goTo("tournaments")}
        >
          <IconTrophy /> Tournois
        </button>
        <button className={`rail-item ${screen === "team" ? "active" : ""}`} onClick={() => goTo("team")}>
          <IconTeam /> Mon équipe
        </button>
        {currentUser?.is_admin && (
          <button className={`rail-item ${screen === "admin" ? "active" : ""}`} onClick={() => goTo("admin")}>
            <IconShield /> Administration
          </button>
        )}
      </nav>
      <div className="rail-foot">
        <div className="rail-user">
          <div className="rail-avatar">{(currentUser?.login ?? "??").slice(0, 2).toUpperCase()}</div>
          <div className="rail-user-meta" style={{ width: "100%" }}>
            <div className="name">{currentUser ? currentUser.login : "Aucun utilisateur"}</div>
            <select
              value={currentUserId ?? ""}
              onChange={(e) => onChangeUser(e.target.value ? Number(e.target.value) : null)}
              style={{
                marginTop: 4,
                width: "100%",
                fontSize: 11,
                background: "#2A2534",
                color: "#C8C2D6",
                border: "1px solid #3A3448",
                borderRadius: 4,
                padding: "3px 5px",
              }}
            >
              <option value="">— se connecter en tant que —</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.login} {u.is_admin ? "(admin)" : ""}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </aside>
  );
}
