"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle, XCircle, Clock, BookOpen, Star, Loader2,
  ToggleLeft, ToggleRight, Edit3, Video, TrendingUp,
  DollarSign, Calendar, MessageSquare, Award, ExternalLink,
  Bell, ChevronRight, Zap, Users, BarChart2, Target,
  Phone, Link2, Code2, Plus, Trash2, Check, X,
  ArrowUpRight, Activity, Shield, Sparkles, RefreshCw
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { subscribeRequestsForMentor, updateRequestStatus, getMentor, updateMentor, updateSessionStatus, subscribeSessionsForUser, subscribeMentor, subscribeReviewsForMentor, subscribeRescheduleRequestsForUser } from "@/lib/db";
import { HelpRequest, Mentor, AVAILABILITY_OPTIONS, Session, AppUser, Review, RescheduleRequest } from "@/types";
import { formatDistanceToNow, format } from "date-fns";
import SkillBadge from "@/components/SkillBadge";
import StarRating from "@/components/StarRating";
import SessionSchedulerModal from "@/components/SessionSchedulerModal";
import LeaderboardWidget from "@/components/LeaderboardWidget";
import toast from "react-hot-toast";
import RouteGuard from "@/components/RouteGuard";

// ── Demo Data ──────────────────────────────────────────────────────────────
const DEMO_REQUESTS: HelpRequest[] = [
  {
    id: "r1", juniorUid: "j1", juniorName: "Riya Patel", mentorUid: "me",
    title: "DP on Trees", description: "I understand basic DP but struggle applying it to tree structures. Need a structured approach with practice problems.",
    skills: ["DSA", "C++"], status: "pending",
    createdAt: new Date(Date.now() - 1 * 3600000), updatedAt: new Date(),
  },
  {
    id: "r2", juniorUid: "j2", juniorName: "Karan Singh", mentorUid: "me",
    title: "Lazy Propagation in Segment Trees", description: "Need to understand lazy propagation from first principles before my competitive programming contest next week.",
    skills: ["DSA", "Competitive Programming"], status: "pending",
    createdAt: new Date(Date.now() - 3 * 3600000), updatedAt: new Date(),
  },
  {
    id: "r3", juniorUid: "j3", juniorName: "Meera Iyer", mentorUid: "me",
    title: "Interview Strategy – 2 months out", description: "My campus placements are in 2 months. Where should I focus my time? Need a roadmap.",
    skills: ["Interview Prep"], status: "accepted",
    createdAt: new Date(Date.now() - 24 * 3600000), updatedAt: new Date(Date.now() - 20 * 3600000),
  },
  {
    id: "r4", juniorUid: "j4", juniorName: "Rohan Das", mentorUid: "me",
    title: "Bit Manipulation Tricks", description: "I keep forgetting common tricks. Want a structured revision session with cheat-sheet notes.",
    skills: ["DSA", "C++"], status: "completed",
    createdAt: new Date(Date.now() - 5 * 86400000), updatedAt: new Date(Date.now() - 4 * 86400000),
  },
  {
    id: "r5", juniorUid: "j5", juniorName: "Priya Sharma", mentorUid: "me",
    title: "System Design Fundamentals", description: "I have an internship interview at a product company next month. Need to understand HLD basics.",
    skills: ["System Design"], status: "completed",
    createdAt: new Date(Date.now() - 8 * 86400000), updatedAt: new Date(Date.now() - 7 * 86400000),
  },
];

const DEMO_FEEDBACK: Record<string, { rating: number; comment: string }> = {
  r4: { rating: 5, comment: "Incredibly clear explanations. That cheat-sheet was gold!" },
  r5: { rating: 4, comment: "Great overview of CAP theorem and load balancing. Very helpful!" },
};

// ── Types ────────────────────────────────────────────────────────────────
type SectionId = "requests" | "active" | "completed" | "insights" | "schedule" | "earnings" | "leaderboard";

// ── Section Nav Config ───────────────────────────────────────────────────
const NAV_SECTIONS: { id: SectionId; label: string; icon: React.ReactNode }[] = [
  { id: "requests",    label: "Requests",       icon: <Bell size={15} /> },
  { id: "active",      label: "Active Sessions", icon: <Zap size={15} /> },
  { id: "completed",   label: "Completed",       icon: <CheckCircle size={15} /> },
  { id: "insights",   label: "Insights",        icon: <BarChart2 size={15} /> },
  { id: "schedule",   label: "Schedule",        icon: <Calendar size={15} /> },
  { id: "earnings",   label: "Earnings",        icon: <DollarSign size={15} /> },
  { id: "leaderboard", label: "Leaderboard",    icon: <TrendingUp size={15} /> },
];

// ── Helpers ──────────────────────────────────────────────────────────────
function Avatar({ name, photo, size = 44 }: { name: string; photo?: string; size?: number }) {
  const colors = ["#7c3aed","#2563eb","#059669","#d97706","#dc2626","#7c3aed"];
  const color = colors[name.charCodeAt(0) % colors.length];
  return (
    <div style={{
      width: size, height: size, borderRadius: size * 0.28, flexShrink: 0,
      background: photo ? "transparent" : `${color}22`, border: `1.5px solid ${color}44`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.42, fontWeight: 700, color,
    }}>
      {photo ? <img src={photo} alt={name} style={{ width: "100%", height: "100%", borderRadius: size * 0.25, objectFit: "cover" }} /> : name[0]}
    </div>
  );
}

function StatCard({ label, value, sub, color = "var(--text-1)", bg }: {
  label: string; value: string; sub?: string; color?: string; bg?: string;
}) {
  return (
    <div style={{
      background: bg ?? "var(--bg-elevated)", padding: "1rem", borderRadius: 12,
      border: "1px solid var(--border)", flex: 1,
    }}>
      <p style={{ fontSize: "0.72rem", color: "var(--text-2)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</p>
      <p style={{ fontSize: "1.5rem", fontWeight: 800, color, lineHeight: 1, marginBottom: sub ? 4 : 0 }}>{value}</p>
      {sub && <p style={{ fontSize: "0.72rem", color: "var(--text-3)", marginTop: 2 }}>{sub}</p>}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────
export default function MentorDashboard() {
  const { user, loading: authLoading } = useAuthStore();
  const router = useRouter();
  const [requests, setRequests] = useState<HelpRequest[]>(DEMO_REQUESTS);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [profile, setProfile] = useState<Mentor | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<SectionId>("requests");
  const [updating, setUpdating] = useState<string | null>(null);
  // Session scheduler state
  const [schedulerTarget, setSchedulerTarget] = useState<{ req: HelpRequest, resch?: RescheduleRequest } | null>(null);
  const [rescheduleRequests, setRescheduleRequests] = useState<RescheduleRequest[]>([]);
  const [viewProfileModal, setViewProfileModal] = useState<AppUser | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editBio, setEditBio] = useState("");
  const [editSkills, setEditSkills] = useState("");
  const [editContact, setEditContact] = useState("");
  const [newSlot, setNewSlot] = useState("");
  const [reviews, setReviews] = useState<Review[]>([]);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push("/register"); return; }
    if (user.role === "teacher_mentor") { router.replace("/teacher-dashboard"); return; }

    const load = async () => {
      try {
        const prof = await getMentor(user.uid);
        const resolvedProfile: Mentor = prof ?? {
          uid: user.uid, name: user.name, email: user.email, photoURL: user.photoURL,
          branch: user.branch, year: user.year,
          skills: ["DSA", "React", "System Design", "C++"],
          bio: "I love helping juniors with algorithmic challenges and web development problems. 4th year CS @ IIT.",
          availability: ["Weekday Evenings", "Weekend Mornings"],
          rating: 0, totalRatings: 0, totalSessions: 0,
          responseTimeHours: 1.5, isActive: true, createdAt: new Date(),
        };
        setEditBio(resolvedProfile.bio);
        setEditSkills(resolvedProfile.skills.join(", "));
        setEditContact(resolvedProfile.contactValue ?? "");
      } catch {
        /* profile will be set by subscribeMentor below */
      } finally { setLoading(false); }
    };
    load();

    // Real-time subscriptions — cleaned up on unmount
    const unsubProfile = subscribeMentor(user.uid, (prof) => {
      if (prof) {
        setProfile(prof);
        setLoading(false);
      }
    });
    const unsubReviews = subscribeReviewsForMentor(user.uid, (revs) => {
      setReviews(revs);
    });
    const unsubReq = subscribeRequestsForMentor(user.uid, (reqs) => {
      if (reqs.length > 0) setRequests(reqs);
    });
    const unsubSess = subscribeSessionsForUser(user.uid, "mentor", (sess) => {
      setSessions(sess);
    });

    const unsubReschedules = subscribeRescheduleRequestsForUser(user.uid, "mentor", (reqs) => {
      setRescheduleRequests(reqs);
    });

    return () => { unsubProfile(); unsubReviews(); unsubReq(); unsubSess(); unsubReschedules(); };
  }, [user, authLoading, router]);

  // Open the session scheduler modal for a pending request
  const handleAcceptRequest = (req: HelpRequest) => {
    setSchedulerTarget({ req });
  };

  const handleDeclineRequest = async (id: string) => {
    setUpdating(id);
    try {
      await updateRequestStatus(id, "declined");
      setRequests(p => p.map(r => r.id === id ? { ...r, status: "declined" } : r));
      toast("Request declined", { icon: "🚫" });
    } catch { toast.error("Update failed. Please try again."); }
    finally { setUpdating(null); }
  };

  const handleCompleteSession = async (sessionId: string, requestId: string) => {
    setUpdating(sessionId);
    try {
      await updateSessionStatus(sessionId, "completed");
      await updateRequestStatus(requestId, "completed");
      toast.success("🎉 Session marked as completed!");
      setActiveSection("completed");
    } catch { toast.error("Update failed. Please try again."); }
    finally { setUpdating(null); }
  };

  const toggleActive = async () => {
    if (!profile || !user) return;
    try {
      await updateMentor(user.uid, { isActive: !profile.isActive });
      setProfile(p => p ? { ...p, isActive: !p.isActive } : p);
      toast.success(profile.isActive ? "🔴 You are now Offline" : "🟢 You are now Available!");
    } catch { toast.error("Update failed"); }
  };

  // Kept for backward compat — no longer used in main flow

  const saveProfile = async () => {
    if (!user || !profile) return;
    const skills = editSkills.split(",").map(s => s.trim()).filter(Boolean);
    try {
      await updateMentor(user.uid, { bio: editBio, skills, contactValue: editContact });
      setProfile(p => p ? { ...p, bio: editBio, skills, contactValue: editContact } : p);
      toast.success("Profile updated!");
      setEditModalOpen(false);
    } catch { toast.error("Save failed"); }
  };

  const addSlot = () => {
    if (!newSlot || !profile) return;
    if (profile.availability.includes(newSlot)) { toast.error("Slot already added"); return; }
    const updated = [...profile.availability, newSlot];
    setProfile(p => p ? { ...p, availability: updated } : p);
    updateMentor(user!.uid, { availability: updated }).catch(() => {});
    setNewSlot("");
    toast.success("Time slot added!");
  };

  const removeSlot = (slot: string) => {
    if (!profile) return;
    const updated = profile.availability.filter(s => s !== slot);
    setProfile(p => p ? { ...p, availability: updated } : p);
    updateMentor(user!.uid, { availability: updated }).catch(() => {});
  };

  if (authLoading || loading || !user || !profile) {
    return (
      <div className="page-wrap" style={{ padding: "5rem 1.5rem", display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
        <Loader2 size={36} className="animate-spin text-accent" />
        <p style={{ color: "var(--text-3)", fontSize: "0.875rem" }}>Loading your dashboard…</p>
      </div>
    );
  }

  const pending = requests.filter(r => r.status === "pending");
  const active = requests.filter(r => r.status === "accepted");
  const completed = requests.filter(r => r.status === "completed");
  const declined = requests.filter(r => r.status === "declined");
  const totalReceived = requests.length;
  const acceptanceRate = totalReceived > 0 ? Math.round(((active.length + completed.length) / totalReceived) * 100) : 0;

  // ── Earnings (mocked) ──
  const EARNINGS_HISTORY = [
    { date: "Apr 10", student: "Rohan Das", topic: "Bit Manipulation", amount: 250 },
    { date: "Apr 8", student: "Priya Sharma", topic: "System Design", amount: 300 },
    { date: "Apr 3", student: "Arjun Mehta", topic: "Graph Algorithms", amount: 200 },
    { date: "Mar 28", student: "Sneha Rao", topic: "React & Hooks", amount: 250 },
  ];
  const totalEarnings = EARNINGS_HISTORY.reduce((s, e) => s + e.amount, 0);

  return (
    <RouteGuard allowedRoles={["mentor"]}>
      <div className="page-wrap dash-page mentor-dash-root">

        {/* ══════════════════════════════════════════════════════════════
          PROFILE OVERVIEW BANNER
      ══════════════════════════════════════════════════════════════ */}
      <div className="card glass anim-1 profile-banner" style={{ position: "relative", overflow: "hidden", marginBottom: "1.5rem" }}>
        <div className="hero-bg" />
        <div className="dot-grid" style={{ position: "absolute", inset: 0, opacity: 0.4 }} />

        {/* Top Row */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "1.5rem", alignItems: "flex-start", position: "relative", zIndex: 1 }}>

          {/* Avatar + Info */}
          <div style={{ display: "flex", gap: "1.25rem", alignItems: "center", flex: "1 1 320px" }}>
            <div style={{ position: "relative" }}>
              <Avatar name={user.name} photo={user.photoURL} size={80} />
              <div style={{
                position: "absolute", bottom: -2, right: -4, width: 18, height: 18,
                borderRadius: "50%", background: profile.isActive ? "#22c55e" : "#52525b",
                border: "3px solid var(--bg-card)", transition: "background 0.3s"
              }} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap", marginBottom: 4 }}>
                <h1 style={{ fontSize: "1.5rem", fontWeight: 800, letterSpacing: "-0.02em", margin: 0 }}>
                  {user.name}
                </h1>
                <span className="badge badge-active" style={{ fontSize: "0.7rem" }}>Mentor</span>
                {profile.isActive && (
                  <span style={{ fontSize: "0.7rem", color: "#22c55e", display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: "#22c55e", animation: "pulse-dot 1.8s infinite" }} />
                    Live
                  </span>
                )}
              </div>
              <p style={{ fontSize: "0.85rem", color: "var(--text-2)", margin: "0 0 0.6rem", display: "flex", alignItems: "center", gap: 6 }}>
                <BookOpen size={13} /> {profile.branch || user.branch} &nbsp;·&nbsp; {profile.year || user.year}
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                {profile.skills.map(s => <SkillBadge key={s} skill={s} />)}
              </div>
              {profile.bio && (
                <p style={{ fontSize: "0.82rem", color: "var(--text-2)", marginTop: 8, maxWidth: 480, lineHeight: 1.5, fontStyle: "italic" }}>
                  &quot;{profile.bio}&quot;
                </p>
              )}
            </div>
          </div>

          {/* Stats Row */}
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", flex: "1 1 260px", alignItems: "center" }}>
            <div style={{ textAlign: "center", padding: "0.6rem 1rem", background: "rgba(124,58,237,0.08)", borderRadius: 12, border: "1px solid var(--accent-border)" }}>
              <p style={{ fontSize: "1.6rem", fontWeight: 800, color: "#a78bfa", lineHeight: 1 }}>{profile.totalSessions}</p>
              <p style={{ fontSize: "0.68rem", color: "var(--text-2)", marginTop: 2 }}>Sessions</p>
            </div>
            <div style={{ textAlign: "center", padding: "0.6rem 1rem", background: "rgba(245,158,11,0.08)", borderRadius: 12, border: "1px solid rgba(245,158,11,0.2)" }}>
              <p style={{ fontSize: "1.6rem", fontWeight: 800, color: "#f59e0b", lineHeight: 1 }}>{profile.rating.toFixed(1)}</p>
              <p style={{ fontSize: "0.68rem", color: "var(--text-2)", marginTop: 2 }}>Rating</p>
            </div>
            <div style={{ textAlign: "center", padding: "0.6rem 1rem", background: "rgba(16,185,129,0.08)", borderRadius: 12, border: "1px solid rgba(16,185,129,0.2)" }}>
              <p style={{ fontSize: "1.6rem", fontWeight: 800, color: "#10b981", lineHeight: 1 }}>{acceptanceRate}%</p>
              <p style={{ fontSize: "0.68rem", color: "var(--text-2)", marginTop: 2 }}>Accept Rate</p>
            </div>
          </div>

          {/* Right Controls */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem", minWidth: 190, alignSelf: "center" }}>
            <button
              onClick={toggleActive}
              id="availability-toggle"
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8,
                padding: "0.65rem 1rem", borderRadius: 10, cursor: "pointer",
                background: profile.isActive ? "rgba(34,197,94,0.1)" : "rgba(255,255,255,0.04)",
                border: `1px solid ${profile.isActive ? "rgba(34,197,94,0.3)" : "var(--border)"}`,
                color: profile.isActive ? "#22c55e" : "var(--text-2)",
                fontWeight: 600, fontSize: "0.875rem", transition: "all 0.25s",
              }}
            >
              <span>{profile.isActive ? "Available" : "Not Available"}</span>
              {profile.isActive ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => setEditModalOpen(true)}
              id="edit-profile-btn"
              style={{ justifyContent: "center" }}
            >
              <Edit3 size={14} /> Edit Profile
            </button>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          SECTION NAV BAR
      ══════════════════════════════════════════════════════════════ */}
      <div className="section-nav anim-2" style={{ marginBottom: "1.75rem" }}>
        {NAV_SECTIONS.map(sec => {
          const badge = sec.id === "requests" ? pending.length : sec.id === "active" ? active.length : 0;
          return (
            <button
              key={sec.id}
              onClick={() => setActiveSection(sec.id)}
              className={`section-nav-btn ${activeSection === sec.id ? "section-nav-active" : ""}`}
            >
              {sec.icon}
              {sec.label}
              {badge > 0 && (
                <span style={{
                  background: sec.id === "requests" ? "#ef4444" : "var(--accent)",
                  color: "#fff", fontSize: "0.62rem", padding: "0 5px", borderRadius: 99,
                  fontWeight: 700, lineHeight: "16px", minWidth: 16, textAlign: "center"
                }}>{badge}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* ══════════════════════════════════════════════════════════════
          SECTION: INCOMING REQUESTS
      ══════════════════════════════════════════════════════════════ */}
      {activeSection === "requests" && (
        <div className="anim-2">
          <SectionHeader
            title="Incoming Help Requests"
            subtitle={pending.length > 0 ? `${pending.length} new request${pending.length > 1 ? "s" : ""} waiting for your response` : "You're all caught up!"}
            icon={<Bell size={20} />}
          />
          {pending.length === 0 ? (
            <EmptyState
              icon={<Bell size={32} />}
              title="No pending requests"
              desc="You have no incoming requests right now. Keep your profile active to attract more juniors!"
            />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {pending.map(req => (
                <RequestCard
                  key={req.id} req={req} type="pending"
                  updating={updating}
                  onAccept={() => handleAcceptRequest(req)}
                  onDecline={() => handleDeclineRequest(req.id)}
                  onViewProfile={req.juniorProfile ? () => setViewProfileModal(req.juniorProfile!) : undefined}
                />
              ))}
            </div>
          )}

          {/* Declined requests sub-section */}
          {declined.length > 0 && (
            <div style={{ marginTop: "2rem" }}>
              <p style={{ fontSize: "0.8rem", color: "var(--text-3)", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                <XCircle size={13} /> {declined.length} declined request{declined.length > 1 ? "s" : ""}
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {declined.map(req => (
                  <div key={req.id} className="card" style={{ opacity: 0.55, padding: "0.75rem 1rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <p style={{ fontSize: "0.8rem", color: "var(--text-2)" }}>{req.juniorName} · <strong>{req.title}</strong></p>
                      </div>
                      <span className="status status-declined">Declined</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          SECTION: ACTIVE / UPCOMING SESSIONS (from DB)
      ══════════════════════════════════════════════════════════════ */}
      {activeSection === "active" && (
        <div className="anim-2">
          {/* Accepted requests that have NO session yet — show Create Session CTA */}
          {active.filter(req => !sessions.some(s => s.requestId === req.id)).length > 0 && (
            <>
              <SectionHeader
                title="Accepted — Awaiting Session"
                subtitle="Schedule a session for these accepted requests"
                icon={<Calendar size={20} />}
                badge={{ text: "Action Required", color: "#f59e0b" }}
              />
              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: "2rem" }}>
                {active
                  .filter(req => !sessions.some(s => s.requestId === req.id))
                  .map(req => (
                    <div key={req.id} className="card" style={{
                      display: "flex", gap: "1rem", alignItems: "center",
                      borderColor: "rgba(245,158,11,0.25)",
                      background: "linear-gradient(145deg, var(--bg-card), rgba(245,158,11,0.03))",
                    }}>
                      <Avatar name={req.juniorName} size={44} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: "0.78rem", color: "var(--text-2)", marginBottom: 2 }}>
                          Accepted from <strong style={{ color: "var(--text-1)" }}>{req.juniorName}</strong>
                        </p>
                        <p style={{ fontWeight: 600, fontSize: "0.95rem", color: "var(--text-1)" }}>{req.title}</p>
                      </div>
                      <button
                        className="btn btn-primary"
                        id={`create-session-${req.id}`}
                        onClick={() => setSchedulerTarget(req)}
                        style={{ flexShrink: 0 }}
                      >
                        <Video size={14} /> Create Session
                      </button>
                    </div>
                  ))
                }
              </div>
            </>
          )}

          {/* Upcoming sessions from sessions table */}
          <SectionHeader
            title="Upcoming Sessions"
            subtitle={sessions.filter(s => s.status === "upcoming").length > 0
              ? `${sessions.filter(s => s.status === "upcoming").length} session${sessions.filter(s => s.status === "upcoming").length > 1 ? "s" : ""} scheduled`
              : "No upcoming sessions scheduled"}
            icon={<Zap size={20} />}
            badge={sessions.filter(s => s.status === "upcoming").length > 0 ? { text: "Live", color: "#22c55e" } : undefined}
          />
          {sessions.filter(s => s.status === "upcoming").length === 0 ? (
            <EmptyState
              icon={<Video size={32} />}
              title="No upcoming sessions"
              desc="Accept a pending request and schedule a session to see it here in real-time."
              action={{ label: "View Requests", onClick: () => setActiveSection("requests") }}
            />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {sessions
                .filter(s => s.status === "upcoming")
                .sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime())
                .map(session => {
                  const relatedReq = requests.find(r => r.id === session.requestId);
                  const hasPendingReschedule = rescheduleRequests.some(r => r.sessionId === session.id && r.status === "pending");
                  return (
                    <ScheduledSessionCard
                      key={session.id}
                      session={session}
                      juniorName={relatedReq?.juniorName ?? session.juniorUid}
                      requestTitle={relatedReq?.title ?? ""}
                      updating={updating}
                      onComplete={() => handleCompleteSession(session.id, session.requestId)}
                      hasPendingReschedule={hasPendingReschedule}
                      onReviewReschedule={() => {
                        const resch = rescheduleRequests.find(r => r.sessionId === session.id && r.status === "pending");
                        if (resch) {
                           setSchedulerTarget({ req: relatedReq || { id: session.requestId, juniorName: session.juniorUid, title: "Rescheduled Session", juniorUid: session.juniorUid } as HelpRequest, resch });
                        }
                      }}
                    />
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          SECTION: COMPLETED SESSIONS
      ══════════════════════════════════════════════════════════════ */}
      {activeSection === "completed" && (
        <div className="anim-2">
          <SectionHeader
            title="Completed Sessions"
            subtitle={`${completed.length} session${completed.length !== 1 ? "s" : ""} completed · Avg rating: ${profile.rating.toFixed(1)}`}
            icon={<Award size={20} />}
          />
          {completed.length === 0 ? (
            <EmptyState
              icon={<CheckCircle size={32} />}
              title="No completed sessions yet"
              desc="Sessions you finish will appear here with ratings and feedback from students."
            />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {completed.map(req => {
                const fb = DEMO_FEEDBACK[req.id];
                return (
                  <div key={req.id} className="card completed-card">
                    <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
                      <Avatar name={req.juniorName} size={44} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginBottom: 4 }}>
                          <div>
                            <p style={{ fontSize: "0.8rem", color: "var(--text-2)", marginBottom: 2 }}>
                              Session with <strong style={{ color: "var(--text-1)" }}>{req.juniorName}</strong>
                            </p>
                            <h3 style={{ fontWeight: 600, fontSize: "1rem" }}>{req.title}</h3>
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                            <span className="status status-completed">Completed</span>
                            <span style={{ fontSize: "0.75rem", color: "var(--text-3)" }}>
                              {formatDistanceToNow(new Date(req.updatedAt), { addSuffix: true })}
                            </span>
                          </div>
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 5, margin: "6px 0 10px" }}>
                          {req.skills.map(s => <SkillBadge key={s} skill={s} />)}
                        </div>
                        {fb ? (
                          <div style={{
                            background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.15)",
                            borderRadius: 10, padding: "0.75rem 1rem",
                            display: "flex", gap: "1rem", alignItems: "center"
                          }}>
                            <div style={{ flexShrink: 0 }}>
                              <StarRating rating={fb.rating} size={14} />
                            </div>
                            <p style={{ fontSize: "0.85rem", color: "var(--text-2)", fontStyle: "italic" }}>
                              &quot;{fb.comment}&quot;
                            </p>
                          </div>
                        ) : (
                          <p style={{ fontSize: "0.8rem", color: "var(--text-3)", fontStyle: "italic" }}>
                            No feedback received yet.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          SECTION: PERFORMANCE INSIGHTS
      ══════════════════════════════════════════════════════════════ */}
      {activeSection === "insights" && (
        <div className="anim-2">
          <SectionHeader
            title="Performance Insights"
            subtitle="Track your impact and understand how you're performing as a mentor"
            icon={<BarChart2 size={20} />}
          />

          {/* Primary KPI Row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12, marginBottom: "1.5rem" }}>
            <StatCard label="Total Requests" value={String(totalReceived)} sub="All time" />
            <StatCard label="Acceptance Rate" value={`${acceptanceRate}%`} color="#10b981" bg="rgba(16,185,129,0.05)" sub="of all requests" />
            <StatCard label="Avg. Rating" value={profile.rating.toFixed(1)} color="#f59e0b" bg="rgba(245,158,11,0.05)" sub={`from ${profile.totalRatings} reviews`} />
            <StatCard label="Avg. Response" value={`${profile.responseTimeHours}h`} color="#a78bfa" bg="rgba(124,58,237,0.05)" sub="typical reply time" />
            <StatCard label="Sessions Done" value={String(profile.totalSessions + completed.length)} color="var(--text-1)" sub="total completed" />
          </div>

          {/* Level Progress */}
          <div className="card" style={{ marginBottom: "1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ padding: "0.5rem", background: "var(--accent-dim)", borderRadius: 10 }}>
                  <Shield size={18} style={{ color: "#a78bfa" }} />
                </div>
                <div>
                  <h3 style={{ fontWeight: 700, fontSize: "1rem" }}>Mentor Level</h3>
                  <p style={{ fontSize: "0.78rem", color: "var(--text-3)" }}>Based on sessions and rating</p>
                </div>
              </div>
              <span style={{
                fontWeight: 700, color: "#a78bfa", fontSize: "0.875rem",
                background: "var(--accent-dim)", padding: "0.25rem 0.75rem",
                borderRadius: 8, border: "1px solid var(--accent-border)"
              }}>⭐ Top Mentor</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 16 }}>
              {["Rising Star", "Top Mentor", "Elite Mentor"].map((level, i) => (
                <div key={level} style={{
                  padding: "0.5rem", borderRadius: 8, textAlign: "center",
                  background: i === 1 ? "var(--accent-dim)" : "var(--bg-elevated)",
                  border: `1px solid ${i === 1 ? "var(--accent-border)" : "var(--border)"}`,
                  opacity: i > 1 ? 0.5 : 1
                }}>
                  <p style={{ fontSize: "0.7rem", fontWeight: 600, color: i === 1 ? "#a78bfa" : "var(--text-2)" }}>{level}</p>
                </div>
              ))}
            </div>
            <div style={{ width: "100%", background: "var(--bg-elevated)", height: 8, borderRadius: 4, overflow: "hidden" }}>
              <div style={{
                width: "72%", height: "100%",
                background: "linear-gradient(90deg, #7c3aed, #a78bfa)",
                borderRadius: 4, transition: "width 1s ease"
              }} />
            </div>
            <p style={{ fontSize: "0.72rem", color: "var(--text-3)", marginTop: 6, textAlign: "right" }}>
              4 more sessions to reach Elite Mentor
            </p>
          </div>

          {/* Activity Heatmap (simplified) */}
          <div className="card" style={{ marginBottom: "1.5rem" }}>
            <h3 style={{ fontSize: "0.95rem", fontWeight: 600, display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <Activity size={16} className="text-accent" /> Weekly Activity
            </h3>
            <div style={{ display: "flex", gap: 6, alignItems: "flex-end" }}>
              {[
                { day: "Mon", sessions: 1 }, { day: "Tue", sessions: 2 },
                { day: "Wed", sessions: 0 }, { day: "Thu", sessions: 3 },
                { day: "Fri", sessions: 2 }, { day: "Sat", sessions: 1 },
                { day: "Sun", sessions: 0 }
              ].map(d => (
                <div key={d.day} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <div style={{
                    width: "100%", borderRadius: 4,
                    height: `${Math.max(d.sessions * 18, 4)}px`,
                    background: d.sessions > 0
                      ? `rgba(124,58,237,${0.2 + d.sessions * 0.25})`
                      : "var(--bg-elevated)",
                    border: d.sessions > 0 ? "1px solid var(--accent-border)" : "1px solid var(--border)",
                    transition: "height 0.5s ease"
                  }} />
                  <span style={{ fontSize: "0.62rem", color: "var(--text-3)" }}>{d.day}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Reviews — real-time from Supabase */}
          <div className="card">
            <h3 style={{ fontSize: "0.95rem", fontWeight: 600, display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <Star size={16} className="star-fill" /> Recent Feedback
              {/* live pulse */}
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5, marginLeft: "auto",
                fontSize: "0.68rem", color: "#22c55e", fontWeight: 500 }}>
                <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%",
                  background: "#22c55e", animation: "pulse-dot 1.8s infinite" }} />
                Live
              </span>
            </h3>
            {reviews.length === 0 ? (
              <p style={{ fontSize: "0.85rem", color: "var(--text-3)", fontStyle: "italic", textAlign: "center", padding: "1.5rem 0" }}>
                No reviews yet — they&apos;ll appear here instantly when submitted.
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {reviews.slice(0, 5).map((rev) => (
                  <div key={rev.id} style={{
                    display: "flex", gap: "0.75rem", padding: "0.75rem",
                    background: "var(--bg-elevated)", borderRadius: 10,
                    border: "1px solid var(--border)"
                  }}>
                    <Avatar name={rev.fromUserName} size={36} />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                        <span style={{ fontWeight: 600, fontSize: "0.875rem" }}>{rev.fromUserName}</span>
                        <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                          {Array.from({ length: 5 }).map((_, i) => (
                            <span key={i} style={{ fontSize: "0.75rem",
                              color: i < rev.rating ? "#f59e0b" : "var(--text-3)" }}>★</span>
                          ))}
                          <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#f59e0b", marginLeft: 3 }}>
                            {rev.rating}/5
                          </span>
                        </div>
                      </div>
                      <p style={{ fontSize: "0.82rem", color: "var(--text-2)", fontStyle: "italic" }}>&quot;{rev.comment}&quot;</p>
                      <p style={{ fontSize: "0.7rem", color: "var(--text-3)", marginTop: 4 }}>
                        {rev.createdAt.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          SECTION: SCHEDULE & AVAILABILITY
      ══════════════════════════════════════════════════════════════ */}
      {activeSection === "schedule" && (
        <div className="anim-2">
          <SectionHeader
            title="Schedule & Availability"
            subtitle="Set your available time slots so juniors know when to reach you"
            icon={<Calendar size={20} />}
          />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }} className="schedule-grid">
            {/* Current Slots */}
            <div className="card">
              <h3 style={{ fontSize: "0.95rem", fontWeight: 600, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
                <Clock size={16} className="text-accent" /> Your Available Slots
              </h3>
              {profile.availability.length === 0 ? (
                <p style={{ fontSize: "0.85rem", color: "var(--text-3)", fontStyle: "italic" }}>No slots added yet. Add some below.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {profile.availability.map(slot => (
                    <div key={slot} style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "0.6rem 0.9rem", background: "var(--bg-elevated)",
                      borderRadius: 9, border: "1px solid var(--border)"
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#22c55e" }} />
                        <span style={{ fontSize: "0.875rem", color: "var(--text-1)" }}>{slot}</span>
                      </div>
                      <button
                        onClick={() => removeSlot(slot)}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", padding: 4 }}
                        title="Remove slot"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Slot */}
              <div style={{ marginTop: 14, display: "flex", gap: 8 }}>
                <select
                  className="input"
                  value={newSlot}
                  onChange={e => setNewSlot(e.target.value)}
                  style={{ flex: 1, appearance: "none", cursor: "pointer" }}
                >
                  <option value="">Add a time slot…</option>
                  {AVAILABILITY_OPTIONS.filter(o => !profile.availability.includes(o)).map(o => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
                <button onClick={addSlot} className="btn btn-primary" disabled={!newSlot} style={{ padding: "0 1rem" }}>
                  <Plus size={16} />
                </button>
              </div>
            </div>

            {/* Weekly Calendar View */}
            <div className="card">
              <h3 style={{ fontSize: "0.95rem", fontWeight: 600, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
                <Calendar size={16} className="text-accent" /> This Week
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
                {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => {
                  const today = new Date().getDay(); // 0 = Sun
                  const dayIdx = (today + i) % 7;
                  const isToday = i === 0;
                  const hasSession = [0, 2, 4].includes(i);
                  return (
                    <div key={i} style={{
                      display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                    }}>
                      <span style={{ fontSize: "0.62rem", color: "var(--text-3)" }}>{d}</span>
                      <div style={{
                        width: "100%", aspectRatio: "1", borderRadius: 8,
                        background: isToday ? "var(--accent)" : hasSession ? "var(--accent-dim)" : "var(--bg-elevated)",
                        border: `1px solid ${isToday ? "var(--accent)" : hasSession ? "var(--accent-border)" : "var(--border)"}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "0.7rem", fontWeight: 600,
                        color: isToday ? "#fff" : hasSession ? "#a78bfa" : "var(--text-3)"
                      }}>
                        {new Date(Date.now() + i * 86400000).getDate()}
                      </div>
                      {hasSession && <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#a78bfa" }} />}
                    </div>
                  );
                })}
              </div>
              <p style={{ fontSize: "0.75rem", color: "var(--text-3)", marginTop: 12, textAlign: "center" }}>
                Sessions indicated with purple dot
              </p>
            </div>

            {/* Upcoming Sessions from DB */}
            <div className="card" style={{ gridColumn: "1 / -1" }}>
              <h3 style={{ fontSize: "0.95rem", fontWeight: 600, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
                <Target size={16} className="text-accent" /> Upcoming Sessions
              </h3>
              {sessions.filter(s => s.status === "upcoming").length === 0 ? (
                <p style={{ fontSize: "0.85rem", color: "var(--text-3)", fontStyle: "italic" }}>No upcoming sessions scheduled.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {sessions
                    .filter(s => s.status === "upcoming")
                    .sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime())
                    .map(session => {
                      const relatedReq = requests.find(r => r.id === session.requestId);
                      return (
                        <div key={session.id} style={{
                          display: "flex", alignItems: "center", gap: "1rem",
                          padding: "0.75rem 1rem", background: "var(--bg-elevated)",
                          borderRadius: 10, border: "1px solid var(--border)"
                        }}>
                          <div style={{ width: 36, height: 36, borderRadius: 8, background: "var(--accent-dim)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Calendar size={16} style={{ color: "#a78bfa" }} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontWeight: 600, fontSize: "0.875rem" }}>{relatedReq?.title ?? "Session"}</p>
                            <p style={{ fontSize: "0.78rem", color: "var(--text-2)" }}>
                              with {relatedReq?.juniorName ?? session.juniorUid} ·{" "}
                              {format(session.scheduledAt, "d MMM, HH:mm")} · {session.duration}min
                            </p>
                          </div>
                          <a href={session.meetLink} target="_blank" rel="noreferrer" className="btn btn-primary btn-sm">
                            <ExternalLink size={12} /> Join
                          </a>
                        </div>
                      );
                    })
                  }
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          SECTION: EARNINGS
      ══════════════════════════════════════════════════════════════ */}
      {activeSection === "earnings" && (
        <div className="anim-2">
          <SectionHeader
            title="Earnings Overview"
            subtitle="Track your session-based earnings and payout history"
            icon={<DollarSign size={20} />}
          />

          {/* Earnings Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12, marginBottom: "1.5rem" }}>
            <div className="card" style={{ background: "linear-gradient(145deg, var(--bg-card), rgba(124,58,237,0.07))", borderColor: "var(--accent-border)" }}>
              <p style={{ fontSize: "0.72rem", color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>This Month</p>
              <p style={{ fontSize: "2.2rem", fontWeight: 800, letterSpacing: "-0.03em", color: "var(--text-1)" }}>₹{totalEarnings}</p>
              <p style={{ fontSize: "0.78rem", color: "#10b981", display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}>
                <TrendingUp size={12} /> +12% vs last month
              </p>
            </div>
            <StatCard label="Sessions This Month" value={String(EARNINGS_HISTORY.length)} sub="paid sessions" />
            <StatCard label="Per Session Avg" value={`₹${Math.round(totalEarnings / EARNINGS_HISTORY.length)}`} color="#a78bfa" sub="average rate" />
            <StatCard label="Pending Payout" value="₹0" color="#f59e0b" sub="within 7 days" />
          </div>

          {/* Earnings History Table */}
          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ fontSize: "0.95rem", fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
                <RefreshCw size={15} className="text-accent" /> Payout History
              </h3>
              <button className="btn btn-secondary btn-sm">
                Export CSV <ArrowUpRight size={12} />
              </button>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)" }}>
                    {["Date", "Student", "Topic", "Amount", "Status"].map(h => (
                      <th key={h} style={{ padding: "0.5rem 0.75rem", textAlign: "left", fontSize: "0.72rem", color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 500 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {EARNINGS_HISTORY.map((e, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid var(--border)" }}>
                      <td style={{ padding: "0.75rem", color: "var(--text-2)", fontSize: "0.82rem" }}>{e.date}</td>
                      <td style={{ padding: "0.75rem", fontWeight: 500 }}>{e.student}</td>
                      <td style={{ padding: "0.75rem", color: "var(--text-2)" }}>{e.topic}</td>
                      <td style={{ padding: "0.75rem", fontWeight: 700, color: "#10b981" }}>₹{e.amount}</td>
                      <td style={{ padding: "0.75rem" }}><span className="status status-completed">Paid</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          SECTION: LEADERBOARD
      ══════════════════════════════════════════════════════════════ */}
      {activeSection === "leaderboard" && (
        <div className="anim-2">
          <div style={{ marginBottom: "1.5rem" }}>
            <h2 style={{ fontSize: "1.15rem", fontWeight: 700, display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <TrendingUp size={20} style={{ color: "#a78bfa" }} />
              Mentor Leaderboard
            </h2>
            <p style={{ fontSize: "0.82rem", color: "var(--text-2)" }}>
              Real-time rankings based on rating and total completed sessions. Your row is highlighted.
            </p>
          </div>
          <LeaderboardWidget
            limit={10}
            showFooter={false}
            highlightUid={user.uid}
            title="Top 10 Active Mentors"
          />
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          SESSION SCHEDULER MODAL
      ══════════════════════════════════════════════════════════════ */}
      {schedulerTarget && (
        <SessionSchedulerModal
          request={schedulerTarget.req}
          rescheduleRequest={schedulerTarget.resch}
          onClose={() => setSchedulerTarget(null)}
          onSuccess={() => { setSchedulerTarget(null); setActiveSection("active"); }}
        />
      )}

      {/* ══════════════════════════════════════════════════════════════
          EDIT PROFILE MODAL
      ══════════════════════════════════════════════════════════════ */}
      {editModalOpen && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}
          onClick={() => setEditModalOpen(false)}
        >
          <div
            className="card"
            onClick={e => e.stopPropagation()}
            style={{ width: "100%", maxWidth: 520, background: "var(--bg-card)", position: "relative", animation: "fade-up 0.2s ease" }}
          >
            <button
              onClick={() => setEditModalOpen(false)}
              style={{ position: "absolute", top: 16, right: 16, background: "none", border: "none", color: "var(--text-2)", cursor: "pointer", padding: 4 }}
            >
              <X size={20} />
            </button>

            <h2 className="heading-md" style={{ marginBottom: 4 }}>Edit Profile</h2>
            <p style={{ fontSize: "0.82rem", color: "var(--text-3)", marginBottom: 20 }}>Update your bio, skills, and contact info</p>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-2)", marginBottom: 6, fontWeight: 500 }}>Bio</label>
                <textarea
                  className="input" rows={3}
                  placeholder="Tell juniors about yourself, your strengths and experience…"
                  value={editBio} onChange={e => setEditBio(e.target.value)}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-2)", marginBottom: 6, fontWeight: 500 }}>Skills <span style={{ color: "var(--text-3)" }}>(comma-separated)</span></label>
                <input
                  className="input"
                  placeholder="e.g. DSA, React, System Design"
                  value={editSkills} onChange={e => setEditSkills(e.target.value)}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-2)", marginBottom: 6, fontWeight: 500 }}>
                  Contact Info <span style={{ color: "var(--text-3)" }}>(WhatsApp / Phone)</span>
                </label>
                <input
                  className="input"
                  placeholder="+91 9876543210"
                  value={editContact} onChange={e => setEditContact(e.target.value)}
                />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <label style={{ fontSize: "0.8rem", color: "var(--text-2)", fontWeight: 500 }}>Social Links</label>
                <div style={{ display: "flex", gap: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, padding: "0.5rem 0.9rem" }}>
                    <Link2 size={14} style={{ color: "#0a66c2", flexShrink: 0 }} />
                    <input style={{ background: "none", border: "none", outline: "none", color: "var(--text-1)", fontSize: "0.875rem", width: "100%", fontFamily: "inherit" }} placeholder="LinkedIn URL" defaultValue={profile.linkedIn ?? ""} />
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, padding: "0.5rem 0.9rem" }}>
                    <Code2 size={14} style={{ color: "var(--text-1)", flexShrink: 0 }} />
                    <input style={{ background: "none", border: "none", outline: "none", color: "var(--text-1)", fontSize: "0.875rem", width: "100%", fontFamily: "inherit" }} placeholder="GitHub URL" defaultValue={profile.github ?? ""} />
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", paddingTop: 6 }}>
                <button className="btn btn-secondary" onClick={() => setEditModalOpen(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={saveProfile}>
                  <Check size={15} /> Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          VIEW PROFILE MODAL
      ══════════════════════════════════════════════════════════════ */}
      {viewProfileModal && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}
          onClick={() => setViewProfileModal(null)}
        >
          <div
            className="card"
            onClick={e => e.stopPropagation()}
            style={{ width: "100%", maxWidth: 420, background: "var(--bg-card)", position: "relative", animation: "fade-up 0.2s ease", padding: "2.5rem 2rem 2rem" }}
          >
            <button
              onClick={() => setViewProfileModal(null)}
              style={{ position: "absolute", top: 16, right: 16, background: "none", border: "none", color: "var(--text-2)", cursor: "pointer", padding: 4 }}
            >
              <X size={20} />
            </button>

            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "1.5rem" }}>
              <Avatar name={viewProfileModal.name} photo={viewProfileModal.photoURL} size={84} />
              <h2 style={{ fontSize: "1.35rem", fontWeight: 700, marginTop: "1rem", marginBottom: "0.25rem", letterSpacing: "-0.01em" }}>{viewProfileModal.name}</h2>
              <p style={{ fontSize: "0.85rem", color: "var(--text-2)" }}>{viewProfileModal.email}</p>
              <span className="badge badge-active" style={{ fontSize: "0.7rem", marginTop: "0.65rem" }}>{viewProfileModal.role === 'junior' ? 'Junior Student' : 'User'}</span>
            </div>

            <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
              <div style={{ padding: "0.85rem 1rem", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: "0.8rem", color: "var(--text-2)", fontWeight: 500 }}>Branch</span>
                <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>{viewProfileModal.branch || "Not specified"}</span>
              </div>
              <div style={{ padding: "0.85rem 1rem", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: "0.8rem", color: "var(--text-2)", fontWeight: 500 }}>Year of Study</span>
                <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>{viewProfileModal.year || "Not specified"}</span>
              </div>
              <div style={{ padding: "0.85rem 1rem", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: "0.8rem", color: "var(--text-2)", fontWeight: 500 }}>Age</span>
                <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>{viewProfileModal.age ? `${viewProfileModal.age} years` : "Not specified"}</span>
              </div>
              {viewProfileModal.dob && (
                <div style={{ padding: "0.85rem 1rem", display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "0.8rem", color: "var(--text-2)", fontWeight: 500 }}>Date of Birth</span>
                  <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>{viewProfileModal.dob}</span>
                </div>
              )}
            </div>
            
            <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: "1.5rem" }}>
              <a href={`mailto:${viewProfileModal.email}`} className="btn btn-primary" style={{ width: "100%", justifyContent: "center", padding: "0.75rem" }}>
                <MessageSquare size={15} /> Send Email
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ── Scoped Styles ── */}
      <style>{`
        /* mentor-dash-root: padding now fully handled by .dash-page in globals.css */
        .mentor-dash-root { /* no extra padding needed */ }

        /* Profile Banner */
        .profile-banner { padding: 1.75rem 2rem; }

        /* Section Nav */
        .section-nav {
          display: flex; gap: 4px; padding: 4px;
          background: var(--bg-card); border: 1px solid var(--border);
          border-radius: 12px; overflow-x: auto; width: 100%;
        }
        .section-nav::-webkit-scrollbar { height: 0; }
        .section-nav-btn {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 0.45rem 0.9rem; border-radius: 8px; font-size: 0.82rem;
          font-weight: 500; cursor: pointer; color: var(--text-2);
          transition: all 0.15s; border: none; background: transparent;
          font-family: inherit; white-space: nowrap; flex-shrink: 0;
        }
        .section-nav-btn:hover { color: var(--text-1); background: rgba(255,255,255,0.04); }
        .section-nav-active {
          background: var(--bg-elevated) !important; color: var(--text-1) !important;
          box-shadow: 0 1px 4px rgba(0,0,0,0.4);
        }

        /* Completed card hover */
        .completed-card { transition: border-color 0.2s, box-shadow 0.2s; }
        .completed-card:hover { border-color: rgba(124,58,237,0.25); }

        /* Pulse animation for live dot */
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.4); }
        }

        /* Schedule grid responsive */
        .schedule-grid { grid-template-columns: 1fr 1fr; }

        /* Tablet breakpoint */
        @media (max-width: 900px) {
          .profile-banner { padding: 1.25rem; }
          .schedule-grid { grid-template-columns: 1fr !important; }
        }

        /* Mobile breakpoint */
        @media (max-width: 640px) {
          .profile-banner { padding: 1rem; }
          .section-nav-btn { padding: 0.4rem 0.65rem; font-size: 0.76rem; gap: 4px; }
        }

        @media (max-width: 480px) {
          .section-nav-btn { padding: 0.35rem 0.5rem; font-size: 0.72rem; }
        }
      `}</style>
      </div>
    </RouteGuard>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────

function SectionHeader({ title, subtitle, icon, badge }: {
  title: string; subtitle?: string; icon?: React.ReactNode;
  badge?: { text: string; color: string };
}) {
  return (
    <div style={{ marginBottom: "1.25rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        {icon && <div style={{ color: "#a78bfa" }}>{icon}</div>}
        <h2 style={{ fontSize: "1.2rem", fontWeight: 700, letterSpacing: "-0.01em" }}>{title}</h2>
        {badge && (
          <span style={{
            fontSize: "0.7rem", padding: "0.15rem 0.6rem", borderRadius: 99,
            background: `${badge.color}22`, color: badge.color,
            border: `1px solid ${badge.color}44`, fontWeight: 600
          }}>{badge.text}</span>
        )}
      </div>
      {subtitle && <p style={{ fontSize: "0.85rem", color: "var(--text-2)", marginTop: 4 }}>{subtitle}</p>}
    </div>
  );
}

function EmptyState({ icon, title, desc, action }: {
  icon: React.ReactNode; title: string; desc: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div className="card" style={{ textAlign: "center", padding: "3.5rem 2rem", borderStyle: "dashed" }}>
      <div style={{
        width: 64, height: 64, background: "var(--bg-elevated)", borderRadius: "50%",
        display: "flex", alignItems: "center", justifyContent: "center",
        margin: "0 auto 1rem", color: "var(--text-3)"
      }}>{icon}</div>
      <h3 style={{ fontWeight: 600, fontSize: "1rem", marginBottom: 6 }}>{title}</h3>
      <p style={{ color: "var(--text-2)", fontSize: "0.875rem", maxWidth: 360, margin: "0 auto 1.2rem", lineHeight: 1.5 }}>{desc}</p>
      {action && (
        <button className="btn btn-secondary" onClick={action.onClick}>
          {action.label} <ChevronRight size={14} />
        </button>
      )}
    </div>
  );
}

function RequestCard({ req, type, updating, onAccept, onDecline, onViewProfile }: {
  req: HelpRequest; type: "pending"; updating: string | null;
  onAccept: () => void; onDecline: () => void; onViewProfile?: () => void;
}) {
  const isUpdating = updating === req.id;
  return (
    <div className="card" style={{ position: "relative", overflow: "hidden", transition: "all 0.2s" }}>
      {/* Accent left stripe */}
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: "var(--accent)" }} />

      <div style={{ display: "flex", gap: "1rem", paddingLeft: 8 }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.65rem" }}>
          <Avatar name={req.juniorName} size={44} />
          {onViewProfile && (
            <button 
              onClick={onViewProfile} 
              style={{ background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.25)", fontSize: "0.62rem", color: "var(--accent)", fontWeight: 700, cursor: "pointer", padding: "3px 7px", borderRadius: 6, transition: "background 0.2s", whiteSpace: "nowrap" }}
            >
              View Profile
            </button>
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8, marginBottom: 4 }}>
            <div>
              <p style={{ fontSize: "0.78rem", color: "var(--text-2)", marginBottom: 2 }}>
                Request from <strong style={{ color: "var(--text-1)" }}>{req.juniorName}</strong>
                {req.juniorProfile?.branch && ` · ${req.juniorProfile.branch}`}
                {req.juniorProfile?.year && ` (${req.juniorProfile.year})`}
              </p>
              <h3 style={{ fontWeight: 700, fontSize: "1.05rem" }}>{req.title}</h3>
            </div>
            <span style={{ fontSize: "0.75rem", color: "var(--text-3)", display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
              <Clock size={11} /> {formatDistanceToNow(new Date(req.createdAt), { addSuffix: true })}
            </span>
          </div>
          <p style={{ fontSize: "0.875rem", color: "var(--text-2)", marginBottom: 10, lineHeight: 1.55 }}>
            {req.description}
          </p>
          <div style={{ display: "flex", gap: 5, marginBottom: 14, flexWrap: "wrap" }}>
            {req.skills.map(s => <SkillBadge key={s} skill={s} />)}
          </div>
          <div style={{ display: "flex", gap: 8, borderTop: "1px solid var(--border)", paddingTop: 14 }}>
            <button
              onClick={onAccept} disabled={isUpdating}
              className="btn btn-primary"
              id={`accept-${req.id}`}
              style={{ minWidth: 140 }}
            >
              {isUpdating ? <Loader2 size={15} className="animate-spin" /> : <><CheckCircle size={15} /> Accept Request</>}
            </button>
            <button
              onClick={onDecline} disabled={isUpdating}
              className="btn btn-danger"
              id={`decline-${req.id}`}
            >
              {isUpdating ? <Loader2 size={15} className="animate-spin" /> : <><XCircle size={15} /> Decline</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ScheduledSessionCard({ session, juniorName, requestTitle, updating, onComplete, hasPendingReschedule, onReviewReschedule }: {
  session: Session; juniorName: string; requestTitle: string;
  updating: string | null; onComplete: () => void;
  hasPendingReschedule?: boolean; onReviewReschedule?: () => void;
}) {
  const isUpdating = updating === session.id;
  const isPast = session.scheduledAt < new Date();
  return (
    <div className="card" style={{
      position: "relative", overflow: "hidden",
      background: "linear-gradient(145deg, var(--bg-card) 0%, rgba(124,58,237,0.04) 100%)",
      borderColor: "rgba(124,58,237,0.2)"
    }}>
      {/* Animated top stripe */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg, #7c3aed, #a78bfa, #7c3aed)", backgroundSize: "200% 100%", animation: "slide-gradient 2s linear infinite" }} />

      <div style={{ display: "flex", gap: "1rem", marginTop: 4 }}>
        <Avatar name={juniorName} size={48} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8, marginBottom: 6 }}>
            <div>
              <p style={{ fontSize: "0.78rem", color: "var(--text-2)", marginBottom: 2 }}>
                Scheduled session with <strong style={{ color: "var(--text-1)" }}>{juniorName}</strong>
              </p>
              <h3 style={{ fontWeight: 700, fontSize: "1.05rem" }}>{requestTitle}</h3>
            </div>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              {hasPendingReschedule && (
                <span className="status status-declined" style={{ flexShrink: 0, padding: "0.15rem 0.6rem", fontSize: "0.7rem", fontWeight: 700 }}>Reschedule Requested</span>
              )}
              <span className="status status-accepted" style={{ flexShrink: 0 }}>Scheduled</span>
            </div>
          </div>

          {/* Session details */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--bg-elevated)", padding: "0.35rem 0.7rem", borderRadius: 8, border: "1px solid var(--border)" }}>
              <Calendar size={13} style={{ color: "#a78bfa" }} />
              <span style={{ fontSize: "0.8rem", fontWeight: 600 }}>
                {format(session.scheduledAt, "d MMM yyyy")}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--bg-elevated)", padding: "0.35rem 0.7rem", borderRadius: 8, border: "1px solid var(--border)" }}>
              <Clock size={13} style={{ color: "#10b981" }} />
              <span style={{ fontSize: "0.8rem", fontWeight: 600 }}>
                {format(session.scheduledAt, "HH:mm")} · {session.duration} min
              </span>
            </div>
          </div>

          {/* Meeting Link Banner */}
          {session.meetLink && (
            <div style={{
              display: "flex", alignItems: "center", gap: 10, padding: "0.65rem 0.9rem",
              background: "rgba(37,99,235,0.08)", border: "1px solid rgba(37,99,235,0.2)",
              borderRadius: 10, marginBottom: 14
            }}>
              <Video size={15} style={{ color: "#60a5fa", flexShrink: 0 }} />
              <p style={{ fontSize: "0.78rem", color: "#93c5fd", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {session.meetLink}
              </p>
              <a
                href={session.meetLink}
                target="_blank"
                rel="noreferrer"
                className="btn btn-primary btn-sm"
                style={{ background: "#2563eb", boxShadow: "none", flexShrink: 0 }}
              >
                <ExternalLink size={12} /> Join Meeting
              </a>
            </div>
          )}

          <div style={{ display: "flex", gap: 8, borderTop: "1px solid var(--border)", paddingTop: 14, flexWrap: "wrap", alignItems: "center" }}>
            <a href={`mailto:?subject=Upcoming session reminder`} className="btn btn-secondary">
              <MessageSquare size={14} /> Message Student
            </a>
            <div style={{ flex: 1 }} />
            {hasPendingReschedule && onReviewReschedule && (
              <button
                onClick={onReviewReschedule}
                className="btn btn-secondary"
                style={{ fontSize: "0.8rem", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.3)", padding: "0.4rem 0.9rem" }}
              >
                <Clock size={14} /> Review Reschedule
              </button>
            )}
            <button
              onClick={onComplete}
              disabled={isUpdating}
              className="btn btn-secondary"
              id={`complete-session-${session.id}`}
              style={{ color: "#10b981", borderColor: "rgba(16,185,129,0.3)" }}
            >
              {isUpdating ? <Loader2 size={15} className="animate-spin" /> : <><Check size={15} /> Mark Complete</>}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slide-gradient {
          from { background-position: 0% 0; }
          to   { background-position: 200% 0; }
        }
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.5; transform: scale(1.4); }
        }
      `}</style>
    </div>
  );
}
