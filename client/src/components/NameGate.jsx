import React, { useState } from 'react';

export default function NameGate({ onEnter }) {
  const [name, setName] = useState(() => localStorage.getItem('territory_name') || '');

  function enter() {
    const trimmed = name.trim();
    if (trimmed) localStorage.setItem('territory_name', trimmed);
    onEnter(trimmed);
  }

  return (
    <div
    className="fixed inset-0 z-50 flex items-center justify-center p-6"
    style={{
      background: `
        radial-gradient(circle at 20% 20%, rgba(94,234,212,.06), transparent 40%),
        radial-gradient(circle at 80% 70%, rgba(167,139,250,.06), transparent 40%),
        #0b0e14
      `,
    }}
  >
    <div className="w-full max-w-[420px] rounded-2xl border border-[#232a3d] bg-[#131826] px-8 py-9">
  
      <p className="mb-3 font-mono text-xs tracking-[0.18em] text-[#5eead4]">
        TERRITORY
      </p>
  
      <h1 className="mb-3 font-['Space_Grotesk'] text-[32px] font-bold tracking-[-0.01em] text-[#e8ebf3]">
        Claim the grid.
      </h1>
  
      <p className="mb-6 text-sm leading-7 text-[#7c869c]">
        600 cells. Everyone online right now can see this board. Click a cell to
        take it — it's yours until someone else outlasts your hold.
      </p>
  
      <label
        htmlFor="nameInput"
        className="mb-2 block font-mono text-[11px] tracking-[0.08em] text-[#7c869c]"
      >
        Callsign
      </label>
  
      <input
        id="nameInput"
        maxLength={16}
        placeholder="Leave blank for a random one"
        autoComplete="off"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && enter()}
        className="mb-5 w-full rounded-lg border border-[#232a3d] bg-[#1a2032] px-[14px] py-3 text-sm text-[#e8ebf3] outline-none transition-colors duration-150 placeholder:text-[#7c869c] focus:border-[#5eead4]"
      />
  
      <button
        onClick={enter}
        className="w-full rounded-lg bg-[#5eead4] px-4 py-[13px] font-['Space_Grotesk'] text-sm font-bold text-[#04211d] transition hover:brightness-110 active:scale-[0.98]"
      >
        Enter the board
      </button>
  
    </div>
  </div>
  );
}
