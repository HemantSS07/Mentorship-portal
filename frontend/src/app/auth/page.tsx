"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import Link from "next/link";

export default function AuthLandingPage() {
  const router = useRouter();
  const { user, loading } = useAuthStore();

  useEffect(() => {
    if (!loading && user) {
      router.replace(
        user.role === "mentor" ? "/mentor-dashboard" :
        user.role === "teacher_mentor" ? "/teacher-dashboard" :
        "/dashboard"
      );
    }
  }, [user, loading, router]);

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "2rem 1rem",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Animated background */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(124,58,237,0.12) 0%, transparent 65%)",
      }} />
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        backgroundImage: "radial-gradient(rgba(255,255,255,0.025) 1px, transparent 1px)",
        backgroundSize: "28px 28px",
      }} />

      <div style={{ width: "100%", maxWidth: 560, position: "relative", zIndex: 1 }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }} className="anim-1">
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 10,
            background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.25)",
            borderRadius: 99, padding: "0.4rem 1rem", marginBottom: "1.25rem",
          }}>
            <span style={{ fontSize: "0.75rem", color: "#a78bfa", fontWeight: 600, letterSpacing: "0.05em" }}>
              🎓 MINI MENTORSHIP PORTAL
            </span>
          </div>
          <h1 className="heading-lg" style={{ marginBottom: "0.5rem" }}>
            Welcome Back!
          </h1>
          <p className="text-muted" style={{ fontSize: "0.9rem", lineHeight: 1.6 }}>
            Choose how you&apos;d like to continue today
          </p>
        </div>

        {/* Role Selection Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.875rem", marginBottom: "2rem" }} className="anim-2 role-grid">
          {/* User / Junior Card */}
          <button
            onClick={() => router.push("/auth/user")}
            style={{
              padding: "1.75rem 1.25rem",
              borderRadius: 16,
              textAlign: "center",
              border: "1px solid var(--border)",
              background: "var(--bg-card)",
              cursor: "pointer",
              transition: "all 0.25s cubic-bezier(0.4,0,0.2,1)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "0.875rem",
              position: "relative",
              overflow: "hidden",
            }}
            className="auth-role-card"
            id="btn-continue-as-user"
          >
            <div style={{
              position: "absolute", inset: 0, opacity: 0,
              background: "radial-gradient(ellipse 80% 80% at 50% 0%, rgba(124,58,237,0.08) 0%, transparent 70%)",
              transition: "opacity 0.25s",
              pointerEvents: "none",
            }} className="card-glow" />
            <div style={{
              width: 56, height: 56, borderRadius: "50%",
              background: "rgba(124,58,237,0.12)",
              border: "1px solid rgba(124,58,237,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#a78bfa", flexShrink: 0,
              transition: "all 0.25s",
            }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text-1)", marginBottom: 3 }}>
                Continue as User
              </div>
              <div style={{ fontSize: "0.72rem", color: "var(--text-3)", lineHeight: 1.5 }}>
                Junior · Learner · Mentee
              </div>
              <div style={{ fontSize: "0.68rem", color: "var(--text-3)", marginTop: 5, lineHeight: 1.5 }}>
                Find guidance and connect with mentors
              </div>
            </div>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              background: "rgba(124,58,237,0.1)", borderRadius: 99,
              padding: "0.25rem 0.7rem",
              fontSize: "0.68rem", fontWeight: 600, color: "#a78bfa",
              border: "1px solid rgba(124,58,237,0.2)",
            }}>
              Get Started →
            </div>
          </button>

          {/* Student Mentor Card */}
          <button
            onClick={() => router.push("/auth/mentor")}
            style={{
              padding: "1.75rem 1.25rem",
              borderRadius: 16,
              textAlign: "center",
              border: "1px solid var(--border)",
              background: "var(--bg-card)",
              cursor: "pointer",
              transition: "all 0.25s cubic-bezier(0.4,0,0.2,1)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "0.875rem",
              position: "relative",
              overflow: "hidden",
            }}
            className="auth-role-card"
            id="btn-continue-as-mentor"
          >
            <div style={{
              position: "absolute", inset: 0, opacity: 0,
              background: "radial-gradient(ellipse 80% 80% at 50% 0%, rgba(34,197,94,0.07) 0%, transparent 70%)",
              transition: "opacity 0.25s",
              pointerEvents: "none",
            }} className="card-glow" />
            <div style={{
              width: 56, height: 56, borderRadius: "50%",
              background: "rgba(34,197,94,0.1)",
              border: "1px solid rgba(34,197,94,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#22c55e", flexShrink: 0,
              transition: "all 0.25s",
            }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text-1)", marginBottom: 3 }}>
                Student Mentor
              </div>
              <div style={{ fontSize: "0.72rem", color: "var(--text-3)", lineHeight: 1.5 }}>
                Guide · Teach · Inspire
              </div>
              <div style={{ fontSize: "0.68rem", color: "var(--text-3)", marginTop: 5, lineHeight: 1.5 }}>
                Share knowledge and help juniors grow
              </div>
            </div>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              background: "rgba(34,197,94,0.1)", borderRadius: 99,
              padding: "0.25rem 0.7rem",
              fontSize: "0.68rem", fontWeight: 600, color: "#22c55e",
              border: "1px solid rgba(34,197,94,0.2)",
            }}>
              Get Started →
            </div>
          </button>

          {/* Teacher Mentor Card */}
          <button
            onClick={() => router.push("/auth/teacher")}
            style={{
              padding: "1.75rem 1.25rem",
              borderRadius: 16,
              textAlign: "center",
              border: "1px solid rgba(245,158,11,0.25)",
              background: "linear-gradient(145deg, var(--bg-card), rgba(245,158,11,0.04))",
              cursor: "pointer",
              transition: "all 0.25s cubic-bezier(0.4,0,0.2,1)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "0.875rem",
              position: "relative",
              overflow: "hidden",
            }}
            className="auth-role-card"
            id="btn-continue-as-teacher"
          >
            <div style={{
              position: "absolute", inset: 0, opacity: 0,
              background: "radial-gradient(ellipse 80% 80% at 50% 0%, rgba(245,158,11,0.1) 0%, transparent 70%)",
              transition: "opacity 0.25s",
              pointerEvents: "none",
            }} className="card-glow" />
            {/* Verified badge */}
            <div style={{
              position: "absolute", top: 10, right: 10,
              background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.35)",
              borderRadius: 99, padding: "0.15rem 0.55rem",
              fontSize: "0.6rem", fontWeight: 700, color: "#f59e0b", letterSpacing: "0.04em",
            }}>✓ FACULTY</div>
            <div style={{
              width: 56, height: 56, borderRadius: "50%",
              background: "rgba(245,158,11,0.12)",
              border: "1px solid rgba(245,158,11,0.3)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#f59e0b", flexShrink: 0,
              transition: "all 0.25s",
            }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                <path d="M6 12v5c3 3 9 3 12 0v-5"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text-1)", marginBottom: 3 }}>
                Teacher Mentor
              </div>
              <div style={{ fontSize: "0.72rem", color: "rgba(245,158,11,0.8)", lineHeight: 1.5 }}>
                Faculty · Professor · Expert
              </div>
              <div style={{ fontSize: "0.68rem", color: "var(--text-3)", marginTop: 5, lineHeight: 1.5 }}>
                Verified faculty mentoring students
              </div>
            </div>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              background: "rgba(245,158,11,0.12)", borderRadius: 99,
              padding: "0.25rem 0.7rem",
              fontSize: "0.68rem", fontWeight: 600, color: "#f59e0b",
              border: "1px solid rgba(245,158,11,0.3)",
            }}>
              Join as Faculty →
            </div>
          </button>
        </div>

        {/* Footer note */}
        <div className="anim-3" style={{ textAlign: "center" }}>
          <p style={{ fontSize: "0.78rem", color: "var(--text-3)" }}>
            Already know where you&apos;re headed?{" "}
            <Link href="/auth/user" style={{ color: "#a78bfa", textDecoration: "none", fontWeight: 500 }}>User Login</Link>
            {" · "}
            <Link href="/auth/mentor" style={{ color: "#22c55e", textDecoration: "none", fontWeight: 500 }}>Student Mentor</Link>
            {" · "}
            <Link href="/auth/teacher" style={{ color: "#f59e0b", textDecoration: "none", fontWeight: 500 }}>Teacher Mentor</Link>
          </p>
        </div>
      </div>

      <style>{`
        .auth-role-card:hover {
          border-color: rgba(255,255,255,0.12) !important;
          transform: translateY(-3px) !important;
          box-shadow: 0 8px 32px rgba(0,0,0,0.4) !important;
        }
        .auth-role-card:hover .card-glow {
          opacity: 1 !important;
        }
        #btn-continue-as-teacher:hover {
          border-color: rgba(245,158,11,0.4) !important;
          box-shadow: 0 8px 32px rgba(245,158,11,0.15) !important;
        }
        @media (max-width: 640px) {
          .role-grid { grid-template-columns: 1fr !important; }
          .auth-role-card { padding: 1.25rem 1rem !important; }
        }
        @media (min-width: 641px) and (max-width: 900px) {
          .role-grid { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>
    </div>
  );
}
