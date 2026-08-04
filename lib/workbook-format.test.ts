import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  detectArrowChain,
  detectColonList,
  detectContrastGroups,
  detectEnumeration,
  detectSignalRewrite,
  detectWeekTimeline,
  formatWorkbookBody,
  splitTopLevel,
} from "./workbook-format";

const IDENTITY_ANCHORS =
  "Choose 2–3 traits you want people to associate with you early: Clear communicator, Reliable executor, Always prepared, Organized and structured, Connector of people and information, Calm and composed. These are your identity anchors.";

const SIX_QUALITIES =
  "Six qualities create the rising star narrative: Coachability (do you listen, adjust, grow?), Initiative (do you act without being asked twice?), Communication (clean updates, clear questions?), Reliability (do you deliver what you say?), Team Compatibility (do people like working with you?), Learning Velocity (are you getting better each week?). Managers aren't evaluating how much you know.";

const IDENTITY_GAP =
  "You operate with two identities at once. Student Identity: waits for instructions, asks permission before acting, completes tasks but doesn't own outcomes, communicates reactively. Pre-Professional Identity: takes initiative, communicates with clarity, follows up and closes loops, thinks ahead for the group. The gap between these is what others notice first. Your goal is to close it intentionally.";

const MESSAGE_TEMPLATE =
  'Message template: "Hey ___, I\'m interning with the ___ team this summer and would love to learn more about what you do. Would you be open to a 10-minute chat sometime next week?" Goal: 10 meaningful conversations → 10x future clarity.';

describe("splitTopLevel", () => {
  it("does not split inside parentheses", () => {
    const parts = splitTopLevel(
      "Coachability (do you listen, adjust, grow?), Initiative (do you act without being asked twice?)"
    );
    assert.equal(parts.length, 2);
    assert.match(parts[0], /listen, adjust, grow/);
  });

  it("does not split inside quotes", () => {
    const parts = splitTopLevel(
      '"Hey ___, I\'m interning with the ___ team", trailing'
    );
    assert.equal(parts.length, 2);
    assert.match(parts[0], /Hey ___/);
  });
});

describe("detectColonList", () => {
  it("parses Identity Anchors trait list", () => {
    const result = detectColonList(IDENTITY_ANCHORS);
    assert.ok(result);
    assert.equal(result!.items.length, 6);
    assert.equal(result!.useChips, false);
  });

  it("parses six qualities without shattering parentheticals", () => {
    const result = detectColonList(SIX_QUALITIES);
    assert.ok(result);
    assert.equal(result!.items.length, 6);
    assert.equal(result!.items[0], "Coachability (do you listen, adjust, grow?)");
    assert.match(result!.outro ?? "", /Managers aren't evaluating/i);
  });

  it("does not match plain prose", () => {
    assert.equal(
      detectColonList(
        "Most students think careers start with skills. They don't — they start with identity."
      ),
      null
    );
  });

  it("does not match a prose sentence that merely contains a colon", () => {
    assert.equal(
      detectColonList(
        "Remember: professional environments respond to signals, not effort alone, and that changes how you show up every day."
      ),
      null
    );
  });

  it("does not shatter a quoted message template", () => {
    assert.equal(detectColonList(MESSAGE_TEMPLATE), null);
  });

  it("does not flatten a two-identity contrast into one list", () => {
    assert.equal(detectColonList(IDENTITY_GAP), null);
  });
});

describe("detectContrastGroups", () => {
  it("parses Identity Gap as two labelled mini-lists", () => {
    const result = detectContrastGroups(IDENTITY_GAP);
    assert.ok(result);
    assert.equal(result!.groups.length, 2);
    assert.equal(result!.groups[0].label, "Student Identity");
    assert.equal(result!.groups[0].items.length, 4);
    assert.equal(result!.groups[1].label, "Pre-Professional Identity");
    assert.equal(result!.groups[1].items.length, 4);
    assert.ok(
      !result!.groups.some((g) =>
        g.items.some((item) => /Pre-Professional Identity/i.test(item))
      )
    );
    assert.match(result!.intro ?? "", /two identities/i);
    assert.match(result!.outro ?? "", /gap between these/i);
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

  it("keeps Identity Anchors as a colon list", () => {
    const result = formatWorkbookBody(IDENTITY_ANCHORS);
    assert.equal(result.type, "colon_list");
    if (result.type === "colon_list") assert.equal(result.items.length, 6);
  });

  it("keeps six qualities as a 6-item colon list", () => {
    const result = formatWorkbookBody(SIX_QUALITIES);
    assert.equal(result.type, "colon_list");
    if (result.type === "colon_list") assert.equal(result.items.length, 6);
  });

  it("renders Identity Gap as contrast_groups, not a flat list", () => {
    const result = formatWorkbookBody(IDENTITY_GAP);
    assert.equal(result.type, "contrast_groups");
    if (result.type === "contrast_groups") {
      assert.equal(result.groups.length, 2);
      assert.equal(result.groups[0].items.length, 4);
      assert.equal(result.groups[1].items.length, 4);
    }
  });

  it("falls back to prose for quoted message templates", () => {
    const result = formatWorkbookBody(MESSAGE_TEMPLATE);
    assert.equal(result.type, "prose");
  });

  it("prefers signal rewrite over colon list when both could match", () => {
    const result = formatWorkbookBody(
      'Example: "I\'m not sure what to do." → "Here\'s my proposed next step, does that align?"'
    );
    assert.equal(result.type, "signal_rewrite");
  });

  it("prefers arrow chain over colon list", () => {
    const result = formatWorkbookBody(
      "Identity compounds through visibility: Clear behavior → Trust → Visible Execution → more responsibility → (repeat). The earlier this flywheel starts, the faster your career accelerates."
    );
    assert.equal(result.type, "arrow_chain");
  });
});
