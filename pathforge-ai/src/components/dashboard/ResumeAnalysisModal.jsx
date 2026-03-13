// src/components/dashboard/ResumeAnalysisModal.jsx
import Icon from "../ui/Icon";
import { DonutScore } from "../ui/Charts";
import { ScoreBar } from "../ui/Charts";

export default function ResumeAnalysisModal({ resume, careerRoadmap, onClose }) {
    if (!resume) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" style={{ maxWidth: 720 }} onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
                    <div>
                        <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, color: "var(--primary)", letterSpacing: "-0.02em" }}>
                            Resume Analysis
                        </h2>
                        <p style={{ color: "var(--text-muted)", fontSize: 14, marginTop: 4 }}>
                            {resume.fileName} • {careerRoadmap?.targetRole || 'Analyzing Skill Gaps'}
                        </p>
                    </div>
                    <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 4 }}>
                        <Icon name="x" size={20} />
                    </button>
                </div>

                {/* ATS Score */}
                <div className="analysis-section">
                    <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
                        <DonutScore score={resume.atsScore?.overall || 0} size={96} label="ATS Score" />
                        <div style={{ flex: 1 }}>
                            <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 16, color: "var(--primary)", marginBottom: 14 }}>
                                ATS Score Breakdown
                            </p>
                            {resume.atsScore?.breakdown && Object.entries(resume.atsScore.breakdown).map(([key, val]) => (
                                <ScoreBar key={key} label={key.charAt(0).toUpperCase() + key.slice(1)} value={val} />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Skill Gap */}
                <div className="analysis-section">
                    <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 16, marginBottom: 16, color: "var(--primary)" }}>
                        Skill Gap Analysis
                    </h3>

                    {resume.skillGapAnalysis?.currentSkills && (
                        <div style={{ marginBottom: 12 }}>
                            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Current Skills</div>
                            <div>{resume.skillGapAnalysis.currentSkills.map(s => <span key={s} className="skill-pill skill-has">✓ {s}</span>)}</div>
                        </div>
                    )}

                    {resume.skillGapAnalysis?.requiredSkills && (
                        <div style={{ marginBottom: 12 }}>
                            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Required Skills</div>
                            <div>{resume.skillGapAnalysis.requiredSkills.map(s => <span key={typeof s === 'string' ? s : s.skill} className="skill-pill" style={{ background: "rgba(59,130,246,0.1)", color: "#3b82f6", border: "1px solid rgba(59,130,246,0.2)" }}>• {typeof s === 'string' ? s : s.skill}</span>)}</div>
                        </div>
                    )}

                    {resume.skillGapAnalysis?.missingSkills && (
                        <div style={{ marginBottom: 12 }}>
                            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Missing Skills</div>
                            <div>{resume.skillGapAnalysis.missingSkills.map(s => <span key={typeof s === 'string' ? s : s.skill} className="skill-pill skill-missing">✗ {typeof s === 'string' ? s : s.skill}</span>)}</div>
                        </div>
                    )}

                    {resume.skillGapAnalysis?.skillsToImprove?.length > 0 && (
                        <div>
                            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Skills to Improve</div>
                            <div>{resume.skillGapAnalysis.skillsToImprove.map(s => <span key={s.skill} className="skill-pill skill-improve">↑ {s.skill}</span>)}</div>
                        </div>
                    )}
                </div>

                {/* AI Suggestions */}
                <div className="analysis-section" style={{ marginBottom: 0 }}>
                    <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 16, marginBottom: 16, color: "var(--primary)" }}>
                        AI Recommendations
                    </h3>
                    {(resume.suggestions || []).map((s, i) => (
                        <div key={i} className="suggestion-item">
                            <span className={`suggestion-priority priority-${(s.priority || 'medium').toLowerCase()}`}>{s.priority || 'Medium'}</span>
                            <div>
                                <div style={{ fontWeight: 600, fontSize: 14, color: "var(--primary)", marginBottom: 4 }}>{s.issue}</div>
                                <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 8 }}>{s.suggestion || s.recommendation}</div>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                                    <div style={{ background: "rgba(232,72,85,0.06)", padding: "8px 12px", borderRadius: 8, fontSize: 12 }}>
                                        <div style={{ fontSize: 10, fontWeight: 700, color: "var(--accent)", marginBottom: 3, textTransform: "uppercase" }}>Before</div>
                                        {s.example?.before || s.exampleBefore || 'N/A'}
                                    </div>
                                    <div style={{ background: "rgba(34,197,94,0.06)", padding: "8px 12px", borderRadius: 8, fontSize: 12 }}>
                                        <div style={{ fontSize: 10, fontWeight: 700, color: "#16a34a", marginBottom: 3, textTransform: "uppercase" }}>After</div>
                                        {s.example?.after || s.exampleAfter || 'N/A'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Career Roadmap Section */}
                {(() => {
                    // 1. Robust Roadmap Detection
                    const rawRoadmap = careerRoadmap || resume.roadmap || resume.career_roadmap || resume.careerRoadmap;

                    if (!rawRoadmap) {
                        console.log("DEBUG: Modal - No roadmap data found in any property");
                        return null;
                    }

                    // 2. Extract Milestones (handle array, object with milestones key, or direct object)
                    let milestones = [];
                    if (Array.isArray(rawRoadmap)) {
                        milestones = rawRoadmap;
                    } else if (rawRoadmap.milestones && Array.isArray(rawRoadmap.milestones)) {
                        milestones = rawRoadmap.milestones;
                    } else if (typeof rawRoadmap === 'object') {
                        // Fallback: search for any array property that looks like milestones
                        milestones = Object.values(rawRoadmap).find(val => Array.isArray(val) && val.length > 0 && val[0].title) || [];
                    }

                    if (milestones.length === 0) {
                        console.log("DEBUG: Modal - Found roadmap wrapper but 0 milestones", rawRoadmap);
                        return null;
                    }

                    return (
                        <div className="analysis-section" style={{
                            marginTop: 32,
                            paddingTop: 32,
                            borderTop: "2px solid var(--border)",
                            background: "linear-gradient(to bottom right, var(--surface), rgba(232,72,85,0.02))"
                        }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
                                <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 18, color: "var(--primary)", display: "flex", alignItems: "center", gap: 10 }}>
                                    <div style={{ padding: 8, background: "rgba(232,72,85,0.1)", borderRadius: 8, display: "flex" }}>
                                        <Icon name="map" size={18} color="var(--accent)" />
                                    </div>
                                    Personalized Career Roadmap
                                </h3>
                                <span className="tag tag-orange" style={{ fontSize: 10 }}>AI Generated</span>
                            </div>

                            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                                {milestones.map((milestone, idx) => (
                                    <div key={idx} style={{ position: "relative", paddingLeft: 28, borderLeft: "2px dashed rgba(232,72,85,0.3)" }}>
                                        {/* Timeline Dot */}
                                        <div style={{
                                            position: "absolute",
                                            left: -9,
                                            top: 0,
                                            width: 16,
                                            height: 16,
                                            borderRadius: "50%",
                                            background: "var(--accent)",
                                            border: "3px solid var(--surface)",
                                            boxShadow: "0 0 0 1px rgba(232,72,85,0.2)"
                                        }} />

                                        <div style={{ fontWeight: 700, fontSize: 16, color: "var(--primary)", marginBottom: 6 }}>
                                            {milestone.title}
                                        </div>
                                        {milestone.description && (
                                            <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 16, lineHeight: 1.6 }}>
                                                {milestone.description}
                                            </p>
                                        )}

                                        {/* Responsive Task List (Under each other) */}
                                        <div style={{
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: 8,
                                            background: "rgba(0,0,0,0.02)",
                                            padding: "14px 16px",
                                            borderRadius: 12
                                        }}>
                                            {(milestone.tasks || []).slice(0, 4).map((task, taskIdx) => (
                                                <div key={taskIdx} style={{
                                                    display: "flex",
                                                    alignItems: "flex-start",
                                                    gap: 10,
                                                    fontSize: 13,
                                                    color: "var(--text-muted)",
                                                    lineHeight: 1.4
                                                }}>
                                                    <div style={{
                                                        width: 6,
                                                        height: 6,
                                                        borderRadius: "50%",
                                                        background: "var(--accent-2)",
                                                        flexShrink: 0,
                                                        marginTop: 6
                                                    }} />
                                                    <span style={{ flex: 1 }}>
                                                        {typeof task === 'string' ? task : (task.description || task.title || "Learn more")}
                                                    </span>
                                                </div>
                                            ))}
                                            {(!milestone.tasks || milestone.tasks.length === 0) && (
                                                <div style={{ fontSize: 11, color: "var(--text-light)", fontStyle: "italic" }}>
                                                    Recommended practice tasks coming soon...
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })()}
            </div>
        </div>
    );
}