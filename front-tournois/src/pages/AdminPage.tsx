import { useEffect, useState } from "react";
import type { Tournoi, TournoiDetail, TournoiStatut, Message } from "../api/types.ts";
import { tournoisApi } from "../api/tournois.ts";
import { matchsApi } from "../api/matchs.ts";
import { messagesApi } from "../api/messages.ts";
import ApiState from "../components/ApiState.tsx";

interface AdminPageProps {
  currentUserId: number | null;
  openTournoi: (id: number) => void;
}

// Reflète TRANSITIONS dans tournoi_service.py
const TRANSITIONS: Record<TournoiStatut, TournoiStatut[]> = {
  OUVERT: ["FERME", "TERMINE"],
  FERME: ["EN_COURS", "TERMINE"],
  EN_COURS: ["TERMINE"],
  TERMINE: [],
};

const STATUT_LABEL: Record<TournoiStatut, string> = {
  OUVERT: "Inscriptions ouvertes",
  FERME: "Inscriptions closes",
  EN_COURS: "En cours",
  TERMINE: "Terminé",
};

const TRANSITION_ACTION_LABEL: Record<TournoiStatut, string> = {
  FERME: "Clore les inscriptions",
  EN_COURS: "Démarrer le tournoi",
  TERMINE: "Clôturer le tournoi",
  OUVERT: "Rouvrir",
};

export default function AdminPage({ currentUserId }: AdminPageProps) {
  if (currentUserId === null) {
    return (
      <section className="screen active">
        <div className="page-head">
          <div>
            <h1>Administration</h1>
            <p className="lede">Sélectionnez un utilisateur administrateur dans la barre latérale.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="screen active">
      <div className="page-head">
        <div>
          <h1>Administration</h1>
          <p className="lede">Créer les tournois, piloter les inscriptions et saisir les résultats.</p>
        </div>
      </div>

      <div className="admin-grid">
        <CreateTournoiPanel />
        <div>
          <TournoisPilotPanel />
        </div>
      </div>
    </section>
  );
}

/* ---------------------------- Créer un tournoi ---------------------------- */

function CreateTournoiPanel() {
  const [nom, setNom] = useState("");
  const [description, setDescription] = useState("");
  const [jeuId, setJeuId] = useState(1);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit() {
    setError(null);
    setSuccess(false);
    if (!nom.trim()) {
      setError("Le nom du tournoi est obligatoire.");
      return;
    }
    setCreating(true);
    try {
      await tournoisApi.creer({ nom: nom.trim(), description: description.trim() || null, jeu_id: jeuId });
      setNom("");
      setDescription("");
      setSuccess(true);
    } catch (e: any) {
      setError(e.message ?? "Impossible de créer le tournoi.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="panel">
      <h3>Créer un tournoi</h3>
      <div className="form-row">
        <label>Nom du tournoi</label>
        <input type="text" placeholder="ex. Coupe d'Automne" value={nom} onChange={(e) => setNom(e.target.value)} />
      </div>
      <div className="form-row">
        <label>Description</label>
        <input type="text" placeholder="ex. Valorant · 5v5" value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      <div className="form-row">
        <label>Identifiant du jeu (jeu_id)</label>
        <input type="number" min={1} value={jeuId} onChange={(e) => setJeuId(Number(e.target.value))} />
      </div>
      {error && (
        <p className="search-hint" style={{ color: "var(--live)" }}>
          {error}
        </p>
      )}
      {success && (
        <p className="search-hint" style={{ color: "var(--done)" }}>
          Tournoi créé — retrouvez-le dans la liste à droite.
        </p>
      )}
      <button className="btn" style={{ width: "100%", justifyContent: "center", marginTop: 12 }} disabled={creating} onClick={handleSubmit}>
        {creating ? "Création…" : "Créer le tournoi"}
      </button>
    </div>
  );
}

/* --------------------------- Piloter les tournois -------------------------- */

function TournoisPilotPanel() {
  const [tournois, setTournois] = useState<Tournoi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [transitioning, setTransitioning] = useState<number | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  function load() {
    setLoading(true);
    setError(null);
    tournoisApi
      .lister()
      .then(setTournois)
      .catch((e) => setError(e.message ?? "Erreur de chargement des tournois"))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleTransition(id: number, next: TournoiStatut) {
    setTransitioning(id);
    try {
      await tournoisApi.modifier(id, { statut: next });
      load();
    } catch (e: any) {
      alert(e.message ?? "Transition refusée.");
    } finally {
      setTransitioning(null);
    }
  }

  return (
    <>
      <div className="panel">
        <h3>Tournois à piloter</h3>
        <ApiState loading={loading} error={error} onRetry={load} />
        {!loading &&
          !error &&
          tournois.map((t) => (
            <div className="admin-list-row" key={t.id} style={{ display: "block" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div className="admin-t-name">{t.nom}</div>
                  <div className="admin-t-meta">
                    {STATUT_LABEL[t.statut]} · {t.equipes_ids.length} équipe(s)
                  </div>
                </div>
                <div className="admin-actions">
                  {TRANSITIONS[t.statut].map((next) => (
                    <button
                      key={next}
                      className="btn ghost small"
                      disabled={transitioning === t.id}
                      onClick={() => handleTransition(t.id, next)}
                    >
                      {TRANSITION_ACTION_LABEL[next]}
                    </button>
                  ))}
                  <button className="btn ghost small" onClick={() => setExpandedId(expandedId === t.id ? null : t.id)}>
                    {expandedId === t.id ? "Fermer" : "Matchs"}
                  </button>
                </div>
              </div>
              {expandedId === t.id && <MatchManager tournoiId={t.id} />}
            </div>
          ))}
        {!loading && !error && tournois.length === 0 && <p className="search-hint">Aucun tournoi pour l'instant.</p>}
      </div>
    </>
  );
}

/* ------------------------------ Gestion des matchs -------------------------- */

function MatchManager({ tournoiId }: { tournoiId: number }) {
  const [detail, setDetail] = useState<TournoiDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [equipe1Id, setEquipe1Id] = useState<number | "">("");
  const [equipe2Id, setEquipe2Id] = useState<number | "">("");
  const [creatingMatch, setCreatingMatch] = useState(false);
  const [matchError, setMatchError] = useState<string | null>(null);

  const [scores, setScores] = useState<Record<number, { s1: number; s2: number }>>({});
  const [savingMatchId, setSavingMatchId] = useState<number | null>(null);

  const [viewingSpaceId, setViewingSpaceId] = useState<number | null>(null);

  function load() {
    setLoading(true);
    setError(null);
    tournoisApi
      .detail(tournoiId)
      .then((d) => {
        setDetail(d);
        const initial: Record<number, { s1: number; s2: number }> = {};
        for (const m of d.matchs) initial[m.id] = { s1: m.score_equipe1 ?? 0, s2: m.score_equipe2 ?? 0 };
        setScores(initial);
      })
      .catch((e) => setError(e.message ?? "Erreur de chargement du tournoi"))
      .finally(() => setLoading(false));
  }

  useEffect(load, [tournoiId]);

  async function handleCreateMatch() {
    setMatchError(null);
    if (equipe1Id === "" || equipe2Id === "") {
      setMatchError("Sélectionnez les deux équipes.");
      return;
    }
    setCreatingMatch(true);
    try {
      await matchsApi.creer({
        equipe1_id: Number(equipe1Id),
        equipe2_id: Number(equipe2Id),
        score_equipe1: 0,
        score_equipe2: 0,
      });
      setEquipe1Id("");
      setEquipe2Id("");
      load();
    } catch (e: any) {
      setMatchError(e.message ?? "Impossible de créer le match.");
    } finally {
      setCreatingMatch(false);
    }
  }

  async function handleSaveScore(matchId: number) {
    const s = scores[matchId];
    if (!s) return;
    setSavingMatchId(matchId);
    try {
      await matchsApi.modifier(matchId, { score_equipe1: s.s1, score_equipe2: s.s2 });
      load();
    } catch (e: any) {
      alert(e.message ?? "Impossible d'enregistrer le résultat.");
    } finally {
      setSavingMatchId(null);
    }
  }

  return (
    <div className="match-manage open">
      <ApiState loading={loading} error={error} onRetry={load} />
      {!loading && !error && detail && (
        <>
          <p className="search-hint" style={{ marginBottom: 8 }}>
            Créer un match entre deux équipes engagées :
          </p>
          <div className="match-manage-row">
            <select value={equipe1Id} onChange={(e) => setEquipe1Id(e.target.value ? Number(e.target.value) : "")}>
              <option value="">Équipe 1…</option>
              {detail.equipes.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.nom}
                </option>
              ))}
            </select>
            <select value={equipe2Id} onChange={(e) => setEquipe2Id(e.target.value ? Number(e.target.value) : "")}>
              <option value="">Équipe 2…</option>
              {detail.equipes.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.nom}
                </option>
              ))}
            </select>
            <button className="btn ghost small" disabled={creatingMatch} onClick={handleCreateMatch}>
              Créer le match
            </button>
          </div>
          {matchError && (
            <p className="search-hint" style={{ color: "var(--live)" }}>
              {matchError}
            </p>
          )}

          <p className="search-hint" style={{ margin: "14px 0 8px" }}>
            Saisir / corriger un résultat (pas d'état « forfait » dédié dans l'API : entrez simplement le score du
            walkover, ex. 1 – 0) :
          </p>
          {detail.matchs.map((m) => {
            const e1 = detail.equipes.find((e) => e.id === m.equipe1_id);
            const e2 = detail.equipes.find((e) => e.id === m.equipe2_id);
            const s = scores[m.id] ?? { s1: 0, s2: 0 };
            return (
              <div className="match-manage-row" key={m.id}>
                <span className="m-team">
                  {e1?.nom ?? `#${m.equipe1_id}`} vs {e2?.nom ?? `#${m.equipe2_id}`}
                </span>
                <input
                  type="number"
                  min={0}
                  value={s.s1}
                  onChange={(e) => setScores((prev) => ({ ...prev, [m.id]: { ...s, s1: Number(e.target.value) } }))}
                />
                <input
                  type="number"
                  min={0}
                  value={s.s2}
                  onChange={(e) => setScores((prev) => ({ ...prev, [m.id]: { ...s, s2: Number(e.target.value) } }))}
                />
                <button className="btn small" disabled={savingMatchId === m.id} onClick={() => handleSaveScore(m.id)}>
                  {savingMatchId === m.id ? "…" : "Enregistrer"}
                </button>
              </div>
            );
          })}
          {detail.matchs.length === 0 && <p className="search-hint">Aucun match pour l'instant.</p>}

          <p className="search-hint" style={{ margin: "14px 0 8px" }}>
            Espaces d'équipes — consultation seule :
          </p>
          <div className="match-manage-row" style={{ flexWrap: "wrap" }}>
            <select
              value={viewingSpaceId ?? ""}
              onChange={(e) => setViewingSpaceId(e.target.value ? Number(e.target.value) : null)}
            >
              <option value="">Choisir une équipe…</option>
              {detail.equipes.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.nom}
                </option>
              ))}
            </select>
          </div>
          {viewingSpaceId !== null && <TeamSpaceViewer equipeId={viewingSpaceId} />}
        </>
      )}
    </div>
  );
}

function TeamSpaceViewer({ equipeId }: { equipeId: number }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    messagesApi
      .lister(equipeId)
      .then(setMessages)
      .catch((e) => setError(e.message ?? "Erreur de chargement des messages"))
      .finally(() => setLoading(false));
  }, [equipeId]);

  return (
    <div className="panel" style={{ marginTop: 10 }}>
      <ApiState loading={loading} error={error} />
      {!loading && !error && (
        <>
          {messages.length === 0 && <p className="search-hint">Aucun message dans cet espace.</p>}
          {messages.map((m) => (
            <div className="space-row" key={m.id}>
              <span>Utilisateur #{m.utilisateur_id}</span>
              <span className="st">{m.message}</span>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
