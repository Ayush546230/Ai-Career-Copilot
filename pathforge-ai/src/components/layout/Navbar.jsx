import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Logo from "../ui/Logo";
import Icon from "../ui/Icon";
import { useAuthContext } from "../../context/AuthContext";

export default function Navbar() {
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuthContext();

    useEffect(() => {
        const fn = () => setScrolled(window.scrollY > 40);
        window.addEventListener("scroll", fn);
        return () => window.removeEventListener("scroll", fn);
    }, []);

    // Close mobile menu on route change
    useEffect(() => {
        setMobileMenuOpen(false);
    }, [location.pathname]);

    const handleNavClick = (e, target) => {
        if (location.pathname === "/") {
            e.preventDefault();
            document.getElementById(target)?.scrollIntoView({ behavior: 'smooth' });
            setMobileMenuOpen(false);
        } else {
            navigate(`/#${target}`);
        }
    };

    return (
        <>
            <nav className={`navbar ${scrolled ? "scrolled" : ""}`}>
                <div className="container">
                    <Logo onClick={() => navigate("/")} />

                    {/* Desktop Links */}
                    <div className="nav-links">
                        {["Features", "Mentors", "FAQ"].map(item => (
                            <a
                                key={item}
                                href={`#${item.toLowerCase()}`}
                                className="nav-link"
                                onClick={(e) => handleNavClick(e, item.toLowerCase())}
                            >
                                {item}
                            </a>
                        ))}
                    </div>

                    {/* Desktop Actions */}
                    <div className="nav-actions">
                        {user ? (
                            <button className="btn btn-primary" onClick={() => navigate("/dashboard")}>
                                Dashboard <Icon name="arrow" size={14} />
                            </button>
                        ) : (
                            <>
                                <button className="btn btn-ghost" onClick={() => navigate("/signin")}>Sign In</button>
                                <button className="btn btn-primary" onClick={() => navigate("/signup")}>
                                    Get Started <Icon name="arrow" size={14} />
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </nav>

            {/* Hamburger Button - Outside nav to stay on top of overlay */}
            <button 
                className={`hamburger-btn ${mobileMenuOpen ? 'active' : ''}`} 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle menu"
            >
                <span></span>
                <span></span>
                <span></span>
            </button>

            {/* Mobile Menu Overlay - Outside nav for absolute layering */}
            <div className={`mobile-nav-overlay ${mobileMenuOpen ? 'open' : ''}`}>
                <div className="mobile-nav-links">
                    {["Features", "Mentors", "FAQ"].map(item => (
                        <a
                            key={item}
                            href={`#${item.toLowerCase()}`}
                            className="mobile-nav-link"
                            onClick={(e) => handleNavClick(e, item.toLowerCase())}
                        >
                            {item}
                        </a>
                    ))}
                </div>
                
                <div className="mobile-nav-actions">
                    {user ? (
                        <button className="btn btn-primary" style={{ width: '100%', padding: '16px' }} onClick={() => navigate("/dashboard")}>
                            Dashboard <Icon name="arrow" size={14} />
                        </button>
                    ) : (
                        <>
                            <button className="btn btn-ghost" style={{ width: '100%', padding: '16px', marginBottom: '12px' }} onClick={() => navigate("/signin")}>Sign In</button>
                            <button className="btn btn-primary" style={{ width: '100%', padding: '16px' }} onClick={() => navigate("/signup")}>
                                Get Started <Icon name="arrow" size={14} />
                            </button>
                        </>
                    )}
                </div>
            </div>
        </>
    );
}