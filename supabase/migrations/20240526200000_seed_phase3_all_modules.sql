-- Phase 3 full curriculum seed (14 modules + 4 live sessions)

INSERT INTO public.modules (
  module_code, title, slug, pillar, unlock_week, order_index,
  description, video_url, workbook_content, exercises, is_live_session
) VALUES (
  'P1',
  'Student → Pre-Professional Identity Shift',
  'student-pre-professional-identity-shift',
  1,
  1,
  1,
  'Shift from a student mindset to a pre-professional identity — how you show up, what you signal, and who you are becoming.',
  'https://www.youtube.com/watch?v=Z7dXDfqy0e8',
  '{"estimated_minutes":45,"blocks":[{"type":"heading","level":2,"text":"Why identity comes before strategy"},{"type":"paragraph","text":"Most students jump straight to resumes and applications. High performers build identity first: a clear story about who they are becoming professionally, not just what they want to get."},{"type":"framework_callout","title":"The Identity Shift Framework","body":"Student Mode asks: What do I need to pass? Pre-Professional Mode asks: What value am I building, and how do others experience me?"},{"type":"heading","level":3,"text":"The three signals you send"},{"type":"paragraph","text":"Every interaction sends signals about your reliability, curiosity, and professionalism. Classmates, professors, mentors, and recruiters are constantly updating their mental model of you."},{"type":"framework_callout","title":"Signal Audit","body":"List your last 10 professional touchpoints (emails, meetings, LinkedIn, events). For each, note: Was the signal intentional or accidental? Did it match who you want to become?"},{"type":"concept_block","title":"Reliability · Curiosity · Professionalism","body":"Reliability: you follow through. Curiosity: you ask thoughtful questions. Professionalism: you communicate with clarity and respect. Strengthen one signal this week where you have the biggest gap."},{"type":"paragraph","text":"Your goal this module: name the identity you are building, identify gaps between that identity and your current signals, and take one concrete action to close the gap this week."}]}'::jsonb,
  '[{"key":"identity_statement","type":"text","label":"Professional identity statement","instructions":"In one sentence, who are you becoming professionally? (Not your major — your direction.)","placeholder":"I am becoming a..."},{"key":"signal_gap","type":"text","label":"Signal gap reflection","instructions":"Describe one gap between the identity you want and a signal you sent recently.","placeholder":"I want to be seen as... but I...","multiline":true},{"key":"mindset_shift","type":"choice","label":"Priority mindset shift","instructions":"Which shift feels most urgent for you right now?","options":["From passive to proactive outreach","From vague to specific career narrative","From anxious to confident in professional settings","From invisible to visible (online and in person)"]},{"key":"action_commitment","type":"checkbox","label":"48-hour action commitment","instructions":"Commit to one intentional professional action within 48 hours (e.g., update LinkedIn headline, send a thank-you email, schedule a coffee chat)."}]'::jsonb,
  false
)
ON CONFLICT (module_code) DO UPDATE SET
  title = EXCLUDED.title,
  slug = EXCLUDED.slug,
  pillar = EXCLUDED.pillar,
  unlock_week = EXCLUDED.unlock_week,
  order_index = EXCLUDED.order_index,
  description = EXCLUDED.description,
  video_url = EXCLUDED.video_url,
  workbook_content = EXCLUDED.workbook_content,
  exercises = EXCLUDED.exercises,
  is_live_session = EXCLUDED.is_live_session;


DELETE FROM public.quiz_questions
WHERE module_id = (SELECT id FROM public.modules WHERE module_code = 'P1');


INSERT INTO public.quiz_questions (module_id, question, options, correct_answer, order_index)
VALUES (
  (SELECT id FROM public.modules WHERE module_code = 'P1'),
  'A pre-professional identity is primarily about...',
  '[{"id":"a","label":"Getting the highest GPA"},{"id":"b","label":"Who you are becoming and the signals you send"},{"id":"c","label":"Having a perfect resume"},{"id":"d","label":"Applying to as many jobs as possible"}]'::jsonb,
  'b',
  1
);

INSERT INTO public.quiz_questions (module_id, question, options, correct_answer, order_index)
VALUES (
  (SELECT id FROM public.modules WHERE module_code = 'P1'),
  'The Identity Shift Framework contrasts...',
  '[{"id":"a","label":"Student Mode vs Pre-Professional Mode"},{"id":"b","label":"Internships vs full-time roles"},{"id":"c","label":"Technical skills vs soft skills"},{"id":"d","label":"Online vs in-person networking"}]'::jsonb,
  'a',
  2
);

INSERT INTO public.quiz_questions (module_id, question, options, correct_answer, order_index)
VALUES (
  (SELECT id FROM public.modules WHERE module_code = 'P1'),
  'A signal audit helps you...',
  '[{"id":"a","label":"Compare salaries across industries"},{"id":"b","label":"See whether your actions match your intended identity"},{"id":"c","label":"List every job posting in your field"},{"id":"d","label":"Avoid talking to recruiters"}]'::jsonb,
  'b',
  3
);

INSERT INTO public.quiz_questions (module_id, question, options, correct_answer, order_index)
VALUES (
  (SELECT id FROM public.modules WHERE module_code = 'P1'),
  'Which is the best example of an intentional professional action?',
  '[{"id":"a","label":"Waiting until graduation to update LinkedIn"},{"id":"b","label":"Sending a thoughtful follow-up after a conversation"},{"id":"c","label":"Only applying online without outreach"},{"id":"d","label":"Avoiding feedback on your resume"}]'::jsonb,
  'b',
  4
);

INSERT INTO public.quiz_questions (module_id, question, options, correct_answer, order_index)
VALUES (
  (SELECT id FROM public.modules WHERE module_code = 'P1'),
  'Completing this module means you should leave with...',
  '[{"id":"a","label":"A clearer identity narrative and one concrete next step"},{"id":"b","label":"A finalized 10-year life plan"},{"id":"c","label":"Guaranteed job offers"},{"id":"d","label":"No further reflection needed"}]'::jsonb,
  'a',
  5
);

INSERT INTO public.modules (
  module_code, title, slug, pillar, unlock_week, order_index,
  description, video_url, workbook_content, exercises, is_live_session
) VALUES (
  'P2',
  'Purpose & Your Why',
  'purpose-and-your-why',
  1,
  1,
  2,
  'Clarify your professional purpose and articulate a compelling why that anchors your career story.',
  'https://www.youtube.com/watch?v=Z7dXDfqy0e8',
  '{"estimated_minutes":40,"blocks":[{"type":"heading","level":2,"text":"Purpose as a career anchor"},{"type":"paragraph","text":"Purpose is not a lofty mission statement — it is the through-line that makes your choices coherent. When your why is clear, networking, interviews, and daily decisions get easier."},{"type":"framework_callout","title":"The Why Stack","body":"Layer 1 — Impact: What change do you want to contribute to? Layer 2 — Audience: Who benefits from your work? Layer 3 — Proof: What experiences show you are already moving in this direction?"},{"type":"heading","level":3,"text":"From interests to intentional direction"},{"type":"paragraph","text":"Students often list interests (finance, tech, healthcare) without connecting them to impact. Employers and mentors listen for specificity: the problem you care about and the context where you want to solve it."},{"type":"concept_block","title":"Purpose vs preference","body":"Preference: I like marketing. Purpose: I want to help growing brands tell stories that earn customer trust. Purpose statements are outward-facing and evidence-based."},{"type":"framework_callout","title":"Evidence Mapping","body":"List 3 experiences (courses, projects, jobs, volunteer work). For each, write one sentence on the impact you created or learned to create. Patterns reveal your authentic why."},{"type":"paragraph","text":"Your why will evolve — that is normal. The goal is a working draft you can test in conversations this week, not a permanent inscription."}]}'::jsonb,
  '[{"key":"why_statement","type":"text","label":"Your why statement","instructions":"Write 2–3 sentences: What impact do you want to have in your first professional role, and for whom?","placeholder":"I want to... so that...","multiline":true},{"key":"evidence_example","type":"text","label":"Evidence of direction","instructions":"Describe one project, job, or experience that best supports your why. What did you contribute?","multiline":true},{"key":"purpose_clarity","type":"choice","label":"Clarity check","instructions":"How clear does your professional why feel right now?","options":["Very clear — I can explain it in 30 seconds","Somewhat clear — I need practice articulating it","Still exploring — I have themes but not a crisp statement","Unclear — I am starting from scratch"]},{"key":"why_test_commitment","type":"checkbox","label":"Conversation commitment","instructions":"I will share my why draft with one person (mentor, peer, or professional contact) and ask what sounds compelling vs vague."}]'::jsonb,
  false
)
ON CONFLICT (module_code) DO UPDATE SET
  title = EXCLUDED.title,
  slug = EXCLUDED.slug,
  pillar = EXCLUDED.pillar,
  unlock_week = EXCLUDED.unlock_week,
  order_index = EXCLUDED.order_index,
  description = EXCLUDED.description,
  video_url = EXCLUDED.video_url,
  workbook_content = EXCLUDED.workbook_content,
  exercises = EXCLUDED.exercises,
  is_live_session = EXCLUDED.is_live_session;


DELETE FROM public.quiz_questions
WHERE module_id = (SELECT id FROM public.modules WHERE module_code = 'P2');


INSERT INTO public.quiz_questions (module_id, question, options, correct_answer, order_index)
VALUES (
  (SELECT id FROM public.modules WHERE module_code = 'P2'),
  'In Corporate Academy, professional purpose is best defined as...',
  '[{"id":"a","label":"A fixed life mission you cannot change"},{"id":"b","label":"A through-line connecting impact, audience, and proof"},{"id":"c","label":"Whatever your parents want you to do"},{"id":"d","label":"A list of hobbies on your resume"}]'::jsonb,
  'b',
  1
);

INSERT INTO public.quiz_questions (module_id, question, options, correct_answer, order_index)
VALUES (
  (SELECT id FROM public.modules WHERE module_code = 'P2'),
  'The Why Stack includes all of the following except...',
  '[{"id":"a","label":"Impact you want to create"},{"id":"b","label":"Audience who benefits"},{"id":"c","label":"Proof from your experiences"},{"id":"d","label":"Your ideal vacation destination"}]'::jsonb,
  'd',
  2
);

INSERT INTO public.quiz_questions (module_id, question, options, correct_answer, order_index)
VALUES (
  (SELECT id FROM public.modules WHERE module_code = 'P2'),
  'Evidence mapping helps you...',
  '[{"id":"a","label":"Find patterns that support an authentic why"},{"id":"b","label":"Avoid all self-reflection"},{"id":"c","label":"Copy another student''s purpose statement"},{"id":"d","label":"Skip networking until graduation"}]'::jsonb,
  'a',
  3
);

INSERT INTO public.quiz_questions (module_id, question, options, correct_answer, order_index)
VALUES (
  (SELECT id FROM public.modules WHERE module_code = 'P2'),
  'A strong purpose statement is typically...',
  '[{"id":"a","label":"Outward-facing and tied to impact"},{"id":"b","label":"Only about salary goals"},{"id":"c","label":"As vague as possible to stay flexible"},{"id":"d","label":"Written once and never updated"}]'::jsonb,
  'a',
  4
);

INSERT INTO public.quiz_questions (module_id, question, options, correct_answer, order_index)
VALUES (
  (SELECT id FROM public.modules WHERE module_code = 'P2'),
  'The best next step after drafting your why is to...',
  '[{"id":"a","label":"Test it in a real conversation and refine"},{"id":"b","label":"Hide it until you have a job offer"},{"id":"c","label":"Assume no one will ever ask about it"},{"id":"d","label":"Replace it with generic buzzwords"}]'::jsonb,
  'a',
  5
);

INSERT INTO public.modules (
  module_code, title, slug, pillar, unlock_week, order_index,
  description, video_url, workbook_content, exercises, is_live_session
) VALUES (
  'P3',
  'Confidence & Belonging',
  'confidence-and-belonging',
  1,
  2,
  1,
  'Build authentic confidence in professional spaces, manage imposter feelings, and practice belonging before you have the title.',
  'https://www.youtube.com/watch?v=Z7dXDfqy0e8',
  '{"estimated_minutes":42,"blocks":[{"type":"heading","level":2,"text":"Confidence is a skill, not a personality trait"},{"type":"paragraph","text":"Many high-achieving students feel like outsiders in professional settings — especially first-generation students and those entering industries where few people share their background. Confidence grows through prepared participation, not waiting to feel ready."},{"type":"framework_callout","title":"The Belonging Loop","body":"Prepare → Participate → Reflect → Adjust. Each cycle builds evidence that you belong. Imposter feelings shrink when you collect proof of competence, not when you wait for permission."},{"type":"heading","level":3,"text":"Reframe imposter moments"},{"type":"paragraph","text":"Imposter syndrome is common among students entering competitive fields. It often signals that you care about standards — not that you are unqualified. The goal is to act professionally while you are still learning."},{"type":"concept_block","title":"Confidence vs arrogance","body":"Confidence: stating what you know, asking what you do not, and following up. Arrogance: performing certainty you cannot support. Professionals respect curiosity paired with preparation."},{"type":"framework_callout","title":"Room-Entry Prep","body":"Before your next professional interaction, prepare: (1) one question you will ask, (2) one contribution you can make, (3) one follow-up you will send within 24 hours."},{"type":"paragraph","text":"Belonging is not given — it is built through consistent, respectful presence. This module helps you design small wins that compound into professional credibility."}]}'::jsonb,
  '[{"key":"confidence_evidence","type":"text","label":"Evidence inventory","instructions":"List three moments in the last year where you performed well under pressure (academic, work, or leadership). What did you do?","multiline":true},{"key":"imposter_trigger","type":"text","label":"Imposter trigger","instructions":"When do imposter feelings show up most for you? Describe one recent situation.","multiline":true},{"key":"belonging_strategy","type":"choice","label":"Belonging strategy","instructions":"Which strategy will you prioritize this week?","options":["Prepare one thoughtful question before every meeting","Share a concise win or learning in a professional setting","Follow up within 24 hours after every meaningful conversation","Find one mentor or peer sponsor who normalizes your path"]},{"key":"participation_commitment","type":"checkbox","label":"Participation commitment","instructions":"I will use Room-Entry Prep before my next professional interaction (class guest, career event, or informational chat)."}]'::jsonb,
  false
)
ON CONFLICT (module_code) DO UPDATE SET
  title = EXCLUDED.title,
  slug = EXCLUDED.slug,
  pillar = EXCLUDED.pillar,
  unlock_week = EXCLUDED.unlock_week,
  order_index = EXCLUDED.order_index,
  description = EXCLUDED.description,
  video_url = EXCLUDED.video_url,
  workbook_content = EXCLUDED.workbook_content,
  exercises = EXCLUDED.exercises,
  is_live_session = EXCLUDED.is_live_session;


DELETE FROM public.quiz_questions
WHERE module_id = (SELECT id FROM public.modules WHERE module_code = 'P3');


INSERT INTO public.quiz_questions (module_id, question, options, correct_answer, order_index)
VALUES (
  (SELECT id FROM public.modules WHERE module_code = 'P3'),
  'Corporate Academy treats confidence as...',
  '[{"id":"a","label":"A fixed personality trait you either have or lack"},{"id":"b","label":"A skill built through prepare-participate-reflect cycles"},{"id":"c","label":"Something only extroverts can develop"},{"id":"d","label":"Irrelevant to career success"}]'::jsonb,
  'b',
  1
);

INSERT INTO public.quiz_questions (module_id, question, options, correct_answer, order_index)
VALUES (
  (SELECT id FROM public.modules WHERE module_code = 'P3'),
  'The Belonging Loop starts with...',
  '[{"id":"a","label":"Waiting until you feel 100% ready"},{"id":"b","label":"Preparation before participation"},{"id":"c","label":"Avoiding professional rooms entirely"},{"id":"d","label":"Comparing yourself to senior executives daily"}]'::jsonb,
  'b',
  2
);

INSERT INTO public.quiz_questions (module_id, question, options, correct_answer, order_index)
VALUES (
  (SELECT id FROM public.modules WHERE module_code = 'P3'),
  'Room-Entry Prep includes all of the following except...',
  '[{"id":"a","label":"One question to ask"},{"id":"b","label":"One contribution to make"},{"id":"c","label":"A follow-up within 24 hours"},{"id":"d","label":"Memorizing your entire career history"}]'::jsonb,
  'd',
  3
);

INSERT INTO public.quiz_questions (module_id, question, options, correct_answer, order_index)
VALUES (
  (SELECT id FROM public.modules WHERE module_code = 'P3'),
  'Authentic confidence in professional settings looks like...',
  '[{"id":"a","label":"Curiosity plus preparation, not fake certainty"},{"id":"b","label":"Never admitting you are learning"},{"id":"c","label":"Dominating every conversation"},{"id":"d","label":"Staying silent to avoid mistakes"}]'::jsonb,
  'a',
  4
);

INSERT INTO public.quiz_questions (module_id, question, options, correct_answer, order_index)
VALUES (
  (SELECT id FROM public.modules WHERE module_code = 'P3'),
  'A practical antidote to imposter feelings is...',
  '[{"id":"a","label":"Collecting evidence of competence through small wins"},{"id":"b","label":"Withdrawing from all professional events"},{"id":"c","label":"Pretending you have no questions"},{"id":"d","label":"Copying others'' stories without reflection"}]'::jsonb,
  'a',
  5
);

INSERT INTO public.modules (
  module_code, title, slug, pillar, unlock_week, order_index,
  description, video_url, workbook_content, exercises, is_live_session
) VALUES (
  'P4',
  'Student Resume + Early LinkedIn Kit',
  'student-resume-early-linkedin-kit',
  1,
  3,
  1,
  'Translate your identity and purpose into a student resume and LinkedIn profile that signal pre-professional readiness.',
  'https://www.youtube.com/watch?v=Z7dXDfqy0e8',
  '{"estimated_minutes":50,"blocks":[{"type":"heading","level":2,"text":"Documents are signals, not autobiographies"},{"type":"paragraph","text":"Your resume and LinkedIn are not lists of everything you have done — they are curated evidence of the professional you are becoming. Recruiters scan in seconds; clarity beats length."},{"type":"framework_callout","title":"Impact Bullet Formula","body":"Action verb + what you did + result or scope (numbers when possible). Example: Led 4-person team to redesign campus career site, increasing event sign-ups by 28%."},{"type":"heading","level":3,"text":"Student resume essentials"},{"type":"paragraph","text":"One page. Clear sections: Education, Experience, Leadership/Projects, Skills. Lead with relevance to your target direction, not chronological filler."},{"type":"concept_block","title":"LinkedIn headline vs about","body":"Headline: who you are becoming + direction (not just Student at X University). About: 3–4 sentences connecting your why, proof, and what you are looking for."},{"type":"framework_callout","title":"Keyword Alignment","body":"Pull 5 keywords from 3 job postings in your target area. Ensure your resume and LinkedIn naturally include those skills or contexts — without keyword stuffing."},{"type":"paragraph","text":"Before you finalize, get one review from Career Services or a trusted mentor. Fresh eyes catch gaps you cannot see."}]}'::jsonb,
  '[{"key":"impact_bullet","type":"text","label":"Impact bullet draft","instructions":"Write one resume bullet using the Impact Bullet Formula for your strongest experience.","multiline":true},{"key":"linkedin_headline","type":"text","label":"LinkedIn headline","instructions":"Draft a LinkedIn headline (120 characters max) that signals direction, not just student status.","placeholder":"Aspiring [role] | [skill/interest] | [University]"},{"key":"resume_priority","type":"choice","label":"Resume priority","instructions":"What is your biggest resume gap right now?","options":["Bullets lack measurable results","Experience section is too thin","Formatting or length issues","Content does not match target roles"]},{"key":"review_commitment","type":"checkbox","label":"Review commitment","instructions":"I will request feedback on my resume or LinkedIn from one qualified reviewer this week."}]'::jsonb,
  false
)
ON CONFLICT (module_code) DO UPDATE SET
  title = EXCLUDED.title,
  slug = EXCLUDED.slug,
  pillar = EXCLUDED.pillar,
  unlock_week = EXCLUDED.unlock_week,
  order_index = EXCLUDED.order_index,
  description = EXCLUDED.description,
  video_url = EXCLUDED.video_url,
  workbook_content = EXCLUDED.workbook_content,
  exercises = EXCLUDED.exercises,
  is_live_session = EXCLUDED.is_live_session;


DELETE FROM public.quiz_questions
WHERE module_id = (SELECT id FROM public.modules WHERE module_code = 'P4');


INSERT INTO public.quiz_questions (module_id, question, options, correct_answer, order_index)
VALUES (
  (SELECT id FROM public.modules WHERE module_code = 'P4'),
  'A student resume should primarily...',
  '[{"id":"a","label":"Curate evidence aligned to your target direction"},{"id":"b","label":"List every activity since high school"},{"id":"c","label":"Use dense paragraphs instead of bullets"},{"id":"d","label":"Avoid numbers and outcomes"}]'::jsonb,
  'a',
  1
);

INSERT INTO public.quiz_questions (module_id, question, options, correct_answer, order_index)
VALUES (
  (SELECT id FROM public.modules WHERE module_code = 'P4'),
  'The Impact Bullet Formula includes...',
  '[{"id":"a","label":"Action verb, what you did, and result or scope"},{"id":"b","label":"Only your job title and dates"},{"id":"c","label":"Personal hobbies unrelated to work"},{"id":"d","label":"Quotes from friends"}]'::jsonb,
  'a',
  2
);

INSERT INTO public.quiz_questions (module_id, question, options, correct_answer, order_index)
VALUES (
  (SELECT id FROM public.modules WHERE module_code = 'P4'),
  'A strong LinkedIn headline for a student should...',
  '[{"id":"a","label":"Signal who you are becoming, not only your school"},{"id":"b","label":"Say only Student at University"},{"id":"c","label":"Be left blank"},{"id":"d","label":"Include unrelated jokes"}]'::jsonb,
  'a',
  3
);

INSERT INTO public.quiz_questions (module_id, question, options, correct_answer, order_index)
VALUES (
  (SELECT id FROM public.modules WHERE module_code = 'P4'),
  'Keyword alignment means...',
  '[{"id":"a","label":"Naturally reflecting skills from target job postings"},{"id":"b","label":"Copy-pasting entire job descriptions"},{"id":"c","label":"Ignoring role requirements"},{"id":"d","label":"Using fonts recruiters cannot read"}]'::jsonb,
  'a',
  4
);

INSERT INTO public.quiz_questions (module_id, question, options, correct_answer, order_index)
VALUES (
  (SELECT id FROM public.modules WHERE module_code = 'P4'),
  'Before finalizing your resume, you should...',
  '[{"id":"a","label":"Get feedback from a qualified reviewer"},{"id":"b","label":"Never show it to anyone"},{"id":"c","label":"Submit the first draft immediately"},{"id":"d","label":"Remove all metrics and outcomes"}]'::jsonb,
  'a',
  5
);

INSERT INTO public.modules (
  module_code, title, slug, pillar, unlock_week, order_index,
  description, video_url, workbook_content, exercises, is_live_session
) VALUES (
  'P5',
  'Online Presence & Wins Portfolio',
  'online-presence-wins-portfolio',
  1,
  3,
  2,
  'Build a consistent online presence and a wins portfolio that documents proof of your pre-professional identity.',
  'https://www.youtube.com/watch?v=Z7dXDfqy0e8',
  '{"estimated_minutes":45,"blocks":[{"type":"heading","level":2,"text":"Your digital footprint is always on"},{"type":"paragraph","text":"Recruiters, alumni, and hiring managers will look you up. Your online presence should reinforce the same story as your resume — intentional, professional, and current."},{"type":"framework_callout","title":"Presence Consistency Check","body":"Audit LinkedIn, email signature, public social profiles, and any portfolio site. Do they tell the same story about your direction? Fix one inconsistency this week."},{"type":"heading","level":3,"text":"Build a wins portfolio"},{"type":"paragraph","text":"A wins portfolio is a living document of projects, outcomes, feedback, and artifacts. It fuels interview stories, LinkedIn posts, and networking conversations."},{"type":"concept_block","title":"What counts as a win","body":"Improved a process, led peers, earned recognition, solved a real problem, learned a tool and applied it, received positive feedback from a supervisor. Small wins compound."},{"type":"framework_callout","title":"Win Card Template","body":"Situation → Your action → Result → Skill demonstrated. Keep 8–12 win cards ready. Update after every major project or role."},{"type":"paragraph","text":"Post strategically on LinkedIn: share learning, celebrate team wins, comment thoughtfully on industry content. Visibility without value feels performative; value with visibility builds brand."}]}'::jsonb,
  '[{"key":"win_card","type":"text","label":"Win card draft","instructions":"Create one Win Card using the template (Situation, Action, Result, Skill).","multiline":true},{"key":"presence_gap","type":"text","label":"Presence gap","instructions":"Name one inconsistency between your resume/LinkedIn and how you show up elsewhere online.","multiline":true},{"key":"visibility_approach","type":"choice","label":"Visibility approach","instructions":"Which visibility habit will you adopt this month?","options":["One thoughtful LinkedIn post or comment per week","Update profile photo and banner to professional standard","Share a project artifact or presentation link","Engage with 3 professionals in my target field weekly"]},{"key":"portfolio_commitment","type":"checkbox","label":"Portfolio commitment","instructions":"I will add at least two win cards to my portfolio document this week."}]'::jsonb,
  false
)
ON CONFLICT (module_code) DO UPDATE SET
  title = EXCLUDED.title,
  slug = EXCLUDED.slug,
  pillar = EXCLUDED.pillar,
  unlock_week = EXCLUDED.unlock_week,
  order_index = EXCLUDED.order_index,
  description = EXCLUDED.description,
  video_url = EXCLUDED.video_url,
  workbook_content = EXCLUDED.workbook_content,
  exercises = EXCLUDED.exercises,
  is_live_session = EXCLUDED.is_live_session;


DELETE FROM public.quiz_questions
WHERE module_id = (SELECT id FROM public.modules WHERE module_code = 'P5');


INSERT INTO public.quiz_questions (module_id, question, options, correct_answer, order_index)
VALUES (
  (SELECT id FROM public.modules WHERE module_code = 'P5'),
  'A wins portfolio primarily helps you...',
  '[{"id":"a","label":"Store proof for interviews, networking, and LinkedIn"},{"id":"b","label":"Replace the need for any skills"},{"id":"c","label":"Avoid updating your resume ever again"},{"id":"d","label":"Hide your accomplishments from mentors"}]'::jsonb,
  'a',
  1
);

INSERT INTO public.quiz_questions (module_id, question, options, correct_answer, order_index)
VALUES (
  (SELECT id FROM public.modules WHERE module_code = 'P5'),
  'The Win Card Template includes...',
  '[{"id":"a","label":"Situation, action, result, and skill demonstrated"},{"id":"b","label":"Only your GPA history"},{"id":"c","label":"Unrelated personal gossip"},{"id":"d","label":"Salary negotiations only"}]'::jsonb,
  'a',
  2
);

INSERT INTO public.quiz_questions (module_id, question, options, correct_answer, order_index)
VALUES (
  (SELECT id FROM public.modules WHERE module_code = 'P5'),
  'Presence Consistency Check asks you to...',
  '[{"id":"a","label":"Align your digital touchpoints to one career story"},{"id":"b","label":"Delete all social media permanently"},{"id":"c","label":"Use different stories on every platform"},{"id":"d","label":"Ignore LinkedIn until you graduate"}]'::jsonb,
  'a',
  3
);

INSERT INTO public.quiz_questions (module_id, question, options, correct_answer, order_index)
VALUES (
  (SELECT id FROM public.modules WHERE module_code = 'P5'),
  'Effective LinkedIn visibility for students is...',
  '[{"id":"a","label":"Sharing value and learning, not only self-promotion"},{"id":"b","label":"Posting daily without substance"},{"id":"c","label":"Never engaging with others'' content"},{"id":"d","label":"Using unprofessional language for attention"}]'::jsonb,
  'a',
  4
);

INSERT INTO public.quiz_questions (module_id, question, options, correct_answer, order_index)
VALUES (
  (SELECT id FROM public.modules WHERE module_code = 'P5'),
  'A strong online presence should reinforce...',
  '[{"id":"a","label":"The same pre-professional identity as your resume"},{"id":"b","label":"A completely different persona than in person"},{"id":"c","label":"Nothing — anonymity is best"},{"id":"d","label":"Only memes and inside jokes"}]'::jsonb,
  'a',
  5
);

INSERT INTO public.modules (
  module_code, title, slug, pillar, unlock_week, order_index,
  description, video_url, workbook_content, exercises, is_live_session
) VALUES (
  'P6',
  'Communication That Builds Real Professional Relationships',
  'communication-professional-relationships',
  2,
  5,
  1,
  'Learn how to communicate in ways that build trust, respect, and lasting professional relationships.',
  'https://www.youtube.com/watch?v=Z7dXDfqy0e8',
  '{"estimated_minutes":45,"blocks":[{"type":"heading","level":2,"text":"Communication is career infrastructure"},{"type":"paragraph","text":"Technical skills get you in the room; communication determines whether people trust you with responsibility. Early-career professionals who write and speak clearly are promoted faster."},{"type":"framework_callout","title":"BLUF (Bottom Line Up Front)","body":"Lead with the answer, request, or decision. Then provide context. Executives and managers have limited attention — respect it."},{"type":"heading","level":3,"text":"Professional tone without stiffness"},{"type":"paragraph","text":"Professional does not mean robotic. It means clear, respectful, and accountable. Avoid slang in formal channels, but warmth and gratitude are appropriate."},{"type":"concept_block","title":"Channel awareness","body":"Email for documentation and non-urgent requests. Chat for quick coordination. Meetings for decisions and debate. Match the channel to the stakes."},{"type":"framework_callout","title":"The 3-Part Update","body":"Status: What happened. Blockers: What you need. Next: What happens by when. Use this in standups, emails to managers, and project check-ins."},{"type":"paragraph","text":"Practice rewriting one messy message this week using BLUF and the 3-Part Update. Small upgrades compound into a reputation for reliability."}]}'::jsonb,
  '[{"key":"bluf_rewrite","type":"text","label":"BLUF rewrite","instructions":"Paste or summarize a recent long message you sent. Rewrite the opening two sentences using BLUF.","multiline":true},{"key":"tone_example","type":"text","label":"Tone calibration","instructions":"Describe one situation where your tone was too casual or too stiff. What would professional-but-human sound like?","multiline":true},{"key":"comm_gap","type":"choice","label":"Communication gap","instructions":"Which communication skill needs the most work for you?","options":["Structuring messages with BLUF","Writing concise updates","Speaking up in meetings","Following up and closing loops"]},{"key":"bluf_commitment","type":"checkbox","label":"BLUF commitment","instructions":"I will use BLUF in my next email or message to a professor, manager, or professional contact."}]'::jsonb,
  false
)
ON CONFLICT (module_code) DO UPDATE SET
  title = EXCLUDED.title,
  slug = EXCLUDED.slug,
  pillar = EXCLUDED.pillar,
  unlock_week = EXCLUDED.unlock_week,
  order_index = EXCLUDED.order_index,
  description = EXCLUDED.description,
  video_url = EXCLUDED.video_url,
  workbook_content = EXCLUDED.workbook_content,
  exercises = EXCLUDED.exercises,
  is_live_session = EXCLUDED.is_live_session;


DELETE FROM public.quiz_questions
WHERE module_id = (SELECT id FROM public.modules WHERE module_code = 'P6');


INSERT INTO public.quiz_questions (module_id, question, options, correct_answer, order_index)
VALUES (
  (SELECT id FROM public.modules WHERE module_code = 'P6'),
  'BLUF means you should...',
  '[{"id":"a","label":"Lead with the bottom line or request first"},{"id":"b","label":"Hide your main point until the end"},{"id":"c","label":"Write only in bullet points"},{"id":"d","label":"Avoid all context"}]'::jsonb,
  'a',
  1
);

INSERT INTO public.quiz_questions (module_id, question, options, correct_answer, order_index)
VALUES (
  (SELECT id FROM public.modules WHERE module_code = 'P6'),
  'The 3-Part Update includes...',
  '[{"id":"a","label":"Status, blockers, and next steps"},{"id":"b","label":"Gossip, complaints, and excuses"},{"id":"c","label":"Only your weekend plans"},{"id":"d","label":"A full project history from day one"}]'::jsonb,
  'a',
  2
);

INSERT INTO public.quiz_questions (module_id, question, options, correct_answer, order_index)
VALUES (
  (SELECT id FROM public.modules WHERE module_code = 'P6'),
  'Professional tone is best described as...',
  '[{"id":"a","label":"Clear, respectful, and accountable"},{"id":"b","label":"Cold and robotic at all times"},{"id":"c","label":"Identical to texting friends"},{"id":"d","label":"Avoiding all gratitude"}]'::jsonb,
  'a',
  3
);

INSERT INTO public.quiz_questions (module_id, question, options, correct_answer, order_index)
VALUES (
  (SELECT id FROM public.modules WHERE module_code = 'P6'),
  'Channel awareness means...',
  '[{"id":"a","label":"Matching the medium to the message stakes"},{"id":"b","label":"Using only social media for work requests"},{"id":"c","label":"Never documenting decisions in email"},{"id":"d","label":"Scheduling meetings for every small question"}]'::jsonb,
  'a',
  4
);

INSERT INTO public.quiz_questions (module_id, question, options, correct_answer, order_index)
VALUES (
  (SELECT id FROM public.modules WHERE module_code = 'P6'),
  'Strong early-career communicators are known for...',
  '[{"id":"a","label":"Moving work forward with clarity and follow-through"},{"id":"b","label":"Using the most jargon possible"},{"id":"c","label":"Avoiding all written communication"},{"id":"d","label":"Waiting for others to guess their needs"}]'::jsonb,
  'a',
  5
);

INSERT INTO public.modules (
  module_code, title, slug, pillar, unlock_week, order_index,
  description, video_url, workbook_content, exercises, is_live_session
) VALUES (
  'P7',
  'Interview & Review Essentials',
  'interview-review-essentials',
  2,
  5,
  2,
  'Master interview fundamentals, performance reviews, and feedback conversations with structured stories and preparation.',
  'https://www.youtube.com/watch?v=Z7dXDfqy0e8',
  '{"estimated_minutes":44,"blocks":[{"type":"heading","level":2,"text":"Stories beat lists of credentials"},{"type":"paragraph","text":"When someone asks Tell me about yourself, they are not requesting your resume aloud. They want a coherent narrative: who you are becoming, why it matters, and proof you are serious."},{"type":"framework_callout","title":"60-Second Pitch Structure","body":"Present: Who you are becoming (one line). Past: One proof story. Future: What you are exploring or targeting next. Close: A question or invitation to continue the conversation."},{"type":"heading","level":3,"text":"Build a story bank"},{"type":"paragraph","text":"Prepare 4–6 stories for common themes: leadership, problem-solving, teamwork, failure/learning, and initiative. Interviewers and networking contacts reuse the same patterns."},{"type":"concept_block","title":"STAR in brief","body":"Situation (context in one sentence), Task (your responsibility), Action (what you did), Result (outcome with specificity). Keep stories under 90 seconds spoken."},{"type":"framework_callout","title":"Bridge Lines","body":"Connect answers back to your direction: That experience is why I am interested in roles where... Practice bridges so you do not sound scattered."},{"type":"paragraph","text":"Record yourself once. Notice filler words, pace, and whether your proof story has a clear result. Refine, do not memorize word-for-word."}]}'::jsonb,
  '[{"key":"elevator_pitch","type":"text","label":"60-second pitch draft","instructions":"Write your elevator pitch using Present → Past proof → Future → Close.","multiline":true},{"key":"star_story","type":"text","label":"STAR story","instructions":"Write one STAR story (under 150 words) you can use in interviews or networking.","multiline":true},{"key":"story_gap","type":"choice","label":"Story bank gap","instructions":"Which story type is weakest in your bank right now?","options":["Leadership and influence","Problem-solving with measurable result","Teamwork across difference","Failure, feedback, and growth"]},{"key":"pitch_practice","type":"checkbox","label":"Practice commitment","instructions":"I will deliver my pitch aloud to one person and ask what felt clear vs unclear."}]'::jsonb,
  false
)
ON CONFLICT (module_code) DO UPDATE SET
  title = EXCLUDED.title,
  slug = EXCLUDED.slug,
  pillar = EXCLUDED.pillar,
  unlock_week = EXCLUDED.unlock_week,
  order_index = EXCLUDED.order_index,
  description = EXCLUDED.description,
  video_url = EXCLUDED.video_url,
  workbook_content = EXCLUDED.workbook_content,
  exercises = EXCLUDED.exercises,
  is_live_session = EXCLUDED.is_live_session;


DELETE FROM public.quiz_questions
WHERE module_id = (SELECT id FROM public.modules WHERE module_code = 'P7');


INSERT INTO public.quiz_questions (module_id, question, options, correct_answer, order_index)
VALUES (
  (SELECT id FROM public.modules WHERE module_code = 'P7'),
  'A strong elevator pitch should...',
  '[{"id":"a","label":"Connect present identity, proof, and future direction"},{"id":"b","label":"Recite your entire resume chronologically"},{"id":"c","label":"Avoid any specific examples"},{"id":"d","label":"Last at least 10 minutes"}]'::jsonb,
  'a',
  1
);

INSERT INTO public.quiz_questions (module_id, question, options, correct_answer, order_index)
VALUES (
  (SELECT id FROM public.modules WHERE module_code = 'P7'),
  'STAR stands for...',
  '[{"id":"a","label":"Situation, Task, Action, Result"},{"id":"b","label":"Salary, Title, Application, Rejection"},{"id":"c","label":"Student, Teacher, Advisor, Recruiter"},{"id":"d","label":"Start, Talk, Argue, Repeat"}]'::jsonb,
  'a',
  2
);

INSERT INTO public.quiz_questions (module_id, question, options, correct_answer, order_index)
VALUES (
  (SELECT id FROM public.modules WHERE module_code = 'P7'),
  'Bridge lines help you...',
  '[{"id":"a","label":"Tie answers back to your professional direction"},{"id":"b","label":"Change careers every sentence"},{"id":"c","label":"Avoid all follow-up questions"},{"id":"d","label":"Sound unprepared"}]'::jsonb,
  'a',
  3
);

INSERT INTO public.quiz_questions (module_id, question, options, correct_answer, order_index)
VALUES (
  (SELECT id FROM public.modules WHERE module_code = 'P7'),
  'A story bank should include...',
  '[{"id":"a","label":"Multiple themes like leadership and problem-solving"},{"id":"b","label":"Only unrelated hobbies"},{"id":"c","label":"Stories with no results"},{"id":"d","label":"Memorized scripts you never adapt"}]'::jsonb,
  'a',
  4
);

INSERT INTO public.quiz_questions (module_id, question, options, correct_answer, order_index)
VALUES (
  (SELECT id FROM public.modules WHERE module_code = 'P7'),
  'The best practice method for your pitch is to...',
  '[{"id":"a","label":"Record or rehearse aloud and refine for clarity"},{"id":"b","label":"Never say it until a final interview"},{"id":"c","label":"Read it monotone from a page"},{"id":"d","label":"Use as many filler words as possible"}]'::jsonb,
  'a',
  5
);

INSERT INTO public.modules (
  module_code, title, slug, pillar, unlock_week, order_index,
  description, video_url, workbook_content, exercises, is_live_session
) VALUES (
  'P8',
  'Social Capital Foundations for Students',
  'social-capital-foundations',
  2,
  7,
  1,
  'Understand social capital — trust, reciprocity, and relationships that open doors before roles are posted.',
  'https://www.youtube.com/watch?v=Z7dXDfqy0e8',
  '{"estimated_minutes":48,"blocks":[{"type":"heading","level":2,"text":"Networking is relationship building, not begging"},{"type":"paragraph","text":"Social capital is the trust and goodwill you earn over time. Students who network with curiosity and generosity access opportunities that never post publicly."},{"type":"framework_callout","title":"Give-Ask-Give","body":"Lead with value (insight, gratitude, resource). Make a specific, reasonable ask. Close with another give or clear next step. Reciprocity builds lasting ties."},{"type":"heading","level":3,"text":"Informational conversations done right"},{"type":"paragraph","text":"A 20-minute chat is not an interview. Prepare 5 thoughtful questions, respect time, send thanks within 24 hours, and stay in touch with updates — not only when you need something."},{"type":"concept_block","title":"Weak ties matter","body":"Acquaintances and alumni one step removed from your inner circle often surface opportunities. Activate your network with genuine updates, not mass copy-paste messages."},{"type":"framework_callout","title":"Connection Map","body":"List 15 people: professors, peers, alumni, family friends, supervisors. Tag each: mentor, sponsor, peer, or dormant tie. Plan one reactivation and one new outreach this week."},{"type":"paragraph","text":"Track conversations in a simple spreadsheet: name, date, topic, follow-up due. Professionals notice who closes the loop."}]}'::jsonb,
  '[{"key":"connection_target","type":"text","label":"Outreach target","instructions":"Who is one person you will reach out to this week? What is your specific ask or question?","multiline":true},{"key":"give_value","type":"text","label":"Value you can give","instructions":"What can you offer in networking (article, intro, gratitude, project insight) before you ask for help?","multiline":true},{"key":"networking_barrier","type":"choice","label":"Networking barrier","instructions":"What holds you back most in networking?","options":["Fear of bothering people","Not knowing what to say","Feeling like an imposter","Inconsistent follow-up"]},{"key":"followup_commitment","type":"checkbox","label":"Follow-up commitment","instructions":"I will send a thank-you or update within 24 hours after my next professional conversation."}]'::jsonb,
  false
)
ON CONFLICT (module_code) DO UPDATE SET
  title = EXCLUDED.title,
  slug = EXCLUDED.slug,
  pillar = EXCLUDED.pillar,
  unlock_week = EXCLUDED.unlock_week,
  order_index = EXCLUDED.order_index,
  description = EXCLUDED.description,
  video_url = EXCLUDED.video_url,
  workbook_content = EXCLUDED.workbook_content,
  exercises = EXCLUDED.exercises,
  is_live_session = EXCLUDED.is_live_session;


DELETE FROM public.quiz_questions
WHERE module_id = (SELECT id FROM public.modules WHERE module_code = 'P8');


INSERT INTO public.quiz_questions (module_id, question, options, correct_answer, order_index)
VALUES (
  (SELECT id FROM public.modules WHERE module_code = 'P8'),
  'Social capital is best defined as...',
  '[{"id":"a","label":"Trust and goodwill built over time"},{"id":"b","label":"Number of LinkedIn connections only"},{"id":"c","label":"Avoiding all professional relationships"},{"id":"d","label":"Sending mass generic messages"}]'::jsonb,
  'a',
  1
);

INSERT INTO public.quiz_questions (module_id, question, options, correct_answer, order_index)
VALUES (
  (SELECT id FROM public.modules WHERE module_code = 'P8'),
  'Give-Ask-Give encourages you to...',
  '[{"id":"a","label":"Lead with value before making a request"},{"id":"b","label":"Ask for jobs in the first sentence"},{"id":"c","label":"Never follow up"},{"id":"d","label":"Only contact people when desperate"}]'::jsonb,
  'a',
  2
);

INSERT INTO public.quiz_questions (module_id, question, options, correct_answer, order_index)
VALUES (
  (SELECT id FROM public.modules WHERE module_code = 'P8'),
  'Informational interviews should...',
  '[{"id":"a","label":"Use prepared questions and respect time limits"},{"id":"b","label":"Demand a job on the call"},{"id":"c","label":"Skip thank-you messages"},{"id":"d","label":"Last two hours without agenda"}]'::jsonb,
  'a',
  3
);

INSERT INTO public.quiz_questions (module_id, question, options, correct_answer, order_index)
VALUES (
  (SELECT id FROM public.modules WHERE module_code = 'P8'),
  'Weak ties are important because...',
  '[{"id":"a","label":"They often bridge you to new opportunities"},{"id":"b","label":"They should be ignored"},{"id":"c","label":"They only include close family"},{"id":"d","label":"They replace all preparation"}]'::jsonb,
  'a',
  4
);

INSERT INTO public.quiz_questions (module_id, question, options, correct_answer, order_index)
VALUES (
  (SELECT id FROM public.modules WHERE module_code = 'P8'),
  'A Connection Map helps you...',
  '[{"id":"a","label":"Prioritize outreach and reactivation strategically"},{"id":"b","label":"Avoid documenting relationships"},{"id":"c","label":"Spam everyone weekly"},{"id":"d","label":"Forget follow-ups intentionally"}]'::jsonb,
  'a',
  5
);

INSERT INTO public.modules (
  module_code, title, slug, pillar, unlock_week, order_index,
  description, video_url, workbook_content, exercises, is_live_session
) VALUES (
  'P9',
  'Networking Systems & Relationship Capital',
  'networking-systems-relationship-capital',
  2,
  7,
  2,
  'Build repeatable networking systems that grow relationship capital over time — not one-off outreach bursts.',
  'https://www.youtube.com/watch?v=Z7dXDfqy0e8',
  '{"estimated_minutes":46,"blocks":[{"type":"heading","level":2,"text":"Visibility is earned through value"},{"type":"paragraph","text":"Personal brand is not a logo — it is what people say about you when you are not in the room. Visibility amplifies a story that is already true, not a performance that is fake."},{"type":"framework_callout","title":"Brand Voice Triangle","body":"Expertise edge: What you know or are learning deeply. Human edge: Values and personality that feel authentic. Proof edge: Evidence you do the work, not only talk about it."},{"type":"heading","level":3,"text":"Show up where your field gathers"},{"type":"paragraph","text":"Comment on industry posts, attend one professional event per month, share a concise learning post after projects. Consistency beats viral moments."},{"type":"concept_block","title":"Referral-ready","body":"When someone can describe you in one line — She is the student who built X and cares about Y — you are referral-ready. Clarity helps advocates help you."},{"type":"framework_callout","title":"90-Day Visibility Plan","body":"Pick one platform to prioritize, one cadence (weekly/biweekly), and three content themes tied to your direction. Track engagement and conversations started."},{"type":"paragraph","text":"Review your last 5 public posts or comments. Do they reinforce your Brand Voice Triangle or dilute it?"}]}'::jsonb,
  '[{"key":"brand_one_liner","type":"text","label":"Referral one-liner","instructions":"Write one line someone could use to introduce you to an employer or mentor.","placeholder":"Meet [Name] — they..."},{"key":"visibility_plan","type":"text","label":"90-day visibility action","instructions":"What is one specific visibility action you will take in the next 30 days?","multiline":true},{"key":"brand_edge","type":"choice","label":"Strongest brand edge","instructions":"Which edge of the Brand Voice Triangle is strongest for you today?","options":["Expertise edge — depth of knowledge","Human edge — values and authenticity","Proof edge — projects and outcomes","All three need development"]},{"key":"visibility_commitment","type":"checkbox","label":"Visibility commitment","instructions":"I will publish or comment thoughtfully at least once this week on my priority platform."}]'::jsonb,
  false
)
ON CONFLICT (module_code) DO UPDATE SET
  title = EXCLUDED.title,
  slug = EXCLUDED.slug,
  pillar = EXCLUDED.pillar,
  unlock_week = EXCLUDED.unlock_week,
  order_index = EXCLUDED.order_index,
  description = EXCLUDED.description,
  video_url = EXCLUDED.video_url,
  workbook_content = EXCLUDED.workbook_content,
  exercises = EXCLUDED.exercises,
  is_live_session = EXCLUDED.is_live_session;


DELETE FROM public.quiz_questions
WHERE module_id = (SELECT id FROM public.modules WHERE module_code = 'P9');


INSERT INTO public.quiz_questions (module_id, question, options, correct_answer, order_index)
VALUES (
  (SELECT id FROM public.modules WHERE module_code = 'P9'),
  'Personal brand in Corporate Academy means...',
  '[{"id":"a","label":"What people consistently experience and say about you"},{"id":"b","label":"A fake persona unrelated to your work"},{"id":"c","label":"Only your profile photo"},{"id":"d","label":"Avoiding all public presence"}]'::jsonb,
  'a',
  1
);

INSERT INTO public.quiz_questions (module_id, question, options, correct_answer, order_index)
VALUES (
  (SELECT id FROM public.modules WHERE module_code = 'P9'),
  'The Brand Voice Triangle includes...',
  '[{"id":"a","label":"Expertise, human, and proof edges"},{"id":"b","label":"Salary, title, and bonus only"},{"id":"c","label":"Memes, pranks, and controversy"},{"id":"d","label":"Nothing — brands do not matter"}]'::jsonb,
  'a',
  2
);

INSERT INTO public.quiz_questions (module_id, question, options, correct_answer, order_index)
VALUES (
  (SELECT id FROM public.modules WHERE module_code = 'P9'),
  'Being referral-ready means...',
  '[{"id":"a","label":"Others can describe your value in one clear line"},{"id":"b","label":"You never tell anyone your direction"},{"id":"c","label":"You change your story every week"},{"id":"d","label":"You rely only on anonymous applications"}]'::jsonb,
  'a',
  3
);

INSERT INTO public.quiz_questions (module_id, question, options, correct_answer, order_index)
VALUES (
  (SELECT id FROM public.modules WHERE module_code = 'P9'),
  'Sustainable visibility focuses on...',
  '[{"id":"a","label":"Consistent value over viral stunts"},{"id":"b","label":"Posting without substance daily"},{"id":"c","label":"Never attending events"},{"id":"d","label":"Criticizing employers publicly"}]'::jsonb,
  'a',
  4
);

INSERT INTO public.quiz_questions (module_id, question, options, correct_answer, order_index)
VALUES (
  (SELECT id FROM public.modules WHERE module_code = 'P9'),
  'A 90-Day Visibility Plan should define...',
  '[{"id":"a","label":"Platform, cadence, and content themes"},{"id":"b","label":"Only your vacation schedule"},{"id":"c","label":"Random topics unrelated to your field"},{"id":"d","label":"No metrics or follow-up ever"}]'::jsonb,
  'a',
  5
);

INSERT INTO public.modules (
  module_code, title, slug, pillar, unlock_week, order_index,
  description, video_url, workbook_content, exercises, is_live_session
) VALUES (
  'P10',
  'Recruiting Strategy Playbook',
  'recruiting-strategy-playbook',
  3,
  9,
  1,
  'Build a focused recruiting strategy — target roles, employer lists, timelines, and weekly execution habits.',
  'https://www.youtube.com/watch?v=Z7dXDfqy0e8',
  '{"estimated_minutes":48,"blocks":[{"type":"heading","level":2,"text":"Strategy before volume"},{"type":"paragraph","text":"Applying to hundreds of roles without a map burns time and confidence. High performers define target roles, employers, and pathways — then align materials and outreach."},{"type":"framework_callout","title":"Opportunity Map","body":"Quadrants: Posted roles, referrals, campus pipelines, and hidden market (projects, startups, contract). List 10 employers and which quadrant fits each."},{"type":"heading","level":3,"text":"Define target roles clearly"},{"type":"paragraph","text":"A target role is specific enough to tailor a resume: Analyst, Consulting Development Program — not just business jobs. Clarity helps mentors advocate for you."},{"type":"concept_block","title":"Must-have vs nice-to-have","body":"Separate non-negotiables (location, visa, industry) from preferences (company size, brand). Prevents chasing roles that cannot work."},{"type":"framework_callout","title":"Role Scorecard","body":"For each target role, score employers on: skills match, growth, culture signals, access (referrals), and timeline. Pursue top 5 deeply, not 50 shallowly."},{"type":"paragraph","text":"Update your map monthly. Markets shift; your clarity should evolve with new information from conversations and research."}]}'::jsonb,
  '[{"key":"target_roles","type":"text","label":"Target roles list","instructions":"List 2–3 specific target role titles you will pursue in the next 90 days.","multiline":true},{"key":"employer_targets","type":"text","label":"Employer targets","instructions":"Name five employers or organization types on your Opportunity Map and why each fits.","multiline":true},{"key":"search_focus","type":"choice","label":"Search focus","instructions":"Where will you concentrate most of your effort this month?","options":["Posted applications with tailored materials","Referrals and warm introductions","Campus pipelines and career fairs","Hidden market — projects and direct outreach"]},{"key":"map_commitment","type":"checkbox","label":"Map commitment","instructions":"I will complete an Opportunity Map with at least 10 employers and share it with one advisor for feedback."}]'::jsonb,
  false
)
ON CONFLICT (module_code) DO UPDATE SET
  title = EXCLUDED.title,
  slug = EXCLUDED.slug,
  pillar = EXCLUDED.pillar,
  unlock_week = EXCLUDED.unlock_week,
  order_index = EXCLUDED.order_index,
  description = EXCLUDED.description,
  video_url = EXCLUDED.video_url,
  workbook_content = EXCLUDED.workbook_content,
  exercises = EXCLUDED.exercises,
  is_live_session = EXCLUDED.is_live_session;


DELETE FROM public.quiz_questions
WHERE module_id = (SELECT id FROM public.modules WHERE module_code = 'P10');


INSERT INTO public.quiz_questions (module_id, question, options, correct_answer, order_index)
VALUES (
  (SELECT id FROM public.modules WHERE module_code = 'P10'),
  'Opportunity mapping helps you...',
  '[{"id":"a","label":"Focus effort on realistic pathways instead of random volume"},{"id":"b","label":"Apply everywhere without research"},{"id":"c","label":"Avoid defining any target roles"},{"id":"d","label":"Ignore referrals completely"}]'::jsonb,
  'a',
  1
);

INSERT INTO public.quiz_questions (module_id, question, options, correct_answer, order_index)
VALUES (
  (SELECT id FROM public.modules WHERE module_code = 'P10'),
  'The Opportunity Map quadrants include...',
  '[{"id":"a","label":"Posted roles, referrals, campus pipelines, hidden market"},{"id":"b","label":"Only social media trends"},{"id":"c","label":"Personal vacations"},{"id":"d","label":"Unrelated coursework only"}]'::jsonb,
  'a',
  2
);

INSERT INTO public.quiz_questions (module_id, question, options, correct_answer, order_index)
VALUES (
  (SELECT id FROM public.modules WHERE module_code = 'P10'),
  'A target role should be...',
  '[{"id":"a","label":"Specific enough to tailor resumes and outreach"},{"id":"b","label":"Any job anywhere with no criteria"},{"id":"c","label":"Whatever your friends choose"},{"id":"d","label":"Secret so mentors cannot help"}]'::jsonb,
  'a',
  3
);

INSERT INTO public.quiz_questions (module_id, question, options, correct_answer, order_index)
VALUES (
  (SELECT id FROM public.modules WHERE module_code = 'P10'),
  'Must-have vs nice-to-have criteria prevent...',
  '[{"id":"a","label":"Chasing roles that cannot work for your situation"},{"id":"b","label":"All reflection on preferences"},{"id":"c","label":"Talking to any professionals"},{"id":"d","label":"Updating your plan over time"}]'::jsonb,
  'a',
  4
);

INSERT INTO public.quiz_questions (module_id, question, options, correct_answer, order_index)
VALUES (
  (SELECT id FROM public.modules WHERE module_code = 'P10'),
  'A Role Scorecard is used to...',
  '[{"id":"a","label":"Prioritize employers you will pursue deeply"},{"id":"b","label":"Rank friends by popularity"},{"id":"c","label":"Avoid researching companies"},{"id":"d","label":"Apply shallowly to 100 companies"}]'::jsonb,
  'a',
  5
);

INSERT INTO public.modules (
  module_code, title, slug, pillar, unlock_week, order_index,
  description, video_url, workbook_content, exercises, is_live_session
) VALUES (
  'P11',
  'Internship Momentum & Conversion',
  'internship-momentum-conversion',
  3,
  11,
  1,
  'Turn internships into full-time offers through proactive performance, visibility, and relationship building.',
  'https://www.youtube.com/watch?v=Z7dXDfqy0e8',
  '{"estimated_minutes":50,"blocks":[{"type":"heading","level":2,"text":"Interviews are evidence conversations"},{"type":"paragraph","text":"Interviewers are testing whether your past behavior predicts future performance. Your job is to bring structured proof, not hope they like your major."},{"type":"framework_callout","title":"Interview Prep Stack","body":"Company: mission, customers, recent news. Role: responsibilities and skills repeated in posting. You: 6 STAR stories mapped to common competencies. Questions: 5 thoughtful asks ready."},{"type":"heading","level":3,"text":"Behavioral questions decode"},{"type":"paragraph","text":"Tell me about a time... questions map to competencies: leadership, conflict, initiative, failure, teamwork. Tag each story in your bank so you can retrieve under pressure."},{"type":"concept_block","title":"The 2-minute rule","body":"Most answers should land under two minutes. Longer answers lose attention. Practice with a timer; cut setup, emphasize action and result."},{"type":"framework_callout","title":"Question Bank for Them","body":"Ask about success metrics, team culture, onboarding, and growth. Strong questions signal you are evaluating fit, not begging."},{"type":"paragraph","text":"Day-before prep: review company page, your scorecard, and three stories. Day-of: arrive early, breathe, listen fully before answering."}]}'::jsonb,
  '[{"key":"company_research","type":"text","label":"Company research notes","instructions":"Pick one target employer. Write 3 facts: what they do, who they serve, one recent development.","multiline":true},{"key":"story_tagging","type":"text","label":"Story tagging","instructions":"List two STAR stories and which competency each demonstrates (e.g., leadership, initiative).","multiline":true},{"key":"interview_weakness","type":"choice","label":"Interview weakness","instructions":"What part of interviewing is hardest for you right now?","options":["Structuring answers with STAR","Researching the company","Managing nerves and pace","Asking strong questions at the end"]},{"key":"mock_commitment","type":"checkbox","label":"Mock interview commitment","instructions":"I will complete one mock interview or practice session with a peer, mentor, or career office."}]'::jsonb,
  false
)
ON CONFLICT (module_code) DO UPDATE SET
  title = EXCLUDED.title,
  slug = EXCLUDED.slug,
  pillar = EXCLUDED.pillar,
  unlock_week = EXCLUDED.unlock_week,
  order_index = EXCLUDED.order_index,
  description = EXCLUDED.description,
  video_url = EXCLUDED.video_url,
  workbook_content = EXCLUDED.workbook_content,
  exercises = EXCLUDED.exercises,
  is_live_session = EXCLUDED.is_live_session;


DELETE FROM public.quiz_questions
WHERE module_id = (SELECT id FROM public.modules WHERE module_code = 'P11');


INSERT INTO public.quiz_questions (module_id, question, options, correct_answer, order_index)
VALUES (
  (SELECT id FROM public.modules WHERE module_code = 'P11'),
  'Behavioral interviews primarily assess...',
  '[{"id":"a","label":"Whether past behavior predicts future performance"},{"id":"b","label":"Only your GPA"},{"id":"c","label":"Pop culture knowledge"},{"id":"d","label":"How little you prepared"}]'::jsonb,
  'a',
  1
);

INSERT INTO public.quiz_questions (module_id, question, options, correct_answer, order_index)
VALUES (
  (SELECT id FROM public.modules WHERE module_code = 'P11'),
  'The Interview Prep Stack includes...',
  '[{"id":"a","label":"Company research, role fit, stories, and your questions"},{"id":"b","label":"Only your outfit choice"},{"id":"c","label":"Ignoring the job description"},{"id":"d","label":"Memorizing one generic answer"}]'::jsonb,
  'a',
  2
);

INSERT INTO public.quiz_questions (module_id, question, options, correct_answer, order_index)
VALUES (
  (SELECT id FROM public.modules WHERE module_code = 'P11'),
  'The 2-minute rule suggests...',
  '[{"id":"a","label":"Keep most answers concise with clear results"},{"id":"b","label":"Talk for at least 15 minutes per question"},{"id":"c","label":"Skip results entirely"},{"id":"d","label":"Never practice timing"}]'::jsonb,
  'a',
  3
);

INSERT INTO public.quiz_questions (module_id, question, options, correct_answer, order_index)
VALUES (
  (SELECT id FROM public.modules WHERE module_code = 'P11'),
  'Strong questions for interviewers signal...',
  '[{"id":"a","label":"You are evaluating mutual fit seriously"},{"id":"b","label":"You did not research the role"},{"id":"c","label":"You only care about salary day one"},{"id":"d","label":"You want to end the interview immediately"}]'::jsonb,
  'a',
  4
);

INSERT INTO public.quiz_questions (module_id, question, options, correct_answer, order_index)
VALUES (
  (SELECT id FROM public.modules WHERE module_code = 'P11'),
  'Tagging stories by competency helps you...',
  '[{"id":"a","label":"Retrieve the right example under pressure"},{"id":"b","label":"Avoid all preparation"},{"id":"c","label":"Use one story for every question"},{"id":"d","label":"Hide measurable outcomes"}]'::jsonb,
  'a',
  5
);

INSERT INTO public.modules (
  module_code, title, slug, pillar, unlock_week, order_index,
  description, video_url, workbook_content, exercises, is_live_session
) VALUES (
  'P12',
  'The First 90-Day Professional Playbook',
  'first-90-day-professional-playbook',
  3,
  12,
  1,
  'Prepare for your first professional role with expectations, relationship building, and a plan for the critical first 90 days.',
  'https://www.youtube.com/watch?v=Z7dXDfqy0e8',
  '{"estimated_minutes":42,"blocks":[{"type":"heading","level":2,"text":"Every offer is a package, not a number"},{"type":"paragraph","text":"Students often fixate on salary alone. Total package includes role scope, learning, manager quality, location, benefits, and trajectory. A slightly lower offer with stronger growth can win long-term."},{"type":"framework_callout","title":"Offer Decision Matrix","body":"Weight criteria: skills growth, compensation, culture, lifestyle, mission alignment. Score each offer 1–5 with evidence, not vibes."},{"type":"heading","level":3,"text":"Negotiation basics for early career"},{"type":"paragraph","text":"Research ranges, ask professionally, and focus on role fit and development when experience is limited. Always get final terms in writing."},{"type":"concept_block","title":"BATNA awareness","body":"Best Alternative to a Negotiated Agreement — your walk-away option. Strong alternatives give calm confidence; weak alternatives mean accept thoughtfully but quickly learn."},{"type":"framework_callout","title":"Questions Before You Sign","body":"Who is my manager? What does success look like at 90 days? How are promotions decided? What learning budget exists? Red flags deserve follow-up, not silence."},{"type":"paragraph","text":"Discuss big decisions with a mentor who knows your field. Sleep on it unless a true deadline requires same-day response."}]}'::jsonb,
  '[{"key":"decision_criteria","type":"text","label":"Top decision criteria","instructions":"Rank your top three criteria for choosing among opportunities (e.g., growth, pay, location).","multiline":true},{"key":"offer_scenario","type":"text","label":"Hypothetical comparison","instructions":"Describe two options you might compare (offers, internships, or grad school vs work) and one tradeoff between them.","multiline":true},{"key":"negotiation_readiness","type":"choice","label":"Negotiation readiness","instructions":"How prepared do you feel to research and discuss compensation professionally?","options":["Prepared — I know ranges and how to ask","Somewhat prepared — need practice scripts","Unprepared — I would accept the first number","Not applicable yet — building foundation now"]},{"key":"questions_commitment","type":"checkbox","label":"Questions commitment","instructions":"I will draft five Questions Before You Sign for my next offer or serious opportunity."}]'::jsonb,
  false
)
ON CONFLICT (module_code) DO UPDATE SET
  title = EXCLUDED.title,
  slug = EXCLUDED.slug,
  pillar = EXCLUDED.pillar,
  unlock_week = EXCLUDED.unlock_week,
  order_index = EXCLUDED.order_index,
  description = EXCLUDED.description,
  video_url = EXCLUDED.video_url,
  workbook_content = EXCLUDED.workbook_content,
  exercises = EXCLUDED.exercises,
  is_live_session = EXCLUDED.is_live_session;


DELETE FROM public.quiz_questions
WHERE module_id = (SELECT id FROM public.modules WHERE module_code = 'P12');


INSERT INTO public.quiz_questions (module_id, question, options, correct_answer, order_index)
VALUES (
  (SELECT id FROM public.modules WHERE module_code = 'P12'),
  'Evaluating an offer as a package means considering...',
  '[{"id":"a","label":"Growth, culture, compensation, and lifestyle together"},{"id":"b","label":"Salary only"},{"id":"c","label":"Office snack variety only"},{"id":"d","label":"Ignoring role scope"}]'::jsonb,
  'a',
  1
);

INSERT INTO public.quiz_questions (module_id, question, options, correct_answer, order_index)
VALUES (
  (SELECT id FROM public.modules WHERE module_code = 'P12'),
  'An Offer Decision Matrix helps you...',
  '[{"id":"a","label":"Score options against weighted criteria with evidence"},{"id":"b","label":"Decide purely on gossip"},{"id":"c","label":"Avoid all comparison"},{"id":"d","label":"Choose randomly"}]'::jsonb,
  'a',
  2
);

INSERT INTO public.quiz_questions (module_id, question, options, correct_answer, order_index)
VALUES (
  (SELECT id FROM public.modules WHERE module_code = 'P12'),
  'BATNA stands for...',
  '[{"id":"a","label":"Best Alternative to a Negotiated Agreement"},{"id":"b","label":"Basic Application Tracking Number Archive"},{"id":"c","label":"Business Attire Training National Award"},{"id":"d","label":"Bonus After The Negotiation Arrives"}]'::jsonb,
  'a',
  3
);

INSERT INTO public.quiz_questions (module_id, question, options, correct_answer, order_index)
VALUES (
  (SELECT id FROM public.modules WHERE module_code = 'P12'),
  'Questions Before You Sign should clarify...',
  '[{"id":"a","label":"Manager, success metrics, and growth path"},{"id":"b","label":"Only cafeteria menus"},{"id":"c","label":"Nothing — sign immediately"},{"id":"d","label":"Gossip about coworkers"}]'::jsonb,
  'a',
  4
);

INSERT INTO public.quiz_questions (module_id, question, options, correct_answer, order_index)
VALUES (
  (SELECT id FROM public.modules WHERE module_code = 'P12'),
  'Early-career negotiation should focus on...',
  '[{"id":"a","label":"Professional research, role fit, and written terms"},{"id":"b","label":"Threats and ultimatums"},{"id":"c","label":"Ignoring market data"},{"id":"d","label":"Verbal promises only"}]'::jsonb,
  'a',
  5
);

INSERT INTO public.modules (
  module_code, title, slug, pillar, unlock_week, order_index,
  description, video_url, workbook_content, exercises, is_live_session
) VALUES (
  'P13',
  'Opportunity Mapping & Direction Setting',
  'opportunity-mapping-direction-setting',
  3,
  11,
  2,
  'Map your opportunity landscape, define direction, and prioritize pathways instead of spraying applications.',
  'https://www.youtube.com/watch?v=Z7dXDfqy0e8',
  '{"estimated_minutes":44,"blocks":[{"type":"heading","level":2,"text":"The first 90 days set your reputation"},{"type":"paragraph","text":"New professionals are judged quickly on reliability, learning speed, and teamwork. You do not need to know everything — you need to listen, deliver small wins, and communicate proactively."},{"type":"framework_callout","title":"90-Day Onboarding Plan","body":"Days 1–30: Learn systems, stakeholders, and priorities. Days 31–60: Own small deliverables. Days 61–90: Propose one improvement. Schedule check-ins with your manager biweekly."},{"type":"heading","level":3,"text":"Professional norms that matter"},{"type":"paragraph","text":"Be on time, document decisions, admit mistakes early, and thank people who teach you. Ask how success is measured before chasing tasks randomly."},{"type":"concept_block","title":"Managing up","body":"Managing up means aligning with your manager''s priorities, communicating status without being asked, and flagging blockers early with proposed solutions."},{"type":"framework_callout","title":"Stakeholder Map","body":"List people you depend on and who depends on you. Note communication preferences. Build trust before you need favors."},{"type":"paragraph","text":"Find a peer buddy and one informal mentor in the organization. Isolation is a common early-career failure mode."}]}'::jsonb,
  '[{"key":"ninety_day_goal","type":"text","label":"90-day goal","instructions":"What is one outcome you want to be known for in your first 90 days in your next role or internship?","multiline":true},{"key":"stakeholder_list","type":"text","label":"Stakeholder draft","instructions":"List three stakeholders you would map in a new role (manager, peer, cross-functional partner) and how you would build trust.","multiline":true},{"key":"readiness_gap","type":"choice","label":"Readiness gap","instructions":"Which workplace readiness area needs the most growth?","options":["Managing up and status communication","Time management and prioritization","Receiving feedback without defensiveness","Building cross-functional relationships"]},{"key":"onboarding_commitment","type":"checkbox","label":"Onboarding plan commitment","instructions":"I will draft a 90-Day Onboarding Plan outline before my next internship or job start date."}]'::jsonb,
  false
)
ON CONFLICT (module_code) DO UPDATE SET
  title = EXCLUDED.title,
  slug = EXCLUDED.slug,
  pillar = EXCLUDED.pillar,
  unlock_week = EXCLUDED.unlock_week,
  order_index = EXCLUDED.order_index,
  description = EXCLUDED.description,
  video_url = EXCLUDED.video_url,
  workbook_content = EXCLUDED.workbook_content,
  exercises = EXCLUDED.exercises,
  is_live_session = EXCLUDED.is_live_session;


DELETE FROM public.quiz_questions
WHERE module_id = (SELECT id FROM public.modules WHERE module_code = 'P13');


INSERT INTO public.quiz_questions (module_id, question, options, correct_answer, order_index)
VALUES (
  (SELECT id FROM public.modules WHERE module_code = 'P13'),
  'The first 90 days primarily shape...',
  '[{"id":"a","label":"Your early reputation for reliability and learning"},{"id":"b","label":"Nothing — performance is judged after years only"},{"id":"c","label":"Only your vacation balance"},{"id":"d","label":"Whether you avoid all feedback"}]'::jsonb,
  'a',
  1
);

INSERT INTO public.quiz_questions (module_id, question, options, correct_answer, order_index)
VALUES (
  (SELECT id FROM public.modules WHERE module_code = 'P13'),
  'A 90-Day Onboarding Plan progresses from...',
  '[{"id":"a","label":"Learning → owning deliverables → proposing improvement"},{"id":"b","label":"Leading the company day one"},{"id":"c","label":"Avoiding all meetings"},{"id":"d","label":"Skipping manager check-ins"}]'::jsonb,
  'a',
  2
);

INSERT INTO public.quiz_questions (module_id, question, options, correct_answer, order_index)
VALUES (
  (SELECT id FROM public.modules WHERE module_code = 'P13'),
  'Managing up means...',
  '[{"id":"a","label":"Aligning with manager priorities and communicating proactively"},{"id":"b","label":"Ignoring your manager''s goals"},{"id":"c","label":"Only doing tasks you enjoy"},{"id":"d","label":"Hiding blockers until deadlines pass"}]'::jsonb,
  'a',
  3
);

INSERT INTO public.quiz_questions (module_id, question, options, correct_answer, order_index)
VALUES (
  (SELECT id FROM public.modules WHERE module_code = 'P13'),
  'A Stakeholder Map helps you...',
  '[{"id":"a","label":"Build trust with people you work with and depend on"},{"id":"b","label":"Avoid collaborating entirely"},{"id":"c","label":"Skip documenting relationships"},{"id":"d","label":"Work in isolation"}]'::jsonb,
  'a',
  4
);

INSERT INTO public.quiz_questions (module_id, question, options, correct_answer, order_index)
VALUES (
  (SELECT id FROM public.modules WHERE module_code = 'P13'),
  'When you make a mistake early in a role, you should...',
  '[{"id":"a","label":"Admit it early, fix it, and share what you learned"},{"id":"b","label":"Hide it until it becomes a crisis"},{"id":"c","label":"Blame others immediately"},{"id":"d","label":"Quit without conversation"}]'::jsonb,
  'a',
  5
);

INSERT INTO public.modules (
  module_code, title, slug, pillar, unlock_week, order_index,
  description, video_url, workbook_content, exercises, is_live_session
) VALUES (
  'P14',
  'Hidden Job Market Strategy',
  'hidden-job-market-strategy',
  3,
  9,
  2,
  'Access unposted roles through referrals, direct outreach, projects, and relationship-driven search strategies.',
  'https://www.youtube.com/watch?v=Z7dXDfqy0e8',
  '{"estimated_minutes":50,"blocks":[{"type":"heading","level":2,"text":"Plans fail without accountability"},{"type":"paragraph","text":"You have built identity, communication, network, and search skills. This module turns insight into a 12-month operating plan you review monthly with a partner or mentor."},{"type":"framework_callout","title":"12-Month Career Operating Plan","body":"Quarterly themes: Q1 foundation (materials, stories), Q2 visibility (network, events), Q3 acceleration (applications, interviews), Q4 decision and onboarding prep. Each quarter: 3 outcomes, 3 habits, 1 accountability partner."},{"type":"heading","level":3,"text":"Habits beat motivation"},{"type":"paragraph","text":"Weekly career habits — outreach, learning, portfolio updates — outperform sporadic bursts before deadlines. Calendar them like classes."},{"type":"concept_block","title":"Review rhythm","body":"Monthly: score progress on outcomes, adjust targets. Weekly: 30-minute career block. Daily: one micro-action (comment, message, bullet improvement)."},{"type":"framework_callout","title":"Accountability Partnership","body":"Pair with a peer from Corporate Academy. Share goals, review monthly, celebrate wins. External commitment doubles follow-through."},{"type":"paragraph","text":"Your plan is a living document. Graduation, market shifts, or new interests mean you update — not abandon — the system."}]}'::jsonb,
  '[{"key":"quarter_outcomes","type":"text","label":"Next quarter outcomes","instructions":"Define three measurable outcomes for your next quarter (e.g., applications, conversations, stories ready).","multiline":true},{"key":"weekly_habits","type":"text","label":"Weekly career habits","instructions":"List two weekly habits you will calendar for the next 8 weeks.","multiline":true},{"key":"accountability_partner","type":"choice","label":"Accountability setup","instructions":"How will you set up accountability?","options":["Corporate Academy peer check-in monthly","Mentor review monthly","Career office appointment series","Self-review only with calendar reminders"]},{"key":"plan_commitment","type":"checkbox","label":"Plan commitment","instructions":"I will write my 12-Month Career Operating Plan draft and schedule my first monthly review date."}]'::jsonb,
  false
)
ON CONFLICT (module_code) DO UPDATE SET
  title = EXCLUDED.title,
  slug = EXCLUDED.slug,
  pillar = EXCLUDED.pillar,
  unlock_week = EXCLUDED.unlock_week,
  order_index = EXCLUDED.order_index,
  description = EXCLUDED.description,
  video_url = EXCLUDED.video_url,
  workbook_content = EXCLUDED.workbook_content,
  exercises = EXCLUDED.exercises,
  is_live_session = EXCLUDED.is_live_session;


DELETE FROM public.quiz_questions
WHERE module_id = (SELECT id FROM public.modules WHERE module_code = 'P14');


INSERT INTO public.quiz_questions (module_id, question, options, correct_answer, order_index)
VALUES (
  (SELECT id FROM public.modules WHERE module_code = 'P14'),
  'A 12-Month Career Operating Plan should include...',
  '[{"id":"a","label":"Quarterly outcomes, habits, and an accountability partner"},{"id":"b","label":"Only vague intentions"},{"id":"c","label":"No review rhythm"},{"id":"d","label":"Goals you never share"}]'::jsonb,
  'a',
  1
);

INSERT INTO public.quiz_questions (module_id, question, options, correct_answer, order_index)
VALUES (
  (SELECT id FROM public.modules WHERE module_code = 'P14'),
  'Career progress is most sustainable through...',
  '[{"id":"a","label":"Consistent weekly habits on the calendar"},{"id":"b","label":"Rare all-nighter bursts only"},{"id":"c","label":"Avoiding all tracking"},{"id":"d","label":"Waiting for perfect motivation"}]'::jsonb,
  'a',
  2
);

INSERT INTO public.quiz_questions (module_id, question, options, correct_answer, order_index)
VALUES (
  (SELECT id FROM public.modules WHERE module_code = 'P14'),
  'An Accountability Partnership works best when you...',
  '[{"id":"a","label":"Share goals and review progress on a schedule"},{"id":"b","label":"Never discuss setbacks"},{"id":"c","label":"Compete destructively"},{"id":"d","label":"Skip all follow-ups"}]'::jsonb,
  'a',
  3
);

INSERT INTO public.quiz_questions (module_id, question, options, correct_answer, order_index)
VALUES (
  (SELECT id FROM public.modules WHERE module_code = 'P14'),
  'Monthly review rhythm should...',
  '[{"id":"a","label":"Score outcomes and adjust targets with evidence"},{"id":"b","label":"Ignore all prior goals"},{"id":"c","label":"Happen only once at graduation"},{"id":"d","label":"Avoid any metrics"}]'::jsonb,
  'a',
  4
);

INSERT INTO public.quiz_questions (module_id, question, options, correct_answer, order_index)
VALUES (
  (SELECT id FROM public.modules WHERE module_code = 'P14'),
  'Completing Corporate Academy means you should...',
  '[{"id":"a","label":"Maintain a living plan you refine as life changes"},{"id":"b","label":"Stop all career activity"},{"id":"c","label":"Never network again"},{"id":"d","label":"Forget everything from earlier pillars"}]'::jsonb,
  'a',
  5
);

INSERT INTO public.modules (
  module_code, title, slug, pillar, unlock_week, order_index,
  description, stream_url, video_url, workbook_content, exercises, is_live_session
) VALUES (
  'LS1',
  'Pillar 1 Completion Live Session',
  'pillar-1-completion-live-session',
  1,
  4,
  1,
  'Live cohort session to synthesize Identity & Brand Building: share identity shifts, wins from P1–P5, and Q&A with facilitators. Come with your elevator pitch draft and one signal audit insight.',
  'https://www.youtube.com/live_placeholder',
  NULL,
  NULL,
  NULL,
  true
)
ON CONFLICT (module_code) DO UPDATE SET
  title = EXCLUDED.title,
  slug = EXCLUDED.slug,
  pillar = EXCLUDED.pillar,
  unlock_week = EXCLUDED.unlock_week,
  order_index = EXCLUDED.order_index,
  description = EXCLUDED.description,
  stream_url = EXCLUDED.stream_url,
  is_live_session = EXCLUDED.is_live_session;


INSERT INTO public.modules (
  module_code, title, slug, pillar, unlock_week, order_index,
  description, stream_url, video_url, workbook_content, exercises, is_live_session
) VALUES (
  'LS2',
  'Communication Practice Live Session',
  'communication-practice-live-session',
  2,
  6,
  1,
  'Practice executive communication in real time: BLUF updates, 60-second pitches, and peer feedback. Bring one written message and one pitch to refine during breakout practice.',
  'https://www.youtube.com/live_placeholder',
  NULL,
  NULL,
  NULL,
  true
)
ON CONFLICT (module_code) DO UPDATE SET
  title = EXCLUDED.title,
  slug = EXCLUDED.slug,
  pillar = EXCLUDED.pillar,
  unlock_week = EXCLUDED.unlock_week,
  order_index = EXCLUDED.order_index,
  description = EXCLUDED.description,
  stream_url = EXCLUDED.stream_url,
  is_live_session = EXCLUDED.is_live_session;


INSERT INTO public.modules (
  module_code, title, slug, pillar, unlock_week, order_index,
  description, stream_url, video_url, workbook_content, exercises, is_live_session
) VALUES (
  'LS3',
  'Visibility & Relationships Live Session',
  'visibility-relationships-live-session',
  2,
  8,
  1,
  'Workshop on networking follow-through and visible brand voice. Practice Give-Ask-Give outreach scripts and review LinkedIn presence with accountability partners.',
  'https://www.youtube.com/live_placeholder',
  NULL,
  NULL,
  NULL,
  true
)
ON CONFLICT (module_code) DO UPDATE SET
  title = EXCLUDED.title,
  slug = EXCLUDED.slug,
  pillar = EXCLUDED.pillar,
  unlock_week = EXCLUDED.unlock_week,
  order_index = EXCLUDED.order_index,
  description = EXCLUDED.description,
  stream_url = EXCLUDED.stream_url,
  is_live_session = EXCLUDED.is_live_session;


INSERT INTO public.modules (
  module_code, title, slug, pillar, unlock_week, order_index,
  description, stream_url, video_url, workbook_content, exercises, is_live_session
) VALUES (
  'LS4',
  'Opportunity Alignment Live Session',
  'opportunity-alignment-live-session',
  3,
  10,
  1,
  'Align your opportunity map, interview stories, and offer criteria with cohort peers and coaches. Leave with three prioritized employers and one mock interview takeaway.',
  'https://www.youtube.com/live_placeholder',
  NULL,
  NULL,
  NULL,
  true
)
ON CONFLICT (module_code) DO UPDATE SET
  title = EXCLUDED.title,
  slug = EXCLUDED.slug,
  pillar = EXCLUDED.pillar,
  unlock_week = EXCLUDED.unlock_week,
  order_index = EXCLUDED.order_index,
  description = EXCLUDED.description,
  stream_url = EXCLUDED.stream_url,
  is_live_session = EXCLUDED.is_live_session;
