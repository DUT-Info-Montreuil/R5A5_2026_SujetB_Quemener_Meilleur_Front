/* =============================================================================
   Types alignés sur ce que vos services renvoient (equipe_service.py,
   tournoi_service.py, match_service.py, message_service.py,
   utilisateur_service.py). Les DTO Pydantic eux-mêmes n'étaient pas fournis :
   si un champ diffère chez vous (ex. mdp exposé, ou des dates sur Tournoi),
   ajustez simplement les interfaces ci-dessous — tout le reste suit.
   ============================================================================= */

export type TournoiStatut = "OUVERT" | "FERME" | "EN_COURS" | "TERMINE";

export interface Tournoi {
  id: number;
  nom: string;
  description: string | null;
  statut: TournoiStatut;
  jeu_id: number;
  equipes_ids: number[];
  // Présents dans tournoi_service (modifier_tournoi les lit/écrit) mais jamais
  // initialisés par creer_tournoi aujourd'hui : optionnels côté front.
  date_debut?: string | null;
  date_fin?: string | null;
}

export interface TournoiDetail extends Tournoi {
  equipes: Equipe[];
  matchs: Match[];
}

export interface TournoiCreatePayload {
  nom: string;
  description?: string | null;
  jeu_id: number;
}

export interface TournoiUpdatePayload {
  nom?: string;
  statut?: TournoiStatut;
  date_debut?: string | null;
  date_fin?: string | null;
}

export interface Equipe {
  id: number;
  nom: string;
  tournoi_id: number;
  joueurs_ids: number[];
}

export interface EquipeDetail extends Equipe {
  tournoi: Tournoi | null;
  joueurs: Utilisateur[];
  matchs: Match[];
  messages: Message[];
}

export interface EquipeCreatePayload {
  nom: string;
  tournoi_id: number;
  joueurs_ids: number[];
}

export interface Match {
  id: number;
  equipe1_id: number;
  equipe2_id: number;
  score_equipe1: number | null;
  score_equipe2: number | null;
}

export interface MatchCreatePayload {
  equipe1_id: number;
  equipe2_id: number;
  score_equipe1: number;
  score_equipe2: number;
}

export interface MatchUpdatePayload {
  score_equipe1?: number;
  score_equipe2?: number;
}

export interface Message {
  id: number;
  equipe_id: number;
  utilisateur_id: number;
  message: string;
}

export interface MessageCreatePayload {
  equipe_id: number;
  utilisateur_id: number;
  message: string;
}

export interface Utilisateur {
  id: number;
  login: string;
  is_admin: boolean;
  // Le service manipule "mdp" côté serveur ; on suppose que UtilisateurOut ne
  // l'expose pas. Si votre DTO le renvoie quand même, ignorez-le simplement ici.
}

export interface UtilisateurDetail extends Utilisateur {
  equipes: Equipe[];
  messages: Message[];
}

export interface UtilisateurCreatePayload {
  login: string;
  mdp: string;
  is_admin: boolean;
}

export interface UtilisateurUpdatePayload {
  login?: string;
  mdp?: string;
  is_admin?: boolean;
}
