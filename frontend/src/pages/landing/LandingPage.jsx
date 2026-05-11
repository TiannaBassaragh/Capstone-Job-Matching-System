import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import AppHeader from "../../components/auth/AppHeader";

export default function LandingPage() {
    const { auth } = useAuth();

    return (
        <div className="tm-root">
            <AppHeader />
            <main className="page-shell">
                <div className="container landing-stack">

                    <section className="hero-grid">
                        <div className="tm-panel hero-copy">
                            <span className="eyebrow">
                                Modern job matching with human-readable feedback
                            </span>
                            <h1>Transparent hiring for candidates and employers.</h1>
                            <p className="muted copy large">
                                Transparent Match helps applicants and recruiters move from resume
                                or job description to qualification checks, ranked matches, and
                                clear explanations of why a result is strong, weak, or incomplete.
                            </p>
                            <div className="cta-row">
                                {auth.loggedIn ? (
                                    <Link className="button primary" to="/dashboard">
                                        Go to dashboard →
                                    </Link>
                                ) : (
                                    <>
                                        <Link className="button primary" to="/sign-up">Create account</Link>
                                        <Link className="button secondary" to="/sign-in">Sign in</Link>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="hero-visual tm-panel hero-blue">
                            <div className="window-bar"><span /><span /><span /></div>
                            <div className="visual-card large-card">
                                <p className="micro-label">TRANSPARENT MATCHING</p>
                                <h3>Track fit with readable feedback.</h3>
                                <div className="score-pill">87%</div>
                            </div>
                            <div className="visual-grid">
                                <div className="visual-card profile-card">
                                    <div className="avatar soft">TM</div>
                                    <div>
                                        <strong>Candidate profile</strong>
                                        <p>Competency-based scoring</p>
                                    </div>
                                    <div className="meter"><span /></div>
                                    <div className="pill-row">
                                        <span className="mini-pill">Skills</span>
                                        <span className="mini-pill">Experience</span>
                                        <span className="mini-pill">Fit</span>
                                    </div>
                                </div>
                                <div className="visual-card stat-card">
                                    <strong>Ranked matches</strong>
                                    <p>Sorted by fit score</p>
                                </div>
                                <div className="visual-card stat-card">
                                    <strong>Gap analysis</strong>
                                    <p>Strengths and gaps shown clearly</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="three-col-grid">
                        <article className="tm-panel feature-card">
                            <h2>Competency-based matching</h2>
                            <p className="muted copy">
                                Candidates and jobs are compared using competencies, required
                                qualifications, and job-fit signals instead of a vague black-box score.
                            </p>
                        </article>
                        <article className="tm-panel feature-card">
                            <h2>Transparent ranking and feedback</h2>
                            <p className="muted copy">
                                The platform explains why a candidate matched, where they ranked,
                                and what strengths or gaps influenced that result.
                            </p>
                        </article>
                        <article className="tm-panel feature-card">
                            <h2>Two-sided workflow</h2>
                            <p className="muted copy">
                                Candidates can upload a resume and track promising roles, while
                                employers can post jobs, shortlist talent, and review ranked matches.
                            </p>
                        </article>
                    </section>

                    <section className="tm-panel section-block">
                        <div className="section-heading">
                            <span className="eyebrow">How the platform works</span>
                            <h2>What this website actually does</h2>
                        </div>
                        <div className="four-step-grid">
                            <article className="step-card">
                                <span className="step-number">01</span>
                                <h3>Collects structured input</h3>
                                <p className="muted copy">Applicants upload resumes while employers submit job descriptions and role requirements.</p>
                            </article>
                            <article className="step-card">
                                <span className="step-number">02</span>
                                <h3>Checks qualifications</h3>
                                <p className="muted copy">The system compares skills, experience, education, and required competencies before ranking.</p>
                            </article>
                            <article className="step-card">
                                <span className="step-number">03</span>
                                <h3>Ranks likely fits</h3>
                                <p className="muted copy">Promising matches are sorted so both sides can focus on the strongest options first.</p>
                            </article>
                            <article className="step-card">
                                <span className="step-number">04</span>
                                <h3>Explains each result</h3>
                                <p className="muted copy">Readable feedback shows what matched well, what was missing, and why the score changed.</p>
                            </article>
                        </div>
                    </section>

                    <section className="tm-panel section-block">
                        <div className="section-heading">
                            <span className="eyebrow">Why it matters</span>
                            <h2>A hiring flow that is easier to trust</h2>
                        </div>
                        <div className="three-col-grid">
                            <article className="feature-card">
                                <h2>For candidates</h2>
                                <p className="muted copy">Applicants can stop guessing why a role feels out of reach and instead see what strengths helped and which gaps reduced the match.</p>
                            </article>
                            <article className="feature-card">
                                <h2>For employers</h2>
                                <p className="muted copy">Recruiters can review talent with more structure, focusing first on candidates who satisfy core requirements and show strong fit.</p>
                            </article>
                            <article className="feature-card">
                                <h2>For the overall process</h2>
                                <p className="muted copy">Transparent explanations make the screening process feel more understandable, consistent, and useful for both sides.</p>
                            </article>
                        </div>
                    </section>

                    <section className="tm-panel cta-banner">
                        <div className="cta-banner-copy">
                            <span className="eyebrow">Get started</span>
                            <h2>Create an account and start matching.</h2>
                            <p className="muted copy">
                                Sign up as a candidate to upload your resume and track job matches,
                                or as a recruiter to post roles and review ranked applicants.
                            </p>
                        </div>
                        <div className="cta-banner-actions">
                            <Link className="button primary cta-button" to="/sign-up">Create account</Link>
                            <Link className="button secondary cta-button" to="/sign-in">I already have an account</Link>
                        </div>
                    </section>

                </div>
            </main>
        </div>
    );
}