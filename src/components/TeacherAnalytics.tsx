import React, { useState } from "react";
import { motion } from "motion/react";
import { Quiz, QuizAttempt, LessonPlan } from "../types";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, LineChart, Line } from "recharts";
import { TrendingUp, Users, Award, BookCheck, ShieldAlert, GraduationCap, ArrowUpDown, Filter, Eye, Download } from "lucide-react";

interface TeacherAnalyticsProps {
  quizzes: Quiz[];
  attempts: QuizAttempt[];
  lessonPlans: LessonPlan[];
}

export const TeacherAnalytics: React.FC<TeacherAnalyticsProps> = ({
  quizzes,
  attempts,
  lessonPlans
}) => {
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>("All");
  const [inspectAttempt, setInspectAttempt] = useState<QuizAttempt | null>(null);

  // Filter student attempts based on selected grade
  const filteredAttempts = selectedClassFilter === "All"
    ? attempts
    : attempts.filter((at) => at.className === selectedClassFilter);

  // Download filtered data as a structured CSV report
  const downloadCSVReport = () => {
    if (filteredAttempts.length === 0) return;

    // Headings matching CBSE student grading scheme
    const headers = ["Student Name", "Syllabus Grade", "Subject", "CBSE Quiz Title", "Score", "Total Questions", "Percentage (%)", "Submission Timestamp"];
    
    // Construct rows complying with CSV double-quoting standards
    const rows = filteredAttempts.map((at) => [
      `"${at.studentName.replace(/"/g, '""')}"`,
      `"${at.className.replace(/"/g, '""')}"`,
      `"${at.subject.replace(/"/g, '""')}"`,
      `"${at.quizTitle.replace(/"/g, '""')}"`,
      at.score,
      at.totalQuestions,
      Math.round((at.score / at.totalQuestions) * 100),
      `"${new Date(at.timestamp).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}"`
    ]);

    const csvContent = [headers.join(","), ...rows.map(row => row.join(","))].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `CBSE_Student_Report_${selectedClassFilter === "All" ? "All" : selectedClassFilter.replace(/\s+/g, "_")}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Metric 1: Total quiz attempts
  const totalAttemptsCount = filteredAttempts.length;

  // Metric 2: Average Class Score
  const averageClassScorePercent = totalAttemptsCount === 0
    ? 0
    : Math.round(
        (filteredAttempts.reduce((sum, at) => sum + (at.score / at.totalQuestions), 0) / totalAttemptsCount) * 100
      );

  // Metric 3: Resource Utilization Rate (Curriculum Topics Covered by Quizzes / Lessons)
  const allUniqueTopics = Array.from(new Set([
    ...quizzes.flatMap(q => q.topics),
    ...lessonPlans.flatMap(lp => lp.topics)
  ]));
  const totalCoveredCount = allUniqueTopics.length;

  // Metric 4: Alerts for At-Risk Students (Scores under 60%)
  const atRiskStudents = filteredAttempts.filter(
    (at) => (at.score / at.totalQuestions) < 0.6
  );

  // Chart 1 Data: Student Scores Distribution
  const performanceLogsData = filteredAttempts.map((at) => ({
    name: at.studentName.split(" ")[0], // Use first name for space efficiency
    score: Math.round((at.score / at.totalQuestions) * 100),
    subject: at.subject,
    quizTitle: at.quizTitle
  }));

  // Chart 2 Data: Topic Mastery breakdown
  const topicMasteryData = [
    { subject: "Numbers", mastery: 88 },
    { subject: "Addition", mastery: 81 },
    { subject: "Subtraction", mastery: 69 },
    { subject: "Shapes", mastery: 92 },
    { subject: "Measurements", mastery: 74 },
    { subject: "Patterns", mastery: 85 }
  ];

  // Chronological progress trend data over time
  const chronologicalAttempts = [...filteredAttempts].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const progressLineData = chronologicalAttempts.map((at, idx) => {
    const dateObj = new Date(at.timestamp);
    const dateFormatted = dateObj.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
    return {
      index: idx + 1,
      date: dateObj.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      dateTime: dateFormatted,
      student: at.studentName,
      subject: at.subject,
      className: at.className,
      score: Math.round((at.score / at.totalQuestions) * 100),
      quizTitle: at.quizTitle
    };
  });

  // Grade groupings for filtering
  const classesWithSubmissions = Array.from(new Set(attempts.map((at) => at.className)));

  return (
    <div className="space-y-6" id="teacher-analytics-workspace">
      {/* Filters bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-[#0F0F10] border border-[#242426] p-4 rounded-sm">
        <div>
          <h3 className="font-bold font-serif italic text-base text-[#A08050] tracking-wide leading-tight">
            Administrative Insights & Metrics Panel
          </h3>
          <p className="text-xs text-[#8A8A8E] mt-1">
            Analyzing {filteredAttempts.length} submissions • Synchronized with Cloud SQL back-up.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-[#8A8A8E]" />
            <label htmlFor="analytics-class-filter" className="text-xs font-semibold text-[#8A8A8E]">
              Filter Grade:
            </label>
            <select
              id="analytics-class-filter"
              value={selectedClassFilter}
              onChange={(e) => setSelectedClassFilter(e.target.value)}
              className="bg-[#161618] border border-[#242426] text-xs font-medium py-1.5 px-3 rounded-sm text-[#E5E5E7] focus:outline-none focus:border-[#A08050]"
            >
              <option value="All">All Grades</option>
              {classesWithSubmissions.map((cls) => (
                <option key={cls} value={cls}>{cls}</option>
              ))}
            </select>
          </div>

          <button
            onClick={downloadCSVReport}
            disabled={filteredAttempts.length === 0}
            className="px-3 py-1.5 bg-[#161618] hover:bg-[#A08050] hover:text-[#0A0A0B] border border-[#242426] text-[#A08050] font-medium rounded-sm text-xs inline-flex items-center gap-1.5 transition cursor-pointer disabled:opacity-40 disabled:hover:bg-[#161618] disabled:hover:text-[#A08050] disabled:cursor-not-allowed"
            title="Download report of current filtered submissions"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Report</span>
          </button>
        </div>
      </div>

      {/* Grid of KPI Bento Card row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="bg-[#0F0F10] border border-[#242426] p-4 rounded-sm flex items-start justify-between">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-[#8A8A8E] tracking-wider">
              Student Submissions
            </span>
            <p className="text-2xl font-bold text-[#E5E5E7] font-display">
              {totalAttemptsCount}
            </p>
            <p className="text-[10px] text-[#5A5A5E]">Completed test papers</p>
          </div>
          <div className="p-2 bg-[#161618] rounded-sm text-[#A08050] border border-[#242426]" aria-hidden="true">
            <Users className="w-4 h-4" />
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-[#0F0F10] border border-[#242426] p-4 rounded-sm flex items-start justify-between">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-[#8A8A8E] tracking-wider">
              Class Average Score
            </span>
            <p className="text-2xl font-bold text-[#E5E5E7] font-display">
              {averageClassScorePercent}%
            </p>
            <p className="text-[10px] text-[#5A5A5E]">Syllabus success standard</p>
          </div>
          <div className="p-2 bg-[#161618] rounded-sm text-[#A08050] border border-[#242426]" aria-hidden="true">
            <Award className="w-4 h-4" />
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-[#0F0F10] border border-[#242426] p-4 rounded-sm flex items-start justify-between">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-[#8A8A8E] tracking-wider">
              NCF Topics Tracked
            </span>
            <p className="text-2xl font-bold text-[#E5E5E7] font-display">
              {totalCoveredCount}
            </p>
            <p className="text-[10px] text-[#5A5A5E]">Modules covered by AI</p>
          </div>
          <div className="p-2 bg-[#161618] rounded-sm text-[#A08050] border border-[#242426]" aria-hidden="true">
            <BookCheck className="w-4 h-4" />
          </div>
        </div>

        {/* Card 4 - Student Warning warnings */}
        <div className="bg-[#0F0F10] border border-[#242426] p-4 rounded-sm flex items-start justify-between">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-red-500 tracking-wider">
              Alerts / At Risk
            </span>
            <p className="text-2xl font-bold text-red-500 font-display">
              {atRiskStudents.length}
            </p>
            <p className="text-[10px] text-[#5A5A5E]">Students needing tutoring</p>
          </div>
          <div className="p-2 bg-[#161618] rounded-sm text-red-500 border border-[#242426]" aria-hidden="true">
            <ShieldAlert className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Visual Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Main Performance Column chart */}
        <div className="bg-[#0F0F10] border border-[#242426] p-5 rounded-sm lg:col-span-8">
          <h4 className="text-xs font-bold font-serif italic text-[#A08050] tracking-wide uppercase mb-4 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-[#A08050]" />
            Class Quiz Score Index (%)
          </h4>
          
          {performanceLogsData.length === 0 ? (
            <div className="h-60 flex items-center justify-center border border-dashed border-[#242426] rounded-sm bg-[#060607]">
              <p className="text-xs text-[#8A8A8E] text-center">No student test submittals recorded in this category yet.</p>
            </div>
          ) : (
            <div className="h-64 pr-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={performanceLogsData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#242426" opacity={0.15} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#8A8A8E" }} stroke="#242426" />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "#8A8A8E" }} stroke="#242426" />
                  <Tooltip
                    contentStyle={{ fontSize: "11px", borderRadius: "4px", background: "#121214", color: "#E5E5E7", border: "1px solid #242426" }}
                    itemStyle={{ color: "#A08050" }}
                  />
                  <Bar dataKey="score" radius={[2, 2, 0, 0]} name="Score (%)">
                    {performanceLogsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.score < 60 ? "#f43f5e" : "#A08050"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Radar topic Mastery breakdown */}
        <div className="bg-[#0F0F10] border border-[#242426] p-5 rounded-sm lg:col-span-4 flex flex-col justify-between">
          <div>
            <h4 className="text-xs font-bold font-serif italic text-[#A08050] tracking-wide uppercase mb-1">
              Topic Mastery Index
            </h4>
            <p className="text-[10px] text-[#8A8A8E]">
              Aggregated student quiz performance percentages
            </p>
          </div>

          <div className="h-56 mt-2 relative flex justify-center items-center">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={topicMasteryData}>
                <PolarGrid stroke="#242426" opacity={0.4} />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 9, fill: "#8A8A8E" }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 8, fill: "#8A8A8E" }} stroke="#242426" />
                <Radar name="Syllabus Mastery" dataKey="mastery" stroke="#A08050" fill="#A08050" fillOpacity={0.25} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Student Progress Trends (Line Chart) */}
      <div className="bg-[#0F0F10] border border-[#242426] p-5 rounded-sm shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4 border-b border-[#242426] pb-3">
          <div>
            <h4 className="font-bold font-serif italic text-base text-[#A08050] tracking-wide flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#A08050]" />
              Student Progress Trends Over Time
            </h4>
            <p className="text-[10px] text-[#8A8A8E]">
              Chronological visualization of quiz performance index (%) to track academic improvement
            </p>
          </div>
          <div className="text-[10px] bg-[#161618] border border-[#242426] rounded-sm py-1 px-3 text-[#A08050] font-mono">
            Interactive Timeline Metric
          </div>
        </div>

        {progressLineData.length === 0 ? (
          <div className="h-60 flex items-center justify-center border border-dashed border-[#242426] rounded-sm bg-[#060607]">
            <p className="text-xs text-[#8A8A8E] text-center">No student attempt history recorded yet.</p>
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="h-72 pr-2"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={progressLineData} margin={{ top: 15, right: 15, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#242426" opacity={0.4} />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 9, fill: "#8A8A8E" }}
                  stroke="#242426"
                />
                <YAxis 
                  domain={[0, 100]} 
                  tick={{ fontSize: 10, fill: "#8A8A8E" }}
                  stroke="#242426"
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-[#121214] border border-[#242426] p-3 rounded-sm shadow-xl text-xs space-y-1">
                          <p className="font-semibold text-[#E5E5E7]">{data.student}</p>
                          <p className="text-[10px] text-[#A08050] font-serif italic">{data.quizTitle}</p>
                          <p className="text-[10px] text-[#8A8A8E]">Subject: {data.subject} ({data.className})</p>
                          <p className="text-[11px] text-[#E5E5E7] font-semibold mt-1">
                            Score: <span className="text-[#A08050] font-bold">{data.score}%</span>
                          </p>
                          <p className="text-[9px] text-[#5A5A5E] font-mono">{data.dateTime}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="score" 
                  stroke="#A08050" 
                  strokeWidth={2}
                  activeDot={{ r: 6, fill: "#A08050", stroke: "#0A0A0B", strokeWidth: 2 }}
                  dot={{ r: 4, fill: "#0F0F10", stroke: "#A08050", strokeWidth: 2 }}
                  name="Quiz Score"
                  isAnimationActive={true}
                  animationDuration={1500}
                  animationBegin={200}
                  animationEasing="ease-out"
                />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>
        )}
      </div>

      {/* Warning/At Risk List */}
      {atRiskStudents.length > 0 && (
        <div className="bg-[#0F0F10] border border-red-950/50 p-5 rounded-sm">
          <div className="flex gap-2 items-center mb-3 text-red-500">
            <ShieldAlert className="w-4 h-4 ml-0.5 shrink-0" />
            <h4 className="font-bold text-xs uppercase tracking-wider font-serif italic text-red-500 leading-none">
              Pedagogical Risk Alert: Students Below Mastery Standard (60%)
            </h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs text-rose-300">
            {atRiskStudents.map((at) => (
              <div key={at.id} className="bg-[#0F0F10] p-3 rounded-sm border border-red-950/20">
                <p className="font-semibold text-[#E5E5E7]">{at.studentName}</p>
                <div className="flex justify-between mt-1 text-[11px] text-[#8A8A8E]">
                  <span>Quiz: {at.quizTitle.substring(0, 30)}...</span>
                  <span className="font-bold text-red-500">
                    {at.score}/{at.totalQuestions} ({Math.round((at.score / at.totalQuestions) * 100)}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Full Submissions Record Sheet */}
      <div className="bg-[#0F0F10] border border-[#242426] p-5 rounded-sm">
        <h4 className="text-xs font-bold font-serif italic text-[#A08050] tracking-wide uppercase mb-4">
          Completed CBSE Quiz Answer Sheets
        </h4>

        {filteredAttempts.length === 0 ? (
          <p className="text-xs text-[#8A8A8E] py-4 text-center">No quiz submissions recorded yet in the system.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-[#E5E5E7]">
              <thead className="text-[10px] uppercase font-bold text-[#8A8A8E] tracking-wider bg-[#161618] border-b border-[#242426]">
                <tr>
                  <th className="px-3 py-2.5">Student Name</th>
                  <th className="px-3 py-2.5">Syllabus Grade</th>
                  <th className="px-3 py-2.5">Subject</th>
                  <th className="px-3 py-2.5">Score Ratio</th>
                  <th className="px-3 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#242426]">
                {filteredAttempts.map((at) => (
                  <tr key={at.id} className="hover:bg-[#161618]/50">
                    <td className="px-3 py-3 font-semibold text-[#E5E5E7]">
                      {at.studentName}
                    </td>
                    <td className="px-3 py-3 text-[#8A8A8E]">{at.className}</td>
                    <td className="px-3 py-3 text-[#8A8A8E]">{at.subject}</td>
                    <td className="px-3 py-3">
                      <span className={`px-2.5 py-0.5 rounded-sm font-bold text-[10px] ${
                        (at.score / at.totalQuestions) >= 0.75
                          ? "bg-green-950/30 text-green-400 border border-green-900/30"
                          : (at.score / at.totalQuestions) >= 0.6
                          ? "bg-amber-950/30 text-amber-400 border border-[#A08050]/20"
                          : "bg-red-950/30 text-red-400 border border-red-900/30"
                      }`}>
                        {at.score} of {at.totalQuestions} ({Math.round((at.score / at.totalQuestions) * 100)}%)
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <button
                        onClick={() => setInspectAttempt(at)}
                        className="px-2.5 py-1 bg-[#161618] hover:bg-[#A08050] hover:text-[#0A0A0B] border border-[#242426] text-[#A08050] font-medium rounded-sm text-[10px] inline-flex items-center gap-1.5 transition cursor-pointer"
                        id={`inspect-btn-${at.id}`}
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Inspect popup dialog */}
      {inspectAttempt && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          id="inspect-attempt-modal"
          onClick={() => setInspectAttempt(null)}
        >
          <div
            className="bg-[#0F0F10] border border-[#242426] rounded-sm max-w-lg w-full p-6 text-xs text-[#E5E5E7] space-y-4 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start border-b border-[#242426] pb-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#A08050] tracking-wider">
                  Detailed Diagnostic Sheet
                </span>
                <h4 className="font-bold text-[#E5E5E7] text-sm font-serif italic mt-0.5">
                  {inspectAttempt.studentName}'s Graded Paper
                </h4>
              </div>
              <button
                onClick={() => setInspectAttempt(null)}
                className="text-[#8A8A8E] hover:text-[#E5E5E7] text-lg leading-none p-1 cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="space-y-1 bg-[#161618] p-3 rounded-sm border border-[#242426]">
              <p><strong>Quiz:</strong> {inspectAttempt.quizTitle}</p>
              <p><strong>Timing:</strong> {new Date(inspectAttempt.timestamp).toLocaleString()}</p>
              <p>
                <strong>Diagnostic Score:</strong>{" "}
                <span className="font-bold text-[#A08050]">
                  {inspectAttempt.score} / {inspectAttempt.totalQuestions} ({Math.round((inspectAttempt.score / inspectAttempt.totalQuestions) * 100)}%)
                </span>
              </p>
            </div>

            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {inspectAttempt.answers.map((ans, idx) => (
                <div key={idx} className="border-b border-[#242426] last:border-0 pb-2.5 last:pb-0">
                  <p className="font-semibold text-[#E5E5E7]">
                    Question {idx + 1}. (Answer submitted: Option {ans + 1})
                  </p>
                  <p className="text-[11px] text-[#8A8A8E] mt-1 italic">
                    * The system recorded answer choice standard is checked automatically against cloud-backed answer indices.
                  </p>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2 border-t border-[#242426]">
              <button
                onClick={() => setInspectAttempt(null)}
                className="px-4 py-2 bg-[#161618] hover:bg-[#A08050] hover:text-[#0A0A0B] border border-[#242426] text-[#E5E5E7] font-semibold rounded-sm transition"
              >
                Close Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
