
import { useState, useEffect } from "react";
import axios from "axios";
import Icon from "../../components/ui/Icon";
import { useToast } from "../../hooks/useToast";
import Toast from "../../components/ui/Toast";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function FindMentorPage() {
    const [mentors, setMentors] = useState([]);
    const [loading, setLoading] = useState(false);
    const [initialLoad, setInitialLoad] = useState(true);
    const { message, showToast } = useToast();

    const fetchMatches = async () => {
        setLoading(true);
        setInitialLoad(false);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(`${API_URL}/mentor/match`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                setMentors(res.data.data.matches || []);
            }
        } catch (err) {
            console.error("Match error:", err);
            showToast(err.response?.data?.message || "Failed to find matches");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMatches();
    }, []);

    return (
        <div style={{ padding: "40px", maxWidth: "1200px", margin: "0 auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 40 }}>
                <div>
                    <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 32, color: "var(--primary)", letterSpacing: "-0.02em" }}>Expert Mentors</h1>
                    <p style={{ color: "var(--text-muted)", fontSize: 16 }}>AI-powered matching based on your skill gaps and career goals.</p>
                </div>
                <button className="btn btn-primary" onClick={fetchMatches} disabled={loading} style={{ height: "48px", padding: "0 24px", borderRadius: "12px", display: "flex", alignItems: "center", gap: 8 }}>
                    {loading ? "Matching..." : <><Icon name="search" size={18} /> Find My Matches</>}
                </button>
            </div>

            {loading && initialLoad ? (
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "300px" }}>
                    <div className="loader"></div>
                </div>
            ) : mentors.length > 0 ? (
                <div className="grid-3" style={{ gap: 32 }}>
                    {mentors.map((m, i) => (
                        <div key={i} className="stat-card hover-lift" style={{ 
                            display: "flex", 
                            flexDirection: "column", 
                            gap: 0, 
                            padding: "32px",
                            borderRadius: "32px",
                            position: "relative",
                            overflow: "hidden",
                            background: "white",
                            boxShadow: "0 10px 30px rgba(0,0,0,0.05)"
                        }}>
                            {/* Match Score Badge (Large Green) */}
                            <div style={{
                                position: "absolute",
                                top: 0,
                                right: 0,
                                background: "#22c55e",
                                color: "white",
                                padding: "10px 20px",
                                borderBottomLeftRadius: "24px",
                                fontSize: "14px",
                                fontWeight: 800,
                                letterSpacing: "0.02em"
                            }}>
                                {Math.round(m.match_score)}% MATCH
                            </div>

                            <div style={{ display: "flex", gap: 20, alignItems: "flex-start", marginBottom: 24 }}>
                                <div style={{ width: 80, height: 80, borderRadius: "50%", background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36, flexShrink: 0 }}>
                                    {m.metadata?.avatar || "👨‍🏫"}
                                </div>
                                <div style={{ paddingTop: 8 }}>
                                    <h4 style={{ fontSize: 24, fontWeight: 800, color: "var(--primary)", margin: 0, lineHeight: 1.2 }}>
                                        {m.name.split(' ')[0]}<br/>{m.name.split(' ')[1]}
                                    </h4>
                                </div>
                            </div>

                            {/* Red Tagline */}
                            <div style={{ 
                                fontSize: 15, 
                                color: "#ef4444", 
                                fontWeight: 700, 
                                marginBottom: 8, 
                                lineHeight: 1.4,
                                maxWidth: "90%"
                            }}>
                                {m.metadata?.role}
                            </div>
                            
                            <div style={{ fontSize: 14, color: "var(--text-muted)", fontWeight: 600, marginBottom: 24 }}>
                                {m.metadata?.company} • {m.metadata?.experience} years exp
                            </div>
                            
                            {/* Reasoning Box with Red Left Border */}
                            <div style={{ 
                                background: "#f9fafb", 
                                padding: "20px", 
                                borderRadius: "20px",
                                borderLeft: "4px solid #ef4444",
                                fontSize: 14,
                                color: "#4b5563",
                                lineHeight: 1.6,
                                marginBottom: 24,
                                fontStyle: "italic"
                            }}>
                                "{m.match_reason}"
                            </div>

                            {/* Blue Skill Pills */}
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 32 }}>
                                {(m.metadata?.skills || []).slice(0, 4).map(s => (
                                    <span key={s} style={{ 
                                        fontSize: 12, 
                                        fontWeight: 700, 
                                        padding: "8px 16px", 
                                        borderRadius: "12px", 
                                        background: "#eff6ff", 
                                        color: "#2563eb",
                                        border: "1px solid #dbeafe"
                                    }}>
                                        {s}
                                    </span>
                                ))}
                            </div>

                            <button 
                                className="btn btn-primary" 
                                style={{ 
                                    width: "100%", 
                                    marginTop: "auto", 
                                    height: "56px", 
                                    borderRadius: "16px",
                                    fontSize: 16,
                                    fontWeight: 800,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: 10,
                                    background: "#ef4444",
                                    boxShadow: "0 10px 20px rgba(239, 68, 68, 0.2)"
                                }}
                                onClick={async () => {
                                    try {
                                        const token = localStorage.getItem('token');
                                        await axios.post(`${API_URL}/mentor/request`, { mentorId: m.mentor_id, message: "Hi, I'd like to be your mentee!" }, {
                                            headers: { Authorization: `Bearer ${token}` }
                                        });
                                        showToast("Request sent successfully!");
                                    } catch (err) {
                                        showToast(err.response?.data?.message || "Failed to send request");
                                    }
                                }}
                            >
                                <Icon name="send" size={18} /> Connect Now
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                <div style={{ textAlign: "center", padding: "100px 0", background: "var(--surface)", borderRadius: "32px", border: "1px dashed var(--border)" }}>
                    <div style={{ fontSize: 64, marginBottom: 20 }}>🔍</div>
                    <h3 style={{ fontSize: 20, color: "var(--text-muted)", fontWeight: 700 }}>{loading ? "Analyzing profiles..." : "Click the button to find your perfect expert."}</h3>
                </div>
            )}
            
            <Toast message={message} />
        </div>
    );
}
