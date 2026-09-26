import { useRef, useCallback } from "react";

// hook used by every question type to log keystrokes, paste, blur/focus
// and mcq hover events, so all question types feed the backend the same
// shaped data
export function useEventCapture() {
  const eventsRef = useRef([]);
  const startTimeRef = useRef(null);

  const start = useCallback(() => {
    eventsRef.current = [];
    startTimeRef.current = Date.now();

    const onBlur = () => eventsRef.current.push({ type: "blur", t: Date.now() });
    const onFocus = () => eventsRef.current.push({ type: "focus", t: Date.now() });
    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", onFocus);

    // stash cleanup so `stop()` can remove listeners
    eventsRef.current.__cleanup = () => {
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  const recordKeydown = useCallback(() => {
    eventsRef.current.push({ type: "keydown", t: Date.now() });
  }, []);

  const recordPaste = useCallback((e) => {
    const length = e.clipboardData?.getData("text")?.length || 0;
    eventsRef.current.push({ type: "paste", t: Date.now(), meta: { length } });
  }, []);

  const recordHover = useCallback((optionIndex) => {
    eventsRef.current.push({ type: "hover", t: Date.now(), meta: { option: optionIndex } });
  }, []);

  const stop = useCallback(() => {
    const endTime = Date.now();
    eventsRef.current.__cleanup?.();
    return {
      startTime: startTimeRef.current,
      endTime,
      events: eventsRef.current.filter((e) => typeof e === "object" && e.type),
    };
  }, []);

  return { start, stop, recordKeydown, recordPaste, recordHover };
}
