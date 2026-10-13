import { api } from "./client.ts";
import type { Tournoi, TournoiDetail, TournoiCreatePayload, TournoiUpdatePayload } from "./types.ts";

export const tournoisApi = {
  lister: () => api.get<Tournoi[]>("/tournois/"),
  detail: (id: number) => api.get<TournoiDetail>(`/tournois/${id}`),
  creer: (payload: TournoiCreatePayload) => api.post<Tournoi>("/tournois/", payload),
  modifier: (id: number, payload: TournoiUpdatePayload) => api.patch<Tournoi>(`/tournois/${id}`, payload),
};
