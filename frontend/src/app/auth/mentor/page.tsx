"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { getUser, createUser, createMentor } from "@/lib/db";
import { BRANCH_OPTIONS, YEAR_OPTIONS, SKILL_OPTIONS } from "@/types";
import SkillBadge from "@/components/SkillBadge";
import toast from "react-hot-toast";
import Link from "next/link";
import { Eye, EyeOff, Loader2, ArrowLeft } from "lucide-react";

const RESEND_COOLDOWN = 60;

function getPasswordStrength(pw: string) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score;
}
function strengthLabel(s: number) {
  if (s <= 1) return { label: "Too weak", color: "#ef4444" };
  if (s === 2) return { label: "Weak", color: "#f97316" };
  if (s === 3) return { label: "Fair", color: "#eab308" };
  if (s === 4) return { label: "Strong", color: "#22c55e" };
  return { label: "Very strong", color: "#10b981" };
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}
function isGmail(email: string) {
  return email.trim().toLowerCase().endsWith("@gmail.com");
}

function PasswordInput({
  value, onChange, id, showStrength = false,
}: {
  value: string; onChange: (v: string) => void; id: string; showStrength?: boolean;
}) {
  const [show, setShow] = useState(false);
  const strength = getPasswordStrength(value);
  const { label, color } = strengthLabel(strength);

  return (
    <div>
      <div style={{ position: "relative" }}>
        <input
          id={id}
          type={show ? "text" : "password"}
          className="input"
          placeholder="••••••••"
          value={value}
          onChange={e => onChange(e.target.value)}
          style={{ paddingRight: "2.5rem" }}
        />
        <button
          type="button"
          onClick={() => setShow(s => !s)}
          style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", padding: 2, display: "flex", alignItems: "center" }}
          tabIndex={-1}
          aria-label={show ? "Hide password" : "Show password"}
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
      {showStrength && value.length > 0 && (
        <div style={{ marginTop: 6 }}>
          <div style={{ display: "flex", gap: 3, marginBottom: 3 }}>
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} style={{ flex: 1, height: 3, borderRadius: 99, background: i <= strength ? color : "var(--border)", transition: "background 0.2s" }} />
            ))}
          </div>
          <p style={{ fontSize: "0.7rem", color }}>{label}</p>
        </div>
      )}
    </div>
  );
}

export default function MentorAuthPage() {
  const router = useRouter();
  const { setUser, user, loading: authLoading } = useAuthStore();
  const [tab, setTab] = useState<"signin" | "register">("signin");



  const [siEmail, setSiEmail] = useState("");
  const [siPassword, setSiPassword] = useState("");
  const [siLoading, setSiLoading] = useState(false);
  const [unconfirmedEmail, setUnconfirmedEmail] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (resendCooldown <= 0) { if (cooldownRef.current) clearInterval(cooldownRef.current); return; }
    cooldownRef.current = setInterval(() => {
      setResendCooldown(p => { if (p <= 1) { clearInterval(cooldownRef.current!); return 0; } return p - 1; });
    }, 1000);
    return () => { if (cooldownRef.current) clearInterval(cooldownRef.current); };
  }, [resendCooldown]);

  const [regName, setRegName]       = useState("");
  const [regAge, setRegAge]         = useState("");
  const [regDob, setRegDob]         = useState("");
  const [regEmail, setRegEmail]     = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regBranch, setRegBranch]   = useState("");
  const [regYear, setRegYear]       = useState("");
  const [regSkills, setRegSkills]   = useState<string[]>([]);
  const [regBio, setRegBio]         = useState("");
  const [contactMethod, setContactMethod] = useState("email");
  const [contactValue, setContactValue]   = useState("");
  const [isActive, setIsActive]     = useState(true);
  const [regLoading, setRegLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && user && !siLoading && !regLoading) {
      console.log("[MentorAuth] User already logged in, role:", user.role);
      if (user.role === "teacher_mentor") router.replace("/teacher-dashboard");
      else if (user.role === "mentor") router.replace("/mentor-dashboard");
      else router.replace("/dashboard");
    }
  }, [user, authLoading, router, siLoading, regLoading]);

  const toggleSkill = (s: string) => setRegSkills(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s].slice(0, 8));

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("[MentorSignIn] Attempting sign-in for", siEmail);
    if (!siEmail || !siPassword) return toast.error("Please fill in all fields.");
    if (!isValidEmail(siEmail)) return toast.error("Please enter a valid email address.");

    setSiLoading(true);
    const supabaseEnabled = isSupabaseConfigured();

    if (!supabaseEnabled) {
      console.warn("[MentorSignIn] Supabase not configured. Using Demo Mode.");
      setTimeout(() => {
        setUser({ uid: "demo_mentor_123", name: "Demo Mentor", email: siEmail, role: "mentor", branch: "CS", year: "3rd Year", createdAt: new Date() });
        toast.success("Logged in successfully (Demo)");
        router.push("/mentor-dashboard");
        setSiLoading(false);
      }, 150);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email: siEmail, password: siPassword });
      if (error) {
        console.error("[MentorSignIn] Supabase Auth error:", error);
        throw error;
      }
      if (!data.user) throw new Error("Sign-in failed.");

      console.log("[MentorSignIn] Auth success, fetching profile for UID", data.user.id);
      const profile = await getUser(data.user.id);
      
      if (!profile) {
        console.warn("[MentorSignIn] Profile not found in database for", data.user.id);
        toast.error("Profile not found. Please register as a Mentor.");
        return;
      }
      if (profile.role !== "mentor") {
        console.warn("[MentorSignIn] User is not a Mentor. Role:", profile.role);
        await supabase.auth.signOut();
        useAuthStore.getState().setUser(null);
        toast.error("Access denied: Please log in using the correct portal.");
        return;
      }
      
      setUser(profile);
      toast.success("Welcome back, Mentor! 🌟");
      router.push("/mentor-dashboard");
    } catch (err: any) {
      console.error("[MentorSignIn] General error:", err);
      const msg: string = err?.message ?? String(err);
      const lower = msg.toLowerCase();
      if (lower.includes("email not confirmed") || lower.includes("confirm")) {
        setUnconfirmedEmail(siEmail);
        toast.error("Please confirm your email first.");
      } else if (msg.includes("Invalid login credentials") || lower.includes("invalid credentials")) {
        toast.error("Incorrect email or password.");
      } else {
        toast.error(msg || "Sign-in failed.");
      }
    } finally {
      setSiLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("[MentorRegister] Attempting registration for", regEmail);
    if (!regName.trim()) return toast.error("Full name is required.");
    if (!regBranch) return toast.error("Please select your branch.");
    if (!regYear) return toast.error("Please select your year of study.");
    if (!regEmail || !isValidEmail(regEmail)) return toast.error("Valid Gmail is required.");
    if (!regPassword || regPassword.length < 8) return toast.error("Password too short.");

    setRegLoading(true);
    const supabaseEnabled = isSupabaseConfigured();

    if (!supabaseEnabled) {
      console.warn("[MentorRegister] Supabase not configured. Using Demo Mode.");
      setTimeout(() => {
        const u = { uid: "demo_mentor_" + Date.now(), name: regName, email: regEmail, role: "mentor" as const, branch: regBranch, year: regYear, createdAt: new Date() };
        setUser(u);
        toast.success("Mentor account created! (Demo)");
        router.push("/mentor-dashboard");
        setRegLoading(false);
      }, 150);
      return;
    }

    try {
      console.log("[MentorRegister] Calling Supabase signUp");
      const { data, error } = await supabase.auth.signUp({ email: regEmail, password: regPassword, options: { data: { full_name: regName } } });
      if (error) {
        console.error("[MentorRegister] Supabase Auth error:", error);
        throw error;
      }
      if (!data.user) throw new Error("Could not create account.");
      const uid = data.user.id;
      console.log("[MentorRegister] Auth success, UID:", uid);

      if (!data.session) {
        console.log("[MentorRegister] No session, attempting auto-signin");
        const { data: si, error: sie } = await supabase.auth.signInWithPassword({ email: regEmail, password: regPassword });
        if (sie || !si.session) {
          console.warn("[MentorRegister] Auto-signin failed. Email confirmation probably required.");
          toast.success("Account created! Please check your email to confirm, then log in.");
          router.push("/auth/mentor");
          setRegLoading(false);
          return;
        }
      }

      console.log("[MentorRegister] Creating base profile in users table...");
      const newUser = { uid, name: regName, email: regEmail, role: "mentor" as const, age: Number(regAge), dob: regDob, branch: regBranch, year: regYear, createdAt: new Date() };
      await createUser(newUser);

      console.log("[MentorRegister] Creating detailed profile in mentors table...");
      const mentorPayload = {
        uid, name: regName, email: regEmail, role: "mentor" as const,
        age: Number(regAge), dob: regDob, branch: regBranch, year: regYear,
        skills: regSkills, bio: regBio.trim(),
        contactMethod, contactValue: contactValue.trim(),
        availability: ["Anytime"],
        rating: 0, totalRatings: 0, totalSessions: 0, responseTimeHours: 24,
        isActive,
      };
      await createMentor(mentorPayload);
      console.log("[MentorRegister] Profiles created successfully.");

      setUser(newUser);
      toast.success("Welcome aboard, Mentor! 🌟");
      router.push("/mentor-dashboard");
    } catch (err: any) {
      console.error("[MentorRegister] General error:", err);
      const msg: string = err?.message ?? "";
      if (msg.toLowerCase().includes("rate limit") || (err as any)?.status === 429) {
        toast.error("Too many signup attempts. Please wait.");
      } else {
        toast.error(msg || "Registration failed.");
      }
    } finally {
      setRegLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "5rem 1rem 3rem", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(34,197,94,0.08) 0%, transparent 70%)" }} />
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", backgroundImage: "radial-gradient(rgba(255,255,255,0.025) 1px, transparent 1px)", backgroundSize: "28px 28px" }} />

      <div style={{ width: "100%", maxWidth: tab === "register" ? 560 : 460, position: "relative", zIndex: 1, transition: "max-width 0.3s ease" }}>
        <div className="anim-1" style={{ marginBottom: "1.5rem" }}>
          <Link href="/auth" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--text-2)", textDecoration: "none", fontSize: "0.82rem", fontWeight: 500 }}>
            <ArrowLeft size={14} /> Back to selection
          </Link>
        </div>

        <div className="anim-1" style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 99, padding: "0.35rem 1rem", marginBottom: "0.75rem" }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e" }} />
            <span style={{ fontSize: "0.72rem", color: "#22c55e", fontWeight: 600, letterSpacing: "0.05em" }}>MENTOR · GUIDE</span>
          </div>
          <h1 className="heading-lg" style={{ marginBottom: "0.4rem" }}>
            {tab === "signin" ? "Welcome back, Mentor" : "Become a Mentor"}
          </h1>
        </div>

        <div className="card anim-2" style={{ padding: "2rem", overflow: "hidden" }}>
          <div style={{ display: "flex", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 10, padding: 3, gap: 2, marginBottom: "1.75rem" }}>
            {(["signin", "register"] as const).map(t => (
              <button key={t} onClick={() => setTab(t)} style={{ flex: 1, padding: "0.45rem 0.5rem", borderRadius: 7, fontSize: "0.82rem", fontWeight: 500, cursor: "pointer", border: "none", fontFamily: "inherit", transition: "all 0.15s", background: tab === t ? "var(--bg-card)" : "transparent", color: tab === t ? "var(--text-1)" : "var(--text-2)" }}>
                {t === "signin" ? "Sign In" : "Register"}
              </button>
            ))}
          </div>

          {tab === "signin" && (
            <form onSubmit={handleSignIn} className="anim-1" style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
              <div>
                <label style={labelStyle}>Email (Gmail)</label>
                <input id="mentor-signin-email" type="email" className="input" placeholder="mentor@gmail.com" value={siEmail} onChange={e => setSiEmail(e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>Password</label>
                <PasswordInput id="mentor-signin-password" value={siPassword} onChange={setSiPassword} />
              </div>
              <button id="mentor-signin-submit" type="submit" disabled={siLoading} className="btn" style={{ width: "100%", padding: "0.65rem", background: "rgba(34,197,94,0.15)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.3)", borderRadius: 8, fontWeight: 600 }}>
                {siLoading ? <Loader2 size={15} className="animate-spin" /> : null} Sign In as Mentor
              </button>
            </form>
          )}

          {tab === "register" && (
            <form onSubmit={handleRegister} className="anim-1" style={{ display: "flex", flexDirection: "column", gap: "1.1rem", maxHeight: "65vh", overflowY: "auto", paddingRight: "0.25rem" }}>
              <div>
                <label style={labelStyle}>Full Name</label>
                <input id="mentor-reg-name" type="text" className="input" placeholder="Dr. John Doe" value={regName} onChange={e => setRegName(e.target.value)} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <div>
                  <label style={labelStyle}>Age</label>
                  <input id="mentor-reg-age" type="number" className="input" placeholder="22" value={regAge} onChange={e => setRegAge(e.target.value)} />
                </div>
                <div>
                  <label style={labelStyle}>Date of Birth</label>
                  <input id="mentor-reg-dob" type="date" className="input" value={regDob} onChange={e => setRegDob(e.target.value)} />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <div>
                  <label style={labelStyle}>Branch <span style={{ color: "#ef4444" }}>*</span></label>
                  <select id="mentor-reg-branch" className="input" value={regBranch} onChange={e => setRegBranch(e.target.value)} style={{ appearance: "none", cursor: "pointer" }}>
                    <option value="">Select branch…</option>
                    {BRANCH_OPTIONS.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Year of Study <span style={{ color: "#ef4444" }}>*</span></label>
                  <select id="mentor-reg-year" className="input" value={regYear} onChange={e => setRegYear(e.target.value)} style={{ appearance: "none", cursor: "pointer" }}>
                    <option value="">Select year…</option>
                    {YEAR_OPTIONS.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label style={labelStyle}>Gmail Address</label>
                <input id="mentor-reg-email" type="email" className="input" value={regEmail} onChange={e => setRegEmail(e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>Password</label>
                <PasswordInput id="mentor-reg-password" value={regPassword} onChange={setRegPassword} showStrength />
              </div>
              <div>
                <label style={labelStyle}>Skills <span style={{ color: "var(--text-3)" }}>(up to 8)</span></label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5, maxHeight: 110, overflowY: "auto", border: "1px solid var(--border)", padding: "0.5rem", borderRadius: 8 }}>
                  {SKILL_OPTIONS.map(s => <SkillBadge key={s} skill={s} selected={regSkills.includes(s)} onClick={() => toggleSkill(s)} />)}
                </div>
              </div>
              <div>
                <label style={labelStyle}>Bio</label>
                <textarea id="mentor-reg-bio" className="input" rows={3} placeholder="Tell juniors about your experience and what you can help with…" value={regBio} onChange={e => setRegBio(e.target.value)} />
              </div>

              {/* Live preview badge */}
              {(regBranch || regYear) && (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", padding: "0.6rem 0.9rem", background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 10 }}>
                  <span style={{ fontSize: "0.72rem", color: "#22c55e", fontWeight: 600 }}>Your profile will show:</span>
                  {regBranch && <span style={{ fontSize: "0.72rem", color: "var(--text-2)", background: "var(--bg-elevated)", padding: "0.15rem 0.5rem", borderRadius: 6, border: "1px solid var(--border)" }}>{regBranch}</span>}
                  {regYear && <span style={{ fontSize: "0.72rem", color: "var(--text-2)", background: "var(--bg-elevated)", padding: "0.15rem 0.5rem", borderRadius: 6, border: "1px solid var(--border)" }}>{regYear}</span>}
                </div>
              )}

              <button id="mentor-reg-submit" type="submit" disabled={regLoading} className="btn" style={{ width: "100%", padding: "0.65rem", background: "rgba(34,197,94,0.15)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.3)", borderRadius: 8, fontWeight: 600 }}>
                {regLoading ? <Loader2 size={15} className="animate-spin" /> : null} Create Mentor Account
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = { display: "block", fontSize: "0.8rem", fontWeight: 500, color: "var(--text-2)", marginBottom: 5 };
