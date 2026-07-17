import { useCallback, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';


const socket = io(
  import.meta.env.DEV
    ? undefined
    : import.meta.env.VITE_API_URL,
  {
    autoConnect: false,
    transports: ["websocket"],
  }
);

function getClientId() {
  let id = localStorage.getItem('territory_id');
  if (!id) {
    id = 'u_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem('territory_id', id);
  }
  return id;
}

export function useGame() {
  const [joined, setJoined] = useState(false);
  const [me, setMe] = useState(null);
  const [rules, setRules] = useState({ cols: 30, rows: 20, cooldownMs: 1200, immunityMs: 4000 });
  const [grid, setGrid] = useState([]); // array of { owner, color, name, claimedAt } | null
  const [stats, setStats] = useState({ online: 0, claimed: 0, total: 0 });
  const [leaderboard, setLeaderboard] = useState([]);
  const [activity, setActivity] = useState([]);
  const [lastUpdate, setLastUpdate] = useState(null); // most recent cellUpdate, for animation triggers
  const [lastRejection, setLastRejection] = useState(null);
  const meRef = useRef(me);
  meRef.current = me;

  useEffect(() => {
    if (!socket.connected) socket.connect();

    function onCellUpdate(u) {
      setGrid((prev) => {
        const next = prev.slice();
        next[u.index] = { owner: u.owner, color: u.color, name: u.name, claimedAt: u.claimedAt };
        return next;
      });
      setLastUpdate({ ...u, mine: meRef.current && u.owner === meRef.current.id, t: Date.now() });
    }
    function onLeaderboard(list) { setLeaderboard(list); }
    function onPresence(p) { setStats(p.stats); }
    function onActivity(a) {
      setActivity((prev) => {
        const next = [...prev, { ...a, id: Math.random().toString(36).slice(2) }];
        return next.length > 30 ? next.slice(next.length - 30) : next;
      });
    }

    socket.on('cellUpdate', onCellUpdate);
    socket.on('leaderboard', onLeaderboard);
    socket.on('presence', onPresence);
    socket.on('activity', onActivity);

    return () => {
      socket.off('cellUpdate', onCellUpdate);
      socket.off('leaderboard', onLeaderboard);
      socket.off('presence', onPresence);
      socket.off('activity', onActivity);
    };
  }, []);

  const join = useCallback((name) => {
    socket.emit('join', { id: getClientId(), name }, (res) => {
      if (!res || !res.ok) return;
      setMe(res.you);
      setRules(res.rules);
      setStats(res.stats);
      setLeaderboard(res.leaderboard);

      const cells = new Array(res.rules.cols * res.rules.rows).fill(null);
      res.grid.forEach((entry, i) => {
        if (!entry) return;
        const [ownerId, claimedAt] = entry;
        const profile = res.profiles.find((p) => p.id === ownerId);
        cells[i] = { owner: ownerId, color: profile ? profile.color : '#888', name: profile ? profile.name : '?', claimedAt };
      });
      setGrid(cells);
      setJoined(true);
    });
  }, []);

  const claim = useCallback((index, onResult) => {
    socket.emit('claim', { index }, (res) => {
      if (!res) return;
      if (!res.ok) setLastRejection({ index, reason: res.reason, retryAfter: res.retryAfter, t: Date.now() });
      onResult && onResult(res);
    });
  }, []);

  return { joined, me, rules, grid, stats, leaderboard, activity, lastUpdate, lastRejection, join, claim };
}
