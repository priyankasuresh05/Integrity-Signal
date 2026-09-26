# Integrity Signal — Camera-free Behavioral Proctoring

A unified, camera-free anomaly-detection system for online assessments. It works
identically across **MCQ, short-answer, paragraph, and coding** questions by
capturing timing, typing rhythm, paste/burst-insertion, and window-focus events,
then scoring each answer against the candidate pool. No webcam required.

## ⚠️ Read this before you present it

This tool detects **statistical behavioral anomalies**, not proof of cheating.
It cannot see a phone, cannot know if someone photographed a question, and
will occasionally flag genuinely fast, skilled candidates. It is built as a
**decision-support tool for human examiners** — every score is advisory. Say
this explicitly in your report; it's a strength, not a weakness, to be upfront
about the limits of camera-free detection.

## How detection works (same engine, every question type)

| Signal | MCQ | Short/Paragraph/Coding |
|---|---|---|
| Time vs. cohort average (z-score) | ✅ | ✅ |
| Mouse hover before selecting | ✅ | — |
| Keystroke rhythm / variance | — | ✅ |
| Paste event | — | ✅ |
| Burst-insert (text appears faster than physically typeable) | — | ✅ |
| Idle gap → sudden burst | — | ✅ |
| Window blur/focus loss | ✅ | ✅ |

No single signal ever triggers a flag alone — `backend/riskEngine.js` requires
multiple signals or a cohort of at least 5 candidates before treating a
timing gap as meaningful. Read the comments at the top of that file; that's
the core intellectual contribution of the whole project and what you should
be able to explain in detail during evaluation.

## Project structure

```
exam-integrity-app/
├── backend/
│   ├── server.js       — Express API (register, events, submit, dashboard)
│   ├── db.js            — JSON-file storage (swap for MongoDB/Postgres later)
│   ├── riskEngine.js    — the detection logic (read this first)
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── hooks/useEventCapture.js   — shared behavioral capture hook
│   │   ├── components/
│   │   │   ├── MCQQuestion.jsx
│   │   │   ├── TextQuestion.jsx       — powers short/paragraph/coding
│   │   │   ├── TestRunner.jsx         — sequences questions
│   │   │   └── Dashboard.jsx          — examiner risk view
│   │   ├── App.jsx
│   │   └── api.js
│   └── package.json
└── README.md   (this file)
```

## Running it locally

You need Node.js 18+ installed.

**1. Backend**
```bash
cd backend
npm install
npm start
```
Runs on `http://localhost:4000`.

**2. Frontend** (new terminal)
```bash
cd frontend
npm install
npm run dev
```
Runs on `http://localhost:5173`, proxying `/api` to the backend.

**3. Try it**
- Open `http://localhost:5173/#test` in one tab — take the assessment as a candidate.
- Open a few more incognito/private tabs and take it again as different "candidates" —
  answer some quickly, some slowly, paste one answer, leave one tab idle then paste —
  this gives your cohort enough data points (5+) for the z-score logic to activate.
- Open `http://localhost:5173/#dashboard` to see the examiner view with live risk scores.

## Extending it (good "future scope" material for your report)

- Swap `db.js` for MongoDB/Postgres — the function signatures are already isolated for this.
- Add stylometry-based checks for paragraph answers (compare vocabulary/sentence-length
  variance against the candidate's *own* earlier answers in the same test).
- Add local-network fingerprinting to flag a second device on the same IP during the test.
- Add an audio-input check (phone camera shutter sound) as an optional extra signal.

## Suggested report structure

1. Abstract
2. Problem statement (the real gap: most proctoring tools assume webcam access)
3. Related work (ProctorU, Mettl, HackerEarth — note their camera dependency)
4. System architecture (see structure above; draw the flow: browser → event capture
   → backend → risk engine → dashboard)
5. Detection algorithm design (walk through `riskEngine.js` signal by signal)
6. Implementation screenshots (test UI, dashboard, a flagged vs. clean example)
7. Evaluation (simulate 5-10 "candidates" with different behaviors, show the resulting scores)
8. Limitations (be explicit: advisory only, needs cohort size, cannot detect phone usage
   directly, false positives are possible for genuinely fast candidates)
9. Future scope
10. Conclusion
