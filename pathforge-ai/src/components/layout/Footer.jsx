// src/components/layout/Footer.jsx
import Logo from "../ui/Logo";

const cols = [
    { title: "Product", links: ["Features", "Pricing", "API", "Changelog"] },
    { title: "Company", links: ["About", "Blog", "Careers", "Press"] },
    { title: "Legal", links: ["Privacy", "Terms", "Security", "Cookies"] },
];

export default function Footer() {
    return (
        <footer className="footer">
            <div className="container">
                <div className="footer-grid">
                    <div className="footer-logo-desc">
                        <Logo dark size="md" />
                        <p className="footer-logo-p">
                            AI-powered career intelligence platform helping professionals land their dream jobs.
                        </p>
                    </div>
                    {cols.map(col => (
                        <div key={col.title}>
                            <div className="footer-col-title">{col.title}</div>
                            {col.links.map(l => (
                                <div key={l} className="footer-link">
                                    {l}
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
                <div className="footer-bottom">
                    <span className="footer-bottom-text">© 2025 PathForge AI. All rights reserved.</span>
                    <span className="footer-bottom-text">Built with ❤️ for ambitious professionals</span>
                </div>
            </div>
        </footer>
    );
}