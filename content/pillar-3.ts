import type { ModuleSeed } from "./types";

const YOUTUBE_PLACEHOLDER = "https://www.youtube.com/watch?v=Z7dXDfqy0e8";

export const PILLAR_3_MODULES: ModuleSeed[] = [
  {
    module_code: "P10",
    title: "Recruiting Strategy Playbook",
    slug: "recruiting-strategy-playbook",
    pillar: 3,
    unlock_week: 9,
    order_index: 1,
    description:
      "Build a focused recruiting strategy — target roles, employer lists, timelines, and weekly execution habits.",
    estimated_minutes: 48,
    video_url: YOUTUBE_PLACEHOLDER,
    workbook: [
      {
        type: "heading",
        level: 2,
        text: "Strategy before volume",
      },
      {
        type: "paragraph",
        text: "Applying to hundreds of roles without a map burns time and confidence. High performers define target roles, employers, and pathways — then align materials and outreach.",
      },
      {
        type: "framework_callout",
        title: "Opportunity Map",
        body: "Quadrants: Posted roles, referrals, campus pipelines, and hidden market (projects, startups, contract). List 10 employers and which quadrant fits each.",
      },
      {
        type: "heading",
        level: 3,
        text: "Define target roles clearly",
      },
      {
        type: "paragraph",
        text: "A target role is specific enough to tailor a resume: Analyst, Consulting Development Program — not just business jobs. Clarity helps mentors advocate for you.",
      },
      {
        type: "concept_block",
        title: "Must-have vs nice-to-have",
        body: "Separate non-negotiables (location, visa, industry) from preferences (company size, brand). Prevents chasing roles that cannot work.",
      },
      {
        type: "framework_callout",
        title: "Role Scorecard",
        body: "For each target role, score employers on: skills match, growth, culture signals, access (referrals), and timeline. Pursue top 5 deeply, not 50 shallowly.",
      },
      {
        type: "paragraph",
        text: "Update your map monthly. Markets shift; your clarity should evolve with new information from conversations and research.",
      },
    ],
    exercises: [
      {
        key: "target_roles",
        label: "Target roles list",
        instructions:
          "List 2–3 specific target role titles you will pursue in the next 90 days.",
        input_type: "text",
        multiline: true,
      },
      {
        key: "employer_targets",
        label: "Employer targets",
        instructions:
          "Name five employers or organization types on your Opportunity Map and why each fits.",
        input_type: "text",
        multiline: true,
      },
      {
        key: "search_focus",
        label: "Search focus",
        instructions: "Where will you concentrate most of your effort this month?",
        input_type: "radio",
        options: [
          "Posted applications with tailored materials",
          "Referrals and warm introductions",
          "Campus pipelines and career fairs",
          "Hidden market — projects and direct outreach",
        ],
      },
      {
        key: "map_commitment",
        label: "Map commitment",
        instructions:
          "I will complete an Opportunity Map with at least 10 employers and share it with one advisor for feedback.",
        input_type: "checklist",
      },
    ],
    quiz: [
      {
        question: "Opportunity mapping helps you...",
        options: [
          { id: "a", label: "Focus effort on realistic pathways instead of random volume" },
          { id: "b", label: "Apply everywhere without research" },
          { id: "c", label: "Avoid defining any target roles" },
          { id: "d", label: "Ignore referrals completely" },
        ],
        correct_answer: "a",
      },
      {
        question: "The Opportunity Map quadrants include...",
        options: [
          { id: "a", label: "Posted roles, referrals, campus pipelines, hidden market" },
          { id: "b", label: "Only social media trends" },
          { id: "c", label: "Personal vacations" },
          { id: "d", label: "Unrelated coursework only" },
        ],
        correct_answer: "a",
      },
      {
        question: "A target role should be...",
        options: [
          { id: "a", label: "Specific enough to tailor resumes and outreach" },
          { id: "b", label: "Any job anywhere with no criteria" },
          { id: "c", label: "Whatever your friends choose" },
          { id: "d", label: "Secret so mentors cannot help" },
        ],
        correct_answer: "a",
      },
      {
        question: "Must-have vs nice-to-have criteria prevent...",
        options: [
          { id: "a", label: "Chasing roles that cannot work for your situation" },
          { id: "b", label: "All reflection on preferences" },
          { id: "c", label: "Talking to any professionals" },
          { id: "d", label: "Updating your plan over time" },
        ],
        correct_answer: "a",
      },
      {
        question: "A Role Scorecard is used to...",
        options: [
          { id: "a", label: "Prioritize employers you will pursue deeply" },
          { id: "b", label: "Rank friends by popularity" },
          { id: "c", label: "Avoid researching companies" },
          { id: "d", label: "Apply shallowly to 100 companies" },
        ],
        correct_answer: "a",
      },
    ],
  },
  {
    module_code: "P11",
    title: "Internship Momentum & Conversion",
    slug: "internship-momentum-conversion",
    pillar: 3,
    unlock_week: 11,
    order_index: 1,
    description:
      "Turn internships into full-time offers through proactive performance, visibility, and relationship building.",
    estimated_minutes: 50,
    video_url: YOUTUBE_PLACEHOLDER,
    workbook: [
      {
        type: "heading",
        level: 2,
        text: "Interviews are evidence conversations",
      },
      {
        type: "paragraph",
        text: "Interviewers are testing whether your past behavior predicts future performance. Your job is to bring structured proof, not hope they like your major.",
      },
      {
        type: "framework_callout",
        title: "Interview Prep Stack",
        body: "Company: mission, customers, recent news. Role: responsibilities and skills repeated in posting. You: 6 STAR stories mapped to common competencies. Questions: 5 thoughtful asks ready.",
      },
      {
        type: "heading",
        level: 3,
        text: "Behavioral questions decode",
      },
      {
        type: "paragraph",
        text: "Tell me about a time... questions map to competencies: leadership, conflict, initiative, failure, teamwork. Tag each story in your bank so you can retrieve under pressure.",
      },
      {
        type: "concept_block",
        title: "The 2-minute rule",
        body: "Most answers should land under two minutes. Longer answers lose attention. Practice with a timer; cut setup, emphasize action and result.",
      },
      {
        type: "framework_callout",
        title: "Question Bank for Them",
        body: "Ask about success metrics, team culture, onboarding, and growth. Strong questions signal you are evaluating fit, not begging.",
      },
      {
        type: "paragraph",
        text: "Day-before prep: review company page, your scorecard, and three stories. Day-of: arrive early, breathe, listen fully before answering.",
      },
    ],
    exercises: [
      {
        key: "company_research",
        label: "Company research notes",
        instructions:
          "Pick one target employer. Write 3 facts: what they do, who they serve, one recent development.",
        input_type: "text",
        multiline: true,
      },
      {
        key: "story_tagging",
        label: "Story tagging",
        instructions:
          "List two STAR stories and which competency each demonstrates (e.g., leadership, initiative).",
        input_type: "text",
        multiline: true,
      },
      {
        key: "interview_weakness",
        label: "Interview weakness",
        instructions: "What part of interviewing is hardest for you right now?",
        input_type: "radio",
        options: [
          "Structuring answers with STAR",
          "Researching the company",
          "Managing nerves and pace",
          "Asking strong questions at the end",
        ],
      },
      {
        key: "mock_commitment",
        label: "Mock interview commitment",
        instructions:
          "I will complete one mock interview or practice session with a peer, mentor, or career office.",
        input_type: "checklist",
      },
    ],
    quiz: [
      {
        question: "Behavioral interviews primarily assess...",
        options: [
          { id: "a", label: "Whether past behavior predicts future performance" },
          { id: "b", label: "Only your GPA" },
          { id: "c", label: "Pop culture knowledge" },
          { id: "d", label: "How little you prepared" },
        ],
        correct_answer: "a",
      },
      {
        question: "The Interview Prep Stack includes...",
        options: [
          { id: "a", label: "Company research, role fit, stories, and your questions" },
          { id: "b", label: "Only your outfit choice" },
          { id: "c", label: "Ignoring the job description" },
          { id: "d", label: "Memorizing one generic answer" },
        ],
        correct_answer: "a",
      },
      {
        question: "The 2-minute rule suggests...",
        options: [
          { id: "a", label: "Keep most answers concise with clear results" },
          { id: "b", label: "Talk for at least 15 minutes per question" },
          { id: "c", label: "Skip results entirely" },
          { id: "d", label: "Never practice timing" },
        ],
        correct_answer: "a",
      },
      {
        question: "Strong questions for interviewers signal...",
        options: [
          { id: "a", label: "You are evaluating mutual fit seriously" },
          { id: "b", label: "You did not research the role" },
          { id: "c", label: "You only care about salary day one" },
          { id: "d", label: "You want to end the interview immediately" },
        ],
        correct_answer: "a",
      },
      {
        question: "Tagging stories by competency helps you...",
        options: [
          { id: "a", label: "Retrieve the right example under pressure" },
          { id: "b", label: "Avoid all preparation" },
          { id: "c", label: "Use one story for every question" },
          { id: "d", label: "Hide measurable outcomes" },
        ],
        correct_answer: "a",
      },
    ],
  },
  {
    module_code: "P12",
    title: "The First 90-Day Professional Playbook",
    slug: "first-90-day-professional-playbook",
    pillar: 3,
    unlock_week: 12,
    order_index: 1,
    description:
      "Prepare for your first professional role with expectations, relationship building, and a plan for the critical first 90 days.",
    estimated_minutes: 42,
    video_url: YOUTUBE_PLACEHOLDER,
    workbook: [
      {
        type: "heading",
        level: 2,
        text: "Every offer is a package, not a number",
      },
      {
        type: "paragraph",
        text: "Students often fixate on salary alone. Total package includes role scope, learning, manager quality, location, benefits, and trajectory. A slightly lower offer with stronger growth can win long-term.",
      },
      {
        type: "framework_callout",
        title: "Offer Decision Matrix",
        body: "Weight criteria: skills growth, compensation, culture, lifestyle, mission alignment. Score each offer 1–5 with evidence, not vibes.",
      },
      {
        type: "heading",
        level: 3,
        text: "Negotiation basics for early career",
      },
      {
        type: "paragraph",
        text: "Research ranges, ask professionally, and focus on role fit and development when experience is limited. Always get final terms in writing.",
      },
      {
        type: "concept_block",
        title: "BATNA awareness",
        body: "Best Alternative to a Negotiated Agreement — your walk-away option. Strong alternatives give calm confidence; weak alternatives mean accept thoughtfully but quickly learn.",
      },
      {
        type: "framework_callout",
        title: "Questions Before You Sign",
        body: "Who is my manager? What does success look like at 90 days? How are promotions decided? What learning budget exists? Red flags deserve follow-up, not silence.",
      },
      {
        type: "paragraph",
        text: "Discuss big decisions with a mentor who knows your field. Sleep on it unless a true deadline requires same-day response.",
      },
    ],
    exercises: [
      {
        key: "decision_criteria",
        label: "Top decision criteria",
        instructions:
          "Rank your top three criteria for choosing among opportunities (e.g., growth, pay, location).",
        input_type: "text",
        multiline: true,
      },
      {
        key: "offer_scenario",
        label: "Hypothetical comparison",
        instructions:
          "Describe two options you might compare (offers, internships, or grad school vs work) and one tradeoff between them.",
        input_type: "text",
        multiline: true,
      },
      {
        key: "negotiation_readiness",
        label: "Negotiation readiness",
        instructions: "How prepared do you feel to research and discuss compensation professionally?",
        input_type: "radio",
        options: [
          "Prepared — I know ranges and how to ask",
          "Somewhat prepared — need practice scripts",
          "Unprepared — I would accept the first number",
          "Not applicable yet — building foundation now",
        ],
      },
      {
        key: "questions_commitment",
        label: "Questions commitment",
        instructions:
          "I will draft five Questions Before You Sign for my next offer or serious opportunity.",
        input_type: "checklist",
      },
    ],
    quiz: [
      {
        question: "Evaluating an offer as a package means considering...",
        options: [
          { id: "a", label: "Growth, culture, compensation, and lifestyle together" },
          { id: "b", label: "Salary only" },
          { id: "c", label: "Office snack variety only" },
          { id: "d", label: "Ignoring role scope" },
        ],
        correct_answer: "a",
      },
      {
        question: "An Offer Decision Matrix helps you...",
        options: [
          { id: "a", label: "Score options against weighted criteria with evidence" },
          { id: "b", label: "Decide purely on gossip" },
          { id: "c", label: "Avoid all comparison" },
          { id: "d", label: "Choose randomly" },
        ],
        correct_answer: "a",
      },
      {
        question: "BATNA stands for...",
        options: [
          { id: "a", label: "Best Alternative to a Negotiated Agreement" },
          { id: "b", label: "Basic Application Tracking Number Archive" },
          { id: "c", label: "Business Attire Training National Award" },
          { id: "d", label: "Bonus After The Negotiation Arrives" },
        ],
        correct_answer: "a",
      },
      {
        question: "Questions Before You Sign should clarify...",
        options: [
          { id: "a", label: "Manager, success metrics, and growth path" },
          { id: "b", label: "Only cafeteria menus" },
          { id: "c", label: "Nothing — sign immediately" },
          { id: "d", label: "Gossip about coworkers" },
        ],
        correct_answer: "a",
      },
      {
        question: "Early-career negotiation should focus on...",
        options: [
          { id: "a", label: "Professional research, role fit, and written terms" },
          { id: "b", label: "Threats and ultimatums" },
          { id: "c", label: "Ignoring market data" },
          { id: "d", label: "Verbal promises only" },
        ],
        correct_answer: "a",
      },
    ],
  },
  {
    module_code: "P13",
    title: "Opportunity Mapping & Direction Setting",
    slug: "opportunity-mapping-direction-setting",
    pillar: 3,
    unlock_week: 11,
    order_index: 2,
    description:
      "Map your opportunity landscape, define direction, and prioritize pathways instead of spraying applications.",
    estimated_minutes: 44,
    video_url: YOUTUBE_PLACEHOLDER,
    workbook: [
      {
        type: "heading",
        level: 2,
        text: "The first 90 days set your reputation",
      },
      {
        type: "paragraph",
        text: "New professionals are judged quickly on reliability, learning speed, and teamwork. You do not need to know everything — you need to listen, deliver small wins, and communicate proactively.",
      },
      {
        type: "framework_callout",
        title: "90-Day Onboarding Plan",
        body: "Days 1–30: Learn systems, stakeholders, and priorities. Days 31–60: Own small deliverables. Days 61–90: Propose one improvement. Schedule check-ins with your manager biweekly.",
      },
      {
        type: "heading",
        level: 3,
        text: "Professional norms that matter",
      },
      {
        type: "paragraph",
        text: "Be on time, document decisions, admit mistakes early, and thank people who teach you. Ask how success is measured before chasing tasks randomly.",
      },
      {
        type: "concept_block",
        title: "Managing up",
        body: "Managing up means aligning with your manager's priorities, communicating status without being asked, and flagging blockers early with proposed solutions.",
      },
      {
        type: "framework_callout",
        title: "Stakeholder Map",
        body: "List people you depend on and who depends on you. Note communication preferences. Build trust before you need favors.",
      },
      {
        type: "paragraph",
        text: "Find a peer buddy and one informal mentor in the organization. Isolation is a common early-career failure mode.",
      },
    ],
    exercises: [
      {
        key: "ninety_day_goal",
        label: "90-day goal",
        instructions:
          "What is one outcome you want to be known for in your first 90 days in your next role or internship?",
        input_type: "text",
        multiline: true,
      },
      {
        key: "stakeholder_list",
        label: "Stakeholder draft",
        instructions:
          "List three stakeholders you would map in a new role (manager, peer, cross-functional partner) and how you would build trust.",
        input_type: "text",
        multiline: true,
      },
      {
        key: "readiness_gap",
        label: "Readiness gap",
        instructions: "Which workplace readiness area needs the most growth?",
        input_type: "radio",
        options: [
          "Managing up and status communication",
          "Time management and prioritization",
          "Receiving feedback without defensiveness",
          "Building cross-functional relationships",
        ],
      },
      {
        key: "onboarding_commitment",
        label: "Onboarding plan commitment",
        instructions:
          "I will draft a 90-Day Onboarding Plan outline before my next internship or job start date.",
        input_type: "checklist",
      },
    ],
    quiz: [
      {
        question: "The first 90 days primarily shape...",
        options: [
          { id: "a", label: "Your early reputation for reliability and learning" },
          { id: "b", label: "Nothing — performance is judged after years only" },
          { id: "c", label: "Only your vacation balance" },
          { id: "d", label: "Whether you avoid all feedback" },
        ],
        correct_answer: "a",
      },
      {
        question: "A 90-Day Onboarding Plan progresses from...",
        options: [
          { id: "a", label: "Learning → owning deliverables → proposing improvement" },
          { id: "b", label: "Leading the company day one" },
          { id: "c", label: "Avoiding all meetings" },
          { id: "d", label: "Skipping manager check-ins" },
        ],
        correct_answer: "a",
      },
      {
        question: "Managing up means...",
        options: [
          { id: "a", label: "Aligning with manager priorities and communicating proactively" },
          { id: "b", label: "Ignoring your manager's goals" },
          { id: "c", label: "Only doing tasks you enjoy" },
          { id: "d", label: "Hiding blockers until deadlines pass" },
        ],
        correct_answer: "a",
      },
      {
        question: "A Stakeholder Map helps you...",
        options: [
          { id: "a", label: "Build trust with people you work with and depend on" },
          { id: "b", label: "Avoid collaborating entirely" },
          { id: "c", label: "Skip documenting relationships" },
          { id: "d", label: "Work in isolation" },
        ],
        correct_answer: "a",
      },
      {
        question: "When you make a mistake early in a role, you should...",
        options: [
          { id: "a", label: "Admit it early, fix it, and share what you learned" },
          { id: "b", label: "Hide it until it becomes a crisis" },
          { id: "c", label: "Blame others immediately" },
          { id: "d", label: "Quit without conversation" },
        ],
        correct_answer: "a",
      },
    ],
  },
  {
    module_code: "P14",
    title: "Hidden Job Market Strategy",
    slug: "hidden-job-market-strategy",
    pillar: 3,
    unlock_week: 9,
    order_index: 2,
    description:
      "Access unposted roles through referrals, direct outreach, projects, and relationship-driven search strategies.",
    estimated_minutes: 50,
    video_url: YOUTUBE_PLACEHOLDER,
    workbook: [
      {
        type: "heading",
        level: 2,
        text: "Plans fail without accountability",
      },
      {
        type: "paragraph",
        text: "You have built identity, communication, network, and search skills. This module turns insight into a 12-month operating plan you review monthly with a partner or mentor.",
      },
      {
        type: "framework_callout",
        title: "12-Month Career Operating Plan",
        body: "Quarterly themes: Q1 foundation (materials, stories), Q2 visibility (network, events), Q3 acceleration (applications, interviews), Q4 decision and onboarding prep. Each quarter: 3 outcomes, 3 habits, 1 accountability partner.",
      },
      {
        type: "heading",
        level: 3,
        text: "Habits beat motivation",
      },
      {
        type: "paragraph",
        text: "Weekly career habits — outreach, learning, portfolio updates — outperform sporadic bursts before deadlines. Calendar them like classes.",
      },
      {
        type: "concept_block",
        title: "Review rhythm",
        body: "Monthly: score progress on outcomes, adjust targets. Weekly: 30-minute career block. Daily: one micro-action (comment, message, bullet improvement).",
      },
      {
        type: "framework_callout",
        title: "Accountability Partnership",
        body: "Pair with a peer from Corporate Academy. Share goals, review monthly, celebrate wins. External commitment doubles follow-through.",
      },
      {
        type: "paragraph",
        text: "Your plan is a living document. Graduation, market shifts, or new interests mean you update — not abandon — the system.",
      },
    ],
    exercises: [
      {
        key: "quarter_outcomes",
        label: "Next quarter outcomes",
        instructions:
          "Define three measurable outcomes for your next quarter (e.g., applications, conversations, stories ready).",
        input_type: "text",
        multiline: true,
      },
      {
        key: "weekly_habits",
        label: "Weekly career habits",
        instructions:
          "List two weekly habits you will calendar for the next 8 weeks.",
        input_type: "text",
        multiline: true,
      },
      {
        key: "accountability_partner",
        label: "Accountability setup",
        instructions: "How will you set up accountability?",
        input_type: "radio",
        options: [
          "Corporate Academy peer check-in monthly",
          "Mentor review monthly",
          "Career office appointment series",
          "Self-review only with calendar reminders",
        ],
      },
      {
        key: "plan_commitment",
        label: "Plan commitment",
        instructions:
          "I will write my 12-Month Career Operating Plan draft and schedule my first monthly review date.",
        input_type: "checklist",
      },
    ],
    quiz: [
      {
        question: "A 12-Month Career Operating Plan should include...",
        options: [
          { id: "a", label: "Quarterly outcomes, habits, and an accountability partner" },
          { id: "b", label: "Only vague intentions" },
          { id: "c", label: "No review rhythm" },
          { id: "d", label: "Goals you never share" },
        ],
        correct_answer: "a",
      },
      {
        question: "Career progress is most sustainable through...",
        options: [
          { id: "a", label: "Consistent weekly habits on the calendar" },
          { id: "b", label: "Rare all-nighter bursts only" },
          { id: "c", label: "Avoiding all tracking" },
          { id: "d", label: "Waiting for perfect motivation" },
        ],
        correct_answer: "a",
      },
      {
        question: "An Accountability Partnership works best when you...",
        options: [
          { id: "a", label: "Share goals and review progress on a schedule" },
          { id: "b", label: "Never discuss setbacks" },
          { id: "c", label: "Compete destructively" },
          { id: "d", label: "Skip all follow-ups" },
        ],
        correct_answer: "a",
      },
      {
        question: "Monthly review rhythm should...",
        options: [
          { id: "a", label: "Score outcomes and adjust targets with evidence" },
          { id: "b", label: "Ignore all prior goals" },
          { id: "c", label: "Happen only once at graduation" },
          { id: "d", label: "Avoid any metrics" },
        ],
        correct_answer: "a",
      },
      {
        question: "Completing Corporate Academy means you should...",
        options: [
          { id: "a", label: "Maintain a living plan you refine as life changes" },
          { id: "b", label: "Stop all career activity" },
          { id: "c", label: "Never network again" },
          { id: "d", label: "Forget everything from earlier pillars" },
        ],
        correct_answer: "a",
      },
    ],
  },
];
