// src/pages/LandingPage.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import Icon from "../components/ui/Icon";
import { DonutScore } from "../components/ui/Charts";
import { faqs, companyLogos, mockMentors } from "../utils/mockData";

const features = [
    { icon: "🎯", title: "ATS Score Analysis", desc: "Get a comprehensive ATS score breakdown across formatting, keywords, experience, education, and skills.", color: "#E84855" },
    { icon: "🧠", title: "AI Skill Gap Detection", desc: "Our AI maps your current skills against your target role requirements, identifying exactly what you need to learn.", color: "#3D5A80" },
    { icon: "⚡", title: "Smart Suggestions", desc: "Receive prioritized, actionable recommendations with before/after examples. Turn generic bullets into achievements.", color: "#FF6B35" },
    { icon: "🗺️", title: "Career Roadmap", desc: "Get a personalized step-by-step roadmap with milestones, learning resources, and timelines.", color: "#6B46C1" },
    { icon: "👥", title: "Expert Mentorship", desc: "Connect with verified professionals from Google, Meta, Amazon, and more. Book 1:1 sessions.", color: "#059669" },
    { icon: "📊", title: "Progress Analytics", desc: "Track your improvement over time. See how your ATS scores evolve with each resume iteration.", color: "#DC6B19" },
];

export default function LandingPage() {
    const [openFaq, setOpenFaq] = useState(null);
    const navigate = useNavigate();

    return (
        <div style={{ background: "var(--bg)", minHeight: "100vh" }}>
            <Navbar />

            {/* ── Hero ── */}
            <section className="hero-section" style={{ position: "relative", overflow: "hidden" }}>
                <div className="orb" style={{ width: 600, height: 600, background: "rgba(232,72,85,0.06)", top: -200, right: -200 }} />
                <div className="orb" style={{ width: 400, height: 400, background: "rgba(61,90,128,0.08)", bottom: -100, left: -100 }} />

                <div className="container" style={{ position: "relative", zIndex: 1 }}>
                    <div style={{ maxWidth: 760, margin: "0 auto", textAlign: "center" }}>
                        <div style={{ display: "inline-flex", marginBottom: 28, animation: "fadeUp 0.5s ease" }}>
                            <div className="badge-premium">
                                <div className="badge-glow-wrap" />
                                <div className="badge-shine" />
                                <Icon name="sparkle" size={16} color="var(--accent)" style={{ animation: "float-mini 2s ease-in-out infinite" }} />
                                <span style={{ 
                                    fontFamily: "var(--font-display)", 
                                    fontWeight: 800, 
                                    fontSize: 12, 
                                    color: "var(--primary)",
                                    letterSpacing: "0.05em",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 4
                                }}>
                                    SMART <span style={{ color: "var(--accent)" }}>AI</span>
                                </span>
                            </div>
                        </div>

                        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(42px,6vw,72px)", fontWeight: 800, lineHeight: 1.05, letterSpacing: "-0.03em", color: "var(--primary)", marginBottom: 24, animation: "fadeUp 0.6s 0.1s ease both" }}>
                            Forge Your Path to Your{" "}
                            <span style={{ color: "var(--accent)" }}>Dream Role</span>
                        </h1>

                        <p style={{ fontSize: "clamp(16px,2vw,19px)", color: "var(--text-muted)", lineHeight: 1.7, maxWidth: 600, margin: "0 auto 40px", animation: "fadeUp 0.6s 0.2s ease both" }}>
                            Upload your resume, get an instant ATS score, identify skill gaps, and connect with expert mentors — all powered by cutting-edge AI.
                        </p>

                        <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap", animation: "fadeUp 0.6s 0.3s ease both" }}>
                            <button className="btn btn-primary" style={{ fontSize: 16, padding: "16px 36px" }} onClick={() => navigate("/signup")}>
                                Start for free <Icon name="arrow" size={16} />
                            </button>
                            <button 
                                className="btn btn-ghost" 
                                style={{ fontSize: 16, padding: "16px 36px" }}
                                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                            >
                                See How It Works
                            </button>
                        </div>

                        <div style={{ display: "flex", gap: 40, justifyContent: "center", marginTop: 60, animation: "fadeUp 0.6s 0.4s ease both" }}>
                            {[["10K+", "Resumes Analyzed"], ["92%", "Interview Success Rate"], ["500+", "Expert Mentors"]].map(([num, label]) => (
                                <div key={label} style={{ textAlign: "center" }}>
                                    <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 28, color: "var(--primary)", letterSpacing: "-0.03em" }}>{num}</div>
                                    <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>{label}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Dashboard mockup */}
                    <div className="hero-mockup" style={{ marginTop: 70, animation: "fadeUp 0.8s 0.5s ease both" }}>
                        <div className="glass" style={{ border: "1px solid rgba(232,72,85,0.15)", borderRadius: 24, padding: 24, maxWidth: 900, margin: "0 auto", boxShadow: "0 32px 80px rgba(26,26,46,0.12), 0 0 0 1px rgba(255,255,255,0.8) inset" }}>
                            <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
                                {["#FF5F57", "#FEBC2E", "#28C840"].map(c => <div key={c} style={{ width: 12, height: 12, borderRadius: "50%", background: c }} />)}
                                <div style={{ flex: 1, height: 12, background: "var(--bg-2)", borderRadius: 6, marginLeft: 8, display: "flex", alignItems: "center", paddingLeft: 10 }}>
                                    <span style={{ fontSize: 9, color: "var(--text-muted)" }}>app.pathforge.ai/dashboard</span>
                                </div>
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 16, height: 280 }}>
                                <div style={{ background: "var(--primary)", borderRadius: 14, padding: "16px 12px", display: "flex", flexDirection: "column", gap: 6 }}>
                                    <div style={{ color: "white", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 13, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                                        <div style={{ width: 20, height: 20, background: "var(--accent)", borderRadius: 5, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800 }}>P</div>
                                        PathForge AI
                                    </div>
                                    {["Overview", "Resumes", "Find Mentor"].map((item, i) => (
                                        <div key={item} style={{ padding: "8px 10px", borderRadius: 7, background: i === 0 ? "rgba(232,72,85,0.25)" : "transparent", color: i === 0 ? "white" : "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: 500, display: "flex", alignItems: "center", gap: 6 }}>
                                            <span>{["🏠", "📄", "👥"][i]}</span>{item}
                                        </div>
                                    ))}
                                </div>
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
                                    <div style={{ background: "white", borderRadius: 12, padding: 16, display: "flex", flexDirection: "column", gap: 8, border: "1px solid var(--border)" }}>
                                        <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.05em" }}>ATS Score</div>
                                        <DonutScore score={78} size={64} />
                                        <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Primary Resume</div>
                                    </div>
                                    <div style={{ background: "white", borderRadius: 12, padding: 16, border: "1px solid var(--border)" }}>
                                        <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.05em", marginBottom: 10 }}>Skill Gap</div>
                                        {["Kubernetes", "AWS", "Redis"].map(s => (
                                            <div key={s} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6, fontSize: 11 }}>
                                                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent)", flexShrink: 0 }} />{s}
                                            </div>
                                        ))}
                                    </div>
                                    <div style={{ background: "white", borderRadius: 12, padding: 16, border: "1px solid var(--border)", gridColumn: "span 2" }}>
                                        <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.05em", marginBottom: 8 }}>Score Breakdown</div>
                                        <div style={{ display: "flex", gap: 8 }}>
                                            {["Formatting", "Keywords", "Experience", "Education", "Skills"].map((label, i) => {
                                                const vals = [85, 72, 80, 90, 65];
                                                const col = vals[i] >= 80 ? "#22c55e" : vals[i] >= 70 ? "#FF6B35" : "#E84855";
                                                return (
                                                    <div key={label} style={{ flex: 1, textAlign: "center" }}>
                                                        <div style={{ height: 40, background: "var(--bg)", borderRadius: 6, display: "flex", alignItems: "flex-end", justifyContent: "center", overflow: "hidden" }}>
                                                            <div style={{ width: "60%", background: col, borderRadius: "4px 4px 0 0", height: `${vals[i]}%` }} />
                                                        </div>
                                                        <div style={{ fontSize: 9, color: "var(--text-muted)", marginTop: 4 }}>{label.slice(0, 4)}</div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Company Ticker ── */}
            <div style={{ background: "var(--primary)", padding: "20px 0", overflow: "hidden" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12, justifyContent: "center" }}>
                    <div style={{ height: 1, width: 40, background: "rgba(255,255,255,0.2)" }} />
                    <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase" }}>Professionals from these companies trust us</span>
                    <div style={{ height: 1, width: 40, background: "rgba(255,255,255,0.2)" }} />
                </div>
                <div className="ticker-wrap">
                    <div className="ticker-content">
                        {[...companyLogos, ...companyLogos].map((logo, i) => (
                            <div key={i} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "0 36px", color: "rgba(255,255,255,0.7)", fontSize: 18, fontWeight: 700, fontFamily: "var(--font-display)", flexShrink: 0 }}>
                                <div style={{ width: 8, height: 8, borderRadius: "50%", background: logo.color, opacity: 0.8 }} />
                                {logo.name}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Features ── */}
            <section id="features" className="section">
                <div className="container">
                    <div style={{ textAlign: "center", marginBottom: 64 }}>
                        <span className="badge" style={{ background: "rgba(61,90,128,0.1)", color: "var(--accent-3)", marginBottom: 16 }}>What We Offer</span>
                        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(32px,4vw,48px)", fontWeight: 800, letterSpacing: "-0.03em", color: "var(--primary)", marginBottom: 16 }}>
                            Everything you need to<br />land your dream job
                        </h2>
                    </div>
                    <div className="grid-3">
                        {features.map((f, i) => (
                            <div key={i} className="feature-card hover-lift">
                                <div className="icon-box" style={{ background: `${f.color}15` }}><span style={{ fontSize: 24 }}>{f.icon}</span></div>
                                <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18, marginBottom: 10, color: "var(--primary)" }}>{f.title}</h3>
                                <p style={{ color: "var(--text-muted)", fontSize: 14, lineHeight: 1.7 }}>{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── How It Works ── */}
            <section style={{ padding: "100px 0", background: "var(--primary)", position: "relative", overflow: "hidden" }}>
                <div className="orb" style={{ width: 500, height: 500, background: "rgba(232,72,85,0.08)", top: -200, right: -100 }} />
                <div className="container" style={{ position: "relative", zIndex: 1 }}>
                    <div style={{ textAlign: "center", marginBottom: 64 }}>
                        <span className="badge" style={{ background: "rgba(232,72,85,0.15)", color: "var(--accent)", marginBottom: 16 }}>Simple Process</span>
                        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(32px,4vw,48px)", fontWeight: 800, letterSpacing: "-0.03em", color: "white" }}>Get insights in minutes</h2>
                    </div>
                    <div className="process-steps" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 24 }}>
                        {[
                            { n: "01", title: "Upload Your Resume", desc: "Simply upload your resume PDF. Our system extracts and processes all content automatically.", icon: "📤" },
                            { n: "02", title: "AI Analysis Runs", desc: "Our AI engine analyzes ATS compatibility, skill gaps, and generates personalized recommendations.", icon: "⚙️" },
                            { n: "03", title: "Take Action", desc: "Follow your tailored roadmap, apply suggestions, and connect with mentors to fast-track your career.", icon: "🚀" },
                        ].map((step, i) => (
                            <div key={i} style={{ position: "relative" }}>
                                <div className="glass" style={{ padding: 32, border: "1px solid rgba(255,255,255,0.1)" }}>
                                    <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 48, color: "rgba(232,72,85,0.3)", lineHeight: 1, marginBottom: 16 }}>{step.n}</div>
                                    <div style={{ fontSize: 32, marginBottom: 16 }}>{step.icon}</div>
                                    <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 20, color: "white", marginBottom: 10 }}>{step.title}</h3>
                                    <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 14, lineHeight: 1.7 }}>{step.desc}</p>
                                </div>
                                {i < 2 && <div className="process-step-arrow" style={{ position: "absolute", right: -12, top: "50%", transform: "translateY(-50%)", color: "rgba(232,72,85,0.5)", fontSize: 20, zIndex: 2 }}>→</div>}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Mentors ── */}
            <section id="mentors" className="section">
                <div className="container">
                    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 48 }}>
                        <div>
                            <span className="badge" style={{ background: "rgba(232,72,85,0.1)", color: "var(--accent)", marginBottom: 16 }}>Expert Network</span>
                            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px,3vw,40px)", fontWeight: 800, letterSpacing: "-0.03em", color: "var(--primary)" }}>Learn from the best</h2>
                        </div>
                        <button className="btn btn-ghost" onClick={() => navigate("/signup")}>View All Mentors <Icon name="arrow" size={14} /></button>
                    </div>
                    <div className="grid-3">
                        {mockMentors.slice(0, 3).map(m => (
                            <div key={m.id} className="mentor-card hover-lift">
                                <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
                                    <div className="avatar" style={{ background: m.color }}>{m.avatar}</div>
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: 15, color: "var(--primary)" }}>{m.name}</div>
                                        <div style={{ fontSize: 13, color: "var(--text-muted)" }}>{m.role}</div>
                                    </div>
                                </div>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
                                    {m.expertise.map(e => <span key={e} className="tag tag-blue">{e}</span>)}
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <div>
                                        <span className="stars">{"★".repeat(Math.floor(m.rating))}</span>
                                        <span style={{ fontSize: 13, color: "var(--text-muted)", marginLeft: 4 }}>{m.rating} ({m.reviews})</span>
                                    </div>
                                    <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, color: "var(--primary)", fontSize: 15 }}>{m.price}</span>
                                </div>
                                <button className="btn btn-outline-accent" style={{ width: "100%", marginTop: 16, padding: "10px" }} onClick={() => navigate("/signup")}>Book Session</button>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── FAQ ── */}
            <section id="faq" style={{ padding: "100px 0", background: "var(--bg-2)" }}>
                <div className="container" style={{ maxWidth: 720 }}>
                    <div style={{ textAlign: "center", marginBottom: 56 }}>
                        <span className="badge" style={{ background: "rgba(26,26,46,0.08)", color: "var(--primary)", marginBottom: 16 }}>FAQ</span>
                        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px,3vw,40px)", fontWeight: 800, letterSpacing: "-0.03em", color: "var(--primary)" }}>Frequently asked questions</h2>
                    </div>
                    {faqs.map((faq, i) => (
                        <div key={i} className={`faq-item ${openFaq === i ? "open" : ""}`}>
                            <div className="faq-question" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                                <span>{faq.q}</span>
                                <div style={{ transform: openFaq === i ? "rotate(180deg)" : "none", transition: "transform 0.3s", color: "var(--accent)", flexShrink: 0, marginLeft: 16 }}>
                                    <Icon name="chevron" size={18} />
                                </div>
                            </div>
                            {openFaq === i && <div className="faq-answer">{faq.a}</div>}
                        </div>
                    ))}
                </div>
            </section>

            {/* ── CTA ── */}
            <section style={{ padding: "80px 0" }}>
                <div className="container">
                    <div style={{ background: "var(--primary)", borderRadius: 24, padding: "60px 48px", textAlign: "center", position: "relative", overflow: "hidden" }}>
                        <div className="orb" style={{ width: 400, height: 400, background: "rgba(232,72,85,0.12)", top: -150, right: -100 }} />
                        <div className="orb" style={{ width: 300, height: 300, background: "rgba(61,90,128,0.15)", bottom: -100, left: -50 }} />
                        <div style={{ position: "relative", zIndex: 1 }}>
                            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px,3vw,44px)", fontWeight: 800, letterSpacing: "-0.03em", color: "white", marginBottom: 16 }}>Ready to forge your path?</h2>
                            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 17, maxWidth: 440, margin: "0 auto 36px" }}>Join thousands of professionals who've accelerated their career with PathForge AI.</p>
                            <button className="btn btn-primary" style={{ fontSize: 16, padding: "16px 40px" }} onClick={() => navigate("/signup")}>
                                Get Started Free <Icon name="arrow" size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
}