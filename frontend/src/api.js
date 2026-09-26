const BASE = "/api";

export async function getQuestions() {
  const res = await fetch(`${BASE}/questions`);
  return res.json();
}

export async function registerCandidate(name) {
  const res = await fetch(`${BASE}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  return res.json();
}

export async function sendEvents(candidateId, questionId, events) {
  if (!events.length) return;
  await fetch(`${BASE}/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ candidateId, questionId, events }),
  });
}

export async function submitAnswer(payload) {
  await fetch(`${BASE}/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function getDashboard() {
  const res = await fetch(`${BASE}/dashboard`);
  return res.json();
}
