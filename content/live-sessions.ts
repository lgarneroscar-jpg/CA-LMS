import type { LiveSessionSeed } from "./types";

const STREAM_PLACEHOLDER = "https://www.youtube.com/live_placeholder";

export const LIVE_SESSIONS: LiveSessionSeed[] = [
  {
    module_code: "LS1",
    title: "Pillar 1 Completion Live Session",
    slug: "pillar-1-completion-live-session",
    pillar: 1,
    unlock_week: 4,
    order_index: 1,
    description:
      "Live cohort session to synthesize Identity & Brand Building: share identity shifts, wins from P1–P5, and Q&A with facilitators. Come with your elevator pitch draft and one signal audit insight.",
    stream_url: STREAM_PLACEHOLDER,
    is_live_session: true,
  },
  {
    module_code: "LS2",
    title: "Communication Practice Live Session",
    slug: "communication-practice-live-session",
    pillar: 2,
    unlock_week: 6,
    order_index: 1,
    description:
      "Practice executive communication in real time: BLUF updates, 60-second pitches, and peer feedback. Bring one written message and one pitch to refine during breakout practice.",
    stream_url: STREAM_PLACEHOLDER,
    is_live_session: true,
  },
  {
    module_code: "LS3",
    title: "Visibility & Relationships Live Session",
    slug: "visibility-relationships-live-session",
    pillar: 2,
    unlock_week: 8,
    order_index: 1,
    description:
      "Workshop on networking follow-through and visible brand voice. Practice Give-Ask-Give outreach scripts and review LinkedIn presence with accountability partners.",
    stream_url: STREAM_PLACEHOLDER,
    is_live_session: true,
  },
  {
    module_code: "LS4",
    title: "Opportunity Alignment Live Session",
    slug: "opportunity-alignment-live-session",
    pillar: 3,
    unlock_week: 10,
    order_index: 1,
    description:
      "Align your opportunity map, interview stories, and offer criteria with cohort peers and coaches. Leave with three prioritized employers and one mock interview takeaway.",
    stream_url: STREAM_PLACEHOLDER,
    is_live_session: true,
  },
];
