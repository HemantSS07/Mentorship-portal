"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { getUser, createUser, createTeacherMentor } from "@/lib/db";
import { DEPARTMENT_OPTIONS, DESIGNATION_OPTIONS, SUBJECT_EXPERTISE_OPTIONS, AVAILABILITY_OPTIONS } from "@/types";
import toast from "react-hot-toast";
import Link from "next/link";
import { Eye, EyeOff, Loader2, ArrowLeft, GraduationCap, CheckCircle2 } from "lucide-react";

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

function MultiSelectBadge({
  options, selected, onToggle, max = 10,
}: {
  options: string[]; selected: string[]; onToggle: (v: string) => void; max?: number;
}) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 5, maxHeight: 130, overflowY: "auto", border: "1px solid var(--border)", padding: "0.5rem", borderRadius: 8 }}>
      {options.map(opt => {
        const sel = selected.includes(opt);
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onToggle(opt)}
            disabled={!sel && selected.length >= max}
            style={{
              padding: "0.22rem 0.65rem", borderRadius: 99, fontSize: "0.72rem", fontWeight: 500,
              cursor: "pointer", border: "none", fontFamily: "inherit", transition: "all 0.15s",
              background: sel ? "rgba(245,158,11,0.2)" : "var(--bg-elevated)",
              color: sel ? "#f59e0b" : "var(--text-2)",
              outline: sel ? "1px solid rgba(245,158,11,0.4)" : "1px solid var(--border)",
              opacity: !sel && selected.length >= max ? 0.4 : 1,
            }}
          >
            {sel && "✓ "}{opt}
          </button>
        );
      })}
    </div>
  );
}

export default function TeacherAuthPage() {
  const router = useRouter();
  const { setUser, user, loading: authLoading } = useAuthStore();
  const [tab, setTab] = useState<"signin" | "register">("signin");



  // Sign In state
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

  // Register state
  const [regName, setRegName] = useState("");
  const [regDepartment, setRegDepartment] = useState("");
  const [regDesignation, setRegDesignation] = useState("");
  const [regSubjects, setRegSubjects] = useState<string[]>([]);
  const [regYearsExp, setRegYearsExp] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regBio, setRegBio] = useState("");
  const [regAvailability, setRegAvailability] = useState<string[]>([]);
  const [contactMethod, setContactMethod] = useState("email");
  const [contactValue, setContactValue] = useState("");
  const [regLoading, setRegLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && user && !siLoading && !regLoading) {
      router.replace(
        user.role === "teacher_mentor" ? "/teacher-dashboard" :
        user.role === "mentor" ? "/mentor-dashboard" : "/dashboard"
      );
    }
  }, [user, authLoading, router, siLoading, regLoading]);

  const toggleSubject = (s: string) =>
    setRegSubjects(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s].slice(0, 10));
  const toggleAvailability = (a: string) =>
    setRegAvailability(p => p.includes(a) ? p.filter(x => x !== a) : [...p, a]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!siEmail || !siPassword) return toast.error("Please fill in all fields.");
    if (!isValidEmail(siEmail)) return toast.error("Please enter a valid email address.");

    setSiLoading(true);
    const supabaseEnabled = isSupabaseConfigured();

    if (!supabaseEnabled) {
      setTimeout(() => {
        setUser({ uid: "demo_teacher_123", name: "Demo Professor", email: siEmail, role: "teacher_mentor", branch: "", year: "", createdAt: new Date() });
        toast.success("Logged in successfully (Demo)");
        router.push("/teacher-dashboard");
        setSiLoading(false);
      }, 150);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email: siEmail, password: siPassword });
      if (error) throw error;
      if (!data.user) throw new Error("Sign-in failed.");

      const profile = await getUser(data.user.id);
      if (!profile) {
        toast.error("Profile not found. Please register as a Teacher Mentor.");
        return;
      }
      if (profile.role !== "teacher_mentor") {
        await supabase.auth.signOut();
        useAuthStore.getState().setUser(null);
        toast.error("Access denied: Please log in using the correct portal.");
        return;
      }

      setUser(profile);
      toast.success("Welcome back, Professor! 🎓");
      router.push("/teacher-dashboard");
    } catch (err: any) {
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

  const handleResend = async () => {
    if (!unconfirmedEmail || resendCooldown > 0) return;
    try {
      await supabase.auth.resend({ type: "signup", email: unconfirmedEmail });
      toast.success("Confirmation email resent!");
      setResendCooldown(RESEND_COOLDOWN);
    } catch { toast.error("Could not resend. Please try again."); }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim()) return toast.error("Full name is required.");
    if (!regDepartment) return toast.error("Please select your department.");
    if (!regDesignation) return toast.error("Please select your designation.");
    if (regSubjects.length === 0) return toast.error("Please select at least one subject expertise.");
    if (!regYearsExp || isNaN(Number(regYearsExp)) || Number(regYearsExp) < 0) return toast.error("Please enter valid years of experience.");
    if (!regEmail || !isValidEmail(regEmail)) return toast.error("Valid email is required.");
    if (!regPassword || regPassword.length < 8) return toast.error("Password must be at least 8 characters.");

    setRegLoading(true);
    const supabaseEnabled = isSupabaseConfigured();

    if (!supabaseEnabled) {
      setTimeout(() => {
        const u = { uid: "demo_teacher_" + Date.now(), name: regName, email: regEmail, role: "teacher_mentor" as const, branch: regDepartment, year: "", createdAt: new Date() };
        setUser(u);
        toast.success("Teacher mentor account created! (Demo)");
        router.push("/teacher-dashboard");
        setRegLoading(false);
      }, 150);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({ email: regEmail, password: regPassword, options: { data: { full_name: regName } } });
      if (error) throw error;
      if (!data.user) throw new Error("Could not create account.");
      const uid = data.user.id;

      if (!data.session) {
        const { data: si, error: sie } = await supabase.auth.signInWithPassword({ email: regEmail, password: regPassword });
        if (sie || !si.session) {
          toast.success("Account created! Please check your email to confirm, then log in.");
          setTab("signin");
          setRegLoading(false);
          return;
        }
      }

      const newUser = {
        uid, name: regName, email: regEmail, role: "teacher_mentor" as const,
        branch: regDepartment, year: regDesignation, createdAt: new Date(),
      };
      await createUser(newUser);

      await createTeacherMentor({
        uid, name: regName, email: regEmail,
        department: regDepartment,
        designation: regDesignation,
        subjectExpertise: regSubjects,
        yearsExperience: Number(regYearsExp),
        bio: regBio.trim(),
        availability: regAvailability.length > 0 ? regAvailability : ["Anytime"],
        contactMethod, contactValue: contactValue.trim(),
        rating: 0, totalRatings: 0, totalSessions: 0, responseTimeHours: 24,
        isActive: true, isVerified: true,
      });

      setUser(newUser);
      toast.success("Welcome aboard, Professor! 🎓✨");
      router.push("/teacher-dashboard");
    } catch (err: any) {
      const msg: string = err?.message ?? "";
      if (msg.toLowerCase().includes("rate limit") || (err as any)?.status === 429) {
        toast.error("Too many signup attempts. Please wait a moment.");
      } else {
        toast.error(msg || "Registration failed.");
      }
    } finally {
      setRegLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "5rem 1rem 3rem", position: "relative", overflow: "hidden" }}>
      {/* Gold ambient background */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(245,158,11,0.07) 0%, transparent 70%)" }} />
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", backgroundImage: "radial-gradient(rgba(255,255,255,0.022) 1px, transparent 1px)", backgroundSize: "28px 28px" }} />

      <div style={{ width: "100%", maxWidth: tab === "register" ? 600 : 460, position: "relative", zIndex: 1, transition: "max-width 0.3s ease" }}>
        <div className="anim-1" style={{ marginBottom: "1.5rem" }}>
          <Link href="/auth" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--text-2)", textDecoration: "none", fontSize: "0.82rem", fontWeight: 500 }}>
            <ArrowLeft size={14} /> Back to selection
          </Link>
        </div>

        {/* Header */}
        <div className="anim-1" style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)", borderRadius: 99, padding: "0.35rem 1rem", marginBottom: "0.75rem" }}>
            <GraduationCap size={14} style={{ color: "#f59e0b" }} />
            <span style={{ fontSize: "0.72rem", color: "#f59e0b", fontWeight: 600, letterSpacing: "0.05em" }}>TEACHER MENTOR · VERIFIED FACULTY</span>
          </div>
          <h1 className="heading-lg" style={{ marginBottom: "0.4rem" }}>
            {tab === "signin" ? "Welcome back, Professor" : "Join as Faculty Mentor"}
          </h1>
          <p style={{ fontSize: "0.82rem", color: "var(--text-2)" }}>
            {tab === "signin" ? "Access your faculty mentorship dashboard" : "Register as a verified faculty mentor"}
          </p>
        </div>

        <div className="card anim-2" style={{ padding: "2rem", overflow: "hidden" }}>
          {/* Tab switcher */}
          <div style={{ display: "flex", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 10, padding: 3, gap: 2, marginBottom: "1.75rem" }}>
            {(["signin", "register"] as const).map(t => (
              <button key={t} onClick={() => setTab(t)} style={{ flex: 1, padding: "0.45rem 0.5rem", borderRadius: 7, fontSize: "0.82rem", fontWeight: 500, cursor: "pointer", border: "none", fontFamily: "inherit", transition: "all 0.15s", background: tab === t ? "var(--bg-card)" : "transparent", color: tab === t ? "var(--text-1)" : "var(--text-2)" }}>
                {t === "signin" ? "Sign In" : "Register"}
              </button>
            ))}
          </div>

          {/* ── SIGN IN ── */}
          {tab === "signin" && (
            <form onSubmit={handleSignIn} className="anim-1" style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
              <div>
                <label style={labelStyle}>College / Official Email</label>
                <input id="teacher-signin-email" type="email" className="input" placeholder="professor@college.edu" value={siEmail} onChange={e => setSiEmail(e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>Password</label>
                <PasswordInput id="teacher-signin-password" value={siPassword} onChange={setSiPassword} />
              </div>

              {unconfirmedEmail && (
                <div style={{ background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 10, padding: "0.75rem 1rem" }}>
                  <p style={{ fontSize: "0.8rem", color: "#f59e0b", marginBottom: 6 }}>Email not confirmed yet.</p>
                  <button type="button" onClick={handleResend} disabled={resendCooldown > 0} style={{ fontSize: "0.78rem", color: "#f59e0b", background: "none", border: "none", cursor: "pointer", fontWeight: 500, textDecoration: "underline" }}>
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend confirmation email"}
                  </button>
                </div>
              )}

              <button id="teacher-signin-submit" type="submit" disabled={siLoading} className="btn" style={{ width: "100%", padding: "0.65rem", background: "rgba(245,158,11,0.15)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.3)", borderRadius: 8, fontWeight: 600 }}>
                {siLoading ? <Loader2 size={15} className="animate-spin" /> : <GraduationCap size={15} />} Sign In as Teacher Mentor
              </button>
            </form>
          )}

          {/* ── REGISTER ── */}
          {tab === "register" && (
            <form onSubmit={handleRegister} className="anim-1" style={{ display: "flex", flexDirection: "column", gap: "1.1rem", maxHeight: "68vh", overflowY: "auto", paddingRight: "0.25rem" }}>

              {/* Full Name */}
              <div>
                <label style={labelStyle}>Full Name <span style={{ color: "#ef4444" }}>*</span></label>
                <input id="teacher-reg-name" type="text" className="input" placeholder="Prof. Jane Smith" value={regName} onChange={e => setRegName(e.target.value)} />
              </div>

              {/* Department & Designation */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <div>
                  <label style={labelStyle}>Department <span style={{ color: "#ef4444" }}>*</span></label>
                  <select id="teacher-reg-department" className="input" value={regDepartment} onChange={e => setRegDepartment(e.target.value)} style={{ appearance: "none", cursor: "pointer" }}>
                    <option value="">Select department…</option>
                    {DEPARTMENT_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Designation <span style={{ color: "#ef4444" }}>*</span></label>
                  <select id="teacher-reg-designation" className="input" value={regDesignation} onChange={e => setRegDesignation(e.target.value)} style={{ appearance: "none", cursor: "pointer" }}>
                    <option value="">Select designation…</option>
                    {DESIGNATION_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>

              {/* Years of Experience */}
              <div>
                <label style={labelStyle}>Years of Experience <span style={{ color: "#ef4444" }}>*</span></label>
                <input id="teacher-reg-exp" type="number" min="0" max="50" className="input" placeholder="e.g. 8" value={regYearsExp} onChange={e => setRegYearsExp(e.target.value)} />
              </div>

              {/* Subject Expertise */}
              <div>
                <label style={labelStyle}>Subject Expertise <span style={{ color: "var(--text-3)" }}>(up to 10)</span> <span style={{ color: "#ef4444" }}>*</span></label>
                <MultiSelectBadge options={SUBJECT_EXPERTISE_OPTIONS} selected={regSubjects} onToggle={toggleSubject} max={10} />
                {regSubjects.length > 0 && (
                  <p style={{ fontSize: "0.7rem", color: "var(--text-3)", marginTop: 4 }}>{regSubjects.length} selected</p>
                )}
              </div>

              {/* Email & Password */}
              <div>
                <label style={labelStyle}>Official College Email <span style={{ color: "#ef4444" }}>*</span></label>
                <input id="teacher-reg-email" type="email" className="input" placeholder="professor@college.edu" value={regEmail} onChange={e => setRegEmail(e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>Password <span style={{ color: "#ef4444" }}>*</span></label>
                <PasswordInput id="teacher-reg-password" value={regPassword} onChange={setRegPassword} showStrength />
              </div>

              {/* Bio */}
              <div>
                <label style={labelStyle}>Bio / Professional Summary</label>
                <textarea id="teacher-reg-bio" className="input" rows={3} placeholder="Tell students about your expertise, research interests, and what you can help them with…" value={regBio} onChange={e => setRegBio(e.target.value)} />
              </div>

              {/* Availability */}
              <div>
                <label style={labelStyle}>Availability</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {AVAILABILITY_OPTIONS.map(a => {
                    const sel = regAvailability.includes(a);
                    return (
                      <button key={a} type="button" onClick={() => toggleAvailability(a)} style={{
                        padding: "0.3rem 0.75rem", borderRadius: 99, fontSize: "0.75rem", fontWeight: 500,
                        cursor: "pointer", border: "none", fontFamily: "inherit", transition: "all 0.15s",
                        background: sel ? "rgba(245,158,11,0.15)" : "var(--bg-elevated)",
                        color: sel ? "#f59e0b" : "var(--text-2)",
                        outline: sel ? "1px solid rgba(245,158,11,0.35)" : "1px solid var(--border)",
                      }}>{sel && "✓ "}{a}</button>
                    );
                  })}
                </div>
              </div>

              {/* Contact method */}
              <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "0.75rem", alignItems: "end" }}>
                <div>
                  <label style={labelStyle}>Contact Method</label>
                  <select className="input" value={contactMethod} onChange={e => setContactMethod(e.target.value)} style={{ appearance: "none", cursor: "pointer" }}>
                    <option value="email">Email</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="phone">Phone</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Contact Value</label>
                  <input type="text" className="input" placeholder={contactMethod === "email" ? "official@college.edu" : "+91 9876543210"} value={contactValue} onChange={e => setContactValue(e.target.value)} />
                </div>
              </div>

              {/* Live profile preview */}
              {(regDepartment || regDesignation) && (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", padding: "0.6rem 0.9rem", background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 10 }}>
                  <CheckCircle2 size={13} style={{ color: "#f59e0b" }} />
                  <span style={{ fontSize: "0.72rem", color: "#f59e0b", fontWeight: 600 }}>Your profile will show:</span>
                  {regDepartment && <span style={{ fontSize: "0.72rem", color: "var(--text-2)", background: "var(--bg-elevated)", padding: "0.15rem 0.5rem", borderRadius: 6, border: "1px solid var(--border)" }}>{regDepartment}</span>}
                  {regDesignation && <span style={{ fontSize: "0.72rem", color: "var(--text-2)", background: "var(--bg-elevated)", padding: "0.15rem 0.5rem", borderRadius: 6, border: "1px solid var(--border)" }}>{regDesignation}</span>}
                  {regYearsExp && <span style={{ fontSize: "0.72rem", color: "var(--text-2)", background: "var(--bg-elevated)", padding: "0.15rem 0.5rem", borderRadius: 6, border: "1px solid var(--border)" }}>{regYearsExp} yrs exp</span>}
                </div>
              )}

              <button id="teacher-reg-submit" type="submit" disabled={regLoading} className="btn" style={{ width: "100%", padding: "0.65rem", background: "rgba(245,158,11,0.15)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.3)", borderRadius: 8, fontWeight: 600 }}>
                {regLoading ? <Loader2 size={15} className="animate-spin" /> : <GraduationCap size={15} />} Register as Teacher Mentor
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = { display: "block", fontSize: "0.8rem", fontWeight: 500, color: "var(--text-2)", marginBottom: 5 };
