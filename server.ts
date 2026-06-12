import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "15mb" }));

// Lazy initializer for Google GenAI to avoid crashing if key is not configured yet
let aiClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      throw new Error("GEMINI_API_KEY is not configured in Secrets / environment variables.");
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// In-Memory Backup Storage (to simulate our durable database cloud backups)
const databaseBackups: Record<string, {
  userId: string;
  quizzes: any[];
  lessonPlans: any[];
  attempts: any[];
  progress: any;
  updatedAt: string;
}> = {};

// Active Mock OAuth Sessions to mimic OAuth 2.0 Identity Protocol
let activeSessions: Record<string, {
  userId: string;
  name: string;
  email: string;
  avatar: string;
  role: "teacher" | "student";
  mfaEnabled: boolean;
}> = {};

// REST API Endpoints

// 1. Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "healthy", timestamp: new Date().toISOString() });
});

// 2. Generate CBSE Adaptable Quiz
app.post("/api/generate/quiz", async (req, res) => {
  try {
    const { className, subject, questionsCount, difficulty, topics } = req.body;

    if (!className || !subject || !questionsCount || !difficulty || !topics || !topics.length) {
      return res.status(400).json({ error: "Missing required parameters for quiz generation." });
    }

    try {
      const ai = getGenAI();
      const topicStr = topics.join(", ");
      
      const prompt = `Generate a CBSE-aligned quiz for ${className}, Subject: ${subject}.
Classroom Topics to cover: ${topicStr}.
Targeting a Difficulty level of: ${difficulty}.
Total number of questions requested: ${questionsCount}.
Ensure that each question is unique, contains high-fidelity CBSE syllabus relevancy, and provides structured explanations for corrective learning. Include 4 distinct, unambiguous options.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: "You are a professional educational curriculum architect and expert CBSE test designer. Always output quizzes with precise technical explanations and educational feedback suitable for class instruction and practice sheets.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: "A highly descriptive, educational title for the quiz." },
              className: { type: Type.STRING },
              subject: { type: Type.STRING },
              questions: {
                type: Type.ARRAY,
                description: "List of multiple choice quiz questions.",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING, description: "A unique identifier e.g. q1, q2" },
                    question: { type: Type.STRING, description: "The quiz question content." },
                    options: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                      description: "Exactly 4 options."
                    },
                    correctOptionIndex: { type: Type.INTEGER, description: "The 0-based index of the correct answer." },
                    explanation: { type: Type.STRING, description: "Educative, constructive explanation helper about why this is the correct answer." },
                  },
                  required: ["id", "question", "options", "correctOptionIndex", "explanation"],
                }
              }
            },
            required: ["title", "questions"],
          }
        }
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error("Empty response from AI generation system.");
      }
      
      const quizJson = JSON.parse(responseText.trim());
      return res.json({ success: true, method: "AIStream", quiz: quizJson });

    } catch (aiError: any) {
      console.warn("AI generation not configured or failed, serving high-fidelity CBSE curriculum sample:", aiError.message);
      
      // Serve CBSE Curricula matching fallback system to ensure superb user experience offline / when key is absent
      const mockQuizzes: Record<string, any> = {
        "Mathematics": {
          title: `CBSE Grade Standard Assessment - ${subject} (${className})`,
          className: className,
          subject: subject,
          questions: [
            {
              id: "q1",
              question: `If Rohan has 5 apples and his sister gives him 8 more. What is the sum total of apples with Rohan?`,
              options: ["11 apples", "12 apples", "13 apples", "15 apples"],
              correctOptionIndex: 2,
              explanation: "Rohan has 5. He gets 8 more. Addition: 5 + 8 = 13. Addition is cumulative counting."
            },
            {
              id: "q2",
              question: "Identify the dimensional shape that represents a standard box of board games.",
              options: ["Cone", "Cylinder", "Cube/Cuboid", "Sphere"],
              correctOptionIndex: 2,
              explanation: "A box of board games has rectangular faces, which makes it a Cuboid shape."
            },
            {
              id: "q3",
              question: "Choose the standard unit of measurement used to record the general distance between two towns.",
              options: ["Grams", "Litres", "Kilometres", "Centimetres"],
              correctOptionIndex: 2,
              explanation: "Long distances between geographical locations are standardly measured in Kilometres (km)."
            },
            {
              id: "q4",
              question: "Look at the pattern: 2, 4, 6, 8, ___. What number is most logically placed next?",
              options: ["9", "10", "11", "12"],
              correctOptionIndex: 1,
              explanation: "This is a skip-counting pattern by 2. The next arithmetic sum is 8 + 2 = 10."
            },
            {
              id: "q5",
              question: "If a watch shows the minute hand on 12 and hour hand on 9, what time is shown?",
              options: ["9:00", "12:00", "12:09", "3:00"],
              correctOptionIndex: 0,
              explanation: "When the minute hand points to 12, it is the start of the hour. Since the hour hand is on 9, it is exactly 9:00."
            }
          ]
        },
        "Science": {
          title: `CBSE Grade Standard Assessment - ${subject} (${className})`,
          className: className,
          subject: subject,
          questions: [
            {
              id: "q_sci_1",
              question: "Which of the following parts of a plant is primarily responsible for absorbing water and minerals from the soil?",
              options: ["Flower", "Leaf", "Root", "Stem"],
              correctOptionIndex: 2,
              explanation: "Roots anchor the plant securely inside the soil and absorb vital water and dissolved mineral solutes."
            },
            {
              id: "q_sci_2",
              question: "What form of precipitation falls as frozen water droplets due to severe low temperatures in sky-level atmospheres?",
              options: ["Rain", "Snow", "Dew", "Fog"],
              correctOptionIndex: 1,
              explanation: "Snow contains microscopic ice crystals clustered together when water vapor condenses at sub-zero temperatures."
            }
          ]
        },
        "default": {
          title: `CBSE Grade Adaptable Quiz - ${subject} (${className})`,
          className: className,
          subject: subject,
          questions: [
            {
              id: "qd1",
              question: `Review Question: What is the core learning objective for CBSE topics on: ${topics.join(", ")}?`,
              options: ["Creative recollection", "Analytical evaluation", "Practical skill application", "All of the above"],
              correctOptionIndex: 3,
              explanation: "Comprehensive CBSE structures require combined analytical thinking, skills, and memory integration."
            }
          ]
        }
      };

      const selectedMock = mockQuizzes[subject] || mockQuizzes["default"];
      // Truncate or expand mock questions as requested
      const finalQuestions = selectedMock.questions.slice(0, questionsCount);
      const generatedMock = {
        title: selectedMock.title,
        className: selectedMock.className,
        subject: selectedMock.subject,
        questions: finalQuestions.length ? finalQuestions : selectedMock.questions
      };

      return res.json({
        success: true,
        method: "OfflineSample",
        warning: "Operating in backup simulation mode (GEMINI_API_KEY omitted or invalid). Standard offline syllabus served.",
        quiz: generatedMock
      });
    }
  } catch (err: any) {
    console.error("Critical quiz api error:", err);
    res.status(500).json({ error: "Failed to generate CBSE quiz. " + err.message });
  }
});

// 3. Generate Personalized CBSE Lesson Plans
app.post("/api/generate/lesson-plan", async (req, res) => {
  try {
    const { className, subject, topics, difficulty } = req.body;

    if (!className || !subject || !topics || !topics.length) {
      return res.status(400).json({ error: "Missing required curriculum components for Lesson Planning." });
    }

    try {
      const ai = getGenAI();
      const topicStr = topics.join(", ");
      
      const prompt = `Develop a highly structured, premium CBSE Class Lesson Plan for:
Classroom Tier: ${className}
Subject Discipline: ${subject}
Core Syllabus Topics: ${topicStr}
Class Difficulty Level: ${difficulty || "Medium"}.

Plan should span a modular format with a clear summary, objectives, time allocation, lesson timeline, core content, teaching tools, and customized evaluation parameters. Ensure strict alignment with modern pedagogical guidelines and the National Curriculum Framework (NCF).`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: "You are a master teacher mentor, NCF curriculum advisor, and educational designer. You prepare highly accessible, action-oriented, and structured lesson plans featuring concrete activities.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              overview: { type: Type.STRING, description: "Detailed 2-3 sentence overview of this lesson and its pedagogical relevance." },
              objectives: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "List of measurable Bloom's taxonomy behavioral outcomes."
              },
              timeline: {
                type: Type.ARRAY,
                description: "Step-by-step timed timeline schedule.",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    duration: { type: Type.STRING, description: "e.g., '10 minutes', '20 minutes'" },
                    activity: { type: Type.STRING, description: "Activity title e.g. Introduction, Guided Practice" },
                    details: { type: Type.STRING, description: "What the teacher does vs what the students do." }
                  },
                  required: ["duration", "activity", "details"]
                }
              },
              contentSections: {
                type: Type.ARRAY,
                description: "Deep dive sections explaining subject content.",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    heading: { type: Type.STRING },
                    body: { type: Type.STRING, description: "Detailed textual explanation, rules, or formulas." },
                    tips: { type: Type.STRING, description: "Aesthetic pedagogy tip or accessibility guideline for WCAG integration in class." }
                  },
                  required: ["heading", "body"]
                }
              },
              evaluation: { type: Type.STRING, description: "Recommended homework, exit ticket, or assessment rules." }
            },
            required: ["title", "overview", "objectives", "timeline", "contentSections", "evaluation"]
          }
        }
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error("No response generated for lesson plan.");
      }

      const planJson = JSON.parse(responseText.trim());
      return res.json({ success: true, method: "AIStream", lessonPlan: planJson });

    } catch (aiError: any) {
      console.warn("AI lesson planner failed/unconfigured, preparing elegant fallback syllabus:", aiError.message);
      
      const topicStr = topics.join(", ");
      const fallbackPlan = {
        title: `NCF-Aligned CBSE Lesson Plan Checklist: ${subject} (${className})`,
        overview: `A structured pedagogical guideline designed to introduce students to the key CBSE guidelines on ${topicStr}. Emphasizes building spatial understanding and step-wise inquiry.`,
        objectives: [
          `Recall basic classifications and primary rules of ${topicStr}.`,
          `Employ visual representations or mathematical models to solve graded tasks.`,
          `Apply modern real-world problem-solving methodologies under guided supervision.`
        ],
        timeline: [
          {
            duration: "10 Minutes",
            activity: "Curiosity Warmpup & Daily Checkin",
            details: "Display concrete props (e.g. shapes, clocks, or materials depending on subject). Direct a brainstorming question toward students."
          },
          {
            duration: "25 Minutes",
            activity: "Guided Conceptual Exploration",
            details: "Unpack core concepts on board. Deliver structured rules, step-by-step procedures, and standard CBSE guidelines."
          },
          {
            duration: "15 Minutes",
            activity: "Peer Collaboration Board Challenge",
            details: "Divide classrooms into small working groups. Distribute practice questions. Provide instant corrective feedback."
          },
          {
            duration: "10 Minutes",
            activity: "Reflective Exit Ticket Assessment",
            details: "Collect quick cards capturing key lessons of the day. Consolidate notes for next lesson prep."
          }
        ],
        contentSections: [
          {
            heading: `Primary Analysis: ${topics[0] || "Foundations"}`,
            body: `Understanding the essential core rules governing this topic. Under CBSE guidance, students learn through interactive visual aids, active listening, and simple diagnostic exercises.`,
            tips: "Ensure large fonts are projected on screens. Provide alternative textual physical descriptions for tactile/visual aid access (WCAG standard)."
          }
        ],
        evaluation: "Provide a 5-question multi-choice check-up. Assign a creative homework challenge that links the syllabus concept to domestic/household elements (e.g., measuring objects in the pantry)."
      };

      return res.json({
        success: true,
        method: "OfflineSample",
        warning: "Using local core curriculum scheduler (Backup). GEMINI_API_KEY is inactive.",
        lessonPlan: fallbackPlan
      });
    }
  } catch (err: any) {
    console.error("Lesson Plan generator error:", err);
    res.status(500).json({ error: "Failed to construct the CBSE NCF Lesson Plan. " + err.message });
  }
});

// 3b. Refine and Adjust CBSE Lesson Plan for inclusive support styles
app.post("/api/refine/lesson-plan", async (req, res) => {
  try {
    const { lessonPlan, refinementType, customNotes } = req.body;

    if (!lessonPlan || !refinementType) {
      return res.status(400).json({ error: "Missing required parameters for lesson plan refinement." });
    }

    try {
      const ai = getGenAI();
      const prompt = `Adapt and refine the following CBSE Lesson Plan to better accommodate students with this specific learning difficulty or sensory need: "${refinementType}".
${customNotes ? `Teacher's custom instruction context: "${customNotes}"` : ""}

Original Lesson Plan details to adjust:
- Title: ${lessonPlan.title}
- Overview: ${lessonPlan.overview}
- Objectives: ${JSON.stringify(lessonPlan.objectives)}
- Timeline: ${JSON.stringify(lessonPlan.timeline)}
- Content Sections: ${JSON.stringify(lessonPlan.contentSections)}
- Evaluation: ${lessonPlan.evaluation}

Your task:
Modify the description and details to specialized learning support styles for inclusive classrooms.
1. Overview should explicitly declare the inclusion adjustment.
2. Timeline activities should incorporate accommodations matching "${refinementType}" (e.g. peer pairings, simplified audio/visual, tactile tasks, extra breaks).
3. The content sections tips MUST be updated with extremely precise specific CBSE and WCAG guidelines for this accommodation.
4. Keep the JSON keys and types identical so it can be parsed client-side. Return valid JSON only.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: "You are an expert CBSE inclusive education specialist, NCF curriculum consultant, and accessibility director. You rewrite lesson content to accommodate student diversity while maintaining absolute academic rigor.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              overview: { type: Type.STRING, description: "Declarative inclusion adjusted overview." },
              objectives: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Measurable adjusted behavioral outcomes."
              },
              timeline: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    duration: { type: Type.STRING },
                    activity: { type: Type.STRING },
                    details: { type: Type.STRING, description: "Adjusted activities for inclusion." }
                  },
                  required: ["duration", "activity", "details"]
                }
              },
              contentSections: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    heading: { type: Type.STRING },
                    body: { type: Type.STRING },
                    tips: { type: Type.STRING, description: "Highly specific inclusion or sensory tip." }
                  },
                  required: ["heading", "body"]
                }
              },
              evaluation: { type: Type.STRING, description: "Adjusted assessment guidelines." }
            },
            required: ["title", "overview", "objectives", "timeline", "contentSections", "evaluation"]
          }
        }
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error("No response generated for lesson space refinement.");
      }

      const planJson = JSON.parse(responseText.trim());
      return res.json({ success: true, method: "AIStream", lessonPlan: planJson });

    } catch (aiError: any) {
      console.warn("AI lesson refinement failed/unconfigured, preparing offline static adjustment simulation:", aiError.message);
      
      // Standalone inclusive adjustment fallbacks to guarantee offline responsiveness and great error grace
      const refinedPlan = {
        title: `${lessonPlan.title} (Support: ${refinementType})`,
        overview: `${lessonPlan.overview} Adjusted to implement smart adaptations supporting ${refinementType}. Emphasizes peer collaborations, multi-sensory materials, and clear structures.`,
        objectives: [
          ...lessonPlan.objectives.slice(0, 2),
          `Demonstrate capability within an inclusive peer environment utilizing customized supports for ${refinementType}.`
        ],
        timeline: lessonPlan.timeline.map((item: any) => ({
          ...item,
          details: `${item.details} (Adaptation for ${refinementType}: Deliver through short, tactile sensory modules and companion worksheets.)`
        })),
        contentSections: lessonPlan.contentSections.map((sec: any) => ({
          ...sec,
          tips: `Inclusion Guidance for ${refinementType}: Offer step-by-step diagnostic workflows. Use simple dyslexia-friendly typography spacing or tactile visual objects to maintain absolute focus and classroom access.`
        })),
        evaluation: `${lessonPlan.evaluation} Plus, provide extra evaluation time and options for simplified language translation under standard CBSE guidelines.`
      };

      return res.json({
        success: true,
        method: "OfflineSample",
        warning: `A backup adaptation was applied for "${refinementType}" successfully.`,
        lessonPlan: refinedPlan
      });
    }
  } catch (err: any) {
    console.error("Lesson Plan refinement api error:", err);
    res.status(500).json({ error: "Failed to adapt inclusive lesson plan. " + err.message });
  }
});

// 3c. AI-Driven Student Portal Suggested Topics Remedial Diagnostics
app.post("/api/recommend/topics", async (req, res) => {
  try {
    const { attempts, quizzes } = req.body;

    if (!quizzes) {
      return res.status(400).json({ error: "Quizzes list is required for recommendation parsing." });
    }

    const safeAttempts = attempts || [];

    try {
      const ai = getGenAI();
      const prompt = `Based on the student's previous quiz attempts and performance records, conduct a pedagogical diagnostics check to identify learning gaps or low-performing standards. Recommending 2 to 3 tailored quiz topics.

Previous Attempt History:
${JSON.stringify(safeAttempts)}

All Available CBSE Quizzes in Savant Engine:
${JSON.stringify(quizzes)}

For each topic suggestion return:
1. "topic": Precise topic name (preferably from topics of available quizzes).
2. "subject": Core subject name.
3. "reason": Constructive, encouraging description highlighting their score and specific topic gap (e.g. "Your score of 0% on Mars signals a need to review inner planets classification.").
4. "remedialAction": Detailed actionable study tip.
5. "difficulty": Recommended study difficulty level ("Easy", "Medium", "Hard").
6. "matchingQuizId": The id of an existing quiz if there is a direct match, empty string if not.
7. "matchingQuizTitle": The title of an existing quiz if matches, else empty string.

Only return valid JSON conforming to the schema.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: "You are a professional CBSE Student Counselor, NCF Remedial Tutor, and CBSE diagnostic analyst. You deliver positive, high-clarity remedial review guides mapping questions to specific NCERT textbook competencies.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              recommendedTopics: {
                type: Type.ARRAY,
                description: "List of recommended topics.",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    topic: { type: Type.STRING },
                    subject: { type: Type.STRING },
                    reason: { type: Type.STRING },
                    remedialAction: { type: Type.STRING },
                    difficulty: { type: Type.STRING },
                    matchingQuizId: { type: Type.STRING },
                    matchingQuizTitle: { type: Type.STRING }
                  },
                  required: ["topic", "subject", "reason", "remedialAction", "difficulty", "matchingQuizId", "matchingQuizTitle"]
                }
              }
            },
            required: ["recommendedTopics"]
          }
        }
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error("No suggestion text received from Gemini diagnostics.");
      }

      const parsedJSON = JSON.parse(responseText.trim());
      return res.json({ success: true, method: "AIStream", recommendedTopics: parsedJSON.recommendedTopics });

    } catch (aiError: any) {
      console.warn("AI diagnostic recommendations not available, falling back to local heuristic mapping:", aiError.message);
      
      const recommendedTopics: any[] = [];
      const lowRangeAttempts = safeAttempts.filter((at: any) => (at.score / at.totalQuestions) < 0.7);

      if (lowRangeAttempts.length === 0) {
        // Find quizzes that haven't been successfully solved or completed yet
        const completedQuizIds = new Set(safeAttempts.map((at: any) => at.quizId));
        const unattemptedQuizzes = quizzes.filter((q: any) => !completedQuizIds.has(q.id));
        const sourceQuizzes = unattemptedQuizzes.length > 0 ? unattemptedQuizzes : quizzes;

        sourceQuizzes.slice(0, 2).forEach((quiz: any) => {
          recommendedTopics.push({
            topic: quiz.topics[0] || "General Review",
            subject: quiz.subject,
            reason: "This lesson is recommended as a standard unit for your grade level to build progressive academic mastery.",
            remedialAction: `Study basic definitions of ${quiz.topics.join(" & ")}. Download accompanying CBSE sample sheets and test yourself on this quiz!`,
            difficulty: quiz.difficulty,
            matchingQuizId: quiz.id,
            matchingQuizTitle: quiz.title
          });
        });
      } else {
        // Map low performing scores to key remedial topics
        lowRangeAttempts.slice(0, 2).forEach((at: any) => {
          const percent = Math.round((at.score / at.totalQuestions) * 105);
          const matchedQuiz = quizzes.find((q: any) => q.id === at.quizId);
          const topicVal = matchedQuiz?.topics?.[0] || "Core Concepts";

          recommendedTopics.push({
            topic: topicVal,
            subject: at.subject,
            reason: `In your previous assessment for "${at.quizTitle}", you scored ${percent}% (${at.score}/${at.totalQuestions}), showing room to build strength.`,
            remedialAction: `Read NCERT study tips on "${topicVal}". Retry standard exercises under relaxed timers to steady your core response accuracy.`,
            difficulty: "Easy",
            matchingQuizId: at.quizId,
            matchingQuizTitle: at.quizTitle
          });
        });
      }

      return res.json({
        success: true,
        method: "OfflineAlgorithmic",
        warning: "A local curriculum gap diagnostic was completed.",
        recommendedTopics: recommendedTopics
      });
    }
  } catch (err: any) {
    console.error("Suggested topics route overall error:", err);
    res.status(500).json({ error: "Failed to construct suggested topics list. " + err.message });
  }
});

// Institutional Collaboration Structures and Endpoints
interface SharedItem {
  id: string;
  type: "quiz" | "lessonPlan";
  sharedBy: string;
  sharedByEmail: string;
  institution: string;
  timestamp: string;
  payload: any;
}

// In-Memory Shared items repository mapped to standard CBSE curriculum styles
const sharedRepository: Record<string, SharedItem> = {
  "shared_demo_lp_1": {
    id: "shared_demo_lp_1",
    type: "lessonPlan",
    sharedBy: "Dr. Anjali Sen",
    sharedByEmail: "anjali.sen@savant.edu.in",
    institution: "Savant Central School",
    timestamp: "2026-06-11T09:15:00Z",
    payload: {
      id: "sh_lp_1",
      title: "Interactive Plant Nutrition & Photosynthesis Labs",
      className: "Class 7",
      subject: "Science",
      topics: ["Plants Nutrition"],
      difficulty: "Medium",
      overview: "An inquiry-based framework focusing on autotrophic nutrition, stomata functionality, and photosynthesis chromatography. Extensively checked against NCERT mandates.",
      objectives: [
        "Contrast autotrophic and heterotrophic modes of plant nutrition.",
        "Demonstrate light requirement for starch formation.",
        "Label cell stomata structures accurately."
      ],
      timeline: [
        { duration: "10 mins", activity: "Stomata visual exploration", details: "Using green leaf peels under microscopes with peer support." },
        { duration: "25 mins", activity: "Photosynthesis Starch Experiment", details: "Perform iodine test; verify chlorophyll extraction with hot water precautions." },
        { duration: "15 mins", activity: "Formative Starch Review Quiz", details: "Short diagnosis mapping chemical reactivities." }
      ],
      contentSections: [
        {
          heading: "Mode of Nutrition in Plants",
          body: "Plants prepare food using water, carbon dioxide and minerals in their immediate surroundings.",
          tips: "Inclusion tip: Use tactile leaf models for visually impaired students."
        }
      ],
      evaluation: "Short diagrammatic workbook queries and live quiz reviews supporting formative assessment guidelines.",
      timestamp: "2026-06-11T09:15:00Z",
      synced: true
    }
  },
  "shared_demo_q_1": {
    id: "shared_demo_q_1",
    type: "quiz",
    sharedBy: "Prof. K. Subramanian",
    sharedByEmail: "subramanian.k@savant.edu.in",
    institution: "Savant Central School",
    timestamp: "2026-06-12T02:10:00Z",
    payload: {
      id: "sh_q_1",
      title: "NCERT Unit 1: Indian Constitution & Civic Preamble (Class 8 Test)",
      className: "Class 8",
      subject: "Social Science",
      topics: ["Indian Constitution"],
      difficulty: "Hard",
      timestamp: "2026-06-12T02:10:00Z",
      synced: true,
      questions: [
        {
          id: "sq_1_1",
          question: "Which organ of the state is primarily responsible for resolving disputes and interpreting the Constitution?",
          options: ["The Legislature", "The Executive", "The Judiciary", "The Election Commission"],
          correctOptionIndex: 2,
          explanation: "In India, the Judiciary holds the power of constitutional interpretation and federal dispute resolution under basic structure rules."
        },
        {
          id: "sq_1_2",
          question: "Which of the following is considered the 'soul' or cornerstone of the Indian Constitution?",
          options: ["Directive Principles of State Policy", "Fundamental Rights", "The Preamble", "Fundamental Duties"],
          correctOptionIndex: 2,
          explanation: "The Preamble outlines the core values of justice, liberty, and equality, widely honored as the democratic cornerstone of the text."
        }
      ]
    }
  }
};

// POST share curriculum item to collaboration database
app.post("/api/collaboration/share", (req, res) => {
  const { type, sharedBy, sharedByEmail, institution, payload } = req.body;

  if (!type || !sharedBy || !payload) {
    return res.status(400).json({ error: "Missing type, author, or curriculum payload for sharing." });
  }

  const sharedId = `shared_${Date.now()}`;
  const sharedItem: SharedItem = {
    id: sharedId,
    type,
    sharedBy,
    sharedByEmail: sharedByEmail || "colleague@savant.edu.in",
    institution: institution || "Savant Central School",
    timestamp: new Date().toISOString(),
    payload
  };

  sharedRepository[sharedId] = sharedItem;

  return res.json({
    success: true,
    message: `${type === "quiz" ? "Quiz template" : "Lesson plan"} successfully shared into the institutional collaboration pool.`,
    sharedItem
  });
});

// GET shared repository items in the same institution
app.get("/api/collaboration/shared", (req, res) => {
  const { institution } = req.query;
  const items = Object.values(sharedRepository);
  
  // Filter by institution if specified to stay true to "within the same institution"
  const filteredItems = institution 
    ? items.filter(item => item.institution.toLowerCase().trim() === (institution as string).toLowerCase().trim())
    : items;

  return res.json({
    success: true,
    sharedItems: filteredItems
  });
});

// 4. Secure Backups (Offline Synchronization System)
app.post("/api/backup/save", (req, res) => {
  const { userId, quizzes, lessonPlans, attempts, progress } = req.body;
  if (!userId) {
    return res.status(400).json({ error: "User ID is required for cloud database synchronization." });
  }

  databaseBackups[userId] = {
    userId,
    quizzes: quizzes || [],
    lessonPlans: lessonPlans || [],
    attempts: attempts || [],
    progress: progress || {},
    updatedAt: new Date().toISOString()
  };

  return res.json({
    success: true,
    message: "Cloud Backup successfully written to secure PostgreSQL simulator storage.",
    timestamp: databaseBackups[userId].updatedAt,
    backupSize: JSON.stringify(databaseBackups[userId]).length
  });
});

app.get("/api/backup/load/:userId", (req, res) => {
  const { userId } = req.params;
  const backup = databaseBackups[userId];
  if (!backup) {
    return res.json({
      success: false,
      message: "No existing cloud backup discovered for this account ID. Initializing blank safe state."
    });
  }

  return res.json({
    success: true,
    backup
  });
});

// Vite Middleware Integration
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[CBSE Content Server] running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
