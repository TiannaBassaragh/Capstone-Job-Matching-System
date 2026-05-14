import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./Landing.css";

export default function Landing() {
    const { auth } = useAuth();

    if (auth.loggedIn) return <Navigate to="/dashboard" replace />;

    return (
        <div className="landing-shell">

            {/* ── Nav ─────────────────────────────────────────────────── */}
            <nav className="landing-nav">
                <Link to="/" className="landing-nav-logo">
                    <div className="landing-nav-logo-mark">TM</div>
                    Transparent Match
                </Link>
                <div className="landing-nav-links">
                    <Link to="/login"    className="landing-nav-link ghost">Sign in</Link>
                    <Link to="/register" className="landing-nav-link primary">Create account</Link>
                </div>
            </nav>

            <div className="landing-content">

                {/* ── Hero ─────────────────────────────────────────────── */}
                <section className="landing-hero">
                    <div className="landing-hero-copy">
                        <span className="landing-eyebrow">
                            Modern job matching with human-readable feedback
                        </span>
                        <h1 className="landing-hero-h1">
                            Transparent hiring for candidates and employers.
                        </h1>
                        <p className="landing-hero-sub">
                            Transparent Match helps applicants and recruiters move from resume or
                            job description to competency checks, ranked matches, and clear
                            explanations of why a result is strong, weak, or incomplete.
                        </p>
                        <div className="landing-cta-row">
                            <Link to="/register" className="landing-btn primary">Create account</Link>
                            <Link to="/login"    className="landing-btn secondary">Sign in</Link>
                        </div>
                    </div>

                    <div className="landing-hero-visual">
                        <img
                            src="/casual-young-business-people-looking-camera-working-new-office-shot-175441935.webp"
                            alt="Young professionals collaborating in a modern office"
                            className="landing-hero-img"
                        />
                        <div className="landing-hero-img-overlay">
                            <div className="landing-score-pill">87%</div>
                            <span className="landing-hero-img-tag">Competency-based matching</span>
                        </div>
                    </div>
                </section>

                {/* ── Features ─────────────────────────────────────────── */}
                <section className="landing-section-card">
                    <div className="landing-three-col">
                        <div className="landing-feature">
                            <h3>Competency-based matching</h3>
                            <p>
                                Candidates and jobs are compared using O*NET competency dimensions,
                                required proficiency levels, and importance weights — not a vague
                                keyword score.
                            </p>
                        </div>
                        <div className="landing-feature">
                            <h3>Transparent ranking and feedback</h3>
                            <p>
                                The platform explains why a candidate matched, where they ranked,
                                and what strengths or gaps influenced that result — in plain English.
                            </p>
                        </div>
                        <div className="landing-feature">
                            <h3>Two-sided workflow</h3>
                            <p>
                                Candidates upload a resume and track promising roles. Employers post
                                jobs, review ranked matches, and clarify requirements through a
                                structured question system.
                            </p>
                        </div>
                    </div>
                </section>

                {/* ── How it works ─────────────────────────────────────── */}
                <section className="landing-section-card">
                    <div className="landing-section-head">
                        <span className="landing-eyebrow">How the platform works</span>
                        <h2>What this website actually does</h2>
                    </div>
                    <div className="landing-four-col">
                        <div className="landing-step">
                            <div className="landing-step-num">01</div>
                            <h3>Collects structured input</h3>
                            <p>
                                Applicants upload resumes while employers submit job descriptions.
                                An LLM extracts competency profiles from both.
                            </p>
                        </div>
                        <div className="landing-step">
                            <div className="landing-step-num">02</div>
                            <h3>Checks qualifications</h3>
                            <p>
                                The system compares skills, proficiency levels, and required
                                competencies against the O*NET framework before ranking.
                            </p>
                        </div>
                        <div className="landing-step">
                            <div className="landing-step-num">03</div>
                            <h3>Ranks likely fits</h3>
                            <p>
                                Promising matches are scored and sorted so both sides can focus
                                on the strongest options first.
                            </p>
                        </div>
                        <div className="landing-step">
                            <div className="landing-step-num">04</div>
                            <h3>Explains each result</h3>
                            <p>
                                Readable feedback shows what matched well, what was missing, and
                                why the score is what it is.
                            </p>
                        </div>
                    </div>
                </section>

                {/* ── Why it matters ───────────────────────────────────── */}
                <section className="landing-section-card">
                    <div className="landing-section-head">
                        <span className="landing-eyebrow">Why it matters</span>
                        <h2>A hiring flow that is easier to trust</h2>
                    </div>
                    <div className="landing-three-col">
                        <div className="landing-feature">
                            <h3>For candidates</h3>
                            <p>
                                Stop guessing why a role feels out of reach. See exactly what
                                strengths helped and which gaps reduced the match score.
                            </p>
                        </div>
                        <div className="landing-feature">
                            <h3>For employers</h3>
                            <p>
                                Review talent with more structure. Focus first on candidates who
                                satisfy core requirements and show strong competency fit.
                            </p>
                        </div>
                        <div className="landing-feature">
                            <h3>For the overall process</h3>
                            <p>
                                Transparent explanations make the screening process feel more
                                understandable, consistent, and useful for both sides.
                            </p>
                        </div>
                    </div>
                </section>

                {/* ── Image break ─────────────────────────────────────── */}
                <section className="landing-img-break">
                    <div className="landing-img-break-photo">
                        <img
                            src="/images.jpeg"
                            alt="Team meeting discussing candidates around a table"
                        />
                    </div>
                    <div className="landing-img-break-copy">
                        <span className="landing-eyebrow">Built for real workflows</span>
                        <h2>Hiring decisions backed by data, not guesswork.</h2>
                        <p>
                            Every match score comes with a full breakdown — competency gaps,
                            requirement coverage, and plain-English explanations that both
                            sides can act on.
                        </p>
                    </div>
                </section>

                {/* ── CTA banner ───────────────────────────────────────── */}
                <section className="landing-cta-banner">
                    <div className="landing-cta-banner-copy">
                        <h2>Create an account and start matching.</h2>
                        <p>
                            Sign up as a candidate to upload your resume and track job matches,
                            or as a recruiter to post roles and review ranked applicants.
                        </p>
                    </div>
                    <div className="landing-cta-banner-actions">
                        <Link to="/register" className="landing-cta-btn white">Create account</Link>
                        <Link to="/login"    className="landing-cta-btn outline">I already have an account</Link>
                    </div>
                </section>

            </div>
        </div>
    );
}
