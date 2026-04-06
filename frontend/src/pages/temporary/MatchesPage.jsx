import { useNavigate } from "react-router-dom";
import { PageCard } from "../../components";
import { useAuth } from "../../context/AuthContext";
// import "./MatchesPage.css";

export default function MatchesPage() {
    const navigate = useNavigate();

    return (
        <PageCard breadcrumb="Matches" title="Matches Page">

            <p>Your capstone match list page is showing.</p>
            <br/>
            <button onClick={() => navigate("./match-details")}>Go to Match Details</button>
    
        </PageCard>
    );
}