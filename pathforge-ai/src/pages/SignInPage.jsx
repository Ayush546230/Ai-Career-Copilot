import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Logo from "../components/ui/Logo";
import Icon from "../components/ui/Icon";
import { useAuthContext } from "../context/AuthContext";
import Toast from "../components/ui/Toast";
import { useToast } from "../hooks/useToast";

export default function SignInPage() {
    const navigate = useNavigate();
    const { login } = useAuthContext();
    const { message, showToast } = useToast();
    const [form, setForm] = useState({ email: "", password: "" });
    const [loading, setLoading] = useState(false);
    const [showPass, setShowPass] = useState(false);
    const [error, setError] = useState("");

    const handleInputChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        if (error) setError("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await login(form);
            navigate("/dashboard/overview");
        } catch (err) {
            console.error(err);
            const msg = err.response?.data?.message || "Invalid credentials. Please try again.";
            setError(msg);
            showToast(msg);
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
                    <div style={{ fontSize: 44, marginBottom: 24, animation: "float 4s ease-in-out infinite" }}>👋</div>
                    <h2 className="auth-sidebar-h2">Welcome back to PathForge.</h2>
                    <p className="auth-sidebar-p">Your AI-powered career insights are waiting for you. Let's continue forging your path.</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 40 }}>
                        {["ATS Score Analysis", "Skill Gap Detection", "Expert Mentor Matching", "Career Roadmap Generation"].map((f, i) => (
                            <div key={f} className="auth-sidebar-feature">
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
                    <h1 className="auth-form-h1">Sign in to your account</h1>
                    <p style={{ color: "var(--text-muted)", fontSize: 15, marginBottom: 36 }}>Welcome back! Enter your credentials to continue.</p>

                    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                        {error && (
                            <div style={{ padding: "12px 16px", background: "rgba(232,72,85,0.08)", border: "1px solid rgba(232,72,85,0.2)", borderRadius: 10, color: "var(--accent)", fontSize: 13, fontWeight: 500, display: "flex", alignItems: "center", gap: 8 }}>
                                <Icon name="info" size={14} /> {error}
                            </div>
                        )}
                        {/* Email */}
                        <div>
                            <label style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", marginBottom: 6, display: "block" }}>Email Address</label>
                            <div style={{ position: "relative" }}>
                                <input name="email" className="input" type="email" placeholder="you@example.com" value={form.email} onChange={handleInputChange} style={{ paddingLeft: 44, borderColor: error ? "var(--accent)" : "" }} />
                                <div style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-light)" }}><Icon name="mail" size={16} /></div>
                            </div>
                        </div>
                        {/* Password */}
                        <div>
                            <label style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", marginBottom: 6, display: "block" }}>Password</label>
                            <div style={{ position: "relative" }}>
                                <input name="password" className="input" type={showPass ? "text" : "password"} placeholder="Enter your password" value={form.password} onChange={handleInputChange} style={{ paddingLeft: 44, paddingRight: 44, borderColor: error ? "var(--accent)" : "" }} />
                                <div style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-light)" }}><Icon name="lock" size={16} /></div>
                                <button onClick={() => setShowPass(!showPass)} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 0 }}><Icon name="eye" size={16} /></button>
                            </div>
                            <div style={{ textAlign: "right", marginTop: 8 }}>
                                <span style={{ fontSize: 13, color: "var(--accent)", cursor: "pointer", fontWeight: 500 }}>Forgot password?</span>
                            </div>
                        </div>

                        <button className="btn btn-primary" style={{ width: "100%", padding: "16px", marginTop: 8, fontSize: 16 }} onClick={handleSubmit} disabled={loading}>
                            {loading
                                ? <div style={{ width: 18, height: 18, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                                : <>Sign In <Icon name="arrow" size={16} /></>
                            }
                        </button>
                    </div>

                    <p style={{ textAlign: "center", marginTop: 28, fontSize: 14, color: "var(--text-muted)" }}>
                        Don't have an account?{" "}
                        <span style={{ color: "var(--accent)", cursor: "pointer", fontWeight: 600 }} onClick={() => navigate("/signup")}>Create one free</span>
                    </p>
                </div>
            </div>
            <Toast message={message} />
        </div>
    );
}