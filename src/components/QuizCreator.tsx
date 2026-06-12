import React, { useState, useEffect } from "react";
import { Quiz, QuizQuestion } from "../types";
import { CBSE_CLASSES, CBSE_SUBJECTS, CBSE_TOPICS } from "../data";
import { FileJson, Play, Sparkles, Check, AlertTriangle, Copy, CheckCircle2 } from "lucide-react";

interface QuizCreatorProps {
  onAddQuiz: (quiz: Quiz) => void;
  isOnline: boolean;
  onPostNotification: (title: string, message: string, type: "success" | "warning" | "alert") => void;
}

export const QuizCreator: React.FC<QuizCreatorProps> = ({
  onAddQuiz,
  isOnline,
  onPostNotification
}) => {
  // Input states mirroring the layout of the user's reference image
  const [selectedClass, setSelectedClass] = useState("Class 1");
  const [selectedSubject, setSelectedSubject] = useState("Mathematics");
  const [questionsCount, setQuestionsCount] = useState(5);
  const [selectedDifficulty, setSelectedDifficulty] = useState("Easy");
  const [selectedTopics, setSelectedTopics] = useState<string[]>(["Addition", "Shapes"]);
  
  // Interface interaction states
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedQuiz, setGeneratedQuiz] = useState<Quiz | null>(null);
  const [rawJson, setRawJson] = useState<string>("");
  const [errorText, setErrorText] = useState<string>("");
  const [warningText, setWarningText] = useState<string>("");
  const [copied, setCopied] = useState(false);

  // Update selected topics when subject changes to make sure they are aligned
  useEffect(() => {
    const defaultTopicsMap = CBSE_TOPICS[selectedSubject] || [];
    // Take the first two topics as defaults when changing subjects
    if (defaultTopicsMap.length >= 2) {
      setSelectedTopics([defaultTopicsMap[0], defaultTopicsMap[1]]);
    } else if (defaultTopicsMap.length > 0) {
      setSelectedTopics([defaultTopicsMap[0]]);
    } else {
      setSelectedTopics([]);
    }
  }, [selectedSubject]);

  const toggleTopic = (topic: string) => {
    if (selectedTopics.includes(topic)) {
      setSelectedTopics(selectedTopics.filter((t) => t !== topic));
    } else {
      setSelectedTopics([...selectedTopics, topic]);
    }
  };

  const handleGenerate = async () => {
    setErrorText("");
    setWarningText("");
    setGeneratedQuiz(null);
    setRawJson("");

    if (selectedTopics.length === 0) {
      setErrorText("Please select at least one topic tag (turns blue) before continuing.");
      return;
    }

    setIsGenerating(true);

    try {
      const response = await fetch("/api/generate/quiz", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          className: selectedClass,
          subject: selectedSubject,
          questionsCount: questionsCount,
          difficulty: selectedDifficulty,
          topics: selectedTopics,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to generate quiz. HTTP status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.quiz) {
        // Construct standard Quiz object with unique ID
        const finalQuiz: Quiz = {
          id: `quiz_${Date.now()}`,
          title: data.quiz.title || `CBSE ${selectedSubject} Quiz - ${selectedClass}`,
          className: selectedClass,
          subject: selectedSubject,
          difficulty: selectedDifficulty as "Easy" | "Medium" | "Hard",
          topics: selectedTopics,
          questions: data.quiz.questions,
          timestamp: new Date().toISOString(),
          synced: data.method === "AIStream" ? isOnline : false,
        };

        setGeneratedQuiz(finalQuiz);
        setRawJson(JSON.stringify(data.quiz, null, 2));

        if (data.warning) {
          setWarningText(data.warning);
          onPostNotification(
            "Demo Sample served",
            "Served beautiful pre-configured syllabus standard. Configure process.env.GEMINI_API_KEY for dynamic AI.",
            "warning"
          );
        } else {
          onPostNotification(
            "AI CBSE Quiz Created",
            `A highly personalized quiz with ${finalQuiz.questions.length} questions is generated!`,
            "success"
          );
        }
      } else {
        throw new Error(data.error || "The server returned an empty or invalid format.");
      }
    } catch (err: any) {
      console.error(err);
      setErrorText(`Failed to fetch quiz content. Details: ${err.message || err}`);
      onPostNotification("Generation failed", "Verify connection or check standard environment files.", "error");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveToClassroom = () => {
    if (!generatedQuiz) return;
    onAddQuiz(generatedQuiz);
    onPostNotification(
      "Quiz Published",
      `"${generatedQuiz.title}" is now added to the Student Portal curriculum!`,
      "success"
    );
    // Reset after saving to let them make another one easily
    setGeneratedQuiz(null);
    setRawJson("");
    setSelectedTopics([CBSE_TOPICS[selectedSubject]?.[0] || "Foundations"]);
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(rawJson);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const currentAvailableTopics = CBSE_TOPICS[selectedSubject] || [];

  return (
    <div className="bg-slate-900 border border-slate-800 text-white rounded-sm shadow-xl p-5 md:p-6" id="cbse-quiz-json-generator-container">
      {/* Title block mirroring the UI reference */}
      <div className="flex items-center gap-2.5 mb-6 border-b border-slate-800 pb-4">
        <span className="text-xl md:text-2xl" aria-hidden="true">⚡</span>
        <h2 className="text-lg md:text-xl font-serif italic text-[#A08050] tracking-wide select-none">
          CBSE Quiz JSON Generator
        </h2>
      </div>

      {/* Selectors section */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div>
          <label htmlFor="selector-class" className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
            Class
          </label>
          <select
            id="selector-class"
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="w-full bg-slate-800 border border-slate-755 hover:border-slate-600 rounded-lg py-2.5 px-3 text-sm font-medium text-white shadow-inner focus:outline-none focus:ring-1 focus:ring-blue-500 transition cursor-pointer"
          >
            {CBSE_CLASSES.map((cls) => (
              <option key={cls} value={cls} className="bg-slate-900">
                {cls}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="selector-subject" className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
            Subject
          </label>
          <select
            id="selector-subject"
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="w-full bg-slate-800 border border-slate-755 hover:border-slate-600 rounded-lg py-2.5 px-3 text-sm font-medium text-white shadow-inner focus:outline-none focus:ring-1 focus:ring-blue-500 transition cursor-pointer"
          >
            {CBSE_SUBJECTS.map((sub) => (
              <option key={sub} value={sub} className="bg-slate-900">
                {sub}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="selector-questions" className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
            Questions
          </label>
          <select
            id="selector-questions"
            value={questionsCount}
            onChange={(e) => setQuestionsCount(Number(e.target.value))}
            className="w-full bg-slate-800 border border-slate-755 hover:border-slate-600 rounded-lg py-2.5 px-3 text-sm font-medium text-white shadow-inner focus:outline-none focus:ring-1 focus:ring-blue-500 transition cursor-pointer"
          >
            {[2, 5, 10, 15, 20].map((num) => (
              <option key={num} value={num} className="bg-slate-900">
                {num}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="selector-difficulty" className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
            Difficulty
          </label>
          <select
            id="selector-difficulty"
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="w-full bg-slate-800 border border-slate-755 hover:border-slate-600 rounded-lg py-2.5 px-3 text-sm font-medium text-white shadow-inner focus:outline-none focus:ring-1 focus:ring-blue-500 transition cursor-pointer"
          >
            {["Easy", "Medium", "Hard"].map((diff) => (
              <option key={diff} value={diff} className="bg-slate-900">
                {diff}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Topics header exactly matching */}
      <div className="mb-6">
        <p className="text-xs text-slate-400 mb-2.5 select-none leading-none">
          Click topic(s) to select <span className="text-blue-400 font-medium">(turns blue)</span>
        </p>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Topic selector tags">
          {currentAvailableTopics.map((topic) => {
            const isSelected = selectedTopics.includes(topic);
            return (
              <button
                key={topic}
                onClick={() => toggleTopic(topic)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-all duration-200 border ${
                  isSelected
                    ? "bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-900/30 font-semibold"
                    : "bg-slate-800/65 border-slate-700/60 text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
                aria-pressed={isSelected}
              >
                {topic}
              </button>
            );
          })}
        </div>
      </div>

      {/* Action triggers */}
      <div className="space-y-4">
        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white disabled:text-slate-500 text-sm font-semibold rounded-lg py-3.5 flex items-center justify-center gap-2 shadow-lg hover:shadow-blue-950/20 active:scale-[0.99] transition cursor-pointer"
          id="generate-json-trigger-btn"
        >
          <Sparkles className={`w-4 h-4 ${isGenerating ? "animate-spin" : ""}`} />
          {isGenerating ? "Generating CBSE Material with AI..." : "✨ Generate Quiz JSON"}
        </button>

        {/* Dynamic warning exactly matches failed to fetch or notifications */}
        {errorText && (
          <div className="bg-rose-950/40 border border-rose-900/50 rounded-lg p-3 text-xs text-rose-400 flex items-start gap-2.5" id="generation-error-box">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-rose-300">✗ Failed to fetch</p>
              <p className="text-[11px] leading-relaxed mt-0.5">{errorText}</p>
            </div>
          </div>
        )}

        {warningText && (
          <div className="bg-amber-950/40 border border-amber-900/50 rounded-lg p-3 text-xs text-amber-450 flex items-start gap-2.5" id="generational-warning-box">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-300">Demo Fallback Template Active</p>
              <p className="text-[11px] leading-relaxed mt-0.5">{warningText}</p>
            </div>
          </div>
        )}
      </div>

      {/* Presentation of generated outputs */}
      {generatedQuiz && (
        <div className="mt-8 pt-6 border-t border-slate-800 space-y-4" id="quiz-generation-results">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-850 p-4 rounded-xl border border-slate-800">
            <div>
              <span className="text-[10px] uppercase font-bold text-blue-400 tracking-wider">
                Successfully Generated
              </span>
              <h3 className="text-white font-semibold text-sm font-display mt-0.5">
                {generatedQuiz.title}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {generatedQuiz.questions.length} questions • Class: {generatedQuiz.className} • Subject: {generatedQuiz.subject}
              </p>
            </div>

            <div className="flex gap-2 shrink-0">
              <button
                onClick={handleCopyJson}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 rounded-lg flex items-center gap-1.5 transition cursor-pointer"
                title="Copy raw CBSE Quiz JSON structure"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "Copied" : "Copy JSON"}
              </button>
              
              <button
                onClick={handleSaveToClassroom}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-xs text-white rounded-lg flex items-center gap-1.5 font-semibold transition cursor-pointer"
                id="publish-classroom-btn"
              >
                <Play className="w-3.5 h-3.5" />
                Publish to Board
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Display JSON Source */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <FileJson className="w-4 h-4 text-slate-500" /> Raw JSON Schema
              </h4>
              <pre className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 text-[10px] font-mono text-emerald-400 h-64 overflow-y-auto leading-relaxed overflow-x-auto tab-size-2">
                <code>{rawJson}</code>
              </pre>
            </div>

            {/* Display Interactive Review Cards */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                Interactive Preview Checklist
              </h4>
              <div className="bg-slate-950/45 border border-slate-800 rounded-xl p-4 h-64 overflow-y-auto space-y-4">
                {generatedQuiz.questions.map((quizQ, index) => (
                  <div key={quizQ.id} className="border-b border-slate-800/60 pb-3 last:border-0 last:pb-0 text-xs">
                    <p className="font-semibold text-blue-300">
                      Q{index + 1}. {quizQ.question}
                    </p>
                    <ul className="mt-1.5 ml-2.5 space-y-1 text-slate-400 text-[11px] list-disc list-inside">
                      {quizQ.options.map((option, optIdx) => (
                        <li key={optIdx} className={optIdx === quizQ.correctOptionIndex ? "text-emerald-400 font-medium" : ""}>
                          {option} {optIdx === quizQ.correctOptionIndex && "✓ (Correct Answer)"}
                        </li>
                      ))}
                    </ul>
                    <p className="text-[10px] text-slate-500 italic mt-1.5">
                      Rationale: {quizQ.explanation}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
