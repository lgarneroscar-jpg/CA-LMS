import { timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { generateDueSnapshotsForAllInstitutions } from "@/lib/reports";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function secretsEqual(provided: string, expected: string): boolean {
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) {
    // Still run timingSafeEqual on equal-length buffers to avoid leaking length
    // via early return timing alone for the compare path — pad to expected length.
    const padded = Buffer.alloc(b.length);
    a.copy(padded);
    timingSafeEqual(padded, b);
    return false;
  }
  return timingSafeEqual(a, b);
}

function authorize(request: Request): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    console.error("[cron/generate-snapshots] CRON_SECRET is not set");
    return false;
  }

  const header = request.headers.get("authorization");
  const bearer = header?.startsWith("Bearer ") ? header.slice(7) : null;
  const query = new URL(request.url).searchParams.get("secret");
  const provided = bearer ?? query ?? "";

  return secretsEqual(provided, expected);
}

export async function GET(request: Request) {
  if (!authorize(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const results = await generateDueSnapshotsForAllInstitutions("cron");
    const summary = {
      created: results.filter((r) => r.status === "created").length,
      already_exists: results.filter((r) => r.status === "already_exists").length,
      updated: results.filter((r) => r.status === "updated").length,
      skipped: results.filter((r) => r.status === "skipped").length,
      error: results.filter((r) => r.status === "error").length,
    };

    console.info("[cron/generate-snapshots]", summary);

    // Optional: refresh Demo University fixtures on the same schedule.
    // Off by default — set SEED_DEMO_ON_CRON=true only in environments that
    // should touch demo data (never production buyer institutions).
    if (process.env.SEED_DEMO_ON_CRON === "true") {
      try {
        const { spawnSync } = await import("node:child_process");
        const result = spawnSync("npm", ["run", "seed:demo"], {
          cwd: process.cwd(),
          env: process.env,
          encoding: "utf8",
        });
        if (result.status !== 0) {
          console.error(
            "[cron/generate-snapshots] seed:demo failed",
            result.stderr || result.stdout
          );
        } else {
          console.info("[cron/generate-snapshots] seed:demo completed");
        }
      } catch (seedErr) {
        console.error("[cron/generate-snapshots] seed:demo failed", seedErr);
      }
    }

    return NextResponse.json({ summary, results });
  } catch (err) {
    console.error("[cron/generate-snapshots]", err);
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Snapshot generation failed",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  return GET(request);
}
