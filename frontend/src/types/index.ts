export type UserRole = "junior" | "mentor" | "teacher_mentor";

export interface AppUser {
  uid: string;
  name: string;
  email: string;
  photoURL?: string;
  role: UserRole;
  age?: number;
  dob?: string;
  branch: string;
  year: string;
  savedMentors?: string[];
  createdAt: Date;
}

export interface Mentor {
  uid: string;
  name: string;
  email: string;
  role?: string;          // always "mentor" — used for Firestore queries
  photoURL?: string;
  age?: number;
  dob?: string;
  contactMethod?: string; // "whatsapp" or "email"
  contactValue?: string;
  branch: string;
  year: string;
  skills: string[];
  bio: string;
  availability: string[];
  rating: number;
  totalRatings: number;
  totalSessions: number;
  responseTimeHours: number;
  isActive: boolean;
  linkedIn?: string;
  github?: string;
  achievements?: string[];
  createdAt: Date;
}

export interface TeacherMentor {
  uid: string;
  name: string;
  email: string;
  photoURL?: string;
  department: string;
  designation: string;
  subjectExpertise: string[];
  yearsExperience: number;
  bio: string;
  availability: string[];
  contactMethod?: string;
  contactValue?: string;
  rating: number;
  totalRatings: number;
  totalSessions: number;
  responseTimeHours: number;
  isActive: boolean;
  isVerified: boolean;
  createdAt: Date;
}

export interface HelpRequest {
  id: string;
  juniorUid: string;
  juniorName: string;
  juniorPhoto?: string;
  juniorProfile?: AppUser;
  mentorUid: string;
  mentorType?: "student" | "teacher";
  title: string;
  description: string;
  skills: string[];
  status: "pending" | "accepted" | "declined" | "completed";
  createdAt: Date;
  updatedAt: Date;
}

export interface Session {
  id: string;
  requestId: string;
  mentorUid: string;
  juniorUid: string;
  mentorType?: "student" | "teacher";
  scheduledAt: Date;
  meetLink: string;
  duration: number; // minutes
  summary?: string;
  rating?: number;
  status: "upcoming" | "completed" | "cancelled";
}

export interface RescheduleRequest {
  id: string;
  sessionId: string;
  requesterUid: string;
  mentorUid: string;
  juniorUid: string;
  currentSessionTime: Date;
  proposedNewTime: Date;
  proposedDuration: number;
  reason?: string;
  status: "pending" | "approved" | "rejected";
  createdAt: Date;
}

export interface Review {
  id: string;
  sessionId: string;
  mentorId: string;
  fromUserId: string;
  fromUserName: string;
  rating: number;
  comment: string;
  createdAt: Date;
}

export type NotificationType = "help_request" | "request_accepted" | "request_declined" | "session_scheduled" | "session_reminder" | "session_completed" | "new_review" | "profile_update" | "system" | "request_status" | "reschedule_requested" | "reschedule_approved" | "reschedule_rejected";

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  relatedId?: string;
  createdAt: Date;
}

export interface LeaderboardEntry {
  uid: string;
  name: string;
  skills: string[];
  rating: number;
  totalRatings: number;
  totalSessions: number;
  responseTimeHours: number;
  photoURL?: string;
}

export const SKILL_OPTIONS = [
  "DSA",
  "Web Development",
  "Linux",
  "System Design",
  "Machine Learning",
  "Deep Learning",
  "React",
  "Node.js",
  "Python",
  "Java",
  "C++",
  "Competitive Programming",
  "DevOps",
  "Cloud Computing",
  "Android Development",
  "iOS Development",
  "Database",
  "Networking",
  "Cybersecurity",
  "Open Source",
  "Resume Building",
  "Interview Prep",
  "GATE Preparation",
  "Aptitude",
];

export const BRANCH_OPTIONS = [
  "Computer Science",
  "Information Technology",
  "Electronics & Communication",
  "Electrical Engineering",
  "Mechanical Engineering",
  "Civil Engineering",
  "Chemical Engineering",
  "Biotechnology",
  "Mathematics & Computing",
  "Other",
];

export const YEAR_OPTIONS = ["1st Year", "2nd Year", "3rd Year", "4th Year", "Alumni"];

export const AVAILABILITY_OPTIONS = [
  "Weekday Mornings",
  "Weekday Evenings",
  "Weekend Mornings",
  "Weekend Evenings",
  "Anytime",
];

export const DEPARTMENT_OPTIONS = [
  "Computer Science & Engineering",
  "Information Technology",
  "Electronics & Communication Engineering",
  "Electrical Engineering",
  "Mechanical Engineering",
  "Civil Engineering",
  "Chemical Engineering",
  "Biotechnology",
  "Mathematics",
  "Physics",
  "Chemistry",
  "Humanities & Social Sciences",
  "Management Studies",
  "Other",
];

export const DESIGNATION_OPTIONS = [
  "Professor",
  "Associate Professor",
  "Assistant Professor",
  "Senior Lecturer",
  "Lecturer",
  "Visiting Faculty",
  "Industry Expert",
  "Research Scholar (PhD)",
  "Post-Doctoral Fellow",
  "Head of Department",
  "Dean",
];

export const SUBJECT_EXPERTISE_OPTIONS = [
  "Data Structures & Algorithms",
  "Operating Systems",
  "Computer Networks",
  "Database Management Systems",
  "Software Engineering",
  "Theory of Computation",
  "Compiler Design",
  "Computer Architecture",
  "Artificial Intelligence",
  "Machine Learning",
  "Deep Learning",
  "Natural Language Processing",
  "Computer Vision",
  "Distributed Systems",
  "Cloud Computing",
  "Cybersecurity",
  "Embedded Systems",
  "Digital Signal Processing",
  "Control Systems",
  "Vlsi Design",
  "Data Science",
  "Big Data Analytics",
  "Web Technologies",
  "Mobile Computing",
  "IoT",
  "Blockchain",
  "Research Methodology",
  "Technical Writing",
  "Project Management",
  "Entrepreneurship",
];
