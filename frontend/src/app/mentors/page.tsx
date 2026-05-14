"use client";
import { useState, useEffect, Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, X, Loader2, GraduationCap, Users } from "lucide-react";
import { subscribeMentors, subscribeTeacherMentors } from "@/lib/db";
import { matchMentors } from "@/lib/aiMatcher";
import { Mentor, TeacherMentor, SKILL_OPTIONS, BRANCH_OPTIONS, YEAR_OPTIONS, DEPARTMENT_OPTIONS, SUBJECT_EXPERTISE_OPTIONS } from "@/types";
import MentorCard from "@/components/MentorCard";
import SkillBadge from "@/components/SkillBadge";
import TeacherMentorCard from "@/components/TeacherMentorCard";

// Custom hook for debouncing search input
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
}

const DEMO_MENTORS: Mentor[] = [
  { uid: "demo1", role: "mentor", name: "Arjun Sharma", email: "", branch: "Computer Science", year: "4th Year", skills: ["DSA", "Competitive Programming", "C++", "Interview Prep"], bio: "Codeforces Specialist. Helped 80+ juniors crack Google, Amazon, and Microsoft coding rounds.", rating: 4.9, totalRatings: 47, totalSessions: 82, responseTimeHours: 3, isActive: true, availability: [], createdAt: new Date() },
  { uid: "demo2", role: "mentor", name: "Priya Nair", email: "", branch: "Information Technology", year: "Alumni", skills: ["Web Development", "React", "Node.js", "System Design"], bio: "SDE-2 at Swiggy. Passionate about helping juniors build production-grade projects.", rating: 4.8, totalRatings: 38, totalSessions: 61, responseTimeHours: 6, isActive: true, availability: [], createdAt: new Date() },
  { uid: "demo3", role: "mentor", name: "Rahul Verma", email: "", branch: "ECE", year: "4th Year", skills: ["Machine Learning", "Python", "Deep Learning"], bio: "Research intern at IIT Bombay. Kaggle Expert. Teaching ML from first principles.", rating: 4.7, totalRatings: 29, totalSessions: 44, responseTimeHours: 8, isActive: true, availability: [], createdAt: new Date() },
  { uid: "demo4", role: "mentor", name: "Sneha Kulkarni", email: "", branch: "Computer Science", year: "Alumni", skills: ["Interview Prep", "Resume Building", "Linux", "DevOps"], bio: "SRE at Google Singapore. Cleared 6 FAANG offers. Resume reviews and mock interviews.", rating: 4.9, totalRatings: 61, totalSessions: 104, responseTimeHours: 4, isActive: true, availability: [], createdAt: new Date() },
  { uid: "demo5", role: "mentor", name: "Aditya Patel", email: "", branch: "Mathematics & Computing", year: "4th Year", skills: ["System Design", "Cloud Computing", "Java", "Database"], bio: "Built microservices at 5M+ DAU. Cracking HLD/LLD interview rounds.", rating: 4.6, totalRatings: 22, totalSessions: 35, responseTimeHours: 12, isActive: true, availability: [], createdAt: new Date() },
  { uid: "demo6", role: "mentor", name: "Kriti Singh", email: "", branch: "Information Technology", year: "3rd Year", skills: ["Open Source", "Linux", "Python", "Git"], bio: "GSoC 2024 at Mozilla. First open source contribution to merged PR.", rating: 4.5, totalRatings: 18, totalSessions: 28, responseTimeHours: 2, isActive: true, availability: [], createdAt: new Date() },
  { uid: "demo7", role: "mentor", name: "Vikram Reddy", email: "", branch: "Computer Science", year: "4th Year", skills: ["GATE Preparation", "Aptitude", "Mathematics"], bio: "AIR 87 in GATE CS 2024. Cleared 3 PSU exams. Structured GATE prep.", rating: 4.8, totalRatings: 34, totalSessions: 55, responseTimeHours: 5, isActive: true, availability: [], createdAt: new Date() },
  { uid: "demo8", role: "mentor", name: "Ananya Joshi", email: "", branch: "ECE", year: "Alumni", skills: ["Android Development", "Java", "Kotlin"], bio: "Android developer at Flipkart. ECE to SDE transition guide.", rating: 4.7, totalRatings: 26, totalSessions: 40, responseTimeHours: 7, isActive: true, availability: [], createdAt: new Date() },
];

const DEMO_TEACHERS: TeacherMentor[] = [
  { uid: "tdemo1", name: "Dr. Anita Sharma", email: "", department: "Computer Science & Engineering", designation: "Associate Professor", subjectExpertise: ["Data Structures & Algorithms", "Machine Learning", "Artificial Intelligence", "Python"], yearsExperience: 12, bio: "Ph.D. from IIT Delhi. Published 30+ research papers. Passionate about making complex algorithms accessible to every student.", rating: 4.9, totalRatings: 64, totalSessions: 118, responseTimeHours: 4, isActive: true, isVerified: true, availability: ["Weekday Evenings", "Weekend Mornings"], createdAt: new Date() },
  { uid: "tdemo2", name: "Prof. Rajesh Kumar", email: "", department: "Information Technology", designation: "Professor", subjectExpertise: ["Database Management Systems", "Cloud Computing", "Distributed Systems", "Web Technologies"], yearsExperience: 18, bio: "20 years of industry + academia. Founder of two tech startups. Mentored 200+ students for placements and research.", rating: 4.8, totalRatings: 52, totalSessions: 93, responseTimeHours: 6, isActive: true, isVerified: true, availability: ["Weekday Mornings", "Anytime"], createdAt: new Date() },
  { uid: "tdemo3", name: "Dr. Meera Patel", email: "", department: "Electronics & Communication Engineering", designation: "Assistant Professor", subjectExpertise: ["Embedded Systems", "IoT", "Digital Signal Processing", "Vlsi Design"], yearsExperience: 7, bio: "Ph.D. in VLSI from NIT Surat. Core Area: Embedded Systems & IoT. Industry consultant for 3 semiconductor firms.", rating: 4.7, totalRatings: 38, totalSessions: 62, responseTimeHours: 5, isActive: true, isVerified: true, availability: ["Weekday Evenings", "Weekend Evenings"], createdAt: new Date() },
  { uid: "tdemo4", name: "Prof. Suresh Nair", email: "", department: "Management Studies", designation: "Professor", subjectExpertise: ["Entrepreneurship", "Project Management", "Technical Writing", "Research Methodology"], yearsExperience: 22, bio: "Mentor at NASSCOM. Helped 50+ student startups go from idea to MVP. Specializes in EdTech and FinTech mentorship.", rating: 4.6, totalRatings: 29, totalSessions: 47, responseTimeHours: 8, isActive: true, isVerified: true, availability: ["Weekend Mornings", "Weekend Evenings"], createdAt: new Date() },
];

function Content() {
  const sp = useSearchParams();
  const [liveMentors, setLiveMentors] = useState<Mentor[] | null>(null);
  const [liveTeachers, setLiveTeachers] = useState<TeacherMentor[] | null>(null);
  const [loadingMentors, setLoadingMentors] = useState(true);
  const [loadingTeachers, setLoadingTeachers] = useState(true);

  const [query, setQuery] = useState(sp.get("q") ?? "");
  const debouncedQuery = useDebounce(query, 300);

  // Filters for Students
  const [skills, setSkills] = useState<string[]>(sp.get("skill") ? [sp.get("skill")!] : []);
  const [branch, setBranch] = useState("");
  const [year, setYear] = useState("");
  
  // Filters for Teachers
  const [filterDept, setFilterDept] = useState("");
  const [filterSubject, setFilterSubject] = useState("");

  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const unsubMentors = subscribeMentors((firestoreMentors) => {
      if (firestoreMentors.length > 0) {
        const seen = new Set<string>();
        const unique = firestoreMentors.filter((m) => {
          if (seen.has(m.uid)) return false;
          seen.add(m.uid);
          return true;
        });
        setLiveMentors(unique);
      } else {
        setLiveMentors([]);
      }
      setLoadingMentors(false);
    });

    const unsubTeachers = subscribeTeacherMentors((teachers) => {
      if (teachers.length > 0) {
        setLiveTeachers(teachers);
      } else {
        setLiveTeachers([]);
      }
      setLoadingTeachers(false);
    });

    return () => { unsubMentors(); unsubTeachers(); };
  }, []);

  const mentors = liveMentors && liveMentors.length > 0 ? liveMentors : DEMO_MENTORS;
  const teachers = liveTeachers && liveTeachers.length > 0 ? liveTeachers : DEMO_TEACHERS;

  const filteredMentors = useMemo(() => {
    let r = mentors.filter((m) => m.isActive && (m.role === "mentor" || !m.role));
    if (skills.length) r = r.filter((m) => skills.some((s) => m.skills.includes(s)));
    if (branch) r = r.filter((m) => m.branch === branch);
    if (year) r = r.filter((m) => m.year === year);
    
    if (debouncedQuery) {
      r = matchMentors(debouncedQuery, r);
    } else {
      r = [...r].sort((a, b) => b.rating - a.rating);
    }
    return r;
  }, [mentors, skills, branch, year, debouncedQuery]);

  const filteredTeachers = useMemo(() => {
    let r = teachers.filter(t => t.isActive);
    if (filterDept) r = r.filter(t => t.department === filterDept);
    if (filterSubject) r = r.filter(t => t.subjectExpertise.includes(filterSubject));
    
    if (debouncedQuery) {
      const q = debouncedQuery.toLowerCase().split(/\s+/).filter(Boolean);
      
      const scored = r.map((t) => {
        let score = 0;
        q.forEach((kw) => {
          t.subjectExpertise.forEach((subj) => {
            if (subj.toLowerCase().includes(kw) || kw.includes(subj.toLowerCase())) score += 10;
          });
          if (t.bio.toLowerCase().includes(kw)) score += 3;
          if (t.name.toLowerCase().includes(kw)) score += 5;
          if (t.department.toLowerCase().includes(kw)) score += 4;
          if (t.designation.toLowerCase().includes(kw)) score += 2;
        });

        score += t.rating * 2;
        score += Math.min(t.totalSessions * 0.5, 10);
        if (t.responseTimeHours <= 4) score += 5;
        else if (t.responseTimeHours <= 12) score += 2;

        return { t, score };
      });

      r = scored.filter(s => s.score > 0 || q.length === 0)
                .sort((a, b) => b.score - a.score)
                .map(s => s.t);
    } else {
      r = [...r].sort((a, b) => b.rating - a.rating);
    }
    return r;
  }, [teachers, filterDept, filterSubject, debouncedQuery]);

  const toggleSkill = (s: string) => setSkills((p) => (p.includes(s) ? p.filter((x) => x !== s) : [...p, s]));
  const clearAll = () => { setQuery(""); setSkills([]); setBranch(""); setYear(""); setFilterDept(""); setFilterSubject(""); };
  const filterCount = [branch, year, filterDept, filterSubject, ...skills].filter(Boolean).length;
  const isLoading = loadingMentors || loadingTeachers;
  const hasResults = filteredMentors.length > 0 || filteredTeachers.length > 0;

  return (
    <div className="page-wrap dash-page">
      {/* Header */}
      <div style={{ marginBottom: "1.75rem" }}>
        <h1 className="heading-lg" style={{ marginBottom: 6 }}>Find a Mentor</h1>
        <p style={{ fontSize: "0.82rem", color: "var(--text-2)" }}>
          Search across verified faculty and experienced student mentors in real-time.
        </p>
      </div>

      {/* Global Search & Filters */}
      <div style={{ display: "flex", gap: 8, marginBottom: "1.5rem", flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 280 }}>
          <Search size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-3)", pointerEvents: "none" }} />
          <input
            id="global-mentor-search"
            className="input"
            style={{ paddingLeft: 40, height: "44px", fontSize: "0.95rem" }}
            placeholder="Search for skills, names, departments, e.g. 'React', 'DSA', 'Dr. Sharma'..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query !== debouncedQuery && (
            <Loader2 size={14} className="animate-spin" style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", color: "var(--accent)" }} />
          )}
        </div>
        
        <button className={`btn ${showFilters ? "btn-primary" : "btn-secondary"}`} style={{ height: "44px" }} onClick={() => setShowFilters((p) => !p)}>
          <SlidersHorizontal size={16} />
          Filters{filterCount > 0 ? ` (${filterCount})` : ""}
        </button>
        {filterCount > 0 && (
          <button className="btn btn-ghost" onClick={clearAll} style={{ display: "flex", alignItems: "center", gap: 6, height: "44px" }}>
            <X size={15} /> Clear
          </button>
        )}
      </div>

      {/* Unified Filter Panel */}
      {showFilters && (
        <div className="card anim-1" style={{ marginBottom: "2rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }} className="filter-row">
            {/* Student Filters */}
            <div>
              <h3 style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-1)", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                <Users size={14} className="text-accent" /> Student Mentor Filters
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div>
                  <p style={{ fontSize: "0.75rem", color: "var(--text-2)", marginBottom: 4 }}>Branch</p>
                  <select className="input" value={branch} onChange={(e) => setBranch(e.target.value)}>
                    <option value="" style={{ background: "#111113" }}>All branches</option>
                    {BRANCH_OPTIONS.map((b) => <option key={b} value={b} style={{ background: "#111113" }}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <p style={{ fontSize: "0.75rem", color: "var(--text-2)", marginBottom: 4 }}>Year</p>
                  <select className="input" value={year} onChange={(e) => setYear(e.target.value)}>
                    <option value="" style={{ background: "#111113" }}>All years</option>
                    {YEAR_OPTIONS.map((y) => <option key={y} value={y} style={{ background: "#111113" }}>{y}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Teacher Filters */}
            <div>
              <h3 style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-1)", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                <GraduationCap size={14} style={{ color: "#f59e0b" }} /> Faculty Filters
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div>
                  <p style={{ fontSize: "0.75rem", color: "var(--text-2)", marginBottom: 4 }}>Department</p>
                  <select className="input" value={filterDept} onChange={(e) => setFilterDept(e.target.value)}>
                    <option value="" style={{ background: "#111113" }}>All Departments</option>
                    {DEPARTMENT_OPTIONS.map((d) => <option key={d} value={d} style={{ background: "#111113" }}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <p style={{ fontSize: "0.75rem", color: "var(--text-2)", marginBottom: 4 }}>Subject Expertise</p>
                  <select className="input" value={filterSubject} onChange={(e) => setFilterSubject(e.target.value)}>
                    <option value="" style={{ background: "#111113" }}>All Subjects</option>
                    {SUBJECT_EXPERTISE_OPTIONS.map((s) => <option key={s} value={s} style={{ background: "#111113" }}>{s}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>
          
          <div style={{ borderTop: "1px solid var(--border)", paddingTop: "1.25rem" }}>
            <p style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-2)", marginBottom: 8 }}>Popular Skills</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
              {SKILL_OPTIONS.map((s) => (
                <SkillBadge key={s} skill={s} selected={skills.includes(s)} onClick={() => toggleSkill(s)} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Results Area */}
      {isLoading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          <div>
            <h2 className="heading-md" style={{ marginBottom: "1rem" }}>Teacher Mentors</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1.25rem" }}>
              {Array.from({ length: 3 }).map((_, i) => <div key={`t-${i}`} className="skeleton" style={{ height: 220, borderRadius: 14 }} />)}
            </div>
          </div>
          <div>
            <h2 className="heading-md" style={{ marginBottom: "1rem" }}>Student Mentors</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1.25rem" }}>
              {Array.from({ length: 3 }).map((_, i) => <div key={`s-${i}`} className="skeleton" style={{ height: 200, borderRadius: 12 }} />)}
            </div>
          </div>
        </div>
      ) : !hasResults ? (
        <div style={{ textAlign: "center", padding: "6rem 0" }} className="anim-2">
          <p style={{ fontSize: "3rem", marginBottom: 12 }}>🔍</p>
          <p className="heading-sm" style={{ marginBottom: 6 }}>No mentors found</p>
          <p style={{ fontSize: "0.85rem", color: "var(--text-2)", marginBottom: 24, maxWidth: 400, margin: "0 auto 24px" }}>
            We couldn't find any student or teacher mentors matching your current search and filters.
          </p>
          <button onClick={clearAll} className="btn btn-primary">Clear all filters & search</button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "3rem" }}>
          {/* Teacher Mentors Section */}
          {filteredTeachers.length > 0 && (
            <div className="anim-2">
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "1.25rem" }}>
                <h2 className="heading-md" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <GraduationCap style={{ color: "#f59e0b" }} size={22} />
                  Teacher Mentors
                </h2>
                <span style={{
                  background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.3)",
                  borderRadius: 99, padding: "0.15rem 0.6rem", fontSize: "0.68rem",
                  fontWeight: 700, color: "#f59e0b",
                }}>VERIFIED FACULTY</span>
                <span style={{ marginLeft: "auto", fontSize: "0.85rem", color: "var(--text-3)" }}>
                  {filteredTeachers.length} {filteredTeachers.length === 1 ? "result" : "results"}
                </span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1.25rem" }}>
                {filteredTeachers.map(t => <TeacherMentorCard key={t.uid} teacher={t} />)}
              </div>
            </div>
          )}

          {/* Student Mentors Section */}
          {filteredMentors.length > 0 && (
            <div className="anim-3">
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "1.25rem" }}>
                <h2 className="heading-md" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Users className="text-accent" size={22} />
                  Student Mentors
                </h2>
                <span style={{ marginLeft: "auto", fontSize: "0.85rem", color: "var(--text-3)" }}>
                  {filteredMentors.length} {filteredMentors.length === 1 ? "result" : "results"}
                </span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1.25rem" }}>
                {filteredMentors.map(m => <MentorCard key={m.uid} mentor={m} />)}
              </div>
            </div>
          )}
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .filter-row { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

export default function MentorsPage() {
  return (
    <Suspense
      fallback={
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
          <Loader2 size={22} className="animate-spin" style={{ color: "var(--text-3)" }} />
        </div>
      }
    >
      <Content />
    </Suspense>
  );
}
