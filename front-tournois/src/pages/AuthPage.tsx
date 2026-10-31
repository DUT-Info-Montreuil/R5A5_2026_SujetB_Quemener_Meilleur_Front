import { useState } from "react";
import { authApi } from "../api/auth.ts";
import type { AuthUser } from "../api/auth.ts";

interface AuthPageProps {
    onAuthenticated: (user: AuthUser) => void;
}

export default function AuthPage({ onAuthenticated }: AuthPageProps) {
    const [mode, setMode] = useState<"login" | "register">("login");
    const [login, setLogin] = useState("");
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [isAdmin, setIsAdmin] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isRegister = mode === "register";

    async function handleSubmit() {
        setError(null);
        if (!login.trim() || !password) {
            setError("Login et mot de passe obligatoires.");
            return;
        }
        if (isRegister) {
            if (password.length < 8) {
                setError("Le mot de passe doit contenir au moins 8 caractères.");
                return;
            }
            if (password !== confirm) {
                setError("Les mots de passe ne correspondent pas.");
                return;
            }
        }
        setSubmitting(true);
        try {
            const user = isRegister
                ? await authApi.register(login.trim(), password, isAdmin)
                : await authApi.login(login.trim(), password);
            onAuthenticated(user);
        } catch (e: any) {
            setError(e.message ?? "Une erreur est survenue.");
        } finally {
            setSubmitting(false);
        }
    }

    function switchMode() {
        setMode(isRegister ? "login" : "register");
        setError(null);
        setPassword("");
        setConfirm("");
    }

    return (
        <section className="screen active" style={{ maxWidth: 420, margin: "60px auto" }}>
            <div className="page-head">
                <div>
                    <h1>{isRegister ? "Créer un compte" : "Connexion"}</h1>
                    <p className="lede">
                        {isRegister
                            ? "Choisissez un login et un mot de passe."
                            : "Connectez-vous pour accéder aux tournois."}
                    </p>
                </div>
            </div>

            <div className="panel">
                <div className="form-row">
                    <label>Login</label>
                    <input
                        type="text"
                        autoComplete="username"
                        value={login}
                        onChange={(e) => setLogin(e.target.value)}
                    />
                </div>
                <div className="form-row">
                    <label>Mot de passe</label>
                    <input
                        type="password"
                        autoComplete={isRegister ? "new-password" : "current-password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onKeyDown={(e) => !isRegister && e.key === "Enter" && handleSubmit()}
                    />
                </div>
                {isRegister && (
                    <>
                        <div className="form-row">
                            <label>Confirmer le mot de passe</label>
                            <input
                                type="password"
                                autoComplete="new-password"
                                value={confirm}
                                onChange={(e) => setConfirm(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                            />
                        </div>
                    </>
                )}

                {error && (
                    <p className="search-hint" style={{ color: "var(--live)" }}>
                        {error}
                    </p>
                )}

                <button
                    className="btn"
                    style={{ width: "100%", justifyContent: "center", marginTop: 12 }}
                    disabled={submitting}
                    onClick={handleSubmit}
                >
                    {submitting ? "…" : isRegister ? "Créer mon compte" : "Se connecter"}
                </button>

                <p className="search-hint" style={{ marginTop: 14, textAlign: "center" }}>
                    {isRegister ? "Déjà un compte ? " : "Pas encore de compte ? "}
                    <a href="#" onClick={(e) => { e.preventDefault(); switchMode(); }}>
                        {isRegister ? "Se connecter" : "Créer un compte"}
                    </a>
                </p>
            </div>
        </section>
    );
}