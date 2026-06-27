import type { ModuleSeed } from "./types";

const YOUTUBE_PLACEHOLDER = "https://www.youtube.com/watch?v=Z7dXDfqy0e8";

export const PILLAR_2_MODULES: ModuleSeed[] = [
  {
    module_code: "P6",
    title: "Communication That Builds Real Professional Relationships",
    slug: "communication-professional-relationships",
    pillar: 2,
    unlock_week: 5,
    order_index: 1,
    description:
      "Learn how to communicate in ways that build trust, respect, and lasting professional relationships.",
    estimated_minutes: 45,
    video_url: YOUTUBE_PLACEHOLDER,
    workbook: [
      {
        type: "heading",
        level: 2,
        text: "Communication is career infrastructure",
      },
      {
        type: "paragraph",
        text: "Technical skills get you in the room; communication determines whether people trust you with responsibility. Early-career professionals who write and speak clearly are promoted faster.",
      },
      {
        type: "framework_callout",
        title: "BLUF (Bottom Line Up Front)",
        body: "Lead with the answer, request, or decision. Then provide context. Executives and managers have limited attention — respect it.",
      },
      {
        type: "heading",
        level: 3,
        text: "Professional tone without stiffness",
      },
      {
        type: "paragraph",
        text: "Professional does not mean robotic. It means clear, respectful, and accountable. Avoid slang in formal channels, but warmth and gratitude are appropriate.",
      },
      {
        type: "concept_block",
        title: "Channel awareness",
        body: "Email for documentation and non-urgent requests. Chat for quick coordination. Meetings for decisions and debate. Match the channel to the stakes.",
      },
      {
        type: "framework_callout",
        title: "The 3-Part Update",
        body: "Status: What happened. Blockers: What you need. Next: What happens by when. Use this in standups, emails to managers, and project check-ins.",
      },
      {
        type: "paragraph",
        text: "Practice rewriting one messy message this week using BLUF and the 3-Part Update. Small upgrades compound into a reputation for reliability.",
      },
    ],
    exercises: [
      {
        key: "bluf_rewrite",
        label: "BLUF rewrite",
        instructions:
          "Paste or summarize a recent long message you sent. Rewrite the opening two sentences using BLUF.",
        input_type: "text",
        multiline: true,
      },
      {
        key: "tone_example",
        label: "Tone calibration",
        instructions:
          "Describe one situation where your tone was too casual or too stiff. What would professional-but-human sound like?",
        input_type: "text",
        multiline: true,
      },
      {
        key: "comm_gap",
        label: "Communication gap",
        instructions: "Which communication skill needs the most work for you?",
        input_type: "radio",
        options: [
          "Structuring messages with BLUF",
          "Writing concise updates",
          "Speaking up in meetings",
          "Following up and closing loops",
        ],
      },
      {
        key: "bluf_commitment",
        label: "BLUF commitment",
        instructions:
          "I will use BLUF in my next email or message to a professor, manager, or professional contact.",
        input_type: "checklist",
      },
    ],
    quiz: [
      {
        question: "BLUF means you should...",
        options: [
          { id: "a", label: "Lead with the bottom line or request first" },
          { id: "b", label: "Hide your main point until the end" },
          { id: "c", label: "Write only in bullet points" },
          { id: "d", label: "Avoid all context" },
        ],
        correct_answer: "a",
      },
      {
        question: "The 3-Part Update includes...",
        options: [
          { id: "a", label: "Status, blockers, and next steps" },
          { id: "b", label: "Gossip, complaints, and excuses" },
          { id: "c", label: "Only your weekend plans" },
          { id: "d", label: "A full project history from day one" },
        ],
        correct_answer: "a",
      },
      {
        question: "Professional tone is best described as...",
        options: [
          { id: "a", label: "Clear, respectful, and accountable" },
          { id: "b", label: "Cold and robotic at all times" },
          { id: "c", label: "Identical to texting friends" },
          { id: "d", label: "Avoiding all gratitude" },
        ],
        correct_answer: "a",
      },
      {
        question: "Channel awareness means...",
        options: [
          { id: "a", label: "Matching the medium to the message stakes" },
          { id: "b", label: "Using only social media for work requests" },
          { id: "c", label: "Never documenting decisions in email" },
          { id: "d", label: "Scheduling meetings for every small question" },
        ],
        correct_answer: "a",
      },
      {
        question: "Strong early-career communicators are known for...",
        options: [
          { id: "a", label: "Moving work forward with clarity and follow-through" },
          { id: "b", label: "Using the most jargon possible" },
          { id: "c", label: "Avoiding all written communication" },
          { id: "d", label: "Waiting for others to guess their needs" },
        ],
        correct_answer: "a",
      },
    ],
  },
  {
    module_code: "P7",
    title: "Interview & Review Essentials",
    slug: "interview-review-essentials",
    pillar: 2,
    unlock_week: 5,
    order_index: 2,
    description:
      "Master interview fundamentals, performance reviews, and feedback conversations with structured stories and preparation.",
    estimated_minutes: 44,
    video_url: YOUTUBE_PLACEHOLDER,
    workbook: [
      {
        type: "heading",
        level: 2,
        text: "Stories beat lists of credentials",
      },
      {
        type: "paragraph",
        text: "When someone asks Tell me about yourself, they are not requesting your resume aloud. They want a coherent narrative: who you are becoming, why it matters, and proof you are serious.",
      },
      {
        type: "framework_callout",
        title: "60-Second Pitch Structure",
        body: "Present: Who you are becoming (one line). Past: One proof story. Future: What you are exploring or targeting next. Close: A question or invitation to continue the conversation.",
      },
      {
        type: "heading",
        level: 3,
        text: "Build a story bank",
      },
      {
        type: "paragraph",
        text: "Prepare 4–6 stories for common themes: leadership, problem-solving, teamwork, failure/learning, and initiative. Interviewers and networking contacts reuse the same patterns.",
      },
      {
        type: "concept_block",
        title: "STAR in brief",
        body: "Situation (context in one sentence), Task (your responsibility), Action (what you did), Result (outcome with specificity). Keep stories under 90 seconds spoken.",
      },
      {
        type: "framework_callout",
        title: "Bridge Lines",
        body: "Connect answers back to your direction: That experience is why I am interested in roles where... Practice bridges so you do not sound scattered.",
      },
      {
        type: "paragraph",
        text: "Record yourself once. Notice filler words, pace, and whether your proof story has a clear result. Refine, do not memorize word-for-word.",
      },
    ],
    exercises: [
      {
        key: "elevator_pitch",
        label: "60-second pitch draft",
        instructions: "Write your elevator pitch using Present → Past proof → Future → Close.",
        input_type: "text",
        multiline: true,
      },
      {
        key: "star_story",
        label: "STAR story",
        instructions:
          "Write one STAR story (under 150 words) you can use in interviews or networking.",
        input_type: "text",
        multiline: true,
      },
      {
        key: "story_gap",
        label: "Story bank gap",
        instructions: "Which story type is weakest in your bank right now?",
        input_type: "radio",
        options: [
          "Leadership and influence",
          "Problem-solving with measurable result",
          "Teamwork across difference",
          "Failure, feedback, and growth",
        ],
      },
      {
        key: "pitch_practice",
        label: "Practice commitment",
        instructions:
          "I will deliver my pitch aloud to one person and ask what felt clear vs unclear.",
        input_type: "checklist",
      },
    ],
    quiz: [
      {
        question: "A strong elevator pitch should...",
        options: [
          { id: "a", label: "Connect present identity, proof, and future direction" },
          { id: "b", label: "Recite your entire resume chronologically" },
          { id: "c", label: "Avoid any specific examples" },
          { id: "d", label: "Last at least 10 minutes" },
        ],
        correct_answer: "a",
      },
      {
        question: "STAR stands for...",
        options: [
          { id: "a", label: "Situation, Task, Action, Result" },
          { id: "b", label: "Salary, Title, Application, Rejection" },
          { id: "c", label: "Student, Teacher, Advisor, Recruiter" },
          { id: "d", label: "Start, Talk, Argue, Repeat" },
        ],
        correct_answer: "a",
      },
      {
        question: "Bridge lines help you...",
        options: [
          { id: "a", label: "Tie answers back to your professional direction" },
          { id: "b", label: "Change careers every sentence" },
          { id: "c", label: "Avoid all follow-up questions" },
          { id: "d", label: "Sound unprepared" },
        ],
        correct_answer: "a",
      },
      {
        question: "A story bank should include...",
        options: [
          { id: "a", label: "Multiple themes like leadership and problem-solving" },
          { id: "b", label: "Only unrelated hobbies" },
          { id: "c", label: "Stories with no results" },
          { id: "d", label: "Memorized scripts you never adapt" },
        ],
        correct_answer: "a",
      },
      {
        question: "The best practice method for your pitch is to...",
        options: [
          { id: "a", label: "Record or rehearse aloud and refine for clarity" },
          { id: "b", label: "Never say it until a final interview" },
          { id: "c", label: "Read it monotone from a page" },
          { id: "d", label: "Use as many filler words as possible" },
        ],
        correct_answer: "a",
      },
    ],
  },
  {
    module_code: "P8",
    title: "Social Capital Foundations for Students",
    slug: "social-capital-foundations",
    pillar: 2,
    unlock_week: 7,
    order_index: 1,
    description:
      "Understand social capital — trust, reciprocity, and relationships that open doors before roles are posted.",
    estimated_minutes: 48,
    video_url: YOUTUBE_PLACEHOLDER,
    workbook: [
      {
        type: "heading",
        level: 2,
        text: "Networking is relationship building, not begging",
      },
      {
        type: "paragraph",
        text: "Social capital is the trust and goodwill you earn over time. Students who network with curiosity and generosity access opportunities that never post publicly.",
      },
      {
        type: "framework_callout",
        title: "Give-Ask-Give",
        body: "Lead with value (insight, gratitude, resource). Make a specific, reasonable ask. Close with another give or clear next step. Reciprocity builds lasting ties.",
      },
      {
        type: "heading",
        level: 3,
        text: "Informational conversations done right",
      },
      {
        type: "paragraph",
        text: "A 20-minute chat is not an interview. Prepare 5 thoughtful questions, respect time, send thanks within 24 hours, and stay in touch with updates — not only when you need something.",
      },
      {
        type: "concept_block",
        title: "Weak ties matter",
        body: "Acquaintances and alumni one step removed from your inner circle often surface opportunities. Activate your network with genuine updates, not mass copy-paste messages.",
      },
      {
        type: "framework_callout",
        title: "Connection Map",
        body: "List 15 people: professors, peers, alumni, family friends, supervisors. Tag each: mentor, sponsor, peer, or dormant tie. Plan one reactivation and one new outreach this week.",
      },
      {
        type: "paragraph",
        text: "Track conversations in a simple spreadsheet: name, date, topic, follow-up due. Professionals notice who closes the loop.",
      },
    ],
    exercises: [
      {
        key: "connection_target",
        label: "Outreach target",
        instructions:
          "Who is one person you will reach out to this week? What is your specific ask or question?",
        input_type: "text",
        multiline: true,
      },
      {
        key: "give_value",
        label: "Value you can give",
        instructions:
          "What can you offer in networking (article, intro, gratitude, project insight) before you ask for help?",
        input_type: "text",
        multiline: true,
      },
      {
        key: "networking_barrier",
        label: "Networking barrier",
        instructions: "What holds you back most in networking?",
        input_type: "radio",
        options: [
          "Fear of bothering people",
          "Not knowing what to say",
          "Feeling like an imposter",
          "Inconsistent follow-up",
        ],
      },
      {
        key: "followup_commitment",
        label: "Follow-up commitment",
        instructions:
          "I will send a thank-you or update within 24 hours after my next professional conversation.",
        input_type: "checklist",
      },
    ],
    quiz: [
      {
        question: "Social capital is best defined as...",
        options: [
          { id: "a", label: "Trust and goodwill built over time" },
          { id: "b", label: "Number of LinkedIn connections only" },
          { id: "c", label: "Avoiding all professional relationships" },
          { id: "d", label: "Sending mass generic messages" },
        ],
        correct_answer: "a",
      },
      {
        question: "Give-Ask-Give encourages you to...",
        options: [
          { id: "a", label: "Lead with value before making a request" },
          { id: "b", label: "Ask for jobs in the first sentence" },
          { id: "c", label: "Never follow up" },
          { id: "d", label: "Only contact people when desperate" },
        ],
        correct_answer: "a",
      },
      {
        question: "Informational interviews should...",
        options: [
          { id: "a", label: "Use prepared questions and respect time limits" },
          { id: "b", label: "Demand a job on the call" },
          { id: "c", label: "Skip thank-you messages" },
          { id: "d", label: "Last two hours without agenda" },
        ],
        correct_answer: "a",
      },
      {
        question: "Weak ties are important because...",
        options: [
          { id: "a", label: "They often bridge you to new opportunities" },
          { id: "b", label: "They should be ignored" },
          { id: "c", label: "They only include close family" },
          { id: "d", label: "They replace all preparation" },
        ],
        correct_answer: "a",
      },
      {
        question: "A Connection Map helps you...",
        options: [
          { id: "a", label: "Prioritize outreach and reactivation strategically" },
          { id: "b", label: "Avoid documenting relationships" },
          { id: "c", label: "Spam everyone weekly" },
          { id: "d", label: "Forget follow-ups intentionally" },
        ],
        correct_answer: "a",
      },
    ],
  },
  {
    module_code: "P9",
    title: "Networking Systems & Relationship Capital",
    slug: "networking-systems-relationship-capital",
    pillar: 2,
    unlock_week: 7,
    order_index: 2,
    description:
      "Build repeatable networking systems that grow relationship capital over time — not one-off outreach bursts.",
    estimated_minutes: 46,
    video_url: YOUTUBE_PLACEHOLDER,
    workbook: [
      {
        type: "heading",
        level: 2,
        text: "Visibility is earned through value",
      },
      {
        type: "paragraph",
        text: "Personal brand is not a logo — it is what people say about you when you are not in the room. Visibility amplifies a story that is already true, not a performance that is fake.",
      },
      {
        type: "framework_callout",
        title: "Brand Voice Triangle",
        body: "Expertise edge: What you know or are learning deeply. Human edge: Values and personality that feel authentic. Proof edge: Evidence you do the work, not only talk about it.",
      },
      {
        type: "heading",
        level: 3,
        text: "Show up where your field gathers",
      },
      {
        type: "paragraph",
        text: "Comment on industry posts, attend one professional event per month, share a concise learning post after projects. Consistency beats viral moments.",
      },
      {
        type: "concept_block",
        title: "Referral-ready",
        body: "When someone can describe you in one line — She is the student who built X and cares about Y — you are referral-ready. Clarity helps advocates help you.",
      },
      {
        type: "framework_callout",
        title: "90-Day Visibility Plan",
        body: "Pick one platform to prioritize, one cadence (weekly/biweekly), and three content themes tied to your direction. Track engagement and conversations started.",
      },
      {
        type: "paragraph",
        text: "Review your last 5 public posts or comments. Do they reinforce your Brand Voice Triangle or dilute it?",
      },
    ],
    exercises: [
      {
        key: "brand_one_liner",
        label: "Referral one-liner",
        instructions:
          "Write one line someone could use to introduce you to an employer or mentor.",
        input_type: "text",
        placeholder: "Meet [Name] — they...",
      },
      {
        key: "visibility_plan",
        label: "90-day visibility action",
        instructions:
          "What is one specific visibility action you will take in the next 30 days?",
        input_type: "text",
        multiline: true,
      },
      {
        key: "brand_edge",
        label: "Strongest brand edge",
        instructions: "Which edge of the Brand Voice Triangle is strongest for you today?",
        input_type: "radio",
        options: [
          "Expertise edge — depth of knowledge",
          "Human edge — values and authenticity",
          "Proof edge — projects and outcomes",
          "All three need development",
        ],
      },
      {
        key: "visibility_commitment",
        label: "Visibility commitment",
        instructions:
          "I will publish or comment thoughtfully at least once this week on my priority platform.",
        input_type: "checklist",
      },
    ],
    quiz: [
      {
        question: "Personal brand in Corporate Academy means...",
        options: [
          { id: "a", label: "What people consistently experience and say about you" },
          { id: "b", label: "A fake persona unrelated to your work" },
          { id: "c", label: "Only your profile photo" },
          { id: "d", label: "Avoiding all public presence" },
        ],
        correct_answer: "a",
      },
      {
        question: "The Brand Voice Triangle includes...",
        options: [
          { id: "a", label: "Expertise, human, and proof edges" },
          { id: "b", label: "Salary, title, and bonus only" },
          { id: "c", label: "Memes, pranks, and controversy" },
          { id: "d", label: "Nothing — brands do not matter" },
        ],
        correct_answer: "a",
      },
      {
        question: "Being referral-ready means...",
        options: [
          { id: "a", label: "Others can describe your value in one clear line" },
          { id: "b", label: "You never tell anyone your direction" },
          { id: "c", label: "You change your story every week" },
          { id: "d", label: "You rely only on anonymous applications" },
        ],
        correct_answer: "a",
      },
      {
        question: "Sustainable visibility focuses on...",
        options: [
          { id: "a", label: "Consistent value over viral stunts" },
          { id: "b", label: "Posting without substance daily" },
          { id: "c", label: "Never attending events" },
          { id: "d", label: "Criticizing employers publicly" },
        ],
        correct_answer: "a",
      },
      {
        question: "A 90-Day Visibility Plan should define...",
        options: [
          { id: "a", label: "Platform, cadence, and content themes" },
          { id: "b", label: "Only your vacation schedule" },
          { id: "c", label: "Random topics unrelated to your field" },
          { id: "d", label: "No metrics or follow-up ever" },
        ],
        correct_answer: "a",
      },
    ],
  },
];
