import { useNavigate } from "react-router-dom";
import { PageCard } from "../../components";
import { useAuth } from "../../context/AuthContext"

export default function PageName() {
    const navigate = useNavigate();
    
    return (
        <PageCard breadcrumb="Error Page" title="Error Page!">

            {/* Page content goes here */}
            <p>404: This page does not exist.</p>
            <br/>
            <button onClick={() => navigate("/dashboard")}>Click here to go to home.</button>

        </PageCard>
    );
}
