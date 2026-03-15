// src/pages/dashboard/DashboardLayout.jsx
import { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Sidebar from "../../components/layout/Sidebar";
import Icon from "../../components/ui/Icon";
import Logo from "../../components/ui/Logo";

export default function DashboardLayout() {
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div style={{ display: "flex", minHeight: "100vh" }}>
            {/* Mobile Header: ONLY Logo and Hamburger */}
            <div className="mobile-header" style={{ display: "none" }}>
                <div onClick={() => navigate("/")} style={{ cursor: "pointer" }}>
                    <Logo size="sm" />
                </div>
                <button 
                    className="hamburger-btn" 
                    onClick={() => setSidebarOpen(true)}
                >
                    <Icon name="menu" size={24} />
                </button>
            </div>

            <Sidebar 
                isOpen={sidebarOpen} 
                onClose={() => setSidebarOpen(false)} 
            />
            
            <div className="dash-content">
                {/* Child page renders here */}
                <Outlet />
            </div>

            <style>{`
                @media (max-width: 768px) {
                    .mobile-header { display: flex !important; }
                }
            `}</style>
        </div>
    );
}