import Icon from "../../components/ui/Icon";

export default function SessionsPage() {
    return (
        <div style={{ padding: 40, textAlign: 'center' }}>
            <div style={{ width: 80, height: 80, background: "rgba(245,158,11,0.1)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
                <Icon name="calendar" size={40} color="#f59e0b" />
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 700, color: "var(--primary)" }}>Upcoming Sessions</h2>
            <p style={{ color: "var(--text-muted)", maxWidth: 400, margin: "12px auto" }}>View and manage your scheduled mentorship sessions here.</p>
        </div>
    );
}
