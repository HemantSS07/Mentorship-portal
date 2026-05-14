"use client";
import Link from "next/link";
import { Mentor } from "@/types";
import { Star, Clock, BookOpen, Bookmark } from "lucide-react";
import SkillBadge from "./SkillBadge";
import { useAuthStore } from "@/store/authStore";
import { toggleSavedMentor } from "@/lib/db";
import toast from "react-hot-toast";

interface Props { mentor: Mentor; }

export default function MentorCard({ mentor }: Props) {
  const initials = mentor.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
  const { user } = useAuthStore();
  
  const isSaved = user?.savedMentors?.includes(mentor.uid) || false;

  const handleBookmark = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return toast.error("Please sign in to save mentors");
    try {
      await toggleSavedMentor(user.uid, mentor.uid, isSaved);
      // Immediately update local store for snappy UI
      const currentSaved = user.savedMentors || [];
      const newSaved = isSaved ? currentSaved.filter(id => id !== mentor.uid) : [...currentSaved, mentor.uid];
      useAuthStore.getState().setUser({ ...user, savedMentors: newSaved });
      toast.success(isSaved ? "Mentor removed from saved" : "Mentor saved!");
    } catch {
      toast.error("Failed to update bookmark");
    }
  };

  return (
    <Link href={`/mentor/${mentor.uid}`} style={{ textDecoration: "none" }} prefetch={true}>
      <div className="card card-link" style={{ height: "100%", display: "flex", flexDirection: "column", gap: "0.875rem", position: "relative" }}>
        
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
          title={isSaved ? "Remove from saved" : "Save mentor"}
        >
          <Bookmark size={15} fill={isSaved ? "#f59e0b" : "none"} />
        </button>

        {/* Header row */}
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
          <div style={{ position: "relative", flexShrink: 0 }}>
            {mentor.photoURL
              ? <img src={mentor.photoURL} alt={mentor.name}
                  style={{ width: 44, height: 44, borderRadius: 10, objectFit: "cover", border: "1px solid var(--border)" }} />
              : <div style={{
                  width: 44, height: 44, borderRadius: 10, flexShrink: 0,
                  background: "var(--accent-dim)", border: "1px solid var(--accent-border)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "0.85rem", fontWeight: 700, color: "#a78bfa"
                }}>{initials}</div>
            }
            {mentor.isActive && (
              <span className="online-dot" style={{ position: "absolute", bottom: -2, right: -2 }} />
            )}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--text-1)", marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {mentor.name}
            </p>
            <p style={{ fontSize: "0.78rem", color: "var(--text-2)" }}>
              {mentor.branch} · {mentor.year}
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 3, marginTop: 3 }}>
              <Star size={12} className="star-fill" style={{ fill: "#f59e0b" }} />
              <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-1)" }}>
                {mentor.rating > 0 ? mentor.rating.toFixed(1) : "New"}
              </span>
              {mentor.totalRatings > 0 && (
                <span style={{ fontSize: "0.72rem", color: "var(--text-3)" }}>({mentor.totalRatings})</span>
              )}
            </div>
          </div>
        </div>

        {/* Bio */}
        {mentor.bio && (
          <p className="line-clamp-2" style={{ fontSize: "0.8rem", color: "var(--text-2)", lineHeight: 1.55, flex: 1 }}>
            {mentor.bio}
          </p>
        )}

        {/* Skills */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
          {mentor.skills.slice(0, 3).map(s => <SkillBadge key={s} skill={s} />)}
          {mentor.skills.length > 3 && (
            <span style={{ fontSize: "0.72rem", color: "var(--text-3)", padding: "0.18rem 0" }}>
              +{mentor.skills.length - 3}
            </span>
          )}
        </div>

        {/* Footer */}
        <div style={{ display: "flex", justifyContent: "space-between", paddingTop: "0.75rem", borderTop: "1px solid var(--border)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "0.72rem", color: "var(--text-3)" }}>
            <BookOpen size={11} />
            <span>{mentor.totalSessions} sessions</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "0.72rem", color: "var(--text-3)" }}>
            <Clock size={11} />
            <span>
              {mentor.responseTimeHours <= 4 ? "Replies in ~4h"
                : mentor.responseTimeHours <= 12 ? "Replies in ~12h"
                : "Replies next day"}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
