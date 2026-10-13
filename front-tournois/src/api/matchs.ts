import { api } from "./client.ts";
import type { Match, MatchCreatePayload, MatchUpdatePayload } from "./types.ts";

export const matchsApi = {
  // Note : le contrôleur utilise le préfixe "/match" (singulier, sans slash final).
  lister: () => api.get<Match[]>("/match"),
  creer: (payload: MatchCreatePayload) => api.post<Match>("/match", payload),
  modifier: (id: number, payload: MatchUpdatePayload) => api.put<Match>(`/match/${id}`, payload),
};
