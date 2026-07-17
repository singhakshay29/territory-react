import React from 'react';

export default function Sidebar({ leaderboard, activity, meId }) {
  return (
   <aside className="flex min-h-0 flex-col bg-[#131826]">

  <div className="flex min-h-0 flex-col border-b border-[#232a3d] px-[18px] pt-[18px] pb-[6px]">

    <h2 className="mb-3 font-mono text-[11px] uppercase tracking-[0.1em] text-[#7c869c]">
      Leaderboard
    </h2>

    <ol className="mb-3 flex flex-col gap-[2px]">
      {leaderboard.length === 0 && (
        <li className="px-2 py-[6px] text-[12.5px] text-[#7c869c]">
          No cells claimed yet — be first.
        </li>
      )}

      {leaderboard.map((p, i) => (
        <li
          key={p.id}
          className={`flex items-center gap-[10px] rounded-[7px] px-2 py-[7px] text-[13px] ${
            p.id === meId ? "bg-[#1a2032]" : ""
          }`}
        >
          <span className="w-[14px] font-mono text-[11px] text-[#7c869c]">
            {i + 1}
          </span>

          <span
            className="h-[10px] w-[10px] shrink-0 rounded-[3px]"
            style={{ background: p.color }}
          />

          <span className="flex-1 truncate">
            {p.name}
            {!p.online && " (away)"}
          </span>

          <span className="font-mono text-[12px] text-[#7c869c]">
            {p.count}
          </span>
        </li>
      ))}
    </ol>
  </div>

  <div className="flex flex-1 min-h-0 flex-col px-[18px] pt-[18px] pb-[6px]">

    <h2 className="mb-3 font-mono text-[11px] uppercase tracking-[0.1em] text-[#7c869c]">
      Activity
    </h2>

    <ul className="flex flex-1 flex-col-reverse gap-[6px] overflow-y-auto pb-[14px]">
      {activity.map((a) => (
        <li
          key={a.id}
          className="flex items-center gap-2 text-[12.5px] text-[#7c869c] animate-fadeIn"
        >
          <span
            className="h-[6px] w-[6px] shrink-0 rounded-full"
            style={{ background: a.color || "#888" }}
          />

          <span>{a.text}</span>
        </li>
      ))}
    </ul>

  </div>
</aside>
  );
}
