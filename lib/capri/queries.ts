import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import {
  CAPRI_INSTRUMENT_VERSION,
  scoreResponse,
  type CapriAnswer,
  type CapriItem,
  type CapriPillar,
  readinessDirection,
  type ReadinessDirection,
  type RatingContext,
  type ScoredResponse,
} from "./scoring";

type DbClient = SupabaseClient<Database>;

export type AdministrationType = "baseline" | "post";

export type CapriResponseState = {
  responseId: string;
  administrationId: string;
  administrationType: AdministrationType;
  submittedAt: string | null;
  startedAt: string;
  answers: CapriAnswer[];
};

export async function fetchActiveItems(
  supabase: DbClient,
  version: string = CAPRI_INSTRUMENT_VERSION
): Promise<CapriItem[]> {
  const { data, error } = await supabase
    .from("capri_items")
    .select("id, section, pillar, subdimension, item_type, prompt, order_index")
    .eq("instrument_version", version)
    .eq("is_active", true)
    .order("pillar", { ascending: true })
    .order("order_index", { ascending: true });

  if (error) {
    throw new Error(`[capri] could not load items: ${error.message}`);
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    section: row.section as CapriItem["section"],
    pillar: row.pillar as CapriPillar,
    subdimension: row.subdimension,
    itemType: row.item_type as CapriItem["itemType"],
    prompt: row.prompt,
    orderIndex: row.order_index,
  }));
}

/**
 * Administrations are provisioned lazily per institution on first access.
 * Requires an elevated client — students cannot insert administrations, and
 * that is intentional.
 */
export async function ensureAdministration(
  adminClient: DbClient,
  institutionId: string,
  administrationType: AdministrationType,
  version: string = CAPRI_INSTRUMENT_VERSION
): Promise<string> {
  const { data: existing } = await adminClient
    .from("capri_administrations")
    .select("id")
    .eq("institution_id", institutionId)
    .eq("administration_type", administrationType)
    .eq("instrument_version", version)
    .maybeSingle();

  if (existing?.id) return existing.id;

  const { data, error } = await adminClient
    .from("capri_administrations")
    .insert({
      institution_id: institutionId,
      administration_type: administrationType,
      instrument_version: version,
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(
      `[capri] could not create ${administrationType} administration: ${error?.message}`
    );
  }
  return data.id;
}

/**
 * Read-only lookup used when rendering the assessment. Pages must not create
 * rows during render — the response is opened by the first autosave instead.
 */
export async function findResponse(
  supabase: DbClient,
  institutionId: string,
  studentId: string,
  administrationType: AdministrationType,
  version: string = CAPRI_INSTRUMENT_VERSION
): Promise<{ id: string; submittedAt: string | null } | null> {
  const { data: administration } = await supabase
    .from("capri_administrations")
    .select("id")
    .eq("institution_id", institutionId)
    .eq("administration_type", administrationType)
    .eq("instrument_version", version)
    .maybeSingle();

  if (!administration?.id) return null;

  const { data } = await supabase
    .from("capri_responses")
    .select("id, submitted_at")
    .eq("administration_id", administration.id)
    .eq("student_id", studentId)
    .maybeSingle();

  return data ? { id: data.id, submittedAt: data.submitted_at } : null;
}

export async function getOrCreateResponse(
  supabase: DbClient,
  administrationId: string,
  studentId: string
): Promise<{ id: string; submittedAt: string | null; startedAt: string }> {
  const { data: existing } = await supabase
    .from("capri_responses")
    .select("id, submitted_at, started_at")
    .eq("administration_id", administrationId)
    .eq("student_id", studentId)
    .maybeSingle();

  if (existing) {
    return {
      id: existing.id,
      submittedAt: existing.submitted_at,
      startedAt: existing.started_at,
    };
  }

  const { data, error } = await supabase
    .from("capri_responses")
    .insert({ administration_id: administrationId, student_id: studentId })
    .select("id, submitted_at, started_at")
    .single();

  if (error || !data) {
    throw new Error(`[capri] could not open a response: ${error?.message}`);
  }

  return {
    id: data.id,
    submittedAt: data.submitted_at,
    startedAt: data.started_at,
  };
}

export async function fetchAnswers(
  supabase: DbClient,
  responseId: string
): Promise<CapriAnswer[]> {
  const { data, error } = await supabase
    .from("capri_answers")
    .select("item_id, rating_context, raw_value")
    .eq("response_id", responseId);

  if (error) {
    throw new Error(`[capri] could not load answers: ${error.message}`);
  }

  return (data ?? []).map((row) => ({
    itemId: row.item_id,
    ratingContext: row.rating_context as RatingContext,
    rawValue: row.raw_value,
  }));
}

/**
 * Save-and-resume. Only ever called on an unsubmitted response — the database
 * policy enforces that too, so a late write fails rather than corrupting a
 * baseline.
 */
export async function saveAnswers(
  supabase: DbClient,
  responseId: string,
  answers: CapriAnswer[],
  version: string = CAPRI_INSTRUMENT_VERSION
): Promise<void> {
  if (answers.length === 0) return;

  const { error } = await supabase.from("capri_answers").upsert(
    answers.map((answer) => ({
      response_id: responseId,
      instrument_version: version,
      item_id: answer.itemId,
      rating_context: answer.ratingContext,
      raw_value: answer.rawValue,
    })),
    { onConflict: "response_id,item_id,rating_context" }
  );

  if (error) {
    throw new Error(`[capri] could not save answers: ${error.message}`);
  }
}

/** Flattens a ScoredResponse into capri_scores rows. */
function scoreRows(
  responseId: string,
  scored: ScoredResponse,
  version: string
) {
  const rows: {
    response_id: string;
    instrument_version: string;
    scope: string;
    scope_id: string;
    rating_context: RatingContext;
    value: number;
  }[] = [];

  const base = {
    response_id: responseId,
    instrument_version: version,
    rating_context: scored.ratingContext,
  };

  for (const [id, value] of Object.entries(scored.subdimensions)) {
    rows.push({ ...base, scope: "subdimension", scope_id: id, value });
  }
  for (const [pillar, value] of Object.entries(scored.pillars)) {
    rows.push({ ...base, scope: "pillar", scope_id: pillar, value });
  }
  rows.push({
    ...base,
    scope: "composite",
    scope_id: "composite",
    value: scored.composite,
  });
  if (scored.bei !== null) {
    rows.push({ ...base, scope: "bei", scope_id: "bei", value: scored.bei });
  }

  return rows;
}

/**
 * Marks a response submitted and materialises its scores.
 *
 * Scores are stored, not recomputed on read, and carry the instrument version
 * so any figure in a delivered report can be reproduced exactly later.
 */
export async function submitResponse(
  adminClient: DbClient,
  params: {
    responseId: string;
    items: CapriItem[];
    answers: CapriAnswer[];
    durationSeconds: number | null;
    includeRetrospective: boolean;
    version?: string;
  }
): Promise<{ current: ScoredResponse; retrospective: ScoredResponse | null }> {
  const version = params.version ?? CAPRI_INSTRUMENT_VERSION;

  const current = scoreResponse(params.items, params.answers, "current");
  const retrospective = params.includeRetrospective
    ? scoreResponse(params.items, params.answers, "retrospective")
    : null;

  const rows = [
    ...scoreRows(params.responseId, current, version),
    ...(retrospective ? scoreRows(params.responseId, retrospective, version) : []),
  ];

  const { error: scoreError } = await adminClient
    .from("capri_scores")
    .upsert(rows, { onConflict: "response_id,scope,scope_id,rating_context" });

  if (scoreError) {
    throw new Error(`[capri] could not persist scores: ${scoreError.message}`);
  }

  const { error: submitError } = await adminClient
    .from("capri_responses")
    .update({
      submitted_at: new Date().toISOString(),
      duration_seconds: params.durationSeconds,
    })
    .eq("id", params.responseId);

  if (submitError) {
    throw new Error(`[capri] could not submit response: ${submitError.message}`);
  }

  return { current, retrospective };
}

/**
 * Has this student genuinely completed the Week 12 post? Gates the certificate.
 * A timestamp alone is not enough: the response must have saved answers and a
 * stored composite score, which only submitResponse() writes after scoring a
 * complete set. Elevated client — institutional admins cannot read scores.
 */
export async function hasSubmittedPost(
  adminClient: DbClient,
  studentId: string
): Promise<boolean> {
  const { data: responses } = await adminClient
    .from("capri_responses")
    .select("id, capri_administrations!inner(administration_type)")
    .eq("student_id", studentId)
    .eq("capri_administrations.administration_type", "post")
    .not("submitted_at", "is", null);

  for (const response of responses ?? []) {
    const [{ count: answers }, { count: composite }] = await Promise.all([
      adminClient
        .from("capri_answers")
        .select("id", { count: "exact", head: true })
        .eq("response_id", response.id),
      adminClient
        .from("capri_scores")
        .select("id", { count: "exact", head: true })
        .eq("response_id", response.id)
        .eq("scope", "composite")
        .eq("rating_context", "current"),
    ]);
    if (answers && composite) return true;
  }
  return false;
}

export type StudentCompositeRow = {
  studentId: string;
  administrationType: AdministrationType;
  ratingContext: RatingContext;
  scope: string;
  scopeId: string;
  value: number;
};

/**
 * Every stored score for one institution, for cohort aggregation.
 * Elevated client only: individual scores never reach an institutional admin.
 */
export async function fetchInstitutionScores(
  adminClient: DbClient,
  institutionId: string
): Promise<StudentCompositeRow[]> {
  const { data, error } = await adminClient
    .from("capri_scores")
    .select(
      "scope, scope_id, rating_context, value, capri_responses!inner(student_id, submitted_at, capri_administrations!inner(administration_type, institution_id))"
    )
    .eq(
      "capri_responses.capri_administrations.institution_id",
      institutionId
    )
    .not("capri_responses.submitted_at", "is", null);

  if (error) {
    throw new Error(`[capri] could not load institution scores: ${error.message}`);
  }

  type JoinedRow = {
    scope: string;
    scope_id: string;
    rating_context: string;
    value: number;
    capri_responses: {
      student_id: string;
      capri_administrations: { administration_type: string };
    };
  };

  return (data as unknown as JoinedRow[]).map((row) => ({
    studentId: row.capri_responses.student_id,
    administrationType: row.capri_responses.capri_administrations
      .administration_type as AdministrationType,
    ratingContext: row.rating_context as RatingContext,
    scope: row.scope,
    scopeId: row.scope_id,
    value: Number(row.value),
  }));
}

/**
 * Per-pillar direction of change, baseline → post, for one student's own
 * portfolio. Returns null unless both administrations are submitted and every
 * pillar has a `current` score in each. Scores stay inside this function —
 * only the direction leaves it.
 */
export async function fetchStudentReadinessDirections(
  supabase: DbClient,
  studentId: string,
  version: string = CAPRI_INSTRUMENT_VERSION
): Promise<Record<CapriPillar, ReadinessDirection> | null> {
  const { data, error } = await supabase
    .from("capri_scores")
    .select(
      "scope_id, value, capri_responses!inner(student_id, submitted_at, capri_administrations!inner(administration_type))"
    )
    .eq("scope", "pillar")
    .eq("rating_context", "current")
    .eq("instrument_version", version)
    .eq("capri_responses.student_id", studentId)
    .not("capri_responses.submitted_at", "is", null);

  if (error || !data) return null;

  type JoinedRow = {
    scope_id: string;
    value: number;
    capri_responses: {
      capri_administrations: { administration_type: string };
    };
  };

  const baseline = new Map<string, number>();
  const post = new Map<string, number>();
  for (const row of data as unknown as JoinedRow[]) {
    const type = row.capri_responses.capri_administrations.administration_type;
    if (type === "baseline") baseline.set(row.scope_id, Number(row.value));
    if (type === "post") post.set(row.scope_id, Number(row.value));
  }

  const pillars: CapriPillar[] = [1, 2, 3];
  const directions = {} as Record<CapriPillar, ReadinessDirection>;
  for (const pillar of pillars) {
    const before = baseline.get(String(pillar));
    const after = post.get(String(pillar));
    if (before === undefined || after === undefined) return null;
    directions[pillar] = readinessDirection(before, after);
  }
  return directions;
}
