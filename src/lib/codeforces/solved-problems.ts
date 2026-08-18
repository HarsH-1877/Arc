export type CodeforcesProblemIdentity = {
  contestId?: number | string | null;
  index?: string | null;
  name: string;
};

export type CodeforcesSubmissionIdentity = CodeforcesProblemIdentity & {
  verdict?: string | null;
};

const ACCEPTED_VERDICTS = new Set(['OK', 'AC', 'Accepted']);

export function getCodeforcesProblemKey(problem: CodeforcesProblemIdentity): string {
  const contestId = problem.contestId == null ? '' : String(problem.contestId);
  const index = problem.index?.trim();

  if (contestId && index) return `${contestId}:${index}`;

  return `practice:${problem.name.trim().toLowerCase().replace(/\s+/g, '-')}`;
}

export function getStoredCodeforcesProblemKey(problem: {
  problemSlug: string | null;
  contestId: string | null;
  problemName: string;
}): string {
  if (problem.problemSlug) return problem.problemSlug;
  if (problem.contestId) return `${problem.contestId}:${problem.problemName}`;
  return getCodeforcesProblemKey({ name: problem.problemName });
}

export function getUniqueAcceptedCodeforcesProblems(
  submissions: CodeforcesSubmissionIdentity[],
): Set<string> {
  return new Set(
    submissions
      .filter((submission) => ACCEPTED_VERDICTS.has(submission.verdict ?? ''))
      .map(getCodeforcesProblemKey),
  );
}
