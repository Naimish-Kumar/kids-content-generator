export interface User {
  id: string;
  name: string;
  email: string;
  role: "teacher" | "student";
  avatar: string;
  isAuthenticated: boolean;
  mfaRequired: boolean;
  mfaVerified: boolean;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
}

export interface Quiz {
  id: string;
  title: string;
  className: string;
  subject: string;
  questions: QuizQuestion[];
  topics: string[];
  difficulty: "Easy" | "Medium" | "Hard";
  timestamp: string;
  synced: boolean;
}

export interface LessonTimelineItem {
  duration: string;
  activity: string;
  details: string;
}

export interface LessonContentSection {
  heading: string;
  body: string;
  tips?: string;
}

export interface LessonPlan {
  id: string;
  title: string;
  className: string;
  subject: string;
  topics: string[];
  difficulty: string;
  overview: string;
  objectives: string[];
  timeline: LessonTimelineItem[];
  contentSections: LessonContentSection[];
  evaluation: string;
  timestamp: string;
  synced: boolean;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  quizTitle: string;
  className: string;
  subject: string;
  studentName: string;
  score: number;
  totalQuestions: number;
  answers: number[]; // Index of student answers
  timestamp: string;
  synced: boolean;
}

export interface NotificationItem {
  id: string;
  type: "success" | "warning" | "error" | "info" | "alert";
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

export interface SyncLog {
  id: string;
  action: string;
  status: "success" | "pending" | "error";
  timestamp: string;
  details: string;
}
