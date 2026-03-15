// src/pages/dashboard/FindMentorPage.jsx
import Icon from "../../components/ui/Icon";

export default function FindMentorPage() {
    return (
        <div style={{ minHeight: "calc(100vh - 200px)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: 48 }}>
            <div style={{ width: 80, height: 80, background: "rgba(232,72,85,0.08)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24, animation: "float 4s ease-in-out infinite" }}>
                <Icon name="users" size={40} color="var(--accent)" />
            </div>
            <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 32, color: "var(--primary)", marginBottom: 16, letterSpacing: "-0.02em" }}>
                Mentor Matching Coming Soon
            </h1>
            <p style={{ color: "var(--text-muted)", fontSize: 16, maxWidth: 480, lineHeight: 1.6, marginBottom: 32 }}>
                We're currently hand-picking the best industry mentors from top tech companies to help you accelerate your career. Get ready for 1-on-1 sessions, resume reviews, and insider interview prep.
            </p>
            <div style={{ display: "flex", gap: 12 }}>
                <div style={{ padding: "8px 16px", background: "var(--bg-alt)", borderRadius: 20, fontSize: 13, fontWeight: 600, color: "var(--text-muted)", border: "1px solid var(--border)" }}>
                    Verified Professionals
                </div>
                <div style={{ padding: "8px 16px", background: "var(--bg-alt)", borderRadius: 20, fontSize: 13, fontWeight: 600, color: "var(--text-muted)", border: "1px solid var(--border)" }}>
                    1-on-1 Sessions
                </div>
            </div>
        </div>
    );
}
