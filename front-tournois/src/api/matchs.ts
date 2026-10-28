import { api } from "./client.ts";
import type { Match, MatchUpdatePayload } from "./types.ts";

export const matchsApi = {
  // Le contrôleur utilise le préfixe "/matchs" (avec un s).
  lister: () => api.get<Match[]>("/matchs/"),
  modifier: (id: number, payload: MatchUpdatePayload) =>
      api.patch<Match>(`/matchs/${id}`, payload),
};