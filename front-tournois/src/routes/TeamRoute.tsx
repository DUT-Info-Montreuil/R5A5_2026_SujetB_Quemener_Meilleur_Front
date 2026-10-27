import { useLocation, useNavigate, useParams } from "react-router-dom";
import TeamPage from "../pages/TeamPage.tsx";
import { parseId } from "../hooks/Parseid.ts";

// État passé via navigate() pour que l'admin puisse revenir au tournoi consulté
type TeamLocationState = { fromTournoiId?: number } | null;

type Props = { currentUserId: number; isAdmin: boolean };

export default function TeamRoute({ currentUserId, isAdmin }: Props) {
    const navigate = useNavigate();
    const location = useLocation();
    const { equipeId } = useParams();
    const id = parseId(equipeId);
    const state = location.state as TeamLocationState;

    return (
        <TeamPage
            equipeId={id}
            currentUserId={currentUserId}
            onPickEquipe={(newId) =>
                navigate(`/equipes/${newId}`, { state: location.state })
            }
            onClearEquipe={() => {
                // Un admin n'a pas de « Mes équipes » : retour au tournoi consulté
                if (isAdmin) {
                    navigate(
                        state?.fromTournoiId != null
                            ? `/tournois/${state.fromTournoiId}`
                            : "/tournois",
                    );
                } else {
                    navigate("/equipes");
                }
            }}
        />
    );
}