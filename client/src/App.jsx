import React, { useCallback, useState } from 'react';
import { useGame } from './hooks/useGame.js';
import NameGate from './components/NameGate.jsx';
import Topbar from './components/Topbar.jsx';
import Board from './components/Board.jsx';
import Sidebar from './components/Sidebar.jsx';
import Toast from './components/Toast.jsx';

export default function App() {
  const { joined, me, rules, grid, stats, leaderboard, activity, lastUpdate, lastRejection, join, claim } = useGame();
  const [toast, setToast] = useState(null);

  const showToast = useCallback((text) => {
    setToast({ text, key: Date.now() });
  }, []);

  if (!joined) {
    return <NameGate onEnter={join} />;
  }

  return (
    <div className="min-h-screen bg-[#0b0e14] text-[#e8ebf3] flex flex-col overflow-hidden">
    <Topbar me={me} stats={stats} />
  
    <main className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_300px] min-h-0">
      <Board
        grid={grid}
        rules={rules}
        me={me}
        claim={claim}
        lastUpdate={lastUpdate}
        lastRejection={lastRejection}
        onToast={showToast}
      />
  
      <Sidebar
        leaderboard={leaderboard}
        activity={activity}
        meId={me?.id}
      />
    </main>
  
    <Toast message={toast} />
  </div>
  );
}
