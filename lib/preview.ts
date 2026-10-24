/**
 * The institution prospects are invited into to try the program (displayed as
 * "Northfield University", formerly "Demo University"; always referenced by id).
 * Same id as DEMO_INSTITUTION_ID in scripts/seed-demo-cohort.ts, whose seeded
 * cohort fills it out. Must be is_demo: answers there are forced private and
 * its students are excluded from every cross-institution figure.
 */
export const PREVIEW_INSTITUTION_ID = "ffc653d3-da74-4141-afa5-be70d6eaf1c8";

/**
 * The older one-student fixture institution ("Demo Preview"). Distinct from
 * PREVIEW_INSTITUTION_ID. Referenced by id so a rename cannot move seeded
 * demo progress, which is what /api/create-user attaches.
 */
export const DEMO_PREVIEW_INSTITUTION_ID = "60b990ac-5f7e-4612-abcd-1e894aa85ad9";
