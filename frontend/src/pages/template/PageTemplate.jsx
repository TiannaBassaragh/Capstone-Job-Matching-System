import { PageCard } from "../../components";
import { useAuth } from "../../context/AuthContext";
// import "./PageTemplate.css";

export default function PageName() {
    return (
        <PageCard breadcrumb="Pages / PageTemplate" title="Page Template">

            {/* Page content goes here */}
            <p>Your capstone template page is showing.</p>

        </PageCard>
    );
}
