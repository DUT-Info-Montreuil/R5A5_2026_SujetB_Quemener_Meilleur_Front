import { api } from "./client.ts";
import type {
  Utilisateur,
  UtilisateurDetail,
  UtilisateurCreatePayload,
  UtilisateurUpdatePayload,
} from "./types.ts";

export const utilisateursApi = {
  lister: () => api.get<Utilisateur[]>("/utilisateurs/"),
  detail: (id: number) => api.get<UtilisateurDetail>(`/utilisateurs/${id}`),
  creer: (payload: UtilisateurCreatePayload) => api.post<Utilisateur>("/utilisateurs/", payload),
  modifier: (id: number, payload: UtilisateurUpdatePayload) =>
    api.patch<Utilisateur>(`/utilisateurs/${id}`, payload),
};
