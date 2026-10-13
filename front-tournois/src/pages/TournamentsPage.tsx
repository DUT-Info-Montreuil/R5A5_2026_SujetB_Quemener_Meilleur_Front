import { useEffect, useMemo, useState } from "react";
import type { Tournoi, TournoiStatut } from "../api/types.ts";
import { tournoisApi } from "../api/tournois.ts";
import { IconSearch } from "../components/Icons.tsx";
import ApiState from "../components/ApiState.tsx";

interface TournamentsPageProps {
  openTournoi: (id: number) => void;
}

const STATUT_BADGE: Record<TournoiStatut, { label: string; className: string }> = {
  OUVERT: { label: "Inscriptions ouvertes", className: "open" },
  FERME: { label: "Inscriptions closes", className: "closed" },
  EN_COURS: { label: "En cours", className: "live" },
  TERMINE: { label: "Terminé", className: "ended" },
};

const CHIP_FILTERS: { label: string; statut: TournoiStatut | "Tous" }[] = [
  { label: "Tous", statut: "Tous" },
  { label: "Inscriptions ouvertes", statut: "OUVERT" },
  { label: "Inscriptions closes", statut: "FERME" },
  { label: "En cours", statut: "EN_COURS" },
  { label: "Terminés", statut: "TERMINE" },
];

export default function TournamentsPage({ openTournoi }: TournamentsPageProps) {
  const [tournois, setTournois] = useState<Tournoi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [activeChip, setActiveChip] = useState<TournoiStatut | "Tous">("Tous");

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

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tournois.filter((t) => {
      const matchesSearch = !q || t.nom.toLowerCase().includes(q);
      const matchesChip = activeChip === "Tous" || t.statut === activeChip;
      return matchesSearch && matchesChip;
    });
  }, [tournois, search, activeChip]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { Tous: tournois.length };
    for (const chip of CHIP_FILTERS) {
      if (chip.statut !== "Tous") c[chip.statut] = tournois.filter((t) => t.statut === chip.statut).length;
    }
    return c;
  }, [tournois]);

  return (
    <section className="screen active">
      <div className="page-head">
        <div>
          <h1>Tournois</h1>
          <p className="lede">Tous les tournois inter-IUT de la région.</p>
        </div>
      </div>

      <div className="search-bar">
        <IconSearch />
        <input
          type="text"
          placeholder="Rechercher un tournoi…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <p className="search-hint">
        Ouvert à tous, avec ou sans compte — n'importe qui peut consulter l'avancement d'un tournoi.
      </p>

      <div className="chips">
        {CHIP_FILTERS.map((c) => (
          <button
            key={c.label}
            className={`chip ${activeChip === c.statut ? "on" : ""}`}
            onClick={() => setActiveChip(c.statut)}
          >
            {c.label} <span className="count">{counts[c.statut] ?? 0}</span>
          </button>
        ))}
      </div>

      <ApiState loading={loading} error={error} onRetry={load} />

      {!loading && !error && (
        <div className="grid-cards">
          {filtered.map((t) => {
            const badge = STATUT_BADGE[t.statut];
            return (
              <div key={t.id} className="t-card" onClick={() => openTournoi(t.id)} style={{ cursor: "pointer" }}>
                <div className="t-card-top">
                  <div>
                    <h3>{t.nom}</h3>
                    {t.description && <div className="t-game">{t.description}</div>}
                  </div>
                  <span className={`badge ${badge.className}`}>
                    {t.statut === "EN_COURS" && <span className="live-dot" style={{ marginRight: 5 }} />}
                    {badge.label}
                  </span>
                </div>
                <div className="t-meta">
                  <span>{t.equipes_ids.length} équipe(s) engagée(s)</span>
                  <span>Jeu #{t.jeu_id}</span>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <p style={{ color: "var(--ink-soft)", fontSize: 13.5, padding: "30px 0" }}>
              Aucun tournoi ne correspond à cette recherche.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
