const test = require('node:test');
const assert = require('node:assert/strict');

const {
  getCodeforcesProblemKey,
  getStoredCodeforcesProblemKey,
  getUniqueAcceptedCodeforcesProblems,
} = require('../.test-build/solved-problems.js');

test('counts every unique accepted Codeforces problem, including unrated problems', () => {
  const accepted = getUniqueAcceptedCodeforcesProblems([
    { contestId: 1000, index: 'A', name: 'Alpha', verdict: 'OK' },
    { contestId: 1000, index: 'A', name: 'Alpha', verdict: 'OK' },
    { contestId: 1000, index: 'B', name: 'Beta', verdict: 'OK' },
    { contestId: undefined, index: 'A', name: 'Practice problem', verdict: 'OK' },
    { contestId: 1001, index: 'A', name: 'Rejected', verdict: 'WRONG_ANSWER' },
  ]);

  assert.equal(accepted.size, 3);
  assert.ok(accepted.has('1000:A'));
  assert.ok(accepted.has('practice:practice-problem'));
});

test('prefers Codeforces contest and index over a repeated problem name', () => {
  assert.equal(
    getCodeforcesProblemKey({ contestId: 1200, index: 'C', name: 'Duplicate title' }),
    '1200:C',
  );
});

test('keeps legacy stored submissions distinct until their next full sync', () => {
  assert.equal(
    getStoredCodeforcesProblemKey({ problemSlug: null, contestId: '1200', problemName: 'Duplicate title' }),
    '1200:Duplicate title',
  );
});
