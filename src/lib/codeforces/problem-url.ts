export function getCodeforcesProblemUrl(
  contestId: string,
  problemSlug: string | null,
): string | null {
  const prefix = `${contestId}:`;
  if (!problemSlug?.startsWith(prefix)) return null;

  const index = problemSlug.slice(prefix.length).trim();
  return index ? `https://codeforces.com/contest/${contestId}/problem/${index}` : null;
}
