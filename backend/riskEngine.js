// Scores a candidate's answer based on timing + typing behavior.
// Same function is used for every question type - MCQ just uses different
// signals (hover/click) than the text-based ones (typing rhythm, paste).
// Never flag on one signal alone, and don't trust cohort stats unless
// there's a decent number of candidates yet.

const MIN_COHORT = 5;
const FAST_TYPING_CPS_LIMIT = 12; // characters per second — above this without a paste event is suspicious
const IDLE_THRESHOLD_MS = 20000; // 20s of no input counts as "idle"

function mean(arr) {
  return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
}
function stdDev(arr) {
  if (arr.length < 2) return 0;
  const m = mean(arr);
  return Math.sqrt(mean(arr.map((x) => (x - m) ** 2)));
}

// mean/std of time taken by everyone on this question so far
export function computePoolStats(submissionsForQuestion) {
  const times = submissionsForQuestion.map((s) => s.endTime - s.startTime);
  return {
    n: times.length,
    mean: mean(times),
    std: stdDev(times) || 1, // avoid div-by-zero
  };
}

// checks keystrokes + paste events for short/paragraph/coding answers
function analyzeTypingBehavior(events, finalAnswerLength) {
  const keydowns = events.filter((e) => e.type === "keydown").map((e) => e.t).sort((a, b) => a - b);
  const pastes = events.filter((e) => e.type === "paste");
  const blurs = events.filter((e) => e.type === "blur");

  const intervals = [];
  for (let i = 1; i < keydowns.length; i++) intervals.push(keydowns[i] - keydowns[i - 1]);

  const typingVariance = stdDev(intervals);
  const idleThenBurst = intervals.some((gap, i) => gap > IDLE_THRESHOLD_MS && intervals[i + 1] < 200);

  // if the ratio between logged keystrokes and answer length looks off, text
  // probably didn't come from typing (paste, autofill, devtools injection etc)
  const keystrokeToLengthRatio = keydowns.length === 0 ? 0 : finalAnswerLength / keydowns.length;
  const likelyPastedWithoutEvent = keydowns.length < finalAnswerLength * 0.3 && finalAnswerLength > 20;

  // Rough characters-per-second based on total active typing span
  const span = keydowns.length > 1 ? (keydowns[keydowns.length - 1] - keydowns[0]) / 1000 : 0;
  const cps = span > 0 ? finalAnswerLength / span : 0;
  const suspiciouslyFastTyping = cps > FAST_TYPING_CPS_LIMIT && pastes.length === 0;

  return {
    keystrokeCount: keydowns.length,
    typingVariance,
    pasteCount: pastes.length,
    blurCount: blurs.length,
    idleThenBurst,
    likelyPastedWithoutEvent,
    suspiciouslyFastTyping,
    keystrokeToLengthRatio,
  };
}

// hover/click behavior for MCQ questions
function analyzeMcqBehavior(events) {
  const hovers = events.filter((e) => e.type === "hover");
  const blurs = events.filter((e) => e.type === "blur");
  return {
    hoverCount: hovers.length,
    optionsHovered: new Set(hovers.map((h) => h.meta?.option)).size,
    blurCount: blurs.length,
  };
}

// scores one submission - pass in the events log for that question and the
// pool stats (from computePoolStats) so we can compare against other candidates
export function scoreSubmission(submission, events, poolStats) {
  const timeTaken = submission.endTime - submission.startTime;
  const flags = [];
  let score = 0;
  const confidenceOk = poolStats.n >= MIN_COHORT;

  const zScore = confidenceOk ? (timeTaken - poolStats.mean) / poolStats.std : null;
  const answeredFastRelativeToPool = confidenceOk && zScore < -1.3;

  if (submission.questionType === "mcq") {
    const mcq = analyzeMcqBehavior(events);
    if (answeredFastRelativeToPool && submission.isCorrect && submission.difficulty === "hard") {
      score += 35;
      flags.push("Answered a hard question much faster than the cohort average, with no visible deliberation");
    }
    if (mcq.hoverCount <= 1 && submission.isCorrect && submission.difficulty !== "easy") {
      score += 15;
      flags.push("Selected the correct option with almost no hovering over alternatives");
    }
    if (mcq.blurCount > 0) {
      score += 10;
      flags.push("Browser window lost focus during this question");
    }
  } else {
    // short / paragraph / coding all share the typing-behavior analysis
    const typing = analyzeTypingBehavior(events, (submission.answer || "").length);

    if (typing.likelyPastedWithoutEvent) {
      score += 40;
      flags.push("Answer text is far longer than the keystrokes logged (likely pasted or injected)");
    }
    if (typing.pasteCount > 0) {
      score += 25;
      flags.push(`Paste event detected (${typing.pasteCount}x) while composing the answer`);
    }
    if (typing.suspiciouslyFastTyping) {
      score += 20;
      flags.push("Typing speed implausibly fast for sustained natural typing");
    }
    if (typing.idleThenBurst) {
      score += 20;
      flags.push("Long idle period followed by a sudden burst of text (consistent with checking a second device)");
    }
    if (typing.typingVariance > 0 && typing.typingVariance < 15 && typing.keystrokeCount > 15) {
      score += 10;
      flags.push("Unusually mechanical, low-variance typing rhythm");
    }
    if (typing.blurCount > 0) {
      score += 10;
      flags.push("Browser window lost focus while composing this answer");
    }
    if (answeredFastRelativeToPool && submission.difficulty === "hard") {
      score += 15;
      flags.push("Completed a hard free-text question far faster than the cohort average");
    }
  }

  score = Math.min(100, score);

  let category = "Normal";
  if (score >= 65) category = "High risk — review recommended";
  else if (score >= 35) category = "Moderate — monitor";

  return {
    candidateId: submission.candidateId,
    questionId: submission.questionId,
    questionType: submission.questionType,
    timeTakenMs: timeTaken,
    zScore,
    confidence: confidenceOk ? "sufficient cohort size" : `low confidence — only ${poolStats.n} data points, need ${MIN_COHORT}+`,
    score,
    category,
    flags,
    note: "This is an advisory behavioral signal, not proof of misconduct. Always pair with human review.",
  };
}
