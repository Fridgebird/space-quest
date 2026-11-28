// Marks the Space Corps Entrance Examination. Used by the tablet (which only ever says PASS
// or FAIL) and by Mission Control (which shows you the score).
window.ExamMarking = (function () {
  const norm = (s) => String(s).toLowerCase().replace(/[^a-z0-9]/g, "");
  function isRight(q, value) {
    if (value == null || value === "") return false;
    if (q.options) return Number(value) === q.answer;
    return (q.accept || []).some((a) => norm(a) === norm(value));
  }
  return {
    isRight,
    // answers: { q0: 1, q9: "typed answer" }
    answered(answers) { return EXAM.questions.filter((q, i) => answers && answers["q" + i] != null && answers["q" + i] !== "").length; },
    score(answers) { return EXAM.questions.filter((q, i) => isRight(q, answers && answers["q" + i])).length; },
    passes(answers) { return this.score(answers) >= EXAM.passMark; }
  };
})();
