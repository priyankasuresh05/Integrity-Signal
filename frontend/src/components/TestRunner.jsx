import { useEffect, useState } from "react";
import { getQuestions, registerCandidate } from "../api";
import MCQQuestion from "./MCQQuestion";
import TextQuestion from "./TextQuestion";

export default function TestRunner() {
  const [name, setName] = useState("");
  const [candidateId, setCandidateId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [index, setIndex] = useState(0);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    getQuestions().then(setQuestions);
  }, []);

  const handleStart = async () => {
    const { candidateId } = await registerCandidate(name || "Candidate");
    setCandidateId(candidateId);
  };

  const handleNext = () => {
    if (index + 1 >= questions.length) setFinished(true);
    else setIndex(index + 1);
  };

  if (!candidateId) {
    return (
      <div className="landing">
        <h1>Assessment Session</h1>
        <p style={{ color: "var(--text-dim)", marginTop: 10 }}>
          Enter your name to begin. Full screen is not required — this session monitors
          typing rhythm and timing patterns instead of your camera.
        </p>
        <br />
        <input placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
        <br />
        <button className="btn-primary" onClick={handleStart}>Start assessment</button>
      </div>
    );
  }

  if (finished || questions.length === 0) {
    return (
      <div className="done-screen">
        <h1>Assessment complete</h1>
        <p style={{ color: "var(--text-dim)", marginTop: 10 }}>
          Your responses have been submitted. You may close this window.
        </p>
      </div>
    );
  }

  const q = questions[index];

  return (
    <div>
      <div className="progress-row">
        {questions.map((_, i) => (
          <div key={i} className={`progress-seg ${i < index ? "done" : ""}`} />
        ))}
      </div>
      <div className="q-card">
        {q.type === "mcq" ? (
          <MCQQuestion candidateId={candidateId} question={q} onDone={handleNext} />
        ) : (
          <TextQuestion candidateId={candidateId} question={q} onDone={handleNext} />
        )}
      </div>
    </div>
  );
}
