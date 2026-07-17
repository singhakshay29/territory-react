import React from 'react';

export default function Topbar({ me, stats }) {
  return (
    <header className="flex items-center gap-6 px-[22px] py-[14px] border-b border-[#232a3d] bg-[#131826] shrink-0">
   
    <div className="flex items-center gap-[10px]">
      <span className="w-[10px] h-[10px] rounded-[2px] bg-[#5eead4] shadow-[0_0_12px_#5eead4]" />
  
      <span className="font-['Space_Grotesk'] text-[15px] font-bold tracking-[0.06em]">
        TERRITORY
      </span>
    </div>
  
    <div className="ml-3 flex gap-[22px] max-[860px]:hidden">
      <div className="flex items-baseline gap-[5px] font-['JetBrains_Mono']">
        <span className="text-[15px] font-semibold text-[#e8ebf3]">
          {stats.online}
        </span>
  
        <span className="text-[11px] text-[#7c869c]">
          online
        </span>
      </div>
  
      <div className="flex items-baseline gap-[5px] font-['JetBrains_Mono']">
        <span className="text-[15px] font-semibold text-[#e8ebf3]">
          {stats.claimed}
        </span>
  
        <span className="text-[11px] text-[#7c869c]">
          / {stats.total} claimed
        </span>
      </div>
    </div>
  

    <div className="ml-auto flex items-center gap-[9px] rounded-full border border-[#232a3d] bg-[#1a2032] py-[6px] pr-[14px] pl-[8px]">
      <span
        className="h-[18px] w-[18px] rounded-full shadow-[0_0_0_2px_rgba(255,255,255,0.08)]"
        style={{ background: me?.color || "#888" }}
      />
  
      <span className="font-['JetBrains_Mono'] text-[12.5px] text-[#e8ebf3]">
        {me?.name || "—"}
      </span>
    </div>
  </header>
  );
}
