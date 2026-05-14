import { Mentor } from "@/types";

// AI-based mentor matching: rank mentors by query relevance + rating + activity
export function matchMentors(query: string, mentors: Mentor[]): Mentor[] {
  const keywords = query.toLowerCase().split(/\s+/).filter(Boolean);

  const scored = mentors.map((mentor) => {
    let score = 0;

    // Skill match
    keywords.forEach((kw) => {
      mentor.skills.forEach((skill) => {
        if (skill.toLowerCase().includes(kw) || kw.includes(skill.toLowerCase())) {
          score += 10;
        }
      });
      if (mentor.bio?.toLowerCase().includes(kw)) score += 3;
      if (mentor.name.toLowerCase().includes(kw)) score += 2;
      if (mentor.branch.toLowerCase().includes(kw)) score += 2;
    });

    // Boost by rating and activity
    score += mentor.rating * 2;
    score += Math.min(mentor.totalSessions * 0.5, 10);
    // Boost fast responders
    if (mentor.responseTimeHours <= 4) score += 5;
    else if (mentor.responseTimeHours <= 12) score += 2;

    return { mentor, score };
  });

  return scored
    .filter((s) => s.score > 0 || keywords.length === 0)
    .sort((a, b) => b.score - a.score)
    .map((s) => s.mentor);
}

// AI pre-solver: basic answers for common doubts
export function preSolveQuery(query: string): string | null {
  const q = query.toLowerCase();

  if (q.includes("dsa") || q.includes("data structure")) {
    return "For DSA, start with arrays and strings, then move to linked lists, trees, graphs, and dynamic programming. LeetCode's Top 150 is a great structured roadmap!";
  }
  if (q.includes("placements") || q.includes("placement prep")) {
    return "For placements: 1) Master DSA (LeetCode), 2) Build 2-3 good projects, 3) Prepare CS fundamentals (OS, DBMS, Networks), 4) Practice communication. Start 6 months before.";
  }
  if (q.includes("web dev") || q.includes("web development")) {
    return "Web dev roadmap: HTML/CSS → JavaScript → React → Node.js/Express → Databases (MongoDB/PostgreSQL). Build projects at each stage!";
  }
  if (q.includes("linux")) {
    return "Start with basic commands (ls, cd, mkdir, grep, chmod), then learn bash scripting, processes, file permissions, and networking. 'The Linux Command Line' book is excellent.";
  }
  if (q.includes("machine learning") || q.includes("ml")) {
    return "ML roadmap: Python basics → NumPy/Pandas → scikit-learn → Kaggle competitions → Deep Learning (PyTorch/TensorFlow). Andrew Ng's Coursera course is the gold standard.";
  }
  if (q.includes("resume")) {
    return "Resume tips: Keep it to 1 page, use action verbs, quantify achievements (e.g., 'improved performance by 40%'), tailor it per company. Use Jake's Resume template from overleaf.com.";
  }
  if (q.includes("interview")) {
    return "Interview prep: Practice coding on a whiteboard/paper, do mock interviews with friends, learn STAR method for behavioral questions, and research the company culture.";
  }
  if (q.includes("cgpa") || q.includes("backlog")) {
    return "Focus on understanding concepts rather than just passing. Attend classes, form study groups, solve previous year papers. Most companies need 6.5+ CGPA — aim above that.";
  }

  return null;
}
