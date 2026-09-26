// simple json file storage so this runs without setting up a real DB
// can swap for mongo/postgres later, just keep the function signatures the same

import { readFileSync, writeFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = join(__dirname, "data.json");

const DEFAULT_DATA = {
  questions: [
    { id: "q1", type: "mcq", text: "What is the time complexity of binary search?", options: ["O(n)", "O(log n)", "O(n^2)", "O(1)"], correct: 1, difficulty: "easy" },
    { id: "q2", type: "mcq", text: "Which data structure uses LIFO order?", options: ["Queue", "Stack", "Heap", "Graph"], correct: 1, difficulty: "easy" },
    { id: "q3", type: "mcq", text: "In a balanced BST with n nodes, what is the worst-case height?", options: ["O(n)", "O(log n)", "O(n log n)", "O(1)"], correct: 1, difficulty: "hard" },
    { id: "q4", type: "short", text: "In one or two lines, explain why hash tables give O(1) average lookup time.", difficulty: "medium" },
    { id: "q5", type: "paragraph", text: "Explain the trade-offs between using a linked list versus an array for implementing a stack. Discuss memory, performance, and use cases.", difficulty: "hard" },
    { id: "q6", type: "coding", text: "Write a function that returns the second largest number in an array of integers.", difficulty: "hard" }
  ],
  candidates: {},
  events: [],
  submissions: []
};

function load() {
  if (!existsSync(DB_PATH)) {
    writeFileSync(DB_PATH, JSON.stringify(DEFAULT_DATA, null, 2));
  }
  return JSON.parse(readFileSync(DB_PATH, "utf-8"));
}

function save(data) {
  writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

export function getQuestions() {
  return load().questions;
}

export function registerCandidate(candidateId, name) {
  const data = load();
  data.candidates[candidateId] = { name, startedAt: Date.now() };
  save(data);
}

export function logEvent(event) {
  const data = load();
  data.events.push({ ...event, loggedAt: Date.now() });
  save(data);
}

export function saveSubmission(submission) {
  const data = load();
  data.submissions.push(submission);
  save(data);
}

export function getAllEventsForQuestion(questionId) {
  const data = load();
  return data.events.filter((e) => e.questionId === questionId);
}

export function getAllData() {
  return load();
}

export function getCandidateEvents(candidateId) {
  const data = load();
  return data.events.filter((e) => e.candidateId === candidateId);
}

export function getCandidateSubmissions(candidateId) {
  const data = load();
  return data.submissions.filter((s) => s.candidateId === candidateId);
}
