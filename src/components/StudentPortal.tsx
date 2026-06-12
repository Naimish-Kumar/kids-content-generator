import React, { useState, useEffect } from "react";
import { Quiz, QuizQuestion, QuizAttempt } from "../types";
import { BookOpen, HelpCircle, Trophy, CheckCircle, XCircle, ArrowRight, CornerDownRight, PlayCircle, Star, Sparkles, RefreshCw, AlertTriangle, GraduationCap } from "lucide-react";

interface StudentPortalProps {
  quizzes: Quiz[];
  attempts: QuizAttempt[];
  onAddAttempt: (attempt: QuizAttempt) => void;
  onPostNotification: (title: string, message: string, type: "success" | "warning" | "alert") => void;
  currentUser: { name: string };
  isOnline: boolean;
}

export const StudentPortal: React.FC<StudentPortalProps> = ({
  quizzes,
  attempts,
  onAddAttempt,
  onPostNotification,
  currentUser,
  isOnline
}) => {
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  
  // Track user session answers
  const [sessionAnswers, setSessionAnswers] = useState<number[]>([]);
  const [sessionScore, setSessionScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);

  // Suggested Topics AI State variables
  const [recommendedTopics, setRecommendedTopics] = useState<any[]>([]);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  const [recommendationsError, setRecommendationsError] = useState("");

  const fetchRecommendations = async () => {
    setIsLoadingRecommendations(true);
    setRecommendationsError("");
    try {
      const res = await fetch("/api/recommend/topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attempts,
          quizzes
        })
      });

      if (!res.ok) {
        throw new Error(`Diagnostics server error: ${res.status}`);
      }

      const data = await res.json();
      if (data.success && data.recommendedTopics) {
        setRecommendedTopics(data.recommendedTopics);
      } else {
        throw new Error(data.error || "Failed to parse recommendations payload.");
      }
    } catch (err: any) {
      console.error("Failed to load suggested topics:", err);
      setRecommendationsError(err.message || err);
    } finally {
      setIsLoadingRecommendations(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, [attempts.length, quizzes.length]);

  const startQuiz = (quiz: Quiz) => {
    setActiveQuiz(quiz);
    setCurrentQuestionIdx(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setSessionAnswers([]);
    setSessionScore(0);
    setQuizFinished(false);
    
    onPostNotification(
      "Quiz Session Started",
      `Good luck on "${quiz.title}"! Read explanations closely for learning.`,
      "info"
    );
  };

  const handleOptionSelect = (optIndex: number) => {
    if (isAnswered) return; // Prevent changing choice after submitting
    setSelectedOption(optIndex);
  };

  const handleSubmitAnswer = () => {
    if (selectedOption === null || isAnswered || !activeQuiz) return;

    const currentQuestion = activeQuiz.questions[currentQuestionIdx];
    const correct = selectedOption === currentQuestion.correctOptionIndex;

    const newScore = correct ? sessionScore + 1 : sessionScore;
    setSessionScore(newScore);
    
    // Record choice
    setSessionAnswers([...sessionAnswers, selectedOption]);
    setIsAnswered(true);

    // Dynamic toast alerts based on answer status
    if (correct) {
      onPostNotification("Correct Answer!", "Excellent analytics. Keep it up!", "success");
    } else {
      onPostNotification(
        "Incorrect Selection",
        "No worries! Read the CBSE curriculum logic explanation below.",
        "warning"
      );
    }
  };

  const handleNextQuestion = () => {
    if (!activeQuiz) return;

    if (currentQuestionIdx + 1 < activeQuiz.questions.length) {
      setCurrentQuestionIdx(currentQuestionIdx + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      // Quiz completed! Save quiz attempt data
      const finalAttempt: QuizAttempt = {
        id: `at_${Date.now()}`,
        quizId: activeQuiz.id,
        quizTitle: activeQuiz.title,
        className: activeQuiz.className,
        subject: activeQuiz.subject,
        studentName: currentUser.name || "Default Student",
        score: sessionScore,
        totalQuestions: activeQuiz.questions.length,
        answers: [...sessionAnswers],
        timestamp: new Date().toISOString(),
        synced: false // Will be pushed on cloud backup sync
      };

      onAddAttempt(finalAttempt);
      setQuizFinished(true);

      // Trigger automatic alerts for teacher dashboards on score thresholds
      const scoreRatio = sessionScore / activeQuiz.questions.length;
      if (scoreRatio < 0.6) {
        onPostNotification(
          "Subject Support Triggered",
          `Score under 60%. Study notes on ${activeQuiz.topics.join(", ")} before retesting.`,
          "alert"
        );
      } else {
        onPostNotification(
          "CBSE Badge Earned!",
          `Outstanding! Confirmed mastery of grade syllabus ${activeQuiz.className}.`,
          "success"
        );
      }
    }
  };

  const handleExitQuiz = () => {
    setActiveQuiz(null);
    setQuizFinished(false);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-sm p-5 md:p-6 shadow-sm" id="student-portal-workspace">
      {!activeQuiz ? (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 w-full items-start animate-fade-in" id="student-portal-lobby">
          {/* Left Side: Available Classroom Quizzes */}
          <div className="xl:col-span-8 space-y-4">
            <div className="flex gap-2 items-center mb-4 border-b border-slate-150 dark:border-slate-805 pb-3">
              <BookOpen className="w-5 h-5 text-[#A08050]" />
              <h3 className="font-bold font-serif italic text-base md:text-lg text-[#A08050] tracking-wide">
                Savant Student Classroom Quizzes ({quizzes.length})
              </h3>
            </div>

            {quizzes.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950/40">
                <HelpCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  No active CBSE quizzes have been published by teachers. Use the Quiz Generator tab to create one!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {quizzes.map((quiz) => (
                  <div
                    key={quiz.id}
                    className="bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-805/70 flex flex-col justify-between space-y-4 transition-all duration-150 group"
                  >
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="px-2 py-0.5 rounded bg-blue-105 text-blue-800 dark:bg-blue-950 dark:text-blue-300 font-bold uppercase tracking-wider">
                          {quiz.className} • {quiz.subject}
                        </span>
                        <span className="text-slate-400 font-medium">
                          {quiz.questions.length} Questions
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm font-display group-hover:text-blue-600 dark:group-hover:text-blue-450 transition leading-snug">
                        {quiz.title}
                      </h4>
                      <div className="flex flex-wrap gap-1 text-[11px] text-slate-400">
                        <span>Topics:</span>
                        {quiz.topics.map((t) => (
                          <span key={t} className="font-medium text-slate-600 dark:text-slate-350 underline decoration-slate-200 underline-offset-2">
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={() => startQuiz(quiz)}
                      className="w-full bg-indigo-650 hover:bg-indigo-700 text-white font-semibold py-2 rounded-lg text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                      id={`start-quiz-btn-${quiz.id}`}
                    >
                      <PlayCircle className="w-4 h-4" />
                      Attempt Assessment
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Side: Remedial AI Suggestion Hub */}
          <div className="xl:col-span-4" id="ai-remedial-suggestions">
            <div className="bg-slate-50/70 hover:bg-slate-105/40 dark:bg-slate-950/70 dark:hover:bg-slate-900/60 p-4 rounded-xl border border-slate-100 dark:border-slate-805/70 space-y-4 transition-all duration-150">
              <div className="flex items-center justify-between border-b border-slate-150 dark:border-slate-805 pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-500 animate-pulse" />
                  <h4 className="font-bold text-slate-800 dark:text-slate-100 text-xs uppercase tracking-wider">
                    Remedial AI Suggested Topics
                  </h4>
                </div>
                <button
                  onClick={fetchRecommendations}
                  disabled={isLoadingRecommendations}
                  className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-850 rounded-lg text-slate-500 hover:text-slate-750 dark:text-slate-400 dark:hover:text-slate-205 transition cursor-pointer"
                  id="refresh-recs-btn"
                  title="Refresh AI gap recommendations"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingRecommendations ? "animate-spin text-indigo-505" : "text-slate-500"}`} />
                </button>
              </div>

              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                Our educational diagnostics engine examines previous CBSE performance data to suggest personalized focal points.
              </p>

              {isLoadingRecommendations ? (
                <div className="py-12 text-center space-y-2">
                  <RefreshCw className="w-6 h-6 animate-spin text-indigo-500 mx-auto" />
                  <p className="text-[11px] text-slate-400 animate-pulse">Running diagnostics...</p>
                </div>
              ) : recommendationsError ? (
                <div className="p-3 bg-red-50 dark:bg-red-955/20 border border-red-200 dark:border-red-900 rounded-lg text-center text-[11px] text-red-655 dark:text-red-400 space-y-2">
                  <AlertTriangle className="w-5 h-5 text-red-500 mx-auto" />
                  <p>Failed to load suggestions: {recommendationsError}</p>
                  <button
                    onClick={fetchRecommendations}
                    className="px-2.5 py-1 bg-red-100 hover:bg-red-200 dark:bg-red-900/60 dark:hover:bg-red-900/80 rounded-md text-[10px] font-bold uppercase transition cursor-pointer"
                  >
                    Retry
                  </button>
                </div>
              ) : recommendedTopics.length === 0 ? (
                <div className="border border-dashed border-slate-200 dark:border-slate-800 rounded-lg p-5 text-center bg-slate-50/20 dark:bg-slate-950/10">
                  <GraduationCap className="w-7 h-7 text-slate-300 dark:text-slate-650 mx-auto mb-1.5" />
                  <p className="text-[11px] font-medium text-slate-450">
                    No diagnostics formulated. Complete standard classroom assignments below to unlock AI review!
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recommendedTopics.map((item, idx) => {
                    const matchedQuiz = quizzes.find(q => q.id === item.matchingQuizId);
                    
                    return (
                      <div
                        key={idx}
                        className="bg-white dark:bg-slate-900 rounded-lg p-3.5 border border-slate-205 dark:border-slate-850 shadow-sm space-y-2.5 hover:border-indigo-200/80 dark:hover:border-indigo-950/80 transition-all cursor-default"
                      >
                        <div className="flex justify-between items-start gap-1">
                          <div className="max-w-[70%]">
                            <span className="inline-block px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-bold text-[9px] uppercase tracking-wider mb-1">
                              {item.subject}
                            </span>
                            <h5 className="font-bold text-slate-800 dark:text-slate-100 text-[11px] truncate">
                              {item.topic}
                            </h5>
                          </div>
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase shrink-0 ${
                            item.difficulty === "Easy"
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-450"
                              : item.difficulty === "Medium"
                              ? "bg-amber-50 text-amber-700 dark:bg-amber-955/30 dark:text-amber-450"
                              : "bg-red-50 text-red-700 dark:bg-red-955/30 dark:text-red-450"
                          }`}>
                            {item.difficulty}
                          </span>
                        </div>

                        <div className="space-y-1.5">
                          {item.reason && (
                            <p className="text-[10px] text-slate-650 dark:text-slate-350 bg-slate-50 dark:bg-slate-950/50 p-2 rounded border border-slate-100 dark:border-slate-850 italic font-serif leading-relaxed">
                              "{item.reason}"
                            </p>
                          )}
                          <div className="text-[10px] leading-relaxed text-slate-500 dark:text-slate-400 flex items-start gap-1">
                            <span className="text-indigo-500 font-bold mt-0.5 shrink-0">💡</span>
                            <span>{item.remedialAction}</span>
                          </div>
                        </div>

                        {matchedQuiz && (
                          <button
                            onClick={() => startQuiz(matchedQuiz)}
                            className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-950/60 text-indigo-650 dark:text-indigo-300 text-[10px] font-bold uppercase tracking-wider rounded-md transition cursor-pointer"
                          >
                            <PlayCircle className="w-3.5 h-3.5" />
                            Attempt Retest
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : quizFinished ? (
        // Quiz Finished Screen
        <div className="text-center py-6 space-y-5" id="quiz-completion-panel">
          <div className="inline-flex p-3.5 bg-yellow-50 dark:bg-yellow-950/40 text-yellow-500 rounded-full animate-bounce">
            <Trophy className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-slate-800 dark:text-slate-50 text-base font-display">
              Assessment Completed!
            </h3>
            <p className="text-xs text-slate-500">
              Your score has been registered locally and queued for automatic secure Cloud PostgreSQL synch.
            </p>
          </div>

          <div className="max-w-xs mx-auto bg-slate-50 dark:bg-slate-950 p-5 rounded-xl border border-slate-100 dark:border-slate-850 space-y-1.5">
            <p className="text-xs text-slate-500">Your Grade Result:</p>
            <p className="text-3xl font-black text-slate-800 dark:text-white font-display">
              {sessionScore} / {activeQuiz.questions.length}
            </p>
            <p className="text-xs text-slate-400 font-medium">
              Percentage: {Math.round((sessionScore / activeQuiz.questions.length) * 100)}%
            </p>
            <div className="pt-2">
              <span className={`inline-block px-3 py-1 rounded-full font-bold text-[10px] ${
                (sessionScore / activeQuiz.questions.length) >= 0.6
                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                  : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
              }`}>
                {(sessionScore / activeQuiz.questions.length) >= 0.6 ? "MASTERED STANDARDS" : "TUTORING SUGGESTED"}
              </span>
            </div>
          </div>

          <div className="flex justify-center gap-3">
            <button
              onClick={handleExitQuiz}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg transition cursor-pointer"
              id="exit-quiz-back-btn"
            >
              Exit to Quizzes
            </button>
          </div>
        </div>
      ) : (
        // Active Quiz Question screen
        <div className="space-y-6" id="active-quiz-questions-screen">
          <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-805 pb-3">
            <div>
              <span className="text-[10px] text-blue-500 font-bold uppercase tracking-wider">
                {activeQuiz.title}
              </span>
              <h4 className="font-semibold text-slate-800 dark:text-slate-100 text-xs mt-0.5">
                Question {currentQuestionIdx + 1} of {activeQuiz.questions.length}
              </h4>
            </div>
            <button
              onClick={handleExitQuiz}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-medium cursor-pointer"
            >
              Quit Assessment
            </button>
          </div>

          {/* Question Text */}
          <div className="space-y-4">
            <div className="bg-slate-50 dark:bg-slate-950/80 p-4 rounded-xl border border-slate-100 dark:border-slate-850">
              <p className="text-slate-800 dark:text-slate-100 font-medium text-xs md:text-sm leading-relaxed">
                {activeQuiz.questions[currentQuestionIdx].question}
              </p>
            </div>

            {/* Answer Options */}
            <div className="grid grid-cols-1 gap-2.5">
              {activeQuiz.questions[currentQuestionIdx].options.map((option, index) => {
                const isSelected = selectedOption === index;
                const correctIdx = activeQuiz.questions[currentQuestionIdx].correctOptionIndex;
                
                let optionStyle = "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-805 hover:bg-slate-50 dark:hover:bg-slate-850/50 text-slate-700 dark:text-slate-300";
                
                if (isAnswered) {
                  if (index === correctIdx) {
                    optionStyle = "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-500 text-emerald-800 dark:text-emerald-300 font-semibold";
                  } else if (isSelected) {
                    optionStyle = "bg-rose-50 dark:bg-rose-955/30 border-rose-500 text-rose-800 dark:text-rose-350";
                  } else {
                    optionStyle = "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-850 text-slate-405 dark:text-slate-500 opacity-60";
                  }
                } else if (isSelected) {
                  optionStyle = "bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 text-indigo-800 dark:text-indigo-300 ring-1 ring-indigo-500 font-semibold";
                }

                return (
                  <button
                    key={index}
                    onClick={() => handleOptionSelect(index)}
                    disabled={isAnswered}
                    className={`w-full p-3.5 border rounded-xl text-xs text-left flex items-start gap-3 transition-all duration-150 group cursor-pointer ${optionStyle}`}
                  >
                    <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 dark:group-hover:bg-slate-755 text-slate-600 dark:text-slate-400 font-bold text-[10px] flex items-center justify-center shrink-0">
                      {String.fromCharCode(65 + index)}
                    </span>
                    <span className="flex-1 mt-0.5">{option}</span>
                    
                    {isAnswered && index === correctIdx && (
                      <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 self-center" />
                    )}
                    {isAnswered && isSelected && index !== correctIdx && (
                      <XCircle className="w-4 h-4 text-rose-500 shrink-0 self-center" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Corrective feedback logic panel */}
          {isAnswered && (
            <div className="bg-blue-50/70 dark:bg-slate-950 p-4 rounded-xl border border-blue-150 dark:border-blue-900/40 space-y-2 animate-fade-in text-xs leading-relaxed">
              <div className="flex gap-2 items-center text-blue-700 dark:text-blue-400 font-semibold">
                <CornerDownRight className="w-4 h-4" />
                <span>CBSE Syllabus Remedial Feedback:</span>
              </div>
              <p className="text-slate-700 dark:text-slate-300">
                {activeQuiz.questions[currentQuestionIdx].explanation}
              </p>
            </div>
          )}

          {/* Question footer/next triggers */}
          <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-805">
            {!isAnswered ? (
              <button
                onClick={handleSubmitAnswer}
                disabled={selectedOption === null}
                className={`px-5 py-2.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  selectedOption === null
                    ? "bg-slate-100 dark:bg-slate-805 text-slate-400 cursor-not-allowed"
                    : "bg-indigo-600 text-white hover:bg-indigo-700"
                }`}
                id="submit-answer-btn"
              >
                Submit Answer
              </button>
            ) : (
              <button
                onClick={handleNextQuestion}
                className="px-5 py-2.5 bg-blue-600 text-white hover:bg-blue-750 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition cursor-pointer"
                id="next-question-btn"
              >
                {currentQuestionIdx + 1 === activeQuiz.questions.length ? "Finish Assessment" : "Next Question"}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
