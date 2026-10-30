import { useEffect, useState } from "react";
import { demandesAdhesionApi } from "../../api/demandesAdhesion.ts";
import type { DemandeAdhesion } from "../../api/demandesAdhesion.ts";
import { utilisateursApi } from "../../api/utilisateurs.ts";
import ApiState from "../ApiState.tsx";

interface TeamRequestsProps {
  equipeId: number;
  onAccepted: () => void; // recharge l'équipe pour mettre à jour l'effectif
}

// Visible uniquement par le capitaine : demandes d'adhésion en attente
export default function TeamRequests({ equipeId, onAccepted }: TeamRequestsProps) {
  const [demandes, setDemandes] = useState<DemandeAdhesion[]>([]);
  const [logins, setLogins] = useState<Map<number, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  function load() {
    setLoading(true);
    setError(null);
    Promise.all([demandesAdhesionApi.lister(equipeId), utilisateursApi.lister()])
      .then(([d, u]) => {
        setDemandes(d.filter((x) => x.statut === "EN_ATTENTE"));
        setLogins(new Map(u.map((x) => [x.id, x.login] as [number, string])));
      })
      .catch((e) => setError(e.message ?? "Erreur de chargement des demandes"))
      .finally(() => setLoading(false));
  }

  useEffect(load, [equipeId]);

  async function traiter(d: DemandeAdhesion, action: "accepter" | "refuser") {
    setBusyId(d.id);
    setActionError(null);
    try {
      await demandesAdhesionApi[action](d.id);
      if (action === "accepter") onAccepted();
      else setDemandes((prev) => prev.filter((x) => x.id !== d.id));
    } catch (e: any) {
      setActionError(e.message ?? "L'action a échoué.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="panel" style={{ marginTop: 18 }}>
      <h3>Demandes d'adhésion</h3>
      <ApiState loading={loading} error={error} onRetry={load} />
      {!loading && !error && (
        <>
          {demandes.length === 0 && <p className="search-hint">Aucune demande en attente.</p>}
          {demandes.map((d) => (
            <div className="team-row" key={d.id}>
              <div className="team-id">
                <div className="team-name">{logins.get(d.utilisateur_id) ?? `Utilisateur #${d.utilisateur_id}`}</div>
              </div>
              <div>
                <button className="btn small" disabled={busyId === d.id} onClick={() => traiter(d, "accepter")}>
                  Accepter
                </button>{" "}
                <button className="btn small" disabled={busyId === d.id} onClick={() => traiter(d, "refuser")}>
                  Refuser
                </button>
              </div>
            </div>
          ))}
          {actionError && (
            <p className="search-hint" style={{ color: "var(--live)" }}>
              {actionError}
            </p>
          )}
        </>
      )}
    </div>
  );
}
