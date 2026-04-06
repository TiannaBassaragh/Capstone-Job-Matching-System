import { PageCard } from "../../components";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
// import "./MatchDetails.css";

export default function MatchesDetails() {
    const navigate = useNavigate();

    return (
        <PageCard breadcrumb="Matches / Match X" title="Match X Details">

            <p>Your capstone match details page is showing.</p>
            <br/>
            <button onClick={() => navigate("/matches")}>Go back to Matches List</button>

        </PageCard>
    );
}