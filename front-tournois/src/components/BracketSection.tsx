import { useEffect, useState } from "react";
import type { Arbre, ArbreMatch, TournoiStatut } from "../api/types.ts";
import { tournoisApi } from "../api/tournois.ts";
import ApiState from "./ApiState.tsx";

type Round = Arbre["rounds"][number];

interface BracketSectionProps {
    tournoiId: number;
    statut: TournoiStatut;
    /** Incrémenter pour recharger l'arbre (ex. après une saisie de score). */
    reloadKey?: number;
    /** Si fourni, les matchs deviennent cliquables (vue admin). */
    onMatchClick?: (m: ArbreMatch) => void;
    selectedMatchId?: number | null;
}

const CSS = `
.br-scroll { overflow-x: auto; padding: 4px 0; }
.br-tree { display: flex; align-items: stretch; width: max-content; }
.br-round { display: flex; flex-direction: column; width: 220px; margin-right: 40px; }
.br-round:last-child { margin-right: 0; }
.br-title {
  font-size: 12px; font-weight: 700; text-transform: uppercase;
  letter-spacing: .04em; color: var(--muted, #6b6b7b); margin-bottom: 8px;
}
.br-body { flex: 1; display: flex; flex-direction: column; }
.br-slot { flex: 1; display: flex; align-items: center; padding: 6px 0; min-height: 76px; }
.br-pair { flex: 2; display: flex; flex-direction: column; position: relative; }
.br-pair::after {
  content: ""; position: absolute; left: 100%; width: 20px; top: 25%; bottom: 25%;
  border: 2px solid var(--border, #c9c9d3); border-left: 0;
}
.br-pair::before {
  content: ""; position: absolute; left: calc(100% + 20px); width: 20px; top: 50%;
  border-top: 2px solid var(--border, #c9c9d3);
}
.br-match {
  width: 100%; border: 1px solid var(--border, #c9c9d3); border-radius: 6px;
  background: var(--surface, #fff); overflow: hidden; font-size: 13px;
}
.br-match.clickable { cursor: pointer; }
.br-match.clickable:hover { box-shadow: 0 1px 6px rgba(0, 0, 0, .15); }
.br-match.selected { outline: 2px solid var(--live, #c0392b); }
.br-team { display: flex; justify-content: space-between; gap: 12px; padding: 6px 10px; }
.br-team + .br-team { border-top: 1px solid var(--border, #c9c9d3); }
`;

function teamLabel(m: ArbreMatch, slot: 1 | 2): string {
    if (slot === 2 && m.bye) return "Qualifié d'office";
    return (slot === 1 ? m.equipe1_nom : m.equipe2_nom) ?? "À déterminer";
}

interface MatchCardProps {
    m: ArbreMatch;
    selected: boolean;
    onClick?: (m: ArbreMatch) => void;
}

function MatchCard({ m, selected, onClick }: MatchCardProps) {
    const clickable = !!onClick && !m.bye;

    const team = (slot: 1 | 2) => {
        const id = slot === 1 ? m.equipe1_id : m.equipe2_id;
        const score = slot === 1 ? m.score_equipe1 : m.score_equipe2;
        const isWinner = m.vainqueur_id !== null && m.vainqueur_id === id;
        const isLoser = m.vainqueur_id !== null && !m.bye && m.vainqueur_id !== id;
        return (
            <div
                className="br-team"
                style={{
                    fontWeight: isWinner ? 700 : 400,
                    opacity: isLoser ? 0.55 : 1,
                    fontStyle: id === null || (slot === 2 && m.bye) ? "italic" : "normal",
                }}
            >
                <span>{teamLabel(m, slot)}</span>
                {score !== null && <span>{score}</span>}
            </div>
        );
    };

    return (
        <div
            className={`br-match${clickable ? " clickable" : ""}${selected ? " selected" : ""}`}
            onClick={clickable ? () => onClick!(m) : undefined}
            onKeyDown={
                clickable
                    ? (e) => {
                        if (e.key === "Enter" || e.key === " ") onClick!(m);
                    }
                    : undefined
            }
            role={clickable ? "button" : undefined}
            tabIndex={clickable ? 0 : undefined}
        >
            {team(1)}
            {team(2)}
        </div>
    );
}

interface BracketTreeProps {
    rounds: Round[];
    onMatchClick?: (m: ArbreMatch) => void;
    selectedMatchId: number | null;
}

function BracketTree({ rounds, onMatchClick, selectedMatchId }: BracketTreeProps) {
    const card = (m: ArbreMatch) => (
        <div className="br-slot" key={m.id}>
            <MatchCard m={m} selected={selectedMatchId === m.id} onClick={onMatchClick} />
        </div>
    );

    return (
        <div className="br-scroll">
            <div className="br-tree">
                {rounds.map((r, i) => {
                    const next = rounds[i + 1];
                    // Les traits de liaison ne sont dessinés que si 2 matchs alimentent 1 match du tour suivant.
                    const paired = !!next && r.matchs.length === next.matchs.length * 2;

                    const body: React.ReactNode[] = [];
                    if (paired) {
                        for (let k = 0; k < r.matchs.length; k += 2) {
                            body.push(
                                <div className="br-pair" key={r.matchs[k].id}>
                                    {card(r.matchs[k])}
                                    {card(r.matchs[k + 1])}
                                </div>
                            );
                        }
                    } else {
                        r.matchs.forEach((m) => body.push(card(m)));
                    }

                    return (
                        <div className="br-round" key={r.titre + i}>
                            <div className="br-title">{r.titre}</div>
                            <div className="br-body">{body}</div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default function BracketSection({
                                           tournoiId,
                                           statut,
                                           reloadKey = 0,
                                           onMatchClick,
                                           selectedMatchId = null,
                                       }: BracketSectionProps) {
    const [arbre, setArbre] = useState<Arbre | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    function load() {
        setLoading(true);
        setError(null);
        tournoisApi
            .arbre(tournoiId)
            .then(setArbre)
            .catch((e) => setError(e.message ?? "Erreur de chargement de l'arbre"))
            .finally(() => setLoading(false));
    }

    useEffect(load, [tournoiId, reloadKey]);

    if (loading || error) return <ApiState loading={loading} error={error} onRetry={load} />;

    if (!arbre || arbre.rounds.length === 0) {
        return (
            <p className="search-hint">
                {statut === "OUVERT" || statut === "FERME"
                    ? "L'arbre sera généré aléatoirement au démarrage du tournoi."
                    : "Aucun arbre pour ce tournoi."}
            </p>
        );
    }

    return (
        <div>
            <style>{CSS}</style>
            <BracketTree rounds={arbre.rounds} onMatchClick={onMatchClick} selectedMatchId={selectedMatchId} />
            {arbre.petite_finale && (
                <div style={{ marginTop: 16 }}>
                    <BracketTree
                        rounds={[{ titre: "Petite finale", matchs: [arbre.petite_finale] } as Round]}
                        onMatchClick={onMatchClick}
                        selectedMatchId={selectedMatchId}
                    />
                </div>
            )}
        </div>
    );
}