"use client";
import Link from "next/link";
import { GraduationCap } from "lucide-react";

const PLATFORM_LINKS = [
  { label: "Home", href: "/" },
  { label: "Find Mentors", href: "/mentors" },
  { label: "Become a Mentor", href: "/register" },
  { label: "Leaderboard", href: "/leaderboard" },
];

const ACCOUNT_LINKS = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Mentor Dashboard", href: "/mentor-dashboard" },
  { label: "Register", href: "/register" },
];

function FooterLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} style={{ fontSize: "0.82rem", color: "var(--text-2)", textDecoration: "none", display: "inline-block", transition: "color 0.15s" }}
      className="footer-link">
      {label}
    </Link>
  );
}

export default function Footer() {
  return (
    <footer style={{ borderTop: "1px solid var(--border)", marginTop: "5rem" }}>
      <div className="page-wrap" style={{ paddingTop: "2.5rem", paddingBottom: "2.5rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "2rem" }} className="footer-grid">
          {/* Brand */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <div style={{ width: 28, height: 28, borderRadius: 7, background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <GraduationCap size={15} color="#fff" />
              </div>
              <span style={{ fontWeight: 700, fontSize: "0.9rem" }}>MentorLink</span>
            </div>
            <p style={{ fontSize: "0.8rem", color: "var(--text-2)", lineHeight: 1.65, maxWidth: 260 }}>
              Structured mentorship for college students — faster and more reliable than group chats.
            </p>
          </div>

          {/* Platform */}
          <div>
            <p style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>Platform</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {PLATFORM_LINKS.map(l => <FooterLink key={l.href} {...l} />)}
            </div>
          </div>

          {/* Account */}
          <div>
            <p style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>Account</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {ACCOUNT_LINKS.map(l => <FooterLink key={l.href} {...l} />)}
            </div>
          </div>
        </div>

        <div style={{ borderTop: "1px solid var(--border)", marginTop: "2rem", paddingTop: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
          <p style={{ fontSize: "0.78rem", color: "var(--text-3)" }}>© 2025 MentorLink. Built for college communities.</p>
          <p style={{ fontSize: "0.78rem", color: "var(--text-3)" }}>Made with care 🎓</p>
        </div>
      </div>

      <style>{`
        .footer-link:hover { color: var(--text-1) !important; }
        @media (max-width: 640px) { .footer-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </footer>
  );
}
