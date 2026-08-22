import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";
import {
  assertQuizBank,
  loadWorkbookSeedFromFile,
  parseWorkbookSeedMarkdown,
} from "./workbook-seed-parser";

const SEED_PATH = join(process.cwd(), "workbook-content-seed.md");

describe("parseWorkbookSeedMarkdown quiz parsing", () => {
  it("parses pipe-delimited options and resolves comma-list answer keys", () => {
    const markdown = readFileSync(SEED_PATH, "utf8");
    const modules = parseWorkbookSeedMarkdown(markdown);
    const p3 = modules.find((module) => module.module_code === "P3");
    assert.ok(p3);
    const q4 = p3!.quiz[3];
    assert.equal(q4.options.length, 4);
    assert.equal(q4.options[1].label, "Reps, wins, identity");
    assert.equal(q4.correct_answer, "1");
  });

  it("throws when the answer key does not match any option", () => {
    const markdown = `
## P99 — Test Module
**slug:** \`test-module\`
**pillar:** 1 | **unlock_week:** 1

### overview
Test

### concepts
1. **One** — Body

### frameworks
1. **Framework** — Body

### exercises
1. **Exercise** | input_type: \`reflection\` | Do it | fields: One field

### application
- Example

### completion_check
- Done

### quiz
1. Broken question? | [A | B | C | D] | correct: Missing option
`;
    assert.throws(
      () => parseWorkbookSeedMarkdown(markdown),
      /P99 Q1: correct answer "Missing option" does not match any option/
    );
  });
});

describe("assertQuizBank", () => {
  it("validates all 14 modules and 56 questions with 4 options each", () => {
    const modules = loadWorkbookSeedFromFile(SEED_PATH);
    assertQuizBank(modules);
    assert.equal(
      modules.reduce((count, module) => count + module.quiz.length, 0),
      56
    );
  });

  it("matches Oscar's approved P5 Q1 revision", () => {
    const modules = loadWorkbookSeedFromFile(SEED_PATH);
    const p5 = modules.find((module) => module.module_code === "P5");
    assert.ok(p5);
    const q1 = p5!.quiz[0];
    assert.equal(q1.question, 'What is a "win" evidence of?');
    assert.deepEqual(
      q1.options.map((option) => option.label),
      [
        "Building a large professional network",
        "Ownership, responsibility, reliability, growth",
        "Securing an executive board position",
        "Ranking near the top of your class",
      ]
    );
    assert.equal(q1.correct_answer, "1");
  });

  it("matches Oscar's approved P4 Q1 revision", () => {
    const modules = loadWorkbookSeedFromFile(SEED_PATH);
    const p4 = modules.find((module) => module.module_code === "P4");
    assert.ok(p4);
    const q1 = p4!.quiz[0];
    assert.equal(q1.options[0].label, '"I contributed" vs "I participated"');
    assert.equal(q1.correct_answer, "0");
  });
});
