export const candidateNav = [
    { id: "dashboard",     label: "Dashboard",          icon: "dashboard",     path: "/dashboard" },
    { label: "MAIN", section: true },
    { id: "matches",       label: "My matches",         icon: "matches",       path: "/matches",       badge: "6" },
    { id: "resume",        label: "Upload resume",      icon: "resume",        path: "/settings/resume" },
    { label: "ACCOUNT", section: true },
    { id: "notifications", label: "Notifications",      icon: "notifications", path: "/notifications", badge: "3" },
    { id: "settings",      label: "Settings & profile", icon: "settings",      path: "/settings" },
];

export const employerNav = [
    { id: "dashboard",     label: "Dashboard",          icon: "dashboard",     path: "/dashboard" },
    { label: "POSITIONS", section: true },
    { id: "jobs",          label: "Job listings",       icon: "jobs",          path: "/jobs",          badge: "2", badgeWarn: true },
    { id: "newjob",        label: "Post new job",       icon: "newjob",        path: "/new-job" },
    { label: "ACCOUNT", section: true },
    { id: "notifications", label: "Notifications",      icon: "notifications", path: "/notifications", badge: "5" },
    { id: "settings",      label: "Settings & profile", icon: "settings",      path: "/settings" },
];
