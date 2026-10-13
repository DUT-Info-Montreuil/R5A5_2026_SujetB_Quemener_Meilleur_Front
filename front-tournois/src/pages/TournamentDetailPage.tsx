import { useEffect, useMemo, useState } from "react";
import type { DetailTab } from "../types.ts";
import type { TournoiDetail, Utilisateur } from "../api/types.ts";
import { tournoisApi } from "../api/tournois.ts";
import { equipesApi } from "../api/equipes.ts";
import { utilisateursApi } from "../api/utilisateurs.ts";
import ApiState from "../components/ApiState.tsx";
import { IconLock } from "../components/Icons.tsx";

interface TournamentDetailPageProps {
  tournoiId: number;
  currentUserId: number | null;
  openEquipe: (id: number) => void;
  goBack: () => void;
}

const STATUT_LABEL: Record<string, string> = {
  OUVERT: "Inscriptions ouvertes",
  FERME: "Inscriptions closes",
  EN_COURS: "En cours",
  TERMINE: "Terminé",
};

export default function TournamentDetailPage({
  tournoiId,
  currentUserId,
  openEquipe,
  goBack,
}: TournamentDetailPageProps) {
  const [detail, setDetail] = useState<TournoiDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detailTab, setDetailTab] = useState<DetailTab>("d-teams");

  const [users, setUsers] = useState<Utilisateur[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<number[]>([]);
  const [createError, setCreateError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  function load() {
    setLoading(true);
    setError(null);
    tournoisApi
      .detail(tournoiId)
      .then(setDetail)
      .catch((e) => setError(e.message ?? "Erreur de chargement du tournoi"))
      .finally(() => setLoading(false));
  }

  useEffect(load, [tournoiId]);
  useEffect(() => {
    utilisateursApi.lister().then(setUsers).catch(() => {});
  }, []);

  const usersById = useMemo(() => new Map(users.map((u) => [u.id, u])), [users]);

  function togglePlayer(id: number) {
    setSelectedPlayerIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));
  }

  async function handleCreateTeam() {
    if (!detail) return;
    setCreateError(null);
    if (!newTeamName.trim()) {
      setCreateError("Le nom de l'équipe est obligatoire.");
      return;
    }
    if (selectedPlayerIds.length === 0) {
      setCreateError("Sélectionnez au moins un joueur (le premier sélectionné devient capitaine).");
      return;
    }
    setCreating(true);
    try {
      const equipe = await equipesApi.creer({
        nom: newTeamName.trim(),
        tournoi_id: detail.id,
        joueurs_ids: selectedPlayerIds,
      });
      setShowCreateForm(false);
      setNewTeamName("");
      setSelectedPlayerIds([]);
      load();
      openEquipe(equipe.id);
    } catch (e: any) {
      setCreateError(e.message ?? "Impossible de créer l'équipe.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <section className="screen active">
      <div className="crumb">
        <button onClick={goBack}>← Tous les tournois</button>
      </div>

      <ApiState loading={loading} error={error} onRetry={load} />

      {!loading && !error && detail && (
        <>
          <div className="detail-head">
            <div>
              <div className="detail-title">
                <h1>{detail.nom}</h1>
                <span className={`badge ${detail.statut === "EN_COURS" ? "live" : detail.statut === "OUVERT" ? "open" : detail.statut === "FERME" ? "closed" : "ended"}`}>
                  {detail.statut === "EN_COURS" && <span className="live-dot" style={{ marginRight: 5 }} />}
                  {STATUT_LABEL[detail.statut]}
                </span>
              </div>
              {detail.description && <p className="detail-sub">{detail.description}</p>}
            </div>
          </div>

          <div className="tabs">
            {(
              [
                ["d-teams", "Équipes"],
                ["d-matchs", "Matchs"],
                ["d-results", "Résultats"],
              ] as [DetailTab, string][]
            ).map(([id, label]) => (
              <button key={id} className={`tab ${detailTab === id ? "active" : ""}`} onClick={() => setDetailTab(id)}>
                {label}
              </button>
            ))}
          </div>

          {detailTab === "d-teams" && (
            <div className="subscreen active">
              <div className={`engage-bar ${detail.statut !== "OUVERT" ? "locked" : ""}`}>
                <div className="engage-copy">
                  {detail.statut === "OUVERT" ? (
                    <>Inscriptions ouvertes — créez une équipe pour engager vos joueurs.</>
                  ) : (
                    <>
                      <IconLock /> Inscriptions closes — <strong>composition figée</strong> pour les{" "}
                      {detail.equipes.length} équipes engagées.
                    </>
                  )}
                </div>
                {detail.statut === "OUVERT" && (
                  <div className="engage-actions">
                    <button className="btn small" onClick={() => setShowCreateForm((v) => !v)}>
                      Créer une équipe
                    </button>
                  </div>
                )}
              </div>

              {showCreateForm && (
                <div className="join-panel">
                  <h4>Nouvelle équipe</h4>
                  <div className="form-row">
                    <label>Nom de l'équipe</label>
                    <input type="text" value={newTeamName} onChange={(e) => setNewTeamName(e.target.value)} />
                  </div>
                  <div className="form-row">
                    <label>Joueurs (le premier coché devient capitaine)</label>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {users.map((u) => (
                        <label key={u.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                          <input
                            type="checkbox"
                            checked={selectedPlayerIds.includes(u.id)}
                            onChange={() => togglePlayer(u.id)}
                          />
                          {u.login}
                          {selectedPlayerIds[0] === u.id && (
                            <span className="role-tag cap" style={{ marginLeft: 4 }}>
                              Capitaine
                            </span>
                          )}
                        </label>
                      ))}
                    </div>
                  </div>
                  {createError && (
                    <p className="search-hint" style={{ color: "var(--live)" }}>
                      {createError}
                    </p>
                  )}
                  <div className="match-manage-actions" style={{ marginTop: 10 }}>
                    <button className="btn small" disabled={creating} onClick={handleCreateTeam}>
                      {creating ? "Création…" : "Créer l'équipe"}
                    </button>
                    <button className="btn ghost small" onClick={() => setShowCreateForm(false)}>
                      Annuler
                    </button>
                  </div>
                </div>
              )}

              <div className="panel">
                {detail.equipes.length === 0 && (
                  <p className="search-hint">Aucune équipe engagée pour l'instant.</p>
                )}
                {detail.equipes.map((e) => {
                  const captainId = e.joueurs_ids[0];
                  const captain = usersById.get(captainId);
                  return (
                    <div className="team-row" key={e.id} onClick={() => openEquipe(e.id)} style={{ cursor: "pointer" }}>
                      <div className="team-id">
                        <div className="team-avatar">{e.nom.slice(0, 2).toUpperCase()}</div>
                        <div>
                          <div className="team-name">{e.nom}</div>
                          <div className="team-cap">Capitaine — {captain ? captain.login : `#${captainId}`}</div>
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        {currentUserId !== null && e.joueurs_ids.includes(currentUserId) && (
                          <span className="pill-status">Votre équipe</span>
                        )}
                        <div className="team-count">{e.joueurs_ids.length} joueur(s)</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {detailTab === "d-matchs" && (
            <div className="subscreen active">
              <div className="bracket-note">
                <span className="live-flag">
                  <span className="live-dot" />
                  Mis à jour par l'administrateur
                </span>
                Les scores sont saisis depuis l'écran Administration.
              </div>
              <div className="panel">
                {detail.matchs.length === 0 && <p className="search-hint">Aucun match programmé pour l'instant.</p>}
                {detail.matchs.map((m) => {
                  const e1 = detail.equipes.find((e) => e.id === m.equipe1_id);
                  const e2 = detail.equipes.find((e) => e.id === m.equipe2_id);
                  const played = m.score_equipe1 !== null && m.score_equipe2 !== null;
                  return (
                    <div className="team-row" key={m.id}>
                      <div className="team-id">
                        <div>
                          <div className="team-name">
                            {e1?.nom ?? `Équipe #${m.equipe1_id}`} vs {e2?.nom ?? `Équipe #${m.equipe2_id}`}
                          </div>
                          <div className="team-cap">{played ? "Terminé" : "En attente du résultat"}</div>
                        </div>
                      </div>
                      <div className="team-count score-final">
                        {played ? `${m.score_equipe1} – ${m.score_equipe2}` : "–"}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {detailTab === "d-results" && (
            <div className="subscreen active">
              <div className="panel">
                <table className="results">
                  <thead>
                    <tr>
                      <th>Match</th>
                      <th>Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.matchs
                      .filter((m) => m.score_equipe1 !== null && m.score_equipe2 !== null)
                      .map((m) => {
                        const e1 = detail.equipes.find((e) => e.id === m.equipe1_id);
                        const e2 = detail.equipes.find((e) => e.id === m.equipe2_id);
                        return (
                          <tr key={m.id}>
                            <td>
                              {e1?.nom ?? `#${m.equipe1_id}`} vs {e2?.nom ?? `#${m.equipe2_id}`}
                            </td>
                            <td className="score-final">
                              {m.score_equipe1} – {m.score_equipe2}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
                {detail.matchs.every((m) => m.score_equipe1 === null) && (
                  <p className="search-hint" style={{ paddingTop: 10 }}>
                    Aucun résultat saisi pour l'instant.
                  </p>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}
