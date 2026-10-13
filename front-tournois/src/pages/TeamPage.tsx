import { useEffect, useMemo, useState } from "react";
import type { Equipe, EquipeDetail, Utilisateur } from "../api/types.ts";
import { equipesApi } from "../api/equipes.ts";
import { utilisateursApi } from "../api/utilisateurs.ts";
import { messagesApi } from "../api/messages.ts";
import ApiState from "../components/ApiState.tsx";
import { IconLock } from "../components/Icons.tsx";

interface TeamPageProps {
  equipeId: number | null;
  currentUserId: number | null;
  onPickEquipe: (id: number) => void;
  onClearEquipe: () => void;
}

export default function TeamPage({ equipeId, currentUserId, onPickEquipe, onClearEquipe }: TeamPageProps) {
  if (equipeId === null) {
    return <TeamPicker currentUserId={currentUserId} onPickEquipe={onPickEquipe} />;
  }
  return (
    <TeamDetail equipeId={equipeId} currentUserId={currentUserId} onClearEquipe={onClearEquipe} />
  );
}

/* --------------------------- Sélection d'équipe --------------------------- */

function TeamPicker({
  currentUserId,
  onPickEquipe,
}: {
  currentUserId: number | null;
  onPickEquipe: (id: number) => void;
}) {
  const [equipes, setEquipes] = useState<Equipe[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function load() {
    if (currentUserId === null) return;
    setLoading(true);
    setError(null);
    utilisateursApi
      .detail(currentUserId)
      .then((u) => setEquipes(u.equipes))
      .catch((e) => setError(e.message ?? "Erreur de chargement de vos équipes"))
      .finally(() => setLoading(false));
  }

  useEffect(load, [currentUserId]);

  if (currentUserId === null) {
    return (
      <section className="screen active">
        <div className="page-head">
          <div>
            <h1>Mon équipe</h1>
            <p className="lede">Sélectionnez un utilisateur dans la barre latérale pour voir ses équipes.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="screen active">
      <div className="page-head">
        <div>
          <h1>Mon équipe</h1>
          <p className="lede">Choisissez une équipe à ouvrir.</p>
        </div>
      </div>
      <ApiState loading={loading} error={error} onRetry={load} />
      {!loading && !error && (
        <div className="panel">
          {equipes && equipes.length === 0 && (
            <p className="search-hint">
              Vous n'êtes membre d'aucune équipe. Rendez-vous sur un tournoi aux inscriptions ouvertes pour en
              créer une.
            </p>
          )}
          {equipes?.map((e) => (
            <div className="team-row" key={e.id} onClick={() => onPickEquipe(e.id)} style={{ cursor: "pointer" }}>
              <div className="team-id">
                <div className="team-avatar">{e.nom.slice(0, 2).toUpperCase()}</div>
                <div>
                  <div className="team-name">{e.nom}</div>
                  <div className="team-cap">Tournoi #{e.tournoi_id}</div>
                </div>
              </div>
              <div className="team-count">{e.joueurs_ids.length} joueur(s)</div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

/* ------------------------------ Détail équipe ------------------------------ */

function TeamDetail({
  equipeId,
  currentUserId,
  onClearEquipe,
}: {
  equipeId: number;
  currentUserId: number | null;
  onClearEquipe: () => void;
}) {
  const [detail, setDetail] = useState<EquipeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [chatInput, setChatInput] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  function load() {
    setLoading(true);
    setError(null);
    equipesApi
      .detail(equipeId)
      .then(setDetail)
      .catch((e) => setError(e.message ?? "Erreur de chargement de l'équipe"))
      .finally(() => setLoading(false));
  }

  useEffect(load, [equipeId]);

  const usersById = useMemo(
    () => new Map((detail?.joueurs ?? []).map((u) => [u.id, u] as [number, Utilisateur])),
    [detail]
  );

  const isMember = currentUserId !== null && detail?.joueurs_ids.includes(currentUserId);
  const captainId = detail?.joueurs_ids[0];

  async function sendMessage() {
    if (!detail || currentUserId === null || !chatInput.trim()) return;
    setSending(true);
    setSendError(null);
    try {
      await messagesApi.creer({ equipe_id: detail.id, utilisateur_id: currentUserId, message: chatInput.trim() });
      setChatInput("");
      load();
    } catch (e: any) {
      setSendError(e.message ?? "Le message n'a pas pu être envoyé.");
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="screen active">
      <div className="crumb">
        <button onClick={onClearEquipe}>← Mes équipes</button>
      </div>

      <ApiState loading={loading} error={error} onRetry={load} />

      {!loading && !error && detail && (
        <>
          <div className="page-head">
            <div>
              <h1>{detail.nom}</h1>
              <p className="lede">
                Engagée sur {detail.tournoi ? detail.tournoi.nom : `le tournoi #${detail.tournoi_id}`} — le
                renommage, les rôles et l'exclusion ne sont pas encore pris en charge par l'API.
              </p>
            </div>
            {isMember && <span className="pill-status">Vous êtes membre</span>}
          </div>

          {detail.tournoi && detail.tournoi.statut !== "OUVERT" && (
            <div className="engage-bar locked">
              <div className="engage-copy">
                <IconLock /> Inscriptions closes — composition figée pour ce tournoi.
              </div>
            </div>
          )}

          <div className="team-layout">
            <div className="panel">
              <h3>Effectif</h3>
              {detail.joueurs.map((p) => (
                <div className="roster-row" key={p.id}>
                  <div className="roster-id">
                    <div className="p-avatar">{p.login.slice(0, 2).toUpperCase()}</div>
                    <div>
                      <div className="p-name">{p.login}</div>
                    </div>
                  </div>
                  {p.id === captainId ? (
                    <span className="role-tag cap">Capitaine</span>
                  ) : (
                    <span className="role-tag">Joueur</span>
                  )}
                </div>
              ))}
              <div className="slots-line">{detail.joueurs.length} joueur(s) dans l'équipe.</div>
            </div>

            <div className="panel">
              <h3 style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                Échanges de l'équipe
                <span className="live-flag">
                  <span className="live-dot" />
                  Live
                </span>
              </h3>
              <div className="chat">
                <div className="chat-msgs">
                  {detail.messages.length === 0 && <p className="search-hint">Aucun message pour l'instant.</p>}
                  {detail.messages.map((m) => {
                    const author = usersById.get(m.utilisateur_id);
                    const isMe = m.utilisateur_id === currentUserId;
                    return (
                      <div className={`msg ${isMe ? "me" : ""}`} key={m.id}>
                        <div className="who">{isMe ? "Vous" : author?.login ?? `Utilisateur #${m.utilisateur_id}`}</div>
                        <div className="bubble">{m.message}</div>
                      </div>
                    );
                  })}
                </div>
                <div className="chat-input">
                  <input
                    type="text"
                    placeholder={isMember ? "Écrire à l'équipe…" : "Réservé aux membres de l'équipe"}
                    value={chatInput}
                    disabled={!isMember || sending}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  />
                  <button className="btn small" disabled={!isMember || sending} onClick={sendMessage}>
                    {sending ? "…" : "Envoyer"}
                  </button>
                </div>
              </div>
              {sendError && (
                <p className="search-hint" style={{ color: "var(--live)" }}>
                  {sendError}
                </p>
              )}
              <div className="chat-hint">
                {isMember
                  ? "Visible uniquement par les membres de " + detail.nom + "."
                  : "Vous n'êtes pas membre de cette équipe : lecture seule."}
              </div>
            </div>
          </div>

          <div className="panel" style={{ marginTop: 18 }}>
            <h3>Matchs de l'équipe</h3>
            {detail.matchs.length === 0 && <p className="search-hint">Aucun match programmé.</p>}
            {detail.matchs.map((m) => {
              const played = m.score_equipe1 !== null && m.score_equipe2 !== null;
              const isEquipe1 = m.equipe1_id === detail.id;
              const monScore = isEquipe1 ? m.score_equipe1 : m.score_equipe2;
              const scoreAdverse = isEquipe1 ? m.score_equipe2 : m.score_equipe1;
              const adversaireId = isEquipe1 ? m.equipe2_id : m.equipe1_id;
              return (
                <div className="team-row" key={m.id}>
                  <div className="team-id">
                    <div>
                      <div className="team-name">Contre l'équipe #{adversaireId}</div>
                      <div className="team-cap">{played ? "Terminé" : "À venir"}</div>
                    </div>
                  </div>
                  <div className="team-count score-final">{played ? `${monScore} – ${scoreAdverse}` : "–"}</div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}
