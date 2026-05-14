"use client";
import { Calendar, Clock, Video, CheckCircle, Loader2, GraduationCap, Award, Zap, ExternalLink } from "lucide-react";
import { format, isPast, isToday } from "date-fns";
import { Session, TeacherMentor } from "@/types";

interface TeacherSessionCardProps {
  session: Session;
  mentor?: TeacherMentor | null;
  /** If true, shows the "Mark Done" button (teacher view). If false, read-only join view (student view). */
  isTeacherView?: boolean;
  isUpdating?: boolean;
  onComplete?: (sessionId: string, requestId: string) => void;
  hasPendingReschedule?: boolean;
  onRequestReschedule?: () => void;
  onReviewReschedule?: () => void;
}

function StatusBadge({ status, scheduledAt }: { status: Session["status"]; scheduledAt: Date }) {
  const now = new Date();
  const sessionEnd = new Date(scheduledAt.getTime() + 120 * 60 * 1000); // show active window ~2h
  const isLive = status === "upcoming" && scheduledAt <= now && now <= sessionEnd;

  if (isLive) return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      background: "rgba(34,197,94,0.12)", color: "#22c55e",
      border: "1px solid rgba(34,197,94,0.3)", borderRadius: 99,
      padding: "0.18rem 0.65rem", fontSize: "0.68rem", fontWeight: 700,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", display: "inline-block", animation: "tsc-pulse 1.4s infinite" }} />
      LIVE NOW
    </span>
  );
  if (status === "upcoming") {
    const soon = scheduledAt.getTime() - now.getTime() < 60 * 60 * 1000; // < 1 hour
    return (
      <span style={{
        background: soon ? "rgba(245,158,11,0.12)" : "rgba(124,58,237,0.1)",
        color: soon ? "#f59e0b" : "#a78bfa",
        border: `1px solid ${soon ? "rgba(245,158,11,0.3)" : "rgba(124,58,237,0.25)"}`,
        borderRadius: 99, padding: "0.18rem 0.65rem", fontSize: "0.68rem", fontWeight: 700,
      }}>
        {soon ? "⚡ Starting Soon" : "📅 Upcoming"}
      </span>
    );
  }
  if (status === "completed") return (
    <span style={{ background: "rgba(16,185,129,0.1)", color: "#10b981", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 99, padding: "0.18rem 0.65rem", fontSize: "0.68rem", fontWeight: 700 }}>
      ✓ Completed
    </span>
  );
  return (
    <span style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 99, padding: "0.18rem 0.65rem", fontSize: "0.68rem", fontWeight: 700 }}>
      Cancelled
    </span>
  );
}

export default function TeacherSessionCard({
  session, mentor, isTeacherView = false, isUpdating = false, onComplete,
  hasPendingReschedule = false, onRequestReschedule, onReviewReschedule
}: TeacherSessionCardProps) {
  const now = new Date();
  const sessionEnd = new Date(session.scheduledAt.getTime() + 120 * 60 * 1000);
  const isLive = session.status === "upcoming" && session.scheduledAt <= now && now <= sessionEnd;
  const isPastSession = isPast(session.scheduledAt);
  const isTodaySession = isToday(session.scheduledAt);

  const accentColor = session.status === "completed" ? "#10b981" :
    isLive ? "#22c55e" : "#7c3aed";

  return (
    <div className="card" style={{
      position: "relative", overflow: "hidden",
      border: `1px solid ${accentColor}22`,
      background: `linear-gradient(135deg, var(--bg-card) 0%, ${accentColor}06 100%)`,
      transition: "transform 0.18s, box-shadow 0.18s",
    }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLDivElement).style.boxShadow = `0 8px 32px ${accentColor}18`; }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = ""; (e.currentTarget as HTMLDivElement).style.boxShadow = ""; }}
    >
      {/* Accent top strip */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 3,
        background: `linear-gradient(90deg, ${accentColor}, ${accentColor}88)`,
        opacity: session.status === "completed" ? 0.5 : 1,
      }} />

      <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start", paddingTop: 4 }}>
        {/* Icon avatar */}
        <div style={{
          width: 52, height: 52, borderRadius: 14, flexShrink: 0,
          background: `${accentColor}14`, border: `1.5px solid ${accentColor}30`,
          display: "flex", alignItems: "center", justifyContent: "center", color: accentColor,
        }}>
          {mentor?.photoURL
            ? <img src={mentor.photoURL} alt={mentor.name} style={{ width: "100%", height: "100%", borderRadius: 13, objectFit: "cover" }} />
            : <GraduationCap size={22} />}
        </div>

        {/* Main content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Header row */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
            <div>
              <p style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--text-1)", marginBottom: 1 }}>
                {mentor?.name ?? "Faculty Mentor"}
              </p>
              {mentor && (
                <p style={{ fontSize: "0.74rem", color: "var(--text-3)", display: "flex", alignItems: "center", gap: 4 }}>
                  <Award size={11} style={{ color: "#f59e0b" }} />
                  {mentor.designation} · {mentor.department}
                </p>
              )}
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
              {hasPendingReschedule && (
                <span style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 99, padding: "0.18rem 0.65rem", fontSize: "0.68rem", fontWeight: 700 }}>
                  Reschedule Requested
                </span>
              )}
              <StatusBadge status={session.status} scheduledAt={session.scheduledAt} />
            </div>
          </div>

          {/* Expertise badges */}
          {mentor && mentor.subjectExpertise.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 10 }}>
              {mentor.subjectExpertise.slice(0, 3).map(s => (
                <span key={s} style={{
                  padding: "0.12rem 0.48rem", borderRadius: 99, fontSize: "0.63rem", fontWeight: 500,
                  background: "rgba(245,158,11,0.08)", color: "#d97706", border: "1px solid rgba(245,158,11,0.18)",
                }}>
                  {s}
                </span>
              ))}
              {mentor.subjectExpertise.length > 3 && (
                <span style={{ padding: "0.12rem 0.48rem", borderRadius: 99, fontSize: "0.63rem", color: "var(--text-3)", background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
                  +{mentor.subjectExpertise.length - 3}
                </span>
              )}
            </div>
          )}

          {/* Date / Time / Duration chips */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 5,
              background: isTodaySession ? "rgba(245,158,11,0.1)" : "var(--bg-elevated)",
              border: `1px solid ${isTodaySession ? "rgba(245,158,11,0.25)" : "var(--border)"}`,
              padding: "0.25rem 0.65rem", borderRadius: 8,
            }}>
              <Calendar size={11} style={{ color: isTodaySession ? "#f59e0b" : "#a78bfa" }} />
              <span style={{ fontSize: "0.76rem", fontWeight: 600, color: isTodaySession ? "#f59e0b" : "var(--text-1)" }}>
                {isTodaySession ? "Today" : format(session.scheduledAt, "d MMM yyyy")}
              </span>
            </div>
            <div style={{
              display: "flex", alignItems: "center", gap: 5,
              background: isLive ? "rgba(34,197,94,0.1)" : "var(--bg-elevated)",
              border: `1px solid ${isLive ? "rgba(34,197,94,0.3)" : "var(--border)"}`,
              padding: "0.25rem 0.65rem", borderRadius: 8,
            }}>
              <Clock size={11} style={{ color: isLive ? "#22c55e" : "#10b981" }} />
              <span style={{ fontSize: "0.76rem", fontWeight: 600 }}>
                {format(session.scheduledAt, "HH:mm")}
              </span>
            </div>
            <div style={{
              display: "flex", alignItems: "center", gap: 5,
              background: "var(--bg-elevated)", border: "1px solid var(--border)",
              padding: "0.25rem 0.65rem", borderRadius: 8,
            }}>
              <Zap size={11} style={{ color: "#60a5fa" }} />
              <span style={{ fontSize: "0.76rem", fontWeight: 500, color: "var(--text-2)" }}>
                {session.duration >= 60
                  ? `${session.duration / 60}h${session.duration % 60 > 0 ? ` ${session.duration % 60}m` : ""}`
                  : `${session.duration} min`}
              </span>
            </div>
          </div>

          {/* Action buttons */}
          {session.status !== "completed" && session.status !== "cancelled" && (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              {session.meetLink && (
                <a
                  href={session.meetLink}
                  target="_blank"
                  rel="noreferrer"
                  id={`join-meeting-${session.id}`}
                  className="btn btn-primary"
                  style={{ fontSize: "0.8rem", padding: "0.45rem 1rem", display: "inline-flex", gap: 6 }}
                >
                  <Video size={14} />
                  {isLive ? "Join Now" : "Join Meeting"}
                  <ExternalLink size={11} style={{ opacity: 0.7 }} />
                </a>
              )}
              {!isTeacherView && onRequestReschedule && !hasPendingReschedule && (
                <button
                  onClick={onRequestReschedule}
                  className="btn btn-secondary"
                  style={{ fontSize: "0.78rem", padding: "0.45rem 0.9rem" }}
                >
                  <Clock size={13} />
                  Request Reschedule
                </button>
              )}
              {isTeacherView && hasPendingReschedule && onReviewReschedule && (
                <button
                  onClick={onReviewReschedule}
                  className="btn btn-secondary"
                  style={{ fontSize: "0.78rem", padding: "0.45rem 0.9rem", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.3)" }}
                >
                  <Clock size={13} />
                  Review Reschedule
                </button>
              )}
              {isTeacherView && onComplete && (
                <button
                  onClick={() => onComplete(session.id, session.requestId)}
                  disabled={isUpdating}
                  className="btn btn-ghost"
                  style={{ fontSize: "0.78rem", padding: "0.45rem 0.9rem", color: "#22c55e", border: "1px solid rgba(34,197,94,0.25)" }}
                >
                  {isUpdating
                    ? <Loader2 size={13} className="animate-spin" />
                    : <CheckCircle size={13} />}
                  Mark Done
                </button>
              )}
            </div>
          )}

          {/* Completed footer */}
          {session.status === "completed" && (
            <div style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "0.35rem 0.65rem", borderRadius: 8,
              background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.15)",
              width: "fit-content",
            }}>
              <CheckCircle size={13} style={{ color: "#10b981" }} />
              <span style={{ fontSize: "0.75rem", color: "#10b981", fontWeight: 500 }}>Session completed</span>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes tsc-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.7); }
        }
      `}</style>
    </div>
  );
}
