import { Outlet } from "react-router-dom";
import { PageCard, SettingsNav } from "../../../components";
import "./SettingsPage.css";

export default function SettingsPage() {
    return (
        <PageCard breadcrumb="Settings" title="Settings">
            <div className="settings-layout">
                <SettingsNav />
                <div className="settings-content">
                    <Outlet />
                </div>
            </div>
        </PageCard>
    );
}
