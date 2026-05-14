"use client";
import { useState, useEffect, useCallback } from "react";
import {
  X, Star, CheckCircle2, MapPin, Clock, Users, Calendar, ExternalLink,
  GraduationCap, MessageSquarePlus, Lock, Phone, Mail, Zap, BadgeCheck,
} from "lucide-react";
import { subscribeTeacherMentor, subscribeReviewsForTeacherMentor, hasUserReviewedMentor } from "@/lib/db";
import { TeacherMentor, Review, Session } from "@/types";
import { useAuthStore } from "@/store/authStore";
import { formatDistanceToNow } from "date-fns";
import StarRating from "./StarRating";
import ReviewModal from "./ReviewModal";
import toast from "react-hot-toast";

interface Props {
  teacherUid: string;
  session?: Session;
  onClose: () => void;
}

function StatChip({ icon, value, label }: { icon: React.ReactNode; value: string | number; label: string }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
      padding: "0.65rem 0.5rem", borderRadius: 10,
      background: "rgba(255,255,255,0.03)", border: "1px solid rgba(245,158,11,0.12)",
      flex: 1, minWidth: 70,
    }}>
      <div style={{ color: "#d97706" }}>{icon}</div>
      <span style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--text-1)" }}>{value}</span>
      <span style={{ fontSize: "0.65rem", color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</span>
    </div>
  );
}

export default function TeacherMentorProfileModal({ teacherUid, session, onClose }: Props) {
  const { user } = useAuthStore();
  const [teacher, setTeacher] = useState<TeacherMentor | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewModal, setReviewModal] = useState(false);
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);
  const [tab, setTab] = useState<"profile" | "reviews" | "session">("profile");

  useEffect(() => {
    const unsubProfile = subscribeTeacherMentor(teacherUid, (data) => {
      setTeacher(data);
      setLoading(false);
    });
    const unsubReviews = subscribeReviewsForTeacherMentor(teacherUid, setReviews);
    return () => { unsubProfile(); unsubReviews(); };
  }, [teacherUid]);

  useEffect(() => {
    if (!user || !teacher) return;
    hasUserReviewedMentor(user.uid, teacherUid).then(setAlreadyReviewed).catch(() => {});
  }, [user, teacherUid, teacher]);

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const avgRating = reviews.length > 0
    ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10
    : teacher?.rating ?? 0;

  const initials = teacher?.name?.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase() ?? "?";
  const responseLabel = (teacher?.responseTimeHours ?? 24) <= 4 ? "~4 hours" : (teacher?.responseTimeHours ?? 24) <= 12 ? "~12 hours" : "~1 day";

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, zIndex: 200,
          background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)",
          animation: "fadeIn 0.2s ease-out both",
        }}
      />

      {/* Modal panel */}
      <div
        style={{
          position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
          width: "min(680px, 100vw)", maxHeight: "92vh",
          background: "var(--bg-card)", borderRadius: "20px 20px 0 0",
          border: "1px solid rgba(245,158,11,0.2)", borderBottom: "none",
          zIndex: 201, display: "flex", flexDirection: "column",
          animation: "slideUp 0.3s cubic-bezier(0.4,0,0.2,1) both",
          overflow: "hidden",
        }}
      >
        {/* Gold top bar */}
        <div style={{
          height: 3,
          background: "linear-gradient(90deg, #f59e0b, #d97706, #92400e, #d97706, #f59e0b)",
          backgroundSize: "200% 100%",
          animation: "slide-gradient 3s linear infinite",
          flexShrink: 0,
        }} />

        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "1rem 1.25rem 0",
          flexShrink: 0,
        }}>
          <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-3)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
            Teacher Mentor Profile
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <a
              href={`/teacher/${teacherUid}`}
              target="_blank"
              rel="noreferrer"
              title="Open full page"
              style={{ color: "var(--text-3)", display: "flex", alignItems: "center" }}
            >
              <ExternalLink size={15} />
            </a>
            <button onClick={onClose} style={{
              background: "none", border: "none", cursor: "pointer", color: "var(--text-3)",
              display: "flex", alignItems: "center", padding: 4,
            }}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "0 1.25rem 1.5rem" }} className="custom-scrollbar">

          {loading ? (
            <div style={{ padding: "3rem", display: "flex", justifyContent: "center", alignItems: "center" }}>
              <div className="animate-spin" style={{ width: 28, height: 28, border: "2px solid var(--text-3)", borderTopColor: "transparent", borderRadius: "50%" }} />
            </div>
          ) : !teacher ? (
            <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-3)" }}>
              <p>Profile not found.</p>
            </div>
          ) : (
            <>
              {/* Profile hero */}
              <div style={{ display: "flex", gap: "1.25rem", alignItems: "flex-start", padding: "1.25rem 0 1rem" }}>
                {/* Avatar */}
                <div style={{
                  width: 72, height: 72, borderRadius: 18, flexShrink: 0,
                  background: "rgba(245,158,11,0.12)",
                  border: "2px solid rgba(245,158,11,0.4)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "1.4rem", fontWeight: 700, color: "#f59e0b",
                  overflow: "hidden",
                }}>
                  {teacher.photoURL
                    ? <img src={teacher.photoURL} alt={teacher.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : initials}
                </div>

                {/* Name block */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                    <h2 style={{ fontSize: "1.15rem", fontWeight: 700, color: "var(--text-1)", margin: 0 }}>{teacher.name}</h2>
                    {teacher.isVerified && (
                      <span style={{
                        display: "inline-flex", alignItems: "center", gap: 4,
                        background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.4)",
                        borderRadius: 99, padding: "0.12rem 0.6rem",
                        fontSize: "0.62rem", fontWeight: 700, color: "#f59e0b",
                      }}>
                        <BadgeCheck size={10} /> VERIFIED FACULTY
                      </span>
                    )}
                    {teacher.isActive && (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: "0.7rem", color: "#22c55e", fontWeight: 600 }}>
                        <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#22c55e", display: "inline-block", animation: "pulse-dot 1.8s infinite" }} />
                        Available
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: "0.82rem", color: "var(--text-2)", marginBottom: 3 }}>{teacher.designation}</p>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: "0.75rem", color: "var(--text-3)" }}>
                    <MapPin size={11} /> {teacher.department}
                  </div>

                  {/* Rating row */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                    <StarRating rating={avgRating} size={14} />
                    <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-1)" }}>
                      {avgRating > 0 ? avgRating.toFixed(1) : "New"}
                    </span>
                    {reviews.length > 0 && (
                      <span style={{ fontSize: "0.72rem", color: "var(--text-3)" }}>({reviews.length} reviews)</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Stats row */}
              <div style={{ display: "flex", gap: 8, marginBottom: "1.25rem" }}>
                <StatChip icon={<Users size={15} />} value={teacher.totalSessions} label="Sessions" />
                <StatChip icon={<GraduationCap size={15} />} value={`${teacher.yearsExperience}+`} label="Yrs Exp" />
                <StatChip icon={<Clock size={15} />} value={responseLabel} label="Response" />
                <StatChip icon={<CheckCircle2 size={15} />} value={teacher.isActive ? "Active" : "Offline"} label="Status" />
              </div>

              {/* Active session banner */}
              {session && session.status === "upcoming" && (
                <div style={{
                  background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.25)",
                  borderRadius: 12, padding: "0.9rem", marginBottom: "1.25rem",
                }}>
                  <p style={{ fontSize: "0.72rem", fontWeight: 700, color: "#22c55e", marginBottom: 8, display: "flex", alignItems: "center", gap: 5 }}>
                    <Zap size={12} /> UPCOMING SESSION WITH THIS MENTOR
                  </p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: "0.8rem", color: "var(--text-1)" }}>
                      <Calendar size={13} style={{ color: "#a78bfa" }} />
                      {session.scheduledAt.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: "0.8rem", color: "var(--text-1)" }}>
                      <Clock size={13} style={{ color: "#10b981" }} />
                      {session.scheduledAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </div>
                    {session.duration && (
                      <span style={{ fontSize: "0.78rem", color: "var(--text-3)" }}>· {session.duration} min</span>
                    )}
                  </div>
                  {session.meetLink && (
                    <a
                      href={session.meetLink}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: "inline-flex", alignItems: "center", gap: 6,
                        background: "rgba(34,197,94,0.15)", color: "#22c55e",
                        padding: "0.4rem 0.9rem", borderRadius: 9, fontSize: "0.8rem",
                        fontWeight: 600, textDecoration: "none", border: "1px solid rgba(34,197,94,0.3)",
                      }}
                    >
                      <ExternalLink size={13} /> Join Meeting
                    </a>
                  )}
                </div>
              )}

              {/* Tab bar */}
              <div style={{ display: "flex", gap: 4, marginBottom: "1rem", borderBottom: "1px solid var(--border)", paddingBottom: 0 }}>
                {[
                  { key: "profile", label: "Profile" },
                  { key: "reviews", label: `Reviews (${reviews.length})` },
                  ...(session ? [{ key: "session", label: "Session" }] : []),
                ].map(t => (
                  <button
                    key={t.key}
                    onClick={() => setTab(t.key as typeof tab)}
                    style={{
                      background: "none", border: "none", cursor: "pointer",
                      padding: "0.5rem 0.9rem", fontFamily: "inherit",
                      fontSize: "0.82rem", fontWeight: tab === t.key ? 700 : 500,
                      color: tab === t.key ? "#f59e0b" : "var(--text-3)",
                      borderBottom: tab === t.key ? "2px solid #f59e0b" : "2px solid transparent",
                      marginBottom: -1, transition: "all 0.15s",
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Profile tab */}
              {tab === "profile" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

                  {/* Bio */}
                  {teacher.bio && (
                    <div>
                      <p style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-3)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>About</p>
                      <p style={{ fontSize: "0.88rem", color: "var(--text-1)", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{teacher.bio}</p>
                    </div>
                  )}

                  {/* Subject expertise */}
                  {teacher.subjectExpertise.length > 0 && (
                    <div>
                      <p style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-3)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Subject Expertise</p>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {teacher.subjectExpertise.map(s => (
                          <span key={s} style={{
                            padding: "0.28rem 0.75rem", borderRadius: 99, fontSize: "0.73rem", fontWeight: 500,
                            background: "rgba(245,158,11,0.1)", color: "#d97706",
                            border: "1px solid rgba(245,158,11,0.25)",
                          }}>{s}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Availability */}
                  {teacher.availability.length > 0 && (
                    <div>
                      <p style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-3)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Availability</p>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {teacher.availability.map(slot => (
                          <div key={slot} style={{
                            display: "flex", alignItems: "center", gap: 6,
                            padding: "0.28rem 0.75rem", borderRadius: 8, fontSize: "0.78rem",
                            color: "var(--text-2)", background: "var(--bg-elevated)",
                            border: "1px solid var(--border)",
                          }}>
                            <Calendar size={12} style={{ color: "#22c55e" }} /> {slot}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Contact */}
                  {teacher.contactMethod && teacher.contactValue && (
                    <div style={{
                      display: "flex", alignItems: "center", gap: 10, padding: "0.65rem 0.9rem",
                      background: "var(--bg-elevated)", borderRadius: 10, border: "1px solid var(--border)",
                    }}>
                      {teacher.contactMethod === "email"
                        ? <Mail size={15} style={{ color: "#a78bfa" }} />
                        : <Phone size={15} style={{ color: "#22c55e" }} />}
                      <span style={{ fontSize: "0.82rem", color: "var(--text-1)" }}>{teacher.contactValue}</span>
                      <span style={{ fontSize: "0.7rem", color: "var(--text-3)", marginLeft: "auto" }}>via {teacher.contactMethod}</span>
                    </div>
                  )}

                  {/* Write review CTA */}
                  {user && user.uid !== teacherUid && (
                    <button
                      onClick={() => {
                        if (alreadyReviewed) { toast("You've already reviewed this mentor.", { icon: "✅" }); return; }
                        setReviewModal(true);
                      }}
                      disabled={alreadyReviewed}
                      style={{
                        width: "100%", padding: "0.6rem", borderRadius: 10,
                        fontWeight: 600, fontSize: "0.83rem", cursor: alreadyReviewed ? "not-allowed" : "pointer",
                        border: "1px solid var(--border)", background: "var(--bg-elevated)",
                        color: alreadyReviewed ? "var(--text-3)" : "var(--text-2)",
                        fontFamily: "inherit", transition: "all 0.2s",
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                      }}
                    >
                      {alreadyReviewed ? <><Lock size={13} /> Reviewed</> : <><MessageSquarePlus size={13} /> Write a Review</>}
                    </button>
                  )}
                </div>
              )}

              {/* Reviews tab */}
              {tab === "reviews" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {reviews.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "2.5rem 0", color: "var(--text-3)" }}>
                      <MessageSquarePlus size={32} style={{ margin: "0 auto 12px", opacity: 0.3 }} />
                      <p style={{ fontSize: "0.85rem" }}>No reviews yet. Be the first!</p>
                    </div>
                  ) : reviews.map(r => (
                    <div key={r.id} style={{ paddingBottom: "1rem", borderBottom: "1px solid var(--border)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{
                            width: 34, height: 34, borderRadius: "50%",
                            background: "var(--accent-dim)", border: "1px solid var(--accent-border)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: "0.85rem", fontWeight: 700, color: "#a78bfa",
                          }}>
                            {r.fromUserName[0]?.toUpperCase()}
                          </div>
                          <div>
                            <span style={{ fontWeight: 600, fontSize: "0.85rem", color: "var(--text-1)" }}>{r.fromUserName}</span>
                            <p style={{ fontSize: "0.7rem", color: "var(--text-3)" }}>{formatDistanceToNow(new Date(r.createdAt), { addSuffix: true })}</p>
                          </div>
                        </div>
                        <StarRating rating={r.rating} size={13} />
                      </div>
                      <p style={{ fontSize: "0.85rem", color: "var(--text-2)", lineHeight: 1.6, paddingLeft: 44 }}>
                        &quot;{r.comment}&quot;
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Session tab */}
              {tab === "session" && session && (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.9rem" }}>
                  <div style={{ padding: "1rem", background: "var(--bg-elevated)", borderRadius: 12, border: "1px solid var(--border)" }}>
                    <p style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-3)", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>Session Details</p>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                      {[
                        { label: "Status", value: session.status.toUpperCase() },
                        { label: "Duration", value: session.duration ? `${session.duration} min` : "—" },
                        { label: "Date", value: session.scheduledAt.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" }) },
                        { label: "Time", value: session.scheduledAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) },
                      ].map(item => (
                        <div key={item.label}>
                          <p style={{ fontSize: "0.68rem", color: "var(--text-3)", marginBottom: 2, textTransform: "uppercase", letterSpacing: "0.04em" }}>{item.label}</p>
                          <p style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-1)" }}>{item.value}</p>
                        </div>
                      ))}
                    </div>
                    {session.meetLink && (
                      <a
                        href={session.meetLink}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: "inline-flex", alignItems: "center", gap: 6,
                          marginTop: "1rem", background: "rgba(124,58,237,0.15)", color: "#a78bfa",
                          padding: "0.5rem 1rem", borderRadius: 9, fontSize: "0.82rem",
                          fontWeight: 600, textDecoration: "none", border: "1px solid rgba(124,58,237,0.3)",
                        }}
                      >
                        <ExternalLink size={13} /> Open Meeting Link
                      </a>
                    )}
                    {session.summary && (
                      <div style={{ marginTop: 12 }}>
                        <p style={{ fontSize: "0.68rem", color: "var(--text-3)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.04em" }}>Summary</p>
                        <p style={{ fontSize: "0.85rem", color: "var(--text-2)", fontStyle: "italic", lineHeight: 1.6 }}>"{session.summary}"</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {reviewModal && teacher && (
        <ReviewModal mentor={teacher} onClose={() => setReviewModal(false)} onSuccess={() => setAlreadyReviewed(true)} />
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translateX(-50%) translateY(40px); opacity: 0; } to { transform: translateX(-50%) translateY(0); opacity: 1; } }
        @keyframes slide-gradient { from { background-position: 0% 0; } to { background-position: 200% 0; } }
        @keyframes pulse-dot { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.4; transform: scale(0.7); } }
      `}</style>
    </>
  );
}
