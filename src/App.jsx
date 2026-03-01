import { useState, useEffect } from "react";
import { ref, onValue, update, get } from "firebase/database";
import { db } from "./firebase";
import { GroupSelect } from "./components/GroupSelect";
import { Game } from "./components/Game";
import { getMyGroup, setMyGroup, clearMyGroup } from "./utils/storage";
import { GROUPS } from "./config";

export default function App() {
  const [myGroup, setMyGroupState] = useState(null);
  const [groupCounts, setGroupCounts] = useState({});
  const [loading, setLoading]         = useState(true);
  const [firebaseError, setFirebaseError] = useState(false);

  useEffect(() => {
    const saved = getMyGroup();
    if (saved) setMyGroupState(saved);

    // Si Firebase no responde en 6 segundos, mostrar error
    const timeout = setTimeout(() => {
      setFirebaseError(true);
      setLoading(false);
    }, 6000);

    const unsub = onValue(
      ref(db, "game/groupCounts"),
      (snap) => {
        clearTimeout(timeout);
        setGroupCounts(snap.val() ?? {});
        setLoading(false);
        setFirebaseError(false);
      },
      (error) => {
        // Firebase devolvió un error explícito (ej: reglas de seguridad)
        clearTimeout(timeout);
        console.error("Firebase error:", error);
        setFirebaseError(true);
        setLoading(false);
      }
    );

    return () => { clearTimeout(timeout); unsub(); };
  }, []);

  const handleSelectGroup = async (group) => {
    setMyGroup(group);
    setMyGroupState(group);
    try {
      const snap = await get(ref(db, `game/groupCounts/${group.id}`));
      await update(ref(db, "game/groupCounts"), {
        [group.id]: (snap.val() ?? 0) + 1,
      });
    } catch (e) { console.error(e); }
  };

  const handleLeaveGroup = async () => {
    if (myGroup) {
      try {
        const snap = await get(ref(db, `game/groupCounts/${myGroup.id}`));
        await update(ref(db, "game/groupCounts"), {
          [myGroup.id]: Math.max(0, (snap.val() ?? 1) - 1),
        });
      } catch (e) { console.error(e); }
    }
    clearMyGroup();
    setMyGroupState(null);
  };

  // ── Pantalla de carga ─────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{
        minHeight: "100dvh", background: "var(--bg)",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: 16,
        fontFamily: "'Courier New', monospace",
      }}>
        <div style={{ fontSize: 28, animation: "spin 1.2s linear infinite" }}>⟳</div>
        <div style={{ color: "#2e2e52", letterSpacing: 4, fontSize: 11 }}>CARGANDO...</div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ── Error de Firebase ─────────────────────────────────────────────
  if (firebaseError) {
    return (
      <div style={{
        minHeight: "100dvh", background: "var(--bg)",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        fontFamily: "'Courier New', monospace", padding: 24, textAlign: "center",
      }}>
        <div style={{ fontSize: 40, marginBottom: 20 }}>⚠️</div>
        <div style={{ fontSize: 14, color: "#f87171", letterSpacing: 3, marginBottom: 12, fontWeight: "bold" }}>
          ERROR DE CONEXIÓN
        </div>
        <div style={{ fontSize: 12, color: "#5a5a90", letterSpacing: 1, lineHeight: 1.8, maxWidth: 340 }}>
          No se pudo conectar con Firebase.<br/>
          Verificá que las credenciales en <code style={{ color: "#7b68ee" }}>src/firebase.js</code> sean correctas
          y que las reglas de la base de datos permitan lectura y escritura.
        </div>
        <button
          onClick={() => window.location.reload()}
          style={{
            marginTop: 28, background: "#7b68ee", border: "none", color: "#fff",
            padding: "12px 28px", borderRadius: 8, cursor: "pointer",
            fontFamily: "'Courier New', monospace", fontSize: 13, letterSpacing: 2,
          }}>
          REINTENTAR
        </button>
      </div>
    );
  }

  // ── App normal ────────────────────────────────────────────────────
  if (!myGroup) {
    return (
      <GroupSelect
        groups={GROUPS}
        onSelect={handleSelectGroup}
        groupCounts={groupCounts}
      />
    );
  }

  return <Game myGroup={myGroup} onLeaveGroup={handleLeaveGroup} />;
}

