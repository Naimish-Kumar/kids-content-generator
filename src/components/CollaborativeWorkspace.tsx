import React, { useState, useEffect } from "react";
import { Quiz, LessonPlan, User } from "../types";
import { 
  Users, 
  Share2, 
  Download, 
  RefreshCw, 
  AlertCircle, 
  BookOpen, 
  HelpCircle, 
  CheckCircle, 
  ChevronDown, 
  ChevronUp, 
  Lock, 
  WifiOff, 
  FileText, 
  Plus, 
  Sparkles 
} from "lucide-react";

interface CollaborativeWorkspaceProps {
  quizzes: Quiz[];
  lessonPlans: LessonPlan[];
  onAddQuiz: (quiz: Quiz) => void;
  onAddLessonPlan: (plan: LessonPlan) => void;
  user: User;
  isOnline: boolean;
  onPostNotification: (title: string, message: string, type: "success" | "warning" | "alert") => void;
}

export const CollaborativeWorkspace: React.FC<CollaborativeWorkspaceProps> = ({
  quizzes,
  lessonPlans,
  onAddQuiz,
  onAddLessonPlan,
  user,
  isOnline,
  onPostNotification,
}) => {
  // Institutional context (default to a mock prestigious CBSE school aligned with user identity)
  const defaultInstitution = "Savant Central School";

  // State elements
  const [sharedItems, setSharedItems] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  // Sharing local material forms state
  const [selectedShareType, setSelectedShareType] = useState<"quiz" | "lessonPlan">("quiz");
  const [selectedItemId, setSelectedItemId] = useState<string>("");
  const [sharingInProgress, setSharingInProgress] = useState<boolean>(false);

  // Inspection states (expanded cards view)
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);

  // Fetch shared resources from the same institution
  const fetchSharedResources = async () => {
    setLoading(true);
    setError("");
    try {
      // Fetch with our institution filter
      const response = await fetch(`/api/collaboration/shared?institution=${encodeURIComponent(defaultInstitution)}`);
      if (!response.ok) {
        throw new Error(`Failed to contact Savant collaboration pool: ${response.status}`);
      }
      const data = await response.json();
      if (data.success) {
        setSharedItems(data.sharedItems || []);
      } else {
        throw new Error(data.error || "Failed to fetch shared CBSE curricula.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Unknown retrieval error");
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchSharedResources();
  }, [isOnline]);

  // Handle sharing a locally made item
  const handleShareItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemId) {
      onPostNotification("No document selected", "Please select a generated quiz or lesson plan from your drafts list.", "warning");
      return;
    }

    if (!isOnline) {
      onPostNotification(
        "Offline restriction", 
        "Sharing templates requires an active Cloud SQL connection. Please enable online mode in your dashboard.", 
        "warning"
      );
      return;
    }

    setSharingInProgress(true);

    const targetPayload = selectedShareType === "quiz" 
      ? quizzes.find(q => q.id === selectedItemId)
      : lessonPlans.find(lp => lp.id === selectedItemId);

    if (!targetPayload) {
      onPostNotification("Invalid Selection", "Specified curriculum item could not be retrieved from local store.", "error");
      setSharingInProgress(false);
      return;
    }

    try {
      const response = await fetch("/api/collaboration/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: selectedShareType,
          sharedBy: user.name || "Anonymous CBSE Educator",
          sharedByEmail: user.email || "educator@savant.edu.in",
          institution: defaultInstitution,
          payload: targetPayload
        })
      });

      if (!response.ok) {
        throw new Error(`Colleague network sharing error: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        onPostNotification(
          "Shared successfully", 
          `"${targetPayload.title}" is now visible to all teachers at ${defaultInstitution}.`, 
          "success"
        );
        setSelectedItemId("");
        
        // Refresh items stream
        await fetchSharedResources();
      } else {
        throw new Error(data.error || "Shared payload rejected by institutional middleware.");
      }
    } catch (err: any) {
      console.error(err);
      onPostNotification("Sharing Failed", err.message || err, "error");
    } finally {
      setSharingInProgress(false);
    }
  };

  // Auto-fill first option when switching types
  useEffect(() => {
    if (selectedShareType === "quiz" && quizzes.length > 0) {
      setSelectedItemId(quizzes[0].id);
    } else if (selectedShareType === "lessonPlan" && lessonPlans.length > 0) {
      setSelectedItemId(lessonPlans[0].id);
    } else {
      setSelectedItemId("");
    }
  }, [selectedShareType, quizzes.length, lessonPlans.length]);

  // Handle importing shared colleague resource to the local workspace
  const handleImportShared = (item: any) => {
    const payload = item.payload;
    if (item.type === "quiz") {
      // Check if already in user's quizzes
      const exists = quizzes.some(q => q.id === payload.id);
      if (exists) {
        onPostNotification("Templated quiz already exists", "This quiz is already imported and accessible in your workspace.", "warning");
        return;
      }
      
      // Import quiz
      onAddQuiz({
        ...payload,
        id: `imported_${payload.id}_${Date.now()}`, // ensure unique local storage key
        synced: false // mark unsynced so they can synchronize it to their own backups
      });

      onPostNotification(
        "Quiz imported", 
        `"${payload.title}" shared by ${item.sharedBy} was added to your Classroom assets list.`, 
        "success"
      );
    } else {
      // Lesson Plan
      const exists = lessonPlans.some(lp => lp.id === payload.id);
      if (exists) {
        onPostNotification("Lesson plan already exists", "This lesson is already imported and accessible in your planner.", "warning");
        return;
      }

      // Import plan
      onAddLessonPlan({
        ...payload,
        id: `imported_${payload.id}_${Date.now()}`,
        synced: false
      });

      onPostNotification(
        "Lesson plan imported", 
        `"${payload.title}" shared by ${item.sharedBy} was successfully written to your Lesson Planner folders.`, 
        "success"
      );
    }
  };

  // Check if an item has been imported
  const isImported = (item: any) => {
    if (item.type === "quiz") {
      return quizzes.some(q => q.id === item.payload.id || q.title === item.payload.title);
    } else {
      return lessonPlans.some(lp => lp.id === item.payload.id || lp.title === item.payload.title);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-sm p-5 md:p-6 shadow-sm space-y-6" id="collaboration-panel">
      
      {/* Header section */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-slate-150 dark:border-slate-805 pb-4 gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-[#A08050]" />
            <h3 className="font-bold font-serif italic text-base md:text-lg text-[#A08050] tracking-wide">
              Pedagogical Collaborative Workspace
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Share and download highly refined CBSE exam checklists and lesson structures with authenticated colleagues at <strong className="text-slate-700 dark:text-slate-300 font-semibold">{defaultInstitution}</strong>.
          </p>
        </div>

        <button
          onClick={fetchSharedResources}
          disabled={loading}
          className="px-3 py-1.5 border border-slate-250 dark:border-slate-755 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer self-start"
          id="refresh-collab-btn"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[#A08050]" : "text-slate-500"}`} />
          Reload Pool
        </button>
      </div>

      {/* Main Grid: Left Stream / Right Publish Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Shared Elements Stream */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-405 flex items-center gap-1.5">
              <span>Colleague Activity Stream</span>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] lowercase font-normal text-slate-600 dark:text-slate-400">
                {sharedItems.length} publications
              </span>
            </h4>
          </div>

          {!isOnline && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-205 dark:border-amber-900 rounded-lg flex items-start gap-2.5 text-xs text-amber-80 * dark:text-amber-300">
              <WifiOff className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Simulated Offline state is Active</p>
                <p className="text-[10px] mt-0.5 text-slate-500 dark:text-slate-400 leading-normal">
                  You are viewing cached collaboration records. Connecting to colleagues is disabled while offline simulated switches are flipped.
                </p>
              </div>
            </div>
          )}

          {loading ? (
            <div className="py-20 text-center space-y-3">
              <RefreshCw className="w-8 h-8 animate-spin text-[#A08050] mx-auto" />
              <p className="text-xs text-slate-400 font-mono">Quarrying school digital board logs...</p>
            </div>
          ) : error ? (
            <div className="p-6 border border-dashed border-red-200 dark:border-red-950/55 rounded-xl bg-red-50/20 text-center text-xs space-y-2.5 text-red-655 dark:text-red-400">
              <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
              <p>Failed to compile central repository logs: {error}</p>
              <button
                onClick={fetchSharedResources}
                className="px-4 py-2 bg-red-100 hover:bg-red-200 dark:bg-red-950 dark:text-white rounded-lg text-xs font-bold transition uppercase"
              >
                Retry handshake
              </button>
            </div>
          ) : sharedItems.length === 0 ? (
            <div className="py-16 text-center border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/10 rounded-xl space-y-2">
              <HelpCircle className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">Collaboration stream is vacant</p>
              <p className="text-[11px] text-slate-450 max-w-sm mx-auto p-1 leading-normal">
                None of your colleagues have shared quizzes or lesson plans yet. Be the first to publish CBSE materials using the form on the right!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {sharedItems.map((item) => {
                const isExpanded = expandedItemId === item.id;
                const isAlreadyPresent = isImported(item);
                const payload = item.payload;
                
                return (
                  <div
                    key={item.id}
                    className="bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-200/60 dark:border-slate-850/80 p-4 transition-all duration-150 hover:border-slate-300 dark:hover:border-slate-800 flex flex-col justify-between gap-4"
                  >
                    <div className="space-y-3">
                      {/* Publisher Meta Info */}
                      <div className="flex items-center justify-between text-[11px] border-b border-slate-150 dark:border-slate-850 pb-2.5">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-indigo-400 font-bold flex items-center justify-center text-xs shadow-inner shrink-0">
                            {item.sharedBy.split(" ").pop()?.[0] || "T"}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 dark:text-slate-150 leading-tight">
                              {item.sharedBy}
                            </p>
                            <p className="text-slate-450 text-[10px] font-mono select-all">
                              {item.sharedByEmail}
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                            item.type === "quiz"
                              ? "bg-blue-100 text-blue-850 dark:bg-blue-950 dark:text-blue-300"
                              : "bg-emerald-100 text-emerald-850 dark:bg-emerald-950 dark:text-emerald-300"
                          }`}>
                            {item.type === "quiz" ? "Quiz Spec" : "Lesson Plan"}
                          </span>
                          <p className="text-[9px] text-slate-400 mt-0.5">
                            {new Date(item.timestamp).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      {/* Document Details Block */}
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-1.5 py-0.5 bg-slate-200/70 dark:bg-slate-900 rounded font-bold text-[9px] uppercase tracking-wider text-slate-600 dark:text-slate-400">
                            {payload.className} • {payload.subject}
                          </span>
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                            payload.difficulty === "Easy" || payload.difficulty === "easy"
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-955/20 dark:text-emerald-450"
                              : payload.difficulty === "Medium" || payload.difficulty === "medium"
                              ? "bg-amber-50 text-amber-700 dark:bg-amber-955/20 dark:text-amber-450"
                              : "bg-red-50 text-red-700 dark:bg-red-955/20 dark:text-red-450"
                          }`}>
                            {payload.difficulty}
                          </span>
                        </div>
                        <h5 className="font-bold text-slate-800 dark:text-slate-100 text-sm leading-snug">
                          {payload.title}
                        </h5>
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                          {item.type === "quiz" 
                            ? "Interactive classroom tests with full descriptive corrective criteria. Ideal for CBSE prep."
                            : (payload.overview || "Pedagogical lesson planner including standard milestones and timers.")
                          }
                        </p>
                      </div>

                      {/* Expandable Preview Section */}
                      {isExpanded && (
                        <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-850 p-3 rounded-lg text-xs space-y-3 mt-3 animate-fade-in font-sans">
                          {item.type === "quiz" ? (
                            <div className="space-y-2">
                              <p className="font-semibold text-[11px] text-slate-450 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-1 flex items-center gap-2">
                                <HelpCircle className="w-3.5 h-3.5 text-blue-500" />
                                Interactive Questions Included ({payload.questions?.length || 0}):
                              </p>
                              <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                                {payload.questions?.map((q: any, qi: number) => (
                                  <div key={q.id || qi} className="text-[11px] p-2 bg-slate-50 dark:bg-slate-950 rounded border border-slate-100 dark:border-slate-850">
                                    <p className="font-bold text-slate-700 dark:text-slate-300">Q{qi + 1}: {q.question}</p>
                                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1 mt-1 text-[10px] pl-2 text-slate-500">
                                      {q.options?.map((opt: string, opti: number) => (
                                        <li key={opti} className={opti === q.correctOptionIndex ? "text-emerald-600 dark:text-emerald-450 font-semibold" : ""}>
                                          • {opt} {opti === q.correctOptionIndex ? "✓" : ""}
                                        </li>
                                      ))}
                                    </ul>
                                    {q.explanation && (
                                      <p className="text-[9px] text-slate-400 mt-1 italic leading-tight">
                                        Explanation: {q.explanation}
                                      </p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px]">
                                <div className="space-y-1">
                                  <p className="font-bold text-slate-450 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-1">Objectives:</p>
                                  <ul className="list-disc ml-4 space-y-1 text-slate-500 leading-normal">
                                    {payload.objectives?.map((obj: string, obji: number) => (
                                      <li key={obji}>{obj}</li>
                                    ))}
                                  </ul>
                                </div>
                                <div className="space-y-1">
                                  <p className="font-bold text-slate-450 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-1">Activity Timetable:</p>
                                  <div className="space-y-1 pr-1 max-h-24 overflow-y-auto">
                                    {payload.timeline?.map((t: any, ti: number) => (
                                      <div key={ti} className="text-[9px] text-slate-500 leading-tight">
                                        <strong className="text-indigo-500">{t.duration}</strong> - {t.activity}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 pt-1 border-t border-slate-150 dark:border-slate-850/60 justify-between">
                      <button
                        onClick={() => setExpandedItemId(isExpanded ? null : item.id)}
                        className="py-1.5 px-2.5 text-[11px] text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition flex items-center gap-1.5 cursor-pointer rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-850 font-semibold"
                      >
                        {isExpanded ? (
                          <>
                            <ChevronUp className="w-3.5 h-3.5" />
                            Hide blueprint
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-3.5 h-3.5" />
                            Inspect blueprint
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => handleImportShared(item)}
                        className={`py-1.5 px-3 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                          isAlreadyPresent
                            ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-900/40"
                            : "bg-[#A08050] hover:bg-[#B09060] text-[#0A0A0B] shadow-sm font-semibold"
                        }`}
                        id={`import-collab-${item.id}`}
                      >
                        {isAlreadyPresent ? (
                          <>
                            <CheckCircle className="w-3.5 h-3.5" />
                            Imported
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5" />
                            Add to My Library
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Side: Publish / Share My creations panel */}
        <div className="lg:col-span-4" id="collaboration-publisher-panel">
          <div className="bg-slate-50 hover:bg-slate-105/40 dark:bg-slate-950 dark:hover:bg-slate-900/60 p-4 rounded-xl border border-slate-100 dark:border-slate-805/70 space-y-4 transition-all duration-150">
            
            <div className="border-b border-slate-150 dark:border-slate-805 pb-3">
              <div className="flex items-center gap-1.5">
                <Share2 className="w-4 h-4 text-[#A08050]" />
                <h4 className="font-bold text-slate-805 dark:text-slate-100 text-xs uppercase tracking-wider">
                  Publish Lesson or Quiz
                </h4>
              </div>
              <p className="text-[10px] text-slate-450 mt-1">
                Upload your generated classroom curriculum blocks to help colleagues prepare identical curriculum standards.
              </p>
            </div>

            <form onSubmit={handleShareItem} className="space-y-4 text-xs font-medium">
              
              {/* Type Switcher */}
              <div className="space-y-1.5">
                <span className="block text-[10px] uppercase font-bold text-slate-450 tracking-wider">
                  Material Classification:
                </span>
                <div className="grid grid-cols-2 gap-2 bg-white dark:bg-slate-900 p-1.5 rounded-lg border border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setSelectedShareType("quiz")}
                    className={`py-1.5 rounded-md text-[10px] font-bold uppercase transition cursor-pointer ${
                      selectedShareType === "quiz"
                        ? "bg-blue-600 text-white shadow-sm"
                        : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                    }`}
                  >
                    CBSE Quizzes
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedShareType("lessonPlan")}
                    className={`py-1.5 rounded-md text-[10px] font-bold uppercase transition cursor-pointer ${
                      selectedShareType === "lessonPlan"
                        ? "bg-emerald-600 text-white shadow-sm"
                        : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                    }`}
                  >
                    Lesson Plans
                  </button>
                </div>
              </div>

              {/* Selector */}
              <div className="space-y-1.5">
                <label htmlFor="material-select-id" className="block text-[10px] uppercase font-bold text-slate-450 tracking-wider">
                  Select Draft to Share:
                </label>
                
                {selectedShareType === "quiz" ? (
                  quizzes.length === 0 ? (
                    <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-center text-[10px] text-slate-400">
                      You haven't generated any quizzes yet to share. Let's make some!
                    </div>
                  ) : (
                    <select
                      id="material-select-id"
                      value={selectedItemId}
                      onChange={(e) => setSelectedItemId(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg py-2 px-2.5 text-slate-755 dark:text-slate-200 focus:outline-none"
                    >
                      {quizzes.map((quiz) => (
                        <option key={quiz.id} value={quiz.id}>
                          [{quiz.className} • {quiz.subject}] {quiz.title}
                        </option>
                      ))}
                    </select>
                  )
                ) : (
                  lessonPlans.length === 0 ? (
                    <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-center text-[10px] text-slate-400">
                      You haven't planned any lessons yet to share. Create some blueprints!
                    </div>
                  ) : (
                    <select
                      id="material-select-id"
                      value={selectedItemId}
                      onChange={(e) => setSelectedItemId(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg py-2 px-2.5 text-slate-755 dark:text-slate-200 focus:outline-none"
                    >
                      {lessonPlans.map((plan) => (
                        <option key={plan.id} value={plan.id}>
                          [{plan.className} • {plan.subject}] {plan.title}
                        </option>
                      ))}
                    </select>
                  )
                )}
              </div>

              {/* Shared with status label */}
              <div className="bg-white/40 dark:bg-slate-900/40 p-2.5 rounded-lg border border-slate-100 dark:border-slate-850 space-y-1 text-[10px] text-slate-450">
                <p className="flex justify-between">
                  <span>Target Institution:</span>
                  <strong className="text-slate-700 dark:text-slate-300">{defaultInstitution}</strong>
                </p>
                <p className="flex justify-between">
                  <span>Identity claims:</span>
                  <strong className="text-slate-705 dark:text-slate-350">{user.name.split(" ")[0]} ({user.role})</strong>
                </p>
              </div>

              {/* Submit Share Button */}
              <button
                type="submit"
                disabled={sharingInProgress || !selectedItemId || !isOnline}
                className="w-full py-2.5 bg-[#A08050] hover:bg-[#B09060] disabled:bg-slate-100 disabled:dark:bg-slate-800 disabled:text-slate-400 text-[#0A0A0B] font-bold uppercase tracking-wider rounded-lg flex items-center justify-center gap-1.5 shadow transition cursor-pointer"
                id="submit-collaboration-share-btn"
              >
                <Share2 className="w-3.5 h-3.5" />
                {sharingInProgress ? "Publishing..." : "Publish to school workspace"}
              </button>

            </form>
          </div>
        </div>

      </div>

    </div>
  );
};
