// src/components/layout/Sidebar.jsx
import { useNavigate, useLocation } from "react-router-dom";
import Logo from "../ui/Logo";
import Icon from "../ui/Icon";
import { useAuthContext } from "../../context/AuthContext";

const studentNav = [
    { id: "overview", label: "Overview", icon: "home", path: "/dashboard/overview" },
    { id: "resumes", label: "Resumes", icon: "file", path: "/dashboard/resumes" },
    { id: "interview", label: "Mock Interview", icon: "terminal", path: "/dashboard/interview" },
    { id: "mentors", label: "Find Mentor", icon: "users", path: "/dashboard/mentors" },
    { id: "chat", label: "Messages", icon: "mail", path: "/dashboard/chat" },
];

const mentorNav = [
    { id: "overview", label: "Mentor Home", icon: "home", path: "/dashboard/overview" },
    { id: "students", label: "My Students", icon: "users", path: "/dashboard/students" },
    { id: "chat", label: "Messages", icon: "mail", path: "/dashboard/chat" },
    { id: "sessions", label: "Sessions", icon: "calendar", path: "/dashboard/sessions" },
    { id: "profile", label: "Expert Profile", icon: "user", path: "/dashboard/settings" },
];

export default function Sidebar({ isOpen, onClose }) {
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const { logout, user } = useAuthContext();
    console.log("Current User in Sidebar:", user);

    const navItems = user?.role === 'mentor' ? mentorNav : studentNav;

    const handleNav = (path) => {
        navigate(path);
        if (onClose) onClose();
    };

    return (
        <>
            {/* Overlay for mobile: shows when sidebar is open */}
            {isOpen && <div className="sidebar-overlay" onClick={onClose} />}

            <div className={`sidebar ${isOpen ? "open" : ""}`}>
                {/* Close Button for Mobile */}
                <button 
                    style={{ 
                        position: "absolute", 
                        right: 12, 
                        top: 12, 
                        background: "none", 
                        border: "none", 
                        color: "rgba(255,255,255,0.4)", 
                        cursor: "pointer",
                        display: "none",
                        padding: 8
                    }}
                    onClick={onClose}
                    id="sidebar-close"
                >
                    <Icon name="close" size={24} />
                </button>

                {/* Logo */}
                <div onClick={() => handleNav("/")} style={{ cursor: "pointer", marginBottom: 32 }}>
                    <Logo dark size="sm" />
                </div>

                {/* Section label */}
                <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: "0.1em", padding: "0 16px", marginBottom: 8 }}>
                    Main
                </div>

                {/* Nav links */}
                {navItems.map(item => {
                    const active = pathname === item.path;
                    return (
                        <button
                            key={item.id}
                            className={`sidebar-link ${active ? "active" : ""}`}
                            onClick={() => handleNav(item.path)}
                        >
                            <Icon name={item.icon} size={16} color={active ? "white" : "rgba(255,255,255,0.5)"} />
                            {item.label}
                        </button>
                    );
                })}

                {/* Bottom links */}
                <div style={{ marginTop: "auto", borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 16 }}>
                    <button className="sidebar-link" onClick={logout}>
                        <Icon name="logout" size={16} color="rgba(255,255,255,0.5)" />
                        Sign Out
                    </button>
                </div>
            </div>

            <style>{`
                @media (max-width: 768px) {
                    #sidebar-close { display: flex !important; }
                }
            `}</style>
        </>
    );
}