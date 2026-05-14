"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Star, Clock, BookOpen, CheckCircle, Calendar, Code2, Link2, Loader2, MessageSquarePlus, Lock } from "lucide-react";
import { getMentor, subscribeReviewsForMentor, hasUserReviewedMentor } from "@/lib/db";
import { Mentor, Review } from "@/types";
import { useAuthStore } from "@/store/authStore";

import SkillBadge from "@/components/SkillBadge";
import StarRating from "@/components/StarRating";
import RequestModal from "@/components/RequestModal";
import ReviewModal from "@/components/ReviewModal";
import Link from "next/link";
import toast from "react-hot-toast";
import { formatDistanceToNow } from "date-fns";

const DEMOS: Record<string, Mentor> = {
  demo1: { uid: "demo1", name: "Arjun Sharma", email: "", branch: "Computer Science", year: "4th Year", skills: ["DSA", "Competitive Programming", "C++", "Python", "Interview Prep"], bio: "Codeforces Specialist (Div. 1). 400+ problems on LeetCode. Helped 80+ juniors crack coding rounds at Google, Amazon, and Microsoft. I teach patterns, not solutions — so you can solve problems you've never seen before.", rating: 4.9, totalRatings: 47, totalSessions: 82, responseTimeHours: 3, isActive: true, availability: ["Weekday Evenings", "Weekend Mornings"], linkedIn: "#", github: "#", achievements: ["Codeforces Specialist", "Google Kickstart Top 500", "Mentored 80+ students"], createdAt: new Date() },
  demo2: { uid: "demo2", name: "Priya Nair", email: "", branch: "Information Technology", year: "Alumni", skills: ["Web Development", "React", "Node.js", "System Design", "Database"], bio: "SDE-2 at Swiggy. Previously at Razorpay. I'll review your code, guide your projects end-to-end, and prepare you for product company interviews.", rating: 4.8, totalRatings: 38, totalSessions: 61, responseTimeHours: 6, isActive: true, availability: ["Weekend Mornings", "Weekday Evenings"], linkedIn: "#", github: "#", achievements: ["SDE-2 at Swiggy", "Ex-Razorpay", "Open source contributor"], createdAt: new Date() },
  demo3: { uid: "demo3", name: "Rahul Verma", email: "", branch: "ECE", year: "4th Year", skills: ["Machine Learning", "Python", "Deep Learning", "Data Science"], bio: "Research intern at IIT Bombay. Kaggle Expert. Teaching ML from absolute zero — practical, project-based, no intimidating math to start.", rating: 4.7, totalRatings: 29, totalSessions: 44, responseTimeHours: 8, isActive: true, availability: ["Weekday Evenings"], linkedIn: "#", github: "#", achievements: ["Kaggle Expert", "IIT-B Research Intern"], createdAt: new Date() },
  demo4: { uid: "demo4", name: "Sneha Kulkarni", email: "", branch: "Computer Science", year: "Alumni", skills: ["Interview Prep", "Resume Building", "Linux", "DevOps", "Cloud Computing"], bio: "SRE at Google Singapore. Cleared 6 FAANG offers. I will transform your resume, run mock interviews, and share what hiring managers actually look for.", rating: 4.9, totalRatings: 61, totalSessions: 104, responseTimeHours: 4, isActive: true, availability: ["Weekend Evenings", "Weekend Mornings"], linkedIn: "#", github: "#", achievements: ["SRE at Google Singapore", "6 FAANG offers", "Top mentor 3 months"], createdAt: new Date() },
  demo5: { uid: "demo5", name: "Aditya Patel", email: "", branch: "Mathematics & Computing", year: "4th Year", skills: ["System Design", "Cloud Computing", "Java", "Database", "DevOps"], bio: "Built microservices handling 5M+ daily users at a startup. Will help you crack HLD and LLD system design at any company.", rating: 4.6, totalRatings: 22, totalSessions: 35, responseTimeHours: 12, isActive: true, availability: ["Weekday Mornings"], linkedIn: "#", github: "#", achievements: ["Startup founder", "AWS Certified Solutions Architect"], createdAt: new Date() },
  demo6: { uid: "demo6", name: "Kriti Singh", email: "", branch: "Information Technology", year: "3rd Year", skills: ["Open Source", "Git", "Linux", "Python", "Web Development"], bio: "GSoC 2024 contributor at Mozilla. Will guide you from zero to your first merged PR — and help you build a strong open source profile.", rating: 4.5, totalRatings: 18, totalSessions: 28, responseTimeHours: 2, isActive: true, availability: ["Anytime"], linkedIn: "#", github: "#", achievements: ["GSoC 2024 - Mozilla", "5+ open source projects merged"], createdAt: new Date() },
  demo7: { uid: "demo7", name: "Vikram Reddy", email: "", branch: "Computer Science", year: "4th Year", skills: ["GATE Preparation", "Aptitude", "Mathematics", "C++", "DSA"], bio: "AIR 87 in GATE CS 2024. Cleared BHEL, NTPC, BPCL. I know exactly what a structured GATE plan looks like — and how to execute it.", rating: 4.8, totalRatings: 34, totalSessions: 55, responseTimeHours: 5, isActive: true, availability: ["Weekday Mornings", "Weekend Mornings"], linkedIn: "#", github: "#", achievements: ["GATE AIR 87", "3 PSU offers"], createdAt: new Date() },
  demo8: { uid: "demo8", name: "Ananya Joshi", email: "", branch: "ECE", year: "Alumni", skills: ["Android Development", "Java", "Kotlin", "Networking"], bio: "Android developer at Flipkart. I made the ECE → SDE jump and will show you the exact path.", rating: 4.7, totalRatings: 26, totalSessions: 40, responseTimeHours: 7, isActive: false, availability: ["Weekend Mornings"], linkedIn: "#", github: "#", achievements: ["Android Dev at Flipkart", "ECE to SDE transition guide"], createdAt: new Date() },
};

const DEMO_REVIEWS: Review[] = [
  { id: "r1", sessionId: "s1", mentorId: "demo1", fromUserId: "u1", fromUserName: "Rohit M.", rating: 5, comment: "Arjun explained segment trees better than any YouTube video. Got placed at Amazon 3 months later.", createdAt: new Date(Date.now() - 7 * 86400000) },
  { id: "r2", sessionId: "s2", mentorId: "demo1", fromUserId: "u2", fromUserName: "Divya K.", rating: 5, comment: "Incredibly patient and structured. He gives homework and follows up. Rare quality in a mentor.", createdAt: new Date(Date.now() - 14 * 86400000) },
  { id: "r3", sessionId: "s3", mentorId: "demo1", fromUserId: "u3", fromUserName: "Siddharth P.", rating: 4, comment: "Very helpful for contest strategy. Would love more sessions specifically on DP optimization.", createdAt: new Date(Date.now() - 21 * 86400000) },
];

export default function MentorProfile() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();

  const isDemo = !!DEMOS[id as string];

  const [mentor, setMentor] = useState<Mentor | null>(DEMOS[id as string] || null);
  const [reviews, setReviews] = useState<Review[]>(id === "demo1" ? DEMO_REVIEWS : []);
  const [loading, setLoading] = useState(!isDemo);
  const [modal, setModal] = useState(false);
  const [reviewModal, setReviewModal] = useState(false);
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);
  const [checkingReview, setCheckingReview] = useState(false);

  // Load mentor + subscribe to realtime reviews
  useEffect(() => {
    if (isDemo) return; // skip real fetch for demo mentors

    let unsubReviews: (() => void) | null = null;
    let isMounted = true;

    const load = async () => {
      try {
        const data = await getMentor(id as string);
        if (isMounted && data) {
          setMentor(data);
          // Subscribe to realtime reviews for this mentor
          unsubReviews = subscribeReviewsForMentor(id as string, (r) => {
            if (isMounted) setReviews(r);
          });
        }
      } catch {
        // fall through to demo data if available
        if (isMounted && DEMOS[id as string]) {
          setMentor(DEMOS[id as string]);
          setReviews(id === "demo1" ? DEMO_REVIEWS : []);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    load();
    return () => {
      isMounted = false;
      unsubReviews?.();
    };
  }, [id, isDemo]);

  // Check if the logged-in user already reviewed this mentor
  useEffect(() => {
    if (!user || isDemo) return;
    setCheckingReview(true);
    hasUserReviewedMentor(user.uid, id as string)
      .then((already) => setAlreadyReviewed(already))
      .catch(() => {})
      .finally(() => setCheckingReview(false));
  }, [user, id, isDemo, reviews]); // re-check after reviews update (catches after submission)

  if (loading) return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh" }}>
      <Loader2 size={22} className="animate-spin" style={{ color: "var(--text-3)" }} />
    </div>
  );

  if (!mentor) return (
    <div style={{ textAlign: "center", padding: "5rem 1rem" }}>
      <p style={{ fontSize: "2rem", marginBottom: 12 }}>404</p>
      <p className="heading-sm" style={{ marginBottom: 16 }}>Mentor not found</p>
      <Link href="/mentors" className="btn btn-primary">Browse mentors</Link>
    </div>
  );

  const initials = mentor.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
  const responseLabel = mentor.responseTimeHours <= 4 ? "~4 hours" : mentor.responseTimeHours <= 12 ? "~12 hours" : "~1 day";

  // Average star render helper
  const avgRating = reviews.length > 0
    ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10
    : mentor.rating;

  const handleWriteReview = () => {
    if (!user) {
      toast("Please sign in to leave a review", { icon: "🔒" });
      router.push("/register");
      return;
    }
    if (user.uid === mentor.uid) {
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
      {/* Back */}
      <button onClick={() => router.back()} className="btn btn-ghost btn-sm"
        style={{ marginBottom: "1.5rem", display: "inline-flex", alignItems: "center", gap: 6, paddingLeft: 0 }}>
        <ArrowLeft size={14} /> Back
      </button>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 2.5fr", gap: "1.5rem", alignItems: "start" }} className="profile-grid">
        {/* ── Left sidebar ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem", position: "sticky", top: "5rem" }}>
          <div className="card" style={{ textAlign: "center" }}>
            {mentor.photoURL
              ? <img src={mentor.photoURL} alt={mentor.name} style={{ width: 72, height: 72, borderRadius: 14, objectFit: "cover", margin: "0 auto 0.75rem", display: "block", border: "1px solid var(--border)" }} />
              : <div style={{ width: 72, height: 72, borderRadius: 14, background: "var(--accent-dim)", border: "1px solid var(--accent-border)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 0.75rem", fontSize: "1.25rem", fontWeight: 700, color: "#a78bfa" }}>{initials}</div>
            }

            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5, marginBottom: 2 }}>
              {mentor.isActive && <><span className="online-dot" /><span style={{ fontSize: "0.72rem", color: "#22c55e" }}>Available</span></>}
            </div>

            <p style={{ fontWeight: 700, fontSize: "1rem", color: "var(--text-1)", marginBottom: 2 }}>{mentor.name}</p>
            <p style={{ fontSize: "0.78rem", color: "var(--text-2)" }}>{mentor.branch} · {mentor.year}</p>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5, margin: "0.6rem 0" }}>
              <StarRating rating={avgRating} size={13} />
              <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-1)" }}>
                {avgRating > 0 ? avgRating.toFixed(1) : "New"}
              </span>
              {reviews.length > 0 && <span style={{ fontSize: "0.72rem", color: "var(--text-3)" }}>({reviews.length})</span>}
            </div>

            <button
              id="request-help-btn"
              onClick={() => {
                if (!user) { toast("Please sign in to request help", { icon: "🔒" }); router.push("/register"); return; }
                if (user.role === "mentor") { toast.error("Mentors can't send requests"); return; }
                setModal(true);
              }}
              className="btn btn-primary" style={{ width: "100%", marginTop: "0.75rem" }}
            >
              Request help
            </button>

            {/* Write a Review button */}
            {!isDemo && (
              <button
                id="write-review-btn"
                onClick={handleWriteReview}
                className={`btn ${alreadyReviewed ? "btn-ghost" : "btn-secondary"}`}
                style={{ width: "100%", marginTop: "0.5rem", position: "relative" }}
                disabled={checkingReview}
              >
                {checkingReview
                  ? <Loader2 size={14} className="animate-spin" />
                  : alreadyReviewed
                    ? <><Lock size={13} /> Reviewed</>
                    : <><MessageSquarePlus size={14} /> Write a Review</>
                }
              </button>
            )}

            {(mentor.github || mentor.linkedIn) && (
              <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: "0.75rem" }}>
                {mentor.github && <a href={mentor.github} className="btn btn-secondary btn-sm"><Code2 size={13} /></a>}
                {mentor.linkedIn && <a href={mentor.linkedIn} className="btn btn-secondary btn-sm"><Link2 size={13} /></a>}
              </div>
            )}
          </div>

          {/* Quick stats */}
          <div className="card" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            {[
              { icon: BookOpen, value: mentor.totalSessions, label: "Sessions" },
              { icon: Star, value: reviews.length || mentor.totalRatings, label: "Reviews" },
              { icon: Clock, value: responseLabel, label: "Response" },
              { icon: CheckCircle, value: mentor.isActive ? "Active" : "Offline", label: "Status" },
            ].map(stat => (
              <div key={stat.label} style={{ textAlign: "center", padding: "0.5rem", borderRadius: 8, background: "var(--bg-elevated)" }}>
                <stat.icon size={13} style={{ color: "var(--text-3)", marginBottom: 3 }} />
                <p style={{ fontWeight: 700, fontSize: "0.85rem", color: "var(--text-1)" }}>{stat.value}</p>
                <p style={{ fontSize: "0.68rem", color: "var(--text-3)" }}>{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Availability */}
          {mentor.availability?.length > 0 && (
            <div className="card">
              <p style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-2)", marginBottom: 8 }}>Availability</p>
              {mentor.availability.map(slot => (
                <div key={slot} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.78rem", color: "var(--text-2)", marginBottom: 5 }}>
                  <CheckCircle size={11} style={{ color: "#22c55e", flexShrink: 0 }} /> {slot}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Main content ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div className="card">
            <p style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-2)", marginBottom: 8 }}>About</p>
            <p style={{ fontSize: "0.875rem", color: "var(--text-1)", lineHeight: 1.7 }}>{mentor.bio}</p>
          </div>

          <div className="card">
            <p style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-2)", marginBottom: 10 }}>Skills</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
              {mentor.skills.map(s => <SkillBadge key={s} skill={s} />)}
            </div>
          </div>

          {mentor.achievements && mentor.achievements.length > 0 && (
            <div className="card">
              <p style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-2)", marginBottom: 10 }}>Achievements</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {mentor.achievements.map(a => (
                  <div key={a} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.82rem", color: "var(--text-1)" }}>
                    <span style={{ color: "#f59e0b" }}>◆</span> {a}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Reviews section ── */}
          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: reviews.length ? 14 : 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <p style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-2)" }}>
                  Reviews
                </p>
                {reviews.length > 0 && (
                  <span style={{ fontSize: "0.72rem", color: "var(--text-3)", background: "var(--bg-elevated)", padding: "0.1rem 0.5rem", borderRadius: 20 }}>
                    {reviews.length}
                  </span>
                )}
                {reviews.length > 0 && (
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <Star size={12} fill="#f59e0b" color="#f59e0b" />
                    <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#f59e0b" }}>{avgRating.toFixed(1)}</span>
                  </div>
                )}
              </div>

              {/* Write review — also accessible from reviews section header */}
              {!isDemo && (
                <button
                  id="write-review-header-btn"
                  onClick={handleWriteReview}
                  className="btn btn-secondary btn-sm"
                  disabled={checkingReview || alreadyReviewed}
                  style={{ fontSize: "0.75rem" }}
                >
                  {checkingReview
                    ? <Loader2 size={12} className="animate-spin" />
                    : alreadyReviewed
                      ? <><Lock size={12} /> Reviewed</>
                      : <><MessageSquarePlus size={12} /> Write a Review</>
                  }
                </button>
              )}
            </div>

            {reviews.length === 0 ? (
              <div style={{ textAlign: "center", padding: "1.5rem 0", color: "var(--text-3)" }}>
                <MessageSquarePlus size={28} style={{ margin: "0 auto 8px", opacity: 0.4 }} />
                <p style={{ fontSize: "0.85rem" }}>No reviews yet — be the first to leave one!</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
                {reviews.map(r => (
                  <div
                    key={r.id}
                    style={{
                      paddingBottom: "0.875rem", borderBottom: "1px solid var(--border)",
                      animation: "fadeInUp 0.3s ease",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6, gap: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        {/* Reviewer avatar */}
                        <div style={{
                          width: 30, height: 30, borderRadius: "50%",
                          background: "var(--accent-dim)", border: "1px solid var(--accent-border)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: "0.72rem", fontWeight: 700, color: "#a78bfa", flexShrink: 0,
                        }}>
                          {r.fromUserName[0].toUpperCase()}
                        </div>
                        <div>
                          <span style={{ fontWeight: 600, fontSize: "0.82rem", color: "var(--text-1)" }}>{r.fromUserName}</span>
                          <p style={{ fontSize: "0.68rem", color: "var(--text-3)" }}>
                            {formatDistanceToNow(new Date(r.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                      <StarRating rating={r.rating} size={12} />
                    </div>
                    <p style={{ fontSize: "0.82rem", color: "var(--text-2)", lineHeight: 1.6, paddingLeft: 38 }}>
                      &quot;{r.comment}&quot;
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {modal && <RequestModal mentor={mentor} onClose={() => setModal(false)} />}
      {reviewModal && (
        <ReviewModal
          mentor={mentor}
          onClose={() => setReviewModal(false)}
          onSuccess={() => setAlreadyReviewed(true)}
        />
      )}

      <style>{`
        @media (max-width: 768px) { .profile-grid { grid-template-columns: 1fr !important; } }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
