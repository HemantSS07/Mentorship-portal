"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Star, Clock, Users, CheckCircle, Calendar, MessageSquarePlus, Lock, MapPin, GraduationCap } from "lucide-react";
import { subscribeTeacherMentor, subscribeReviewsForTeacherMentor, hasUserReviewedMentor } from "@/lib/db";
import { TeacherMentor, Review } from "@/types";
import { useAuthStore } from "@/store/authStore";

import SkillBadge from "@/components/SkillBadge";
import StarRating from "@/components/StarRating";
import TeacherRequestModal from "@/components/TeacherRequestModal";
import ReviewModal from "@/components/ReviewModal";
import Link from "next/link";
import toast from "react-hot-toast";
import { formatDistanceToNow } from "date-fns";

export default function TeacherMentorProfile() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();

  const [teacher, setTeacher] = useState<TeacherMentor | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [reviewModal, setReviewModal] = useState(false);
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);
  const [checkingReview, setCheckingReview] = useState(false);

  // Real-time profile subscription
  useEffect(() => {
    if (!id) return;
    setLoading(true);

    const unsubProfile = subscribeTeacherMentor(id as string, (data) => {
      if (data) {
        setTeacher(data);
      } else {
        setTeacher(null);
      }
      setLoading(false);
    });

    const unsubReviews = subscribeReviewsForTeacherMentor(id as string, (r) => {
      setReviews(r);
    });

    return () => {
      unsubProfile();
      unsubReviews();
    };
  }, [id]);


  useEffect(() => {
    if (!user || !teacher) return;
    setCheckingReview(true);
    hasUserReviewedMentor(user.uid, id as string)
      .then((already) => setAlreadyReviewed(already))
      .catch(() => {})
      .finally(() => setCheckingReview(false));
  }, [user, id, teacher, reviews]);

  if (loading) return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh" }}>
      <div className="animate-spin" style={{ width: 22, height: 22, border: "2px solid var(--text-3)", borderTopColor: "transparent", borderRadius: "50%" }} />
    </div>
  );

  if (!teacher) return (
    <div style={{ textAlign: "center", padding: "5rem 1rem" }}>
      <p style={{ fontSize: "2rem", marginBottom: 12 }}>404</p>
      <p className="heading-sm" style={{ marginBottom: 16 }}>Teacher Mentor not found</p>
      <button onClick={() => router.push("/mentors")} className="btn btn-primary">Browse mentors</button>
    </div>
  );

  const initials = teacher.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
  const responseLabel = teacher.responseTimeHours <= 4 ? "~4 hours" : teacher.responseTimeHours <= 12 ? "~12 hours" : "~1 day";

  const avgRating = reviews.length > 0
    ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10
    : teacher.rating;

  const handleWriteReview = () => {
    if (!user) {
      toast("Please sign in to leave a review", { icon: "🔒" });
      router.push("/register");
      return;
    }
    if (user.uid === teacher.uid) {
      toast.error("You can't review yourself!");
      return;
    }
    if (alreadyReviewed) {
      toast("You've already reviewed this mentor.", { icon: "✅" });
      return;
    }
    setReviewModal(true);
  };

  return (
    <div className="page-wrap" style={{ padding: "2rem 1.5rem" }}>
      <button onClick={() => router.back()} className="btn btn-ghost btn-sm"
        style={{ marginBottom: "1.5rem", display: "inline-flex", alignItems: "center", gap: 6, paddingLeft: 0 }}>
        <ArrowLeft size={14} /> Back
      </button>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 2.5fr", gap: "1.5rem", alignItems: "start" }} className="profile-grid">
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem", position: "sticky", top: "5rem" }}>
          <div className="card" style={{ textAlign: "center", position: "relative", overflow: "hidden" }}>
            
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 60, background: "rgba(245,158,11,0.1)", zIndex: 0 }} />
            
            <div style={{ position: "relative", zIndex: 1 }}>
              <div style={{ 
                width: 80, height: 80, borderRadius: 16, margin: "0 auto 0.75rem", 
                background: "var(--bg-card)", border: "2px solid rgba(245,158,11,0.3)", 
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "1.5rem", fontWeight: 700, color: "#f59e0b",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)", overflow: "hidden"
              }}>
                {teacher.photoURL ? <img src={teacher.photoURL} alt={teacher.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : initials}
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5, marginBottom: 2 }}>
                {teacher.isActive && <><span className="online-dot" style={{ background: "#22c55e" }} /><span style={{ fontSize: "0.72rem", color: "#22c55e" }}>Available</span></>}
              </div>

              <p style={{ fontWeight: 700, fontSize: "1.1rem", color: "var(--text-1)", marginBottom: 2 }}>{teacher.name}</p>
              
              {teacher.isVerified && (
                <span style={{ display: "inline-block", background: "rgba(245,158,11,0.15)", color: "#f59e0b", fontSize: "0.65rem", fontWeight: 700, padding: "0.15rem 0.6rem", borderRadius: 99, marginBottom: 8 }}>
                  VERIFIED FACULTY
                </span>
              )}
              
              <p style={{ fontSize: "0.85rem", color: "var(--text-2)", marginBottom: 4 }}>{teacher.designation}</p>
              <p style={{ fontSize: "0.75rem", color: "var(--text-3)", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                <MapPin size={12} /> {teacher.department}
              </p>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5, margin: "0.8rem 0" }}>
                <StarRating rating={avgRating} size={14} />
                <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-1)" }}>
                  {avgRating > 0 ? avgRating.toFixed(1) : "New"}
                </span>
                {reviews.length > 0 && <span style={{ fontSize: "0.75rem", color: "var(--text-3)" }}>({reviews.length})</span>}
              </div>

              <button
                onClick={() => {
                  if (!user) { toast("Please sign in to request mentorship", { icon: "🔒" }); router.push("/register"); return; }
                  setModal(true);
                }}
                disabled={!teacher.isActive}
                className="btn btn-primary" 
                style={{ 
                  width: "100%", marginTop: "0.5rem", 
                  background: teacher.isActive ? "#f59e0b" : "var(--bg-elevated)", 
                  color: teacher.isActive ? "#fff" : "var(--text-3)",
                  border: "none"
                }}
              >
                {teacher.isActive ? "Request Mentorship" : "Unavailable"}
              </button>

              <button
                onClick={handleWriteReview}
                className={`btn ${alreadyReviewed ? "btn-ghost" : "btn-secondary"}`}
                style={{ width: "100%", marginTop: "0.5rem", position: "relative" }}
                disabled={checkingReview || alreadyReviewed}
              >
                {checkingReview ? <span className="animate-spin">⌛</span> : alreadyReviewed ? <><Lock size={13} /> Reviewed</> : <><MessageSquarePlus size={14} /> Write a Review</>}
              </button>
            </div>
          </div>

          <div className="card" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            {[
              { icon: Users, value: teacher.totalSessions, label: "Sessions" },
              { icon: GraduationCap, value: teacher.yearsExperience + "+", label: "Years Exp" },
              { icon: Clock, value: responseLabel, label: "Response" },
              { icon: CheckCircle, value: teacher.isActive ? "Active" : "Offline", label: "Status" },
            ].map(stat => (
              <div key={stat.label} style={{ textAlign: "center", padding: "0.6rem", borderRadius: 8, background: "var(--bg-elevated)", border: "1px solid rgba(245,158,11,0.1)" }}>
                <stat.icon size={14} style={{ color: "#d97706", margin: "0 auto 4px" }} />
                <p style={{ fontWeight: 700, fontSize: "0.85rem", color: "var(--text-1)" }}>{stat.value}</p>
                <p style={{ fontSize: "0.68rem", color: "var(--text-3)" }}>{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div className="card">
            <p style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-2)", marginBottom: 12, borderBottom: "1px solid var(--border)", paddingBottom: 8 }}>About Me</p>
            <p style={{ fontSize: "0.9rem", color: "var(--text-1)", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
              {teacher.bio || "No biography provided."}
            </p>
          </div>

          <div className="card">
            <p style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-2)", marginBottom: 12, borderBottom: "1px solid var(--border)", paddingBottom: 8 }}>Subject Expertise</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {teacher.subjectExpertise.length > 0 ? teacher.subjectExpertise.map(s => (
                <span key={s} style={{ padding: "0.3rem 0.8rem", borderRadius: 99, fontSize: "0.75rem", fontWeight: 500, background: "rgba(245,158,11,0.1)", color: "#d97706", border: "1px solid rgba(245,158,11,0.2)" }}>
                  {s}
                </span>
              )) : (
                <p style={{ fontSize: "0.8rem", color: "var(--text-3)" }}>No subjects listed.</p>
              )}
            </div>
          </div>

          {teacher.availability?.length > 0 && (
            <div className="card">
              <p style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-2)", marginBottom: 12, borderBottom: "1px solid var(--border)", paddingBottom: 8 }}>Typical Availability</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {teacher.availability.map(slot => (
                  <div key={slot} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.8rem", color: "var(--text-2)", background: "var(--bg-elevated)", padding: "0.4rem 0.8rem", borderRadius: 8 }}>
                    <Calendar size={13} style={{ color: "#22c55e" }} /> {slot}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: reviews.length ? 14 : 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <p style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-2)" }}>Student Feedback</p>
                {reviews.length > 0 && <span style={{ fontSize: "0.72rem", color: "var(--text-3)", background: "var(--bg-elevated)", padding: "0.1rem 0.5rem", borderRadius: 20 }}>{reviews.length}</span>}
              </div>
            </div>

            {reviews.length === 0 ? (
              <div style={{ textAlign: "center", padding: "2rem 0", color: "var(--text-3)" }}>
                <MessageSquarePlus size={32} style={{ margin: "0 auto 12px", opacity: 0.3 }} />
                <p style={{ fontSize: "0.85rem" }}>No reviews yet. Be the first to leave one!</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {reviews.map(r => (
                  <div key={r.id} style={{ paddingBottom: "1rem", borderBottom: "1px solid var(--border)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 34, height: 34, borderRadius: "50%", background: "var(--accent-dim)", border: "1px solid var(--accent-border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.85rem", fontWeight: 700, color: "#a78bfa" }}>
                          {r.fromUserName[0].toUpperCase()}
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
          </div>
        </div>
      </div>

      {modal && user && <TeacherRequestModal teacher={teacher} user={user} onClose={() => setModal(false)} />}
      {reviewModal && <ReviewModal mentor={teacher} onClose={() => setReviewModal(false)} onSuccess={() => setAlreadyReviewed(true)} />}

      <style>{`
        @media (max-width: 768px) { .profile-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </div>
  );
}
