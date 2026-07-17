import React, { useEffect, useRef, useState } from 'react';

const CIRC = 97.4;

export default function CooldownRing({ cooldownMs, trigger }) {
  const [remaining, setRemaining] = useState(0);
  const [total, setTotal] = useState(cooldownMs);
  const [urgent, setUrgent] = useState(false);
  const rafRef = useRef(null);

  useEffect(() => {
    if (!trigger) return;
    const { durationMs, isUrgent } = trigger;
    setTotal(durationMs);
    setUrgent(!!isUrgent);
    const start = Date.now();

    function tick() {
      const elapsed = Date.now() - start;
      const left = Math.max(0, durationMs - elapsed);
      setRemaining(left);
      if (left > 0) {
        rafRef.current = requestAnimationFrame(tick);
      }
    }
    cancelAnimationFrame(rafRef.current);
    tick();
    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger]);

  const frac = total > 0 ? remaining / total : 0;
  const offset = CIRC * (1 - frac);

  return (
    <div
    className={`ml-auto flex items-center gap-[7px] rounded-full border border-[#232a3d] bg-[#1a2032] py-[5px] pr-3 pl-[6px] font-mono text-[11.5px] text-[#7c869c] ${
      urgent && remaining > 0 ? "text-[#fb7185]" : ""
    }`}
  >
    <svg
      viewBox="0 0 36 36"
      className="-rotate-90 h-5 w-5"
    >
      <circle
        cx="18"
        cy="18"
        r="15.5"
        fill="none"
        stroke="#232a3d"
        strokeWidth="3"
      />
  
      <circle
        cx="18"
        cy="18"
        r="15.5"
        fill="none"
        stroke={urgent && remaining > 0 ? "#fb7185" : "#5eead4"}
        strokeWidth="3"
        strokeLinecap="round"
        style={{
          strokeDasharray: CIRC,
          strokeDashoffset: offset,
          transition: "stroke-dashoffset .1s linear",
        }}
      />
    </svg>
  
    <span>
      {remaining > 0 ? `${(remaining / 1000).toFixed(1)}s` : "ready"}
    </span>
  </div>
  );
}
