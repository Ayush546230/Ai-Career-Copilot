// src/pages/dashboard/SettingsPage.jsx
import { useState, useEffect } from "react";
import axios from "axios";
import Icon from "../../components/ui/Icon";
import { useAuthContext } from "../../context/AuthContext";
import Toast from "../../components/ui/Toast";
import { useToast } from "../../hooks/useToast";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function SettingsPage() {
    const { user } = useAuthContext();
    const { message, showToast } = useToast();
    const [loading, setLoading] = useState(false);

    const [form, setForm] = useState({
        firstName: "",
        lastName: "",
        email: "",
        role: "student",
        tagline: "",
        bio: "",
        currentCompany: "",
        yearsOfExperience: 0,
        skills: "",
        domains: "",
        mentorshipStyle: "Hands-on",
        availability: "accepting"
    });

    // Sync form with user data when it loads
    useEffect(() => {
        if (user) {
            setForm({
                firstName: user.firstName || user.profile?.firstName || "",
                lastName: user.lastName || user.profile?.lastName || "",
                email: user.email || "",
                role: user.role || "student",
                tagline: user.profile?.tagline || "",
                bio: user.profile?.bio || "",
                currentCompany: user.profile?.currentCompany || "",
                yearsOfExperience: user.mentorship?.experience?.totalYears || user.profile?.yearsOfExperience || 0,
                skills: user.expertise?.technicalSkills?.map(s => s.name).join(", ") || "",
                domains: user.expertise?.domains?.map(d => d.name || d).join(", ") || "",
                mentorshipStyle: user.mentorship?.style?.approach?.[0] || "Hands-on",
                availability: user.availability || user.mentorship?.availability?.status || "accepting"
            });
        }
    }, [user]);

    const handleSave = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const endpoint = form.role === 'mentor' ? '/mentor/profile' : '/student/profile';
            
            const payload = form.role === 'mentor' ? {
                profile: {
                    firstName: form.firstName,
                    lastName: form.lastName,
                    tagline: form.tagline,
                    bio: form.bio,
                    currentCompany: form.currentCompany
                },
                expertise: {
                    technicalSkills: form.skills.split(",").map(s => ({ skill: s.trim(), proficiency: 'expert' })),
                    domains: form.domains.split(",").map(d => d.trim())
                },
                mentorship: {
                    experience: { totalYears: parseInt(form.yearsOfExperience) },
                    style: { approach: form.mentorshipStyle }
                },
                availability: form.availability
            } : form;

            await axios.patch(`${API_URL}${endpoint}`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            showToast("Expert Profile updated and synced with AI! 🚀");
        } catch (err) {
            console.error(err);
            showToast("Failed to update profile");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: 800, paddingBottom: 40 }}>
            <div style={{ marginBottom: 32 }}>
                <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 26, color: "var(--primary)" }}>Settings</h1>
                <p style={{ color: "var(--text-muted)", fontSize: 14 }}>Manage your account and expert profile</p>
            </div>

            {form.role === 'student' && (
                <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: 28 }}>
                    <h3 style={{ fontWeight: 700, fontSize: 18, color: "var(--primary)", marginBottom: 20, display: "flex", alignItems: "center", gap: 10 }}>
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
                        </div>
                        <button className="btn btn-primary" style={{ width: "100%", padding: 18, marginTop: 10 }} onClick={handleSave} disabled={loading}>
                            {loading ? "Saving..." : "Save Changes"}
                        </button>
                    </div>
                </div>
            )}

            {form.role === 'mentor' && (
                <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
                    {/* Professional Identity */}
                    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: 28 }}>
                        <h3 style={{ fontWeight: 700, fontSize: 18, color: "var(--primary)", marginBottom: 20, display: "flex", alignItems: "center", gap: 10 }}>
                            <Icon name="user" size={18} color="var(--accent)" /> Professional Identity
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
                                <label style={{ fontSize: 13, fontWeight: 600, color: "var(--text-muted)", marginBottom: 8, display: "block" }}>Professional Tagline</label>
                                <input className="input" placeholder="e.g. Senior SWE @ Meta | React Expert" value={form.tagline} onChange={e => setForm({ ...form, tagline: e.target.value })} />
                            </div>
                            <div>
                                <label style={{ fontSize: 13, fontWeight: 600, color: "var(--text-muted)", marginBottom: 8, display: "block" }}>Biography</label>
                                <textarea className="input" style={{ minHeight: 100 }} value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} />
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                                <div>
                                    <label style={{ fontSize: 13, fontWeight: 600, color: "var(--text-muted)", marginBottom: 8, display: "block" }}>Current Company</label>
                                    <input className="input" placeholder="e.g. Google, Meta" value={form.currentCompany} onChange={e => setForm({ ...form, currentCompany: e.target.value })} />
                                </div>
                                <div>
                                    <label style={{ fontSize: 13, fontWeight: 600, color: "var(--text-muted)", marginBottom: 8, display: "block" }}>Years of Experience</label>
                                    <input className="input" type="number" value={form.yearsOfExperience} onChange={e => setForm({ ...form, yearsOfExperience: e.target.value })} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Expertise */}
                    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: 28 }}>
                        <h3 style={{ fontWeight: 700, fontSize: 18, color: "var(--primary)", marginBottom: 20, display: "flex", alignItems: "center", gap: 10 }}>
                            <Icon name="terminal" size={18} color="var(--accent-2)" /> Expertise
                        </h3>
                        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                            <div>
                                <label style={{ fontSize: 13, fontWeight: 600, color: "var(--text-muted)", marginBottom: 8, display: "block" }}>Skills (Comma separated)</label>
                                <input className="input" value={form.skills} onChange={e => setForm({ ...form, skills: e.target.value })} />
                            </div>
                            <div>
                                <label style={{ fontSize: 13, fontWeight: 600, color: "var(--text-muted)", marginBottom: 8, display: "block" }}>Industry Domains</label>
                                <input className="input" value={form.domains} onChange={e => setForm({ ...form, domains: e.target.value })} />
                            </div>
                        </div>
                    </div>

                    {/* Availability */}
                    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: 28 }}>
                        <h3 style={{ fontWeight: 700, fontSize: 18, color: "var(--primary)", marginBottom: 20, display: "flex", alignItems: "center", gap: 10 }}>
                            <Icon name="settings" size={18} color="var(--accent-3)" /> Availability
                        </h3>
                        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                <span style={{ fontSize: 14 }}>Accepting New Students</span>
                                <button 
                                    onClick={() => setForm({ ...form, availability: form.availability === 'accepting' ? 'busy' : 'accepting' })}
                                    style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: form.availability === 'accepting' ? "var(--accent-3)" : "var(--border)", color: "white", cursor: "pointer" }}
                                >
                                    {form.availability === 'accepting' ? 'Yes' : 'No'}
                                </button>
                            </div>
                        </div>
                    </div>

                    <button className="btn btn-primary" style={{ width: "100%", padding: 18 }} onClick={handleSave} disabled={loading}>
                        {loading ? "Saving..." : "Update Expert Profile"}
                    </button>
                </div>
            )}
            <Toast message={message} />
        </div>
    );
}
