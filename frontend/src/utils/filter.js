// filter.js — filtering logic for both matches and jobs


// ── filterMatches ────────────────────────────────────────────────────────────
//
// filterConfig shape:
// {
//     type: "preset" | "custom",
//     key:  "all" | "80+" | "60+" | "top10" | "new" | "custom",
//     label: string,
//     rules?: {
//         percent: { active: boolean, value: number },  // above X% score
//         top:     { active: boolean, value: number },  // top N results
//     }
// }
//
// Behaviour:
//   neither active  → all matches shown
//   percent only    → score >= percent.value
//   top only        → index < top.value
//   both active     → score >= percent.value AND index < top.value

export function filterMatches( 
    matches, 
    filterConfig={
        type: "preset",
        key: "all",
        label: "All"
    } 
) {

    if (!filterConfig || filterConfig.key === "all") {
        return matches;
    }
    
    if (filterConfig.type === "preset") {
        switch (filterConfig.key) {
            case "80+":
                return matches.filter((match) => match.score >= 80);

            case "60+":
                return matches.filter((match) => match.score >= 60);

            case "top10":
                return matches.filter((_, index) => index < 10);

            case "new":
                return matches.filter((_, index) => index < 5);

            default:
                return matches;
        }
    }
    
    if (filterConfig.type === "custom") {
        const { percent, top } = filterConfig.rules;

        return matches.filter((match, index) => {
            const passPercent = 
                percent.active 
                ? match.score >= percent.value 
                : true;
            const passTop = 
                top.active 
                ? index < top.value 
                : true;
            return passPercent && passTop;
        });
    }

    return matches;
}



// ── filterJobs ───────────────────────────────────────────────────────────────
//
// filterConfig shape:
// {
//     type: "preset" | "custom",
//     key:  "all" | "active" | "expiring" | "inactive" | "new" | "custom",
//     label: string,
//     rules?: {
//         matches:  { active: boolean, value: number },  // at least N matches
//         newCount: { active: boolean, value: number },  // at least N new matches
//     }
// }
//
// Behaviour:
//   neither active   → all jobs shown
//   matches only     → job.matches >= matches.value
//   newCount only    → job.newCount >= newCount.value
//   both active      → job.matches >= matches.value AND job.newCount >= newCount.value

export function filterJobs(
    jobs, 
    filterConfig={
        type: "preset",
        key: "all",
        label: "All"
    } 
) {

    if (!filterConfig || filterConfig.key === "all") {
        return jobs;
    }

    if (filterConfig.type === "preset") {
        switch (filterConfig.key) {
            case "active":
                return jobs.filter((job) => job.status === "active");

            case "expiring": 
                return jobs.filter((job) => job.status === "expiring");
            
            case "inactive": 
                return jobs.filter((job) => job.status === "inactive");
        
            case "new": 
                return jobs.filter((job) => job.newCount > 0);
    
            default: 
                return jobs;
        }
    }

    if (filterConfig.type === "custom") {
        const { matches, newCount } = filterConfig.rules;

        return jobs.filter((job) => {
            const passMatches = 
                matches.active 
                ? job.matches >= matches.value 
                : true;
            const passNewCount = 
                newCount.active 
                ? job.newCount >= newCount.value 
                : true;
            return passMatches && passNewCount;
        });
    }

    return jobs;
}