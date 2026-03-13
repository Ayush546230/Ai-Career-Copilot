
export function DonutScore({ score, size = 120, label = "" }) {
    const radius = (size - 20) / 2;
    const circumference = 2 * Math.PI * radius;
    const dashoffset = circumference - (score / 100) * circumference;
    const color = score >= 80 ? "#22c55e" : score >= 60 ? "#FF6B35" : "#E84855";

    return (
        <div style={{ position: "relative", width: size, height: size, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
            <svg width={size} height={size} style={{ transform: "rotate(-90deg)", position: "absolute" }}>
                <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--bg-2)" strokeWidth="8" />
                <circle
                    cx={size / 2} cy={size / 2} r={radius}
                    fill="none" stroke={color} strokeWidth="8"
                    strokeDasharray={circumference} strokeDashoffset={dashoffset}
                    strokeLinecap="round"
                    style={{ transition: "stroke-dashoffset 1.5s ease" }}
                />
            </svg>
            <div style={{ textAlign: "center", position: "relative", zIndex: 1 }}>
                <div style={{ fontSize: size / 5, fontWeight: 800, fontFamily: "var(--font-display)", color, lineHeight: 1 }}>{score}</div>
                {label && <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2 }}>{label}</div>}
            </div>
        </div>
    );
}

// src/components/ui/ScoreBar.jsx
export function ScoreBar({ label, value }) {
    const color = value >= 80 ? "#22c55e" : value >= 60 ? "#FF6B35" : "#E84855";
    return (
        <div style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 13 }}>
                <span style={{ color: "var(--text-muted)" }}>{label}</span>
                <span style={{ fontWeight: 600, color }}>{value}%</span>
            </div>
            <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${value}%`, background: color }} />
            </div>
        </div>
    );
}