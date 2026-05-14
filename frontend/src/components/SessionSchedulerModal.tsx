"use client";
import { useState } from "react";
import { X, Video, Calendar, Clock, Link2, Loader2, Zap, CheckCircle } from "lucide-react";
import { createSession, updateRequestStatus, updateSession, updateRescheduleRequestStatus } from "@/lib/db";
import { HelpRequest, RescheduleRequest } from "@/types";
import { useAuthStore } from "@/store/authStore";
import toast from "react-hot-toast";

interface SessionSchedulerModalProps {
  request: HelpRequest;
  rescheduleRequest?: RescheduleRequest;
  onClose: () => void;
  onSuccess?: () => void;
}

const DURATION_OPTIONS = [
  { label: "30 min", value: 30 },
  { label: "45 min", value: 45 },
  { label: "60 min – 1 hour", value: 60 },
  { label: "90 min – 1.5 hours", value: 90 },
  { label: "120 min – 2 hours", value: 120 },
];

function randomMeetLink() {
  const r = (n: number) =>
    Array.from({ length: n })
      .map(() => "abcdefghijklmnopqrstuvwxyz"[Math.floor(Math.random() * 26)])
      .join("");
  return `https://meet.google.com/${r(3)}-${r(4)}-${r(3)}`;
}

export default function SessionSchedulerModal({ request, rescheduleRequest, onClose, onSuccess }: SessionSchedulerModalProps) {
  const { user } = useAuthStore();

  // Determine defaults based on whether it's a new schedule or a reschedule
  let defaultDateStr = "";
  let defaultTimeStr = "";
  
  if (rescheduleRequest) {
    // If reschedule, pre-fill with proposed time
    const d = new Date(rescheduleRequest.proposedNewTime);
    defaultDateStr = d.toISOString().split("T")[0];
    defaultTimeStr = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  } else {
    // Default: tomorrow at 18:00
    const tomorrow = new Date(Date.now() + 86400000);
    defaultDateStr = tomorrow.toISOString().split("T")[0];
    defaultTimeStr = "18:00";
  }

  const [meetLink, setMeetLink] = useState("");
  const [meetType, setMeetType] = useState<"google" | "zoom" | "custom">("google");
  const [sessionDate, setSessionDate] = useState(defaultDateStr);
  const [sessionTime, setSessionTime] = useState(defaultTimeStr);
  const [duration, setDuration] = useState(rescheduleRequest?.proposedDuration || 60);
  const [submitting, setSubmitting] = useState(false);
  const [generatingLink, setGeneratingLink] = useState(false);

  const handleGenerateLink = () => {
    setGeneratingLink(true);
    setTimeout(() => {
      setMeetLink(randomMeetLink());
      setMeetType("google");
      toast.success("📹 Google Meet link generated!");
      setGeneratingLink(false);
    }, 600);
  };

  const getPlaceholder = () => {
    if (meetType === "google") return "https://meet.google.com/abc-defg-hij";
    if (meetType === "zoom") return "https://zoom.us/j/123456789";
    return "Paste your meeting link here";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const finalLink = meetLink.trim();
    if (!finalLink) return toast.error("Please enter or generate a meeting link");
    if (!finalLink.startsWith("http")) return toast.error("Meeting link must start with http");
    if (!sessionDate) return toast.error("Please select a date");
    if (!sessionTime) return toast.error("Please select a time");

    // Combine date and time into a single UTC timestamp
    const scheduledAt = new Date(`${sessionDate}T${sessionTime}:00`);
    if (scheduledAt <= new Date()) return toast.error("Please choose a future date and time");

    setSubmitting(true);
    try {
      if (rescheduleRequest) {
        // Update existing session
        await updateSession(rescheduleRequest.sessionId, {
          scheduledAt,
          meetLink: finalLink,
          duration,
        });
        
        // Approve the request
        await updateRescheduleRequestStatus(rescheduleRequest.id, "approved", rescheduleRequest.requesterUid);
        toast.success("🚀 Session successfully rescheduled!");
      } else {
        // Create the session record
        await createSession({
          requestId: request.id,
          mentorUid: user.uid,
          juniorUid: request.juniorUid,
          mentorType: "teacher",
          scheduledAt,
          meetLink: finalLink,
          duration,
          status: "upcoming",
        });

        // Mark request as accepted
        await updateRequestStatus(request.id, "accepted");
        toast.success("🚀 Session scheduled! Both you and the student will see it instantly.");
      }

      onSuccess?.();
      onClose();
    } catch (err: any) {
      console.error("Scheduling error:", err);
      toast.error(err?.message || "Failed to schedule session. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      id="session-scheduler-overlay"
      style={{
        position: "fixed", inset: 0, zIndex: 200,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)",
        padding: "1rem",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="card"
        style={{
          width: "100%", maxWidth: 520, position: "relative", overflow: "hidden",
          background: "var(--bg-card)", animation: "fade-up 0.2s ease",
        }}
      >
        {/* Animated top bar */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: 3,
          background: "linear-gradient(90deg, #7c3aed, #a78bfa, #2563eb)",
          backgroundSize: "200%", animation: "slide-gradient 2s linear infinite",
        }} />

        {/* Close */}
        <button
          onClick={onClose}
          id="session-modal-close"
          style={{ position: "absolute", top: 16, right: 16, background: "none", border: "none", color: "var(--text-2)", cursor: "pointer", padding: 4 }}
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div style={{ marginBottom: "1.5rem", paddingTop: 8 }}>
          <p style={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>
            {rescheduleRequest ? "Review Reschedule" : "Create Session"}
          </p>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, letterSpacing: "-0.02em", marginBottom: 6 }}>
            {rescheduleRequest ? "Approve Reschedule Request" : "Schedule a Mentorship Session"}
          </h2>
          {/* Request summary */}
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "0.5rem 0.75rem", background: "var(--bg-elevated)", borderRadius: 8,
            border: "1px solid var(--border)",
          }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent)", flexShrink: 0 }} />
            <p style={{ fontSize: "0.82rem", color: "var(--text-2)" }}>
              For <strong style={{ color: "var(--text-1)" }}>{request.juniorName}</strong>
              {" — "}<span style={{ color: "var(--text-3)" }}>{request.title}</span>
            </p>
          </div>
          
          {rescheduleRequest?.reason && (
            <div style={{ marginTop: 10, padding: "0.5rem 0.75rem", background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 8 }}>
              <p style={{ fontSize: "0.75rem", color: "#d97706", fontWeight: 600, marginBottom: 2 }}>Reason for rescheduling:</p>
              <p style={{ fontSize: "0.8rem", color: "var(--text-2)" }}>"{rescheduleRequest.reason}"</p>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

          {/* Meeting Platform Selector */}
          <div>
            <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 500, color: "var(--text-2)", marginBottom: 8 }}>
              Meeting Platform
            </label>
            <div style={{ display: "flex", gap: 6 }}>
              {(["google", "zoom", "custom"] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setMeetType(type)}
                  style={{
                    flex: 1, padding: "0.45rem 0.5rem", borderRadius: 8, cursor: "pointer",
                    fontSize: "0.78rem", fontWeight: 500, fontFamily: "inherit",
                    border: `1px solid ${meetType === type ? "var(--accent)" : "var(--border)"}`,
                    background: meetType === type ? "var(--accent-dim)" : "var(--bg-elevated)",
                    color: meetType === type ? "#a78bfa" : "var(--text-2)",
                    transition: "all 0.15s",
                  }}
                >
                  {type === "google" ? "Google Meet" : type === "zoom" ? "Zoom" : "Custom"}
                </button>
              ))}
            </div>
          </div>

          {/* Meeting Link */}
          <div>
            <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 500, color: "var(--text-2)", marginBottom: 6 }}>
              Meeting Link <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <div style={{ display: "flex", gap: 8 }}>
              <div style={{ flex: 1, position: "relative" }}>
                <Link2 size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-3)" }} />
                <input
                  id="session-meet-link"
                  type="url"
                  className="input"
                  style={{ paddingLeft: 34 }}
                  placeholder={getPlaceholder()}
                  value={meetLink}
                  onChange={(e) => setMeetLink(e.target.value)}
                  disabled={submitting}
                />
              </div>
              {meetType === "google" && (
                <button
                  type="button"
                  id="generate-meet-link-btn"
                  onClick={handleGenerateLink}
                  disabled={generatingLink || submitting}
                  className="btn btn-secondary"
                  style={{ flexShrink: 0, padding: "0 0.9rem", fontSize: "0.78rem" }}
                >
                  {generatingLink ? <Loader2 size={14} className="animate-spin" /> : <><Zap size={12} /> Generate</>}
                </button>
              )}
            </div>
          </div>

          {/* Date & Time */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <label htmlFor="session-date" style={{ display: "block", fontSize: "0.8rem", fontWeight: 500, color: "var(--text-2)", marginBottom: 6 }}>
                <Calendar size={12} style={{ display: "inline", verticalAlign: "middle", marginRight: 4 }} />
                Date <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <input
                id="session-date"
                type="date"
                className="input"
                value={sessionDate}
                min={new Date().toISOString().split("T")[0]}
                onChange={(e) => setSessionDate(e.target.value)}
                disabled={submitting}
              />
            </div>
            <div>
              <label htmlFor="session-time" style={{ display: "block", fontSize: "0.8rem", fontWeight: 500, color: "var(--text-2)", marginBottom: 6 }}>
                <Clock size={12} style={{ display: "inline", verticalAlign: "middle", marginRight: 4 }} />
                Start Time <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <input
                id="session-time"
                type="time"
                className="input"
                value={sessionTime}
                onChange={(e) => setSessionTime(e.target.value)}
                disabled={submitting}
              />
            </div>
          </div>

          {/* Duration */}
          <div>
            <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 500, color: "var(--text-2)", marginBottom: 8 }}>
              <Clock size={12} style={{ display: "inline", verticalAlign: "middle", marginRight: 4 }} />
              Duration
            </label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {DURATION_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setDuration(opt.value)}
                  style={{
                    padding: "0.4rem 0.75rem", borderRadius: 8, cursor: "pointer",
                    fontSize: "0.78rem", fontWeight: 500, fontFamily: "inherit",
                    border: `1px solid ${duration === opt.value ? "var(--accent)" : "var(--border)"}`,
                    background: duration === opt.value ? "var(--accent-dim)" : "var(--bg-elevated)",
                    color: duration === opt.value ? "#a78bfa" : "var(--text-2)",
                    transition: "all 0.15s",
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          {sessionDate && sessionTime && (
            <div style={{
              padding: "0.75rem 1rem", borderRadius: 10,
              background: "rgba(124,58,237,0.06)", border: "1px solid var(--accent-border)",
              display: "flex", alignItems: "center", gap: 10,
            }}>
              <CheckCircle size={15} style={{ color: "#a78bfa", flexShrink: 0 }} />
              <p style={{ fontSize: "0.8rem", color: "var(--text-2)" }}>
                Session on <strong style={{ color: "var(--text-1)" }}>
                  {new Date(`${sessionDate}T${sessionTime}:00`).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}
                </strong> at <strong style={{ color: "var(--text-1)" }}>
                  {new Date(`${sessionDate}T${sessionTime}:00`).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </strong> · <strong style={{ color: "var(--text-1)" }}>{duration} min</strong>
              </p>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", paddingTop: 4 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button
              id="session-schedule-submit"
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
              style={{ minWidth: 160 }}
            >
              {submitting
                ? <><Loader2 size={15} className="animate-spin" /> {rescheduleRequest ? "Approving..." : "Scheduling…"}</>
                : <><Video size={15} /> {rescheduleRequest ? "Approve Reschedule" : "Schedule Session"}</>
              }
            </button>
          </div>
        </form>

        <style>{`
          @keyframes slide-gradient {
            from { background-position: 0% 0; }
            to   { background-position: 200% 0; }
          }
          @keyframes fade-up {
            from { opacity: 0; transform: translateY(16px); }
            to   { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </div>
    </div>
  );
}
