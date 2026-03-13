// src/components/layout/Sidebar.jsx
import { useNavigate, useLocation } from "react-router-dom";
import Logo from "../ui/Logo";
import Icon from "../ui/Icon";
import { useAuthContext } from "../../context/AuthContext";

const navItems = [
    { id: "overview", label: "Overview", icon: "home", path: "/dashboard/overview" },
    { id: "resumes", label: "Resumes", icon: "file", path: "/dashboard/resumes" },
    { id: "mentors", label: "Find Mentor", icon: "users", path: "/dashboard/mentors" },
];

export default function Sidebar({ isOpen, onClose }) {
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const { logout } = useAuthContext();

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
                    const active = pathname.includes(item.id);
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