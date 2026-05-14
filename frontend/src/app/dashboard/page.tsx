"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Clock, CheckCircle, XCircle, Search, Edit2, Zap, Calendar, Bookmark, Star, Send, Loader2, Users, GraduationCap } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { Mentor, HelpRequest, Session, BRANCH_OPTIONS, YEAR_OPTIONS, TeacherMentor } from "@/types";
import Link from "next/link";
import { formatDistanceToNow, format } from "date-fns";
import MentorCard from "@/components/MentorCard";
import TeacherMentorCard from "@/components/TeacherMentorCard";
import AcceptedTeacherMentorCard from "@/components/AcceptedTeacherMentorCard";
import TeacherMentorProfileModal from "@/components/TeacherMentorProfileModal";
import TeacherSessionCard from "@/components/TeacherSessionCard";
import SkillBadge from "@/components/SkillBadge";
import toast from "react-hot-toast";
import RouteGuard from "@/components/RouteGuard";
import { getRequestsForJunior, subscribeRequestsForJunior, getSessionsForUser, subscribeSessionsForUser, getMentor, getTeacherMentor, updateUser, subscribeMentors, subscribeTeacherMentors, createRequest, subscribeRescheduleRequestsForUser } from "@/lib/db";
import LeaderboardWidget from "@/components/LeaderboardWidget";
import RescheduleRequestModal from "@/components/RescheduleRequestModal";
import { RescheduleRequest } from "@/types";

const STATUS_STYLE: Record<string, string> = {
  pending: "status status-pending", accepted: "status status-accepted",
  declined: "status status-declined", completed: "status status-completed",
  upcoming: "status status-pending", cancelled: "status status-declined"
};

type Tab = "requests" | "mentors" | "upcoming" | "history" | "saved";

export default function JuniorDashboard() {
  const { user, loading: authLoading } = useAuthStore();
  const router = useRouter();
  
  const [tab, setTab] = useState<Tab>("requests");
  const [quickHelp, setQuickHelp] = useState("");
  const [profileModalUid, setProfileModalUid] = useState<string | null>(null);

  const [requests, setRequests] = useState<HelpRequest[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [mentorDict, setMentorDict] = useState<Record<string, Mentor | TeacherMentor>>({});
  const [recommendedMentors, setRecommendedMentors] = useState<Mentor[]>([]);
  const [allMentors, setAllMentors] = useState<Mentor[]>([]);
  const [allTeachers, setAllTeachers] = useState<TeacherMentor[]>([]);
  const [rescheduleRequests, setRescheduleRequests] = useState<RescheduleRequest[]>([]);
  
  const [sendingQuickHelp, setSendingQuickHelp] = useState(false);
  const [reschedulingSession, setReschedulingSession] = useState<Session | null>(null);
  
  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push("/register"); return; }
    
    // Subscriptions
    const resolveMentor = async (uid: string) => {
      // Try student mentor first, then teacher mentor as fallback
      const m = await getMentor(uid);
      if (m) { setMentorDict(p => ({ ...p, [uid]: m })); return; }
      const tm = await getTeacherMentor(uid);
      if (tm) setMentorDict(p => ({ ...p, [uid]: tm }));
    };

    const unsubReq = subscribeRequestsForJunior(user.uid, async (reqs) => {
      setRequests(reqs);
      const mUids = [...new Set(reqs.map(r => r.mentorUid))];
      mUids.forEach(uid => { if (!mentorDict[uid]) resolveMentor(uid); });
    });

    const unsubSess = subscribeSessionsForUser(user.uid, "junior", async (sess) => {
      setSessions(sess);
      const mUids = [...new Set(sess.map(s => s.mentorUid))];
      mUids.forEach(uid => { if (!mentorDict[uid]) resolveMentor(uid); });
    });

    const unsubMentors = subscribeMentors((mentors) => {
      setAllMentors(mentors);
      setRecommendedMentors(mentors.slice(0, 3));
    });
    
    const unsubTeachers = subscribeTeacherMentors((teachers) => {
      setAllTeachers(teachers);
    });
    
    const unsubReschedules = subscribeRescheduleRequestsForUser(user.uid, "junior", (reqs) => {
      setRescheduleRequests(reqs);
    });

    return () => { unsubReq(); unsubSess(); unsubMentors(); unsubTeachers(); unsubReschedules(); };
  }, [user, authLoading, router]);

  const handleQuickHelp = async () => {
    if (!quickHelp.trim()) return toast.error("Please enter a topic");
    if (!user) return;
    setSendingQuickHelp(true);
    try {
      // Find a highly rated active mentor
      const availableMentors = allMentors.filter(m => m.isActive);
      if (availableMentors.length === 0) {
        toast.error("No mentors available right now.");
        setSendingQuickHelp(false);
        return;
      }
      const bestMentor = availableMentors.sort((a, b) => b.rating - a.rating)[0];
      
      await createRequest({
        juniorUid: user.uid,
        juniorName: user.name,
        juniorPhoto: user.photoURL,
        mentorUid: bestMentor.uid,
        title: "Quick Help: " + quickHelp,
        description: "I need quick assistance with: " + quickHelp,
        skills: [quickHelp],
        status: "pending",
      });
      toast.success("Quick request sent to " + bestMentor.name + "!");
      setQuickHelp("");
      setTab("requests");
    } catch {
      toast.error("Failed to send request.");
    } finally {
      setSendingQuickHelp(false);
    }
  };





  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(user?.name || "");
  const [editAge, setEditAge] = useState(user?.age?.toString() || "");
  const [editDob, setEditDob] = useState(user?.dob || "");
  const [editBranch, setEditBranch] = useState(user?.branch || "");
  const [editYear, setEditYear] = useState(user?.year || "");
  const [submitting, setSubmitting] = useState(false);

  // Sync state if user changes (e.g. from auth store hydrate)
  useEffect(() => {
    if (user && !isEditing) {
      setEditName(user.name || "");
      setEditAge(user.age?.toString() || "");
      setEditDob(user.dob || "");
      setEditBranch(user.branch || "");
      setEditYear(user.year || "");
    }
  }, [user, isEditing]);

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    if (!editName.trim()) return toast.error("Full name is required");
    
    const ageNum = parseInt(editAge);
    if (!editAge || isNaN(ageNum) || ageNum < 10 || ageNum > 100) {
      return toast.error("Please enter a valid age between 10 and 100");
    }
    
    if (!editDob) return toast.error("Date of birth is required");

    setSubmitting(true);
    try {
      const updates = {
        name: editName.trim(),
        age: ageNum,
        dob: editDob,
        branch: editBranch,
        year: editYear,
      };

      // Only hit Firestore if not demo user
      if (!user.uid.startsWith("demo_")) {
        await updateUser(user.uid, updates);
      } else {
        // Simulate network for demo
        await new Promise(r => setTimeout(r, 600));
      }

      // Update local store immediately
      useAuthStore.getState().setUser({ ...user, ...updates });
      
      toast.success("Profile updated successfully!");
      setIsEditing(false);
    } catch (err: unknown) {
      if (err instanceof Error) {
        toast.error(err.message || "Failed to update profile");
      } else {
        toast.error("Failed to update profile");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="page-wrap section" style={{ display: "flex", justifyContent: "center" }}>
        <div className="skeleton" style={{ width: "100%", height: 300 }} />
      </div>
    );
  }

  const initial = user.name ? user.name[0].toUpperCase() : "?";

  return (
    <RouteGuard allowedRoles={["junior"]}>
      <div className="page-wrap dash-page">
        
        {/* ── 1. TOP SECTION: Profile & Quick Action ── */}
      <div className="dash-top-grid">
        
        {/* Profile Card */}
        <div className="card" style={{ display: "flex", gap: "1.5rem", alignItems: "center", position: "relative" }}>
          
          <div style={{
            width: 80, height: 80, borderRadius: "50%", background: "var(--accent-dim)",
            border: "2px solid var(--accent-border)", display: "flex", alignItems: "center",
            justifyContent: "center", fontSize: "2rem", fontWeight: 700, color: "#a78bfa",
            flexShrink: 0
          }}>
            {user.photoURL ? <img src={user.photoURL} alt={user.name} style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} /> : initial}
          </div>
          
          <div style={{ flex: 1 }}>
            <h1 className="heading-md" style={{ marginBottom: 4 }}>{user.name}</h1>
            <p style={{ color: "var(--text-2)", fontSize: "0.85rem", marginBottom: 8 }}>
              {user.branch || "Branch not set"} · {user.year || "Year not set"} {user.age ? `· ${user.age} yrs` : ""}
            </p>
            <button className="btn btn-secondary btn-sm" onClick={() => setIsEditing(true)}>
              <Edit2 size={14} /> Edit Profile
            </button>
          </div>
          
        </div>

        {/* Quick Help Action */}
        <div className="card anim-1" style={{ background: "linear-gradient(145deg, var(--bg-card) 0%, rgba(124,58,237,0.08) 100%)", borderColor: "var(--accent-border)", display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <h2 className="heading-sm" style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
            <Zap size={16} className="text-accent" /> Need help instantly?
          </h2>
          <div style={{ display: "flex", gap: 8 }}>
            <input 
              type="text" className="input" placeholder={"E.g. Need help with recursion..."} 
              value={quickHelp} onChange={(e) => setQuickHelp(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleQuickHelp()}
              disabled={sendingQuickHelp}
            />
            <button className="btn btn-primary" style={{ padding: "0 1rem" }} onClick={handleQuickHelp} disabled={sendingQuickHelp}>
              {sendingQuickHelp ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          </div>
        </div>

      </div>

      {/* ── 2. SEARCH & FILTER AREA ── */}
      <div className="card anim-2" style={{ marginBottom: "2.5rem", padding: "1.2rem", display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "flex-end" }}>
        <div style={{ flex: "1 1 250px" }}>
          <label style={{ display: "block", fontSize: "0.75rem", color: "var(--text-2)", marginBottom: 6, fontWeight: 500 }}>Search by Topic or Skill</label>
          <div style={{ position: "relative" }}>
            <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-3)" }} />
            <input type="text" className="input" placeholder="DSA, Web, Android..." style={{ paddingLeft: 36 }} />
          </div>
        </div>
        <div style={{ flex: "1 1 150px" }}>
          <label style={{ display: "block", fontSize: "0.75rem", color: "var(--text-2)", marginBottom: 6, fontWeight: 500 }}>Branch</label>
          <select className="input" style={{ appearance: "none", cursor: "pointer" }}>
            <option value="">All Branches</option>
            <option value="CS">Computer Science</option>
            <option value="IT">Information Tech</option>
            <option value="EC">Electronics</option>
          </select>
        </div>
        <div style={{ flex: "1 1 150px" }}>
          <label style={{ display: "block", fontSize: "0.75rem", color: "var(--text-2)", marginBottom: 6, fontWeight: 500 }}>Year</label>
          <select className="input" style={{ appearance: "none", cursor: "pointer" }}>
            <option value="">Any Year</option>
            <option value="3">3rd Year</option>
            <option value="4">4th Year</option>
            <option value="Alumni">Alumni</option>
          </select>
        </div>
        <button className="btn btn-primary" style={{ height: "42px", padding: "0 1.5rem" }} onClick={() => router.push("/mentors")}>
          Find Mentors
        </button>
      </div>

      {/* ── 3. RECOMMENDED MENTORS ── */}
      <div className="anim-3" style={{ marginBottom: "3rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <h2 className="heading-md">Recommended for You</h2>
          <Link href="/mentors" style={{ fontSize: "0.85rem", color: "#a78bfa", textDecoration: "none", fontWeight: 500 }}>View all</Link>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1rem" }}>
          {recommendedMentors.length > 0 ? (
            recommendedMentors.map(mentor => (
              <MentorCard key={mentor.uid} mentor={mentor} />
            ))
          ) : (
            <div style={{ gridColumn: "1 / -1", padding: "2rem", textAlign: "center", color: "var(--text-3)", background: "var(--bg-elevated)", borderRadius: 16 }}>
              <p>No mentors available right now.</p>
            </div>
          )}
        </div>
      </div>

      {/* ── 3b. LEADERBOARD WIDGET ── */}
      <div className="anim-4" style={{ marginBottom: "3rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <h2 className="heading-md">🏆 Mentor Leaderboard</h2>
          <Link href="/leaderboard" style={{ fontSize: "0.85rem", color: "#a78bfa", textDecoration: "none", fontWeight: 500 }}>Full board →</Link>
        </div>
        <LeaderboardWidget limit={5} showFooter={false} />
      </div>

      {/* ── 4. MAIN TABS (Requests, History, Saved) ── */}
      <div className="anim-4">
        <div className="tab-bar" style={{ marginBottom: "1.5rem", flexWrap: "wrap" }}>
          <button className={`tab ${tab === "requests" ? "active" : ""}`} onClick={() => setTab("requests")}>
            My Requests <span style={{ opacity: 0.6, fontSize: "0.75rem", marginLeft: 4 }}>({requests.length})</span>
          </button>
          <button className={`tab ${tab === "mentors" ? "active" : ""}`} onClick={() => setTab("mentors")}>
            My Mentors
            {requests.filter(r => r.status === "accepted").length > 0 && (
              <span style={{ marginLeft: 5, background: "#f59e0b", color: "#000", borderRadius: 99, fontSize: "0.65rem", fontWeight: 700, padding: "0.1rem 0.45rem" }}>
                {[...new Set(requests.filter(r => r.status === "accepted").map(r => r.mentorUid))].length}
              </span>
            )}
          </button>
          <button className={`tab ${tab === "upcoming" ? "active" : ""}`} onClick={() => setTab("upcoming")}>
            Upcoming Sessions <span style={{ opacity: 0.6, fontSize: "0.75rem", marginLeft: 4 }}>({sessions.filter(s => s.status === 'upcoming').length})</span>
          </button>
          <button className={`tab ${tab === "history" ? "active" : ""}`} onClick={() => setTab("history")}>
            Session History
          </button>
          <button className={`tab ${tab === "saved" ? "active" : ""}`} onClick={() => setTab("saved")}>
            Saved Mentors
          </button>
        </div>

        {tab === "requests" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {requests.length === 0 ? (
               <p style={{ color: "var(--text-3)", padding: "2rem", textAlign: "center" }}>No requests sent yet.</p>
            ) : requests.map(req => (
              <div key={req.id} className="card" style={{ display: "flex", gap: "1rem", alignItems: "flex-start", padding: "1rem 1.25rem" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                    <span className={STATUS_STYLE[req.status]} style={{ textTransform: "capitalize" }}>{req.status}</span>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-3)" }}>
                      Sent {formatDistanceToNow(new Date(req.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <h3 style={{ fontWeight: 600, fontSize: "0.95rem", color: "var(--text-1)", marginBottom: 4 }}>{req.title}</h3>
                  <p className="line-clamp-2" style={{ fontSize: "0.85rem", color: "var(--text-2)", marginBottom: 12 }}>{req.description}</p>
                  
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-3)" }}>Mentor:</span>
                    {req.mentorType === "teacher" ? (
                      <button
                        onClick={() => setProfileModalUid(req.mentorUid)}
                        style={{
                          background: "none", border: "none", cursor: "pointer", padding: 0,
                          fontSize: "0.8rem", color: "#f59e0b", fontWeight: 600, fontFamily: "inherit",
                        }}
                      >
                        {mentorDict[req.mentorUid]?.name ?? "Loading..."}
                      </button>
                    ) : (
                      <Link
                        href={`/mentor/${req.mentorUid}`}
                        style={{ fontSize: "0.8rem", color: "#a78bfa", textDecoration: "none", fontWeight: 500, marginRight: 8 }}
                      >
                        {mentorDict[req.mentorUid]?.name ?? "Loading..."}
                      </Link>
                    )}
                    {req.skills.map(s => <span key={s} className="badge" style={{ fontSize: "0.68rem" }}>{s}</span>)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── MY MENTORS TAB ── */}
        {tab === "mentors" && (() => {
          const acceptedReqs = requests.filter(r => r.status === "accepted");
          // Deduplicate by mentorUid (latest accepted request per mentor)
          const seenUids = new Set<string>();
          const uniqueAccepted = acceptedReqs.filter(r => {
            if (seenUids.has(r.mentorUid)) return false;
            seenUids.add(r.mentorUid);
            return true;
          });
          const teacherAccepted = uniqueAccepted.filter(r => r.mentorType === "teacher");
          const studentAccepted = uniqueAccepted.filter(r => r.mentorType !== "teacher");

          if (uniqueAccepted.length === 0) return (
            <div style={{ textAlign: "center", padding: "4rem 1rem", color: "var(--text-3)", background: "var(--bg-card)", borderRadius: 16, border: "1px dashed var(--border)" }}>
              <GraduationCap size={40} style={{ margin: "0 auto 12px", opacity: 0.3 }} />
              <p style={{ fontWeight: 600, marginBottom: 4 }}>No accepted mentors yet</p>
              <p style={{ fontSize: "0.82rem" }}>Once a mentor accepts your request, they'll appear here.</p>
            </div>
          );

          return (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

              {/* Teacher Mentors section */}
              {teacherAccepted.length > 0 && (
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "0.9rem" }}>
                    <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#f59e0b", textTransform: "uppercase", letterSpacing: "0.06em" }}>Faculty Mentors</span>
                    <span style={{ height: 1, flex: 1, background: "rgba(245,158,11,0.2)" }} />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1rem" }}>
                    {teacherAccepted.map(req => {
                      const relatedSession = sessions.find(s => s.mentorUid === req.mentorUid && s.status === "upcoming");
                      return (
                        <AcceptedTeacherMentorCard
                          key={req.id}
                          mentorUid={req.mentorUid}
                          requestTitle={req.title}
                          requestStatus={req.status}
                          session={relatedSession}
                          onViewProfile={setProfileModalUid}
                        />
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Student Mentors section */}
              {studentAccepted.length > 0 && (
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "0.9rem" }}>
                    <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#a78bfa", textTransform: "uppercase", letterSpacing: "0.06em" }}>Student Mentors</span>
                    <span style={{ height: 1, flex: 1, background: "rgba(167,139,250,0.2)" }} />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {studentAccepted.map(req => {
                      const m = mentorDict[req.mentorUid];
                      const relatedSession = sessions.find(s => s.mentorUid === req.mentorUid && s.status === "upcoming");
                      return (
                        <div key={req.id} className="card" style={{ padding: "1rem 1.25rem", display: "flex", gap: "1rem", alignItems: "center", border: "1px solid rgba(167,139,250,0.2)" }}>
                          <div style={{
                            width: 46, height: 46, borderRadius: 12, flexShrink: 0,
                            background: "rgba(167,139,250,0.12)", border: "1.5px solid rgba(167,139,250,0.3)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: "1rem", fontWeight: 700, color: "#a78bfa", overflow: "hidden"
                          }}>
                            {m?.photoURL
                              ? <img src={(m as Mentor).photoURL} alt={m.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                              : (m?.name?.[0]?.toUpperCase() ?? "?")}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <Link href={`/mentor/${req.mentorUid}`} style={{ fontWeight: 700, fontSize: "0.92rem", color: "var(--text-1)", textDecoration: "none" }}>
                              {m?.name ?? "Loading..."}
                            </Link>
                            <p style={{ fontSize: "0.75rem", color: "var(--text-3)", marginTop: 2 }}>
                              {(m as Mentor)?.branch} · {(m as Mentor)?.year}
                            </p>
                          </div>
                          {relatedSession && (
                            <div style={{ textAlign: "right", flexShrink: 0 }}>
                              <p style={{ fontSize: "0.68rem", color: "#22c55e", fontWeight: 600, marginBottom: 2 }}>Upcoming Session</p>
                              <p style={{ fontSize: "0.72rem", color: "var(--text-3)" }}>
                                {relatedSession.scheduledAt.toLocaleDateString(undefined, { day: "numeric", month: "short" })}
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {tab === "upcoming" && (() => {
          const teacherSessions = sessions.filter(s => s.status === "upcoming" && s.mentorType === "teacher");
          const studentSessions = sessions.filter(s => s.status === "upcoming" && s.mentorType !== "teacher");
          const totalUpcoming = teacherSessions.length + studentSessions.length;

          if (totalUpcoming === 0) return (
            <div style={{ textAlign: "center", padding: "4rem 1rem", color: "var(--text-3)", background: "var(--bg-card)", borderRadius: 16, border: "1px dashed var(--border)" }}>
              <Calendar size={40} style={{ margin: "0 auto 12px", opacity: 0.3 }} />
              <p style={{ fontWeight: 600, marginBottom: 4 }}>No upcoming sessions</p>
              <p style={{ fontSize: "0.82rem" }}>Sessions scheduled by your mentors will appear here instantly.</p>
            </div>
          );

          return (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

              {/* Teacher mentor sessions */}
              {teacherSessions.length > 0 && (
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "0.9rem" }}>
                    <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#f59e0b", textTransform: "uppercase", letterSpacing: "0.06em" }}>Faculty Sessions</span>
                    <span style={{ height: 1, flex: 1, background: "rgba(245,158,11,0.2)" }} />
                    <span style={{ fontSize: "0.68rem", color: "#22c55e", display: "flex", alignItems: "center", gap: 4, fontWeight: 600 }}>
                      <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#22c55e", display: "inline-block", animation: "dash-pulse 1.8s infinite" }} /> Live
                    </span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {teacherSessions.map(session => {
                      const tm = mentorDict[session.mentorUid] as import("@/types").TeacherMentor | undefined;
                      const hasPendingReschedule = rescheduleRequests.some(r => r.sessionId === session.id && r.status === "pending");
                      return (
                        <TeacherSessionCard
                          key={session.id}
                          session={session}
                          mentor={tm && "department" in tm ? tm : undefined}
                          isTeacherView={false}
                          hasPendingReschedule={hasPendingReschedule}
                          onRequestReschedule={() => setReschedulingSession(session)}
                        />
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Student mentor sessions */}
              {studentSessions.length > 0 && (
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "0.9rem" }}>
                    <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#a78bfa", textTransform: "uppercase", letterSpacing: "0.06em" }}>Peer Mentor Sessions</span>
                    <span style={{ height: 1, flex: 1, background: "rgba(167,139,250,0.2)" }} />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {studentSessions.map(session => (
                      <div key={session.id} className="card" style={{ padding: "1rem 1.25rem", background: "linear-gradient(to right, rgba(124,58,237,0.05), transparent)" }}>
                        <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
                          <div style={{ width: 44, height: 44, borderRadius: 10, background: "rgba(124,58,237,0.15)", color: "#c4b5fd", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <Calendar size={22} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                              <span style={{ fontWeight: 600, color: "var(--text-1)", fontSize: "0.95rem" }}>{mentorDict[session.mentorUid]?.name || "Loading..."}</span>
                              {rescheduleRequests.some(r => r.sessionId === session.id && r.status === "pending") && (
                                <span className="status status-declined" style={{ padding: "0.15rem 0.5rem", fontSize: "0.65rem" }}>Reschedule Requested</span>
                              )}
                              <span className={STATUS_STYLE[session.status]} style={{ textTransform: "capitalize", fontSize: "0.65rem", padding: "0.1rem 0.5rem" }}>Upcoming</span>
                            </div>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 5, background: "var(--bg-elevated)", padding: "0.25rem 0.6rem", borderRadius: 7, border: "1px solid var(--border)" }}>
                                <Calendar size={11} style={{ color: "#a78bfa" }} />
                                <span style={{ fontSize: "0.75rem", fontWeight: 600 }}>{format(session.scheduledAt, "d MMM yyyy")}</span>
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: 5, background: "var(--bg-elevated)", padding: "0.25rem 0.6rem", borderRadius: 7, border: "1px solid var(--border)" }}>
                                <Clock size={11} style={{ color: "#10b981" }} />
                                <span style={{ fontSize: "0.75rem", fontWeight: 600 }}>{format(session.scheduledAt, "HH:mm")}</span>
                              </div>
                              {session.duration && (
                                <div style={{ display: "flex", alignItems: "center", gap: 5, background: "var(--bg-elevated)", padding: "0.25rem 0.6rem", borderRadius: 7, border: "1px solid var(--border)" }}>
                                  <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-2)" }}>{session.duration} min</span>
                                </div>
                              )}
                            </div>
                            {session.meetLink && (
                              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                                <a href={session.meetLink} target="_blank" rel="noreferrer" className="btn btn-primary btn-sm" style={{ display: "inline-flex", gap: 6, padding: "0.4rem 1rem" }}>
                                  <Zap size={13} /> Join Meeting
                                </a>
                                {!rescheduleRequests.some(r => r.sessionId === session.id && r.status === "pending") && (
                                  <button
                                    onClick={() => setReschedulingSession(session)}
                                    className="btn btn-secondary btn-sm"
                                    style={{ padding: "0.4rem 0.9rem" }}
                                  >
                                    <Clock size={13} style={{ marginRight: 4 }} />
                                    Request Reschedule
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {tab === "history" && (() => {
          const doneSessions = sessions.filter(s => s.status === "completed" || s.status === "cancelled");
          if (doneSessions.length === 0) return (
            <p style={{ color: "var(--text-3)", padding: "2rem", textAlign: "center" }}>No session history.</p>
          );
          const teacherDone = doneSessions.filter(s => s.mentorType === "teacher");
          const studentDone = doneSessions.filter(s => s.mentorType !== "teacher");
          return (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              {teacherDone.length > 0 && (
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "0.9rem" }}>
                    <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#f59e0b", textTransform: "uppercase", letterSpacing: "0.06em" }}>Faculty Sessions</span>
                    <span style={{ height: 1, flex: 1, background: "rgba(245,158,11,0.2)" }} />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {teacherDone.map(session => {
                      const tm = mentorDict[session.mentorUid] as import("@/types").TeacherMentor | undefined;
                      return (
                        <TeacherSessionCard
                          key={session.id}
                          session={session}
                          mentor={tm && "department" in tm ? tm : undefined}
                          isTeacherView={false}
                        />
                      );
                    })}
                  </div>
                </div>
              )}
              {studentDone.length > 0 && (
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "0.9rem" }}>
                    <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#a78bfa", textTransform: "uppercase", letterSpacing: "0.06em" }}>Peer Mentor Sessions</span>
                    <span style={{ height: 1, flex: 1, background: "rgba(167,139,250,0.2)" }} />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {studentDone.map(session => (
                      <div key={session.id} className="card" style={{ padding: "1rem 1.25rem", display: "flex", gap: "1rem", alignItems: "center" }}>
                        <div style={{ width: 40, height: 40, borderRadius: 8, background: "rgba(255,255,255,0.05)", color: "var(--text-3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          {session.status === "completed" ? <CheckCircle size={20} /> : <XCircle size={20} />}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                            <span style={{ fontWeight: 600, color: "var(--text-1)", fontSize: "0.95rem" }}>{mentorDict[session.mentorUid]?.name || "Loading..."}</span>
                            <span className={STATUS_STYLE[session.status]} style={{ textTransform: "capitalize", fontSize: "0.65rem", padding: "0.1rem 0.5rem" }}>{session.status}</span>
                          </div>
                          <p style={{ fontSize: "0.8rem", color: "var(--text-2)" }}>
                            Date: {session.scheduledAt.toLocaleDateString()}
                            {session.duration && ` • ${session.duration} mins`}
                          </p>
                          {session.summary && <p style={{ fontSize: "0.8rem", color: "var(--text-2)", marginTop: 6, fontStyle: "italic" }}>&quot;{session.summary}&quot;</p>}
                        </div>
                        {session.status === "completed" && session.rating && (
                          <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0, background: "rgba(245,158,11,0.1)", padding: "0.3rem 0.6rem", borderRadius: 8 }}>
                            <Star size={14} fill="#f59e0b" color="#f59e0b" />
                            <span style={{ fontWeight: 600, fontSize: "0.85rem", color: "#f59e0b" }}>{session.rating}/5</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {tab === "saved" && (
           <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1rem" }}>
             {(!user?.savedMentors || user.savedMentors.length === 0) ? (
                <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "3rem", color: "var(--text-3)", background: "var(--bg-card)", borderRadius: "var(--radius-lg)", border: "1px dashed var(--border)" }}>
                  <Bookmark size={32} style={{ margin: "0 auto 12px", opacity: 0.5 }} />
                  <p>You haven&apos;t saved any mentors yet.</p>
                </div>
             ) : (
                user.savedMentors.map(uid => {
                  const sMentor = allMentors.find(m => m.uid === uid);
                  const tMentor = allTeachers.find(m => m.uid === uid);
                  if (sMentor) return <MentorCard key={uid} mentor={sMentor} />;
                  if (tMentor) return <TeacherMentorCard key={uid} teacher={tMentor} />;
                  return null;
                })
             )}
           </div>
        )}

      </div>

      {isEditing && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", padding: "1rem" }}>
          <div className="card anim-1" style={{ width: "100%", maxWidth: 480, padding: "1.5rem", position: "relative" }}>
            <button 
              onClick={() => setIsEditing(false)} 
              className="btn btn-ghost" 
              style={{ position: "absolute", top: "1rem", right: "1rem", padding: "0.5rem" }}
            >
              <XCircle size={20} />
            </button>
            <h2 className="heading-md" style={{ marginBottom: "1.25rem" }}>Edit Profile</h2>
            
            <form onSubmit={handleEditSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 500, color: "var(--text-2)", marginBottom: 6 }}>Full Name</label>
                <input required type="text" className="input" placeholder="John Doe" value={editName} onChange={e => setEditName(e.target.value)} disabled={submitting} />
              </div>
              
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 500, color: "var(--text-2)", marginBottom: 6 }}>Email</label>
                <input type="email" className="input" value={user?.email || ""} disabled style={{ opacity: 0.6, cursor: "not-allowed" }} />
                <p style={{ fontSize: "0.7rem", color: "var(--text-3)", marginTop: 4 }}>Email cannot be changed.</p>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 500, color: "var(--text-2)", marginBottom: 6 }}>Age</label>
                  <input required type="number" min="10" max="100" className="input" placeholder="20" value={editAge} onChange={e => setEditAge(e.target.value)} disabled={submitting} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 500, color: "var(--text-2)", marginBottom: 6 }}>Date of Birth</label>
                  <input required type="date" className="input" value={editDob} onChange={e => setEditDob(e.target.value)} disabled={submitting} />
                </div>
              </div>

              {/* Branch & Year */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 500, color: "var(--text-2)", marginBottom: 6 }}>Branch</label>
                  <select className="input" value={editBranch} onChange={e => setEditBranch(e.target.value)} disabled={submitting} style={{ appearance: "none", cursor: "pointer" }}>
                    <option value="">Select branch…</option>
                    {BRANCH_OPTIONS.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 500, color: "var(--text-2)", marginBottom: 6 }}>Year of Study</label>
                  <select className="input" value={editYear} onChange={e => setEditYear(e.target.value)} disabled={submitting} style={{ appearance: "none", cursor: "pointer" }}>
                    <option value="">Select year…</option>
                    {YEAR_OPTIONS.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1rem" }}>
                <button type="button" className="btn btn-ghost" onClick={() => setIsEditing(false)} disabled={submitting}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Real-time Teacher Mentor Profile Modal */}
      {profileModalUid && (() => {
        const relatedSession = sessions.find(s => s.mentorUid === profileModalUid);
        return (
          <TeacherMentorProfileModal
            teacherUid={profileModalUid}
            session={relatedSession}
            onClose={() => setProfileModalUid(null)}
          />
        );
      })()}

      {reschedulingSession && (
        <RescheduleRequestModal
          session={reschedulingSession}
          onClose={() => setReschedulingSession(null)}
        />
      )}

      <style>{`
        .dash-top-grid { display: grid; grid-template-columns: minmax(0, 1.5fr) minmax(0, 1fr); gap: 1.5rem; margin-bottom: 2rem; }
        @media (max-width: 768px) {
          .dash-top-grid { grid-template-columns: 1fr; }
        }
      `}</style>
      </div>
    </RouteGuard>
  );
}
