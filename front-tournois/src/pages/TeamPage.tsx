import TeamPicker from "../components/team/TeamPicker.tsx";
import TeamDetail from "../components/team/TeamDetail.tsx";

interface TeamPageProps {
    equipeId: number | null;
    currentUserId: number | null;
    onPickEquipe: (id: number) => void;
    onClearEquipe: () => void;
}

export default function TeamPage({ equipeId, currentUserId, onPickEquipe, onClearEquipe }: TeamPageProps) {
    if (equipeId === null) {
        return <TeamPicker currentUserId={currentUserId} onPickEquipe={onPickEquipe} />;
    }
    return <TeamDetail equipeId={equipeId} currentUserId={currentUserId} onClearEquipe={onClearEquipe} />;
}