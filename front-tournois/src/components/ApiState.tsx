interface ApiStateProps {
  loading: boolean;
  error: string | null;
  onRetry?: () => void;
}

/** Affiche un message de chargement ou d'erreur ; ne rend rien sinon. */
export default function ApiState({ loading, error, onRetry }: ApiStateProps) {
  if (loading) {
    return <p className="search-hint" style={{ padding: "10px 0" }}>Chargement…</p>;
  }
  if (error) {
    return (
      <div
        className="engage-bar"
        style={{ borderColor: "var(--live)", background: "var(--live-soft)" }}
      >
        <div className="engage-copy" style={{ color: "var(--live)" }}>
          {error}
        </div>
        {onRetry && (
          <button className="btn ghost small" onClick={onRetry}>
            Réessayer
          </button>
        )}
      </div>
    );
  }
  return null;
}
