import {
  formatCaptureSince,
  type QuestionAnalysis,
} from "@/lib/quiz-analysis";

export function QuestionAnalysisTable({
  analysis,
  correctLabels,
}: {
  analysis: QuestionAnalysis[];
  correctLabels: Map<string, string>;
}) {
  const anyAnswers = analysis.some((q) => q.studentsAnswered > 0);

  return (
    <section className="space-y-3 rounded-xl border border-border p-4">
      <div className="space-y-1">
        <h2 className="font-semibold">Question performance</h2>
        <p className="text-xs text-muted-foreground">
          First attempt per student, demo students excluded. Covers attempts since
          answer recording began on {formatCaptureSince()}; earlier attempts kept
          only a score. A question most students miss usually points to a
          confusing question or a gap in the module.
        </p>
      </div>

      {!anyAnswers ? (
        <p className="text-sm text-muted-foreground">
          No answers recorded for this module yet.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-3 py-2 font-medium">#</th>
                <th className="px-3 py-2 font-medium">Question</th>
                <th className="px-3 py-2 font-medium">Correct</th>
                <th className="px-3 py-2 font-medium">Most-chosen wrong answer</th>
              </tr>
            </thead>
            <tbody>
              {analysis.map((q) => (
                <tr key={q.questionId} className="border-t align-top">
                  <td className="px-3 py-2 text-muted-foreground">{q.orderIndex}</td>
                  <td className="px-3 py-2">
                    <p>{q.question}</p>
                    {correctLabels.get(q.questionId) ? (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Answer: {correctLabels.get(q.questionId)}
                      </p>
                    ) : null}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2">
                    {q.correctRate == null ? (
                      <span className="text-muted-foreground">—</span>
                    ) : (
                      <>
                        <span
                          className={
                            q.correctRate < 50 ? "font-semibold text-destructive" : ""
                          }
                        >
                          {q.correctRate}%
                        </span>{" "}
                        <span className="text-muted-foreground">
                          ({q.studentsCorrect} of {q.studentsAnswered})
                        </span>
                      </>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {q.mostChosenWrong ? (
                      <>
                        {q.mostChosenWrong.label}{" "}
                        <span className="text-muted-foreground">
                          ({q.mostChosenWrong.count})
                        </span>
                      </>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
