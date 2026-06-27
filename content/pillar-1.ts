import type { ModuleSeed } from "./types";

const YOUTUBE_PLACEHOLDER = "https://www.youtube.com/watch?v=Z7dXDfqy0e8";

export const PILLAR_1_MODULES: ModuleSeed[] = [
  {
    module_code: "P1",
    title: "Student → Pre-Professional Identity Shift",
    slug: "student-pre-professional-identity-shift",
    pillar: 1,
    unlock_week: 1,
    order_index: 1,
    description:
      "Shift from a student mindset to a pre-professional identity — how you show up, what you signal, and who you are becoming.",
    estimated_minutes: 45,
    video_url: YOUTUBE_PLACEHOLDER,
    workbook: [
      {
        type: "heading",
        level: 2,
        text: "Why identity comes before strategy",
      },
      {
        type: "paragraph",
        text: "Most students jump straight to resumes and applications. High performers build identity first: a clear story about who they are becoming professionally, not just what they want to get.",
      },
      {
        type: "framework_callout",
        title: "The Identity Shift Framework",
        body: "Student Mode asks: What do I need to pass? Pre-Professional Mode asks: What value am I building, and how do others experience me?",
      },
      {
        type: "heading",
        level: 3,
        text: "The three signals you send",
      },
      {
        type: "paragraph",
        text: "Every interaction sends signals about your reliability, curiosity, and professionalism. Classmates, professors, mentors, and recruiters are constantly updating their mental model of you.",
      },
      {
        type: "framework_callout",
        title: "Signal Audit",
        body: "List your last 10 professional touchpoints (emails, meetings, LinkedIn, events). For each, note: Was the signal intentional or accidental? Did it match who you want to become?",
      },
      {
        type: "concept_block",
        title: "Reliability · Curiosity · Professionalism",
        body: "Reliability: you follow through. Curiosity: you ask thoughtful questions. Professionalism: you communicate with clarity and respect. Strengthen one signal this week where you have the biggest gap.",
      },
      {
        type: "paragraph",
        text: "Your goal this module: name the identity you are building, identify gaps between that identity and your current signals, and take one concrete action to close the gap this week.",
      },
    ],
    exercises: [
      {
        key: "identity_statement",
        label: "Professional identity statement",
        instructions:
          "In one sentence, who are you becoming professionally? (Not your major — your direction.)",
        input_type: "text",
        placeholder: "I am becoming a...",
      },
      {
        key: "signal_gap",
        label: "Signal gap reflection",
        instructions:
          "Describe one gap between the identity you want and a signal you sent recently.",
        input_type: "text",
        multiline: true,
        placeholder: "I want to be seen as... but I...",
      },
      {
        key: "mindset_shift",
        label: "Priority mindset shift",
        instructions: "Which shift feels most urgent for you right now?",
        input_type: "radio",
        options: [
          "From passive to proactive outreach",
          "From vague to specific career narrative",
          "From anxious to confident in professional settings",
          "From invisible to visible (online and in person)",
        ],
      },
      {
        key: "action_commitment",
        label: "48-hour action commitment",
        instructions:
          "Commit to one intentional professional action within 48 hours (e.g., update LinkedIn headline, send a thank-you email, schedule a coffee chat).",
        input_type: "checklist",
      },
    ],
    quiz: [
      {
        question: "A pre-professional identity is primarily about...",
        options: [
          { id: "a", label: "Getting the highest GPA" },
          { id: "b", label: "Who you are becoming and the signals you send" },
          { id: "c", label: "Having a perfect resume" },
          { id: "d", label: "Applying to as many jobs as possible" },
        ],
        correct_answer: "b",
      },
      {
        question: "The Identity Shift Framework contrasts...",
        options: [
          { id: "a", label: "Student Mode vs Pre-Professional Mode" },
          { id: "b", label: "Internships vs full-time roles" },
          { id: "c", label: "Technical skills vs soft skills" },
          { id: "d", label: "Online vs in-person networking" },
        ],
        correct_answer: "a",
      },
      {
        question: "A signal audit helps you...",
        options: [
          { id: "a", label: "Compare salaries across industries" },
          { id: "b", label: "See whether your actions match your intended identity" },
          { id: "c", label: "List every job posting in your field" },
          { id: "d", label: "Avoid talking to recruiters" },
        ],
        correct_answer: "b",
      },
      {
        question: "Which is the best example of an intentional professional action?",
        options: [
          { id: "a", label: "Waiting until graduation to update LinkedIn" },
          { id: "b", label: "Sending a thoughtful follow-up after a conversation" },
          { id: "c", label: "Only applying online without outreach" },
          { id: "d", label: "Avoiding feedback on your resume" },
        ],
        correct_answer: "b",
      },
      {
        question: "Completing this module means you should leave with...",
        options: [
          { id: "a", label: "A clearer identity narrative and one concrete next step" },
          { id: "b", label: "A finalized 10-year life plan" },
          { id: "c", label: "Guaranteed job offers" },
          { id: "d", label: "No further reflection needed" },
        ],
        correct_answer: "a",
      },
    ],
  },
  {
    module_code: "P2",
    title: "Purpose & Your Why",
    slug: "purpose-and-your-why",
    pillar: 1,
    unlock_week: 1,
    order_index: 2,
    description:
      "Clarify your professional purpose and articulate a compelling why that anchors your career story.",
    estimated_minutes: 40,
    video_url: YOUTUBE_PLACEHOLDER,
    workbook: [
      {
        type: "heading",
        level: 2,
        text: "Purpose as a career anchor",
      },
      {
        type: "paragraph",
        text: "Purpose is not a lofty mission statement — it is the through-line that makes your choices coherent. When your why is clear, networking, interviews, and daily decisions get easier.",
      },
      {
        type: "framework_callout",
        title: "The Why Stack",
        body: "Layer 1 — Impact: What change do you want to contribute to? Layer 2 — Audience: Who benefits from your work? Layer 3 — Proof: What experiences show you are already moving in this direction?",
      },
      {
        type: "heading",
        level: 3,
        text: "From interests to intentional direction",
      },
      {
        type: "paragraph",
        text: "Students often list interests (finance, tech, healthcare) without connecting them to impact. Employers and mentors listen for specificity: the problem you care about and the context where you want to solve it.",
      },
      {
        type: "concept_block",
        title: "Purpose vs preference",
        body: "Preference: I like marketing. Purpose: I want to help growing brands tell stories that earn customer trust. Purpose statements are outward-facing and evidence-based.",
      },
      {
        type: "framework_callout",
        title: "Evidence Mapping",
        body: "List 3 experiences (courses, projects, jobs, volunteer work). For each, write one sentence on the impact you created or learned to create. Patterns reveal your authentic why.",
      },
      {
        type: "paragraph",
        text: "Your why will evolve — that is normal. The goal is a working draft you can test in conversations this week, not a permanent inscription.",
      },
    ],
    exercises: [
      {
        key: "why_statement",
        label: "Your why statement",
        instructions:
          "Write 2–3 sentences: What impact do you want to have in your first professional role, and for whom?",
        input_type: "text",
        multiline: true,
        placeholder: "I want to... so that...",
      },
      {
        key: "evidence_example",
        label: "Evidence of direction",
        instructions:
          "Describe one project, job, or experience that best supports your why. What did you contribute?",
        input_type: "text",
        multiline: true,
      },
      {
        key: "purpose_clarity",
        label: "Clarity check",
        instructions: "How clear does your professional why feel right now?",
        input_type: "radio",
        options: [
          "Very clear — I can explain it in 30 seconds",
          "Somewhat clear — I need practice articulating it",
          "Still exploring — I have themes but not a crisp statement",
          "Unclear — I am starting from scratch",
        ],
      },
      {
        key: "why_test_commitment",
        label: "Conversation commitment",
        instructions:
          "I will share my why draft with one person (mentor, peer, or professional contact) and ask what sounds compelling vs vague.",
        input_type: "checklist",
      },
    ],
    quiz: [
      {
        question: "In Corporate Academy, professional purpose is best defined as...",
        options: [
          { id: "a", label: "A fixed life mission you cannot change" },
          { id: "b", label: "A through-line connecting impact, audience, and proof" },
          { id: "c", label: "Whatever your parents want you to do" },
          { id: "d", label: "A list of hobbies on your resume" },
        ],
        correct_answer: "b",
      },
      {
        question: "The Why Stack includes all of the following except...",
        options: [
          { id: "a", label: "Impact you want to create" },
          { id: "b", label: "Audience who benefits" },
          { id: "c", label: "Proof from your experiences" },
          { id: "d", label: "Your ideal vacation destination" },
        ],
        correct_answer: "d",
      },
      {
        question: "Evidence mapping helps you...",
        options: [
          { id: "a", label: "Find patterns that support an authentic why" },
          { id: "b", label: "Avoid all self-reflection" },
          { id: "c", label: "Copy another student's purpose statement" },
          { id: "d", label: "Skip networking until graduation" },
        ],
        correct_answer: "a",
      },
      {
        question: "A strong purpose statement is typically...",
        options: [
          { id: "a", label: "Outward-facing and tied to impact" },
          { id: "b", label: "Only about salary goals" },
          { id: "c", label: "As vague as possible to stay flexible" },
          { id: "d", label: "Written once and never updated" },
        ],
        correct_answer: "a",
      },
      {
        question: "The best next step after drafting your why is to...",
        options: [
          { id: "a", label: "Test it in a real conversation and refine" },
          { id: "b", label: "Hide it until you have a job offer" },
          { id: "c", label: "Assume no one will ever ask about it" },
          { id: "d", label: "Replace it with generic buzzwords" },
        ],
        correct_answer: "a",
      },
    ],
  },
  {
    module_code: "P3",
    title: "Confidence & Belonging",
    slug: "confidence-and-belonging",
    pillar: 1,
    unlock_week: 2,
    order_index: 1,
    description:
      "Build authentic confidence in professional spaces, manage imposter feelings, and practice belonging before you have the title.",
    estimated_minutes: 42,
    video_url: YOUTUBE_PLACEHOLDER,
    workbook: [
      {
        type: "heading",
        level: 2,
        text: "Confidence is a skill, not a personality trait",
      },
      {
        type: "paragraph",
        text: "Many high-achieving students feel like outsiders in professional settings — especially first-generation students and those entering industries where few people share their background. Confidence grows through prepared participation, not waiting to feel ready.",
      },
      {
        type: "framework_callout",
        title: "The Belonging Loop",
        body: "Prepare → Participate → Reflect → Adjust. Each cycle builds evidence that you belong. Imposter feelings shrink when you collect proof of competence, not when you wait for permission.",
      },
      {
        type: "heading",
        level: 3,
        text: "Reframe imposter moments",
      },
      {
        type: "paragraph",
        text: "Imposter syndrome is common among students entering competitive fields. It often signals that you care about standards — not that you are unqualified. The goal is to act professionally while you are still learning.",
      },
      {
        type: "concept_block",
        title: "Confidence vs arrogance",
        body: "Confidence: stating what you know, asking what you do not, and following up. Arrogance: performing certainty you cannot support. Professionals respect curiosity paired with preparation.",
      },
      {
        type: "framework_callout",
        title: "Room-Entry Prep",
        body: "Before your next professional interaction, prepare: (1) one question you will ask, (2) one contribution you can make, (3) one follow-up you will send within 24 hours.",
      },
      {
        type: "paragraph",
        text: "Belonging is not given — it is built through consistent, respectful presence. This module helps you design small wins that compound into professional credibility.",
      },
    ],
    exercises: [
      {
        key: "confidence_evidence",
        label: "Evidence inventory",
        instructions:
          "List three moments in the last year where you performed well under pressure (academic, work, or leadership). What did you do?",
        input_type: "text",
        multiline: true,
      },
      {
        key: "imposter_trigger",
        label: "Imposter trigger",
        instructions:
          "When do imposter feelings show up most for you? Describe one recent situation.",
        input_type: "text",
        multiline: true,
      },
      {
        key: "belonging_strategy",
        label: "Belonging strategy",
        instructions: "Which strategy will you prioritize this week?",
        input_type: "radio",
        options: [
          "Prepare one thoughtful question before every meeting",
          "Share a concise win or learning in a professional setting",
          "Follow up within 24 hours after every meaningful conversation",
          "Find one mentor or peer sponsor who normalizes your path",
        ],
      },
      {
        key: "participation_commitment",
        label: "Participation commitment",
        instructions:
          "I will use Room-Entry Prep before my next professional interaction (class guest, career event, or informational chat).",
        input_type: "checklist",
      },
    ],
    quiz: [
      {
        question: "Corporate Academy treats confidence as...",
        options: [
          { id: "a", label: "A fixed personality trait you either have or lack" },
          { id: "b", label: "A skill built through prepare-participate-reflect cycles" },
          { id: "c", label: "Something only extroverts can develop" },
          { id: "d", label: "Irrelevant to career success" },
        ],
        correct_answer: "b",
      },
      {
        question: "The Belonging Loop starts with...",
        options: [
          { id: "a", label: "Waiting until you feel 100% ready" },
          { id: "b", label: "Preparation before participation" },
          { id: "c", label: "Avoiding professional rooms entirely" },
          { id: "d", label: "Comparing yourself to senior executives daily" },
        ],
        correct_answer: "b",
      },
      {
        question: "Room-Entry Prep includes all of the following except...",
        options: [
          { id: "a", label: "One question to ask" },
          { id: "b", label: "One contribution to make" },
          { id: "c", label: "A follow-up within 24 hours" },
          { id: "d", label: "Memorizing your entire career history" },
        ],
        correct_answer: "d",
      },
      {
        question: "Authentic confidence in professional settings looks like...",
        options: [
          { id: "a", label: "Curiosity plus preparation, not fake certainty" },
          { id: "b", label: "Never admitting you are learning" },
          { id: "c", label: "Dominating every conversation" },
          { id: "d", label: "Staying silent to avoid mistakes" },
        ],
        correct_answer: "a",
      },
      {
        question: "A practical antidote to imposter feelings is...",
        options: [
          { id: "a", label: "Collecting evidence of competence through small wins" },
          { id: "b", label: "Withdrawing from all professional events" },
          { id: "c", label: "Pretending you have no questions" },
          { id: "d", label: "Copying others' stories without reflection" },
        ],
        correct_answer: "a",
      },
    ],
  },
  {
    module_code: "P4",
    title: "Student Resume + Early LinkedIn Kit",
    slug: "student-resume-early-linkedin-kit",
    pillar: 1,
    unlock_week: 3,
    order_index: 1,
    description:
      "Translate your identity and purpose into a student resume and LinkedIn profile that signal pre-professional readiness.",
    estimated_minutes: 50,
    video_url: YOUTUBE_PLACEHOLDER,
    workbook: [
      {
        type: "heading",
        level: 2,
        text: "Documents are signals, not autobiographies",
      },
      {
        type: "paragraph",
        text: "Your resume and LinkedIn are not lists of everything you have done — they are curated evidence of the professional you are becoming. Recruiters scan in seconds; clarity beats length.",
      },
      {
        type: "framework_callout",
        title: "Impact Bullet Formula",
        body: "Action verb + what you did + result or scope (numbers when possible). Example: Led 4-person team to redesign campus career site, increasing event sign-ups by 28%.",
      },
      {
        type: "heading",
        level: 3,
        text: "Student resume essentials",
      },
      {
        type: "paragraph",
        text: "One page. Clear sections: Education, Experience, Leadership/Projects, Skills. Lead with relevance to your target direction, not chronological filler.",
      },
      {
        type: "concept_block",
        title: "LinkedIn headline vs about",
        body: "Headline: who you are becoming + direction (not just Student at X University). About: 3–4 sentences connecting your why, proof, and what you are looking for.",
      },
      {
        type: "framework_callout",
        title: "Keyword Alignment",
        body: "Pull 5 keywords from 3 job postings in your target area. Ensure your resume and LinkedIn naturally include those skills or contexts — without keyword stuffing.",
      },
      {
        type: "paragraph",
        text: "Before you finalize, get one review from Career Services or a trusted mentor. Fresh eyes catch gaps you cannot see.",
      },
    ],
    exercises: [
      {
        key: "impact_bullet",
        label: "Impact bullet draft",
        instructions:
          "Write one resume bullet using the Impact Bullet Formula for your strongest experience.",
        input_type: "text",
        multiline: true,
      },
      {
        key: "linkedin_headline",
        label: "LinkedIn headline",
        instructions:
          "Draft a LinkedIn headline (120 characters max) that signals direction, not just student status.",
        input_type: "text",
        placeholder: "Aspiring [role] | [skill/interest] | [University]",
      },
      {
        key: "resume_priority",
        label: "Resume priority",
        instructions: "What is your biggest resume gap right now?",
        input_type: "radio",
        options: [
          "Bullets lack measurable results",
          "Experience section is too thin",
          "Formatting or length issues",
          "Content does not match target roles",
        ],
      },
      {
        key: "review_commitment",
        label: "Review commitment",
        instructions:
          "I will request feedback on my resume or LinkedIn from one qualified reviewer this week.",
        input_type: "checklist",
      },
    ],
    quiz: [
      {
        question: "A student resume should primarily...",
        options: [
          { id: "a", label: "Curate evidence aligned to your target direction" },
          { id: "b", label: "List every activity since high school" },
          { id: "c", label: "Use dense paragraphs instead of bullets" },
          { id: "d", label: "Avoid numbers and outcomes" },
        ],
        correct_answer: "a",
      },
      {
        question: "The Impact Bullet Formula includes...",
        options: [
          { id: "a", label: "Action verb, what you did, and result or scope" },
          { id: "b", label: "Only your job title and dates" },
          { id: "c", label: "Personal hobbies unrelated to work" },
          { id: "d", label: "Quotes from friends" },
        ],
        correct_answer: "a",
      },
      {
        question: "A strong LinkedIn headline for a student should...",
        options: [
          { id: "a", label: "Signal who you are becoming, not only your school" },
          { id: "b", label: "Say only Student at University" },
          { id: "c", label: "Be left blank" },
          { id: "d", label: "Include unrelated jokes" },
        ],
        correct_answer: "a",
      },
      {
        question: "Keyword alignment means...",
        options: [
          { id: "a", label: "Naturally reflecting skills from target job postings" },
          { id: "b", label: "Copy-pasting entire job descriptions" },
          { id: "c", label: "Ignoring role requirements" },
          { id: "d", label: "Using fonts recruiters cannot read" },
        ],
        correct_answer: "a",
      },
      {
        question: "Before finalizing your resume, you should...",
        options: [
          { id: "a", label: "Get feedback from a qualified reviewer" },
          { id: "b", label: "Never show it to anyone" },
          { id: "c", label: "Submit the first draft immediately" },
          { id: "d", label: "Remove all metrics and outcomes" },
        ],
        correct_answer: "a",
      },
    ],
  },
  {
    module_code: "P5",
    title: "Online Presence & Wins Portfolio",
    slug: "online-presence-wins-portfolio",
    pillar: 1,
    unlock_week: 3,
    order_index: 2,
    description:
      "Build a consistent online presence and a wins portfolio that documents proof of your pre-professional identity.",
    estimated_minutes: 45,
    video_url: YOUTUBE_PLACEHOLDER,
    workbook: [
      {
        type: "heading",
        level: 2,
        text: "Your digital footprint is always on",
      },
      {
        type: "paragraph",
        text: "Recruiters, alumni, and hiring managers will look you up. Your online presence should reinforce the same story as your resume — intentional, professional, and current.",
      },
      {
        type: "framework_callout",
        title: "Presence Consistency Check",
        body: "Audit LinkedIn, email signature, public social profiles, and any portfolio site. Do they tell the same story about your direction? Fix one inconsistency this week.",
      },
      {
        type: "heading",
        level: 3,
        text: "Build a wins portfolio",
      },
      {
        type: "paragraph",
        text: "A wins portfolio is a living document of projects, outcomes, feedback, and artifacts. It fuels interview stories, LinkedIn posts, and networking conversations.",
      },
      {
        type: "concept_block",
        title: "What counts as a win",
        body: "Improved a process, led peers, earned recognition, solved a real problem, learned a tool and applied it, received positive feedback from a supervisor. Small wins compound.",
      },
      {
        type: "framework_callout",
        title: "Win Card Template",
        body: "Situation → Your action → Result → Skill demonstrated. Keep 8–12 win cards ready. Update after every major project or role.",
      },
      {
        type: "paragraph",
        text: "Post strategically on LinkedIn: share learning, celebrate team wins, comment thoughtfully on industry content. Visibility without value feels performative; value with visibility builds brand.",
      },
    ],
    exercises: [
      {
        key: "win_card",
        label: "Win card draft",
        instructions:
          "Create one Win Card using the template (Situation, Action, Result, Skill).",
        input_type: "text",
        multiline: true,
      },
      {
        key: "presence_gap",
        label: "Presence gap",
        instructions:
          "Name one inconsistency between your resume/LinkedIn and how you show up elsewhere online.",
        input_type: "text",
        multiline: true,
      },
      {
        key: "visibility_approach",
        label: "Visibility approach",
        instructions: "Which visibility habit will you adopt this month?",
        input_type: "radio",
        options: [
          "One thoughtful LinkedIn post or comment per week",
          "Update profile photo and banner to professional standard",
          "Share a project artifact or presentation link",
          "Engage with 3 professionals in my target field weekly",
        ],
      },
      {
        key: "portfolio_commitment",
        label: "Portfolio commitment",
        instructions:
          "I will add at least two win cards to my portfolio document this week.",
        input_type: "checklist",
      },
    ],
    quiz: [
      {
        question: "A wins portfolio primarily helps you...",
        options: [
          { id: "a", label: "Store proof for interviews, networking, and LinkedIn" },
          { id: "b", label: "Replace the need for any skills" },
          { id: "c", label: "Avoid updating your resume ever again" },
          { id: "d", label: "Hide your accomplishments from mentors" },
        ],
        correct_answer: "a",
      },
      {
        question: "The Win Card Template includes...",
        options: [
          { id: "a", label: "Situation, action, result, and skill demonstrated" },
          { id: "b", label: "Only your GPA history" },
          { id: "c", label: "Unrelated personal gossip" },
          { id: "d", label: "Salary negotiations only" },
        ],
        correct_answer: "a",
      },
      {
        question: "Presence Consistency Check asks you to...",
        options: [
          { id: "a", label: "Align your digital touchpoints to one career story" },
          { id: "b", label: "Delete all social media permanently" },
          { id: "c", label: "Use different stories on every platform" },
          { id: "d", label: "Ignore LinkedIn until you graduate" },
        ],
        correct_answer: "a",
      },
      {
        question: "Effective LinkedIn visibility for students is...",
        options: [
          { id: "a", label: "Sharing value and learning, not only self-promotion" },
          { id: "b", label: "Posting daily without substance" },
          { id: "c", label: "Never engaging with others' content" },
          { id: "d", label: "Using unprofessional language for attention" },
        ],
        correct_answer: "a",
      },
      {
        question: "A strong online presence should reinforce...",
        options: [
          { id: "a", label: "The same pre-professional identity as your resume" },
          { id: "b", label: "A completely different persona than in person" },
          { id: "c", label: "Nothing — anonymity is best" },
          { id: "d", label: "Only memes and inside jokes" },
        ],
        correct_answer: "a",
      },
    ],
  },
];
