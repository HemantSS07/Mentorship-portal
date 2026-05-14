import { supabase } from "./supabase";
import { AppUser, Mentor, HelpRequest, Session, Review, LeaderboardEntry, TeacherMentor, NotificationType, Notification } from "@/types";

// ─────────────────────────────────────────────
// USERS
// ─────────────────────────────────────────────
export async function createUser(user: Omit<AppUser, "createdAt">) {
  const { error } = await supabase.from("users").upsert({
    id: user.uid,
    uid: user.uid,
    name: user.name,
    email: user.email,
    role: user.role,
    age: user.age ?? null,
    dob: user.dob ?? null,
    branch: user.branch ?? null,
    year: user.year ?? null,
    photo_url: user.photoURL ?? null,
    saved_mentors: user.savedMentors ?? [],
  });
  if (error) {
    console.error("createUser error details:", error.message, error.details, error.hint);
    throw error;
  }
}

export async function getUser(uid: string): Promise<AppUser | null> {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("uid", uid)
    .single();

  if (error || !data) return null;

  return {
    uid: data.uid,
    name: data.name,
    email: data.email,
    role: data.role,
    age: data.age ?? undefined,
    dob: data.dob ?? undefined,
    branch: data.branch ?? "",
    year: data.year ?? "",
    photoURL: data.photo_url ?? undefined,
    savedMentors: data.saved_mentors || [],
    createdAt: data.created_at ? new Date(data.created_at) : new Date(),
  } as AppUser;
}

export async function updateUser(uid: string, updates: Partial<AppUser>) {
  const payload: any = {};
  if (updates.name !== undefined) payload.name = updates.name;
  if (updates.age !== undefined) payload.age = updates.age;
  if (updates.dob !== undefined) payload.dob = updates.dob;
  if (updates.branch !== undefined) payload.branch = updates.branch;
  if (updates.year !== undefined) payload.year = updates.year;
  if (updates.photoURL !== undefined) payload.photo_url = updates.photoURL;
  if (updates.savedMentors !== undefined) payload.saved_mentors = updates.savedMentors;

  const { error } = await supabase.from("users").update(payload).eq("uid", uid);
  if (error) {
    console.error("updateUser error:", error);
    throw error;
  }
}

// ─────────────────────────────────────────────
// MENTORS
// ─────────────────────────────────────────────
export async function createMentor(mentor: Omit<Mentor, "createdAt">) {
  const { error } = await supabase.from("mentors").upsert({
    uid: mentor.uid,
    name: mentor.name,
    email: mentor.email,
    branch: mentor.branch,
    year: mentor.year,
    skills: mentor.skills,
    bio: mentor.bio,
    rating: mentor.rating ?? 0,
    total_ratings: mentor.totalRatings ?? 0,
    total_sessions: mentor.totalSessions ?? 0,
    response_time_hours: mentor.responseTimeHours ?? 24,
    is_active: mentor.isActive ?? true,
    availability: mentor.availability ?? ["Anytime"],
    contact_method: mentor.contactMethod ?? "email",
    contact_value: mentor.contactValue ?? "",
    photo_url: mentor.photoURL ?? null,
  });
  if (error) {
    console.error("createMentor error:", error);
    throw error;
  }
}

export async function getMentor(uid: string): Promise<Mentor | null> {
  const { data, error } = await supabase
    .from("mentors")
    .select("*")
    .eq("uid", uid)
    .single();

  if (error || !data) return null;

  return {
    uid: data.uid,
    name: data.name,
    email: data.email,
    branch: data.branch,
    year: data.year,
    skills: data.skills ?? [],
    bio: data.bio ?? "",
    rating: data.rating ?? 0,
    totalRatings: data.total_ratings ?? 0,
    totalSessions: data.total_sessions ?? 0,
    responseTimeHours: data.response_time_hours ?? 24,
    isActive: data.is_active ?? true,
    availability: data.availability ?? [],
    contactMethod: data.contact_method ?? undefined,
    contactValue: data.contact_value ?? undefined,
    photoURL: data.photo_url ?? undefined,
    createdAt: data.created_at ? new Date(data.created_at) : new Date(),
  } as Mentor;
}

/** Subscribe to a single mentor's row. Fires immediately, then on every change. */
export function subscribeMentor(
  uid: string,
  callback: (mentor: Mentor | null) => void
): () => void {
  const fetch = async () => callback(await getMentor(uid));
  fetch();

  const channel = supabase
    .channel(`public:mentors:single_${uid}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "mentors", filter: `uid=eq.${uid}` },
      () => { fetch(); }
    )
    .subscribe();

  return () => { supabase.removeChannel(channel); };
}

export async function getAllMentors(): Promise<Mentor[]> {
  const { data, error } = await supabase
    .from("mentors")
    .select("*")
    .eq("is_active", true)
    .order("rating", { ascending: false });

  if (error || !data) return [];
  return data.map((m: any) => ({
    uid: m.uid,
    name: m.name,
    email: m.email,
    branch: m.branch,
    year: m.year,
    skills: m.skills ?? [],
    bio: m.bio ?? "",
    rating: m.rating ?? 0,
    totalRatings: m.total_ratings ?? 0,
    totalSessions: m.total_sessions ?? 0,
    responseTimeHours: m.response_time_hours ?? 24,
    isActive: m.is_active ?? true,
    availability: m.availability ?? [],
    contactMethod: m.contact_method ?? undefined,
    contactValue: m.contact_value ?? undefined,
    photoURL: m.photo_url ?? undefined,
    createdAt: m.created_at ? new Date(m.created_at) : new Date(),
  }));
}

export function subscribeMentors(callback: (mentors: Mentor[]) => void): () => void {
  const fetchMentors = async () => {
    callback(await getAllMentors());
  };
  fetchMentors();
  const channel = supabase
    .channel('public:mentors')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'mentors' }, () => {
      fetchMentors();
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export async function getMentorsBySkill(skill: string): Promise<Mentor[]> {
  const { data, error } = await supabase
    .from("mentors")
    .select("*")
    .eq("is_active", true)
    .contains("skills", [skill])
    .order("rating", { ascending: false });

  if (error || !data) return [];
  return data.map((m: any) => ({
    uid: m.uid,
    name: m.name,
    email: m.email,
    branch: m.branch,
    year: m.year,
    skills: m.skills ?? [],
    bio: m.bio ?? "",
    rating: m.rating ?? 0,
    totalRatings: m.total_ratings ?? 0,
    totalSessions: m.total_sessions ?? 0,
    responseTimeHours: m.response_time_hours ?? 24,
    isActive: m.is_active ?? true,
    availability: m.availability ?? [],
    contactMethod: m.contact_method ?? undefined,
    contactValue: m.contact_value ?? undefined,
    photoURL: m.photo_url ?? undefined,
    createdAt: m.created_at ? new Date(m.created_at) : new Date(),
  }));
}

export async function updateMentor(uid: string, updates: Partial<Mentor>) {
  const payload: any = {};
  if (updates.name !== undefined) payload.name = updates.name;
  if (updates.photoURL !== undefined) payload.photo_url = updates.photoURL;
  if (updates.branch !== undefined) payload.branch = updates.branch;
  if (updates.year !== undefined) payload.year = updates.year;
  if (updates.skills !== undefined) payload.skills = updates.skills;
  if (updates.bio !== undefined) payload.bio = updates.bio;
  if (updates.isActive !== undefined) payload.is_active = updates.isActive;
  if (updates.availability !== undefined) payload.availability = updates.availability;
  if (updates.contactMethod !== undefined) payload.contact_method = updates.contactMethod;
  if (updates.contactValue !== undefined) payload.contact_value = updates.contactValue;

  if (updates.rating !== undefined) payload.rating = updates.rating;
  if (updates.totalRatings !== undefined) payload.total_ratings = updates.totalRatings;
  if (updates.totalSessions !== undefined) payload.total_sessions = updates.totalSessions;

  const { error } = await supabase.from("mentors").update(payload).eq("uid", uid);
  if (error) {
    console.error("updateMentor error:", error);
    throw error;
  }
}

// ─────────────────────────────────────────────
// HELP REQUESTS
// ─────────────────────────────────────────────
export async function createRequest(req: Omit<HelpRequest, "id" | "createdAt" | "updatedAt">) {
  const { data, error } = await supabase.from("requests").insert({
    junior_uid: req.juniorUid,
    junior_name: req.juniorName,
    junior_photo: req.juniorPhoto ?? null,
    mentor_uid: req.mentorUid,
    title: req.title,
    description: req.description,
    skills: req.skills,
    status: req.status,
  }).select("id").single();

  if (error) {
    console.error("createRequest error:", error);
    throw error;
  }
  
  // Trigger notification
  await createNotification(
    req.mentorUid,
    "New Mentorship Request",
    `${req.juniorName} wants help with: ${req.title}`,
    "help_request",
    data.id
  );
  
  return data.id as string;
}

export async function getRequestsForMentor(mentorUid: string): Promise<HelpRequest[]> {
  const { data, error } = await supabase
    .from("requests")
    .select("*, users(*)")
    .eq("mentor_uid", mentorUid)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data.map((d: any) => ({
    id: d.id,
    juniorUid: d.junior_uid,
    juniorName: d.junior_name,
    juniorPhoto: d.junior_photo ?? undefined,
    juniorProfile: d.users ? {
      uid: d.users.uid,
      name: d.users.name,
      email: d.users.email,
      role: d.users.role,
      age: d.users.age ?? undefined,
      dob: d.users.dob ?? undefined,
      branch: d.users.branch ?? "",
      year: d.users.year ?? "",
      photoURL: d.users.photo_url ?? undefined,
      createdAt: d.users.created_at ? new Date(d.users.created_at) : new Date(),
    } : undefined,
    mentorUid: d.mentor_uid,
    title: d.title,
    description: d.description,
    skills: d.skills,
    status: d.status,
    createdAt: new Date(d.created_at),
    updatedAt: new Date(d.updated_at),
  }));
}

export async function getRequestsForJunior(juniorUid: string): Promise<HelpRequest[]> {
  const { data, error } = await supabase
    .from("requests")
    .select("*, users(*)")
    .eq("junior_uid", juniorUid)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data.map((d: any) => ({
    id: d.id,
    juniorUid: d.junior_uid,
    juniorName: d.junior_name,
    juniorPhoto: d.junior_photo ?? undefined,
    juniorProfile: d.users ? {
      uid: d.users.uid,
      name: d.users.name,
      email: d.users.email,
      role: d.users.role,
      age: d.users.age ?? undefined,
      dob: d.users.dob ?? undefined,
      branch: d.users.branch ?? "",
      year: d.users.year ?? "",
      photoURL: d.users.photo_url ?? undefined,
      createdAt: d.users.created_at ? new Date(d.users.created_at) : new Date(),
    } : undefined,
    mentorUid: d.mentor_uid,
    title: d.title,
    description: d.description,
    skills: d.skills,
    status: d.status,
    createdAt: new Date(d.created_at),
    updatedAt: new Date(d.updated_at),
  }));
}

export function subscribeRequestsForMentor(mentorUid: string, callback: (requests: HelpRequest[]) => void): () => void {
  const fetchRequests = async () => {
    callback(await getRequestsForMentor(mentorUid));
  };
  fetchRequests();
  
  const channel = supabase
    .channel(`public:requests:mentor_${mentorUid}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'requests', filter: `mentor_uid=eq.${mentorUid}` },
      () => {
        fetchRequests();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export function subscribeRequestsForJunior(juniorUid: string, callback: (requests: HelpRequest[]) => void): () => void {
  const fetchRequests = async () => {
    callback(await getRequestsForJunior(juniorUid));
  };
  fetchRequests();
  
  const channel = supabase
    .channel(`public:requests:junior_${juniorUid}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'requests', filter: `junior_uid=eq.${juniorUid}` },
      () => {
        fetchRequests();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export async function updateRequestStatus(requestId: string, status: HelpRequest["status"]) {
  const { error } = await supabase.from("requests").update({ status, updated_at: new Date().toISOString() }).eq("id", requestId);
  if (error) {
    console.error("updateRequestStatus error:", error);
    throw error;
  }
  
  // Trigger notification — fetch request + mentor name for a rich message
  const { data } = await supabase.from("requests").select("junior_uid, title, mentor_uid, mentor_type").eq("id", requestId).single();
  if (data) {
    // Resolve mentor's display name from the correct table
    let mentorName = "Your mentor";
    if (data.mentor_type === "teacher") {
      const { data: tm } = await supabase.from("teacher_mentors").select("name").eq("uid", data.mentor_uid).single();
      if (tm?.name) mentorName = tm.name;
    } else {
      const { data: m } = await supabase.from("mentors").select("name").eq("uid", data.mentor_uid).single();
      if (m?.name) mentorName = m.name;
    }

    const msg = status === "accepted" ? `${mentorName} accepted your mentorship request!` :
                status === "declined" ? `${mentorName} declined your mentorship request.` :
                status === "completed" ? `Your session with ${mentorName} has been marked as completed.` :
                `Your request status was updated to "${status}" by ${mentorName}.`;
    let type: NotificationType = "request_status";
    if (status === "accepted") type = "request_accepted";
    if (status === "declined") type = "request_declined";
    if (status === "completed") type = "session_completed";
    
    await createNotification(data.junior_uid, "Request Update", msg, type, requestId);
  }
}

// ─────────────────────────────────────────────
// SESSIONS
// ─────────────────────────────────────────────
export async function createSession(session: Omit<Session, "id">) {
  const { data, error } = await supabase.from("sessions").insert({
    request_id: session.requestId,
    mentor_uid: session.mentorUid,
    junior_uid: session.juniorUid,
    mentor_type: session.mentorType ?? "student",
    scheduled_at: session.scheduledAt.toISOString(),
    meet_link: session.meetLink,
    duration: session.duration,
    summary: session.summary ?? null,
    rating: session.rating ?? null,
    status: session.status,
  }).select("id").single();

  if (error) {
    console.error("createSession error:", error);
    throw error;
  }
  
  // Trigger notification — include mentor name
  const dateStr = session.scheduledAt.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
  const timeStr = session.scheduledAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  let mentorName = "Your mentor";
  const { data: mentorRow } = await supabase.from("mentors").select("name").eq("uid", session.mentorUid).single();
  if (mentorRow?.name) {
    mentorName = mentorRow.name;
  } else {
    // Try teacher_mentors table as fallback
    const { data: tmRow } = await supabase.from("teacher_mentors").select("name").eq("uid", session.mentorUid).single();
    if (tmRow?.name) mentorName = tmRow.name;
  }

  await createNotification(
    session.juniorUid,
    "Session Scheduled",
    `${mentorName} scheduled a session with you on ${dateStr} at ${timeStr}.`,
    "session_scheduled",
    data.id
  );
  
  return data.id as string;
}

export async function getSessionsForUser(userId: string, role: "mentor" | "junior"): Promise<Session[]> {
  const field = role === "mentor" ? "mentor_uid" : "junior_uid";
  const { data, error } = await supabase
    .from("sessions")
    .select("*")
    .eq(field, userId)
    .order("scheduled_at", { ascending: false });

  if (error || !data) return [];
  return data.map((d: any) => ({
    id: d.id,
    requestId: d.request_id,
    mentorUid: d.mentor_uid,
    juniorUid: d.junior_uid,
    mentorType: (d.mentor_type === "teacher" ? "teacher" : "student") as "teacher" | "student",
    scheduledAt: new Date(d.scheduled_at),
    meetLink: d.meet_link,
    duration: d.duration,
    summary: d.summary ?? undefined,
    rating: d.rating ?? undefined,
    status: d.status,
  }));
}

export function subscribeSessionsForUser(userId: string, role: "mentor" | "junior", callback: (sessions: Session[]) => void): () => void {
  const field = role === "mentor" ? "mentor_uid" : "junior_uid";
  const fetchSessions = async () => {
    callback(await getSessionsForUser(userId, role));
  };
  fetchSessions();
  
  const channel = supabase
    .channel(`public:sessions:${role}_${userId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'sessions', filter: `${field}=eq.${userId}` },
      () => {
        fetchSessions();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

// ─────────────────────────────────────────────
// REVIEWS
// ─────────────────────────────────────────────
export async function addReview(review: Omit<Review, "id" | "createdAt"> & { sessionId?: string }) {
  const { error } = await supabase.from("reviews").insert({
    session_id: review.sessionId ?? "direct",
    mentor_id: review.mentorId,
    from_user_id: review.fromUserId,
    from_user_name: review.fromUserName,
    rating: review.rating,
    comment: review.comment,
  });
  if (error) {
    console.error("addReview error:", error);
    throw error;
  }

  // Recalculate mentor rating
  const { data: reviews } = await supabase.from("reviews").select("rating").eq("mentor_id", review.mentorId);
  if (reviews && reviews.length > 0) {
    const avg = reviews.reduce((s: number, r: any) => s + r.rating, 0) / reviews.length;
    await supabase.from("mentors").update({
      rating: Math.round(avg * 10) / 10,
      total_ratings: reviews.length,
    }).eq("uid", review.mentorId);
  }
}

export async function hasUserReviewedMentor(fromUserId: string, mentorUid: string): Promise<boolean> {
  const { data } = await supabase
    .from("reviews")
    .select("id")
    .eq("mentor_id", mentorUid)
    .eq("from_user_id", fromUserId)
    .maybeSingle();
  return !!data;
}

export function subscribeReviewsForMentor(
  mentorUid: string,
  callback: (reviews: Review[]) => void
): () => void {
  const fetchReviews = async () => {
    callback(await getReviewsForMentor(mentorUid));
  };
  fetchReviews();

  const channel = supabase
    .channel(`public:reviews:mentor_${mentorUid}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "reviews", filter: `mentor_id=eq.${mentorUid}` },
      () => { fetchReviews(); }
    )
    .subscribe();

  return () => { supabase.removeChannel(channel); };
}

export async function getReviewsForMentor(mentorUid: string): Promise<Review[]> {
  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .eq("mentor_id", mentorUid)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data.map((d: any) => ({
    id: d.id,
    sessionId: d.session_id,
    mentorId: d.mentor_id,
    fromUserId: d.from_user_id,
    fromUserName: d.from_user_name,
    rating: d.rating,
    comment: d.comment,
    createdAt: new Date(d.created_at),
  }));
}

export async function updateSessionStatus(sessionId: string, status: Session["status"]) {
  const { error } = await supabase
    .from("sessions")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", sessionId);
  if (error) {
    console.error("updateSessionStatus error:", error);
    throw error;
  }

  // Auto-increment mentor's total_sessions when a session is marked completed
  if (status === "completed") {
    const { data: sessionData } = await supabase
      .from("sessions")
      .select("mentor_uid")
      .eq("id", sessionId)
      .single();
    if (sessionData?.mentor_uid) {
      const { data: mentorData } = await supabase
        .from("mentors")
        .select("total_sessions")
        .eq("uid", sessionData.mentor_uid)
        .single();
      if (mentorData) {
        await supabase
          .from("mentors")
          .update({ total_sessions: (mentorData.total_sessions ?? 0) + 1 })
          .eq("uid", sessionData.mentor_uid);
      }
    }
  }
}

export async function updateSession(sessionId: string, updates: Partial<Session>) {
  const payload: any = {};
  if (updates.scheduledAt !== undefined) payload.scheduled_at = updates.scheduledAt.toISOString();
  if (updates.meetLink !== undefined) payload.meet_link = updates.meetLink;
  if (updates.duration !== undefined) payload.duration = updates.duration;
  if (updates.status !== undefined) payload.status = updates.status;

  const { error } = await supabase
    .from("sessions")
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq("id", sessionId);
  if (error) {
    console.error("updateSession error:", error);
    throw error;
  }
}

// ─────────────────────────────────────────────
// RESCHEDULE REQUESTS
// ─────────────────────────────────────────────
export async function createRescheduleRequest(req: Omit<import("@/types").RescheduleRequest, "id" | "createdAt">) {
  const { data, error } = await supabase.from("reschedule_requests").insert({
    session_id: req.sessionId,
    requester_uid: req.requesterUid,
    mentor_uid: req.mentorUid,
    junior_uid: req.juniorUid,
    current_session_time: req.currentSessionTime.toISOString(),
    proposed_new_time: req.proposedNewTime.toISOString(),
    proposed_duration: req.proposedDuration,
    reason: req.reason ?? null,
    status: req.status,
  }).select("id").single();

  if (error) {
    console.error("createRescheduleRequest error:", error);
    throw error;
  }

  // Determine who to notify
  const notifyUid = req.requesterUid === req.juniorUid ? req.mentorUid : req.juniorUid;
  
  await createNotification(
    notifyUid,
    "Reschedule Requested",
    `A new time has been proposed for your upcoming session.`,
    "reschedule_requested",
    data.id
  );
  
  return data.id as string;
}

export async function getRescheduleRequestsForUser(userId: string, role: "mentor" | "junior"): Promise<import("@/types").RescheduleRequest[]> {
  const field = role === "mentor" ? "mentor_uid" : "junior_uid";
  const { data, error } = await supabase
    .from("reschedule_requests")
    .select("*")
    .eq(field, userId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data.map((d: any) => ({
    id: d.id,
    sessionId: d.session_id,
    requesterUid: d.requester_uid,
    mentorUid: d.mentor_uid,
    juniorUid: d.junior_uid,
    currentSessionTime: new Date(d.current_session_time),
    proposedNewTime: new Date(d.proposed_new_time),
    proposedDuration: d.proposed_duration,
    reason: d.reason ?? undefined,
    status: d.status,
    createdAt: new Date(d.created_at),
  }));
}

export function subscribeRescheduleRequestsForUser(userId: string, role: "mentor" | "junior", callback: (requests: import("@/types").RescheduleRequest[]) => void): () => void {
  const field = role === "mentor" ? "mentor_uid" : "junior_uid";
  const fetchReqs = async () => callback(await getRescheduleRequestsForUser(userId, role));
  fetchReqs();
  
  const channel = supabase
    .channel(`public:reschedule_requests:${role}_${userId}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "reschedule_requests", filter: `${field}=eq.${userId}` },
      () => { fetchReqs(); }
    )
    .subscribe();

  return () => { supabase.removeChannel(channel); };
}

export async function updateRescheduleRequestStatus(reqId: string, status: "approved" | "rejected", notifyUid?: string) {
  const { error } = await supabase
    .from("reschedule_requests")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", reqId);
    
  if (error) {
    console.error("updateRescheduleRequestStatus error:", error);
    throw error;
  }

  if (notifyUid) {
    await createNotification(
      notifyUid,
      `Reschedule ${status === "approved" ? "Approved" : "Rejected"}`,
      `Your session reschedule request was ${status}.`,
      status === "approved" ? "reschedule_approved" : "reschedule_rejected",
      reqId
    );
  }
}

// ─────────────────────────────────────────────
// LEADERBOARD
// ─────────────────────────────────────────────
export async function getLeaderboard(limit = 10): Promise<LeaderboardEntry[]> {
  const { data, error } = await supabase
    .from("mentors")
    .select("uid, name, skills, rating, total_ratings, total_sessions, response_time_hours, photo_url")
    .eq("is_active", true)
    .order("rating", { ascending: false })
    .order("total_sessions", { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return data.map((m: any) => ({
    uid: m.uid,
    name: m.name,
    skills: m.skills ?? [],
    rating: m.rating ?? 0,
    totalRatings: m.total_ratings ?? 0,
    totalSessions: m.total_sessions ?? 0,
    responseTimeHours: m.response_time_hours ?? 24,
    photoURL: m.photo_url ?? undefined,
  }));
}

export function subscribeLeaderboard(
  limit: number,
  callback: (entries: LeaderboardEntry[]) => void
): () => void {
  const fetch = async () => callback(await getLeaderboard(limit));
  fetch();

  const channel = supabase
    .channel("public:mentors:leaderboard")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "mentors" },
      () => { fetch(); }
    )
    .subscribe();

  return () => { supabase.removeChannel(channel); };
}

// ─────────────────────────────────────────────
// TEACHER MENTORS
// ─────────────────────────────────────────────
function mapTeacherMentor(d: any): TeacherMentor {
  return {
    uid: d.uid,
    name: d.name,
    email: d.email,
    photoURL: d.photo_url ?? undefined,
    department: d.department,
    designation: d.designation,
    subjectExpertise: d.subject_expertise ?? [],
    yearsExperience: d.years_experience ?? 0,
    bio: d.bio ?? "",
    availability: d.availability ?? [],
    contactMethod: d.contact_method ?? undefined,
    contactValue: d.contact_value ?? undefined,
    rating: d.rating ?? 0,
    totalRatings: d.total_ratings ?? 0,
    totalSessions: d.total_sessions ?? 0,
    responseTimeHours: d.response_time_hours ?? 24,
    isActive: d.is_active ?? true,
    isVerified: d.is_verified ?? true,
    createdAt: d.created_at ? new Date(d.created_at) : new Date(),
  };
}

export async function createTeacherMentor(teacher: Omit<TeacherMentor, "createdAt">) {
  const { error } = await supabase.from("teacher_mentors").upsert({
    uid: teacher.uid,
    name: teacher.name,
    email: teacher.email,
    photo_url: teacher.photoURL ?? null,
    department: teacher.department,
    designation: teacher.designation,
    subject_expertise: teacher.subjectExpertise,
    years_experience: teacher.yearsExperience,
    bio: teacher.bio ?? "",
    availability: teacher.availability ?? ["Anytime"],
    contact_method: teacher.contactMethod ?? "email",
    contact_value: teacher.contactValue ?? "",
    rating: teacher.rating ?? 0,
    total_ratings: teacher.totalRatings ?? 0,
    total_sessions: teacher.totalSessions ?? 0,
    response_time_hours: teacher.responseTimeHours ?? 24,
    is_active: teacher.isActive ?? true,
    is_verified: teacher.isVerified ?? true,
  });
  if (error) {
    console.error("createTeacherMentor error:", error);
    throw error;
  }
}

export async function getTeacherMentor(uid: string): Promise<TeacherMentor | null> {
  const { data, error } = await supabase
    .from("teacher_mentors")
    .select("*")
    .eq("uid", uid)
    .single();
  if (error || !data) return null;
  return mapTeacherMentor(data);
}

export async function getAllTeacherMentors(): Promise<TeacherMentor[]> {
  const { data, error } = await supabase
    .from("teacher_mentors")
    .select("*")
    .eq("is_active", true)
    .order("rating", { ascending: false });
  if (error || !data) return [];
  return data.map(mapTeacherMentor);
}

export function subscribeTeacherMentors(callback: (teachers: TeacherMentor[]) => void): () => void {
  const fetch = async () => callback(await getAllTeacherMentors());
  fetch();
  const channel = supabase
    .channel("public:teacher_mentors")
    .on("postgres_changes", { event: "*", schema: "public", table: "teacher_mentors" }, () => { fetch(); })
    .subscribe();
  return () => { supabase.removeChannel(channel); };
}

export function subscribeTeacherMentor(uid: string, callback: (t: TeacherMentor | null) => void): () => void {
  const fetch = async () => callback(await getTeacherMentor(uid));
  fetch();
  const channel = supabase
    .channel(`public:teacher_mentors:single_${uid}`)
    .on("postgres_changes", { event: "*", schema: "public", table: "teacher_mentors", filter: `uid=eq.${uid}` }, () => { fetch(); })
    .subscribe();
  return () => { supabase.removeChannel(channel); };
}

export async function updateTeacherMentor(uid: string, updates: Partial<TeacherMentor>) {
  const payload: any = {};
  if (updates.name !== undefined) payload.name = updates.name;
  if (updates.photoURL !== undefined) payload.photo_url = updates.photoURL;
  if (updates.department !== undefined) payload.department = updates.department;
  if (updates.designation !== undefined) payload.designation = updates.designation;
  if (updates.subjectExpertise !== undefined) payload.subject_expertise = updates.subjectExpertise;
  if (updates.yearsExperience !== undefined) payload.years_experience = updates.yearsExperience;
  if (updates.bio !== undefined) payload.bio = updates.bio;
  if (updates.availability !== undefined) payload.availability = updates.availability;
  if (updates.contactMethod !== undefined) payload.contact_method = updates.contactMethod;
  if (updates.contactValue !== undefined) payload.contact_value = updates.contactValue;
  if (updates.isActive !== undefined) payload.is_active = updates.isActive;
  if (updates.rating !== undefined) payload.rating = updates.rating;
  if (updates.totalRatings !== undefined) payload.total_ratings = updates.totalRatings;
  if (updates.totalSessions !== undefined) payload.total_sessions = updates.totalSessions;
  const { error } = await supabase.from("teacher_mentors").update(payload).eq("uid", uid);
  if (error) { console.error("updateTeacherMentor error:", error); throw error; }
}

// ─────────────────────────────────────────────
// TEACHER MENTOR — REQUESTS (reuse requests table with mentor_type='teacher')
// ─────────────────────────────────────────────
export async function createTeacherRequest(req: Omit<HelpRequest, "id" | "createdAt" | "updatedAt">) {
  const { data, error } = await supabase.from("requests").insert({
    junior_uid: req.juniorUid,
    junior_name: req.juniorName,
    junior_photo: req.juniorPhoto ?? null,
    mentor_uid: req.mentorUid,
    mentor_type: "teacher",
    title: req.title,
    description: req.description,
    skills: req.skills,
    status: req.status,
  }).select("id").single();
  if (error) { console.error("createTeacherRequest error:", error); throw error; }

  // Trigger notification
  await createNotification(
    req.mentorUid,
    "New Mentorship Request",
    `${req.juniorName} sent a mentorship request: ${req.title}`,
    "help_request",
    data.id
  );

  return data.id as string;
}

function mapRequest(d: any): HelpRequest {
  return {
    id: d.id,
    juniorUid: d.junior_uid,
    juniorName: d.junior_name,
    juniorPhoto: d.junior_photo ?? undefined,
    juniorProfile: d.users ? {
      uid: d.users.uid, name: d.users.name, email: d.users.email,
      role: d.users.role, age: d.users.age ?? undefined, dob: d.users.dob ?? undefined,
      branch: d.users.branch ?? "", year: d.users.year ?? "",
      photoURL: d.users.photo_url ?? undefined,
      createdAt: d.users.created_at ? new Date(d.users.created_at) : new Date(),
    } : undefined,
    mentorUid: d.mentor_uid,
    mentorType: d.mentor_type === "teacher" ? "teacher" : "student",
    title: d.title,
    description: d.description,
    skills: d.skills,
    status: d.status,
    createdAt: new Date(d.created_at),
    updatedAt: new Date(d.updated_at),
  };
}

export async function getRequestsForTeacherMentor(mentorUid: string): Promise<HelpRequest[]> {
  const { data, error } = await supabase
    .from("requests")
    .select("*, users(*)")
    .eq("mentor_uid", mentorUid)
    .eq("mentor_type", "teacher")
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data.map(mapRequest);
}

export function subscribeRequestsForTeacherMentor(mentorUid: string, callback: (requests: HelpRequest[]) => void): () => void {
  const fetch = async () => callback(await getRequestsForTeacherMentor(mentorUid));
  fetch();
  const channel = supabase
    .channel(`public:requests:teacher_${mentorUid}`)
    .on("postgres_changes", { event: "*", schema: "public", table: "requests", filter: `mentor_uid=eq.${mentorUid}` }, () => { fetch(); })
    .subscribe();
  return () => { supabase.removeChannel(channel); };
}

export async function getRequestsForJuniorFromTeachers(juniorUid: string): Promise<HelpRequest[]> {
  const { data, error } = await supabase
    .from("requests")
    .select("*, users(*)")
    .eq("junior_uid", juniorUid)
    .eq("mentor_type", "teacher")
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data.map(mapRequest);
}

// ─────────────────────────────────────────────
// TEACHER MENTOR — REVIEWS
// ─────────────────────────────────────────────
export async function addTeacherReview(review: Omit<Review, "id" | "createdAt"> & { sessionId?: string }) {
  const { error } = await supabase.from("reviews").insert({
    session_id: review.sessionId ?? "direct",
    mentor_id: review.mentorId,
    from_user_id: review.fromUserId,
    from_user_name: review.fromUserName,
    rating: review.rating,
    comment: review.comment,
  });
  if (error) { console.error("addTeacherReview error:", error); throw error; }

  // Recalculate teacher mentor rating
  const { data: reviews } = await supabase.from("reviews").select("rating").eq("mentor_id", review.mentorId);
  if (reviews && reviews.length > 0) {
    const avg = reviews.reduce((s: number, r: any) => s + r.rating, 0) / reviews.length;
    await supabase.from("teacher_mentors").update({
      rating: Math.round(avg * 10) / 10,
      total_ratings: reviews.length,
    }).eq("uid", review.mentorId);
  }
}

export function subscribeReviewsForTeacherMentor(mentorUid: string, callback: (reviews: Review[]) => void): () => void {
  const fetchReviews = async () => {
    const { data, error } = await supabase.from("reviews").select("*").eq("mentor_id", mentorUid).order("created_at", { ascending: false });
    if (!error && data) {
      callback(data.map((d: any) => ({
        id: d.id, sessionId: d.session_id, mentorId: d.mentor_id,
        fromUserId: d.from_user_id, fromUserName: d.from_user_name,
        rating: d.rating, comment: d.comment, createdAt: new Date(d.created_at),
      })));
    }
  };
  fetchReviews();
  const channel = supabase
    .channel(`public:reviews:teacher_${mentorUid}`)
    .on("postgres_changes", { event: "*", schema: "public", table: "reviews", filter: `mentor_id=eq.${mentorUid}` }, () => { fetchReviews(); })
    .subscribe();
  return () => { supabase.removeChannel(channel); };
}

// ─────────────────────────────────────────────
// TEACHER MENTOR — SESSION STATUS
// ─────────────────────────────────────────────
export async function updateTeacherSessionStatus(sessionId: string, status: Session["status"]) {
  const { error } = await supabase
    .from("sessions")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", sessionId);
  if (error) { console.error("updateTeacherSessionStatus error:", error); throw error; }

  if (status === "completed") {
    const { data: sessionData } = await supabase.from("sessions").select("mentor_uid").eq("id", sessionId).single();
    if (sessionData?.mentor_uid) {
      const { data: teacherData } = await supabase.from("teacher_mentors").select("total_sessions").eq("uid", sessionData.mentor_uid).single();
      if (teacherData) {
        await supabase.from("teacher_mentors").update({ total_sessions: (teacherData.total_sessions ?? 0) + 1 }).eq("uid", sessionData.mentor_uid);
      }
    }
  }
}

// ─────────────────────────────────────────────
// NOTIFICATIONS & BOOKMARKS
// ─────────────────────────────────────────────

export async function createNotification(userId: string, title: string, message: string, type: NotificationType, relatedId?: string) {
  const payload: any = {
    user_id: userId,
    title,
    message,
    type,
    read: false,
  };
  if (relatedId) {
    payload.related_id = relatedId;
  }
  
  const { error } = await supabase.from("notifications").insert(payload);
  if (error) console.error("createNotification error:", error);
}

export function subscribeNotifications(userId: string, callback: (nots: Notification[]) => void) {
  const fetchNots = () => {
    supabase.from("notifications").select("*").eq("user_id", userId).order("created_at", { ascending: false }).then(({ data }) => {
      if (data) {
        callback(data.map((d: any) => ({
          id: d.id, userId: d.user_id, title: d.title, message: d.message,
          type: d.type, read: d.read, relatedId: d.related_id, createdAt: new Date(d.created_at)
        })));
      }
    });
  };

  fetchNots();
  const channel = supabase.channel(`public:notifications:user_id=eq.${userId}`)
    .on("postgres_changes", { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` }, fetchNots)
    .subscribe();
  return () => { supabase.removeChannel(channel); };
}

export async function markNotificationRead(id: string) {
  const { error } = await supabase.from("notifications").update({ read: true }).eq("id", id);
  if (error) console.error("markNotificationRead error:", error);
}

export async function markAllNotificationsRead(userId: string) {
  const { error } = await supabase.from("notifications").update({ read: true }).eq("user_id", userId).eq("read", false);
  if (error) console.error("markAllNotificationsRead error:", error);
}

export async function toggleSavedMentor(userId: string, mentorUid: string, isSaved: boolean) {
  const user = await getUser(userId);
  if (!user) return;
  const currentSaved = user.savedMentors || [];
  let newSaved;
  if (isSaved) {
    newSaved = currentSaved.filter(m => m !== mentorUid);
  } else {
    newSaved = [...currentSaved, mentorUid];
  }
  await updateUser(userId, { savedMentors: newSaved });
}
