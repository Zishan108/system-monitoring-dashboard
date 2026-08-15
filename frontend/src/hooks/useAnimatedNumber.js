import { useEffect, useRef, useState } from "react";

/**
 * useAnimatedNumber
 * ==================
 * Smoothly interpolates a displayed number toward a target value instead
 * of snapping instantly. Every metric update becomes a small ~500ms glide
 * rather than a jump cut — reads as "live instrument" rather than
 * "value swapped out."
 *
 * WHY requestAnimationFrame INSTEAD OF setInterval/CSS transition:
 * CSS transitions can't easily animate the actual NUMBER shown in text
 * (only visual properties like width/color). We need the displayed digits
 * themselves to tick through intermediate values, so we drive it manually
 * with rAF, which syncs to the browser's repaint cycle for smoothness.
 */
export function useAnimatedNumber(target, duration = 500) {
  const [display, setDisplay] = useState(target);
  const frameRef = useRef(null);
  const startValueRef = useRef(target);
  const startTimeRef = useRef(null);

  useEffect(() => {
    startValueRef.current = display;
    startTimeRef.current = null;

    const step = (timestamp) => {
      if (startTimeRef.current === null) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);

      const current = startValueRef.current + (target - startValueRef.current) * progress;
      setDisplay(current);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(step);
      }
    };

    frameRef.current = requestAnimationFrame(step);

    // Cleanup: cancel any in-flight animation frame if `target` changes
    // again before this one finishes, or if the component unmounts.
    return () => cancelAnimationFrame(frameRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  return display;
}