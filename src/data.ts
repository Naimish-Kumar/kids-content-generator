import { Quiz, LessonPlan, QuizAttempt } from "./types";

export const CBSE_CLASSES = [
  "Class 1",
  "Class 2",
  "Class 3",
  "Class 4",
  "Class 5",
  "Class 6",
  "Class 7",
  "Class 8",
  "Class 9",
  "Class 10",
  "Class 11",
  "Class 12"
];

export const CBSE_SUBJECTS = [
  "Mathematics",
  "Science",
  "English",
  "Social Science"
];

export const CBSE_TOPICS: Record<string, string[]> = {
  "Mathematics": [
    "Numbers 1-100",
    "Addition",
    "Subtraction",
    "Shapes",
    "Measurement",
    "Patterns",
    "Time",
    "Money",
    "Data Handling"
  ],
  "Science": [
    "Plants Nutrition",
    "Animal Adaptations",
    "Weather & Climate",
    "Solar System",
    "Skeletal System",
    "Matter & Energy",
    "Force and Motion",
    "Ecosystems"
  ],
  "English": [
    "Nouns & Pronouns",
    "Command Verbs",
    "Prepositions",
    "Vocabulary Booster",
    "Reading Comprehension",
    "Punctuation rules",
    "Tenses & Auxiliaries"
  ],
  "Social Science": [
    "Ancient Civilizations",
    "Our Environment",
    "Maps & Globes",
    "Indian Constitution",
    "Resources & Minerals",
    "The Revolt of 1857"
  ]
};

// Initial analytical data to simulate historic teacher tracking and progress utilization
export const INITIAL_QUIZZES: Quiz[] = [
  {
    id: "q_demo_1",
    title: "CBSE Standard Term 1 Metric - Addition & Subtraction (Class 1)",
    className: "Class 1",
    subject: "Mathematics",
    topics: ["Addition", "Subtraction"],
    difficulty: "Easy",
    timestamp: "2026-06-11T14:30:00Z",
    synced: true,
    questions: [
      {
        id: "q_dem_1_1",
        question: "Rohan collected 7 blue marbles and 6 red marbles. How many marbles does he have in total?",
        options: ["11 marbles", "12 marbles", "13 marbles", "14 marbles"],
        correctOptionIndex: 2,
        explanation: "Combining sets requires addition: 7 + 6 = 13 total marbles."
      },
      {
        id: "q_dem_1_2",
        question: "Preeti had 15 colored pencils, but she lost 6 during school recess. How many pencils are left with Preeti?",
        options: ["8 pencils", "9 pencils", "10 pencils", "11 pencils"],
        correctOptionIndex: 1,
        explanation: "Taking away items requires subtraction: 15 - 6 = 9 pencils."
      }
    ]
  },
  {
    id: "q_demo_2",
    title: "CBSE Unit Test 2 - Solar System Exploration (Class 5)",
    className: "Class 5",
    subject: "Science",
    topics: ["Solar System"],
    difficulty: "Medium",
    timestamp: "2026-06-10T09:15:00.000Z",
    synced: true,
    questions: [
      {
        id: "q_dem_2_1",
        question: "Which planet in our solar system is standardly designated as the 'Red Planet' due to iron-oxide rich dust?",
        options: ["Venus", "Mars", "Saturn", "Jupiter"],
        correctOptionIndex: 1,
        explanation: "Mars is famous for its dusty iron oxide atmosphere which presents a reddish visual hue."
      }
    ]
  }
];

export const INITIAL_ATTEMPTS: QuizAttempt[] = [
  {
    id: "at_1",
    quizId: "q_demo_1",
    quizTitle: "CBSE Standard Term 1 Metric - Addition & Subtraction (Class 1)",
    className: "Class 1",
    subject: "Mathematics",
    studentName: "Aditya Sharma",
    score: 2,
    totalQuestions: 2,
    answers: [2, 1],
    timestamp: "2026-06-11T15:05:00Z",
    synced: true
  },
  {
    id: "at_2",
    quizId: "q_demo_1",
    quizTitle: "CBSE Standard Term 1 Metric - Addition & Subtraction (Class 1)",
    className: "Class 1",
    subject: "Mathematics",
    studentName: "Priyanka Patel",
    score: 1,
    totalQuestions: 2,
    answers: [2, 0], // missed the second
    timestamp: "2026-06-11T16:15:00Z",
    synced: true
  },
  {
    id: "at_3",
    quizId: "q_demo_2",
    quizTitle: "CBSE Unit Test 2 - Solar System Exploration (Class 5)",
    className: "Class 5",
    subject: "Science",
    studentName: "Vikram Malhotra",
    score: 0,
    totalQuestions: 1,
    answers: [0], // chose Venus instead of Mars
    timestamp: "2026-06-12T01:45:00Z",
    synced: true
  },
  {
    id: "at_4",
    quizId: "q_demo_1",
    quizTitle: "CBSE Standard Term 1 Metric - Addition & Subtraction (Class 1)",
    className: "Class 1",
    subject: "Mathematics",
    studentName: "Sneha Gupta",
    score: 2,
    totalQuestions: 2,
    answers: [2, 1],
    timestamp: "2026-06-12T02:30:00Z",
    synced: true
  }
];

export const INITIAL_LESSON_PLANS: LessonPlan[] = [
  {
    id: "lp_demo_1",
    title: "CBSE Grade 1 - Introduction to Shapes and Tessellation",
    className: "Class 1",
    subject: "Mathematics",
    topics: ["Shapes"],
    difficulty: "Easy",
    overview: "Pragmatic introduction to basic geometry shapes (Square, Circle, Triangle, Rectangle) focusing on visually distinguishing corners and sides.",
    objectives: [
      "Label basic planar shapes accurately by sight.",
      "Count the number of vertices and straight sides on rectangular blocks."
    ],
    timeline: [
      {
        duration: "10 mins",
        activity: "Tangible Blocks Discovery",
        details: "Distribute safe solid shapes. Have students run their fingers across edges to count sides."
      },
      {
        duration: "20 mins",
        activity: "Board Presentation & Sketching",
        details: "Teacher diagrams shapes clearly on grid paper and notes primary traits."
      }
    ],
    contentSections: [
      {
        heading: "Aesthetic Spatial Traits",
        body: "A circle is smooth and has zero corners, while a rectangle is bordered by 4 perpendicular segments with 4 square corners.",
        tips: "Ensure large tactile blocks are within reach of visually challenged children. Read shape names audibly."
      }
    ],
    evaluation: "Complete localized classroom sketching book exercises on shapes matching.",
    timestamp: "2026-06-11T18:00:00Z",
    synced: true
  }
];
