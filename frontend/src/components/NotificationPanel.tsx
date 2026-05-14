"use client";

import { Notification, NotificationType } from "@/types";
import { markNotificationRead, markAllNotificationsRead } from "@/lib/db";
import { CheckCircle, XCircle, Calendar, MessageSquare, Info, Star, BellRing } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

interface Props {
  notifications: Notification[];
  onClose: () => void;
}

export default function NotificationPanel({ notifications, onClose }: Props) {
  const { user } = useAuthStore();
  const router = useRouter();

  const handleNotificationClick = async (notif: Notification) => {
    if (!notif.read) {
      await markNotificationRead(notif.id);
    }
    
    // Determine navigation path
    let path = "/dashboard";
    if (user?.role === "mentor") path = "/mentor-dashboard";
    if (user?.role === "teacher_mentor") path = "/teacher-dashboard";
    
    router.push(path);
    onClose();
  };

  const handleMarkAllRead = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (user) {
      await markAllNotificationsRead(user.uid);
    }
  };

  const getIconAndColor = (type: NotificationType) => {
    switch (type) {
      case "request_accepted":
        return { icon: <CheckCircle size={16} />, colorClass: "text-green-500", bgClass: "bg-green-500/10" };
      case "request_declined":
        return { icon: <XCircle size={16} />, colorClass: "text-red-500", bgClass: "bg-red-500/10" };
      case "session_scheduled":
      case "session_reminder":
      case "session_completed":
        return { icon: <Calendar size={16} />, colorClass: "text-blue-500", bgClass: "bg-blue-500/10" };
      case "help_request":
        return { icon: <MessageSquare size={16} />, colorClass: "text-purple-500", bgClass: "bg-purple-500/10" };
      case "new_review":
        return { icon: <Star size={16} />, colorClass: "text-yellow-500", bgClass: "bg-yellow-500/10" };
      default:
        return { icon: <Info size={16} />, colorClass: "text-gray-400", bgClass: "bg-gray-500/10" };
    }
  };

  // Group notifications by date
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yesterday = today - 86400000;

  const grouped = notifications.reduce((acc, notif) => {
    const time = new Date(notif.createdAt).getTime();
    if (time >= today) {
      acc.today.push(notif);
    } else if (time >= yesterday) {
      acc.yesterday.push(notif);
    } else {
      acc.earlier.push(notif);
    }
    return acc;
  }, { today: [] as Notification[], yesterday: [] as Notification[], earlier: [] as Notification[] });

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div 
      className="absolute right-0 top-full mt-2 w-[360px] rounded-2xl border border-white/10 bg-[#18181b] shadow-2xl overflow-hidden z-50 flex flex-col"
      style={{
        animation: "fade-up 0.2s ease-out both",
        maxHeight: "calc(100vh - 80px)",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/5 bg-[#18181b]/80 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-[0.95rem] text-white">Notifications</h3>
          {unreadCount > 0 && (
            <span className="bg-purple-500/20 text-purple-300 text-[0.65rem] font-bold px-2 py-0.5 rounded-full">
              {unreadCount} new
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button 
            onClick={handleMarkAllRead}
            className="text-[0.75rem] text-purple-400 hover:text-purple-300 transition-colors font-medium"
          >
            Mark all read
          </button>
        )}
      </div>

      {/* Body */}
      <div className="overflow-y-auto flex-1 custom-scrollbar">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3 text-white/20">
              <BellRing size={24} />
            </div>
            <p className="text-[0.85rem] text-white/40 font-medium">You're all caught up!</p>
            <p className="text-[0.75rem] text-white/30 mt-1">No new notifications right now.</p>
          </div>
        ) : (
          <div className="pb-2">
            {grouped.today.length > 0 && (
              <NotificationGroup title="Today" items={grouped.today} onNotifClick={handleNotificationClick} getIcon={getIconAndColor} />
            )}
            {grouped.yesterday.length > 0 && (
              <NotificationGroup title="Yesterday" items={grouped.yesterday} onNotifClick={handleNotificationClick} getIcon={getIconAndColor} />
            )}
            {grouped.earlier.length > 0 && (
              <NotificationGroup title="Earlier" items={grouped.earlier} onNotifClick={handleNotificationClick} getIcon={getIconAndColor} />
            )}
          </div>
        )}
      </div>
      
      {/* Footer link to view all (optional, styling purpose) */}
      {notifications.length > 0 && (
        <div className="p-3 border-t border-white/5 bg-[#18181b]/50 text-center">
          <span className="text-[0.75rem] text-white/40 font-medium">Showing latest notifications</span>
        </div>
      )}
    </div>
  );
}

function NotificationGroup({ title, items, onNotifClick, getIcon }: { title: string, items: Notification[], onNotifClick: any, getIcon: any }) {
  return (
    <div className="mt-3">
      <h4 className="px-4 mb-2 text-[0.7rem] font-bold text-white/30 uppercase tracking-wider">{title}</h4>
      <div className="flex flex-col">
        {items.map(n => {
          const { icon, colorClass, bgClass } = getIcon(n.type);
          
          return (
            <button
              key={n.id}
              onClick={() => onNotifClick(n)}
              className={`text-left w-full relative px-4 py-3 flex gap-3 transition-colors hover:bg-white/[0.03] ${!n.read ? 'bg-purple-500/[0.02]' : ''}`}
            >
              {/* Unread indicator */}
              {!n.read && (
                <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-purple-500" />
              )}
              
              {/* Icon */}
              <div className={`mt-0.5 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${bgClass} ${colorClass}`}>
                {icon}
              </div>
              
              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start gap-2 mb-0.5">
                  <h5 className={`text-[0.85rem] font-semibold truncate ${n.read ? 'text-white/70' : 'text-white'}`}>
                    {n.title}
                  </h5>
                  <span className="text-[0.65rem] text-white/40 whitespace-nowrap mt-0.5 flex-shrink-0">
                    {formatTimeAgo(n.createdAt)}
                  </span>
                </div>
                <p className={`text-[0.8rem] leading-snug line-clamp-2 ${n.read ? 'text-white/40' : 'text-white/60'}`}>
                  {n.message}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function formatTimeAgo(date: Date) {
  const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
