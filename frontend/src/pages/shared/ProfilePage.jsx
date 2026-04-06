import { PageCard } from "../../components";
import { useAuth } from "../../context/AuthContext";
// import "./ProfilePage.css";

export default function ProfilePage() {
    return (
        <PageCard breadcrumb="Settings / Profile" title="Profile">

            <p>Your capstone profile page is showing.</p>

        </PageCard>
    );
}