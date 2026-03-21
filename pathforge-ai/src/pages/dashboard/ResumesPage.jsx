// src/pages/dashboard/ResumesPage.jsx
import { useState, useEffect } from "react";
import { DonutScore } from "../../components/ui/Charts";
import ResumeAnalysisModal from "../../components/dashboard/ResumeAnalysisModal";
import Toast from "../../components/ui/Toast";
import Icon from "../../components/ui/Icon";
import { useToast } from "../../hooks/useToast";
import { getResumes, deleteResume as apiDeleteResume, uploadResume as apiUploadResume, getRoadmap, setPrimaryResume as apiSetPrimaryResume } from "../../services/resumeService";

export default function ResumesPage() {
    const { message, showToast } = useToast();
    const [resumes, setResumes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedResume, setSelected] = useState(null);
    const [careerRoadmap, setCareerRoadmap] = useState(null);
    const [search, setSearch] = useState("");

    const [isUploading, setIsUploading] = useState(false);
    const [targetRole, setTargetRole] = useState("");

    const filtered = (resumes || []).filter(r => {
        const nameMatch = (r.fileName || r.name || "").toLowerCase().includes((search || "").toLowerCase());
        const roleMatch = (r.roadmap?.targetRole || careerRoadmap?.targetRole || "").toLowerCase().includes((search || "").toLowerCase());
        return nameMatch || roleMatch;
    });

    console.log("DEBUG: ResumesPage - Total:", resumes?.length, "Filtered:", filtered?.length);

    const fetchResumes = async () => {
        try {
            const [resumesData, roadmapData] = await Promise.all([
                getResumes(),
                getRoadmap()
            ]);

            console.log("DEBUG: ResumesPage - Resumes:", resumesData, "Roadmap:", roadmapData);

            let finalResumes = [];
            // Handle array-wrapped data if it exists
            const normalized = (Array.isArray(resumesData) && resumesData[0]?.resumes) ? resumesData[0] : resumesData;

            if (normalized && normalized.resumes) {
                finalResumes = normalized.resumes;
            } else if (Array.isArray(normalized)) {
                finalResumes = normalized;
            }

            setResumes(finalResumes);
            setCareerRoadmap(roadmapData);
        } catch (err) {
            console.error("DEBUG: ResumesPage fetch error:", err);
            showToast("Failed to fetch data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchResumes();
    }, []);

    const handleDelete = async (id) => {
        try {
            await apiDeleteResume(id);
            setResumes(prev => prev.filter(r => r._id !== id));
            showToast("Resume deleted successfully");
        } catch (err) {
            showToast("Failed to delete resume");
        }
    };

    const handleSetPrimary = async (id) => {
        try {
            await apiSetPrimaryResume(id);
            setResumes(prev => prev.map(r => ({ ...r, isPrimary: r._id === id })));
            showToast("Primary resume updated");
        } catch (err) {
            showToast("Failed to update primary resume");
        }
    };

    return (
        <>
            {/* Heading */}
            <div style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                    <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 26, color: "var(--primary)", letterSpacing: "-0.02em" }}>My Resumes</h1>
                    <p style={{ color: "var(--text-muted)", fontSize: 14, marginTop: 2 }}>{resumes.length} resumes uploaded</p>
                </div>

                {isUploading && (
                    <div style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(232,72,85,0.1)", padding: "8px 16px", borderRadius: 100, border: "1px solid rgba(232,72,85,0.2)" }}>
                        <div style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid var(--accent)", borderTopColor: "transparent", animation: "spin 1s linear infinite" }} />
                        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--accent)" }}>Analyzing...</span>
                    </div>
                )}
            </div>

            {/* Actions row */}
            <div className="actions-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24, gap: 16 }}>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 12, flex: 1, flexWrap: "wrap" }}>
                    <div style={{ position: "relative", minWidth: 260 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-muted)", marginBottom: 8, paddingLeft: 4 }}>Target Role</div>
                        <input
                            className="input"
                            placeholder="Target Role"
                            value={targetRole}
                            onChange={e => setTargetRole(e.target.value)}
                            disabled={isUploading}
                            style={{ padding: "11px 14px 11px 36px", fontSize: 14 }}
                        />
                        <div style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-light)" }}>
                            <Icon name="target" size={16} />
                        </div>
                    </div>

                    <div style={{ position: "relative" }}>
                        <input
                            type="file"
                            id="resume-upload"
                            style={{ display: "none" }}
                            accept=".pdf"
                            onChange={async (e) => {
                                const file = e.target.files[0];
                                if (file) {
                                    try {
                                        setIsUploading(true);
                                        const finalRole = targetRole.trim();
                                        if (!finalRole) {
                                            showToast("Please specify a target role first");
                                            setIsUploading(false);
                                            return;
                                        }
                                        showToast(`Analyzing resume for ${finalRole}...`);
                                        await apiUploadResume(file, finalRole);
                                        await fetchResumes();
                                        setTargetRole(""); // Clear input on success
                                        if (e.target) e.target.value = null; // Clear file input
                                        showToast("Resume analyzed successfully!");
                                    } catch (err) {
                                        showToast("Upload failed");
                                    } finally {
                                        setIsUploading(false);
                                        if (e.target) e.target.value = null; // Clear file input even on failure
                                    }
                                }
                            }}
                        />
                        <label
                            htmlFor="resume-upload"
                            className={`btn btn-primary ${isUploading ? 'disabled' : ''}`}
                            style={{
                                padding: "11px 20px",
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                opacity: isUploading ? 0.7 : 1,
                                cursor: isUploading ? 'not-allowed' : 'pointer',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            <Icon name="plus" size={16} /> {isUploading ? "Uploading..." : "Upload Resume"}
                        </label>
                    </div>
                </div>
                <div style={{ fontSize: 13, color: "var(--text-muted)", whiteSpace: 'nowrap' }}>Free Plan Active</div>
            </div>

            {/* Drop zone */}
            <div className="upload-area" style={{ marginBottom: 24, opacity: isUploading ? 0.5 : 1, cursor: isUploading ? 'not-allowed' : 'pointer', pointerEvents: isUploading ? 'none' : 'auto' }} onClick={() => document.getElementById('resume-upload').click()}>
                {isUploading ? (
                    <>
                        <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
                            <div style={{ width: 32, height: 32, borderRadius: "50%", border: "3px solid var(--accent)", borderTopColor: "transparent", animation: "spin 1s linear infinite" }} />
                        </div>
                        <p style={{ fontWeight: 600, fontSize: 15, color: "var(--accent)", marginBottom: 4 }}>AI is analyzing your resume...</p>
                        <p style={{ fontSize: 13, color: "var(--text-muted)" }}>This usually takes 30-40 seconds</p>
                    </>
                ) : (
                    <>
                        <div style={{ fontSize: 32, marginBottom: 10 }}>📤</div>
                        <p style={{ fontWeight: 600, fontSize: 15, color: "var(--primary)", marginBottom: 4 }}>Drop your resume here</p>
                        <p style={{ fontSize: 13, color: "var(--text-muted)" }}>PDF format supported • AI analysis runs instantly</p>
                    </>
                )}
            </div>

            {/* Table */}
            <div style={{ background: "var(--surface)", borderRadius: "var(--radius)", border: "1px solid var(--border)", overflow: "hidden" }}>
                <div style={{ overflowX: "auto" }}>
                    {/* Desktop Search Header */}
                    <div className="desktop-only" style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 16, color: "var(--primary)" }}>All Resumes</span>
                        <div className="search-container" style={{ position: "relative" }}>
                            <input
                                className="input search-input"
                                placeholder="Search resumes..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                style={{ padding: "8px 14px 8px 36px", fontSize: 13, width: 220 }}
                            />
                            <div style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-light)" }}>
                                <Icon name="search" size={14} />
                            </div>
                        </div>
                    </div>

                    {/* Mobile Search Header */}
                    <div className="mobile-only" style={{ padding: "16px", borderBottom: "1px solid var(--border)" }}>
                        <div style={{ position: "relative" }}>
                            <input
                                className="input"
                                placeholder="Search resumes..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                style={{ padding: "10px 14px 10px 38px", fontSize: 14, width: "100%" }}
                            />
                            <div style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-light)" }}>
                                <Icon name="search" size={16} />
                            </div>
                        </div>
                    </div>

                    {/* Desktop Table: Hidden on mobile */}
                    <table className="table desktop-only">
                        <thead>
                            <tr>
                                <th>Resume</th>
                                <th>Target Role</th>
                                <th>ATS Score</th>
                                <th>Uploaded</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(resume => (
                                <tr key={resume._id}>
                                    <td>
                                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                            <div style={{ width: 36, height: 36, background: "rgba(232,72,85,0.1)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                <Icon name="file" size={16} color="var(--accent)" />
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 500, fontSize: 14, color: "var(--primary)" }}>{resume.fileName || resume.name || "Untitled Resume"}</div>
                                                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{(resume.skillGapAnalysis?.missingSkills || []).length} skills missing</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ color: "var(--text-muted)", fontSize: 13 }}>{resume.roadmap?.targetRole || careerRoadmap?.targetRole || "N/A"}</td>
                                    <td><DonutScore score={resume.atsScore?.overall || 0} size={40} /></td>
                                    <td style={{ color: "var(--text-muted)", fontSize: 13 }}>{new Date(resume.uploadedAt).toLocaleDateString()}</td>
                                    <td>{resume.isPrimary ? <span className="tag tag-green">Primary</span> : <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12, height: "auto" }} onClick={() => handleSetPrimary(resume._id)}>Make Primary</button>}</td>
                                    <td>
                                        <div style={{ display: "flex", gap: 6 }}>
                                            <button className="btn btn-ghost" style={{ padding: "7px 12px", fontSize: 12 }} onClick={() => setSelected(resume)}>
                                                <Icon name="eye" size={13} /> Analyze
                                            </button>
                                            <button
                                                style={{ background: "none", border: "1px solid rgba(232,72,85,0.2)", borderRadius: 8, cursor: "pointer", padding: "7px 10px", color: "var(--accent)", transition: "all 0.2s" }}
                                                onClick={() => handleDelete(resume._id)}
                                            >
                                                <Icon name="trash" size={14} color="var(--accent)" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {filtered.length === 0 && (
                        <div style={{ padding: 60, textAlign: "center", color: "var(--text-muted)" }}>
                            <div style={{ fontSize: 40, marginBottom: 14 }}>📂</div>
                            <div style={{ fontWeight: 600, marginBottom: 6 }}>No resumes found</div>
                            <div style={{ fontSize: 14 }}>{search ? "Try a different search term" : "Upload your first resume to get started"}</div>
                        </div>
                    )}
                </div>

                {/* Mobile Cards: Visible only on mobile */}
                <div className="mobile-only" style={{ padding: "0 16px 16px" }}>
                    {filtered.map(resume => (
                        <div key={resume._id} style={{
                            background: "var(--bg)",
                            borderRadius: "var(--radius)",
                            padding: 16,
                            marginBottom: 12,
                            border: "1px solid var(--border)",
                            display: "flex",
                            flexDirection: "column",
                            gap: 14
                        }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                <div style={{ display: "flex", gap: 12 }}>
                                    <div style={{ width: 40, height: 40, background: "rgba(232,72,85,0.1)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                        <Icon name="file" size={18} color="var(--accent)" />
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: 15, color: "var(--primary)", lineHeight: 1.3 }}>{resume.fileName || resume.name || "Untitled Resume"}</div>
                                        <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>{resume.roadmap?.targetRole || careerRoadmap?.targetRole || "No Role"}</div>
                                    </div>
                                </div>
                                <DonutScore score={resume.atsScore?.overall || 0} size={42} />
                            </div>

                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 10, borderTop: "1px solid var(--border)" }}>
                                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                    {resume.isPrimary ? <span className="tag tag-green">Primary</span> : <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12, height: "auto" }} onClick={() => handleSetPrimary(resume._id)}>Make Primary</button>}
                                    <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{new Date(resume.uploadedAt).toLocaleDateString()}</span>
                                </div>
                                <div style={{ display: "flex", gap: 8 }}>
                                    <button className="btn btn-ghost" style={{ padding: "6px 10px", fontSize: 12 }} onClick={() => setSelected(resume)}>
                                        <Icon name="eye" size={14} /> View
                                    </button>
                                    <button
                                        style={{ background: "none", border: "1px solid rgba(232,72,85,0.1)", borderRadius: 8, cursor: "pointer", padding: "6px 8px", color: "var(--accent)" }}
                                        onClick={() => handleDelete(resume._id)}
                                    >
                                        <Icon name="trash" size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <style>{`
                @media (max-width: 768px) {
                    .desktop-only { display: none !important; }
                    .mobile-only { display: block !important; }
                    .actions-row { flex-direction: column; align-items: flex-start !important; gap: 16px; }
                    .search-container { width: 100% !important; }
                    .search-input { width: 100% !important; }
                }
                @media (min-width: 769px) {
                    .mobile-only { display: none !important; }
                }
            `}</style>

            {selectedResume && (
                <ResumeAnalysisModal
                    resume={selectedResume}
                    careerRoadmap={careerRoadmap}
                    onClose={() => setSelected(null)}
                />
            )}
            <Toast message={message} />
        </>
    );
}