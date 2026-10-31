export type TournoiStatut = "OUVERT" | "FERME" | "EN_COURS" | "TERMINE";

export interface Tournoi {
  id: number;
  nom: string;
  description: string | null;
  statut: TournoiStatut;
  jeu_id: number;
  equipes_ids: number[];
  petite_finale: boolean;
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
  petite_finale?: boolean;
}

export interface TournoiUpdatePayload {
  nom?: string;
  statut?: TournoiStatut;
  petite_finale?: boolean;
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
  capitaine_id: number;
}

export interface EquipeCreatePayload {
  nom: string;
  tournoi_id: number;
  joueurs_ids: number[];
}

export interface Match {
  id: number;
  tournoi_id: number;
  round: number;
  position: number;
  // null tant que l'équipe n'est pas connue (tours suivants) ou pour un bye
  equipe1_id: number | null;
  equipe2_id: number | null;
  // null tant que le match n'est pas joué (score = manches gagnées)
  score_equipe1: number | null;
  score_equipe2: number | null;
  vainqueur_id: number | null;
  next_match_id: number | null;
  next_slot: number | null;
  loser_next_match_id: number | null;
  loser_next_slot: number | null;
  petite_finale: boolean;
  bye: boolean;
}

/* Arbre d'élimination directe (GET /tournois/{id}/arbre) */
export interface ArbreMatch extends Match {
  equipe1_nom: string | null;
  equipe2_nom: string | null;
}

export interface ArbreRound {
  round: number;
  titre: string;
  matchs: ArbreMatch[];
}

export interface Arbre {
  tournoi_id: number;
  rounds: ArbreRound[];
  petite_finale: ArbreMatch | null;
}

export interface MatchUpdatePayload {
  score_equipe1: number;
  score_equipe2: number;
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
