"use client";
import { useState, useEffect } from "react";
import {
  Star, CheckCircle2, MapPin, Clock, Users, Calendar, ExternalLink, GraduationCap, Zap
} from "lucide-react";
import { subscribeTeacherMentor } from "@/lib/db";
import { TeacherMentor, Session } from "@/types";

interface Props {
  mentorUid: string;
  requestTitle: string;
  requestStatus: string;
  session?: Session;           // live session tied to this mentor
  onViewProfile: (uid: string) => void;
}

function StarRow({ rating }: { rating: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} size={11}
          fill={i <= Math.round(rating) ? "#f59e0b" : "none"}
          stroke={i <= Math.round(rating) ? "#f59e0b" : "#52525b"}
          strokeWidth={1.5}
        />
      ))}
      <span style={{ fontSize: "0.7rem", color: "#f59e0b", fontWeight: 700, marginLeft: 3 }}>
        {rating > 0 ? rating.toFixed(1) : "New"}
      </span>
    </div>
  );
}

export default function AcceptedTeacherMentorCard({ mentorUid, requestTitle, requestStatus, session, onViewProfile }: Props) {
  const [teacher, setTeacher] = useState<TeacherMentor | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeTeacherMentor(mentorUid, (data) => {
      setTeacher(data);
      setLoading(false);
    });
    return unsub;
  }, [mentorUid]);

  const initials = teacher?.name?.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase() ?? "?";
  const isAccepted = requestStatus === "accepted";

  if (loading) return (
    <div style={{
      borderRadius: 16, border: "1px solid var(--border)", background: "var(--bg-card)",
      padding: "1.25rem", display: "flex", flexDirection: "column", gap: 12
    }}>
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <div className="skeleton" style={{ width: 52, height: 52, borderRadius: 14, flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div className="skeleton" style={{ width: "60%", height: 14, borderRadius: 8, marginBottom: 8 }} />
          <div className="skeleton" style={{ width: "40%", height: 11, borderRadius: 8 }} />
        </div>
      </div>
      <div className="skeleton" style={{ width: "100%", height: 11, borderRadius: 8 }} />
      <div className="skeleton" style={{ width: "70%", height: 11, borderRadius: 8 }} />
    </div>
  );

  if (!teacher) return null;

  const expertisePreview = teacher.subjectExpertise.slice(0, 3);
  const moreCount = teacher.subjectExpertise.length - 3;
  const responseLabel = teacher.responseTimeHours <= 4 ? "~4h" : teacher.responseTimeHours <= 12 ? "~12h" : "~1 day";

  return (
    <div style={{
      borderRadius: 16,
      border: isAccepted ? "1px solid rgba(245,158,11,0.35)" : "1px solid var(--border)",
      background: isAccepted
        ? "linear-gradient(145deg, var(--bg-card), rgba(245,158,11,0.04))"
        : "var(--bg-card)",
      overflow: "hidden",
      position: "relative",
    }}>
      {/* Accepted glow strip */}
      {isAccepted && (
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: 2,
          background: "linear-gradient(90deg, #f59e0b, #d97706, #f59e0b)",
        }} />
      )}

      <div style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "0.9rem" }}>

        {/* Header row */}
        <div style={{ display: "flex", gap: "0.875rem", alignItems: "flex-start" }}>
          {/* Avatar */}
          <button
            onClick={() => onViewProfile(mentorUid)}
            style={{ background: "none", border: "none", padding: 0, cursor: "pointer", flexShrink: 0 }}
          >
            <div style={{
              width: 54, height: 54, borderRadius: 14,
              background: "rgba(245,158,11,0.12)",
              border: "2px solid rgba(245,158,11,0.35)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "1.1rem", fontWeight: 700, color: "#f59e0b",
              overflow: "hidden", transition: "transform 0.2s",
            }}>
              {teacher.photoURL
                ? <img src={teacher.photoURL} alt={teacher.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : initials}
            </div>
          </button>

          {/* Name + meta */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 2 }}>
              <button
                onClick={() => onViewProfile(mentorUid)}
                style={{
                  background: "none", border: "none", padding: 0, cursor: "pointer",
                  fontWeight: 700, fontSize: "0.95rem", color: "var(--text-1)", fontFamily: "inherit",
                  textAlign: "left",
                }}
              >
                {teacher.name}
              </button>
              {teacher.isVerified && (
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: 3,
                  background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.35)",
                  borderRadius: 99, padding: "0.1rem 0.5rem",
                  fontSize: "0.6rem", fontWeight: 700, color: "#f59e0b", letterSpacing: "0.03em",
                }}>
                  <CheckCircle2 size={9} /> VERIFIED FACULTY
                </span>
              )}
              {/* Live active indicator */}
              {teacher.isActive && (
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: 4,
                  fontSize: "0.65rem", color: "#22c55e", fontWeight: 600,
                }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", display: "inline-block", animation: "pulse-dot 1.8s infinite" }} />
                  Available
                </span>
              )}
            </div>
            <p style={{ fontSize: "0.78rem", color: "var(--text-2)", marginBottom: 2 }}>{teacher.designation}</p>
            <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "0.72rem", color: "var(--text-3)" }}>
              <MapPin size={10} /> {teacher.department}
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
          <StarRow rating={teacher.rating} />
          <div style={{ display: "flex", alignItems: "center", gap: 3, fontSize: "0.72rem", color: "var(--text-3)" }}>
            <Users size={11} /> {teacher.totalSessions} sessions
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 3, fontSize: "0.72rem", color: "var(--text-3)" }}>
            <GraduationCap size={11} /> {teacher.yearsExperience}+ yrs
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 3, fontSize: "0.72rem", color: "var(--text-3)" }}>
            <Clock size={11} /> {responseLabel}
          </div>
        </div>

        {/* Subject expertise chips */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
          {expertisePreview.map(s => (
            <span key={s} style={{
              padding: "0.18rem 0.55rem", borderRadius: 99, fontSize: "0.67rem", fontWeight: 500,
              background: "rgba(245,158,11,0.1)", color: "#d97706",
              border: "1px solid rgba(245,158,11,0.2)",
            }}>{s}</span>
          ))}
          {moreCount > 0 && (
            <span style={{
              padding: "0.18rem 0.55rem", borderRadius: 99, fontSize: "0.67rem", fontWeight: 500,
              background: "var(--bg-elevated)", color: "var(--text-3)", border: "1px solid var(--border)",
            }}>+{moreCount} more</span>
          )}
        </div>

        {/* Bio snippet */}
        {teacher.bio && (
          <p style={{
            fontSize: "0.78rem", color: "var(--text-2)", lineHeight: 1.55,
            display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
          }}>
            {teacher.bio}
          </p>
        )}

        {/* Active session panel */}
        {session && session.status === "upcoming" && (
          <div style={{
            background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.2)",
            borderRadius: 10, padding: "0.75rem",
          }}>
            <p style={{ fontSize: "0.7rem", fontWeight: 700, color: "#22c55e", marginBottom: 6, display: "flex", alignItems: "center", gap: 5 }}>
              <Zap size={11} /> UPCOMING SESSION
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "0.75rem", color: "var(--text-2)" }}>
                <Calendar size={12} style={{ color: "#a78bfa" }} />
                {session.scheduledAt.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" })}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "0.75rem", color: "var(--text-2)" }}>
                <Clock size={12} style={{ color: "#10b981" }} />
                {session.scheduledAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </div>
              {session.duration && (
                <span style={{ fontSize: "0.72rem", color: "var(--text-3)" }}>{session.duration} min</span>
              )}
            </div>
            {session.meetLink && (
              <a
                href={session.meetLink}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: "inline-flex", alignItems: "center", gap: 5, marginTop: 8,
                  fontSize: "0.75rem", fontWeight: 600, color: "#22c55e", textDecoration: "none",
                  background: "rgba(34,197,94,0.1)", padding: "0.3rem 0.7rem", borderRadius: 8,
                  border: "1px solid rgba(34,197,94,0.25)", transition: "all 0.15s",
                }}
              >
                <ExternalLink size={12} /> Join Meeting
              </a>
            )}
          </div>
        )}

        {/* CTA */}
        <button
          onClick={() => onViewProfile(mentorUid)}
          style={{
            width: "100%", padding: "0.55rem", borderRadius: 10, fontWeight: 600, fontSize: "0.83rem",
            cursor: "pointer", border: "1px solid rgba(245,158,11,0.35)",
            background: "rgba(245,158,11,0.1)", color: "#f59e0b",
            fontFamily: "inherit", transition: "all 0.2s",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          }}
        >
          <ExternalLink size={13} /> View Full Profile
        </button>
      </div>

      <style>{`
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.7); }
        }
      `}</style>
    </div>
  );
}
