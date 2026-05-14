"use client";
import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import SkillBadge from "./SkillBadge";
import toast from "react-hot-toast";
import { Mentor } from "@/types";

import { createRequest } from "@/lib/db";

export default function RequestModal({ mentor, onClose }: { mentor: Mentor; onClose: () => void }) {
  const { user } = useAuthStore();
  const [topic, setTopic] = useState("");
  const [description, setDescription] = useState("");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const toggleSkill = (skill: string) =>
    setSelectedSkills(p => p.includes(skill) ? p.filter(s => s !== skill) : [...p, skill].slice(0, 3));

  const handleSubmit = async () => {
    if (!user) { toast.error("Sign in first"); return; }
    if (!topic.trim()) { toast.error("Add a topic"); return; }
    if (description.length < 30) { toast.error("Describe your issue (min 30 chars)"); return; }
    setSubmitting(true);
    try {
      await createRequest({
        juniorUid: user.uid,
        juniorName: user.name,
        juniorPhoto: user.photoURL,
        mentorUid: mentor.uid,
        title: topic.trim(),
        description: description.trim(),
        skills: selectedSkills,
        status: "pending",
      });
      toast.success("✅ Request sent successfully!");
      onClose();
    } catch (err) {
      console.error("Request failed:", err);
      toast.error("Failed to send. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "flex-end", justifyContent: "center", padding: "1rem", background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="card"
        style={{ width: "100%", maxWidth: 480, borderColor: "var(--border-hover)", marginBottom: 0 }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem" }}>
          <div>
            <p style={{ fontWeight: 600, fontSize: "1rem", color: "var(--text-1)" }}>Request help</p>
            <p style={{ fontSize: "0.8rem", color: "var(--text-2)", marginTop: 2 }}>from {mentor.name}</p>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm" style={{ padding: "0.3rem" }}>
            <X size={16} style={{ color: "var(--text-3)" }} />
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {/* Topic */}
          <div>
            <label style={{ fontSize: "0.8rem", fontWeight: 500, color: "var(--text-2)", display: "block", marginBottom: 5 }}>Topic *</label>
            <input className="input" placeholder="e.g. Help with Binary Trees, Resume Review" value={topic} onChange={e => setTopic(e.target.value)} maxLength={80} />
          </div>

          {/* Skills */}
          {mentor.skills.length > 0 && (
            <div>
              <label style={{ fontSize: "0.8rem", fontWeight: 500, color: "var(--text-2)", display: "block", marginBottom: 5 }}>
                Related skills <span style={{ color: "var(--text-3)" }}>(up to 3)</span>
              </label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                {mentor.skills.map(s => (
                  <SkillBadge key={s} skill={s} selected={selectedSkills.includes(s)} onClick={() => toggleSkill(s)} />
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          <div>
            <label style={{ fontSize: "0.8rem", fontWeight: 500, color: "var(--text-2)", display: "block", marginBottom: 5 }}>Describe your issue *</label>
            <textarea
              className="input" rows={4}
              placeholder="What have you tried? Where are you stuck? More detail = faster help."
              value={description} onChange={e => setDescription(e.target.value.slice(0, 500))}
            />
            <p style={{ fontSize: "0.72rem", color: "var(--text-3)", textAlign: "right", marginTop: 3 }}>{description.length}/500</p>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={onClose} className="btn btn-secondary" style={{ flex: 1 }}>Cancel</button>
            <button onClick={handleSubmit} disabled={submitting} className="btn btn-primary" style={{ flex: 1 }}>
              {submitting ? <Loader2 size={14} className="animate-spin" /> : null}
              {submitting ? "Sending…" : "Send request"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
