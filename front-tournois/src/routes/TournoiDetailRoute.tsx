import { Navigate, useNavigate, useParams } from "react-router-dom";
import TournamentDetailPage from "../pages/TournamentDetailPage.tsx";
import { parseId } from "../hooks/Parseid.ts";

type Props = { currentUserId: number; isAdmin: boolean };

export default function TournoiDetailRoute({ currentUserId, isAdmin }: Props) {
    const navigate = useNavigate();
    const { tournoiId } = useParams();
    const id = parseId(tournoiId);

    if (id === null) return <Navigate to="/tournois" replace />;

    return (
        <TournamentDetailPage
            tournoiId={id}
            currentUserId={currentUserId}
            isAdmin={isAdmin}
            openEquipe={(equipeId) =>
                navigate(`/equipes/${equipeId}`, { state: { fromTournoiId: id } })
            }
            goBack={() => navigate("/tournois")}
        />
    );
}