"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import {
  subscribeTeacherMentor, subscribeRequestsForTeacherMentor,
  updateRequestStatus, updateTeacherMentor, subscribeSessionsForUser,
  subscribeReviewsForTeacherMentor, updateTeacherSessionStatus,
  subscribeRescheduleRequestsForUser
} from "@/lib/db";
import { HelpRequest, Session, TeacherMentor, Review, AVAILABILITY_OPTIONS, RescheduleRequest } from "@/types";
import {
  Loader2, Bell, CheckCircle, XCircle, Zap, Calendar, BarChart2,
  ToggleLeft, ToggleRight, GraduationCap, Star, Users, Clock,
  Plus, Trash2, Shield, Award, Video, Edit3, X
} from "lucide-react";
import SessionSchedulerModal from "@/components/SessionSchedulerModal";
import TeacherSessionCard from "@/components/TeacherSessionCard";
import LeaderboardWidget from "@/components/LeaderboardWidget";
import toast from "react-hot-toast";
import RouteGuard from "@/components/RouteGuard";
import { formatDistanceToNow, format } from "date-fns";
import StarRating from "@/components/StarRating";
import { DEPARTMENT_OPTIONS, DESIGNATION_OPTIONS, SUBJECT_EXPERTISE_OPTIONS } from "@/types";

type Sec = "requests" | "active" | "completed" | "insights" | "schedule";
const SECTIONS: { id: Sec; label: string; icon: React.ReactNode }[] = [
  { id: "requests",  label: "Requests",        icon: <Bell size={15}/> },
  { id: "active",    label: "Active Sessions",  icon: <Zap size={15}/> },
  { id: "completed", label: "Completed",        icon: <CheckCircle size={15}/> },
  { id: "insights",  label: "Insights",         icon: <BarChart2 size={15}/> },
  { id: "schedule",  label: "Schedule",         icon: <Calendar size={15}/> },
];

function Avatar({ name, photo, size=44 }: { name:string; photo?:string; size?:number }) {
  const c = ["#7c3aed","#d97706","#059669","#2563eb"][name.charCodeAt(0)%4];
  return (
    <div style={{ width:size, height:size, borderRadius:size*0.28, flexShrink:0,
      background:photo?"transparent":`${c}22`, border:`1.5px solid ${c}44`,
      display:"flex", alignItems:"center", justifyContent:"center",
      fontSize:size*0.42, fontWeight:700, color:c }}>
      {photo ? <img src={photo} alt={name} style={{width:"100%",height:"100%",borderRadius:size*0.25,objectFit:"cover"}}/> : name[0]}
    </div>
  );
}

export default function TeacherDashboardPage() {
  const { user, loading: authLoading } = useAuthStore();
  const router = useRouter();
  const [profile, setProfile]   = useState<TeacherMentor|null>(null);
  const [requests, setRequests] = useState<HelpRequest[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [rescheduleRequests, setRescheduleRequests] = useState<RescheduleRequest[]>([]);
  const [reviews,  setReviews]  = useState<Review[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [sec,      setSec]      = useState<Sec>("requests");
  const [updating, setUpdating] = useState<string|null>(null);
  const [scheduler, setScheduler] = useState<{ req: HelpRequest, resch?: RescheduleRequest }|null>(null);
  const [newSlot,  setNewSlot]  = useState("");

  // Edit Profile state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editBio, setEditBio] = useState("");
  const [editContact, setEditContact] = useState("");
  const [editDept, setEditDept] = useState("");
  const [editDesig, setEditDesig] = useState("");
  const [editExp, setEditExp] = useState(0);
  const [editSubjects, setEditSubjects] = useState<string[]>([]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push("/auth"); return; }
    if (user.role !== "teacher_mentor") { router.replace(user.role==="mentor"?"/mentor-dashboard":"/dashboard"); return; }
    const u1 = subscribeTeacherMentor(user.uid, p => { if(p){setProfile(p); setLoading(false);} });
    const u2 = subscribeRequestsForTeacherMentor(user.uid, r => { if(r.length>0) setRequests(r); });
    const u3 = subscribeSessionsForUser(user.uid, "mentor", setSessions);
    const u4 = subscribeReviewsForTeacherMentor(user.uid, setReviews);
    const u5 = subscribeRescheduleRequestsForUser(user.uid, "mentor", setRescheduleRequests);
    setLoading(false);
    return () => { u1(); u2(); u3(); u4(); u5(); };
  }, [user, authLoading, router]);

  const accept = (req: HelpRequest) => setScheduler({ req });
  const reviewReschedule = (session: Session) => {
    const resch = rescheduleRequests.find(r => r.sessionId === session.id && r.status === "pending");
    if (!resch) return;
    // We need to pass a fake HelpRequest or look it up. Since SessionSchedulerModal uses request.juniorName, etc., we can synthesize it or find it.
    // Wait, the mentor doesn't fetch requests if they are already accepted. Let's just create a dummy request object since it only needs juniorName and title for display.
    const dummyReq = { id: session.requestId, juniorName: "Student", title: "Rescheduled Session", juniorUid: session.juniorUid } as HelpRequest;
    setScheduler({ req: dummyReq, resch });
  };
  const decline = async (id: string) => {
    setUpdating(id);
    try { await updateRequestStatus(id,"declined"); toast("Declined",{icon:"🚫"}); }
    catch { toast.error("Failed"); } finally { setUpdating(null); }
  };
  const complete = async (sid: string, rid: string) => {
    setUpdating(sid);
    try { await updateTeacherSessionStatus(sid,"completed"); await updateRequestStatus(rid,"completed"); toast.success("Session completed! 🎉"); setSec("completed"); }
    catch { toast.error("Failed"); } finally { setUpdating(null); }
  };
  const toggleActive = async () => {
    if(!profile||!user) return;
    try { await updateTeacherMentor(user.uid,{isActive:!profile.isActive}); toast.success(profile.isActive?"🔴 Offline":"🟢 Available!"); }
    catch { toast.error("Update failed"); }
  };
  const addSlot = () => {
    if(!newSlot||!profile||!user) return;
    if(profile.availability.includes(newSlot)){toast.error("Already added");return;}
    const updated=[...profile.availability,newSlot];
    updateTeacherMentor(user.uid,{availability:updated}).catch(()=>{});
    setNewSlot(""); toast.success("Slot added!");
  };
  const removeSlot = (s: string) => {
    if(!profile||!user) return;
    updateTeacherMentor(user.uid,{availability:profile.availability.filter(x=>x!==s)}).catch(()=>{});
  };

  const openEditModal = () => {
    if (!profile) return;
    setEditBio(profile.bio);
    setEditContact(profile.contactValue || "");
    setEditDept(profile.department);
    setEditDesig(profile.designation);
    setEditExp(profile.yearsExperience);
    setEditSubjects(profile.subjectExpertise);
    setEditModalOpen(true);
  };

  const toggleSubject = (s: string) => {
    setEditSubjects(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s].slice(0, 10));
  };

  const saveProfile = async () => {
    if (!user || !profile) return;
    if (!editDept) return toast.error("Department is required");
    if (!editDesig) return toast.error("Designation is required");
    if (editSubjects.length === 0) return toast.error("At least one subject is required");
    
    try {
      const updates = { 
        bio: editBio, 
        contactValue: editContact,
        department: editDept,
        designation: editDesig,
        yearsExperience: editExp,
        subjectExpertise: editSubjects
      };
      await updateTeacherMentor(user.uid, updates);
      setProfile({ ...profile, ...updates });
      toast.success("Profile updated!");
      setEditModalOpen(false);
    } catch { toast.error("Save failed"); }
  };

  if (authLoading||loading||!profile) return (
    <div className="page-wrap" style={{padding:"5rem 1.5rem",display:"flex",flexDirection:"column",alignItems:"center",gap:"1rem"}}>
      <Loader2 size={36} className="animate-spin text-accent"/>
      <p style={{color:"var(--text-3)",fontSize:"0.875rem"}}>Loading your dashboard…</p>
    </div>
  );

  const pending   = requests.filter(r=>r.status==="pending");
  const active    = requests.filter(r=>r.status==="accepted");
  const completed = requests.filter(r=>r.status==="completed");
  const acceptRate = requests.length>0?Math.round(((active.length+completed.length)/requests.length)*100):0;

  return (
    <RouteGuard allowedRoles={["teacher_mentor"]}>
      <div className="page-wrap dash-page teacher-dash-root">
        {/* ── PROFILE BANNER ── */}
      <div className="card glass anim-1" style={{position:"relative",overflow:"hidden",marginBottom:"1.5rem",padding:"1.5rem"}}>
        <div style={{position:"absolute",inset:0,background:"radial-gradient(ellipse 60% 50% at 50% 0%,rgba(245,158,11,0.12) 0%,transparent 70%)",pointerEvents:"none"}}/>
        <div style={{display:"flex",flexWrap:"wrap",gap:"1.5rem",alignItems:"flex-start",position:"relative",zIndex:1}}>
          <div style={{display:"flex",gap:"1.25rem",alignItems:"center",flex:"1 1 300px"}}>
            <div style={{position:"relative"}}>
              <Avatar name={user!.name} photo={user!.photoURL} size={76}/>
              <div style={{position:"absolute",bottom:-2,right:-4,width:16,height:16,borderRadius:"50%",background:profile.isActive?"#22c55e":"#52525b",border:"3px solid var(--bg-card)"}}/>
            </div>
            <div>
              <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",marginBottom:4}}>
                <h1 style={{fontSize:"1.4rem",fontWeight:800,margin:0}}>{user!.name}</h1>
                <span style={{background:"rgba(245,158,11,0.15)",border:"1px solid rgba(245,158,11,0.35)",borderRadius:99,padding:"0.1rem 0.6rem",fontSize:"0.68rem",fontWeight:700,color:"#f59e0b"}}>✓ VERIFIED FACULTY</span>
              </div>
              <p style={{fontSize:"0.82rem",color:"var(--text-2)",margin:"0 0 4px"}}>{profile.designation} · {profile.department}</p>
              <p style={{fontSize:"0.78rem",color:"var(--text-3)",margin:"0 0 8px"}}>{profile.yearsExperience}+ years experience</p>
              <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
                {profile.subjectExpertise.slice(0,4).map(s=>(
                  <span key={s} style={{padding:"0.15rem 0.5rem",borderRadius:99,fontSize:"0.65rem",fontWeight:500,background:"rgba(245,158,11,0.1)",color:"#d97706",border:"1px solid rgba(245,158,11,0.2)"}}>{s}</span>
                ))}
              </div>
            </div>
          </div>
          <div style={{display:"flex",gap:"0.75rem",flexWrap:"wrap",flex:"1 1 220px",alignItems:"center"}}>
            {[{v:profile.totalSessions,l:"Sessions",c:"#a78bfa"},{v:profile.rating.toFixed(1),l:"Rating",c:"#f59e0b"},{v:acceptRate+"%",l:"Accept Rate",c:"#10b981"}].map(({v,l,c})=>(
              <div key={l} style={{textAlign:"center",padding:"0.6rem 0.9rem",background:`${c}11`,borderRadius:12,border:`1px solid ${c}33`}}>
                <p style={{fontSize:"1.5rem",fontWeight:800,color:c,lineHeight:1}}>{v}</p>
                <p style={{fontSize:"0.65rem",color:"var(--text-2)",marginTop:2}}>{l}</p>
              </div>
            ))}
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:"0.6rem",minWidth:170,alignSelf:"center"}}>
            <button onClick={toggleActive} style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8,padding:"0.6rem 1rem",borderRadius:10,cursor:"pointer",background:profile.isActive?"rgba(34,197,94,0.1)":"rgba(255,255,255,0.04)",border:`1px solid ${profile.isActive?"rgba(34,197,94,0.3)":"var(--border)"}`,color:profile.isActive?"#22c55e":"var(--text-2)",fontWeight:600,fontSize:"0.875rem",fontFamily:"inherit"}}>
              <span>{profile.isActive?"Available":"Unavailable"}</span>
              {profile.isActive?<ToggleRight size={20}/>:<ToggleLeft size={20}/>}
            </button>
            <button onClick={openEditModal} className="btn btn-secondary" style={{padding:"0.5rem 1rem",fontSize:"0.8rem"}}><Edit3 size={14}/> Edit Profile</button>
          </div>
        </div>
      </div>

      {/* ── SECTION NAV ── */}
      <div style={{display:"flex",gap:4,marginBottom:"1.75rem",overflowX:"auto",paddingBottom:4}}>
        {SECTIONS.map(s=>{
          const badge=s.id==="requests"?pending.length:s.id==="active"?active.length:0;
          return (
            <button key={s.id} onClick={()=>setSec(s.id)} style={{display:"flex",alignItems:"center",gap:6,padding:"0.45rem 0.9rem",borderRadius:9,fontSize:"0.8rem",fontWeight:500,cursor:"pointer",border:"none",fontFamily:"inherit",whiteSpace:"nowrap",transition:"all 0.15s",background:sec===s.id?"rgba(245,158,11,0.12)":"transparent",color:sec===s.id?"#f59e0b":"var(--text-2)",outline:sec===s.id?"1px solid rgba(245,158,11,0.3)":"none"}}>
              {s.icon}{s.label}
              {badge>0&&<span style={{background:"#ef4444",color:"#fff",fontSize:"0.6rem",padding:"0 5px",borderRadius:99,fontWeight:700,lineHeight:"16px",minWidth:16,textAlign:"center"}}>{badge}</span>}
            </button>
          );
        })}
      </div>

      {/* ── REQUESTS ── */}
      {sec==="requests"&&(
        <div className="anim-2">
          <h2 style={{fontWeight:700,fontSize:"1.05rem",marginBottom:"1rem",display:"flex",alignItems:"center",gap:8}}><Bell size={18} style={{color:"#f59e0b"}}/>Incoming Requests <span style={{fontSize:"0.8rem",fontWeight:400,color:"var(--text-3)"}}>{pending.length} pending</span></h2>
          {pending.length===0
            ?<div className="card" style={{textAlign:"center",padding:"3rem",color:"var(--text-3)"}}><Bell size={32} style={{margin:"0 auto 12px",opacity:0.3}}/><p>No pending requests</p></div>
            :<div style={{display:"flex",flexDirection:"column",gap:12}}>
              {pending.map(req=>(
                <div key={req.id} className="card" style={{display:"flex",gap:"1rem",alignItems:"flex-start"}}>
                  <Avatar name={req.juniorName} size={44}/>
                  <div style={{flex:1,minWidth:0}}>
                    <p style={{fontSize:"0.75rem",color:"var(--text-3)",marginBottom:2}}>{req.juniorName} · <span style={{color:"var(--text-2)"}}>{formatDistanceToNow(req.createdAt,{addSuffix:true})}</span></p>
                    <h3 style={{fontWeight:600,fontSize:"0.95rem",marginBottom:4}}>{req.title}</h3>
                    <p style={{fontSize:"0.82rem",color:"var(--text-2)",marginBottom:8}}>{req.description.slice(0,120)}{req.description.length>120?"…":""}</p>
                    <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
                      {req.skills.map(s=><span key={s} style={{padding:"0.15rem 0.5rem",borderRadius:99,fontSize:"0.65rem",background:"rgba(245,158,11,0.08)",color:"#d97706",border:"1px solid rgba(245,158,11,0.2)"}}>{s}</span>)}
                    </div>
                  </div>
                  <div style={{display:"flex",flexDirection:"column",gap:6,flexShrink:0}}>
                    <button onClick={()=>accept(req)} disabled={!!updating} className="btn btn-primary" style={{fontSize:"0.78rem",padding:"0.4rem 0.75rem"}}><CheckCircle size={13}/>Accept</button>
                    <button onClick={()=>decline(req.id)} disabled={updating===req.id} className="btn btn-ghost" style={{fontSize:"0.78rem",padding:"0.4rem 0.75rem",color:"#ef4444"}}><XCircle size={13}/>Decline</button>
                  </div>
                </div>
              ))}
            </div>
          }
        </div>
      )}

      {/* ── ACTIVE SESSIONS ── */}
      {sec==="active"&&(
        <div className="anim-2">
          <h2 style={{fontWeight:700,fontSize:"1.05rem",marginBottom:"1rem",display:"flex",alignItems:"center",gap:8}}>
            <Zap size={18} style={{color:"#f59e0b"}}/>Active &amp; Upcoming Sessions
            <span style={{marginLeft:"auto",fontSize:"0.68rem",color:"#22c55e",display:"flex",alignItems:"center",gap:4,fontWeight:600}}>
              <span style={{width:6,height:6,borderRadius:"50%",background:"#22c55e",display:"inline-block",animation:"pulse-dot 1.8s infinite"}}/> Live
            </span>
          </h2>

          {/* Accepted but not yet scheduled */}
          {active.filter(r=>!sessions.some(s=>s.requestId===r.id)).length>0&&(
            <div style={{marginBottom:"1.5rem"}}>
              <p style={{fontSize:"0.75rem",color:"#f59e0b",marginBottom:8,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.05em"}}>⚠ Needs scheduling</p>
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                {active.filter(r=>!sessions.some(s=>s.requestId===r.id)).map(req=>(
                  <div key={req.id} className="card" style={{display:"flex",gap:"1rem",alignItems:"center",border:"1px solid rgba(245,158,11,0.25)",background:"rgba(245,158,11,0.03)"}}>
                    <Avatar name={req.juniorName} size={42}/>
                    <div style={{flex:1}}>
                      <p style={{fontSize:"0.75rem",color:"var(--text-3)",marginBottom:2}}>{req.juniorName}</p>
                      <p style={{fontWeight:600,fontSize:"0.9rem"}}>{req.title}</p>
                    </div>
                    <button className="btn btn-primary" style={{fontSize:"0.78rem",flexShrink:0}} onClick={()=>setScheduler(req)}>
                      <Video size={13}/>Create Session
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upcoming sessions */}
          {sessions.filter(s=>s.status==="upcoming").length===0
            ?(
              active.filter(r=>!sessions.some(s=>s.requestId===r.id)).length===0&&
              <div className="card" style={{textAlign:"center",padding:"3rem",color:"var(--text-3)"}}>
                <Video size={32} style={{margin:"0 auto 12px",opacity:0.3}}/>
                <p style={{fontWeight:600,marginBottom:4}}>No sessions scheduled yet</p>
                <p style={{fontSize:"0.82rem"}}>Accept a request and create a session to get started.</p>
              </div>
            )
            :(
              <div>
                <p style={{fontSize:"0.75rem",color:"var(--text-3)",marginBottom:10,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.05em"}}>📅 Upcoming Sessions</p>
                <div style={{display:"flex",flexDirection:"column",gap:12}}>
                  {sessions.filter(s=>s.status==="upcoming").map(s => {
                    const hasPendingReschedule = rescheduleRequests.some(r => r.sessionId === s.id && r.status === "pending");
                    return (
                      <TeacherSessionCard
                        key={s.id}
                        session={s}
                        mentor={profile}
                        isTeacherView
                        isUpdating={updating===s.id}
                        onComplete={complete}
                        hasPendingReschedule={hasPendingReschedule}
                        onReviewReschedule={() => {
                          const resch = rescheduleRequests.find(r => r.sessionId === s.id && r.status === "pending");
                          const req = requests.find(r => r.id === s.requestId);
                          setScheduler({ req, resch });
                        }}
                      />
                    );
                  })}
                </div>
              </div>
            )
          }
        </div>
      )}

      {/* ── COMPLETED ── */}
      {sec==="completed"&&(
        <div className="anim-2">
          <h2 style={{fontWeight:700,fontSize:"1.05rem",marginBottom:"1rem",display:"flex",alignItems:"center",gap:8}}>
            <Award size={18} style={{color:"#f59e0b"}}/>Completed Sessions
            <span style={{marginLeft:4,fontSize:"0.8rem",fontWeight:400,color:"var(--text-3)"}}>{sessions.filter(s=>s.status==="completed").length} sessions</span>
          </h2>
          {sessions.filter(s=>s.status==="completed").length===0
            ?<div className="card" style={{textAlign:"center",padding:"3rem",color:"var(--text-3)"}}>
                <CheckCircle size={32} style={{margin:"0 auto 12px",opacity:0.3}}/>
                <p style={{fontWeight:600,marginBottom:4}}>No completed sessions yet</p>
                <p style={{fontSize:"0.82rem"}}>Sessions marked as done will appear here.</p>
              </div>
            :<div style={{display:"flex",flexDirection:"column",gap:12}}>
              {sessions.filter(s=>s.status==="completed").map(sess=>{
                const req=requests.find(r=>r.id===sess.requestId);
                const rev=reviews.find(r=>r.fromUserId===sess.juniorUid);
                return (
                  <div key={sess.id}>
                    <TeacherSessionCard
                      session={sess}
                      mentor={profile}
                      isTeacherView={false}
                    />
                    {req&&(
                      <div style={{marginTop:8,padding:"0.65rem 0.85rem",background:"var(--bg-elevated)",borderRadius:10,border:"1px solid var(--border)",display:"flex",gap:10,alignItems:"center"}}>
                        <Avatar name={req.juniorName} size={32}/>
                        <div style={{flex:1}}>
                          <p style={{fontSize:"0.8rem",fontWeight:600}}>{req.juniorName}</p>
                          <p style={{fontSize:"0.72rem",color:"var(--text-3)"}}>{req.title}</p>
                        </div>
                        {rev
                          ?<div style={{display:"flex",gap:6,alignItems:"center"}}>
                              <StarRating rating={rev.rating} size={13}/>
                              <p style={{fontSize:"0.78rem",color:"var(--text-2)",fontStyle:"italic",maxWidth:200}} className="line-clamp-1">&#34;{rev.comment}&#34;</p>
                            </div>
                          :<span style={{fontSize:"0.72rem",color:"var(--text-3)",fontStyle:"italic"}}>No review yet</span>
                        }
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          }
        </div>
      )}

      {/* ── INSIGHTS ── */}
      {sec==="insights"&&(
        <div className="anim-2">
          <h2 style={{fontWeight:700,fontSize:"1.05rem",marginBottom:"1rem",display:"flex",alignItems:"center",gap:8}}><BarChart2 size={18} style={{color:"#f59e0b"}}/>Performance Insights</h2>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))",gap:10,marginBottom:"1.5rem"}}>
            {[{l:"Total Requests",v:String(requests.length)},{l:"Sessions Done",v:String(profile.totalSessions),c:"#a78bfa"},{l:"Accept Rate",v:acceptRate+"%",c:"#10b981"},{l:"Avg Rating",v:profile.rating.toFixed(1),c:"#f59e0b"},{l:"Resp. Time",v:profile.responseTimeHours+"h",c:"#60a5fa"}].map(({l,v,c})=>(
              <div key={l} style={{background:"var(--bg-elevated)",padding:"0.9rem",borderRadius:12,border:"1px solid var(--border)"}}>
                <p style={{fontSize:"0.68rem",color:"var(--text-2)",marginBottom:4,textTransform:"uppercase",letterSpacing:"0.05em"}}>{l}</p>
                <p style={{fontSize:"1.4rem",fontWeight:800,color:c??"var(--text-1)",lineHeight:1}}>{v}</p>
              </div>
            ))}
          </div>
          <div className="card">
            <h3 style={{fontSize:"0.9rem",fontWeight:600,marginBottom:12,display:"flex",alignItems:"center",gap:8}}><Star size={15} style={{color:"#f59e0b"}}/>Recent Feedback <span style={{marginLeft:"auto",fontSize:"0.7rem",color:"#22c55e",display:"flex",alignItems:"center",gap:4}}><span style={{width:6,height:6,borderRadius:"50%",background:"#22c55e",display:"inline-block",animation:"pulse-dot 1.8s infinite"}}/> Live</span></h3>
            {reviews.length===0?<p style={{fontSize:"0.85rem",color:"var(--text-3)",textAlign:"center",padding:"1rem 0",fontStyle:"italic"}}>No reviews yet — they appear here instantly.</p>
            :<div style={{display:"flex",flexDirection:"column",gap:8}}>
              {reviews.slice(0,5).map(rev=>(
                <div key={rev.id} style={{display:"flex",gap:"0.75rem",padding:"0.75rem",background:"var(--bg-elevated)",borderRadius:10,border:"1px solid var(--border)"}}>
                  <div style={{width:34,height:34,borderRadius:9,background:"rgba(245,158,11,0.1)",border:"1px solid rgba(245,158,11,0.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"0.85rem",fontWeight:700,color:"#f59e0b",flexShrink:0}}>{rev.fromUserName[0]}</div>
                  <div style={{flex:1}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                      <span style={{fontWeight:600,fontSize:"0.85rem"}}>{rev.fromUserName}</span>
                      <StarRating rating={rev.rating} size={12}/>
                    </div>
                    <p style={{fontSize:"0.8rem",color:"var(--text-2)",fontStyle:"italic"}}>"{rev.comment}"</p>
                  </div>
                </div>
              ))}
            </div>}
          </div>
        </div>
      )}

      {/* ── SCHEDULE ── */}
      {sec==="schedule"&&(
        <div className="anim-2">
          <h2 style={{fontWeight:700,fontSize:"1.05rem",marginBottom:"1rem",display:"flex",alignItems:"center",gap:8}}><Calendar size={18} style={{color:"#f59e0b"}}/>Schedule &amp; Availability</h2>
          <div className="card">
            <h3 style={{fontSize:"0.9rem",fontWeight:600,marginBottom:12}}>Your Available Slots</h3>
            {profile.availability.length===0?<p style={{fontSize:"0.85rem",color:"var(--text-3)"}}>No slots added yet.</p>
            :<div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:14}}>
              {profile.availability.map(slot=>(
                <div key={slot} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0.55rem 0.85rem",background:"var(--bg-elevated)",borderRadius:9,border:"1px solid var(--border)"}}>
                  <div style={{display:"flex",alignItems:"center",gap:8}}><div style={{width:7,height:7,borderRadius:"50%",background:"#22c55e"}}/><span style={{fontSize:"0.875rem"}}>{slot}</span></div>
                  <button onClick={()=>removeSlot(slot)} style={{background:"none",border:"none",cursor:"pointer",color:"var(--text-3)",padding:4,display:"flex"}}><Trash2 size={14}/></button>
                </div>
              ))}
            </div>}
            <div style={{display:"flex",gap:8}}>
              <select className="input" value={newSlot} onChange={e=>setNewSlot(e.target.value)} style={{flex:1,appearance:"none",cursor:"pointer"}}>
                <option value="">Add a slot…</option>
                {AVAILABILITY_OPTIONS.filter(o=>!profile.availability.includes(o)).map(o=><option key={o} value={o}>{o}</option>)}
              </select>
              <button onClick={addSlot} disabled={!newSlot} className="btn btn-primary" style={{padding:"0 1rem"}}><Plus size={16}/></button>
            </div>
          </div>
        </div>
      )}

      {scheduler&&user&&(
        <SessionSchedulerModal
          request={scheduler.req}
          rescheduleRequest={scheduler.resch}
          onClose={()=>setScheduler(null)}
          onSuccess={()=>{ setScheduler(null); setSec("active"); toast.success(scheduler.resch ? "Session rescheduled!" : "Session scheduled! 🎓"); }}
        />
      )}

      {/* ── EDIT PROFILE MODAL ── */}
      {editModalOpen && (
        <div style={{position:"fixed",inset:0,zIndex:100,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,0.6)",backdropFilter:"blur(4px)",padding:"1rem"}} onClick={e=>{if(e.target===e.currentTarget)setEditModalOpen(false);}}>
          <div className="card anim-1" style={{width:"100%",maxWidth:520,position:"relative",padding:"1.75rem",maxHeight:"90vh",overflowY:"auto"}}>
            <button onClick={()=>setEditModalOpen(false)} style={{position:"absolute",top:"1rem",right:"1rem",background:"none",border:"none",color:"var(--text-3)",cursor:"pointer"}}><X size={20}/></button>
            <h2 style={{fontSize:"1.15rem",fontWeight:700,marginBottom:"1.5rem"}}>Edit Profile</h2>
            <div style={{display:"flex",flexDirection:"column",gap:"1.1rem"}}>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                <div>
                  <label style={{display:"block",fontSize:"0.8rem",fontWeight:500,color:"var(--text-2)",marginBottom:6}}>Department</label>
                  <select className="input" value={editDept} onChange={e=>setEditDept(e.target.value)}>
                    {DEPARTMENT_OPTIONS.map(d=><option key={d} value={d} style={{background:"#111113"}}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{display:"block",fontSize:"0.8rem",fontWeight:500,color:"var(--text-2)",marginBottom:6}}>Designation</label>
                  <select className="input" value={editDesig} onChange={e=>setEditDesig(e.target.value)}>
                    {DESIGNATION_OPTIONS.map(d=><option key={d} value={d} style={{background:"#111113"}}>{d}</option>)}
                  </select>
                </div>
              </div>
              
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                <div>
                  <label style={{display:"block",fontSize:"0.8rem",fontWeight:500,color:"var(--text-2)",marginBottom:6}}>Years of Experience</label>
                  <input type="number" min="0" className="input" value={editExp} onChange={e=>setEditExp(Number(e.target.value))} />
                </div>
                <div>
                  <label style={{display:"block",fontSize:"0.8rem",fontWeight:500,color:"var(--text-2)",marginBottom:6}}>Contact ({profile.contactMethod})</label>
                  <input className="input" type="text" value={editContact} onChange={e=>setEditContact(e.target.value)} placeholder="Email or Phone number…"/>
                </div>
              </div>
              
              <div>
                <label style={{display:"block",fontSize:"0.8rem",fontWeight:500,color:"var(--text-2)",marginBottom:6}}>Subject Expertise</label>
                <div style={{display:"flex",flexWrap:"wrap",gap:5,padding:"0.5rem",border:"1px solid var(--border)",borderRadius:8,maxHeight:120,overflowY:"auto"}}>
                  {SUBJECT_EXPERTISE_OPTIONS.map(s=>{
                    const sel = editSubjects.includes(s);
                    return (
                      <button key={s} type="button" onClick={()=>toggleSubject(s)} style={{
                        padding:"0.22rem 0.6rem",borderRadius:99,fontSize:"0.7rem",fontWeight:500,
                        cursor:"pointer",border:"none",fontFamily:"inherit",transition:"all 0.15s",
                        background:sel?"rgba(245,158,11,0.2)":"var(--bg-elevated)",
                        color:sel?"#f59e0b":"var(--text-2)",
                        outline:sel?"1px solid rgba(245,158,11,0.4)":"1px solid var(--border)",
                      }}>
                        {sel&&"✓ "}{s}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <label style={{display:"block",fontSize:"0.8rem",fontWeight:500,color:"var(--text-2)",marginBottom:6}}>Bio / Summary</label>
                <textarea className="input" rows={3} value={editBio} onChange={e=>setEditBio(e.target.value)} placeholder="Brief summary of your background…"/>
              </div>

              <div style={{display:"flex",gap:10,marginTop:10}}>
                <button onClick={()=>setEditModalOpen(false)} className="btn btn-ghost" style={{flex:1}}>Cancel</button>
                <button onClick={saveProfile} className="btn btn-primary" style={{flex:2}}>Save Changes</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse-dot{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(.7)}}

        /* teacher-dash-root: padding handled by .dash-page in globals.css */
        .teacher-dash-root { /* no extra padding needed */ }

        /* Section nav tablet collapse */
        @media (max-width: 640px) {
          .teacher-dash-root [style*="overflowX: auto"] button {
            padding: 0.4rem 0.65rem;
            font-size: 0.76rem;
          }
        }
      `}</style>
      </div>
    </RouteGuard>
  );
}

