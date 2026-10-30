import { tokenStore, UNAUTHORIZED_EVENT } from "./token.ts";

// Base de l'API FastAPI. Configurable via un fichier .env (voir .env.example) :
//   VITE_API_BASE_URL=http://localhost:8000
export const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = tokenStore.get();

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        // Jeton de connexion envoyé à chaque requête (absent pour un visiteur)
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers ?? {}),
      },
    });
  } catch {
    // Erreur réseau : backend injoignable ou CORS bloqué.
    throw new ApiError(
        0,
        `Impossible de joindre l'API (${BASE_URL}${path}). Le backend est-il démarré et le CORS configuré ?`
    );
  }

  // Jeton expiré ou invalide : on prévient App.tsx. Uniquement si un jeton
  // existait : un visiteur sans jeton qui reçoit un 401 n'a pas de session à fermer.
  if (res.status === 401 && token) {
    tokenStore.clear();
    window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
  }

  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      // FastAPI renvoie {"detail": "..."} sur les erreurs (HTTPException / 422 de validation).
      detail = typeof body.detail === "string" ? body.detail : JSON.stringify(body.detail ?? body);
    } catch {
      /* corps non-JSON, on garde res.statusText */
    }
    throw new ApiError(res.status, detail);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) => request<T>(path, { method: "POST", body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) => request<T>(path, { method: "PUT", body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) => request<T>(path, { method: "PATCH", body: JSON.stringify(body) }),
};
