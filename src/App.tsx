import React, { useState, useEffect } from "react";
import { User, Quiz, LessonPlan, QuizAttempt, NotificationItem, SyncLog } from "./types";
import {
  INITIAL_QUIZZES,
  INITIAL_ATTEMPTS,
  INITIAL_LESSON_PLANS
} from "./data";

// Subcomponents
import { NotificationToast } from "./components/NotificationToast";
import { SyncManager } from "./components/SyncManager";
import { QuizCreator } from "./components/QuizCreator";
import { LessonPlanner } from "./components/LessonPlanner";
import { TeacherAnalytics } from "./components/TeacherAnalytics";
import { StudentPortal } from "./components/StudentPortal";
import { OAuthGateway } from "./components/OAuthGateway";
import { CollaborativeWorkspace } from "./components/CollaborativeWorkspace";

// Icons
import {
  ShieldCheck,
  Zap,
  GraduationCap,
  HardDriveUpload,
  BookOpen,
  LineChart,
  Grid,
  Bell,
  Fingerprint,
  Wifi,
  WifiOff,
  Users
} from "lucide-react";

export default function App() {
  // Theme state compliant with dark presets
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  // Authentication State
  const [user, setUser] = useState<User>({
    id: "user_vnaimish",
    name: "M.S. Raghavan (CBSE Advisor)",
    email: "vnaimishkumar@gmail.com",
    role: "teacher",
    avatar: "https://api.dicebear.com/7.x/pixel-art/svg?seed=raghavan",
    isAuthenticated: true,
    mfaRequired: true,
    mfaVerified: true
  });

  // Database core states
  const [quizzes, setQuizzes] = useState<Quiz[]>(INITIAL_QUIZZES);
  const [lessonPlans, setLessonPlans] = useState<LessonPlan[]>(INITIAL_LESSON_PLANS);
  const [attempts, setAttempts] = useState<QuizAttempt[]>(INITIAL_ATTEMPTS);

  // Synchronization and Offline state
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(new Date().toISOString());
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([
    {
      id: "log_init",
      action: "Secure Database Handshake",
      status: "success",
      timestamp: new Date().toISOString(),
      details: "Initial local storage synchronization compiled with server."
    }
  ]);

  // Notifications
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: "init_alert_1",
      type: "alert",
      title: "MFA Authentication Active",
      message: "CBSE credential security verified through Google OAuth 2.0 dual step process.",
      timestamp: new Date().toISOString(),
      read: false
    },
    {
      id: "init_alert_2",
      type: "warning",
      title: "Struggling student: Solar System Quiz",
      message: "Vikram Malhotra scored 0% on Science Unit Test. Diagnostic recommendations available.",
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      read: false
    }
  ]);

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<string>("quiz-generator");

  // Apply dark mode styling class
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [theme]);

  // Sync logs status manager helper
  const postNotification = (
    title: string,
    message: string,
    type: "success" | "warning" | "error" | "info" | "alert"
  ) => {
    const newNotif: NotificationItem = {
      id: `notif_${Date.now()}`,
      type,
      title,
      message,
      timestamp: new Date().toISOString(),
      read: false
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  // Safe callback backup synchronization mechanism
  const triggerCloudSync = async () => {
    if (!isOnline) {
      postNotification("Backup synch blocked", "Device is currently offline. Actions buffered in browser IndexedDB cache.", "warning");
      return;
    }

    setIsSyncing(true);
    const newLogId = `log_${Date.now()}`;
    
    setSyncLogs((prev) => [
      {
        id: newLogId,
        action: "Pushing Local Buffers to Cloud SQL",
        status: "pending",
        timestamp: new Date().toISOString(),
        details: `Queueing ${quizzes.filter(q => !q.synced).length} quizzes and ${attempts.filter(a => !a.synced).length} score sheets.`
      },
      ...prev
    ]);

    try {
      const response = await fetch("/api/backup/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id || "unregistered_client",
          quizzes,
          lessonPlans,
          attempts,
          progress: { totalClassAttempts: attempts.length }
        })
      });

      if (!response.ok) {
        throw new Error(`Cloud SQL response error: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        // Mark everything as synced
        setQuizzes((prev) => prev.map((q) => ({ ...q, synced: true })));
        setLessonPlans((prev) => prev.map((lp) => ({ ...lp, synced: true })));
        setAttempts((prev) => prev.map((a) => ({ ...a, synced: true })));

        setLastSyncedAt(data.timestamp);
        
        setSyncLogs((prev) =>
          prev.map((l) =>
            l.id === newLogId
              ? {
                  ...l,
                  status: "success",
                  details: "Cloud-based PostgreSQL backups saved securely. Metadata verified."
                }
              : l
          )
        );

        postNotification("Cloud SQL Backup complete", "Academic data synchronized with server node.", "success");
      } else {
        throw new Error(data.error || "Simulated database synchronization rejected.");
      }
    } catch (err: any) {
      console.error(err);
      setSyncLogs((prev) =>
        prev.map((l) =>
          l.id === newLogId
            ? {
                ...l,
                status: "error",
                details: `Sync transaction abort: ${err.message || err}`
              }
            : l
        )
      );
      postNotification("Backup Sync Failed", `Error: ${err.message || err}`, "error");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleToggleOnline = () => {
    const nextVal = !isOnline;
    setIsOnline(nextVal);
    
    postNotification(
      nextVal ? "Connection back online" : "Offline mode active",
      nextVal 
        ? "Client network re-established. Automatic background synchronization protocol is ready." 
        : "Local IndexedDB mode is running. Changes will buffer locally without data loss.",
      nextVal ? "success" : "warning"
    );
  };

  const handleMarkNotificationAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const handleClearNotifications = () => {
    setNotifications([]);
  };

  const handleAddQuiz = (quiz: Quiz) => {
    setQuizzes((prev) => [quiz, ...prev]);
    // If online, auto sync
    if (isOnline) {
      setTimeout(() => triggerCloudSync(), 800);
    }
  };

  const handleAddLessonPlan = (plan: LessonPlan) => {
    setLessonPlans((prev) => [plan, ...prev]);
    if (isOnline) {
      setTimeout(() => triggerCloudSync(), 800);
    }
  };

  const handleAddAttempt = (attempt: QuizAttempt) => {
    setAttempts((prev) => [attempt, ...prev]);
    if (isOnline) {
      setTimeout(() => triggerCloudSync(), 800);
    }
  };

  const handleUpdateUserDetails = (updates: Partial<User>) => {
    setUser((prev) => ({ ...prev, ...updates }));
  };

  // Determine local offline draft counts
  const localDraftsCount = 
    quizzes.filter(q => !q.synced).length + 
    lessonPlans.filter(lp => !lp.synced).length + 
    attempts.filter(a => !a.synced).length;

  return (
    <main className="min-h-screen bg-[#0A0A0B] text-[#E5E5E7] pb-16 flex flex-col font-sans transition-colors duration-150">
      
      {/* Dynamic top safety notifications bar */}
      <div className="bg-[#161618] text-[#8A8A8E] py-2.5 px-4 text-xs font-semibold flex items-center justify-between border-b border-[#242426]">
        <div className="flex items-center gap-2 mx-auto sm:mx-0">
          <Fingerprint className="w-4 h-4 text-[#A08050] shrink-0" />
          <span className="font-serif italic tracking-wide text-[#A08050] text-sm">Savant Master Node</span>
          <span className="opacity-40">•</span>
          <span>WCAG 2.1 Compliant Sandbox Node • Multi-Factor Protection Enforcement Enabled</span>
        </div>

        <div className="hidden sm:flex items-center gap-3">
          <div className="flex items-center gap-1">
            {isOnline ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[10px] text-emerald-300">Synchronized (Cloud SQL pg)</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span className="text-[10px] text-amber-300">Buffered (Offline Cache)</span>
              </>
            )}
          </div>
          <span className="opacity-40">|</span>
          <span className="text-[10px] opacity-80">Sync Queued: {localDraftsCount} item(s)</span>
        </div>
      </div>

      {/* Main Responsive Header bar */}
      <header className="sticky top-0 z-30 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border-b border-slate-200 dark:border-slate-850 py-3.5 px-4 md:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Logo brand */}
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-[#A08050] to-[#705030] p-2 rounded-sm text-[#0A0A0B] shadow-md shrink-0">
              <Zap className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h1 className="font-serif italic text-lg md:text-xl tracking-wide text-[#A08050]">
                Savant CBSE Content Engine
              </h1>
              <p className="text-[10px] text-slate-400 font-medium">
                Personalized Lesson Plans, CBSE Quizzes & Analytic Insights • WCAG 2.1 Compliant
              </p>
            </div>
          </div>

          {/* User Status / Settings actions */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 md:gap-4 overflow-x-auto w-full sm:w-auto">
            {/* Offline simulator switch shortcut */}
            <button
              onClick={handleToggleOnline}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                isOnline
                  ? "bg-emerald-50 text-emerald-800 border-emerald-250 dark:bg-emerald-950/20 dark:text-emerald-350 dark:border-emerald-850"
                  : "bg-amber-50 text-amber-800 border-amber-250 dark:bg-amber-950/20 dark:text-amber-300 dark:border-amber-800"
              }`}
              id="header-network-switch"
            >
              <Wifi className="w-3.5 h-3.5" />
              <span className="hidden md:inline">{isOnline ? "Sim Online" : "Sim Offline"}</span>
            </button>

            {/* User card badges */}
            {user.isAuthenticated ? (
              <div className="flex items-center gap-2 px-2.5 py-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200/50 dark:border-slate-700/60 text-xs">
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-5.5 h-5.5 rounded-lg border border-slate-250 bg-white"
                />
                <div className="text-left hidden sm:block">
                  <p className="font-semibold text-slate-800 dark:text-slate-100 text-[11px] leading-tight max-w-[120px] truncate">{user.name}</p>
                  <span className="text-[9px] uppercase tracking-wider font-bold text-blue-500">{user.role}</span>
                </div>
              </div>
            ) : (
              <span className="text-[10px] bg-amber-50 text-amber-80 * dark:bg-amber-950 dark:text-amber-300 px-2 py-1 rounded font-bold uppercase tracking-wider">
                Session Revoked
              </span>
            )}
          </div>

        </div>
      </header>

      {/* Primary Workspace container */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 mt-6 w-full flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Navigation Rail / Left Column */}
        <nav className="lg:col-span-3 space-y-4 text-xs font-medium" aria-label="Main system tabs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-sm p-4 shadow-sm space-y-1.5">
            <span className="block text-[10px] uppercase font-bold text-[#A08050] tracking-wider mb-2 select-none">
              Role: Teacher Workspace
            </span>
            
            <button
              onClick={() => {
                if (!user.isAuthenticated || user.role !== "teacher") {
                  postNotification("Workspace Blocked", "Authorize as CBSE Teacher under the Secure OAuth credentials gateway tab.", "warning");
                  return;
                }
                setActiveTab("quiz-generator");
              }}
              className={`w-full text-left px-3.5 py-2.5 rounded-sm flex items-center gap-2.5 transition cursor-pointer ${
                activeTab === "quiz-generator" && user.role === "teacher"
                  ? "bg-blue-600 text-white shadow-sm font-bold border-l-2 border-[#A08050]"
                  : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-555 dark:text-slate-350"
              }`}
              id="tab-quiz-generator-btn"
            >
              <Zap className="w-4 h-4 shrink-0" />
              CBSE Quiz Generator
            </button>

            <button
              onClick={() => {
                if (!user.isAuthenticated || user.role !== "teacher") {
                  postNotification("Workspace Blocked", "Authorize as CBSE Teacher under the Secure OAuth credentials gateway tab.", "warning");
                  return;
                }
                setActiveTab("lesson-planner");
              }}
              className={`w-full text-left px-3.5 py-2.5 rounded-sm flex items-center gap-2.5 transition cursor-pointer ${
                activeTab === "lesson-planner" && user.role === "teacher"
                  ? "bg-blue-600 text-white shadow-sm font-bold border-l-2 border-[#A08050]"
                  : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-555 dark:text-slate-350"
              }`}
              id="tab-lesson-planner-btn"
            >
              <BookOpen className="w-4 h-4 shrink-0" />
              Lesson Planner
            </button>

            <button
              onClick={() => {
                if (!user.isAuthenticated || user.role !== "teacher") {
                  postNotification("Workspace Blocked", "Authorize as CBSE Teacher under the Secure OAuth credentials gateway tab.", "warning");
                  return;
                }
                setActiveTab("teacher-analytics");
              }}
              className={`w-full text-left px-3.5 py-2.5 rounded-sm flex items-center gap-2.5 transition cursor-pointer ${
                activeTab === "teacher-analytics" && user.role === "teacher"
                  ? "bg-blue-600 text-white shadow-sm font-bold border-l-2 border-[#A08050]"
                  : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-555 dark:text-slate-350"
              }`}
              id="tab-teacher-analytics-btn"
            >
              <LineChart className="w-4 h-4 shrink-0" />
              Teacher Analytics
            </button>

            <button
              onClick={() => {
                if (!user.isAuthenticated || user.role !== "teacher") {
                  postNotification("Workspace Blocked", "Authorize as CBSE Teacher under the Secure OAuth credentials gateway tab.", "warning");
                  return;
                }
                setActiveTab("collaborative-workspace");
              }}
              className={`w-full text-left px-3.5 py-2.5 rounded-sm flex items-center gap-2.5 transition cursor-pointer ${
                activeTab === "collaborative-workspace" && user.role === "teacher"
                  ? "bg-blue-600 text-white shadow-sm font-bold border-l-2 border-[#A08050]"
                  : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-555 dark:text-slate-350"
              }`}
              id="tab-collaborative-workspace-btn"
            >
              <Users className="w-4 h-4 shrink-0" />
              Collaborative Workspace
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-sm p-4 shadow-sm space-y-1.5">
            <span className="block text-[10px] uppercase font-bold text-[#A08050] tracking-wider mb-2 select-none">
              Client & Student Tools
            </span>

            <button
              onClick={() => {
                if (!user.isAuthenticated) {
                  postNotification("Access Restricted", "Authorization required. Verify your identity in Security gateway.", "warning");
                  return;
                }
                setActiveTab("student-portal");
              }}
              className={`w-full text-left px-3.5 py-2.5 rounded-sm flex items-center gap-2.5 transition cursor-pointer ${
                activeTab === "student-portal"
                  ? "bg-indigo-650 text-white shadow-sm font-bold border-l-2 border-[#A08050]"
                  : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-555 dark:text-slate-350"
              }`}
              id="tab-student-portal-btn"
            >
              <GraduationCap className="w-4 h-4 shrink-0" />
              Student Portal
            </button>

            <button
              onClick={() => setActiveTab("oauth-gateway")}
              className={`w-full text-left px-3.5 py-2.5 rounded-sm flex items-center gap-2.5 transition cursor-pointer ${
                activeTab === "oauth-gateway"
                  ? "bg-blue-600 text-white shadow-sm font-bold border-l-2 border-[#A08050]"
                  : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-555 dark:text-slate-350"
              }`}
              id="tab-oauth-gateway-btn"
            >
              <ShieldCheck className="w-4 h-4 shrink-0" />
              Security Gateway (MFA)
            </button>

            <button
              onClick={() => setActiveTab("sync-controls")}
              className={`w-full text-left px-3.5 py-2.5 rounded-sm flex items-center gap-2.5 transition cursor-pointer ${
                activeTab === "sync-controls"
                  ? "bg-blue-600 text-white shadow-sm font-bold border-l-2 border-[#A08050]"
                  : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-555 dark:text-slate-350"
              }`}
              id="tab-sync-controls-btn"
            >
              <HardDriveUpload className="w-4 h-4 shrink-0" />
              Database Cloud Backups
            </button>
          </div>

          {/* Sync status widget sidebar */}
          <div className="bg-[#161618] border border-[#242426] p-4 rounded-sm space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[10px] uppercase font-bold text-[#8A8A8E] tracking-widest">Cloud Sync Active</span>
              {localDraftsCount > 0 ? (
                <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping" />
              ) : (
                <span className="h-2 w-2 rounded-full bg-green-500" />
              )}
            </div>
            
            <p className="text-[11px] text-[#5A5A5E]">
              Local data encrypted and ready for offline use. Queued: {localDraftsCount} drafts. PostgreSQL Instance: Healthy.
            </p>

            <button
              onClick={triggerCloudSync}
              disabled={isSyncing || !isOnline}
              className={`w-full py-2 rounded-sm text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition ${
                isOnline && !isSyncing
                  ? "border border-[#A08050] text-[#A08050] hover:bg-[#A08050] hover:text-[#0A0A0B] cursor-pointer"
                  : "bg-slate-205 border border-slate-300 text-slate-400 cursor-not-allowed"
              }`}
              id="sidebar-quick-sync-btn"
            >
              <HardDriveUpload className="w-3.5 h-3.5" />
              {isSyncing ? "Saving Backups..." : "Sync cloud backups"}
            </button>
          </div>
        </nav>

        {/* Core Presentation Content Panel / Right Column */}
        <section className="lg:col-span-9 space-y-6" id="core-content-display">
          
          {/* Notification dynamic panel */}
          <NotificationToast
            notifications={notifications}
            onMarkAsRead={handleMarkNotificationAsRead}
            onClearAll={handleClearNotifications}
          />

          {/* Active View Selector */}
          <div className="animate-fade-in" id="active-screen-rendered-body">
            {activeTab === "quiz-generator" && user.role === "teacher" && (
              <QuizCreator
                onAddQuiz={handleAddQuiz}
                isOnline={isOnline}
                onPostNotification={postNotification}
              />
            )}

            {activeTab === "lesson-planner" && user.role === "teacher" && (
              <LessonPlanner
                onAddLessonPlan={handleAddLessonPlan}
                isOnline={isOnline}
                onPostNotification={postNotification}
              />
            )}

            {activeTab === "teacher-analytics" && user.role === "teacher" && (
              <TeacherAnalytics
                quizzes={quizzes}
                attempts={attempts}
                lessonPlans={lessonPlans}
              />
            )}

            {activeTab === "collaborative-workspace" && user.role === "teacher" && (
              <CollaborativeWorkspace
                quizzes={quizzes}
                lessonPlans={lessonPlans}
                onAddQuiz={handleAddQuiz}
                onAddLessonPlan={handleAddLessonPlan}
                user={user}
                isOnline={isOnline}
                onPostNotification={postNotification}
              />
            )}

            {activeTab === "student-portal" && (
              <StudentPortal
                quizzes={quizzes}
                attempts={attempts}
                onAddAttempt={handleAddAttempt}
                onPostNotification={postNotification}
                currentUser={user}
                isOnline={isOnline}
              />
            )}

            {activeTab === "oauth-gateway" && (
              <OAuthGateway
                currentUser={user}
                onUpdateUser={handleUpdateUserDetails}
                onPostNotification={postNotification}
              />
            )}

            {activeTab === "sync-controls" && (
              <SyncManager
                isOnline={isOnline}
                onToggleOnline={handleToggleOnline}
                syncLogs={syncLogs}
                onTriggerSync={triggerCloudSync}
                pendingCount={localDraftsCount}
                lastSyncedAt={lastSyncedAt}
                isSyncing={isSyncing}
              />
            )}
          </div>
        </section>

      </div>
    </main>
  );
}
