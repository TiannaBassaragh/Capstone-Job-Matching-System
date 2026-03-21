import { useState } from "react";
import "./styles/EmployerDashboard.css";

const jobs = [
  { id: 1, initials: "BE", bg: "#EDF2FD", color: "#1D3E9E", title: "Backend Engineer", meta: "Remote · posted Jan 28, 2026", status: "active", matches: 61, newCount: 7 },
  { id: 2, initials: "FE", bg: "#EDF2FD", color: "#1D3E9E", title: "Senior Frontend Engineer", meta: "Remote · posted Mar 1, 2026", status: "active", matches: 42, newCount: 5 },
  { id: 3, initials: "DS", bg: "#E1F5EE", color: "#0F6E56", title: "Data Scientist", meta: "Hybrid · posted Feb 20, 2026", status: "active", matches: 28, newCount: 4 },
  { id: 4, initials: "PM", bg: "#FFF3E0", color: "#854F0B", title: "Product Manager", meta: "On-site · posted Feb 10, 2026", status: "expiring", matches: 15, newCount: 0 },
  { id: 5, initials: "UX", bg: "#FBEAF0", color: "#72243E", title: "UX Designer", meta: "Hybrid · posted Jan 15, 2026", status: "expiring", matches: 9, newCount: 0 },
];

const topCandidates = [
  { initials: "AJ", bg: "#EDF2FD", color: "#1D3E9E", name: "Alex Johnson", job: "Senior Frontend Eng.", score: 87 },
  { initials: "MR", bg: "#FBEAF0", color: "#72243E", name: "Maya Roberts", job: "Data Scientist", score: 81 },
  { initials: "JK", bg: "#FFF3E0", color: "#854F0B", name: "James Kim", job: "Senior Frontend Eng.", score: 74 },
];

const activity = [
  { type: "match", text: ["7 new matches", " for Backend Engineer"], time: "Today · 2 hours ago" },
  { type: "match", text: ["5 new matches", " for Senior Frontend Eng."], time: "Today · 5 hours ago" },
  { type: "match", text: ["4 new matches", " for Data Scientist"], time: "Yesterday" },
  { type: "expiring", text: ["Product Manager posting ", "expiring", " in 3 days"], time: "Mar 17, 2026" },
  { type: "posted", text: ["Senior Frontend Engineer posted"], time: "Mar 1, 2026" },
];

function getScoreStyle(score) {
  if (score >= 80) return { color: "#1D6B2E", barColor: score >= 85 ? "#22a84a" : "#4dbb6a" };
  if (score >= 60) return { color: "#BA7517", barColor: "#EF9F27" };
  return { color: "#a32d2d", barColor: "#E24B4A" };
}

export default function EmployerDashboard() {
  return (
    <div className="dash-db">
      <div className="dash-page-wrap">
      <div className="dash-topbar">
        <div>
          <div className="dash-breadcrumb">Pages / Dashboard</div>
          <div className="dash-pagetitle">Dashboard</div>
        </div>
        <div className="dash-topbar-right">
          <span className="dash-chip">Employer</span>
          <div className="dash-avatar">TC</div>
        </div>
      </div>

      <div className="dash-welcome">
        <div className="dash-orb1" /><div className="dash-orb2" /><div className="dash-orb3" />
        <div className="dash-wleft">
          <div className="dash-wgreet">Welcome back,</div>
          <div className="dash-wname">TechCorp Inc.</div>
          <div className="dash-wsub">Company profile active · 5 job postings live</div>
        </div>
        <div className="dash-wstats">
          <div className="dash-ws dash-ws-hi"><span className="dash-wsv">5</span><span className="dash-wsl">active postings</span></div>
          <div className="dash-ws"><span className="dash-wsv">146</span><span className="dash-wsl">total matched</span></div>
          <div className="dash-ws"><span className="dash-wsv">18</span><span className="dash-wsl">new this week</span></div>
          <div className="dash-ws ed-ws-warn"><span className="dash-wsv">2</span><span className="dash-wsl">expiring soon</span></div>
        </div>
      </div>

      <div className="dash-stats-row">
        <div className="dash-scard">
          <div className="dash-sicon" style={{ background: "#EDF2FD" }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2" y="2" width="12" height="12" rx="2.5" stroke="#4B7FE3" strokeWidth="1.4" fill="none"/><path d="M5 8h6M5 5.5h6M5 10.5h4" stroke="#4B7FE3" strokeWidth="1.2" strokeLinecap="round"/></svg>
          </div>
          <div className="dash-sval">5</div><div className="dash-slbl">Active postings</div>
          <div className="dash-sdelta" style={{ background: "#EDF2FD", color: "#1D3E9E" }}>+1 this month</div>
        </div>
        <div className="dash-scard">
          <div className="dash-sicon" style={{ background: "#E1F5EE" }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="5.5" stroke="#0F6E56" strokeWidth="1.4"/><path d="M8 5.5v3l2 1.5" stroke="#0F6E56" strokeWidth="1.3" strokeLinecap="round"/></svg>
          </div>
          <div className="dash-sval">18</div><div className="dash-slbl">New matches</div>
          <div className="dash-sdelta" style={{ background: "#E1F5EE", color: "#0F6E56" }}>+18 this week</div>
        </div>
        <div className="dash-scard">
          <div className="dash-sicon" style={{ background: "#F3EFFE" }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="6" cy="5.5" r="2.5" stroke="#7F77DD" strokeWidth="1.3" fill="none"/><path d="M2 13c0-2.2 1.8-4 4-4s4 1.8 4 4" stroke="#7F77DD" strokeWidth="1.3" strokeLinecap="round" fill="none"/><circle cx="11.5" cy="5.5" r="2" stroke="#7F77DD" strokeWidth="1.2" fill="none"/><path d="M13.5 13c0-1.8-1.3-3.2-2.9-3.4" stroke="#7F77DD" strokeWidth="1.2" strokeLinecap="round"/></svg>
          </div>
          <div className="dash-sval">146</div><div className="dash-slbl">Total candidates matched</div>
          <div className="dash-sdelta" style={{ background: "#F3EFFE", color: "#534AB7" }}>across all jobs</div>
        </div>
        <div className="dash-scard">
          <div className="dash-sicon" style={{ background: "#FFF3E0" }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="5.5" stroke="#BA7517" strokeWidth="1.4" fill="none"/><path d="M8 5v3.5l2.5 1.5" stroke="#BA7517" strokeWidth="1.3" strokeLinecap="round"/></svg>
          </div>
          <div className="dash-sval">2</div><div className="dash-slbl">Expiring soon</div>
          <div className="dash-sdelta" style={{ background: "#FFF3E0", color: "#854F0B" }}>action needed</div>
        </div>
      </div>

      <div className="dash-main">
        <div className="dash-panel">
          <div className="dash-panel-inner">
            <div className="dash-panel-hdr">
              <span className="dash-panel-title">Active job postings</span>
              <button className="ed-panel-btn">+ Post new job</button>
            </div>
            {jobs.map((job, i) => (
              <div key={job.id}>
                {i > 0 && <div className="dash-divider" />}
                <div className="ed-jrow">
                  <div className="ed-jicon" style={{ background: job.bg, color: job.color }}>{job.initials}</div>
                  <div className="ed-jbody">
                    <div className="ed-jtitle">{job.title}</div>
                    <div className="ed-jmeta">{job.meta}</div>
                  </div>
                  <div className="ed-jright">
                    {job.newCount > 0 && <span className="ed-new-tag">+{job.newCount} new</span>}
                    <span className={`ed-jbadge ${job.status === "active" ? "ed-badge-active" : "ed-badge-exp"}`}>
                      {job.status === "active" ? "Active" : "Expiring soon"}
                    </span>
                    <span className="ed-jmatches">{job.matches} matches</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="dash-rcol">
          <div className="dash-panel">
            <div className="dash-panel-inner">
              <div className="dash-panel-hdr" style={{ marginBottom: 11 }}>
                <span className="dash-panel-title">Recent activity</span>
              </div>
              {activity.map((a, i) => (
                <div key={i} className="ed-arow">
                  <div className="ed-adot-wrap">
                    <div className={`ed-adot ${a.type === "match" ? "ed-adot-green" : a.type === "expiring" ? "ed-adot-amber" : "ed-adot-blue"}`} />
                    {i < activity.length - 1 && <div className="ed-aline" />}
                  </div>
                  <div className="ed-abody">
                    <div className="ed-atext">
                      {a.type === "match" && (<><span className="ed-ahigh">{a.text[0]}</span>{a.text[1]}</>)}
                      {a.type === "expiring" && (<>{a.text[0]}<span className="ed-ahigh-warn">{a.text[1]}</span>{a.text[2]}</>)}
                      {a.type === "posted" && a.text[0]}
                    </div>
                    <div className="ed-atime">{a.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="dash-panel">
            <div className="dash-panel-inner">
              <div className="dash-panel-hdr" style={{ marginBottom: 10 }}>
                <span className="dash-panel-title">Top candidates</span>
                <span className="ed-panel-link">View all ↗</span>
              </div>
              {topCandidates.map((c, i) => {
                const { color, barColor } = getScoreStyle(c.score);
                return (
                  <div key={i}>
                    {i > 0 && <div className="dash-divider" />}
                    <div className="ed-crow">
                      <div className="ed-cavatar" style={{ background: c.bg, color: c.color }}>{c.initials}</div>
                      <div className="ed-cbody">
                        <div className="ed-cname">{c.name}</div>
                        <div className="ed-cmeta">{c.job}</div>
                      </div>
                      <div className="ed-cright">
                        <div className="ed-cpct" style={{ color }}>{c.score}%</div>
                        <div className="dash-btrack">
                          <div className="dash-bfill" style={{ width: `${c.score}%`, background: barColor }} />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="ed-up-card">
            <div className="ed-up-arrow">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 10V2M7 2L4.5 5M7 2l2.5 3" stroke="#4B7FE3" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/><path d="M2.5 11.5h9" stroke="#4B7FE3" strokeWidth="1.3" strokeLinecap="round"/></svg>
            </div>
            <div className="ed-up-title">Post a new job description</div>
            <div className="ed-up-sub">PDF or DOCX · drag & drop or click</div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
