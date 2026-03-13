// src/components/ui/Logo.jsx
export default function Logo({ size = "md", onClick, dark = false }) {
    const sizes = {
        sm: { box: 32, font: 14, text: 16 },
        md: { box: 40, font: 18, text: 18 },
        lg: { box: 52, font: 24, text: 22 },
    };
    const s = sizes[size];

    return (
        <div
            onClick={onClick}
            style={{ display: "flex", alignItems: "center", gap: 10, cursor: onClick ? "pointer" : "default" }}
        >
            <div style={{
                width: s.box, height: s.box,
                background: "var(--accent)",
                borderRadius: 10,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: "var(--font-logo)",
                fontWeight: 800,
                fontSize: s.font,
                color: "white",
                flexShrink: 0,
                boxShadow: "0 4px 14px rgba(232,72,85,0.35)",
                letterSpacing: "-0.02em",
            }}>P</div>
            <span style={{
                fontFamily: "var(--font-logo)",
                fontWeight: 700,
                fontSize: s.text,
                color: dark ? "white" : "var(--primary)",
                letterSpacing: "-0.02em",
                lineHeight: 1,
            }}>
                PathForge <span style={{ color: "var(--accent)" }}>AI</span>
            </span>
        </div>
    );
}