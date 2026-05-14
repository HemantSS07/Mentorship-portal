"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Star, BookOpen, Clock, TrendingUp, Zap } from "lucide-react";
import { LeaderboardEntry } from "@/types";
import { subscribeLeaderboard } from "@/lib/db";

// ── Medals ───────────────────────────────────────────────────────────────────
const MEDALS: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

// ── Sort options ─────────────────────────────────────────────────────────────
const SORT_OPTIONS = [
  { value: "rating",   label: "Highest Rated" },
  { value: "sessions", label: "Most Sessions" },
  { value: "response", label: "Fastest Response" },
] as const;
type SortKey = (typeof SORT_OPTIONS)[number]["value"];

// ── Row tints for top 3 ───────────────────────────────────────────────────────
function rowBg(rank: number) {
  if (rank === 1) return "linear-gradient(90deg, rgba(245,158,11,0.07) 0%, transparent 60%)";
  if (rank === 2) return "linear-gradient(90deg, rgba(167,139,250,0.06) 0%, transparent 60%)";
  if (rank === 3) return "linear-gradient(90deg, rgba(16,185,129,0.05) 0%, transparent 60%)";
  return "transparent";
}

// ── Avatar ────────────────────────────────────────────────────────────────────
function Avatar({ name, photo }: { name: string; photo?: string }) {
  const palette = ["#7c3aed", "#2563eb", "#059669", "#d97706", "#dc2626"];
  const color = palette[name.charCodeAt(0) % palette.length];
  return (
    <div style={{
      width: 38, height: 38, borderRadius: 10, flexShrink: 0,
      background: photo ? "transparent" : `${color}22`,
      border: `1.5px solid ${color}44`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: "0.95rem", fontWeight: 700, color,
    }}>
      {photo
        ? <img src={photo} alt={name} style={{ width: "100%", height: "100%", borderRadius: 8, objectFit: "cover" }} />
        : name[0]}
    </div>
  );
}

// ── Skeleton row ──────────────────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "48px 1fr 90px 90px 90px", padding: "1rem", gap: 0, alignItems: "center", borderBottom: "1px solid var(--border)" }}>
      <div className="skeleton" style={{ width: 28, height: 22, borderRadius: 4 }} />
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div className="skeleton" style={{ width: 38, height: 38, borderRadius: 10, flexShrink: 0 }} />
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div className="skeleton" style={{ width: 130, height: 13 }} />
          <div className="skeleton" style={{ width: 80, height: 11 }} />
        </div>
      </div>
      <div className="skeleton" style={{ width: 50, height: 18, borderRadius: 6, margin: "auto" }} />
      <div className="skeleton" style={{ width: 44, height: 18, borderRadius: 6, margin: "auto" }} />
      <div className="skeleton" style={{ width: 36, height: 16, borderRadius: 6, margin: "auto" }} />
    </div>
  );
}

// ── Rank badge ────────────────────────────────────────────────────────────────
function RankBadge({ rank }: { rank: number }) {
  const styles: Record<number, { bg: string; color: string; border: string; label: string }> = {
    1: { bg: "rgba(245,158,11,0.15)", color: "#f59e0b", border: "rgba(245,158,11,0.3)", label: "Top 1" },
    2: { bg: "rgba(167,139,250,0.12)", color: "#a78bfa", border: "rgba(167,139,250,0.3)", label: "Top 3" },
    3: { bg: "rgba(167,139,250,0.12)", color: "#a78bfa", border: "rgba(167,139,250,0.3)", label: "Top 3" },
  };
  const s = rank <= 3 ? styles[rank] ?? styles[3] : null;
  if (!s) return null;
  return (
    <span style={{
      fontSize: "0.6rem", fontWeight: 700, padding: "0.15rem 0.55rem",
      borderRadius: 99, background: s.bg, color: s.color,
      border: `1px solid ${s.border}`, letterSpacing: "0.04em",
      textTransform: "uppercase", flexShrink: 0,
    }}>{s.label}</span>
  );
}



// ── Page ──────────────────────────────────────────────────────────────────────
export default function LeaderboardPage() {
  const [sort, setSort] = useState<SortKey>("rating");
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    const unsub = subscribeLeaderboard(10, (data) => {
      setEntries(data);
      setLoading(false);
      setLastUpdated(new Date());
    });
    return unsub;
  }, []);

  // Client-side sort (data is pre-sorted by rating+sessions from DB; allow UI re-sort)
  const sorted = [...entries].sort((a, b) => {
    if (sort === "sessions") return b.totalSessions - a.totalSessions;
    if (sort === "response") return a.responseTimeHours - b.responseTimeHours;
    // default: rating DESC, then sessions DESC
    if (b.rating !== a.rating) return b.rating - a.rating;
    return b.totalSessions - a.totalSessions;
  });

  return (
    <div className="page-wrap" style={{ padding: "2.5rem 1.5rem 4rem" }}>

      {/* ── Page header ── */}
      <div style={{ marginBottom: "2rem", position: "relative" }}>
        <p style={{
          fontSize: "0.72rem", fontWeight: 700, color: "#a78bfa",
          textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6,
        }}>
          Hall of Fame
        </p>
        <h1 className="heading-lg" style={{ marginBottom: 6 }}>Mentor Leaderboard</h1>
        <p style={{ fontSize: "0.85rem", color: "var(--text-2)" }}>
          Our most impactful mentors, ranked by performance in real-time.
        </p>

        {/* Live badge */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 6, marginTop: 10,
          padding: "0.3rem 0.75rem", borderRadius: 99,
          background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)",
        }}>
          <span style={{
            display: "inline-block", width: 6, height: 6, borderRadius: "50%",
            background: "#22c55e", animation: "pulse-dot 1.8s infinite",
          }} />
          <span suppressHydrationWarning style={{ fontSize: "0.72rem", color: "#22c55e", fontWeight: 600 }}>
            Live · Last updated {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </span>
        </div>
      </div>

      {/* ── Sort tabs ── */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        marginBottom: "1.25rem", flexWrap: "wrap", gap: 10,
      }}>
        <div className="tab-bar">
          {SORT_OPTIONS.map(o => (
            <button
              key={o.value}
              className={`tab ${sort === o.value ? "active" : ""}`}
              onClick={() => setSort(o.value)}
            >
              {o.label}
            </button>
          ))}
        </div>
        <p style={{ fontSize: "0.75rem", color: "var(--text-3)" }}>
          Top {loading ? "–" : sorted.length} active mentors
        </p>
      </div>

      {/* ── Table ── */}
      <div className="card anim-1" style={{ padding: 0, overflow: "hidden", marginBottom: "2.5rem" }}>
        {/* Header row */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "48px 1fr 90px 90px 90px",
          padding: "0.6rem 1rem",
          borderBottom: "1px solid var(--border)",
          background: "var(--bg-elevated)",
        }}>
          {["#", "Mentor", "Sessions", "Rating", "Response"].map((h, i) => (
            <span key={h} style={{
              fontSize: "0.68rem", fontWeight: 700, color: "var(--text-3)",
              textTransform: "uppercase", letterSpacing: "0.05em",
              textAlign: i >= 2 ? "center" : "left",
            }}>{h}</span>
          ))}
        </div>

        {/* Data rows */}
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
          : sorted.length === 0
            ? (
              <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-3)" }}>
                <TrendingUp size={32} style={{ margin: "0 auto 12px", opacity: 0.4 }} />
                <p>No mentor data available yet.</p>
              </div>
            )
            : sorted.map((m, idx) => {
              const rank = idx + 1;
              return (
                <Link key={m.uid} href={`/mentor/${m.uid}`} style={{ textDecoration: "none" }}>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "48px 1fr 90px 90px 90px",
                      padding: "0.9rem 1rem",
                      borderBottom: "1px solid var(--border)",
                      alignItems: "center",
                      background: rowBg(rank),
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "var(--bg-elevated)"}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = rowBg(rank)}
                  >
                    {/* Rank */}
                    <span style={{
                      fontSize: rank <= 3 ? "1.1rem" : "0.82rem",
                      fontWeight: 700,
                      color: rank <= 3 ? "var(--text-1)" : "var(--text-3)",
                    }}>
                      {MEDALS[rank] ?? rank}
                    </span>

                    {/* Mentor info */}
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <Avatar name={m.name} photo={m.photoURL} />
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                          <p style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--text-1)" }}>{m.name}</p>
                          <RankBadge rank={rank} />
                        </div>
                        <div style={{ display: "flex", gap: 4, marginTop: 3, flexWrap: "wrap" }}>
                          {m.skills.slice(0, 2).map(s => (
                            <span key={s} style={{
                              fontSize: "0.63rem", padding: "0.1rem 0.4rem",
                              borderRadius: 5, background: "var(--bg-elevated)",
                              color: "var(--text-3)", border: "1px solid var(--border)",
                            }}>{s}</span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Sessions */}
                    <div style={{ textAlign: "center" }}>
                      <p style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--text-1)" }}>
                        {m.totalSessions}
                      </p>
                      <p style={{ fontSize: "0.62rem", color: "var(--text-3)" }}>sessions</p>
                    </div>

                    {/* Rating */}
                    <div style={{ textAlign: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 3 }}>
                        <Star size={12} style={{ fill: "#f59e0b", color: "#f59e0b" }} />
                        <span style={{ fontWeight: 700, fontSize: "0.875rem", color: "#f59e0b" }}>
                          {m.rating.toFixed(1)}
                        </span>
                      </div>
                      <p style={{ fontSize: "0.62rem", color: "var(--text-3)" }}>{m.totalRatings} reviews</p>
                    </div>

                    {/* Response time */}
                    <div style={{ textAlign: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 3 }}>
                        <Clock size={11} style={{ color: "#10b981" }} />
                        <span style={{ fontSize: "0.8rem", color: "var(--text-2)", fontWeight: 600 }}>
                          {m.responseTimeHours <= 1
                            ? "~1h"
                            : m.responseTimeHours <= 4
                              ? "~4h"
                              : m.responseTimeHours <= 12
                                ? "~12h"
                                : "~1d"}
                        </span>
                      </div>
                      <p style={{ fontSize: "0.62rem", color: "var(--text-3)" }}>response</p>
                    </div>
                  </div>
                </Link>
              );
            })}
      </div>



      {/* ── CTA ── */}
      <div className="card anim-3" style={{
        textAlign: "center", padding: "2.5rem 1.5rem",
        borderColor: "var(--accent-border)",
        background: "linear-gradient(135deg, var(--bg-card) 0%, rgba(124,58,237,0.06) 100%)",
      }}>
        <Zap size={24} style={{ color: "#a78bfa", margin: "0 auto 10px" }} />
        <p className="heading-md" style={{ marginBottom: 6 }}>Want to join the leaderboard?</p>
        <p style={{ fontSize: "0.82rem", color: "var(--text-2)", marginBottom: "1.25rem" }}>
          Register as a mentor, help juniors, and build your reputation.
        </p>
        <Link href="/register" className="btn btn-primary">Become a Mentor</Link>
      </div>

      <style>{`
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.5; transform: scale(1.3); }
        }
        @media (max-width: 700px) { .badge-grid { grid-template-columns: 1fr 1fr !important; } }
        @media (max-width: 480px) { .badge-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </div>
  );
}
