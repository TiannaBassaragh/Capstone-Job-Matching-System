import { useState } from "react";
import "./styles/CandidateDashboard.css";

const matches = [
  { id: 1, initials: "GG", bg: "#E8F2FF", color: "#1a55a8", title: "Senior Frontend Engineer", meta: "Google · Remote · $140k – $180k", score: 87 },
  { id: 2, initials: "SP", bg: "#E8FFF4", color: "#1a7a4a", title: "Full Stack Developer", meta: "Spotify · Hybrid · $120k – $155k", score: 81 },
  { id: 3, initials: "SF", bg: "#FFF6E8", color: "#a06010", title: "React Developer", meta: "Salesforce · On-site · $110k – $140k", score: 74 },
  { id: 4, initials: "SL", bg: "#F3F0FF", color: "#5a40c0", title: "UI Engineer", meta: "Slack · Remote · $105k – $130k", score: 68 },
  { id: 5, initials: "SQ", bg: "#FFF0F5", color: "#a0305a", title: "Software Engineer II", meta: "Square · Hybrid · $100k – $125k", score: 55 },
  { id: 6, initials: "NT", bg: "#FFF0F0", color: "#903030", title: "Frontend Engineer", meta: "Netflix · Remote · $130k – $160k", score: 48 },
];

const sortOptions = [
  "Best overall match",
  "Highest percentile fit",
  "Highest pay",
  "Most recently posted",
];

function getScoreStyle(score) {
  if (score >= 80) return { color: "#1D6B2E", barColor: score >= 85 ? "#22a84a" : "#4dbb6a" };
  if (score >= 60) return { color: "#BA7517", barColor: "#EF9F27" };
  return { color: "#a32d2d", barColor: "#E24B4A" };
}

export default function CandidateDashboard() {
  const [activeFilter, setActiveFilter] = useState("all");
  const [customOpen, setCustomOpen] = useState(false);
  const [cfTab, setCfTab] = useState("pct");
  const [pctVal, setPctVal] = useState(70);
  const [topVal, setTopVal] = useState(10);
  const [logic, setLogic] = useState("and");
  const [activeTag, setActiveTag] = useState(null);
  const [activeSort, setActiveSort] = useState(0);

  const handleFilterPill = (key) => {
    setActiveFilter(key);
    setCustomOpen(false);
    setActiveTag(null);
  };

  const handleCustomToggle = () => {
    setCustomOpen((o) => !o);
    if (!customOpen) setActiveFilter("custom");
    else { setActiveFilter("all"); setActiveTag(null); }
  };

  const handleApply = () => {
    const tag = logic === "and"
      ? `>${pctVal}% AND top ${topVal}`
      : `>${pctVal}% OR top ${topVal}`;
    setActiveTag(tag);
  };

  const step = (val, setter, delta, min, max, stepSize = 1) => {
    setter(Math.min(max, Math.max(min, Math.round((val + delta) / stepSize) * stepSize)));
  };

  const filteredMatches = matches.filter((m, i) => {
    if (activeTag) {
      if (logic === "and") return m.score >= pctVal && i < topVal;
      return m.score >= pctVal || i < topVal;
    }
    if (activeFilter === "80+") return m.score >= 80;
    if (activeFilter === "60+") return m.score >= 60;
    if (activeFilter === "top20") return i < 5;
    if (activeFilter === "new") return i < 2;
    return true;
  });

  return (
    <div className="dash-db">
      <div className="dash-page-wrap">
      <div className="dash-topbar">
        <div>
          <div className="dash-breadcrumb">Pages / Dashboard</div>
          <div className="dash-pagetitle">Dashboard</div>
        </div>
        <div className="dash-topbar-right">
          <span className="dash-chip">Candidate</span>
          <div className="dash-avatar">AJ</div>
        </div>
      </div>

      <div className="dash-welcome">
        <div className="dash-orb1" /><div className="dash-orb2" /><div className="dash-orb3" />
        <div className="dash-wleft">
          <div className="dash-wgreet">Welcome back,</div>
          <div className="dash-wname">Alex Johnson</div>
          <div className="dash-wsub">Your profile is active · last updated Mar 12</div>
        </div>
        <div className="dash-wstats">
          <div className="dash-ws dash-ws-hi"><span className="dash-wsv">87%</span><span className="dash-wsl">top match</span></div>
          <div className="dash-ws"><span className="dash-wsv">24</span><span className="dash-wsl">total matches</span></div>
          <div className="dash-ws"><span className="dash-wsv">6</span><span className="dash-wsl">new this week</span></div>
          <div className="dash-ws"><span className="dash-wsv">92%</span><span className="dash-wsl">profile done</span></div>
        </div>
      </div>

      <div className="dash-stats-row">
        <div className="dash-scard">
          <div className="dash-sicon" style={{ background: "#E1F5EE" }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="5.5" stroke="#0F6E56" strokeWidth="1.4"/><path d="M8 5.5v3l2 1.5" stroke="#0F6E56" strokeWidth="1.3" strokeLinecap="round"/></svg>
          </div>
          <div className="dash-sval">6</div>
          <div className="dash-slbl">New matches</div>
          <div className="dash-sdelta" style={{ background: "#E1F5EE", color: "#0F6E56" }}>+6 this week</div>
        </div>
        <div className="dash-scard">
          <div className="dash-sicon" style={{ background: "#FFF3E0" }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 2l1.8 3.6L14 6.3l-3 2.9.7 4.1L8 11.4l-3.7 1.9.7-4.1-3-2.9 4.2-.7z" stroke="#BA7517" strokeWidth="1.3" strokeLinejoin="round" fill="none"/></svg>
          </div>
          <div className="dash-sval">87%</div>
          <div className="dash-slbl">Best match score</div>
          <div className="dash-sdelta" style={{ background: "#FFF3E0", color: "#854F0B" }}>Google · SWE</div>
        </div>
        <div className="dash-scard">
          <div className="dash-sicon" style={{ background: "#F3EFFE" }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2" y="3" width="12" height="10" rx="2" stroke="#7F77DD" strokeWidth="1.3" fill="none"/><path d="M5 7h6M5 10h4" stroke="#7F77DD" strokeWidth="1.2" strokeLinecap="round"/></svg>
          </div>
          <div className="dash-sval">24</div>
          <div className="dash-slbl">Total matches</div>
          <div className="dash-sdelta" style={{ background: "#F3EFFE", color: "#534AB7" }}>All time</div>
        </div>
        <div className="dash-scard">
          <div className="dash-sicon" style={{ background: "#FBEAF0" }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="6" cy="5" r="2.5" stroke="#D4537E" strokeWidth="1.3" fill="none"/><path d="M2 13c0-2.2 1.8-4 4-4s4 1.8 4 4" stroke="#D4537E" strokeWidth="1.3" strokeLinecap="round" fill="none"/><path d="M11 7.5c1.1.4 2 1.5 2 3" stroke="#D4537E" strokeWidth="1.2" strokeLinecap="round"/><circle cx="11" cy="5" r="1.5" stroke="#D4537E" strokeWidth="1.2" fill="none"/></svg>
          </div>
          <div className="dash-sval">3</div>
          <div className="dash-slbl">Employers viewed</div>
          <div className="dash-sdelta" style={{ background: "#FBEAF0", color: "#993556" }}>your profile</div>
        </div>
      </div>

      <div className="dash-main">
        <div className="dash-panel">
          <div className="dash-panel-inner">
            <div className="dash-panel-hdr">
              <span className="dash-panel-title">Your matches</span>
              <button className="cd-panel-action">View all 24 ↗</button>
            </div>

            <div className="filter-pill-row">
              {[
                { key: "all", label: "All" },
                { key: "80+", label: "80%+ match" },
                { key: "60+", label: "60%+ match" },
                { key: "top20", label: "Top 20" },
                { key: "new", label: "New this week" },
              ].map(({ key, label }) => (
                <span
                  key={key}
                  className={`filter-pill${activeFilter === key && !customOpen ? " filter-pill-on" : ""}`}
                  onClick={() => handleFilterPill(key)}
                >
                  {label}
                </span>
              ))}
              <span
                className={`filter-pill filter-pill-cp${customOpen ? " filter-pill-on" : ""}`}
                onClick={handleCustomToggle}
              >
                + Custom filter
              </span>
            </div>
          </div>

          {customOpen && (
            <div className="cd-slim-bar">
              <span className="cd-sblbl">Above</span>
              <div className="cd-stepper">
                <button className="cd-sbtn" onClick={() => step(pctVal, setPctVal, -5, 0, 100, 5)}>−</button>
                <div className="cd-sdiv" />
                <input className="cd-sinput" type="number" value={pctVal} min={0} max={100} step={5}
                  onChange={(e) => setPctVal(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))} />
                <div className="cd-sdiv" />
                <button className="cd-sbtn" onClick={() => step(pctVal, setPctVal, 5, 0, 100, 5)}>+</button>
              </div>
              <span className="cd-sbunit">% match</span>
              <select className="cd-lgsel" value={logic} onChange={(e) => setLogic(e.target.value)}>
                <option value="and">AND</option>
                <option value="or">OR</option>
              </select>
              <span className="cd-sblbl">top</span>
              <div className="cd-stepper">
                <button className="cd-sbtn" onClick={() => step(topVal, setTopVal, -1, 1, 50)}>−</button>
                <div className="cd-sdiv" />
                <input className="cd-sinput" type="number" value={topVal} min={1} max={50} step={1}
                  onChange={(e) => setTopVal(Math.min(50, Math.max(1, parseInt(e.target.value) || 1)))} />
                <div className="cd-sdiv" />
                <button className="cd-sbtn" onClick={() => step(topVal, setTopVal, 1, 1, 50)}>+</button>
              </div>
              <span className="cd-sbunit">results</span>
              <button className="cd-apbtn" onClick={handleApply}>Apply</button>
              {activeTag && <span className="cd-rtag">{activeTag}</span>}
            </div>
          )}

          <div className="dash-panel-inner" style={{ paddingTop: 6 }}>
            {filteredMatches.length === 0 && (
              <div className="cd-nomatch">No matches for this filter.</div>
            )}
            {filteredMatches.map((m, i) => {
              const { color, barColor } = getScoreStyle(m.score);
              return (
                <div key={m.id}>
                  {i > 0 && <div className="dash-divider" />}
                  <div className="cd-mrow">
                    <div className="cd-mlogo" style={{ background: m.bg, color: m.color }}>{m.initials}</div>
                    <div className="cd-mbody">
                      <div className="cd-mtitle">{m.title}</div>
                      <div className="cd-mmeta">{m.meta}</div>
                    </div>
                    <div className="cd-mright">
                      <div className="cd-mpct" style={{ color }}>{m.score}%</div>
                      <div className="dash-btrack">
                        <div className="dash-bfill" style={{ width: `${m.score}%`, background: barColor }} />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="dash-rcol">
          <div className="dash-panel">
            <div className="dash-panel-inner">
              <div className="dash-panel-hdr" style={{ marginBottom: 11 }}>
                <span className="dash-panel-title">Sort by</span>
              </div>
              {sortOptions.map((label, i) => (
                <div
                  key={i}
                  className={`cd-ropt${activeSort === i ? " cd-ropt-on" : ""}`}
                  onClick={() => setActiveSort(i)}
                >
                  <div className={`cd-rradio${activeSort === i ? " cd-rradio-on" : ""}`}>
                    {activeSort === i && <div className="cd-rdot" />}
                  </div>
                  <span className={`cd-rlbl${activeSort === i ? " cd-rlbl-on" : ""}`}>{label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="dash-panel">
            <div className="dash-panel-inner">
              <div className="dash-panel-hdr" style={{ marginBottom: 11 }}>
                <span className="dash-panel-title">My resume</span>
              </div>
              <div className="cd-resfile">
                <div className="cd-resicon">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 1h5.5l3 3v9H3V1z" stroke="#c5d9fd" strokeWidth="1.2" fill="none" strokeLinejoin="round"/><path d="M8.5 1v4h4" stroke="#93b8fb" strokeWidth="1.1" fill="none"/><path d="M5 7h4M5 9.5h3" stroke="#93b8fb" strokeWidth="1.1" strokeLinecap="round"/></svg>
                </div>
                <div>
                  <div className="cd-resname">alex_johnson_resume_v3.pdf</div>
                  <div className="cd-resdate">Uploaded Mar 12, 2026</div>
                </div>
              </div>
              <div className="cd-upzone">
                <div className="cd-uparrow">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 10V2M7 2L4.5 5M7 2l2.5 3" stroke="#4B7FE3" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/><path d="M2.5 11.5h9" stroke="#4B7FE3" strokeWidth="1.3" strokeLinecap="round"/></svg>
                </div>
                <div className="cd-uptitle">Upload new resume</div>
                <div className="cd-upsub">PDF or DOCX · drag & drop or click</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
