const KEY = "liut.token";

export const tokenStore = {
    get: (): string | null => localStorage.getItem(KEY),
    set: (token: string) => localStorage.setItem(KEY, token),
    clear: () => localStorage.removeItem(KEY),
};

/** Événement émis quand l'API répond 401 (jeton expiré / invalide). */
export const UNAUTHORIZED_EVENT = "liut:unauthorized";