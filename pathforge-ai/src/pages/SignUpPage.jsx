import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Logo from "../components/ui/Logo";
import Icon from "../components/ui/Icon";
import { useAuthContext } from "../context/AuthContext";
import Toast from "../components/ui/Toast";
import { useToast } from "../hooks/useToast";

export default function SignUpPage() {
    const navigate = useNavigate();
    const { signup } = useAuthContext();
    const { message, showToast } = useToast();
    const [form, setForm] = useState({ firstName: "", lastName: "", email: "", password: "", targetRole: "", role: "student" });
    const [loading, setLoading] = useState(false);
    const [showPass, setShowPass] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await signup(form);
            navigate("/dashboard/overview");
        } catch (err) {
            console.error(err);
            showToast(err.response?.data?.message || "Registration failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            {/* Left */}
            <div className="auth-sidebar">
                <div className="orb" style={{ width: 400, height: 400, background: "rgba(232,72,85,0.12)", top: -100, right: -100 }} />
                <div className="orb" style={{ width: 300, height: 300, background: "rgba(61,90,128,0.15)", bottom: 50, left: -50 }} />
                <div onClick={() => navigate("/")} style={{ cursor: "pointer", position: "relative", zIndex: 1 }}><Logo dark /></div>
                <div className="auth-sidebar-content">
                    <div style={{ fontSize: 44, marginBottom: 24, animation: "float 4s ease-in-out infinite" }}>🎯</div>
                    <h2 className="auth-sidebar-h2">Your career transformation starts here.</h2>
                    <p className="auth-sidebar-p">Join thousands of professionals who've used AI-powered insights to land roles at Google, Meta, Amazon, and more.</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 40 }}>
                        {["ATS Score Analysis", "Skill Gap Detection", "Expert Mentor Matching", "Career Roadmap Generation"].map((f, i) => (
                            <div key={f} className="auth-sidebar-feature" style={{ animation: `fadeUp 0.5s ${0.2 + i * 0.1}s ease both` }}>
                                <div className="auth-sidebar-check">
                                    <Icon name="check" size={12} color="var(--accent)" />
                                </div>
                                <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 14 }}>{f}</span>
                            </div>
                        ))}
                    </div>
                </div>
                <div style={{ display: "flex", gap: 16, position: "relative", zIndex: 1 }}>
                    <span style={{ color: "#F59E0B", fontSize: 14 }}>★★★★★</span>
                    <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>"Best career tool I've ever used"</span>
                    <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>— Sarah K., SWE @ Google</span>
                </div>
            </div>

            {/* Right */}
            <div className="auth-form-container">
                <div className="auth-form-box">
                    <h1 className="auth-form-h1">Create your account</h1>
                    <p style={{ color: "var(--text-muted)", fontSize: 15, marginBottom: 36 }}>Start your free trial. 3 resume uploads included.</p>

                    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                        {/* Name */}
                        <div className="auth-name-grid">
                            <div>
                                <label style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", marginBottom: 6, display: "block" }}>First Name</label>
                                <div style={{ position: "relative" }}>
                                    <input className="input" placeholder="Rohan" value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} style={{ paddingLeft: 44 }} />
                                    <div style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-light)" }}><Icon name="user" size={16} /></div>
                                </div>
                            </div>
                            <div>
                                <label style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", marginBottom: 6, display: "block" }}>Last Name</label>
                                <div style={{ position: "relative" }}>
                                    <input className="input" placeholder="Kumar" value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} style={{ paddingLeft: 44 }} />
                                    <div style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-light)" }}><Icon name="user" size={16} /></div>
                                </div>
                            </div>
                        </div>
                        {/* Email */}
                        <div>
                            <label style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", marginBottom: 6, display: "block" }}>Email Address</label>
                            <div style={{ position: "relative" }}>
                                <input className="input" type="email" placeholder="you@example.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} style={{ paddingLeft: 44 }} />
                                <div style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-light)" }}><Icon name="mail" size={16} /></div>
                            </div>
                        </div>
                        {/* Password */}
                        <div>
                            <label style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", marginBottom: 6, display: "block" }}>Password</label>
                            <div style={{ position: "relative" }}>
                                <input className="input" type={showPass ? "text" : "password"} placeholder="Create a password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} style={{ paddingLeft: 44, paddingRight: 44 }} />
                                <div style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-light)" }}><Icon name="lock" size={16} /></div>
                                <button onClick={() => setShowPass(!showPass)} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 0 }}><Icon name="eye" size={16} /></button>
                            </div>
                        </div>
                        {/* Target Role */}
                        <div>
                            <label style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", marginBottom: 6, display: "block" }}>Target Role</label>
                            <div style={{ position: "relative" }}>
                                <input
                                    className="input"
                                    placeholder="e.g. Senior Backend Engineer"
                                    style={{ paddingLeft: 44 }}
                                    value={form.targetRole}
                                    onChange={e => setForm({ ...form, targetRole: e.target.value })}
                                />
                                <div style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-light)" }}><Icon name="target" size={16} /></div>
                            </div>
                        </div>

                        <button className="btn btn-primary" style={{ width: "100%", padding: "16px", marginTop: 8, fontSize: 16 }} onClick={handleSubmit} disabled={loading}>
                            {loading
                                ? <div style={{ width: 18, height: 18, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                                : <>Create Account <Icon name="arrow" size={16} /></>
                            }
                        </button>
                    </div>

                    <p style={{ textAlign: "center", marginTop: 28, fontSize: 14, color: "var(--text-muted)" }}>
                        Already have an account?{" "}
                        <span style={{ color: "var(--accent)", cursor: "pointer", fontWeight: 600 }} onClick={() => navigate("/signin")}>Sign In</span>
                    </p>
                </div>
            </div>
            <Toast message={message} />
        </div>
    );
}