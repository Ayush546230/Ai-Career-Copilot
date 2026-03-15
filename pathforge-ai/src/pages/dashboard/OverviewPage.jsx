// src/pages/dashboard/OverviewPage.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DonutScore } from "../../components/ui/Charts";
import { ScoreBar } from "../../components/ui/Charts";
import ResumeAnalysisModal from "../../components/dashboard/ResumeAnalysisModal";
import Toast from "../../components/ui/Toast";
import Icon from "../../components/ui/Icon";
import { useToast } from "../../hooks/useToast";
import { getDashboardStats } from "../../services/resumeService";

export default function OverviewPage() {
    const navigate = useNavigate();
    const { message, showToast } = useToast();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedResume, setSelectedResume] = useState(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await getDashboardStats();
                console.log("DEBUG: OverviewPage dashboard data:", res);
                setData(res);
            } catch (err) {
                console.error("DEBUG: OverviewPage fetch error:", err);
                showToast("Failed to load dashboard stats");
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Loading dashboard...</div>;
    if (!data) return <div style={{ padding: 40, textAlign: 'center' }}>Failed to load data.</div>;

    const { student } = data;
    console.log("DEBUG: OverviewPage student data:", student);
    const { resume: primaryResume, overview: dashboardStats } = student || {};

    const stats = [
        { label: "ATS Score", value: dashboardStats?.atsScore || 0, suffix: "%", color: "#22c55e", icon: "🎯", trend: "+5 this week" },
        { label: "Resumes Uploaded", value: dashboardStats?.resumeCount || 0, suffix: "", color: "var(--accent-3)", icon: "📄", trend: "Latest analysis" },
        { label: "Skills Missing", value: dashboardStats?.skillGaps || 0, suffix: "", color: "var(--accent)", icon: "⚡", trend: "Needs focus" },
    ];

    return (
        <>
            <div style={{ marginBottom: 32 }}>
                <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 26, color: "var(--primary)", letterSpacing: "-0.02em" }}>Overview</h1>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                    <span className="tag tag-orange" style={{ fontSize: 11, padding: "2px 8px" }}>{student?.careerRoadmap?.targetRole}</span>
                    <p style={{ color: "var(--text-muted)", fontSize: 13 }}>{primaryResume?.fileName}</p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid-4" style={{ marginBottom: 24 }}>
                {stats.map((s, i) => (
                    <div key={i} className="stat-card hover-lift">
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                            <div style={{ fontSize: 28 }}>{s.icon}</div>
                            <span className="tag tag-blue" style={{ fontSize: 11 }}>{s.trend}</span>
                        </div>
                        <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 34, color: s.color, letterSpacing: "-0.03em", lineHeight: 1 }}>{s.value}{s.suffix}</div>
                        <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>{s.label}</div>
                    </div>
                ))}
            </div>

            {/* Detail grid */}
            <div className="grid-2" style={{ gap: 24 }}>
                {/* ATS detail */}
                {primaryResume && (
                    <div style={{ background: "var(--surface)", borderRadius: "var(--radius)", padding: 28, border: "1px solid var(--border)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                            <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 17, color: "var(--primary)" }}>ATS Score — Primary Resume</h3>
                            <span className="tag tag-green">Primary</span>
                        </div>
                        <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
                            <DonutScore score={primaryResume.atsScore?.overall || 0} size={100} label="Overall" />
                            <div style={{ flex: 1 }}>
                                {primaryResume.atsScore?.breakdown && Object.entries(primaryResume.atsScore.breakdown).map(([k, v]) => (
                                    <ScoreBar key={k} label={k.charAt(0).toUpperCase() + k.slice(1)} value={v} />
                                ))}
                            </div>
                        </div>
                        <button className="btn btn-ghost" style={{ width: "100%", marginTop: 20, padding: "11px" }} onClick={() => setSelectedResume(primaryResume)}>
                            <Icon name="eye" size={15} /> View Full Analysis
                        </button>
                    </div>
                )}

                {/* Skill gap */}
                {student.skillGaps && (
                    <div style={{ background: "var(--surface)", borderRadius: "var(--radius)", padding: 28, border: "1px solid var(--border)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                            <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 17, color: "var(--primary)" }}>Skill Gap Analysis</h3>
                            <span className="tag tag-orange">{student?.careerRoadmap?.targetRole || 'Target Role'}</span>
                        </div>
                        <div style={{ marginBottom: 16 }}>
                            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Missing Skills</div>
                            <div>{student.skillGaps.missing.slice(0, 10).map(s => <span key={s.skill} className="skill-pill skill-missing">✗ {s.skill}</span>)}</div>
                        </div>
                        <div>
                            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Need Improvement</div>
                            <div>{student.skillGaps.toImprove.slice(0, 3).map(s => <span key={s.skill} className="skill-pill skill-improve">↑ {s.skill}</span>)}</div>
                        </div>
                        <button className="btn btn-ghost" style={{ width: "100%", marginTop: 20, padding: "10px", fontSize: 13 }} onClick={() => setSelectedResume(primaryResume)}>
                            <Icon name="chevron-right" size={14} /> Read More Analysis
                        </button>
                    </div>
                )}

                {/* Upload card */}
                <div className="upload-area hover-lift" style={{ border: "2px dashed rgba(232,72,85,0.3)", background: "rgba(232,72,85,0.02)" }}
                    onClick={() => navigate("/dashboard/resumes")}>
                    <div style={{ fontSize: 40, marginBottom: 14 }}>📎</div>
                    <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18, color: "var(--primary)", marginBottom: 8 }}>Upload New Resume</h3>
                    <p style={{ color: "var(--text-muted)", fontSize: 14, marginBottom: 20 }}>Drop your PDF here, or click to browse</p>
                    <button className="btn btn-primary" style={{ padding: "11px 24px" }}><Icon name="upload" size={16} /> Choose File</button>
                    <p style={{ fontSize: 12, color: "var(--text-light)", marginTop: 14 }}>PDF format • Instant AI analysis • Direct feedback</p>
                </div>

                {/* Top suggestions */}
                <div style={{ background: "var(--surface)", borderRadius: "var(--radius)", padding: 28, border: "1px solid var(--border)" }}>
                    <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 17, color: "var(--primary)", marginBottom: 20 }}>Top Suggestions</h3>
                    {(student.suggestions || []).slice(0, 1).map((s, i) => (
                        <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 14, paddingBottom: 14, borderBottom: "none" }}>
                            <span className={`suggestion-priority priority-${s.priority.toLowerCase()}`} style={{ flexShrink: 0 }}>{s.priority}</span>
                            <div>
                                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--primary)", marginBottom: 2 }}>{s.issue}</div>
                                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{s.suggestion}</div>
                            </div>
                        </div>
                    ))}
                    <button className="btn btn-ghost" style={{ width: "100%", marginTop: 6, padding: "10px", fontSize: 13 }} onClick={() => setSelectedResume(primaryResume)}>
                        <Icon name="chevron-right" size={14} /> View All Suggestions
                    </button>
                </div>
            </div>

            {selectedResume && (
                <ResumeAnalysisModal
                    resume={selectedResume}
                    roadmap={student?.roadmap}
                    careerRoadmap={student?.careerRoadmap}
                    onClose={() => setSelectedResume(null)}
                />
            )}
            <Toast message={message} />
        </>
    );
}