import express from "express";
import cors from "cors";
import { nanoid } from "nanoid";
import {
  getQuestions,
  registerCandidate,
  logEvent,
  saveSubmission,
  getAllEventsForQuestion,
  getAllData,
  getCandidateSubmissions,
} from "./db.js";
import { computePoolStats, scoreSubmission } from "./riskEngine.js";

const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));

// --- candidate side ---------------------------------------------------

app.get("/api/questions", (req, res) => {
  // don't send the correct answer to the client
  const clean = getQuestions().map(({ correct, ...q }) => q);
  res.json(clean);
});

app.post("/api/register", (req, res) => {
  const { name } = req.body;
  const candidateId = nanoid(8);
  registerCandidate(candidateId, name || "Anonymous");
  res.json({ candidateId });
});

// batch of keydown/paste/blur/hover events for one question
app.post("/api/events", (req, res) => {
  const { candidateId, questionId, events } = req.body;
  if (!candidateId || !questionId || !Array.isArray(events)) {
    return res.status(400).json({ error: "candidateId, questionId, and events[] are required" });
  }
  events.forEach((e) => logEvent({ candidateId, questionId, ...e }));
  res.json({ ok: true, count: events.length });
});

// Final answer submission for a question
app.post("/api/submit", (req, res) => {
  const { candidateId, questionId, questionType, answer, startTime, endTime, difficulty } = req.body;
  const questions = getQuestions();
  const q = questions.find((x) => x.id === questionId);
  let isCorrect = null;
  if (q && q.type === "mcq") {
    isCorrect = Number(answer) === q.correct;
  }
  saveSubmission({
    candidateId,
    questionId,
    questionType: questionType || q?.type,
    answer,
    isCorrect,
    startTime,
    endTime,
    difficulty: difficulty || q?.difficulty,
  });
  res.json({ ok: true });
});

// --- examiner side ---------------------------------------------------

// risk scores for every candidate, every question
app.get("/api/dashboard", (req, res) => {
  const data = getAllData();
  const results = [];

  for (const submission of data.submissions) {
    const poolSubmissions = data.submissions.filter((s) => s.questionId === submission.questionId);
    const poolStats = computePoolStats(poolSubmissions);
    const events = data.events.filter(
      (e) => e.candidateId === submission.candidateId && e.questionId === submission.questionId
    );
    results.push(scoreSubmission(submission, events, poolStats));
  }

  // average out each candidate's per-question scores into one overall score
  const byCandidate = {};
  for (const r of results) {
    if (!byCandidate[r.candidateId]) byCandidate[r.candidateId] = [];
    byCandidate[r.candidateId].push(r);
  }
  const candidateSummaries = Object.entries(byCandidate).map(([candidateId, rows]) => {
    const avgScore = rows.reduce((a, b) => a + b.score, 0) / rows.length;
    const name = data.candidates[candidateId]?.name || "Unknown";
    return {
      candidateId,
      name,
      avgScore: Math.round(avgScore),
      category: avgScore >= 65 ? "High risk" : avgScore >= 35 ? "Moderate" : "Normal",
      questionResults: rows,
    };
  });

  res.json({ candidates: candidateSummaries, questions: getQuestions() });
});

app.get("/api/candidate/:id/report", (req, res) => {
  const data = getAllData();
  const submissions = getCandidateSubmissions(req.params.id);
  const results = submissions.map((s) => {
    const poolSubmissions = data.submissions.filter((x) => x.questionId === s.questionId);
    const poolStats = computePoolStats(poolSubmissions);
    const events = data.events.filter((e) => e.candidateId === s.candidateId && e.questionId === s.questionId);
    return scoreSubmission(s, events, poolStats);
  });
  res.json(results);
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Exam integrity backend running on http://localhost:${PORT}`));
