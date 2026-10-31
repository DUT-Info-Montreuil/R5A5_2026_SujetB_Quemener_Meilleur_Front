import { api } from "./client.ts";
import type { Equipe, EquipeDetail, EquipeCreatePayload } from "./types.ts";

export const equipesApi = {
  lister: () => api.get<Equipe[]>("/equipes/"),
  detail: (id: number) => api.get<EquipeDetail>(`/equipes/${id}`),
  creer: (payload: EquipeCreatePayload) => api.post<Equipe>("/equipes/", payload),
  // Pas de PUT/PATCH /equipes/{id} côté backend actuel : renommer une équipe,
  // changer les rôles, exclure un joueur ou transférer le capitanat ne sont
  // donc pas branchables tant que ces routes n'existent pas côté API.
};
