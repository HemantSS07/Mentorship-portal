"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { useAuth } from "@/context/AuthContext";
import { GraduationCap, Menu, X, LogOut, Bell } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { subscribeNotifications, markNotificationRead } from "@/lib/db";
import { Notification } from "@/types";
import NotificationPanel from "./NotificationPanel";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/mentors", label: "Find Mentors" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/#how-it-works", label: "How It Works" },
];

export default function Navbar() {
  const { user } = useAuthStore();
  const { signInWithGoogle, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const notifRef = useRef<HTMLDivElement>(null);
  
  const pathname = usePathname();
  const dashHref =
    user?.role === "teacher_mentor" ? "/teacher-dashboard" :
    user?.role === "mentor" ? "/mentor-dashboard" : "/dashboard";

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }
    const unsub = subscribeNotifications(user.uid, (nots) => {
      setNotifications(nots);
    });
    return () => unsub();
  }, [user]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleNotificationClick = async (notif: Notification) => {
    if (!notif.read) await markNotificationRead(notif.id);
  };

  return (
    <header className="fixed top-0 inset-x-0 z-50 glass" style={{ borderBottom: "1px solid var(--border)" }}>
      <div className="page-wrap" style={{ height: 56, display: "flex", alignItems: "center", justifyContent: "space-between" }}>

        {/* Logo */}
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <GraduationCap size={16} color="#fff" />
          </div>
          <span style={{ fontWeight: 700, fontSize: "0.95rem", letterSpacing: "-0.01em", color: "var(--text-1)" }}>MentorLink</span>
        </Link>

        {/* Desktop Nav */}
        <nav style={{ display: "flex", alignItems: "center", gap: 2 }} className="hidden md:flex">
          {LINKS.map(l => (
            <Link key={l.href} href={l.href}
              style={{ padding: "0.4rem 0.75rem", borderRadius: 7, fontSize: "0.83rem", fontWeight: 500, textDecoration: "none", color: pathname === l.href ? "var(--text-1)" : "var(--text-2)", transition: "color 0.15s" }}>
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Desktop Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }} className="hidden md:flex">
          {user ? (
            <>
              <Link href={dashHref} className="btn btn-secondary btn-sm">Dashboard</Link>
              
              {/* Notifications Dropdown */}
              <div style={{ position: "relative" }} ref={notifRef}>
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="btn btn-ghost" 
                  style={{ padding: "0.3rem 0.5rem", position: "relative", color: "var(--text-2)" }}
                  title="Notifications"
                >
                  <Bell size={16} />
                  {unreadCount > 0 && (
                    <span style={{
                      position: "absolute", top: 2, right: 4, width: 8, height: 8, 
                      background: "#ef4444", borderRadius: "50%",
                      boxShadow: "0 0 0 2px var(--bg-card)"
                    }} />
                  )}
                </button>
                
                {showNotifications && (
                  <NotificationPanel 
                    notifications={notifications} 
                    onClose={() => setShowNotifications(false)} 
                  />
                )}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 8, paddingLeft: 8, borderLeft: "1px solid var(--border)" }}>
                {user.photoURL
                  ? <img src={user.photoURL} alt="" style={{ width: 26, height: 26, borderRadius: "50%", border: "1px solid var(--border)" }} />
                  : <div style={{ width: 26, height: 26, borderRadius: "50%", background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.7rem", fontWeight: 700, color: "#fff" }}>{user.name[0]}</div>
                }
                <button 
                  onClick={signOut} 
                  className="btn btn-ghost" 
                  style={{ padding: "0.3rem 0.5rem", fontSize: "0.78rem", color: "var(--text-2)" }}
                  title="Sign out"
                >
                  <LogOut size={13} />
                </button>
              </div>
            </>
          ) : (
            <>
              <Link href="/auth" className="btn btn-ghost btn-sm">Sign in</Link>
              <Link href="/auth" className="btn btn-primary btn-sm">Register</Link>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button className="btn btn-ghost md:hidden" style={{ padding: "0.4rem" }} onClick={() => setOpen(!open)}>
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {open && (
        <div style={{ borderTop: "1px solid var(--border)", background: "var(--bg-card)" }}>
          <div className="page-wrap" style={{ paddingTop: "1rem", paddingBottom: "1rem", display: "flex", flexDirection: "column", gap: 4 }}>
            {LINKS.map(l => (
              <Link key={l.href} href={l.href} onClick={() => setOpen(false)}
                style={{ padding: "0.5rem 0.5rem", borderRadius: 7, fontSize: "0.875rem", textDecoration: "none", color: "var(--text-2)" }}>
                {l.label}
              </Link>
            ))}
            <div style={{ marginTop: 8, paddingTop: 12, borderTop: "1px solid var(--border)", display: "flex", gap: 8 }}>
              {user ? (
                <>
                  <Link href={dashHref} onClick={() => setOpen(false)} className="btn btn-secondary" style={{ flex: 1 }}>Dashboard</Link>
                  <button onClick={async () => { await signOut(); setOpen(false); }} className="btn btn-ghost">Sign out</button>
                </>
              ) : (
                <>
                  <Link href="/auth" onClick={() => setOpen(false)} className="btn btn-secondary" style={{ flex: 1 }}>Sign in</Link>
                  <Link href="/auth" onClick={() => setOpen(false)} className="btn btn-primary">Register</Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
