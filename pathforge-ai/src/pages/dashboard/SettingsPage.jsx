// src/pages/dashboard/SettingsPage.jsx
import { useState } from "react";
import Icon from "../../components/ui/Icon";
import { useAuthContext } from "../../context/AuthContext";
import Toast from "../../components/ui/Toast";
import { useToast } from "../../hooks/useToast";

export default function SettingsPage() {
    const { user } = useAuthContext();
    const { message, showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        firstName: user?.firstName || "",
        lastName: user?.lastName || "",
        email: user?.email || "",
        role: user?.role || "student"
    });

    const handleSave = () => {
        setLoading(true);
        // Mock save logic
        setTimeout(() => {
            setLoading(false);
            showToast("Settings updated successfully! 🎉");
        }, 800);
    };

    return (
        <div style={{ maxWidth: 800 }}>
            {/* Header */}
            <div style={{ marginBottom: 32 }}>
                <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 26, color: "var(--primary)", letterSpacing: "-0.02em" }}>Settings</h1>
                <p style={{ color: "var(--text-muted)", fontSize: 14, marginTop: 2 }}>Manage your account preferences and profile</p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>
                {/* Profile Section */}
                <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: 28 }}>
                    <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18, color: "var(--primary)", marginBottom: 20, display: "flex", alignItems: "center", gap: 10 }}>
                        <Icon name="user" size={18} color="var(--accent)" /> Personal Profile
                    </h3>

                    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                            <div>
                                <label style={{ fontSize: 13, fontWeight: 600, color: "var(--text-muted)", marginBottom: 8, display: "block" }}>First Name</label>
                                <input className="input" value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} />
                            </div>
                            <div>
                                <label style={{ fontSize: 13, fontWeight: 600, color: "var(--text-muted)", marginBottom: 8, display: "block" }}>Last Name</label>
                                <input className="input" value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} />
                            </div>
                        </div>

                        <div>
                            <label style={{ fontSize: 13, fontWeight: 600, color: "var(--text-muted)", marginBottom: 8, display: "block" }}>Email Address</label>
                            <input className="input" value={form.email} readOnly style={{ background: "var(--bg-alt)", cursor: "not-allowed" }} />
                            <p style={{ fontSize: 11, color: "var(--text-light)", marginTop: 6 }}>Email cannot be changed for security reasons.</p>
                        </div>

                        <div>
                            <label style={{ fontSize: 13, fontWeight: 600, color: "var(--text-muted)", marginBottom: 8, display: "block" }}>Account Role</label>
                            <div style={{ padding: "10px 14px", background: "var(--bg-alt)", border: "1px solid var(--border)", borderRadius: 10, fontSize: 14, color: "var(--text)", textTransform: "capitalize" }}>
                                {form.role}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Preferences Section */}
                <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: 28 }}>
                        <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18, color: "var(--primary)", marginBottom: 20, display: "flex", alignItems: "center", gap: 10 }}>
                            <Icon name="settings" size={18} color="var(--accent)" /> Preferences
                        </h3>

                        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                <div>
                                    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--primary)" }}>Email Notifications</div>
                                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Receive weekly career insights</div>
                                </div>
                                <div style={{ width: 44, height: 24, background: "var(--accent)", borderRadius: 12, position: "relative", cursor: "pointer" }}>
                                    <div style={{ width: 18, height: 18, background: "white", borderRadius: "50%", position: "absolute", right: 3, top: 3 }} />
                                </div>
                            </div>

                            <div className="divider" />

                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                <div>
                                    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--primary)" }}>Dark Mode</div>
                                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Switch theme for night viewing</div>
                                </div>
                                <div style={{ width: 44, height: 24, background: "var(--border)", borderRadius: 12, position: "relative", cursor: "pointer" }}>
                                    <div style={{ width: 18, height: 18, background: "white", borderRadius: "50%", position: "absolute", left: 3, top: 3 }} />
                                </div>
                            </div>
                        </div>
                    </div>

                    <button className="btn btn-primary" style={{ width: "100%", padding: 16, fontSize: 15 }} onClick={handleSave} disabled={loading}>
                        {loading ? "Saving..." : "Save Changes"}
                    </button>

                    <button className="btn btn-ghost" style={{ width: "100%", padding: 16, fontSize: 14, color: "var(--accent)" }}>
                        Delete Account
                    </button>
                </div>
            </div>

            <Toast message={message} />
        </div>
    );
}
