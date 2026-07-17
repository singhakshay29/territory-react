import React, { useEffect, useState } from 'react';

export default function Toast({ message }) {
  const [visible, setVisible] = useState(false);
  const [text, setText] = useState('');

  useEffect(() => {
    if (!message) return;
    setText(message.text);
    setVisible(true);
    const t = setTimeout(() => setVisible(false), 1800);
    return () => clearTimeout(t);
  }, [message]);

  return (
    <div
    className={`fixed left-1/2 bottom-[22px] z-[60] -translate-x-1/2 rounded-full border border-[#232a3d] bg-[#1a2032] px-[18px] py-[10px] font-mono text-[13px] text-[#e8ebf3] pointer-events-none transition-all duration-200 ${
      visible
        ? "translate-y-0 opacity-100"
        : "translate-y-5 opacity-0"
    }`}
  >
    {text}
  </div>
  );
}
