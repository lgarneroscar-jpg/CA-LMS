import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  detectArrowChain,
  detectColonList,
  detectEnumeration,
  detectSignalRewrite,
  detectWeekTimeline,
  formatWorkbookBody,
} from "./workbook-format";

describe("detectColonList", () => {
  it("parses Identity Anchors trait list", () => {
    const result = detectColonList(
      "Choose 2–3 traits you want people to associate with you early: Clear communicator, Reliable executor, Always prepared, Organized and structured, Connector of people and information, Calm and composed. These are your identity anchors."
    );
    assert.ok(result);
    assert.equal(result!.items.length, 6);
    assert.equal(result!.useChips, false);
  });

  it("does not match plain prose", () => {
    assert.equal(
      detectColonList(
        "Most students think careers start with skills. They don't — they start with identity."
      ),
      null
    );
  });
});

describe("detectArrowChain", () => {
  it("parses Identity Flywheel steps", () => {
    const result = detectArrowChain(
      "Identity compounds through visibility: Clear behavior → Trust → Visible Execution → more responsibility → (repeat). The earlier this flywheel starts, the faster your career accelerates."
    );
    assert.ok(result);
    assert.equal(result!.steps.length, 4);
    assert.match(result!.steps[0], /Clear behavior/i);
  });

  it("does not match quoted signal rewrite only", () => {
    assert.equal(
      detectArrowChain(
        'Example: "I\'m not sure what to do." → "Here\'s my proposed next step, does that align?"'
      ),
      null
    );
  });
});

describe("detectSignalRewrite", () => {
  it("parses before/after quoted pairs", () => {
    const result = detectSignalRewrite(
      'Example: "I\'m not sure what to do." → "Here\'s my proposed next step, does that align?"'
    );
    assert.ok(result);
    assert.equal(result!.pairs.length, 1);
    assert.match(result!.pairs[0].before, /not sure/i);
  });

  it("does not match prose without arrows", () => {
    assert.equal(
      detectSignalRewrite("Identity does not come from self-belief. It comes from repetition."),
      null
    );
  });
});

describe("detectWeekTimeline", () => {
  it("parses three or more week beats", () => {
    const result = detectWeekTimeline(
      "Maya joined a student org. Week 1: She observed meetings quietly. Week 2: She volunteered for logistics. Week 3: She sent a recap email. Week 4: She was asked to lead."
    );
    assert.ok(result);
    assert.equal(result!.beats.length, 4);
  });

  it("does not match fewer than three weeks", () => {
    assert.equal(
      detectWeekTimeline("Week 1: Start. Week 2: Continue."),
      null
    );
  });
});

describe("detectEnumeration", () => {
  it("parses numbered parenthetical items", () => {
    const result = detectEnumeration(
      "Signals include (1) clean updates, (2) prepared questions, and (3) follow-through."
    );
    assert.ok(result);
    assert.equal(result!.items.length, 3);
  });

  it("does not match prose", () => {
    assert.equal(
      detectEnumeration("Your reputation forms from small, repeatable cues."),
      null
    );
  });
});

describe("formatWorkbookBody", () => {
  it("falls back to prose for unstructured text", () => {
    const result = formatWorkbookBody(
      "Professional environments do not grade effort or intent. They respond to signals."
    );
    assert.equal(result.type, "prose");
  });
});
