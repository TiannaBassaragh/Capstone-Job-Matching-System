import "./WelcomeCard.css";

function StatCard({ value, label, highlight = false, warning = false }) {
    return (
        <div className={`stat-holder ${highlight ? "stat-hi" : ""} ${warning ? "stat-warn" : ""}`}>
            <span className="stat-value">{value}</span>
            <span className="stat-label">{label}</span>
        </div>
    );
}

export default function WelcomeCard({ userName="Guest", greeting="", stats=[]}) {
    return (
        <div className="welcome-card">

            <div className="welcome-orb1" />
            <div className="welcome-orb2" />
            <div className="welcome-orb3" />
            
            <div className="welcome-left">
                <div className="welcome-right">Welcome back,</div>
                <div className="welcome-name">{userName}</div>
                <div className="welcome-sub">{greeting}</div>
            </div>

            <div className="welcome-stats">
                {stats.map((stat, index) => (
                    <StatCard key={index} {...stat} />
                ))}
            </div>

        </div>

    );
}