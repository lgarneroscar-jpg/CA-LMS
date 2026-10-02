import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { gradeQuizSubmission } from "./quiz-grading";

const options = [
  { id: "a", label: "A" },
  { id: "b", label: "B" },
  { id: "c", label: "C" },
];

const questions = [
  { id: "q1", options, correct_answer: "a" },
  { id: "q2", options, correct_answer: "b" },
];

describe("gradeQuizSubmission", () => {
  it("grades against the stored key", () => {
    const graded = gradeQuizSubmission(
      questions,
      { q1: "a", q2: "c" },
      ["q1", "q2"]
    );
    assert.deepEqual(
      graded.map((g) => g.isCorrect),
      [true, false]
    );
    assert.equal(graded[1].chosenOption, "c");
  });

  it("rejects a question from outside the module", () => {
    assert.throws(() =>
      gradeQuizSubmission(questions, { q1: "a", q2: "b", qX: "a" }, ["q1", "q2"])
    );
    assert.throws(() =>
      gradeQuizSubmission(questions, { q1: "a", qX: "a" }, ["q1", "qX"])
    );
  });

  it("rejects an option the question does not offer", () => {
    assert.throws(() =>
      gradeQuizSubmission(questions, { q1: "a", q2: "z" }, ["q1", "q2"])
    );
  });

  it("rejects partial, duplicated, or blank submissions", () => {
    assert.throws(() => gradeQuizSubmission(questions, { q1: "a" }, ["q1"]));
    assert.throws(() =>
      gradeQuizSubmission(questions, { q1: "a", q2: "b" }, ["q1", "q1"])
    );
    assert.throws(() =>
      gradeQuizSubmission(questions, { q1: "a" }, ["q1", "q2"])
    );
  });

  it("supports legacy options stored as bare labels by index", () => {
    const legacy = [{ id: "q1", options: ["Yes", "No"], correct_answer: "1" }];
    const graded = gradeQuizSubmission(legacy, { q1: "1" }, ["q1"]);
    assert.equal(graded[0].isCorrect, true);
  });
});
