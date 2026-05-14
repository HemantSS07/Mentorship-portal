"use client";
import { useState } from "react";
import { X, Calendar, Clock, Loader2, Send, Info } from "lucide-react";
import { createRescheduleRequest } from "@/lib/db";
import { Session } from "@/types";
import { useAuthStore } from "@/store/authStore";
import toast from "react-hot-toast";

interface RescheduleRequestModalProps {
  session: Session;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function RescheduleRequestModal({ session, onClose, onSuccess }: RescheduleRequestModalProps) {
  const { user } = useAuthStore();

  // Default: tomorrow at 18:00
  const tomorrow = new Date(Date.now() + 86400000);
  const defaultDate = tomorrow.toISOString().split("T")[0];

  const [sessionDate, setSessionDate] = useState(defaultDate);
  const [sessionTime, setSessionTime] = useState("18:00");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!sessionDate) return toast.error("Please select a date");
    if (!sessionTime) return toast.error("Please select a time");

    // Combine date and time into a single UTC timestamp
    const proposedNewTime = new Date(`${sessionDate}T${sessionTime}:00`);
    if (proposedNewTime <= new Date()) return toast.error("Please choose a future date and time");

    setSubmitting(true);
    try {
      await createRescheduleRequest({
        sessionId: session.id,
        requesterUid: user.uid,
        mentorUid: session.mentorUid,
        juniorUid: session.juniorUid,
        currentSessionTime: session.scheduledAt,
        proposedNewTime,
        proposedDuration: session.duration,
        reason: reason.trim() || undefined,
        status: "pending",
      });

      toast.success("Reschedule request sent! It will be updated once approved.");
      onSuccess?.();
      onClose();
    } catch (err: any) {
      console.error("createRescheduleRequest error:", err);
      toast.error(err?.message || "Failed to submit request. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      id="reschedule-modal-overlay"
      style={{
        position: "fixed", inset: 0, zIndex: 300,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)",
        padding: "1rem",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="card"
        style={{
          width: "100%", maxWidth: 480, position: "relative", overflow: "hidden",
          background: "var(--bg-card)", animation: "fade-up 0.2s ease",
        }}
      >
        {/* Animated top bar */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: 3,
          background: "linear-gradient(90deg, #f59e0b, #ef4444)",
        }} />

        {/* Close */}
        <button
          onClick={onClose}
          style={{ position: "absolute", top: 16, right: 16, background: "none", border: "none", color: "var(--text-2)", cursor: "pointer", padding: 4 }}
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div style={{ marginBottom: "1.5rem", paddingTop: 8 }}>
          <p style={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>
            Request Change
          </p>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, letterSpacing: "-0.02em", marginBottom: 6 }}>
            Reschedule Session
          </h2>
          {/* Summary */}
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "0.5rem 0.75rem", background: "var(--bg-elevated)", borderRadius: 8,
            border: "1px solid var(--border)",
          }}>
            <Info size={14} style={{ color: "var(--text-3)" }} />
            <p style={{ fontSize: "0.82rem", color: "var(--text-2)" }}>
              Current time: <strong style={{ color: "var(--text-1)" }}>
                {session.scheduledAt.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" })} at {session.scheduledAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </strong>
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          
          {/* Date & Time */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <label htmlFor="reschedule-date" style={{ display: "block", fontSize: "0.8rem", fontWeight: 500, color: "var(--text-2)", marginBottom: 6 }}>
                <Calendar size={12} style={{ display: "inline", verticalAlign: "middle", marginRight: 4 }} />
                Proposed Date <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <input
                id="reschedule-date"
                type="date"
                className="input"
                value={sessionDate}
                min={new Date().toISOString().split("T")[0]}
                onChange={(e) => setSessionDate(e.target.value)}
                disabled={submitting}
              />
            </div>
            <div>
              <label htmlFor="reschedule-time" style={{ display: "block", fontSize: "0.8rem", fontWeight: 500, color: "var(--text-2)", marginBottom: 6 }}>
                <Clock size={12} style={{ display: "inline", verticalAlign: "middle", marginRight: 4 }} />
                Proposed Time <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <input
                id="reschedule-time"
                type="time"
                className="input"
                value={sessionTime}
                onChange={(e) => setSessionTime(e.target.value)}
                disabled={submitting}
              />
            </div>
          </div>

          {/* Reason */}
          <div>
            <label htmlFor="reschedule-reason" style={{ display: "block", fontSize: "0.8rem", fontWeight: 500, color: "var(--text-2)", marginBottom: 6 }}>
              Reason (Optional)
            </label>
            <textarea
              id="reschedule-reason"
              className="input"
              rows={3}
              placeholder="E.g., I have an unexpected exam clash..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={submitting}
              style={{ resize: "none" }}
            />
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", paddingTop: 4 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
              style={{ minWidth: 160 }}
            >
              {submitting
                ? <><Loader2 size={15} className="animate-spin" /> Sending...</>
                : <><Send size={15} /> Request Reschedule</>
              }
            </button>
          </div>
        </form>

        <style>{`
          @keyframes fade-up {
            from { opacity: 0; transform: translateY(16px); }
            to   { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </div>
    </div>
  );
}
