import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { parseRosterCsv } from "./roster-csv";
import {
  FREE_EMAIL_DOMAINS,
  PREVIEW_REQUEST_SUCCESS_MESSAGE,
  classifyPreviewRequest,
  isDisposableEmailDomain,
  workEmailMessage,
} from "./preview-request";

describe("classifyPreviewRequest", () => {
  it("uses one success sentence for the cases that must not be distinguished", () => {
    assert.match(PREVIEW_REQUEST_SUCCESS_MESSAGE, /if that address is eligible/i);
  });

  it("treats a filled honeypot as success-shaped and does not validate the email", () => {
    const decision = classifyPreviewRequest({
      email: "not-an-email",
      company: "Acme",
    });
    assert.equal(decision.kind, "honeypot");
  });

  it("ignores a blank honeypot", () => {
    const decision = classifyPreviewRequest({
      email: "ada@career.university.edu",
      company: "   ",
    });
    assert.equal(decision.kind, "ready");
  });

  it("rejects a malformed address", () => {
    const decision = classifyPreviewRequest({ email: "ada@" });
    assert.equal(decision.kind, "invalid_email");
    if (decision.kind === "invalid_email") {
      assert.match(decision.message, /valid email/i);
    }
  });

  it("rejects every consumer domain on the blocklist and not a .edu-only rule", () => {
    for (const domain of FREE_EMAIL_DOMAINS) {
      const decision = classifyPreviewRequest({ email: `ada@${domain}` });
      assert.equal(decision.kind, "blocked_domain", domain);
    }
    const headquarters = classifyPreviewRequest({
      email: "director@fraternityhq.org",
    });
    assert.equal(headquarters.kind, "ready");
  });

  it("asks for a work address and includes the calendly link when one is configured", () => {
    const message = workEmailMessage("https://calendly.com/example/intro");
    assert.match(message, /institutional or work address/i);
    assert.match(message, /https:\/\/calendly.com\/example\/intro/);
  });

  it("rejects a disposable domain when the list says so", () => {
    const decision = classifyPreviewRequest(
      { email: "ada@mailinator.com" },
      { isDisposable: (domain) => domain === "mailinator.com" }
    );
    assert.equal(decision.kind, "blocked_domain");
  });

  it("matches a parent disposable domain", () => {
    const list = new Set(["mailinator.com"]);
    assert.equal(isDisposableEmailDomain("a.mailinator.com", list), true);
    assert.equal(isDisposableEmailDomain("university.edu", list), false);
  });
});

describe("parseRosterCsv under_18", () => {
  it("defaults the flag to false when the column is absent", () => {
    const parsed = parseRosterCsv("full_name,email\nAda Lovelace,ada@university.edu\n");
    assert.equal(parsed.issues.length, 0);
    assert.equal(parsed.rows[0]?.under_18, false);
  });

  it("reads yes and no, and rejects anything else", () => {
    const parsed = parseRosterCsv(
      "name,email,under_18\nAda,ada@university.edu,yes\nGrace,grace@university.edu,no\nLin,lin@university.edu,maybe\n"
    );
    assert.deepEqual(
      parsed.rows.map((row) => [row.email, row.under_18]),
      [
        ["ada@university.edu", true],
        ["grace@university.edu", false],
      ]
    );
    assert.equal(parsed.issues.length, 1);
    assert.match(parsed.issues[0]?.message ?? "", /yes or no/);
  });
});

describe("preview request widget", () => {
  const html = readFileSync(
    new URL("../public/preview-request.html", import.meta.url),
    "utf8"
  );

  it("keeps the consumer blocklist in the embed", () => {
    for (const domain of FREE_EMAIL_DOMAINS) {
      assert.ok(html.includes(`"${domain}"`), domain);
    }
  });

  it("is a real form with an off-screen honeypot", () => {
    assert.match(html, /<form\b/);
    assert.match(html, /<button type="submit"/);
    assert.match(html, /aria-hidden="true"/);
    assert.match(html, /tabindex="-1"/);
    assert.match(html, /name="company"/);
    assert.match(html, /<label for="corp-preview-email"/);
  });
});
