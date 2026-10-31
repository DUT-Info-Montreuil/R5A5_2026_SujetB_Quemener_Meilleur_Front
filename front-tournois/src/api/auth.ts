import { tokenStore } from "./token.ts";
import { BASE_URL } from "./client.ts";

export interface AuthUser {
    id: number;
    login: string;
    is_admin: boolean;
}

interface TokenResponse {
    access_token: string;
    token_type: string;
    utilisateur: AuthUser;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const res = await fetch(`${BASE_URL}${path}`, {
        ...init,
        headers: { "Content-Type": "application/json", ...(init.headers ?? {}) },
    });
    if (!res.ok) {
        let message = `Erreur ${res.status}`;
        try {
            const body = await res.json();
            if (typeof body.detail === "string") message = body.detail;
            else if (Array.isArray(body.detail)) message = body.detail.map((d: any) => d.msg).join(" · ");
        } catch {
            /* corps non JSON */
        }
        throw new Error(message);
    }
    return res.json();
}

export const authApi = {
    async login(login: string, mot_de_passe: string): Promise<AuthUser> {
        const r = await request<TokenResponse>("/auth/login", {
            method: "POST",
            body: JSON.stringify({ login, mot_de_passe }),
        });
        tokenStore.set(r.access_token);
        return r.utilisateur;
    },

    async register(login: string, mot_de_passe: string, is_admin: boolean): Promise<AuthUser> {
        const r = await request<TokenResponse>("/auth/register", {
            method: "POST",
            body: JSON.stringify({ login, mot_de_passe, is_admin }),
        });
        tokenStore.set(r.access_token);
        return r.utilisateur;
    },

    me(): Promise<AuthUser> {
        return request<AuthUser>("/auth/me", {
            headers: { Authorization: `Bearer ${tokenStore.get()}` },
        });
    },

    logout() {
        tokenStore.clear();
    },
};