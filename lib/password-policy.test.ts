import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  PASSWORD_MIN_LENGTH,
  PASSWORD_RULES,
  passwordErrorMessage,
  passwordMeetsPolicy,
} from "./password-policy";

describe("password policy", () => {
  it("requires 12 characters and no character class", () => {
    assert.equal(PASSWORD_MIN_LENGTH, 12);
    assert.deepEqual(PASSWORD_RULES.map((rule) => rule.id), ["length"]);
    assert.equal(passwordMeetsPolicy("short-pass"), false);
    assert.equal(passwordMeetsPolicy("longenough12"), true);
  });

  it("maps a leaked-password rejection to a written sentence", () => {
    const message = passwordErrorMessage({
      message: "Password is known to have been leaked and is not safe.",
      code: "weak_password",
      name: "AuthWeakPasswordError",
      reasons: ["pwned"],
    });
    assert.equal(
      message,
      "That password has appeared in a known data breach. Please choose another."
    );
    assert.doesNotMatch(message, /leaked and is not safe/);
  });
});
