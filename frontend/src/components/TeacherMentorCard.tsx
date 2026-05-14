"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Star, GraduationCap, Clock, Users, CheckCircle2, MapPin, Phone, Mail, Calendar, Bookmark } from "lucide-react";
import { TeacherMentor } from "@/types";
import { useAuthStore } from "@/store/authStore";
import { toggleSavedMentor } from "@/lib/db";
import toast from "react-hot-toast";
import TeacherRequestModal from "./TeacherRequestModal";

interface Props {
  teacher: TeacherMentor;
}

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          size={12}
          fill={i <= Math.round(rating) ? "#f59e0b" : "none"}
          stroke={i <= Math.round(rating) ? "#f59e0b" : "#52525b"}
          strokeWidth={1.5}
        />
      ))}
      <span style={{ fontSize: "0.72rem", color: "#f59e0b", fontWeight: 700, marginLeft: 4 }}>
        {rating > 0 ? rating.toFixed(1) : "New"}
      </span>
    </div>
  );
}

export default function TeacherMentorCard({ teacher }: Props) {
  const router = useRouter();
  const { user } = useAuthStore();
  const [requestOpen, setRequestOpen] = useState(false);
  const [hovered, setHovered] = useState(false);

  const initials = teacher.name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
  const expertiseDisplay = teacher.subjectExpertise.slice(0, 3);
  const moreCount = teacher.subjectExpertise.length - 3;
  
  const isSaved = user?.savedMentors?.includes(teacher.uid) || false;

  const handleBookmark = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return toast.error("Please sign in to save mentors");
    try {
      await toggleSavedMentor(user.uid, teacher.uid, isSaved);
      // Immediately update local store for snappy UI
      const currentSaved = user.savedMentors || [];
      const newSaved = isSaved ? currentSaved.filter(id => id !== teacher.uid) : [...currentSaved, teacher.uid];
      useAuthStore.getState().setUser({ ...user, savedMentors: newSaved });
      toast.success(isSaved ? "Teacher removed from saved" : "Teacher saved!");
    } catch {
      toast.error("Failed to update bookmark");
    }
  };

  return (
    <>
      <Link href={`/teacher/${teacher.uid}`} style={{ textDecoration: "none", display: "block", height: "100%" }} prefetch={true}>
        <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="card-link"
        style={{
          background: hovered
            ? "linear-gradient(145deg, var(--bg-card), rgba(245,158,11,0.04))"
            : "var(--bg-card)",
          border: hovered ? "1px solid rgba(245,158,11,0.3)" : "1px solid var(--border)",
          borderRadius: 16,
          padding: "1.25rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.875rem",
          cursor: "pointer",
          transition: "all 0.25s cubic-bezier(0.4,0,0.2,1)",
          transform: hovered ? "translateY(-3px)" : "none",
          boxShadow: hovered ? "0 8px 32px rgba(245,158,11,0.1)" : "none",
          position: "relative",
          overflow: "hidden",
          height: "100%",
        }}
      >
        {/* Gold shimmer overlay on hover */}
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          background: "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(245,158,11,0.05) 0%, transparent 70%)",
          opacity: hovered ? 1 : 0,
          transition: "opacity 0.25s",
        }} />

        {/* Bookmark Button */}
        <button 
          onClick={handleBookmark}
          style={{
            position: "absolute", top: 12, right: 12, zIndex: 10,
            background: "rgba(0,0,0,0.3)", border: "none", borderRadius: "50%",
            width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center",
            color: isSaved ? "#f59e0b" : "var(--text-3)",
            cursor: "pointer", backdropFilter: "blur(4px)", transition: "all 0.2s"
          }}
          title={isSaved ? "Remove from saved" : "Save teacher"}
        >
          <Bookmark size={15} fill={isSaved ? "#f59e0b" : "none"} />
        </button>

        {/* Top row — avatar + name + verified badge */}
        <div style={{ display: "flex", gap: "0.875rem", alignItems: "flex-start", position: "relative", zIndex: 1 }}>
          {/* Avatar */}
          <div style={{
            width: 52, height: 52, borderRadius: 14, flexShrink: 0,
            background: "rgba(245,158,11,0.12)",
            border: "1.5px solid rgba(245,158,11,0.3)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "1.1rem", fontWeight: 700, color: "#f59e0b",
          }}>
            {teacher.photoURL
              ? <img src={teacher.photoURL} alt={teacher.name} style={{ width: "100%", height: "100%", borderRadius: 12, objectFit: "cover" }} />
              : initials}
          </div>

          {/* Name + meta */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 2 }}>
              <span style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--text-1)" }}>
                {teacher.name}
              </span>
              {teacher.isVerified && (
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: 3,
                  background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.35)",
                  borderRadius: 99, padding: "0.1rem 0.5rem",
                  fontSize: "0.6rem", fontWeight: 700, color: "#f59e0b", letterSpacing: "0.03em",
                  flexShrink: 0,
                }}>
                  <CheckCircle2 size={9} /> VERIFIED FACULTY
                </span>
              )}
            </div>
            <p style={{ fontSize: "0.78rem", color: "var(--text-2)", marginBottom: 2 }}>
              {teacher.designation}
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "0.72rem", color: "var(--text-3)" }}>
              <MapPin size={11} />
              <span>{teacher.department}</span>
            </div>
          </div>

          {/* Active indicator */}
          {teacher.isActive && (
            <div title="Available for mentorship" style={{
              width: 8, height: 8, borderRadius: "50%", background: "#22c55e",
              flexShrink: 0, animation: "pulse-dot 1.8s infinite",
            }} />
          )}
        </div>

        {/* Rating + Stats row */}
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap", position: "relative", zIndex: 1 }}>
          <StarDisplay rating={teacher.rating} />
          <span style={{ width: 1, height: 12, background: "var(--border)" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 3, fontSize: "0.72rem", color: "var(--text-3)" }}>
            <Users size={11} /> {teacher.totalSessions} sessions
          </div>
          <span style={{ width: 1, height: 12, background: "var(--border)" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 3, fontSize: "0.72rem", color: "var(--text-3)" }}>
            <Clock size={11} /> {teacher.yearsExperience}+ yrs exp
          </div>
        </div>

        {/* Subject expertise chips */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5, position: "relative", zIndex: 1 }}>
          {expertiseDisplay.map(s => (
            <span key={s} style={{
              padding: "0.2rem 0.6rem", borderRadius: 99, fontSize: "0.68rem", fontWeight: 500,
              background: "rgba(245,158,11,0.1)", color: "#d97706",
              border: "1px solid rgba(245,158,11,0.2)",
            }}>{s}</span>
          ))}
          {moreCount > 0 && (
            <span style={{
              padding: "0.2rem 0.6rem", borderRadius: 99, fontSize: "0.68rem", fontWeight: 500,
              background: "var(--bg-elevated)", color: "var(--text-3)", border: "1px solid var(--border)",
            }}>+{moreCount} more</span>
          )}
        </div>

        {/* Bio snippet */}
        {teacher.bio && (
          <p style={{
            fontSize: "0.78rem", color: "var(--text-2)", lineHeight: 1.55,
            display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
            position: "relative", zIndex: 1,
          }}>
            {teacher.bio}
          </p>
        )}

        {/* Availability */}
        {teacher.availability.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: "0.72rem", color: "var(--text-3)", position: "relative", zIndex: 1 }}>
            <Calendar size={11} />
            <span>{teacher.availability.slice(0, 2).join(", ")}{teacher.availability.length > 2 ? "…" : ""}</span>
          </div>
        )}

        {/* CTA */}
        <div style={{ display: "flex", gap: 8, position: "relative", zIndex: 1 }}>
          <button
            id={`teacher-request-btn-${teacher.uid}`}
            onClick={e => { e.preventDefault(); e.stopPropagation(); setRequestOpen(true); }}
            disabled={!teacher.isActive}
            style={{
              flex: 1, padding: "0.55rem", borderRadius: 9, fontWeight: 600, fontSize: "0.82rem",
              cursor: teacher.isActive ? "pointer" : "not-allowed",
              border: "1px solid rgba(245,158,11,0.35)",
              background: teacher.isActive ? "rgba(245,158,11,0.12)" : "var(--bg-elevated)",
              color: teacher.isActive ? "#f59e0b" : "var(--text-3)",
              fontFamily: "inherit", transition: "all 0.2s",
            }}
          >
            {teacher.isActive ? "Request Mentorship" : "Unavailable"}
          </button>

          {/* Contact icon */}
          {teacher.contactMethod && (
            <button
              onClick={e => { e.preventDefault(); e.stopPropagation(); }}
              title={`Contact via ${teacher.contactMethod}`}
              style={{
                padding: "0.55rem 0.8rem", borderRadius: 9, cursor: "pointer",
                border: "1px solid var(--border)", background: "var(--bg-elevated)",
                color: "var(--text-2)", fontFamily: "inherit", transition: "all 0.2s",
              }}
            >
              {teacher.contactMethod === "whatsapp" || teacher.contactMethod === "phone"
                ? <Phone size={14} />
                : <Mail size={14} />}
            </button>
          )}
        </div>
      </div>
      </Link>

      {requestOpen && user && (
        <TeacherRequestModal
          teacher={teacher}
          user={user}
          onClose={() => setRequestOpen(false)}
        />
      )}

      <style>{`
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.7); }
        }
      `}</style>
    </>
  );
}
