import type { LiveSessionSeed } from "./types";

const STREAM_PLACEHOLDER = "https://www.youtube.com/live_placeholder";

export const LIVE_SESSIONS: LiveSessionSeed[] = [
  {
    module_code: "LS1",
    title: "Identity Q&A + Purpose Coaching",
    slug: "identity-qa-purpose-coaching",
    pillar: 1,
    unlock_week: 2,
    order_index: 1,
    description:
      "Coaching-based session, not a lecture. Bring your identity audit, your chosen anchors, and a first draft of your why — we work through them live.",
    stream_url: STREAM_PLACEHOLDER,
    is_live_session: true,
  },
  {
    module_code: "LS2",
    title: "Resume + LinkedIn Workshop",
    slug: "resume-linkedin-workshop",
    pillar: 1,
    unlock_week: 4,
    order_index: 1,
    description:
      "Workshop on your actual materials. Submit your resume and LinkedIn beforehand; we fix the highest-impact problems first and leave with a 48-hour cleanup plan.",
    stream_url: STREAM_PLACEHOLDER,
    is_live_session: true,
  },
  {
    module_code: "LS3",
    title: "Communication Lab",
    slug: "communication-lab",
    pillar: 2,
    unlock_week: 6,
    order_index: 1,
    description:
      "Communication lab. Bring two written messages and two STAR stories ready to deliver — you'll run reps and get live feedback.",
    stream_url: STREAM_PLACEHOLDER,
    is_live_session: true,
  },
  {
    module_code: "LS4",
    title: "Warm Networking Lab",
    slug: "warm-networking-lab",
    pillar: 2,
    unlock_week: 8,
    order_index: 1,
    description:
      "Warm networking lab. Identify 10 people and draft 3 outreach messages before the session; we pressure-test them and start a 14-day touchpoint rhythm.",
    stream_url: STREAM_PLACEHOLDER,
    is_live_session: true,
  },
  {
    module_code: "LS5",
    title: "Recruiting Strategy Hot Seat",
    slug: "recruiting-strategy-hot-seat",
    pillar: 3,
    unlock_week: 10,
    order_index: 1,
    description:
      "Recruiting strategy hot seat. Bring your completed Fit Table and a pipeline snapshot; we audit fit and direction live and set a 30-day sprint.",
    stream_url: STREAM_PLACEHOLDER,
    is_live_session: true,
  },
];
