// NotificationData.js — fake notifications (swap with backend later)

export const notifications = [
    {
        id: 1,
        type: "match",
        title: "3 new matches found",
        desc: "Airbnb, Twitter and Microsoft posted roles that match your profile.",
        time: "2 hours ago",
        group: "today",
        read: false,
        link: "/matches",
    },
    {
        id: 2,
        type: "viewed",
        title: "A recruiter viewed your profile",
        desc: "Someone from Spotify looked at your profile.",
        time: "5 hours ago",
        group: "today",
        read: false,
        link: "/settings/profile",
    },
    {
        id: 3,
        type: "expiring",
        title: "Job expiring soon",
        desc: "The UI Engineer role at Slack closes in 2 days. You matched at 68%.",
        time: "Yesterday",
        group: "week",
        read: false,
        link: "/matches/4",
    },
    {
        id: 4,
        type: "system",
        title: "Resume processed successfully",
        desc: "Your matches have been updated based on your new resume.",
        time: "3 days ago",
        group: "week",
        read: true,
        link: "/settings/resume",
    },
    {
        id: 5,
        type: "match",
        title: "5 new matches found",
        desc: "Google, Spotify, Salesforce and 2 others matched your profile.",
        time: "4 days ago",
        group: "week",
        read: true,
        link: "/matches",
    },
    {
        id: 6,
        type: "system",
        title: "Welcome to the platform",
        desc: "Your account is set up and your profile is active.",
        time: "Mar 1, 2026",
        group: "earlier",
        read: true,
        link: "/dashboard",
    },
];

export const notificationTypeConfig = {
    match:    { icon: "ti-sparkles",   bg: "#E1F5EE", color: "#0F6E56" },
    expiring: { icon: "ti-clock",      bg: "#FAEEDA", color: "#854F0B" },
    system:   { icon: "ti-file-check", bg: "#EDF2FD", color: "#1D3E9E" },
    viewed:   { icon: "ti-eye",        bg: "#FBEAF0", color: "#72243E" },
};

export const groupLabels = {
    today:   "Today",
    week:    "This week",
    earlier: "Earlier",
};
