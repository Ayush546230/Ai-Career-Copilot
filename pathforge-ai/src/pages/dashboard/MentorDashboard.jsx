import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Icon from "../../components/ui/Icon";
import Toast from "../../components/ui/Toast";
import { useToast } from "../../hooks/useToast";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function MentorDashboard() {
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const { message, showToast } = useToast();

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get(`${API_URL}/mentor/dashboard`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setData(res.data.data.mentor);
            } catch (err) {
                showToast("Failed to load mentor stats");
            } finally {
                setLoading(false);
            }
        };
        fetchDashboard();
    }, []);

    if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Loading mentor dashboard...</div>;
    if (!data) return <div style={{ padding: 40, textAlign: 'center' }}>Error loading dashboard.</div>;

    const stats = [
        { label: "Active Students", value: data.overview.activeStudents, suffix: "", color: "#22c55e", icon: "👥", trend: "Current" },
        { label: "Pending Requests", value: data.overview.pendingRequests, suffix: "", color: "#f59e0b", icon: "⏳", trend: "Needs Action" },
        { label: "Sessions (Month)", value: data.overview.sessionsThisMonth, suffix: "", color: "var(--accent)", icon: "📅", trend: "This Month" },
        { label: "Overall Rating", value: data.overview.rating, suffix: "/5", color: "var(--accent-3)", icon: "⭐", trend: "Avg Score" },
    ];

    const handleAction = async (requestId, action) => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(`${API_URL}/mentor/${action}-request/${requestId}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                showToast(`Request ${action}ed!`);
                // Refresh data to get updated active students and stats
                const dashboardRes = await axios.get(`${API_URL}/mentor/dashboard`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setData(dashboardRes.data.data.mentor);
            }
        } catch (err) {
            showToast(`Failed to ${action} request`);
        }
    };

    const handleRemoveStudent = async (studentId) => {
        if (!window.confirm("Are you sure you want to remove this student?")) return;
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(`${API_URL}/mentor/remove-student/${studentId}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                showToast("Student removed");
                // Refresh data
                const dashboardRes = await axios.get(`${API_URL}/mentor/dashboard`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setData(dashboardRes.data.data.mentor);
            }
        } catch (err) {
            showToast("Failed to remove student");
        }
    };

    return (
        <>
            <div style={{ padding: "0 20px" }}>
                <div style={{ marginBottom: 32 }}>
                    <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 28, color: "var(--primary)" }}>Mentor Dashboard</h1>
                    <p style={{ color: "var(--text-muted)", fontSize: 14 }}>Welcome back, track your impact and manage student sessions.</p>
                </div>

                {/* Quick Stats */}
                <div className="grid-4" style={{ gap: 20, marginBottom: 40 }}>
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

                <div className="grid-2" style={{ gap: 32 }}>
                    {/* Requests */}
                    <div style={{ background: "var(--surface)", borderRadius: "var(--radius)", padding: 28, border: "1px solid var(--border)" }}>
                        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Student Requests</h3>
                        {data.requests.length > 0 ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                                {data.requests.map(req => (
                                    <div key={req.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 16, background: "var(--bg-alt)", borderRadius: 12 }}>
                                        <div>
                                            <div style={{ fontWeight: 600, color: "var(--primary)" }}>{req.studentName}</div>
                                            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Targeting: {req.targetRole}</div>
                                        </div>
                                        <div style={{ display: "flex", gap: 8 }}>
                                            <button className="btn btn-ghost" style={{ padding: "6px 12px", fontSize: 12 }} onClick={() => handleAction(req.id, 'reject')}>Decline</button>
                                            <button className="btn btn-primary" style={{ padding: "6px 12px", fontSize: 12 }} onClick={() => handleAction(req.id, 'accept')}>Accept</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p style={{ color: "var(--text-muted)", fontSize: 14 }}>No pending requests at the moment.</p>
                        )}
                    </div>

                    {/* Active Students */}
                    <div style={{ background: "var(--surface)", borderRadius: "var(--radius)", padding: 28, border: "1px solid var(--border)" }}>
                        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Active Students</h3>
                        {data.activeStudents?.length > 0 ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                                {data.activeStudents.map(student => (
                                    <div key={student.studentId} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 16, background: "var(--bg-alt)", borderRadius: 12 }}>
                                        <div>
                                            <div style={{ fontWeight: 600, color: "var(--primary)" }}>{student.studentName}</div>
                                            <div style={{ fontSize: 12, color: "var(--text-main)", marginTop: 2 }}>{student.targetRole || 'Mentee'}</div>
                                            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
                                                Joined {(() => {
                                                    const d = new Date(student.joinedAt);
                                                    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
                                                })()}
                                            </div>
                                        </div>
                                        <div style={{ display: "flex", gap: 8 }}>
                                            <button 
                                                className="btn btn-ghost hover-lift" 
                                                style={{ padding: "8px", borderRadius: "50%", color: "var(--danger, #ef4444)" }}
                                                onClick={() => handleRemoveStudent(student.studentId)}
                                                title="Remove Student"
                                            >
                                                <Icon name="trash" size={18} />
                                            </button>
                                            <button 
                                                className="btn btn-ghost" 
                                                style={{ padding: "8px", borderRadius: "50%" }}
                                                onClick={() => navigate("/dashboard/chat", { state: { recipient: { id: student.studentId, name: student.studentName } } })}
                                            >
                                                <Icon name="mail" size={18} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p style={{ color: "var(--text-muted)", fontSize: 14 }}>No active students yet.</p>
                        )}
                    </div>

                    {/* Profile Completion */}
                    <div style={{ background: "var(--surface)", borderRadius: "var(--radius)", padding: 28, border: "1px solid var(--border)" }}>
                        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>Profile Vitality</h3>
                        <div style={{ marginBottom: 24 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
                                <span style={{ color: "var(--text-muted)" }}>Completion Score</span>
                                <span style={{ color: "var(--accent-3)", fontWeight: 700 }}>{data.profileCompletion}%</span>
                            </div>
                            <div style={{ height: 8, background: "var(--bg-alt)", borderRadius: 4 }}>
                                <div style={{ width: `${data.profileCompletion}%`, height: "100%", background: "var(--accent-3)", borderRadius: 4 }}></div>
                            </div>
                        </div>
                        <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 20 }}>Complete your expertise details to increase your visibility in student searches.</p>
                        <button className="btn btn-ghost" style={{ width: "100%" }}>Complete Profile</button>
                    </div>
                </div>
            </div>
            <Toast message={message} />
        </>
    );
}
