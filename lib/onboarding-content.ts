export const DIAGNOSTIC_QUESTIONS = [
  {
    key: "career_clarity",
    label: "How clear do you feel about your career direction?",
    type: "choice" as const,
    options: [
      "Very clear — I know my target roles",
      "Somewhat clear — I have themes but need focus",
      "Exploring — I am comparing options",
      "Unclear — I am just starting",
    ],
  },
  {
    key: "networking_comfort",
    label: "How comfortable are you reaching out to professionals?",
    type: "choice" as const,
    options: [
      "Very comfortable",
      "Somewhat comfortable with preparation",
      "Uncomfortable but willing to try",
      "Very uncomfortable — I avoid it",
    ],
  },
  {
    key: "resume_confidence",
    label: "How confident are you in your resume and LinkedIn?",
    type: "choice" as const,
    options: [
      "Ready to share with employers",
      "Good draft — needs polish",
      "Basic — major gaps",
      "Haven't started seriously",
    ],
  },
  {
    key: "interview_readiness",
    label: "How prepared do you feel for interviews?",
    type: "choice" as const,
    options: [
      "I have stories and practice ready",
      "I know the basics but need practice",
      "I would struggle with behavioral questions",
      "I haven't prepared at all",
    ],
  },
  {
    key: "program_expectation",
    label: "What do you most hope to gain from Corporate Academy?",
    type: "text" as const,
    placeholder: "e.g., confidence, networking skills, internship readiness...",
  },
  {
    key: "biggest_barrier",
    label: "What is your biggest barrier to career success right now?",
    type: "text" as const,
    placeholder: "Be honest — this helps us support you.",
  },
  {
    key: "weekly_commitment",
    label: "How many hours per week can you commit to the program?",
    type: "choice" as const,
    options: ["1–2 hours", "3–4 hours", "5+ hours", "It varies week to week"],
  },
];

export const ONBOARDING_STEPS = [
  {
    title: "Welcome to Corporate Academy",
    body: "You're joining a structured program designed to help you build a pre-professional identity, communicate with confidence, and land opportunities that fit your goals.",
  },
  {
    title: "How the program works",
    body: "Content unlocks weekly across three pillars: Identity & Brand, Communication & Relationships, and Opportunity Strategy. Complete videos, workbook exercises, and quizzes to earn XP.",
  },
  {
    title: "How XP and rankings work",
    body: "Earn XP for completing modules, perfect quizzes, on-time work, live sessions, and streaks. Your cohort rank updates automatically — you'll see your position, never other students' scores.",
  },
  {
    title: "Your first module",
    body: "Start with Pillar 1 to shift from student to pre-professional. Your dashboard shows what to do this week. Let's go!",
  },
];
