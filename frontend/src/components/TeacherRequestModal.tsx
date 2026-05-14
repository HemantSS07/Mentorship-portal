"use client";
import { useState } from "react";
import { X, GraduationCap, Loader2, Send } from "lucide-react";
import { TeacherMentor, AppUser, SUBJECT_EXPERTISE_OPTIONS } from "@/types";
import { createTeacherRequest } from "@/lib/db";
import toast from "react-hot-toast";

interface Props {
  teacher: TeacherMentor;
  user: AppUser;
  onClose: () => void;
}

export default function TeacherRequestModal({ teacher, user, onClose }: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Build a merged list: teacher's expertise first, then other options
  const subjectOptions = [
    ...teacher.subjectExpertise,
    ...SUBJECT_EXPERTISE_OPTIONS.filter(s => !teacher.subjectExpertise.includes(s)),
  ];

  const toggleSubject = (s: string) =>
    setSelectedSubjects(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s].slice(0, 5));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return toast.error("Please enter a title for your request.");
    if (!description.trim() || description.trim().length < 20) return toast.error("Please write a more detailed description (at least 20 characters).");
    if (selectedSubjects.length === 0) return toast.error("Please select at least one relevant subject.");

    setLoading(true);
    try {
      await createTeacherRequest({
        juniorUid: user.uid,
        juniorName: user.name,
        juniorPhoto: user.photoURL,
        mentorUid: teacher.uid,
        mentorType: "teacher",
        title: title.trim(),
        description: description.trim(),
        skills: selectedSubjects,
        status: "pending",
      });
      toast.success("Request sent to " + teacher.name + "! 🎓");
      onClose();
    } catch (err: any) {
      toast.error(err?.message || "Failed to send request. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 100,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "rgba(0,0,0,0.65)", backdropFilter: "blur(5px)",
        padding: "1rem",
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="card anim-1"
        style={{ width: "100%", maxWidth: 520, padding: "1.75rem", position: "relative", maxHeight: "90vh", overflowY: "auto" }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          style={{ position: "absolute", top: "1rem", right: "1rem", background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", padding: 4, display: "flex", alignItems: "center" }}
          aria-label="Close"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div style={{ marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 11, flexShrink: 0,
              background: "rgba(245,158,11,0.12)", border: "1.5px solid rgba(245,158,11,0.3)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "1rem", fontWeight: 700, color: "#f59e0b",
            }}>
              {teacher.name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase()}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--text-1)" }}>{teacher.name}</div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-2)" }}>{teacher.designation} · {teacher.department}</div>
            </div>
            {teacher.isVerified && (
              <span style={{
                marginLeft: "auto", background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.3)",
                borderRadius: 99, padding: "0.15rem 0.6rem", fontSize: "0.62rem", fontWeight: 700, color: "#f59e0b",
              }}>✓ VERIFIED FACULTY</span>
            )}
          </div>
          <h2 style={{ fontSize: "1.15rem", fontWeight: 700, margin: 0 }}>Request Mentorship</h2>
          <p style={{ fontSize: "0.8rem", color: "var(--text-2)", marginTop: 4 }}>
            Describe what you need help with. Be specific to get the best guidance.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {/* Title */}
          <div>
            <label style={labelStyle}>Request Title <span style={{ color: "#ef4444" }}>*</span></label>
            <input
              id="teacher-req-title"
              type="text"
              className="input"
              placeholder="e.g. Help with research methodology for my project"
              value={title}
              onChange={e => setTitle(e.target.value)}
              maxLength={120}
            />
          </div>

          {/* Description */}
          <div>
            <label style={labelStyle}>Description <span style={{ color: "#ef4444" }}>*</span></label>
            <textarea
              id="teacher-req-description"
              className="input"
              rows={4}
              placeholder="Describe your specific challenge or goal. Include any relevant context, what you've tried, and what outcome you're looking for…"
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
            <p style={{ fontSize: "0.7rem", color: description.length < 20 && description.length > 0 ? "#ef4444" : "var(--text-3)", marginTop: 4 }}>
              {description.length} chars (min 20)
            </p>
          </div>

          {/* Relevant subjects */}
          <div>
            <label style={labelStyle}>Relevant Subjects <span style={{ color: "var(--text-3)" }}>(up to 5)</span> <span style={{ color: "#ef4444" }}>*</span></label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5, border: "1px solid var(--border)", padding: "0.5rem", borderRadius: 8, maxHeight: 110, overflowY: "auto" }}>
              {subjectOptions.slice(0, 20).map(s => {
                const sel = selectedSubjects.includes(s);
                const isTeacherExpertise = teacher.subjectExpertise.includes(s);
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => toggleSubject(s)}
                    disabled={!sel && selectedSubjects.length >= 5}
                    style={{
                      padding: "0.22rem 0.6rem", borderRadius: 99, fontSize: "0.7rem", fontWeight: 500,
                      cursor: "pointer", border: "none", fontFamily: "inherit", transition: "all 0.15s",
                      background: sel ? "rgba(245,158,11,0.2)" : isTeacherExpertise ? "rgba(245,158,11,0.06)" : "var(--bg-elevated)",
                      color: sel ? "#f59e0b" : isTeacherExpertise ? "#d97706" : "var(--text-2)",
                      outline: sel ? "1px solid rgba(245,158,11,0.4)" : isTeacherExpertise ? "1px solid rgba(245,158,11,0.2)" : "1px solid var(--border)",
                      opacity: !sel && selectedSubjects.length >= 5 ? 0.4 : 1,
                    }}
                  >
                    {sel && "✓ "}{s}
                  </button>
                );
              })}
            </div>
            <p style={{ fontSize: "0.7rem", color: "var(--text-3)", marginTop: 4 }}>
              Gold subjects = {teacher.name.split(" ")[0]}&apos;s areas of expertise
            </p>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            <button type="button" onClick={onClose} className="btn btn-ghost" style={{ flex: 1 }}>
              Cancel
            </button>
            <button
              id="teacher-req-submit"
              type="submit"
              disabled={loading}
              className="btn"
              style={{ flex: 2, background: "rgba(245,158,11,0.15)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.3)", fontWeight: 600 }}
            >
              {loading ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
              Send Request
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = { display: "block", fontSize: "0.8rem", fontWeight: 500, color: "var(--text-2)", marginBottom: 5 };
