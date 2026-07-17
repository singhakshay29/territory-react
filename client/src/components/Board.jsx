import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Cell from './Cell.jsx';
import CooldownRing from './CooldownRing.jsx';

const CELL_PX = 26;
const GAP_PX = 2;

export default function Board({ grid, rules, me, claim, lastUpdate, lastRejection, onToast }) {
  const { cols, rows, cooldownMs } = rules;
  const [flashes, setFlashes] = useState({}); // index -> 'pulse' | 'rejected'
  const [cooldownTrigger, setCooldownTrigger] = useState(null);
  const flashTimers = useRef({});
  const rippleLayerRef = useRef(null);
  const viewportRef = useRef(null);
  const worldRef = useRef(null);

  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const dragState = useRef(null);

  const boardWidth = cols * CELL_PX + (cols - 1) * GAP_PX;
  const boardHeight = rows * CELL_PX + (rows - 1) * GAP_PX;

  const setFlash = useCallback((index, kind) => {
    setFlashes((prev) => ({ ...prev, [index]: kind }));
    clearTimeout(flashTimers.current[index]);
    flashTimers.current[index] = setTimeout(() => {
      setFlashes((prev) => {
        const next = { ...prev };
        delete next[index];
        return next;
      });
    }, 500);
  }, []);

  const spawnRipple = useCallback((index, color) => {
    const layer = rippleLayerRef.current;
    if (!layer) return;
    const col = index % cols, row = Math.floor(index / cols);
    const cx = col * (CELL_PX + GAP_PX) + CELL_PX / 2;
    const cy = row * (CELL_PX + GAP_PX) + CELL_PX / 2;
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', cx);
    circle.setAttribute('cy', cy);
    circle.setAttribute('r', 2);
    circle.setAttribute('stroke', color);
    circle.classList.add('ripple-ring');
    layer.appendChild(circle);
    circle.addEventListener('animationend', () => circle.remove());
  }, [cols]);

  // React to server-confirmed cell updates: pulse + ripple for my captures,
  // toast when someone else takes a cell I used to own.
  const prevOwners = useRef({});
  useEffect(() => {
    if (!lastUpdate) return;
    setFlash(lastUpdate.index, 'pulse');
    if (lastUpdate.mine) spawnRipple(lastUpdate.index, lastUpdate.color);
    const prevOwner = prevOwners.current[lastUpdate.index];
    if (me && prevOwner === me.id && lastUpdate.owner !== me.id) {
      onToast(`${lastUpdate.name} took one of your cells`);
    }
    prevOwners.current[lastUpdate.index] = lastUpdate.owner;
  }, [lastUpdate]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!lastRejection) return;
    setFlash(lastRejection.index, 'rejected');
    if (lastRejection.reason === 'cooldown') {
      onToast('Still cooling down…');
    } else if (lastRejection.reason === 'immune') {
      onToast('That cell just changed hands — try again shortly');
    } else if (lastRejection.reason === 'already_yours') {
      onToast('Already yours');
    }
  }, [lastRejection]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleClaim = useCallback((index) => {
    claim(index, (res) => {
      if (res.ok) setCooldownTrigger({ durationMs: res.cooldownMs, isUrgent: false, key: Date.now() });
      else if (res.reason === 'cooldown') setCooldownTrigger({ durationMs: res.retryAfter, isUrgent: true, key: Date.now() });
    });
  }, [claim]);

  // ---- zoom / pan ----
  const applyWheel = useCallback((e) => {
    e.preventDefault();
    const delta = -e.deltaY * 0.0015;
    setScale((s) => Math.min(2.5, Math.max(0.5, s + delta)));
  }, []);

  useEffect(() => {
    const vp = viewportRef.current;
    if (!vp) return;
    vp.addEventListener('wheel', applyWheel, { passive: false });
    return () => vp.removeEventListener('wheel', applyWheel);
  }, [applyWheel]);

  const onPointerDown = (e) => {
    dragState.current = { x: e.clientX, y: e.clientY };
    viewportRef.current?.classList.add('dragging');
  };
  const onPointerMove = (e) => {
    if (!dragState.current) return;
    const dx = e.clientX - dragState.current.x;
    const dy = e.clientY - dragState.current.y;
    dragState.current = { x: e.clientX, y: e.clientY };
    setPan((p) => ({ x: p.x + dx, y: p.y + dy }));
  };
  const endDrag = () => {
    dragState.current = null;
    viewportRef.current?.classList.remove('dragging');
  };

  useEffect(() => {
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', endDrag);
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', endDrag);
    };
  }, []);

  const worldStyle = {
    transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
    marginLeft: -boardWidth / 2,
    marginTop: -boardHeight / 2,
  };

  const cells = useMemo(() => grid, [grid]);
  const meId = me?.id;

  return (
    <section className="relative flex min-w-0 flex-col border-r border-[#232a3d]">
      <div className="flex items-center gap-2 border-b border-[#232a3d] px-4 py-[10px]">
      <button
      title="Zoom out"
      onClick={() => setScale((s) => Math.max(0.5, s - 0.2))}
      className="flex h-[30px] w-[30px] cursor-pointer items-center justify-center rounded-[7px] border border-[#232a3d] bg-[#1a2032] text-[15px] text-[#e8ebf3] transition-all duration-150 hover:border-[#2e6b62] hover:bg-[#262e44]"
    >
      −
    </button>
    <button
      title="Reset view"
      onClick={() => {
        setScale(1);
        setPan({ x: 0, y: 0 });
      }}
      className="flex h-[30px] w-[30px] cursor-pointer items-center justify-center rounded-[7px] border border-[#232a3d] bg-[#1a2032] text-[15px] text-[#e8ebf3] transition-all duration-150 hover:border-[#2e6b62] hover:bg-[#262e44]"
    >
      ⤾
    </button>

    <button
      title="Zoom in"
      onClick={() => setScale((s) => Math.min(2.5, s + 0.2))}
      className="flex h-[30px] w-[30px] cursor-pointer items-center justify-center rounded-[7px] border border-[#232a3d] bg-[#1a2032] text-[15px] text-[#e8ebf3] transition-all duration-150 hover:border-[#2e6b62] hover:bg-[#262e44]"
    >
      +
    </button>
        <CooldownRing cooldownMs={cooldownMs} trigger={cooldownTrigger} />
      </div>

      <div
       className="relative flex-1 overflow-hidden cursor-grab bg-[#0b0e14]"
        ref={viewportRef}
        onPointerDown={onPointerDown}
      >
        <div  className="absolute left-1/2 top-1/2 origin-top-left will-change-transform" ref={worldRef} style={worldStyle}>
          <div
            className="grid overflow-hidden rounded border border-[#232a3d] bg-[#232a3d]"
            style={{
              gridTemplateColumns: `repeat(${cols}, ${CELL_PX}px)`,
              gridTemplateRows: `repeat(${rows}, ${CELL_PX}px)`,
              gap: `${GAP_PX}px`,
            }}
          >
            {cells.map((cell, i) => (
              <Cell
                key={i}
                index={i}
                cell={cell}
                mine={!!(cell && meId && cell.owner === meId)}
                flash={flashes[i]}
                onClaim={handleClaim}
              />
            ))}
          </div>
          <svg
           className="absolute left-0 top-0 overflow-visible pointer-events-none"
            ref={rippleLayerRef}
            width={boardWidth}
            height={boardHeight}
            style={{ width: boardWidth, height: boardHeight }}
          />
        </div>
      </div>
      <p className="border-t border-[#232a3d] px-4 py-2 font-mono text-[11.5px] text-[#7c869c]">Scroll or pinch to zoom · drag to pan</p>
    </section>
  );
}
