import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Icon from "../../components/ui/Icon";
import Toast from "../../components/ui/Toast";
import { useToast } from "../../hooks/useToast";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function StudentsPage() {
    const navigate = useNavigate();
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const { message, showToast } = useToast();

    const handleRemoveStudent = async (studentId) => {
        if (!window.confirm("Are you sure you want to remove this student?")) return;
        
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(`${API_URL}/mentor/remove-student/${studentId}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                showToast("Student removed successfully");
                setStudents(prev => prev.filter(s => s.studentId !== studentId));
            }
        } catch (err) {
            showToast("Failed to remove student");
        }
    };

    useEffect(() => {
        const fetchStudents = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get(`${API_URL}/mentor/dashboard`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setStudents(res.data.data.mentor.activeStudents || []);
            } catch (err) {
                showToast("Failed to load students");
            } finally {
                setLoading(false);
            }
        };
        fetchStudents();
    }, []);

    if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Loading students...</div>;

    return (
        <>
            <div style={{ padding: "0 20px" }}>
                <div style={{ marginBottom: 32 }}>
                    <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 28, color: "var(--primary)" }}>My Students</h1>
                    <p style={{ color: "var(--text-muted)", fontSize: 14 }}>Manage your active students and keep track of their progress.</p>
                </div>

                {students.length > 0 ? (
                    <div className="grid-3" style={{ gap: 24 }}>
                        {students.map(student => (
                            <div key={student.studentId} style={{ background: "var(--surface)", borderRadius: "var(--radius)", padding: 24, border: "1px solid var(--border)", position: "relative" }}>
                                <button 
                                    className="btn btn-ghost hover-lift" 
                                    style={{ position: "absolute", top: 12, right: 12, padding: 8, color: "var(--danger, #ef4444)" }}
                                    onClick={() => handleRemoveStudent(student.studentId)}
                                    title="Remove Student"
                                >
                                    <Icon name="trash" size={16} />
                                </button>
                                <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
                                    <div style={{ width: 48, height: 48, borderRadius: "50%", background: "var(--bg-alt)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
                                        👨‍🎓
                                    </div>
                                    <div>
                                        <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--primary)", margin: 0 }}>{student.studentName}</h3>
                                        <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{student.targetRole || 'Mentee'}</div>
                                        <span className="tag tag-green" style={{ fontSize: 10, marginTop: 6, display: "inline-block" }}>{(student.status || 'active').toUpperCase()}</span>
                                    </div>
                                </div>
                                <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 20 }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                                        <span>Joined:</span>
                                        <span style={{ fontWeight: 600, color: "var(--text-main)" }}>
                                            {(() => {
                                                const d = new Date(student.joinedAt);
                                                return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
                                            })()}
                                        </span>
                                    </div>
                                </div>
                                <button 
                                    className="btn btn-primary" 
                                    style={{ width: "100%", display: "flex", justifyContent: "center", alignItems: "center", gap: 8 }}
                                    onClick={() => navigate("/dashboard/chat", { state: { recipient: { id: student.studentId, name: student.studentName } } })}
                                >
                                    <Icon name="mail" size={16} /> Message Student
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={{ padding: 60, textAlign: 'center', background: "var(--surface)", borderRadius: "var(--radius)", border: "1px dashed var(--border)" }}>
                        <div style={{ width: 80, height: 80, background: "rgba(34,197,94,0.1)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
                            <Icon name="users" size={40} color="#22c55e" />
                        </div>
                        <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--primary)" }}>No Active Students Yet</h2>
                        <p style={{ color: "var(--text-muted)", maxWidth: 400, margin: "12px auto" }}>When you accept a student's mentorship request, they will appear here.</p>
                    </div>
                )}
            </div>
            <Toast message={message} />
        </>
    );
}
