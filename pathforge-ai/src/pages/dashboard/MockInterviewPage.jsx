import { useState, useEffect, useRef } from "react";
import { startInterview, sendInterviewMessage, endInterview } from "../../services/interviewService";
import Icon from "../../components/ui/Icon";
import { useToast } from "../../hooks/useToast";
import Toast from "../../components/ui/Toast";

export default function MockInterviewPage() {
    const [status, setStatus] = useState("idle"); // idle, starting, chatting, reporting
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [sessionId, setSessionId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [report, setReport] = useState(null);
    const { message: toastMsg, showToast } = useToast();
    const chatEndRef = useRef(null);

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleStart = async (type) => {
        setLoading(true);
        setStatus("starting");
        try {
            const res = await startInterview(type);
            if (res.success) {
                setSessionId(res.data.session_id);
                setMessages([{ role: "assistant", content: res.data.initial_question }]);
                setStatus("chatting");
            }
        } catch (err) {
            showToast(err.message || "Failed to start interview");
            setStatus("idle");
        } finally {
            setLoading(false);
        }
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        const userMsg = input.trim();
        setInput("");
        setMessages(prev => [...prev, { role: "user", content: userMsg }]);
        setLoading(true);

        try {
            const res = await sendInterviewMessage(sessionId, userMsg);
            if (res.success) {
                setMessages(prev => [...prev, { role: "assistant", content: res.data.next_question }]);
                if (res.data.is_ended) {
                    handleEnd();
                }
            }
        } catch (err) {
            showToast("Failed to send message");
        } finally {
            setLoading(false);
        }
    };

    const handleEnd = async () => {
        setLoading(true);
        try {
            const res = await endInterview(sessionId);
            if (res.success) {
                setReport(res.data.scorecard);
                setStatus("reporting");
            }
        } catch (err) {
            showToast("Failed to generate report");
        } finally {
            setLoading(false);
        }
    };

    if (status === "idle") {
        return (
            <div style={{ maxWidth: 800, margin: "0 auto", textAlign: "center", padding: "60px 20px" }}>
                <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 36, color: "var(--primary)", marginBottom: 16 }}>AI Mock Interview</h1>
                <p style={{ color: "var(--text-muted)", fontSize: 16, marginBottom: 40 }}>Practice your interview skills with our autonomous HR & Technical agents.</p>
                
                <div className="grid-2" style={{ gap: 24 }}>
                    <div className="stat-card hover-lift" onClick={() => handleStart("technical")} style={{ cursor: "pointer", padding: 32 }}>
                        <div style={{ fontSize: 40, marginBottom: 16 }}>💻</div>
                        <h3 style={{ fontSize: 20, marginBottom: 8 }}>Technical Interview</h3>
                        <p style={{ fontSize: 14, color: "var(--text-muted)" }}>Focus on DSA, System Design, and your primary tech stack.</p>
                    </div>
                    <div className="stat-card hover-lift" onClick={() => handleStart("hr")} style={{ cursor: "pointer", padding: 32 }}>
                        <div style={{ fontSize: 40, marginBottom: 16 }}>🤝</div>
                        <h3 style={{ fontSize: 20, marginBottom: 8 }}>HR & Behavioral</h3>
                        <p style={{ fontSize: 14, color: "var(--text-muted)" }}>Practice soft skills and cultural fit questions.</p>
                    </div>
                </div>
                <Toast message={toastMsg} />
            </div>
        );
    }

    if (status === "starting") {
        return <div style={{ padding: 100, textAlign: "center", color: "var(--text-muted)" }}>Preparing your interview environment...</div>;
    }

    if (status === "reporting") {
        return (
            <div style={{ maxWidth: 700, margin: "0 auto", padding: "40px 20px" }}>
                <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 32, color: "var(--primary)", marginBottom: 24 }}>Performance Scorecard</h1>
                <div className="stat-card" style={{ marginBottom: 24, textAlign: "center" }}>
                    <div style={{ fontSize: 48, fontWeight: 800, color: "var(--accent-3)" }}>{report.overall_score}%</div>
                    <div style={{ fontSize: 14, color: "var(--text-muted)" }}>Overall Performance</div>
                </div>
                
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
                    <div className="stat-card" style={{ borderLeft: "4px solid #22c55e" }}>
                        <h4 style={{ color: "#22c55e", fontSize: 14, marginBottom: 12 }}>Strengths</h4>
                        {report.strengths.map((s, i) => <div key={i} style={{ fontSize: 13, marginBottom: 6 }}>✓ {s}</div>)}
                    </div>
                    <div className="stat-card" style={{ borderLeft: "4px solid #e84855" }}>
                        <h4 style={{ color: "#e84855", fontSize: 14, marginBottom: 12 }}>Areas to Improve</h4>
                        {report.weaknesses.map((w, i) => <div key={i} style={{ fontSize: 13, marginBottom: 6 }}>• {w}</div>)}
                    </div>
                </div>

                <div className="stat-card">
                    <h4 style={{ fontSize: 14, marginBottom: 10 }}>Detailed Feedback</h4>
                    {report.summary && (
                        <p style={{ fontSize: 14, lineHeight: 1.6, color: "var(--text-muted)", marginBottom: 16, fontStyle: "italic", borderLeft: "3px solid var(--accent-3)", paddingLeft: 12 }}>
                            "{report.summary}"
                        </p>
                    )}
                    <div style={{ fontSize: 14, lineHeight: 1.6, color: "var(--text-muted)" }}>
                        {typeof report.feedback === 'string' ? (
                            <p>{report.feedback}</p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {Object.entries(report.feedback).map(([key, value]) => (
                                    <div key={key} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                                        <span style={{ textTransform: 'capitalize', fontWeight: 600 }}>{key.replace(/_/g, ' ')}</span>
                                        <span style={{ color: 'var(--accent-3)', fontWeight: 800 }}>{value}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
                
                <button className="btn btn-primary" style={{ marginTop: 32, width: "100%" }} onClick={() => setStatus("idle")}>Return to Dashboard</button>
            </div>
        );
    }

    return (
        <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 120px)", maxWidth: 900, margin: "0 auto", background: "var(--surface)", borderRadius: "var(--radius)", border: "1px solid var(--border)", overflow: "hidden" }}>
            <div style={{ padding: "16px 24px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(255,255,255,0.02)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 10px #22c55e" }}></div>
                    <span style={{ fontWeight: 600, fontSize: 14 }}>Live Mock Interview</span>
                </div>
                <button className="btn btn-ghost" onClick={handleEnd} style={{ padding: "6px 12px", fontSize: 12, color: "#e84855" }}>End Session</button>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "24px", display: "flex", flexDirection: "column", gap: 16 }}>
                {messages.map((m, i) => (
                    <div key={i} style={{ 
                        alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                        maxWidth: "80%",
                        padding: "12px 18px",
                        borderRadius: m.role === "user" ? "18px 18px 2px 18px" : "18px 18px 18px 2px",
                        background: m.role === "user" ? "var(--primary)" : "rgba(255,255,255,0.05)",
                        color: m.role === "user" ? "white" : "var(--text)",
                        fontSize: 14,
                        lineHeight: 1.5,
                        boxShadow: "0 2px 10px rgba(0,0,0,0.1)"
                    }}>
                        {m.content}
                    </div>
                ))}
                {loading && (
                    <div style={{ alignSelf: "flex-start", padding: "12px 18px", borderRadius: "18px 18px 18px 2px", background: "rgba(255,255,255,0.05)", fontSize: 14 }}>
                        Agent is thinking...
                    </div>
                )}
                <div ref={chatEndRef} />
            </div>

            <form onSubmit={handleSend} style={{ padding: "20px 24px", borderTop: "1px solid var(--border)", display: "flex", gap: 12 }}>
                <input 
                    type="text" 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type your response..."
                    disabled={loading}
                    autoFocus
                    style={{ 
                        flex: 1, 
                        background: "rgba(255,255,255,0.08)", 
                        border: "1px solid var(--border)", 
                        borderRadius: "100px", 
                        padding: "12px 20px", 
                        color: "#1e1e1e", 
                        fontSize: "14px",
                        outline: "none" 
                    }}
                />
                <button type="submit" disabled={loading || !input.trim()} className="btn btn-primary" style={{ borderRadius: "50%", width: 44, height: 44, padding: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon name="send" size={18} />
                </button>
            </form>
            <Toast message={toastMsg} />
        </div>
    );
}
