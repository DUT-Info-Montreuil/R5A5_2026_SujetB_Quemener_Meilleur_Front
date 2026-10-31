import { api } from "./client.ts";
import type { Arbre, Tournoi, TournoiDetail, TournoiCreatePayload, TournoiUpdatePayload } from "./types.ts";

export const tournoisApi = {
  lister: () => api.get<Tournoi[]>("/tournois/"),
  detail: (id: number) => api.get<TournoiDetail>(`/tournois/${id}`),
  arbre: (id: number) => api.get<Arbre>(`/tournois/${id}/arbre`),
  creer: (payload: TournoiCreatePayload) => api.post<Tournoi>("/tournois/", payload),
  modifier: (id: number, payload: TournoiUpdatePayload) => api.patch<Tournoi>(`/tournois/${id}`, payload),
};
