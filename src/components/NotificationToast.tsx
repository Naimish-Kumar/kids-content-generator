import React from "react";
import { NotificationItem } from "../types";
import { AlertTriangle, CheckCircle, Info, X, Bell, ShieldCheck } from "lucide-react";

interface NotificationToastProps {
  notifications: NotificationItem[];
  onMarkAsRead: (id: string) => void;
  onClearAll: () => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({
  notifications,
  onMarkAsRead,
  onClearAll,
}) => {
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg p-4 w-full" id="alerts-panel">
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-blue-500 animate-pulse" aria-hidden="true" />
          <h3 className="font-semibold text-slate-800 dark:text-slate-100 font-display">
            Real-time Student Alerts ({unreadCount} new)
          </h3>
        </div>
        {notifications.length > 0 && (
          <button
            onClick={onClearAll}
            className="text-xs text-slate-500 hover:text-red-500 dark:text-slate-400 dark:hover:text-red-400 transition"
            id="clear-notifications-btn"
          >
            Clear All
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <p className="text-xs text-slate-400 dark:text-slate-500 py-3 text-center">
          No pending student alerts or security notices.
        </p>
      ) : (
        <div className="space-y-2 max-h-60 overflow-y-auto pr-1" role="log" aria-live="polite">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              className={`flex items-start gap-3 p-2.5 rounded-lg text-xs leading-relaxed transition ${
                notif.read
                  ? "bg-slate-50/50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-400 opacity-70"
                  : "bg-blue-50/70 dark:bg-slate-800/60 border-l-4 border-blue-500 text-slate-800 dark:text-slate-200"
              }`}
            >
              <div className="mt-0.5 shrink-0" id={`icon-${notif.id}`}>
                {notif.type === "success" && (
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                )}
                {notif.type === "warning" && (
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                )}
                {notif.type === "error" && (
                  <AlertTriangle className="w-4 h-4 text-rose-500" />
                )}
                {notif.type === "info" && (
                  <Info className="w-4 h-4 text-blue-400" />
                )}
                {notif.type === "alert" && (
                  <ShieldCheck className="w-4 h-4 text-purple-500" />
                )}
              </div>
              <div className="flex-1 min-w-0" id={`text-${notif.id}`}>
                <div className="flex justify-between items-baseline gap-2 mb-0.5">
                  <span className="font-medium text-slate-900 dark:text-slate-100">
                    {notif.title}
                  </span>
                  <span className="text-[10px] text-slate-400 shrink-0">
                    {new Date(notif.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                <p className="text-slate-600 dark:text-slate-350">{notif.message}</p>
                {!notif.read && (
                  <button
                    onClick={() => onMarkAsRead(notif.id)}
                    className="mt-1.5 text-[10px] font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                  >
                    Mark as Read
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
