import { useEffect, useState } from "react";
import { useEventCapture } from "../hooks/useEventCapture";
import { sendEvents, submitAnswer } from "../api";

// handles short-answer, paragraph, and coding questions - just different
// textarea styling + min length, same capture logic underneath
export default function TextQuestion({ candidateId, question, onDone }) {
  const [answer, setAnswer] = useState("");
  const capture = useEventCapture();
  const isCode = question.type === "coding";

  useEffect(() => {
    capture.start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question.id]);

  const handleSubmit = async () => {
    const { startTime, endTime, events } = capture.stop();
    await sendEvents(candidateId, question.id, events);
    await submitAnswer({
      candidateId,
      questionId: question.id,
      questionType: question.type,
      answer,
      startTime,
      endTime,
      difficulty: question.difficulty,
    });
    onDone();
  };

  const label = { short: "Short answer", paragraph: "Paragraph", coding: "Coding" }[question.type];
  const minChars = { short: 10, paragraph: 40, coding: 15 }[question.type];

  return (
    <div>
      <div className="q-meta">
        <span>{label} · {question.difficulty}</span>
      </div>
      <p className="q-text">{question.text}</p>
      <textarea
        className={isCode ? "code-area" : ""}
        placeholder={isCode ? "// write your solution here" : "Type your answer here..."}
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        onKeyDown={() => capture.recordKeydown()}
        onPaste={(e) => capture.recordPaste(e)}
        spellCheck={!isCode}
      />
      <div className="hint-row">
        <span>{answer.length} characters</span>
      </div>
      <button className="btn-primary" disabled={answer.length < minChars} onClick={handleSubmit}>
        Next question
      </button>
    </div>
  );
}
