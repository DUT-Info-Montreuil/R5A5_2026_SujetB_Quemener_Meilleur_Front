import { useState } from "react";
import type { EquipeDetail } from "../../api/types.ts";
import { demandesAdhesionApi } from "../../api/demandesAdhesion.ts";
import { IconLock } from "../Icons.tsx";

interface TeamJoinProps {
    detail: EquipeDetail;
    currentUserId: number | null;
    onBack: () => void;
}

export default function TeamJoin({ detail, currentUserId, onBack }: TeamJoinProps) {
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);
    const [sendError, setSendError] = useState<string | null>(null);

    const closed = !!detail.tournoi && detail.tournoi.statut !== "OUVERT";

    async function requestJoin() {
        if (currentUserId === null) return;
        setSending(true);
        setSendError(null);
        try {
            await demandesAdhesionApi.creer({ equipe_id: detail.id, utilisateur_id: currentUserId });
            setSent(true);
        } catch (e: any) {
            setSendError(e.message ?? "La demande n'a pas pu être envoyée.");
        } finally {
            setSending(false);
        }
    }

    return (
        <section className="screen active">
            <div className="crumb">
                <button onClick={onBack}>← Retour</button>
            </div>

            <div className="page-head">
                <div>
                    <h1>{detail.nom}</h1>
                    <p className="lede">
                        Engagée sur {detail.tournoi ? detail.tournoi.nom : `le tournoi #${detail.tournoi_id}`} —{" "}
                        {detail.joueurs.length} joueur(s).
                    </p>
                </div>
            </div>

            <div className="panel">
                <h3>Rejoindre cette équipe</h3>
                <p className="search-hint">
                    Vous ne faites pas partie de cette équipe. Vous pouvez envoyer une demande d'adhésion : elle devra
                    être validée par le capitaine avant que vous puissiez accéder à l'équipe.
                </p>

                {closed && (
                    <div className="engage-bar locked">
                        <div className="engage-copy">
                            <IconLock /> Inscriptions closes — l'équipe n'accepte plus de nouveaux membres.
                        </div>
                    </div>
                )}

                {sent ? (
                    <p className="search-hint">Demande envoyée. En attente de la validation du capitaine.</p>
                ) : (
                    <button className="btn" disabled={sending || closed || currentUserId === null} onClick={requestJoin}>
                        {sending ? "Envoi…" : "Demander à rejoindre"}
                    </button>
                )}

                {sendError && (
                    <p className="search-hint" style={{ color: "var(--live)" }}>
                        {sendError}
                    </p>
                )}
            </div>
        </section>
    );
}