"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, ArrowRight, Zap, Star, Clock, CheckCircle, Users, BookOpen } from "lucide-react";
import { getAllMentors } from "@/lib/db";
import { matchMentors, preSolveQuery } from "@/lib/aiMatcher";
import { Mentor } from "@/types";
import MentorCard from "@/components/MentorCard";

const DEMO_MENTORS: Mentor[] = [
  { uid: "demo1", name: "Arjun Sharma", email: "", branch: "Computer Science", year: "4th Year", skills: ["DSA", "Competitive Programming", "C++", "Interview Prep"], bio: "Codeforces Specialist. Helped 80+ juniors crack Google, Amazon, and Microsoft coding rounds. I teach patterns, not solutions.", rating: 4.9, totalRatings: 47, totalSessions: 82, responseTimeHours: 3, isActive: true, availability: ["Weekday Evenings"], createdAt: new Date() },
  { uid: "demo2", name: "Priya Nair", email: "", branch: "Information Technology", year: "Alumni", skills: ["Web Development", "React", "Node.js", "System Design"], bio: "SDE-2 at Swiggy. Passionate about helping juniors build production-grade projects and crack product companies.", rating: 4.8, totalRatings: 38, totalSessions: 61, responseTimeHours: 6, isActive: true, availability: ["Weekend Mornings"], createdAt: new Date() },
  { uid: "demo3", name: "Sneha Kulkarni", email: "", branch: "Computer Science", year: "Alumni", skills: ["Interview Prep", "Resume Building", "Linux", "DevOps"], bio: "SRE at Google Singapore. Cleared 6 FAANG offers. I will fix your resume, mock interview you, and tell you what actually matters.", rating: 4.9, totalRatings: 61, totalSessions: 104, responseTimeHours: 4, isActive: true, availability: ["Weekend Evenings"], createdAt: new Date() },
];

const QUICK_SKILLS = ["DSA", "Web Development", "Machine Learning", "System Design", "Interview Prep", "Linux", "DevOps", "Open Source"];

const STATS = [
  { value: "500+", label: "Active mentors" },
  { value: "2,000+", label: "Sessions done" },
  { value: "4.8★", label: "Avg rating" },
  { value: "<4h", label: "Avg response" },
];

const HOW_IT_WORKS = [
  { icon: Search, step: "01", title: "Search", desc: "Find mentors by skill, branch, or topic in seconds." },
  { icon: CheckCircle, step: "02", title: "Request", desc: "Send a structured request describing exactly what you need." },
  { icon: Clock, step: "03", title: "Book", desc: "Schedule a 1-on-1 session at a time that works for both." },
  { icon: Star, step: "04", title: "Review", desc: "Rate your session and help others find great mentors." },
];

export default function HomePage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [mentors, setMentors] = useState<Mentor[]>(DEMO_MENTORS);
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);

  useEffect(() => {
    getAllMentors().then(d => { if (d.length > 0) setMentors(d); }).catch(() => {});
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) { router.push("/mentors"); return; }
    const ans = preSolveQuery(query);
    if (ans) setAiAnswer(ans);
    router.push(`/mentors?q=${encodeURIComponent(query)}`);
  };

  return (
    <main>
      {/* ── Hero ── */}
      <section className="dot-grid" style={{ position: "relative", paddingTop: "6rem", paddingBottom: "5rem" }}>
        <div className="hero-bg" />
        <div className="page-wrap" style={{ position: "relative", zIndex: 1 }}>
          <div className="anim-1" style={{ maxWidth: 680, marginLeft: "auto", marginRight: "auto", textAlign: "center" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "0.3rem 0.9rem", borderRadius: 99, border: "1px solid var(--accent-border)", background: "var(--accent-dim)", color: "#a78bfa", fontSize: "0.78rem", fontWeight: 500, marginBottom: "1.5rem" }}>
              <Zap size={12} /> AI-Powered Mentor Matching
            </div>

            <h1 className="heading-xl" style={{ marginBottom: "1rem" }}>
              Find the right mentor<br />
              <span className="text-gradient">in seconds, not days</span>
            </h1>

            <p style={{ fontSize: "1rem", color: "var(--text-2)", lineHeight: 1.7, maxWidth: 500, margin: "0 auto 2.5rem" }}>
              Structured mentorship for DSA, placements, web dev &amp; more —
              faster and more reliable than WhatsApp groups.
            </p>

            {/* Search bar & CTA */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", alignItems: "center", marginBottom: "2.5rem" }}>
              <form onSubmit={handleSearch} style={{ width: "100%" }}>
                <div style={{
                  display: "flex", gap: 8, maxWidth: 520, margin: "0 auto",
                  background: "var(--bg-card)", border: "1px solid var(--border)",
                  borderRadius: 12, padding: 5,
                }}>
                  <div style={{ position: "relative", flex: 1 }}>
                    <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-3)", pointerEvents: "none" }} />
                    <input
                      value={query} onChange={e => setQuery(e.target.value)}
                      placeholder="Search — DSA, placement prep, web dev…"
                      style={{ width: "100%", background: "transparent", border: "none", outline: "none", paddingLeft: 34, paddingRight: 8, height: 38, color: "var(--text-1)", fontSize: "0.875rem", fontFamily: "inherit" }}
                    />
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 6 }}>
                    Search <ArrowRight size={14} />
                  </button>
                </div>
              </form>

              <div style={{ display: "flex", gap: "1rem" }}>
                <Link href="/auth" className="btn btn-primary" style={{ padding: "0.75rem 2rem", fontSize: "0.9rem", boxShadow: "0 4px 15px rgba(124,58,237,0.3)" }}>
                  Get Started for Free
                </Link>
                <Link href="/mentors" className="btn btn-secondary" style={{ padding: "0.75rem 1.5rem", fontSize: "0.9rem" }}>
                  Browse Mentors
                </Link>
              </div>
            </div>

            {/* AI Quick Answer */}
            {aiAnswer && (
              <div className="card anim-1" style={{ maxWidth: 520, margin: "0 auto 1.5rem", textAlign: "left" }}>
                <p style={{ fontSize: "0.7rem", fontWeight: 700, color: "#a78bfa", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
                  ✦ AI Quick Answer
                </p>
                <p style={{ fontSize: "0.82rem", color: "var(--text-2)", lineHeight: 1.65 }}>{aiAnswer}</p>
                <button onClick={() => setAiAnswer(null)} style={{ fontSize: "0.72rem", color: "var(--text-3)", marginTop: 8, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                  Dismiss
                </button>
              </div>
            )}

            {/* Quick skill pills */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center" }}>
              {QUICK_SKILLS.map(s => (
                <button key={s} onClick={() => router.push(`/mentors?skill=${encodeURIComponent(s)}`)}
                  className="badge" style={{ cursor: "pointer", padding: "0.3rem 0.8rem", fontSize: "0.78rem" }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats strip ── */}
      <section style={{ borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)", background: "var(--bg-card)" }}>
        <div className="page-wrap" style={{ paddingTop: "1.5rem", paddingBottom: "1.5rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem", textAlign: "center" }} className="stats-grid">
            {STATS.map(s => (
              <div key={s.label}>
                <p style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--text-1)", letterSpacing: "-0.02em", lineHeight: 1 }}>{s.value}</p>
                <p style={{ fontSize: "0.78rem", color: "var(--text-2)", marginTop: 5 }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured Mentors ── */}
      <section style={{ paddingTop: "4rem", paddingBottom: "4rem" }}>
        <div className="page-wrap">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "1.75rem" }}>
            <div>
              <p style={{ fontSize: "0.72rem", fontWeight: 700, color: "#a78bfa", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 5 }}>
                Top rated
              </p>
              <h2 className="heading-lg">Featured mentors</h2>
            </div>
            <Link href="/mentors" className="btn btn-secondary btn-sm" style={{ display: "flex", alignItems: "center", gap: 6 }}>
              View all <ArrowRight size={13} />
            </Link>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" }} className="mentor-grid">
            {mentors.slice(0, 3).map(m => <MentorCard key={m.uid} mentor={m} />)}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" style={{ borderTop: "1px solid var(--border)", background: "var(--bg-card)", paddingTop: "4rem", paddingBottom: "4rem" }}>
        <div className="page-wrap">
          <div style={{ textAlign: "center", marginBottom: "3rem" }}>
            <p style={{ fontSize: "0.72rem", fontWeight: 700, color: "#a78bfa", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 5 }}>Simple process</p>
            <h2 className="heading-lg">How it works</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1.5rem" }} className="how-grid">
            {HOW_IT_WORKS.map(step => (
              <div key={step.title}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "0.875rem" }}>
                  <div style={{ width: 34, height: 34, borderRadius: 9, background: "var(--accent-dim)", border: "1px solid var(--accent-border)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <step.icon size={15} style={{ color: "#a78bfa" }} />
                  </div>
                  <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--text-3)", letterSpacing: "0.05em" }}>STEP {step.step}</span>
                </div>
                <p style={{ fontWeight: 600, fontSize: "0.9rem", marginBottom: 6 }}>{step.title}</p>
                <p style={{ fontSize: "0.8rem", color: "var(--text-2)", lineHeight: 1.6 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ paddingTop: "4rem", paddingBottom: "4rem" }}>
        <div className="page-wrap">
          <div className="card" style={{ textAlign: "center", padding: "3rem 2rem", maxWidth: 560, margin: "0 auto" }}>
            <Users size={28} style={{ color: "#a78bfa", marginBottom: "0.875rem" }} />
            <h2 className="heading-md" style={{ marginBottom: 8 }}>Share your knowledge</h2>
            <p style={{ fontSize: "0.875rem", color: "var(--text-2)", lineHeight: 1.65, marginBottom: "1.75rem" }}>
              Register as a mentor, build your profile, and help juniors navigate
              college and placements. Takes under 5 minutes.
            </p>
            <Link href="/register" className="btn btn-primary btn-lg" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              Become a mentor <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>

      <style>{`
        @media (max-width: 900px) {
          .mentor-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .how-grid    { grid-template-columns: repeat(2, 1fr) !important; }
          .stats-grid  { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 560px) {
          .mentor-grid { grid-template-columns: 1fr !important; }
          .how-grid    { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </main>
  );
}
