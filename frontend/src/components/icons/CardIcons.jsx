import { 
    Target, 
    Users, 
    BarChart3, 
    Briefcase, 
    Clock, 
    AlertTriangle, 
    Percent, 
    Star, 
    TrendingUp, 
    // User, 
    // FileText,
    // Search,
    // CheckCircle,
    // XCircle,
    // ArrowUpRight
} from "lucide-react";

export const CardIcons = {
    matches: (color) => <Target size={16} color={color} />,
    users: (color) => <Users size={16} color={color} />,
    activity: (color) => <BarChart3 size={16} color={color} />,
    activePostings: (color) => <Briefcase size={16} color={color} />,
    time: (color) => <Clock size={16} color={color} />,
    warning: (color) => <AlertTriangle size={16} color={color} />,
    topMatches: (color) => <Star size={16} color={color} />,
    completion: (color) => <Percent size={16} color={color} />,
    new: (color) => <TrendingUp size={16} color={color} />
    // Profile → User
    // Resume → FileText
    // Search/filter → Search
    // Success → CheckCircle
    // Rejected → XCircle
    // Growth → ArrowUpRight
};