import { api } from "./client.ts";

export interface DemandeAdhesion {
  id: number;
  equipe_id: number;
  utilisateur_id: number;
  statut: "EN_ATTENTE" | "ACCEPTEE" | "REFUSEE";
}

export interface DemandeAdhesionPayload {
  equipe_id: number;
  utilisateur_id: number;
}

export const demandesAdhesionApi = {
  lister: (equipeId: number) => api.get<DemandeAdhesion[]>(`/demandes/?equipe_id=${equipeId}`),
  creer: (payload: DemandeAdhesionPayload) => api.post<DemandeAdhesion>("/demandes/", payload),
  accepter: (id: number) => api.patch<DemandeAdhesion>(`/demandes/${id}/accepter`, {}),
  refuser: (id: number) => api.patch<DemandeAdhesion>(`/demandes/${id}/refuser`, {}),
};
