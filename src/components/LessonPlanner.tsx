import React, { useState } from "react";
import { LessonPlan } from "../types";
import { CBSE_CLASSES, CBSE_SUBJECTS, CBSE_TOPICS } from "../data";
import { BookOpen, Calendar, Award, Compass, HelpCircle, Check, ArrowRight, ShieldCheck, Download, Sparkles, RefreshCw } from "lucide-react";

interface LessonPlannerProps {
  onAddLessonPlan: (plan: LessonPlan) => void;
  isOnline: boolean;
  onPostNotification: (title: string, message: string, type: "success" | "warning" | "alert") => void;
}

export const LessonPlanner: React.FC<LessonPlannerProps> = ({
  onAddLessonPlan,
  isOnline,
  onPostNotification
}) => {
  const [selectedClass, setSelectedClass] = useState("Class 1");
  const [selectedSubject, setSelectedSubject] = useState("Mathematics");
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<LessonPlan | null>(null);
  const [errorText, setErrorText] = useState("");
  const [warningText, setWarningText] = useState("");
  const [isRefining, setIsRefining] = useState(false);
  const [showRefinementPanel, setShowRefinementPanel] = useState(false);
  const [refinementType, setRefinementType] = useState("ADHD & Active Sensory (Short chunks, gamified steps, frequent breaks)");
  const [customNotes, setCustomNotes] = useState("");

  const handleSubjectChange = (subject: string) => {
    setSelectedSubject(subject);
    setSelectedTopics([]);
  };

  const toggleTopic = (topic: string) => {
    if (selectedTopics.includes(topic)) {
      setSelectedTopics(selectedTopics.filter((t) => t !== topic));
    } else {
      setSelectedTopics([...selectedTopics, topic]);
    }
  };

  const handleGeneratePlan = async () => {
    setErrorText("");
    setWarningText("");
    setGeneratedPlan(null);

    const activeTopics = selectedTopics.length > 0 
      ? selectedTopics 
      : [CBSE_TOPICS[selectedSubject]?.[0] || "Foundations"];

    setIsGenerating(true);

    try {
      const res = await fetch("/api/generate/lesson-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          className: selectedClass,
          subject: selectedSubject,
          topics: activeTopics,
          difficulty: "NCF Standard"
        })
      });

      if (!res.ok) {
        throw new Error(`Lesson creation status error: ${res.status}`);
      }

      const data = await res.json();
      if (data.success && data.lessonPlan) {
        const fullPlan: LessonPlan = {
          id: `plan_${Date.now()}`,
          title: data.lessonPlan.title || `${selectedSubject} Lesson Outline - Grade ${selectedClass}`,
          className: selectedClass,
          subject: selectedSubject,
          topics: activeTopics,
          difficulty: "NCF CBSE standard",
          overview: data.lessonPlan.overview,
          objectives: data.lessonPlan.objectives,
          timeline: data.lessonPlan.timeline,
          contentSections: data.lessonPlan.contentSections,
          evaluation: data.lessonPlan.evaluation,
          timestamp: new Date().toISOString(),
          synced: data.method === "AIStream" ? isOnline : false
        };

        setGeneratedPlan(fullPlan);
        
        if (data.warning) {
          setWarningText(data.warning);
          onPostNotification("Demo Lesson Layout served", "Pre-designed CBSE standard layout loaded successfully.", "info");
        } else {
          onPostNotification("Lesson Plan Created", `"${fullPlan.title}" is generated successfully!`, "success");
        }
      } else {
        throw new Error(data.error || "The server returned an invalid content frame.");
      }
    } catch (err: any) {
      console.error(err);
      setErrorText(`Could not construct plan: ${err.message || err}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRefinePlan = async () => {
    if (!generatedPlan) return;
    setIsRefining(true);
    setErrorText("");

    try {
      const res = await fetch("/api/refine/lesson-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lessonPlan: generatedPlan,
          refinementType: refinementType,
          customNotes: customNotes
        })
      });

      if (!res.ok) {
        throw new Error(`Refinement system error: ${res.status}`);
      }

      const data = await res.json();
      if (data.success && data.lessonPlan) {
        const updatedProgressPlan: LessonPlan = {
          ...generatedPlan,
          title: data.lessonPlan.title || generatedPlan.title,
          overview: data.lessonPlan.overview || generatedPlan.overview,
          objectives: data.lessonPlan.objectives || generatedPlan.objectives,
          timeline: data.lessonPlan.timeline || generatedPlan.timeline,
          contentSections: data.lessonPlan.contentSections || generatedPlan.contentSections,
          evaluation: data.lessonPlan.evaluation || generatedPlan.evaluation,
          synced: data.method === "AIStream" ? isOnline : false
        };

        setGeneratedPlan(updatedProgressPlan);
        setShowRefinementPanel(false);
        setCustomNotes("");

        if (data.warning) {
          onPostNotification("Accommodation Modified", `Lesson altered successfully. Note: ${data.warning}`, "warning");
        } else {
          onPostNotification("Inclusion Plan Tailored", `Curriculum adapted perfectly for: ${refinementType}!`, "success");
        }
      } else {
        throw new Error(data.error || "The server returned invalid inclusive adaptation frames.");
      }
    } catch (err: any) {
      console.error(err);
      setErrorText(`Failed to adapt content complexity: ${err.message || err}`);
      onPostNotification("Refinement Interrupted", `Refinement had an error: ${err.message || err}`, "alert");
    } finally {
      setIsRefining(false);
    }
  };

  const handlePublishPlan = () => {
    if (!generatedPlan) return;
    onAddLessonPlan(generatedPlan);
    onPostNotification("Lesson plan Published", `"${generatedPlan.title}" added to active teacher syllabus list.`, "success");
    setGeneratedPlan(null);
    setSelectedTopics([]);
  };

  const availableTopics = CBSE_TOPICS[selectedSubject] || [];

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-sm shadow-sm p-5 md:p-6" id="lesson-planner-workspace">
      <div className="flex gap-2.5 items-center mb-5 border-b border-slate-150 dark:border-slate-805 pb-3">
        <BookOpen className="w-5 h-5 text-[#A08050]" aria-hidden="true" />
        <h3 className="font-bold font-serif italic text-base md:text-lg text-[#A08050] tracking-wide">
          Savant CBSE & NCF Lesson Planner
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
        <div>
          <label htmlFor="lp-class" className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
            Grade Level
          </label>
          <select
            id="lp-class"
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg py-2.5 px-3 text-xs font-medium text-slate-800 dark:text-slate-200"
          >
            {CBSE_CLASSES.map((cls) => (
              <option key={cls} value={cls}>{cls}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="lp-subject" className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
            Subject Domain
          </label>
          <select
            id="lp-subject"
            value={selectedSubject}
            onChange={(e) => handleSubjectChange(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg py-2.5 px-3 text-xs font-medium text-slate-800 dark:text-slate-200"
          >
            {CBSE_SUBJECTS.map((sub) => (
              <option key={sub} value={sub}>{sub}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="mb-5">
        <span className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
          Select Syllabus Topics target (Optional - defaults to first)
        </span>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Lesson plan topics">
          {availableTopics.map((topic) => {
            const active = selectedTopics.includes(topic);
            return (
              <button
                key={topic}
                onClick={() => toggleTopic(topic)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                  active
                    ? "bg-blue-100 text-blue-800 border border-blue-200 dark:bg-blue-950/70 dark:text-blue-300 dark:border-blue-800"
                    : "bg-slate-50 border border-slate-100 hover:border-slate-200 text-slate-600 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-450 dark:hover:text-slate-300"
                }`}
                aria-pressed={active}
              >
                {topic}
              </button>
            );
          })}
        </div>
      </div>

      <button
        onClick={handleGeneratePlan}
        disabled={isGenerating}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-100 text-white disabled:text-slate-400 text-xs font-semibold rounded-lg py-3 flex items-center justify-center gap-2 transition cursor-pointer shadow-sm shadow-blue-500/10"
        id="generate-lesson-plan-btn"
      >
        <Compass className={`w-4 h-4 ${isGenerating ? "animate-spin" : ""}`} />
        {isGenerating ? "Molding CBSE Lesson Plan..." : "Generate CBSE Lesson Plan outline"}
      </button>

      {errorText && (
        <p className="mt-2 text-xs text-red-500 font-medium" id="lesson-error">
          Error: {errorText}
        </p>
      )}

      {warningText && (
        <div className="mt-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-lg p-3 text-xs text-amber-700 dark:text-amber-400">
          <p className="font-semibold">{warningText}</p>
        </div>
      )}

      {/* Render lesson plan structure */}
      {generatedPlan && (
        <div className="mt-6 pt-5 border-t border-slate-150 dark:border-slate-800 space-y-4" id="lesson-plan-output">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-100 dark:border-slate-850">
            <div>
              <span className="text-[10px] uppercase font-bold text-blue-500 tracking-wider">
                Personalized Lesson Outline generated
              </span>
              <h4 className="text-slate-800 dark:text-slate-100 font-bold text-sm font-display mt-0.5">
                {generatedPlan.title}
              </h4>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setShowRefinementPanel(!showRefinementPanel)}
                className={`px-3 py-2 ${
                  showRefinementPanel 
                    ? "bg-indigo-700 text-white" 
                    : "bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-900 dark:hover:bg-indigo-950/60"
                } text-xs font-semibold rounded-lg transition flex items-center gap-1.5 cursor-pointer`}
                id="refine-content-toggle-btn"
                title="Automatically adjust lesson complexity based on specific student needs or learning difficulties"
                aria-pressed={showRefinementPanel}
              >
                <Sparkles className="w-3.5 h-3.5" />
                Refine Content
              </button>
              <button
                onClick={handlePublishPlan}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition flex items-center gap-1 cursor-pointer"
                id="save-lesson-plan-btn"
              >
                <Check className="w-3.5 h-3.5" />
                Save Lesson Plan
              </button>
            </div>
          </div>

          {showRefinementPanel && (
            <div className="bg-slate-50/50 dark:bg-slate-900 border border-indigo-100 dark:border-indigo-950/60 rounded-xl p-4 md:p-5 space-y-4 animate-fade-in" id="ai-refine-panel">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-4 h-4 text-indigo-500 animate-pulse" />
                <h5 className="font-bold text-slate-800 dark:text-slate-100 text-xs uppercase tracking-wider">
                  Inclusive AI Content Refinement Tool
                </h5>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed -mt-1">
                Modify and adapt this generated curriculum to fit specific student difficulties or enrichment targets automatically.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label htmlFor="refine-profile" className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-450 mb-1">
                    Select Profile Accommodation
                  </label>
                  <select
                    id="refine-profile"
                    value={refinementType}
                    onChange={(e) => setRefinementType(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg py-2 px-3 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="ADHD & Active Sensory (Short chunks, gamified steps, frequent breaks)">ADHD & Attention Focus Integration</option>
                    <option value="Dyslexia Support (Simple sentence structures, visual cues, phonetic anchors)">Dyslexia / Reading Accommodations</option>
                    <option value="Visual Impairment Guides (Alternative sensory tasks, high-fidelity description cues)">Sensory / Visual Impairment Options</option>
                    <option value="English Language Learners (Incorporate vocabulary anchors, step diagnostics)">ELL / Beginner English Scaffolding</option>
                    <option value="Slow-Paced Learner Scaffolding (Deconstruct rules, extra step examples, diagnostic checklists)">Slow-Paced Curricular Scaffolding</option>
                    <option value="Gifted & High-Achieving Extension (Increase logic rigor, independent inquiry puzzles)">Gifted / Intellectual Extension</option>
                    <option value="Custom General Refinement Instructions">Custom Adaptation Instructions only</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="refine-notes" className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-450 mb-1">
                    Extra Instructions / Notes (Optional)
                  </label>
                  <input
                    id="refine-notes"
                    type="text"
                    placeholder="e.g., 'Embed practical formulas' or 'Adjust times to 5-min intervals'"
                    value={customNotes}
                    onChange={(e) => setCustomNotes(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg py-2 px-3 text-xs font-medium text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 pt-1">
                <span className="text-[11px] text-slate-400 dark:text-slate-500">
                  Adapt and regenerate using CBSE standard templates.
                </span>
                <div className="flex gap-2.5">
                  <button
                    onClick={() => setShowRefinementPanel(false)}
                    className="px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold rounded-lg text-xs transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRefinePlan}
                    disabled={isRefining}
                    className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-100 dark:disabled:bg-slate-800 text-white disabled:text-slate-450 font-semibold rounded-lg text-xs flex items-center gap-1.5 transition cursor-pointer"
                    id="refine-apply-btn"
                  >
                    {isRefining ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Refining Complexity...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        Apply Refinement
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4 text-xs leading-relaxed text-slate-700 dark:text-slate-350">
            {/* Overview card */}
            <div className="bg-slate-50/50 dark:bg-slate-900 border border-slate-50 dark:border-slate-800/80 p-4 rounded-xl">
              <h5 className="font-semibold text-slate-800 dark:text-slate-200 text-xs mb-1 uppercase tracking-wider text-blue-500">
                1. Context & Overview
              </h5>
              <p>{generatedPlan.overview}</p>
            </div>

            {/* Bloom's scale objectives */}
            <div className="bg-slate-50/50 dark:bg-slate-900 border border-slate-50 dark:border-slate-800/80 p-4 rounded-xl">
              <h5 className="font-semibold text-slate-800 dark:text-slate-200 text-xs mb-2 uppercase tracking-wider text-emerald-500">
                2. Intended Learning Objectives (Bloom's Taxonomy)
              </h5>
              <ul className="space-y-1 ml-2.5 list-disc">
                {generatedPlan.objectives.map((obj, i) => (
                  <li key={i}>{obj}</li>
                ))}
              </ul>
            </div>

            {/* Timed Timeline */}
            <div className="bg-slate-50/50 dark:bg-slate-900 border border-slate-50 dark:border-slate-800/80 p-4 rounded-xl">
              <h5 className="font-semibold text-slate-800 dark:text-slate-200 text-xs mb-3 uppercase tracking-wider text-blue-500 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-blue-400" />
                3. Lesson Schedule Timeline
              </h5>
              <div className="space-y-3 relative border-l border-slate-200 dark:border-slate-800 pl-4 ml-2">
                {generatedPlan.timeline.map((item, i) => (
                  <div key={i} className="relative">
                    {/* Tick mark node */}
                    <div className="absolute -left-[21px] mt-0.5 w-2.5 h-2.5 rounded-full bg-blue-500 ring-4 ring-white dark:ring-slate-900" />
                    <div>
                      <span className="font-semibold text-[11px] text-blue-600 dark:text-blue-400">
                        {item.duration} : {item.activity}
                      </span>
                      <p className="text-slate-650 dark:text-slate-400 mt-0.5">{item.details}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Conceptual Deep Dive & Accessibility tip */}
            <div className="bg-slate-50/50 dark:bg-slate-900 border border-slate-50 dark:border-slate-800/80 p-4 rounded-xl space-y-3">
              <h5 className="font-semibold text-slate-800 dark:text-slate-200 text-xs uppercase tracking-wider text-indigo-500">
                4. Core Material & Teaching Rationale
              </h5>
              {generatedPlan.contentSections.map((sec, i) => (
                <div key={i} className="space-y-1">
                  <h6 className="font-semibold text-slate-800 dark:text-slate-200">{sec.heading}</h6>
                  <p>{sec.body}</p>
                  {sec.tips && (
                    <div className="mt-1 pb-1.5 p-2 bg-blue-50/50 dark:bg-slate-950/70 rounded border-l-2 border-indigo-400 text-[11px] text-indigo-600 dark:text-indigo-400">
                      <strong className="block text-[10px] uppercase font-bold tracking-wider mb-0.5">
                        WCAG 2.1 Teachers Inclusion Tip:
                      </strong>
                      {sec.tips}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Exits and homework */}
            <div className="bg-slate-50/50 dark:bg-slate-900 border border-slate-50 dark:border-slate-800/80 p-4 rounded-xl">
              <h5 className="font-semibold text-slate-800 dark:text-slate-200 text-xs mb-1 uppercase tracking-wider text-rose-500">
                5. Guided Assessment & Exit Verification
              </h5>
              <p>{generatedPlan.evaluation}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
