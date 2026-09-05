/**
 * Rebuild Demo University fixtures relative to now().
 * Same offsets as the original fixtures — no demo-only analytics branches.
 *
 * Usage: npm run seed:demo
 */
import { createAdminClient } from "../lib/supabase/admin";
import { normalizeExerciseField } from "../lib/content-normalize";
import {
  fillBlankValueKeys,
  groupAnchorPairs,
  groupRewritePairs,
  scoreFieldKeys,
  starFieldMap,
  type ExerciseAnswerData,
} from "../lib/exercise-answers";
import { isStructuredExercise, type ExerciseField } from "../types/modules";
import type { Json } from "../types/database";

const DEMO_INSTITUTION_ID = "ffc653d3-da74-4141-afa5-be70d6eaf1c8";

type DemoStudentSpec = {
  id: string;
  full_name: string;
  email: string;
  /** Days since last activity. */
  inactiveDays: number;
  /** Target non-empty workbook answers (of catalog total). */
  workbookTarget: number;
  /** Content modules to mark complete (quiz passed + all exercises filled). */
  modulesComplete: number;
  /** Live sessions attended (of 5), deliberately uncorrelated with completion. */
  liveSessionsAttended: number;
  /**
   * When true: pass quizzes on extra modules without marking complete /
   * without filling all exercises — so Modules passed ≠ Quiz on roster.
   */
  quizAheadOfExercises?: boolean;
};

const STUDENTS: DemoStudentSpec[] = [
  {
    id: "dee00000-0000-4000-a000-000000000001",
    full_name: "Demo Avery Chen",
    email: "avery@demo.test",
    inactiveDays: 0,
    workbookTarget: 31,
    modulesComplete: 14,
    liveSessionsAttended: 4,
  },
  {
    id: "dee00000-0000-4000-a000-000000000002",
    full_name: "Demo Blake Ruiz",
    email: "blake@demo.test",
    inactiveDays: 1,
    workbookTarget: 27,
    modulesComplete: 11,
    liveSessionsAttended: 3,
  },
  {
    id: "dee00000-0000-4000-a000-000000000003",
    full_name: "Demo Casey Novak",
    email: "casey@demo.test",
    inactiveDays: 2,
    workbookTarget: 20,
    modulesComplete: 10,
    liveSessionsAttended: 0,
  },
  {
    id: "dee00000-0000-4000-a000-000000000004",
    full_name: "Demo Devon Park",
    email: "devon@demo.test",
    inactiveDays: 5,
    workbookTarget: 17,
    modulesComplete: 6,
    liveSessionsAttended: 5,
    quizAheadOfExercises: true,
  },
  {
    id: "dee00000-0000-4000-a000-000000000005",
    full_name: "Demo Emerson Hall",
    email: "emerson@demo.test",
    inactiveDays: 9,
    workbookTarget: 12,
    modulesComplete: 4,
    liveSessionsAttended: 2,
  },
  {
    id: "dee00000-0000-4000-a000-000000000006",
    full_name: "Demo Frankie Oyelaran",
    email: "frankie@demo.test",
    inactiveDays: 16,
    workbookTarget: 7,
    modulesComplete: 2,
    liveSessionsAttended: 1,
  },
  {
    id: "dee00000-0000-4000-a000-000000000007",
    full_name: "Demo Gray Whitfield",
    email: "gray@demo.test",
    inactiveDays: 27,
    workbookTarget: 3,
    modulesComplete: 1,
    liveSessionsAttended: 5,
  },
  {
    id: "dee00000-0000-4000-a000-000000000008",
    full_name: "Demo Harper Lindqvist",
    email: "harper@demo.test",
    inactiveDays: 40,
    workbookTarget: 0,
    modulesComplete: 0,
    liveSessionsAttended: 0,
  },
];

function daysAgoIso(days: number, now = new Date()): string {
  const d = new Date(now);
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

function dateOnlyDaysAgo(days: number, now = new Date()): string {
  const d = new Date(now);
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

function nonEmptyAnswer(exercise: Extract<
  ExerciseField,
  { input_type: string; fields: { key: string; label: string }[] }
>): ExerciseAnswerData {
  const values: ExerciseAnswerData["values"] = {};
  const { input_type: inputType, fields, key } = exercise;

  switch (inputType) {
    case "reflection":
    case "tier_map":
      for (const field of fields) {
        values[field.key] = `Demo reflection for ${field.label}`;
      }
      break;
    case "fill_blank": {
      for (const blankKey of fillBlankValueKeys(key, fields)) {
        values[blankKey] = "demo";
      }
      break;
    }
    case "rewrite_pairs": {
      const pairs = groupRewritePairs(fields);
      for (const pair of pairs) {
        values[pair.beforeKey] = "before";
        values[pair.afterKey] = "after";
      }
      break;
    }
    case "anchor_select": {
      const pairs = groupAnchorPairs(fields);
      for (const pair of pairs.slice(0, 2)) {
        values[pair.anchorKey] = `Anchor ${pair.index}`;
        values[pair.reasonKey] = `Reason ${pair.index}`;
      }
      break;
    }
    case "star": {
      const map = starFieldMap(fields);
      for (const fieldKey of Object.values(map)) {
        values[fieldKey] = "Demo STAR content";
      }
      break;
    }
    case "checklist":
      for (const field of fields) {
        values[field.key] = true;
      }
      break;
    case "scorecard":
      for (const field of fields) {
        const { score, notes } = scoreFieldKeys(field.key);
        values[score] = 4;
        values[notes] = "Solid fit";
      }
      break;
    default:
      values[fields[0]?.key ?? key] = "demo";
  }

  return { values };
}

async function main() {
  const admin = createAdminClient();
  const now = new Date();

  const { data: institution, error: institutionError } = await admin
    .from("institutions")
    .select("id, name")
    .eq("id", DEMO_INSTITUTION_ID)
    .single();

  if (institutionError || !institution) {
    throw new Error(
      `Demo University (${DEMO_INSTITUTION_ID}) not found: ${institutionError?.message}`
    );
  }

  const { data: roster, error: rosterError } = await admin
    .from("profiles")
    .select("id, full_name, is_demo, role")
    .eq("institution_id", DEMO_INSTITUTION_ID)
    .eq("role", "student");

  if (rosterError) throw new Error(rosterError.message);

  const nonDemo = (roster ?? []).filter((p) => !p.is_demo);
  if (nonDemo.length > 0) {
    throw new Error(
      `Refusing to seed: institution has non-demo students (${nonDemo
        .map((p) => p.full_name ?? p.id)
        .join(", ")}). Mark them is_demo=true or move them first.`
    );
  }

  // Mid-programme look: cohort started 8 weeks ago.
  const cohortStart = dateOnlyDaysAgo(8 * 7, now);
  const { error: instUpdateError } = await admin
    .from("institutions")
    .update({ cohort_start_date: cohortStart })
    .eq("id", DEMO_INSTITUTION_ID);
  if (instUpdateError) throw new Error(instUpdateError.message);

  const { data: contentModules, error: modulesError } = await admin
    .from("modules")
    .select("id, module_code, unlock_week, order_index, exercises")
    .eq("is_live_session", false)
    .order("unlock_week")
    .order("order_index");
  if (modulesError) throw new Error(modulesError.message);

  const { data: liveSessions, error: liveError } = await admin
    .from("modules")
    .select("id, module_code, unlock_week, order_index")
    .eq("is_live_session", true)
    .order("unlock_week")
    .order("order_index");
  if (liveError) throw new Error(liveError.message);

  const orderedModules = [...(contentModules ?? [])];
  const catalog: {
    moduleId: string;
    exercise: Extract<
      ExerciseField,
      { input_type: string; fields: { key: string; label: string }[] }
    >;
  }[] = [];

  for (const module of orderedModules) {
    if (!Array.isArray(module.exercises)) continue;
    for (const raw of module.exercises) {
      if (!raw || typeof raw !== "object") continue;
      const exercise = normalizeExerciseField(raw as Record<string, unknown>);
      if (!exercise || !isStructuredExercise(exercise)) continue;
      catalog.push({ moduleId: module.id, exercise });
    }
  }

  console.log(
    `Seeding ${institution.name}: ${STUDENTS.length} demo students, ${catalog.length} exercises, cohort_start=${cohortStart}`
  );

  const studentIds = STUDENTS.map((s) => s.id);

  // Clear prior demo activity for these students.
  await admin.from("exercise_answers").delete().in("user_id", studentIds);
  await admin.from("login_events").delete().in("user_id", studentIds);
  await admin.from("student_progress").delete().in("student_id", studentIds);
  await admin.from("flags").delete().in("student_id", studentIds);

  for (const [index, spec] of STUDENTS.entries()) {
    const lastActive = dateOnlyDaysAgo(spec.inactiveDays, now);
    const lastLogin = daysAgoIso(spec.inactiveDays, now);
    const programStarted = daysAgoIso(Math.max(spec.inactiveDays, 14), now);
    const xp = spec.modulesComplete * 100 + spec.liveSessionsAttended * 50;

    const { error: profileError } = await admin.from("profiles").upsert(
      {
        id: spec.id,
        full_name: spec.full_name,
        role: "student",
        institution_id: DEMO_INSTITUTION_ID,
        is_demo: true,
        xp,
        rank: index + 1,
        streak_days: Math.max(0, 8 - Math.floor(spec.inactiveDays / 7)),
        last_active_date: lastActive,
        last_login: lastLogin,
        program_started_at: programStarted,
        onboarding_complete: true,
        diagnostic_complete: spec.workbookTarget > 0 || spec.modulesComplete > 0,
        default_answer_visibility: false,
      },
      { onConflict: "id" }
    );
    if (profileError) {
      throw new Error(`${spec.full_name} profile: ${profileError.message}`);
    }

    // Login events for engagement (within last 7 days only if inactiveDays < 7).
    if (spec.inactiveDays < 7) {
      await admin.from("login_events").insert({
        user_id: spec.id,
        logged_in_at: lastLogin,
      });
    }

    const completeModules = orderedModules.slice(0, spec.modulesComplete);
    const completeIds = new Set(completeModules.map((m) => m.id));

    // Workbook answers: fill first N catalog entries; ensure completed modules are fully filled.
    const answersForComplete = catalog.filter((c) => completeIds.has(c.moduleId));
    const remainingSlots = Math.max(
      0,
      spec.workbookTarget - answersForComplete.length
    );
    const extraAnswers = catalog
      .filter((c) => !completeIds.has(c.moduleId))
      .slice(0, remainingSlots);
    const answersToWrite = [...answersForComplete, ...extraAnswers].slice(
      0,
      Math.max(spec.workbookTarget, answersForComplete.length)
    );

    for (const item of answersToWrite) {
      const updatedAt = daysAgoIso(
        Math.min(spec.inactiveDays, 3) + Math.floor(Math.random() * 2),
        now
      );
      const { error: answerError } = await admin.from("exercise_answers").upsert(
        {
          user_id: spec.id,
          module_id: item.moduleId,
          exercise_key: item.exercise.key,
          answer: nonEmptyAnswer(item.exercise) as unknown as Json,
          is_public: false,
          updated_at: updatedAt,
        },
        { onConflict: "user_id,module_id,exercise_key" }
      );
      if (answerError) {
        throw new Error(
          `${spec.full_name} answer ${item.exercise.key}: ${answerError.message}`
        );
      }
    }

    // Progress for completed content modules.
    for (const module of completeModules) {
      const quizScore = 3 + (index % 2); // 3 or 4 — always ≥ pass threshold
      const { error: progressError } = await admin.from("student_progress").upsert(
        {
          student_id: spec.id,
          module_id: module.id,
          video_watched: true,
          exercises_submitted: true,
          quiz_completed: true,
          quiz_score: Math.min(quizScore, 4),
          is_complete: true,
          completed_at: daysAgoIso(spec.inactiveDays + 1, now),
          xp_earned: 100,
        },
        { onConflict: "student_id,module_id" }
      );
      if (progressError) {
        throw new Error(
          `${spec.full_name} progress ${module.module_code}: ${progressError.message}`
        );
      }
    }

    // Devon: quiz passed on two modules beyond completed ones, exercises unfinished.
    if (spec.quizAheadOfExercises) {
      const aheadModules = orderedModules.slice(
        spec.modulesComplete,
        spec.modulesComplete + 2
      );
      for (const module of aheadModules) {
        await admin.from("student_progress").upsert(
          {
            student_id: spec.id,
            module_id: module.id,
            video_watched: false,
            exercises_submitted: false,
            quiz_completed: true,
            quiz_score: 3,
            is_complete: false,
            xp_earned: 0,
          },
          { onConflict: "student_id,module_id" }
        );
      }
    }

    // Live session attendance (self-reported).
    const sessions = [...(liveSessions ?? [])].slice(
      0,
      spec.liveSessionsAttended
    );
    for (const session of sessions) {
      await admin.from("student_progress").upsert(
        {
          student_id: spec.id,
          module_id: session.id,
          video_watched: true,
          exercises_submitted: false,
          quiz_completed: false,
          quiz_score: null,
          is_complete: true,
          completed_at: daysAgoIso(spec.inactiveDays + 2, now),
          xp_earned: 50,
          attendance_source: "self_reported",
        },
        { onConflict: "student_id,module_id" }
      );
    }

    console.log(
      `  ${spec.full_name}: modules=${spec.modulesComplete} workbook≈${answersToWrite.length} live=${spec.liveSessionsAttended} inactive=${spec.inactiveDays}d`
    );
  }

  console.log("\n✓ Demo University fixtures rebuilt relative to now.");
  console.log("  Run again anytime — idempotent for these demo student IDs.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
