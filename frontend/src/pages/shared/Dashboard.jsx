import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { 
    WelcomeCard, 
    StatsCard, 
    PageCard,
    JobPostsPanel, 
    MatchesPanel, 
    SortPanel, 
    TopCandidatesPanel,
    UploadPanel  
} from "../../components";

import { 
    statsRow, 
    highlights, 
    panelContent, 
    employerJobs, 
    candidateMatches, 
    sortOptions, 
    employerTopCandidates,
} from "../../fake-data/DashboardData";

import './Dashboard.css'


export default function Dashboard() {
    const { auth } = useAuth();

    if (!auth?.userType) {
        return <Navigate to="/" replace />;
    }
    
    const userTypeGreeting = {
        candidate: "Your profile is active · last updated never",
        employer: "Company profile active  · No job postings live",
    };

    const uploadData = panelContent[auth.userType] || {};

    return (
        <PageCard 
            breadcrumb="Pages / Dashboard" 
            title="Dashboard"
        >

            <WelcomeCard 
                userName={auth.userName}
                greeting={userTypeGreeting[auth.userType]}
                stats={highlights[auth.userType]}
            />

            <div className="stats-row-wrapper">
                {statsRow[auth.userType]?.map((stat, index) => (
                    <StatsCard key={index} {...stat} />
                ))}
            </div>

            <div className="dash-main">
                {auth.userType === "candidate" 
                ? ( <MatchesPanel matches={candidateMatches} />) 
                : auth.userType === "employer" 
                    ? ( <JobPostsPanel jobs={employerJobs} />) 
                    : ( <Navigate to="/" replace />)
                }
                
                <div className="dash-rcol">
                    {auth.userType === "candidate" 
                    ? ( <SortPanel options={sortOptions} /> ) 
                    : auth.userType === "employer" 
                        ? ( <TopCandidatesPanel topCandidates={employerTopCandidates}/> ) 
                        : ( <Navigate to="/" replace /> )
                    }
                    
                    <UploadPanel 
                        userType={auth.userType} 
                        currentFileName={uploadData?.currentFileName}
                        currentFileDate={uploadData?.currentFileDate}
                        onUploadClick={() => console.log("Clicked: upload button")}
                    />
                </div>
            </div>

        </PageCard>
    );
}