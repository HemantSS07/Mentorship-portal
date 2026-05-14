"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { getUser, createUser } from "@/lib/db";
import { BRANCH_OPTIONS, YEAR_OPTIONS } from "@/types";
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
  value, onChange, placeholder = "••••••••", id, showStrength = false,
}: {
  value: string; onChange: (v: string) => void; placeholder?: string; id: string; showStrength?: boolean;
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
          placeholder={placeholder}
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

export default function UserAuthPage() {
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
  const [regBranch, setRegBranch]   = useState("");
  const [regYear, setRegYear]       = useState("");
  const [regEmail, setRegEmail]     = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regLoading, setRegLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && user && !siLoading && !regLoading) {
      console.log("[Auth] User already logged in, redirecting to appropriate dashboard based on role:", user.role);
      if (user.role === "teacher_mentor") router.replace("/teacher-dashboard");
      else if (user.role === "mentor") router.replace("/mentor-dashboard");
      else router.replace("/dashboard");
    }
  }, [user, authLoading, router, siLoading, regLoading]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("[SignIn] Attempting sign-in for", siEmail);
    if (!siEmail || !siPassword) return toast.error("Please fill in all fields.");
    if (!isValidEmail(siEmail)) return toast.error("Please enter a valid email address.");

    setSiLoading(true);
    const supabaseEnabled = isSupabaseConfigured();

    if (!supabaseEnabled) {
      console.warn("[SignIn] Supabase not configured. Using Demo Mode.");
      setTimeout(() => {
        setUser({ uid: "demo_user_123", name: "Demo User", email: siEmail, role: "junior", branch: "", year: "", createdAt: new Date() });
        toast.success("Logged in successfully (Demo)");
        router.push("/dashboard");
        setSiLoading(false);
      }, 150);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email: siEmail, password: siPassword });
      if (error) {
        console.error("[SignIn] Supabase Auth error:", error);
        throw error;
      }
      if (!data.user) throw new Error("Sign-in failed.");

      console.log("[SignIn] Auth success, fetching profile for", data.user.id);
      const profile = await getUser(data.user.id);
      
      if (!profile) {
        console.warn("[SignIn] Profile not found in database for UID", data.user.id);
        toast.error("Profile not found. Please register.");
        return;
      }
      
      if (profile.role !== "junior") {
        console.warn("[SignIn] Role mismatch. User is not a junior.");
        await supabase.auth.signOut();
        useAuthStore.getState().setUser(null);
        toast.error("Access denied: Please log in using the correct portal.");
        return;
      }

      setUser(profile);
      toast.success("Welcome back! 👋");
      router.push("/dashboard");
    } catch (err: unknown) {
      console.error("[SignIn] General error:", err);
      const msg: string = (err as any)?.message ?? String(err);
      const lower = msg.toLowerCase();
      if (lower.includes("email not confirmed") || lower.includes("confirm")) {
        setUnconfirmedEmail(siEmail);
        toast.error("Please confirm your email first.");
      } else if (lower.includes("invalid login credentials") || lower.includes("invalid credentials") || lower.includes("wrong-password") || lower.includes("user-not-found")) {
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
    console.log("[Register] Attempting registration for", regEmail);
    if (!regName.trim()) return toast.error("Full name is required.");
    if (!regAge || isNaN(Number(regAge)) || Number(regAge) < 10 || Number(regAge) > 100) return toast.error("Please enter a valid age (10–100).");
    if (!regDob) return toast.error("Date of birth is required.");
    if (!regBranch) return toast.error("Please select your branch.");
    if (!regYear) return toast.error("Please select your year of study.");
    if (!regEmail || !isValidEmail(regEmail)) return toast.error("Please enter a valid email address.");
    if (!isGmail(regEmail)) return toast.error("Only Gmail addresses are accepted.");
    if (!regPassword || regPassword.length < 8) return toast.error("Password must be at least 8 characters.");

    setRegLoading(true);
    const supabaseEnabled = isSupabaseConfigured();

    if (!supabaseEnabled) {
      console.warn("[Register] Supabase not configured. Using Demo Mode.");
      setTimeout(() => {
        const u = { uid: "demo_user_" + Date.now(), name: regName, email: regEmail, role: "junior" as const, age: Number(regAge), dob: regDob, branch: regBranch, year: regYear, createdAt: new Date() };
        setUser(u);
        toast.success("Account created! (Demo)");
        router.push("/dashboard");
        setRegLoading(false);
      }, 150);
      return;
    }

    try {
      console.log("[Register] Calling Supabase signUp");
      const { data, error } = await supabase.auth.signUp({ email: regEmail, password: regPassword, options: { data: { full_name: regName } } });
      if (error) {
        console.error("[Register] Supabase Auth error:", error);
        throw error;
      }
      if (!data.user) throw new Error("Could not create account.");
      const uid = data.user.id;
      console.log("[Register] Auth success, UID:", uid);

      if (!data.session) {
        console.log("[Register] No session returned, attempting auto-signin");
        const { data: si, error: sie } = await supabase.auth.signInWithPassword({ email: regEmail, password: regPassword });
        if (sie || !si.session) {
          console.warn("[Register] Auto-signin failed. Email confirmation probably required.");
          toast.success("Account created! Please check your email to confirm, then log in.");
          router.push("/auth/user");
          setRegLoading(false);
          return;
        }
      }

      console.log("[Register] Creating profile in database...");
      const newUser = { uid, name: regName, email: regEmail, role: "junior" as const, age: Number(regAge), dob: regDob, branch: regBranch, year: regYear, createdAt: new Date() };
      await createUser(newUser);
      console.log("[Register] Profile created successfully.");

      setUser(newUser);
      toast.success("Welcome to MentorLink! 🎉");
      router.push("/dashboard");
    } catch (err: unknown) {
      console.error("[Register] General error:", err);
      const msg: string = (err as any)?.message ?? "";
      if (msg.toLowerCase().includes("rate limit") || msg.toLowerCase().includes("too many") || (err as any)?.status === 429) {
        toast.error("Too many attempts. Please wait a few minutes.");
      } else if (msg.toLowerCase().includes("already registered") || msg.toLowerCase().includes("already exist")) {
        toast.error("An account with this email already exists. Please sign in.");
        setTab("signin");
        setSiEmail(regEmail);
      } else {
        toast.error(msg || "Registration failed. Please try again.");
      }
    } finally {
      setRegLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "5rem 1rem 3rem", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(124,58,237,0.1) 0%, transparent 70%)" }} />
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", backgroundImage: "radial-gradient(rgba(255,255,255,0.025) 1px, transparent 1px)", backgroundSize: "28px 28px" }} />

      <div style={{ width: "100%", maxWidth: 460, position: "relative", zIndex: 1 }}>
        <div className="anim-1" style={{ marginBottom: "1.5rem" }}>
          <Link href="/auth" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--text-2)", textDecoration: "none", fontSize: "0.82rem", fontWeight: 500, transition: "color 0.15s" }}>
            <ArrowLeft size={14} /> Back to selection
          </Link>
        </div>

        <div className="anim-1" style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.25)", borderRadius: 99, padding: "0.35rem 1rem", marginBottom: "0.75rem" }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#a78bfa" }} />
            <span style={{ fontSize: "0.72rem", color: "#a78bfa", fontWeight: 600, letterSpacing: "0.05em" }}>USER · JUNIOR</span>
          </div>
          <h1 className="heading-lg" style={{ marginBottom: "0.4rem" }}>
            {tab === "signin" ? "Welcome back" : "Create account"}
          </h1>
          <p className="text-muted" style={{ fontSize: "0.875rem" }}>
            {tab === "signin" ? "Sign in to access your dashboard" : "Join as a junior and find your mentor"}
          </p>
        </div>

        <div className="card anim-2" style={{ padding: "2rem", overflow: "hidden" }}>
          <div style={{ display: "flex", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 10, padding: 3, gap: 2, marginBottom: "1.75rem" }}>
            {(["signin", "register"] as const).map(t => (
              <button key={t} onClick={() => setTab(t)} style={{ flex: 1, padding: "0.45rem 0.5rem", borderRadius: 7, fontSize: "0.82rem", fontWeight: 500, cursor: "pointer", border: "none", fontFamily: "inherit", transition: "all 0.15s", background: tab === t ? "var(--bg-card)" : "transparent", color: tab === t ? "var(--text-1)" : "var(--text-2)", boxShadow: tab === t ? "var(--shadow)" : "none" }} id={`tab-user-${t}`}>
                {t === "signin" ? "Sign In" : "Register"}
              </button>
            ))}
          </div>

          {tab === "signin" && (
            <form onSubmit={handleSignIn} className="anim-1" style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
              {unconfirmedEmail && (
                <div style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: 10, padding: "0.875rem 1rem" }}>
                  <p style={{ fontSize: "0.8rem", color: "#f59e0b", fontWeight: 600, margin: 0 }}>✉️ Email not confirmed</p>
                  <p style={{ fontSize: "0.75rem", color: "var(--text-2)", margin: "4px 0 8px", lineHeight: 1.5 }}>Check your inbox for the confirmation link.</p>
                </div>
              )}
              <div>
                <label style={labelStyle}>Email (Gmail)</label>
                <input id="user-signin-email" type="email" className="input" placeholder="you@gmail.com" value={siEmail} onChange={e => setSiEmail(e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>Password</label>
                <PasswordInput id="user-signin-password" value={siPassword} onChange={setSiPassword} />
              </div>
              <button id="user-signin-submit" type="submit" disabled={siLoading} className="btn btn-primary" style={{ width: "100%", padding: "0.65rem" }}>
                {siLoading ? <Loader2 size={15} className="animate-spin" /> : null} Sign In
              </button>
              <p style={{ textAlign: "center", fontSize: "0.78rem", color: "var(--text-2)", marginTop: "0.25rem" }}>
                Don&apos;t have an account? <button type="button" onClick={() => setTab("register")} style={{ background: "none", border: "none", color: "#a78bfa", fontWeight: 600, cursor: "pointer", fontSize: "inherit", padding: 0, fontFamily: "inherit" }}>Register here</button>
              </p>
            </form>
          )}

          {tab === "register" && (
            <form onSubmit={handleRegister} className="anim-1" style={{ display: "flex", flexDirection: "column", gap: "1.1rem", maxHeight: "62vh", overflowY: "auto", paddingRight: "0.25rem" }}>
              <div>
                <label style={labelStyle}>Full Name</label>
                <input id="user-reg-name" type="text" className="input" placeholder="Jane Smith" value={regName} onChange={e => setRegName(e.target.value)} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <div>
                  <label style={labelStyle}>Age</label>
                  <input id="user-reg-age" type="number" min="10" max="100" className="input" placeholder="20" value={regAge} onChange={e => setRegAge(e.target.value)} />
                </div>
                <div>
                  <label style={labelStyle}>Date of Birth</label>
                  <input id="user-reg-dob" type="date" className="input" value={regDob} onChange={e => setRegDob(e.target.value)} />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <div>
                  <label style={labelStyle}>Branch <span style={{ color: "#ef4444" }}>*</span></label>
                  <select id="user-reg-branch" className="input" value={regBranch} onChange={e => setRegBranch(e.target.value)} style={{ appearance: "none", cursor: "pointer" }}>
                    <option value="">Select branch…</option>
                    {BRANCH_OPTIONS.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Year of Study <span style={{ color: "#ef4444" }}>*</span></label>
                  <select id="user-reg-year" className="input" value={regYear} onChange={e => setRegYear(e.target.value)} style={{ appearance: "none", cursor: "pointer" }}>
                    <option value="">Select year…</option>
                    {YEAR_OPTIONS.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label style={labelStyle}>Gmail Address</label>
                <input id="user-reg-email" type="email" className="input" placeholder="you@gmail.com" value={regEmail} onChange={e => setRegEmail(e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>Password</label>
                <PasswordInput id="user-reg-password" value={regPassword} onChange={setRegPassword} showStrength />
              </div>

              {/* Live preview badge */}
              {(regBranch || regYear) && (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", padding: "0.6rem 0.9rem", background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.15)", borderRadius: 10 }}>
                  <span style={{ fontSize: "0.72rem", color: "#a78bfa", fontWeight: 600 }}>Your profile will show:</span>
                  {regBranch && <span style={{ fontSize: "0.72rem", color: "var(--text-2)", background: "var(--bg-elevated)", padding: "0.15rem 0.5rem", borderRadius: 6, border: "1px solid var(--border)" }}>{regBranch}</span>}
                  {regYear && <span style={{ fontSize: "0.72rem", color: "var(--text-2)", background: "var(--bg-elevated)", padding: "0.15rem 0.5rem", borderRadius: 6, border: "1px solid var(--border)" }}>{regYear}</span>}
                </div>
              )}

              <button id="user-reg-submit" type="submit" disabled={regLoading} className="btn btn-primary" style={{ width: "100%", padding: "0.65rem" }}>
                {regLoading ? <Loader2 size={15} className="animate-spin" /> : null} Create Account
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = { display: "block", fontSize: "0.8rem", fontWeight: 500, color: "var(--text-2)", marginBottom: 5 };
