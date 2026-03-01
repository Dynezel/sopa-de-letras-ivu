import { useState, useEffect } from "react";
import { ref, onValue, update, get } from "firebase/database";
import { db } from "./firebase";
import { GroupSelect } from "./components/GroupSelect";
import { Game } from "./components/Game";
import { getMyGroup, setMyGroup, clearMyGroup } from "./utils/storage";
import { GROUPS } from "./config";

export default function App() {
  const [myGroup, setMyGroupState] = useState(null);
  const [groupCounts, setGroupCounts]   = useState({});
  const [loading, setLoading]           = useState(true);

  useEffect(() => {
    // Recuperar grupo guardado localmente
    const saved = getMyGroup();
    if (saved) setMyGroupState(saved);

    // Escuchar conteo de jugadores por grupo en tiempo real
    const unsub = onValue(ref(db, "game/groupCounts"), (snap) => {
      setGroupCounts(snap.val() ?? {});
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleSelectGroup = async (group) => {
    setMyGroup(group);
    setMyGroupState(group);
    const snap = await get(ref(db, `game/groupCounts/${group.id}`));
    await update(ref(db, "game/groupCounts"), {
      [group.id]: (snap.val() ?? 0) + 1,
    });
  };

  const handleLeaveGroup = async () => {
    if (myGroup) {
      const snap = await get(ref(db, `game/groupCounts/${myGroup.id}`));
      await update(ref(db, "game/groupCounts"), {
        [myGroup.id]: Math.max(0, (snap.val() ?? 1) - 1),
      });
    }
    clearMyGroup();
    setMyGroupState(null);
  };

  if (loading) {
    return (
      <div style={{
        minHeight: "100dvh", background: "#080808",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "'Courier New', monospace", color: "#222",
        letterSpacing: 4, fontSize: 12,
      }}>
        CARGANDO...
      </div>
    );
  }

  if (!myGroup) {
    return (
      <GroupSelect
        groups={GROUPS}
        onSelect={handleSelectGroup}
        groupCounts={groupCounts}
      />
    );
  }

  return (
    <Game
      myGroup={myGroup}
      onLeaveGroup={handleLeaveGroup}
    />
  );
}
