import { useEffect, useState } from "react";
import type { Equipe } from "../../api/types.ts";
import { utilisateursApi } from "../../api/utilisateurs.ts";
import ApiState from "../ApiState.tsx";

interface TeamPickerProps {
  currentUserId: number | null;
  onPickEquipe: (id: number) => void;
}

export default function TeamPicker({ currentUserId, onPickEquipe }: TeamPickerProps) {
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
        .catch((e: unknown) => {
          setError(e instanceof Error ? e.message : "Erreur de chargement de vos équipes");
        })
        .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    // Le chargement doit être relancé lorsque l'utilisateur sélectionné change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId]);

  if (currentUserId === null) {
    return (
        <section className="screen active">
          <div className="page-head">
            <div>
              <h1>Mon équipe</h1>
              <p className="lede">
                Sélectionnez un utilisateur dans la barre latérale pour voir ses équipes.
              </p>
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
                  <div
                      className="team-row"
                      key={e.id}
                      onClick={() => onPickEquipe(e.id)}
                      style={{ cursor: "pointer" }}
                  >
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
