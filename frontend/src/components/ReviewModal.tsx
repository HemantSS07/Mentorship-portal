"use client";
import { useState } from "react";
import { X, Star, Send, Loader2 } from "lucide-react";
import { addReview } from "@/lib/db";
import { Mentor, TeacherMentor } from "@/types";
import { useAuthStore } from "@/store/authStore";
import toast from "react-hot-toast";

interface ReviewModalProps {
  mentor: Mentor | TeacherMentor;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function ReviewModal({ mentor, onClose, onSuccess }: ReviewModalProps) {
  const { user } = useAuthStore();
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return toast.error("Please sign in to leave a review");
    if (rating === 0) return toast.error("Please select a star rating");
    if (comment.trim().length < 10) return toast.error("Review must be at least 10 characters");

    setSubmitting(true);
    try {
      await addReview({
        sessionId: "direct",
        mentorId: mentor.uid,
        fromUserId: user.uid,
        fromUserName: user.name,
        rating,
        comment: comment.trim(),
      });
      toast.success("Review submitted! Thank you 🎉");
      onSuccess?.();
      onClose();
    } catch (err: any) {
      // Unique constraint violation — already reviewed
      if (err?.code === "23505" || err?.message?.includes("unique_review_per_user_mentor")) {
        toast.error("You've already reviewed this mentor.");
      } else {
        toast.error(err?.message || "Failed to submit review");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const displayRating = hovered || rating;
  const ratingLabels: Record<number, string> = {
    1: "Poor",
    2: "Fair",
    3: "Good",
    4: "Great",
    5: "Excellent!",
  };

  return (
    <div
      id="review-modal-overlay"
      style={{
        position: "fixed", inset: 0, zIndex: 60,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)",
        padding: "1rem",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="card anim-1"
        style={{ width: "100%", maxWidth: 480, padding: "1.75rem", position: "relative", overflow: "hidden" }}
      >
        {/* Decorative gradient blob */}
        <div style={{
          position: "absolute", top: -60, right: -60,
          width: 180, height: 180, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(124,58,237,0.18) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        {/* Close */}
        <button
          id="review-modal-close"
          onClick={onClose}
          className="btn btn-ghost"
          style={{ position: "absolute", top: "1rem", right: "1rem", padding: "0.4rem" }}
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div style={{ marginBottom: "1.5rem" }}>
          <p style={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>
            Write a Review
          </p>
          <h2 className="heading-md" style={{ marginBottom: 2 }}>
            Rate {mentor.name}
          </h2>
          <p style={{ fontSize: "0.8rem", color: "var(--text-3)" }}>
            {'department' in mentor ? mentor.department : mentor.branch} · {'designation' in mentor ? mentor.designation : mentor.year}
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

          {/* Star picker */}
          <div>
            <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 500, color: "var(--text-2)", marginBottom: 10 }}>
              Your Rating
            </label>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  id={`star-${n}`}
                  onClick={() => setRating(n)}
                  onMouseEnter={() => setHovered(n)}
                  onMouseLeave={() => setHovered(0)}
                  style={{
                    background: "none", border: "none", cursor: "pointer",
                    padding: "2px", transition: "transform 0.15s",
                    transform: displayRating >= n ? "scale(1.15)" : "scale(1)",
                  }}
                >
                  <Star
                    size={28}
                    fill={displayRating >= n ? "#f59e0b" : "transparent"}
                    color={displayRating >= n ? "#f59e0b" : "var(--text-3)"}
                    style={{ transition: "fill 0.15s, color 0.15s" }}
                  />
                </button>
              ))}
              {displayRating > 0 && (
                <span style={{
                  marginLeft: 8, fontSize: "0.82rem", fontWeight: 600,
                  color: "#f59e0b", opacity: 0.9,
                }}>
                  {ratingLabels[displayRating]}
                </span>
              )}
            </div>
          </div>

          {/* Comment */}
          <div>
            <label
              htmlFor="review-comment"
              style={{ display: "block", fontSize: "0.8rem", fontWeight: 500, color: "var(--text-2)", marginBottom: 6 }}
            >
              Your Review
            </label>
            <textarea
              id="review-comment"
              rows={4}
              className="input"
              placeholder="Share your experience — what did you learn? How did this mentor help you?"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              disabled={submitting}
              style={{ resize: "vertical", fontFamily: "inherit", lineHeight: 1.6 }}
            />
            <p style={{
              fontSize: "0.7rem", color: comment.length >= 10 ? "var(--text-3)" : "rgba(239,68,68,0.6)",
              marginTop: 4, textAlign: "right",
            }}>
              {comment.length} chars {comment.length < 10 ? `(min 10)` : "✓"}
            </p>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.25rem" }}>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              id="review-submit-btn"
              type="submit"
              className="btn btn-primary"
              disabled={submitting || rating === 0 || comment.trim().length < 10}
            >
              {submitting
                ? <><Loader2 size={15} className="animate-spin" /> Submitting…</>
                : <><Send size={15} /> Submit Review</>
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
