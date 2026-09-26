import { useEffect, useState } from "react";
import { useEventCapture } from "../hooks/useEventCapture";
import { sendEvents, submitAnswer } from "../api";

export default function MCQQuestion({ candidateId, question, onDone }) {
  const [selected, setSelected] = useState(null);
  const capture = useEventCapture();

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
      questionType: "mcq",
      answer: selected,
      startTime,
      endTime,
      difficulty: question.difficulty,
    });
    onDone();
  };

  return (
    <div>
      <div className="q-meta">
        <span>MCQ · {question.difficulty}</span>
      </div>
      <p className="q-text">{question.text}</p>
      {question.options.map((opt, i) => (
        <label
          key={i}
          className={`option-row ${selected === i ? "selected" : ""}`}
          onMouseEnter={() => capture.recordHover(i)}
        >
          <input
            type="radio"
            name={question.id}
            checked={selected === i}
            onChange={() => setSelected(i)}
          />
          {opt}
        </label>
      ))}
      <button className="btn-primary" disabled={selected === null} onClick={handleSubmit}>
        Next question
      </button>
    </div>
  );
}
