"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Star, TrendingUp, BookOpen, Zap, Clock } from "lucide-react";
import { LeaderboardEntry } from "@/types";
import { subscribeLeaderboard } from "@/lib/db";

// ── Rank medal / number ──────────────────────────────────────────────────────
const MEDALS: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

function rankLabel(rank: number) {
  return MEDALS[rank] ?? String(rank);
}

// ── Rank badge style (top 1 / top 3 / top 5) ────────────────────────────────
function RankBadge({ rank }: { rank: number }) {
  if (rank === 1)
    return (
      <span style={{
        fontSize: "0.6rem", fontWeight: 700, padding: "0.15rem 0.5rem",
        borderRadius: 99, background: "rgba(245,158,11,0.15)",
        color: "#f59e0b", border: "1px solid rgba(245,158,11,0.3)",
        letterSpacing: "0.04em", textTransform: "uppercase", flexShrink: 0,
      }}>Top 1</span>
    );
  if (rank <= 3)
    return (
      <span style={{
        fontSize: "0.6rem", fontWeight: 700, padding: "0.15rem 0.5rem",
        borderRadius: 99, background: "rgba(167,139,250,0.12)",
        color: "#a78bfa", border: "1px solid rgba(167,139,250,0.3)",
        letterSpacing: "0.04em", textTransform: "uppercase", flexShrink: 0,
      }}>Top 3</span>
    );
  if (rank <= 5)
    return (
      <span style={{
        fontSize: "0.6rem", fontWeight: 700, padding: "0.15rem 0.5rem",
        borderRadius: 99, background: "rgba(16,185,129,0.1)",
        color: "#10b981", border: "1px solid rgba(16,185,129,0.25)",
        letterSpacing: "0.04em", textTransform: "uppercase", flexShrink: 0,
      }}>Top 5</span>
    );
  return null;
}

// ── Row background tints for top 3 ──────────────────────────────────────────
function rowBg(rank: number) {
  if (rank === 1) return "linear-gradient(90deg, rgba(245,158,11,0.06) 0%, transparent 100%)";
  if (rank === 2) return "linear-gradient(90deg, rgba(167,139,250,0.05) 0%, transparent 100%)";
  if (rank === 3) return "linear-gradient(90deg, rgba(16,185,129,0.04) 0%, transparent 100%)";
  return "transparent";
}

// ── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({ name, photo, size = 36 }: { name: string; photo?: string; size?: number }) {
  const palette = ["#7c3aed", "#2563eb", "#059669", "#d97706", "#dc2626"];
  const color = palette[name.charCodeAt(0) % palette.length];
  return (
    <div style={{
      width: size, height: size, borderRadius: Math.round(size * 0.3),
      background: photo ? "transparent" : `${color}22`,
      border: `1.5px solid ${color}44`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.42, fontWeight: 700, color, flexShrink: 0,
    }}>
      {photo
        ? <img src={photo} alt={name} style={{ width: "100%", height: "100%", borderRadius: Math.round(size * 0.28), objectFit: "cover" }} />
        : name[0]}
    </div>
  );
}

// ── Skeleton row ─────────────────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "0.75rem 1rem" }}>
      <div className="skeleton" style={{ width: 28, height: 20, borderRadius: 4 }} />
      <div className="skeleton" style={{ width: 36, height: 36, borderRadius: 10 }} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
        <div className="skeleton" style={{ width: "55%", height: 13 }} />
        <div className="skeleton" style={{ width: "35%", height: 11 }} />
      </div>
      <div className="skeleton" style={{ width: 44, height: 18, borderRadius: 6 }} />
      <div className="skeleton" style={{ width: 44, height: 18, borderRadius: 6 }} />
      <div className="skeleton" style={{ width: 44, height: 18, borderRadius: 6 }} />
    </div>
  );
}

// ── Props ────────────────────────────────────────────────────────────────────
interface LeaderboardWidgetProps {
  /** How many mentors to show (default 5). Pass 10 for the full-page variant. */
  limit?: number;
  /** Show "View Full Leaderboard" footer link */
  showFooter?: boolean;
  /** If provided, this mentor's row is highlighted */
  highlightUid?: string;
  /** Title override */
  title?: string;
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function LeaderboardWidget({
  limit = 5,
  showFooter = true,
  highlightUid,
  title = "Mentor Leaderboard",
}: LeaderboardWidgetProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    const unsub = subscribeLeaderboard(limit, (data) => {
      setEntries(data);
      setLoading(false);
      setLastUpdated(new Date());
    });
    return unsub;
  }, [limit]);

  return (
    <div className="card" style={{ padding: 0, overflow: "hidden" }}>
      {/* ── Header ── */}
      <div style={{
        padding: "1rem 1.25rem",
        borderBottom: "1px solid var(--border)",
        background: "linear-gradient(135deg, var(--bg-card) 0%, rgba(124,58,237,0.06) 100%)",
        display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: "var(--accent-dim)", border: "1px solid var(--accent-border)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <TrendingUp size={16} style={{ color: "#a78bfa" }} />
          </div>
          <div>
            <p style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--text-1)" }}>{title}</p>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: "#22c55e" }} />
              <span suppressHydrationWarning style={{ fontSize: "0.68rem", color: "var(--text-3)" }}>
                Live · updated {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          </div>
        </div>

        {/* Column headers */}
        <div style={{ display: "flex", gap: 20, fontSize: "0.65rem", color: "var(--text-3)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
          <span style={{ minWidth: 55, textAlign: "center" }}>Sessions</span>
          <span style={{ minWidth: 50, textAlign: "center" }}>Rating</span>
          <span style={{ minWidth: 55, textAlign: "center" }}>Response</span>
        </div>
      </div>

      {/* ── Rows ── */}
      <div>
        {loading
          ? Array.from({ length: limit }).map((_, i) => <SkeletonRow key={i} />)
          : entries.length === 0
            ? (
              <div style={{ padding: "2.5rem", textAlign: "center", color: "var(--text-3)" }}>
                <TrendingUp size={28} style={{ margin: "0 auto 10px", opacity: 0.4 }} />
                <p style={{ fontSize: "0.85rem" }}>No mentor data yet.</p>
              </div>
            )
            : entries.map((entry, idx) => {
              const rank = idx + 1;
              const isHighlighted = entry.uid === highlightUid;
              return (
                <Link
                  key={entry.uid}
                  href={`/mentor/${entry.uid}`}
                  style={{ textDecoration: "none", display: "block" }}
                >
                  <div
                    style={{
                      display: "flex", alignItems: "center", gap: 12,
                      padding: "0.75rem 1.25rem",
                      borderBottom: "1px solid var(--border)",
                      background: isHighlighted
                        ? "linear-gradient(90deg, rgba(124,58,237,0.12), transparent)"
                        : rowBg(rank),
                      transition: "background 0.15s",
                      outline: isHighlighted ? "1px solid rgba(124,58,237,0.25)" : "none",
                      outlineOffset: -1,
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLElement).style.background = "var(--bg-elevated)";
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.background = isHighlighted
                        ? "linear-gradient(90deg, rgba(124,58,237,0.12), transparent)"
                        : rowBg(rank);
                    }}
                  >
                    {/* Rank */}
                    <span style={{
                      width: 28, textAlign: "center", flexShrink: 0,
                      fontSize: rank <= 3 ? "1.1rem" : "0.8rem",
                      fontWeight: 700,
                      color: rank <= 3 ? "var(--text-1)" : "var(--text-3)",
                    }}>
                      {rankLabel(rank)}
                    </span>

                    {/* Avatar */}
                    <Avatar name={entry.name} photo={entry.photoURL} size={36} />

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                        <p style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--text-1)", whiteSpace: "nowrap" }}>
                          {entry.name}
                        </p>
                        {isHighlighted && (
                          <span style={{ fontSize: "0.6rem", fontWeight: 700, padding: "0.1rem 0.4rem", borderRadius: 99, background: "var(--accent-dim)", color: "#a78bfa", border: "1px solid var(--accent-border)" }}>
                            You
                          </span>
                        )}
                        <RankBadge rank={rank} />
                      </div>
                      <div style={{ display: "flex", gap: 5, marginTop: 3, flexWrap: "wrap" }}>
                        {entry.skills.slice(0, 2).map(s => (
                          <span key={s} style={{
                            fontSize: "0.65rem", padding: "0.1rem 0.45rem", borderRadius: 5,
                            background: "var(--bg-elevated)", color: "var(--text-3)",
                            border: "1px solid var(--border)",
                          }}>{s}</span>
                        ))}
                        {entry.skills.length > 2 && (
                          <span style={{ fontSize: "0.65rem", color: "var(--text-3)" }}>
                            +{entry.skills.length - 2}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Sessions */}
                    <div style={{
                      display: "flex", flexDirection: "column", alignItems: "center",
                      minWidth: 55, gap: 2,
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                        <span style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--text-1)" }}>
                          {entry.totalSessions}
                        </span>
                      </div>
                      <span style={{ fontSize: "0.6rem", color: "var(--text-3)" }}>sessions</span>
                    </div>

                    {/* Rating */}
                    <div style={{
                      display: "flex", flexDirection: "column", alignItems: "center",
                      minWidth: 50, gap: 2,
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                        <Star size={11} style={{ fill: "#f59e0b", color: "#f59e0b" }} />
                        <span style={{ fontWeight: 700, fontSize: "0.82rem", color: "#f59e0b" }}>
                          {entry.rating.toFixed(1)}
                        </span>
                      </div>
                      <span style={{ fontSize: "0.6rem", color: "var(--text-3)" }}>
                        {entry.totalRatings} reviews
                      </span>
                    </div>

                    {/* Response time */}
                    <div style={{
                      display: "flex", flexDirection: "column", alignItems: "center",
                      minWidth: 55, gap: 2,
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                        <Clock size={11} style={{ color: "#10b981" }} />
                        <span style={{ fontSize: "0.8rem", color: "var(--text-2)", fontWeight: 600 }}>
                          {entry.responseTimeHours <= 1
                            ? "~1h"
                            : entry.responseTimeHours <= 4
                              ? "~4h"
                              : entry.responseTimeHours <= 12
                                ? "~12h"
                                : "~1d"}
                        </span>
                      </div>
                      <span style={{ fontSize: "0.6rem", color: "var(--text-3)" }}>response</span>
                    </div>
                  </div>
                </Link>
              );
            })}
      </div>

      {/* ── Footer ── */}
      {showFooter && !loading && (
        <div style={{
          padding: "0.75rem 1.25rem",
          borderTop: "1px solid var(--border)",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          background: "var(--bg-elevated)",
        }}>
          <span style={{ fontSize: "0.72rem", color: "var(--text-3)", display: "flex", alignItems: "center", gap: 5 }}>
            <Zap size={11} style={{ color: "#a78bfa" }} />
            Updates in real-time
          </span>
          <Link href="/leaderboard" style={{
            fontSize: "0.75rem", color: "#a78bfa", fontWeight: 600,
            textDecoration: "none", display: "flex", alignItems: "center", gap: 4,
          }}>
            View Full Leaderboard →
          </Link>
        </div>
      )}
    </div>
  );
}
