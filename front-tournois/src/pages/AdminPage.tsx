import { useEffect, useState } from "react";
import type { Tournoi, TournoiDetail, TournoiStatut, Message, ArbreMatch } from "../api/types.ts";
import { tournoisApi } from "../api/tournois.ts";
import { matchsApi } from "../api/matchs.ts";
import { messagesApi } from "../api/messages.ts";
import ApiState from "../components/ApiState.tsx";
import BracketSection from "../components/BracketSection.tsx";

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
  EN_COURS: "Démarrer (génère l'arbre)",
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
  const [petiteFinale, setPetiteFinale] = useState(false);
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
      await tournoisApi.creer({
        nom: nom.trim(),
        description: description.trim() || null,
        petite_finale: petiteFinale,
      });
      setNom("");
      setDescription("");
      setPetiteFinale(false);
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
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, marginTop: 8 }}>
          <input type="checkbox" checked={petiteFinale} onChange={(e) => setPetiteFinale(e.target.checked)} />
          Petite finale (match pour la 3e place, à partir de 4 équipes)
        </label>
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
    if (
        next === "EN_COURS" &&
        !window.confirm("Démarrer le tournoi ? L'arbre sera généré aléatoirement et ne pourra plus être regénéré.")
    ) {
      return;
    }
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

  async function handlePetiteFinale(id: number, value: boolean) {
    try {
      await tournoisApi.modifier(id, { petite_finale: value });
      load();
    } catch (e: any) {
      alert(e.message ?? "Modification refusée.");
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
                        {(t.statut === "OUVERT" || t.statut === "FERME") && (
                            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, marginTop: 4 }}>
                              <input
                                  type="checkbox"
                                  checked={t.petite_finale}
                                  onChange={(e) => handlePetiteFinale(t.id, e.target.checked)}
                              />
                              Petite finale
                            </label>
                        )}
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
                          {expandedId === t.id ? "Fermer" : "Arbre"}
                        </button>
                      </div>
                    </div>
                    {expandedId === t.id && <MatchManager tournoiId={t.id} statut={t.statut} />}
                  </div>
              ))}
          {!loading && !error && tournois.length === 0 && <p className="search-hint">Aucun tournoi pour l'instant.</p>}
        </div>
      </>
  );
}

/* ------------------------- Arbre + saisie des scores ----------------------- */

function MatchManager({ tournoiId, statut }: { tournoiId: number; statut: TournoiStatut }) {
  const [detail, setDetail] = useState<TournoiDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selected, setSelected] = useState<ArbreMatch | null>(null);
  const [s1, setS1] = useState(0);
  const [s2, setS2] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [viewingSpaceId, setViewingSpaceId] = useState<number | null>(null);

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

  function handleSelect(m: ArbreMatch) {
    setSelected(m);
    setS1(m.score_equipe1 ?? 0);
    setS2(m.score_equipe2 ?? 0);
    setSaveError(null);
  }

  const editable =
      !!selected && statut === "EN_COURS" && !selected.bye && selected.equipe1_id !== null && selected.equipe2_id !== null;

  async function handleSave() {
    if (!selected) return;
    setSaving(true);
    setSaveError(null);
    try {
      await matchsApi.modifier(selected.id, { score_equipe1: s1, score_equipe2: s2 });
      setSelected(null);
      setReloadKey((k) => k + 1);
    } catch (e: any) {
      setSaveError(e.message ?? "Impossible d'enregistrer le résultat.");
    } finally {
      setSaving(false);
    }
  }

  return (
      <div className="match-manage open">
        <ApiState loading={loading} error={error} onRetry={load} />
        {!loading && !error && detail && (
            <>
              <p className="search-hint" style={{ marginBottom: 8 }}>
                {statut === "EN_COURS"
                    ? "Cliquez sur un match pour saisir ou corriger son score (nombre de manches gagnées, pas de nul). Pour un forfait, entrez simplement 1 – 0."
                    : "L'arbre est généré au démarrage du tournoi ; les scores se saisissent lorsqu'il est En cours."}
              </p>

              <BracketSection
                  tournoiId={tournoiId}
                  statut={statut}
                  reloadKey={reloadKey}
                  onMatchClick={handleSelect}
                  selectedMatchId={selected?.id ?? null}
              />

              {selected && (
                  <div className="panel" style={{ marginTop: 10 }}>
                    <h3>
                      {selected.equipe1_nom ?? "À déterminer"} vs {selected.equipe2_nom ?? "À déterminer"}
                    </h3>
                    {editable ? (
                        <>
                          <div className="match-manage-row">
                            <span className="m-team">{selected.equipe1_nom}</span>
                            <input type="number" min={0} value={s1} onChange={(e) => setS1(Number(e.target.value))} />
                            <input type="number" min={0} value={s2} onChange={(e) => setS2(Number(e.target.value))} />
                            <span className="m-team">{selected.equipe2_nom}</span>
                          </div>
                          <div className="match-manage-actions" style={{ marginTop: 10 }}>
                            <button className="btn small" disabled={saving} onClick={handleSave}>
                              {saving ? "…" : "Enregistrer"}
                            </button>
                            <button className="btn ghost small" onClick={() => setSelected(null)}>
                              Annuler
                            </button>
                          </div>
                        </>
                    ) : (
                        <p className="search-hint">
                          {statut !== "EN_COURS"
                              ? "Le tournoi doit être En cours pour saisir un score."
                              : "Ce match n'a pas encore ses deux équipes."}
                        </p>
                    )}
                    {saveError && (
                        <p className="search-hint" style={{ color: "var(--live)" }}>
                          {saveError}
                        </p>
                    )}
                  </div>
              )}

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
