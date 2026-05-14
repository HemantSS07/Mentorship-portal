interface Props {
  skill: string;
  selected?: boolean;
  onClick?: () => void;
}

export default function SkillBadge({ skill, selected, onClick }: Props) {
  const base: React.CSSProperties = {
    display: "inline-flex", alignItems: "center",
    padding: "0.18rem 0.6rem", borderRadius: 6,
    fontSize: "0.72rem", fontWeight: 500,
    cursor: onClick ? "pointer" : "default",
    transition: "all 0.15s", border: "1px solid",
    whiteSpace: "nowrap",
  };
  const normal: React.CSSProperties = {
    background: "var(--bg-elevated)", color: "var(--text-2)",
    borderColor: "var(--border)",
  };
  const active: React.CSSProperties = {
    background: "var(--accent-dim)", color: "#a78bfa",
    borderColor: "var(--accent-border)",
  };

  return (
    <span
      onClick={onClick}
      style={{ ...base, ...(selected ? active : normal) }}
      onMouseEnter={onClick ? (e) => {
        if (!selected) {
          (e.currentTarget as HTMLElement).style.borderColor = "var(--border-hover)";
          (e.currentTarget as HTMLElement).style.color = "var(--text-1)";
        }
      } : undefined}
      onMouseLeave={onClick ? (e) => {
        if (!selected) {
          (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
          (e.currentTarget as HTMLElement).style.color = "var(--text-2)";
        }
      } : undefined}
    >
      {skill}
    </span>
  );
}
