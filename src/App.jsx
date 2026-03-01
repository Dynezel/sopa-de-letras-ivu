import { useState, useEffect, useCallback, useRef } from "react";
import { db } from "./firebase";
import { ref, onValue, set, update, get } from "firebase/database";

// ── CONFIG ───────────────────────────────────────────────────────────────────
const WORDS = ["GATO", "PERRO", "ROJO", "AZUL", "SOL", "LUNA", "MESA", "AMOR", "PAZ", "MAR"];

const GROUPS = [
  { id: 1, name: "Grupo 1", color: "#FF6B6B", emoji: "🔴" },
  { id: 2, name: "Grupo 2", color: "#4ECDC4", emoji: "🩵" },
  { id: 3, name: "Grupo 3", color: "#FFE66D", emoji: "🟡" },
  { id: 4, name: "Grupo 4", color: "#A8E6CF", emoji: "🟢" },
  { id: 5, name: "Grupo 5", color: "#FF8B94", emoji: "🌸" },
  { id: 6, name: "Grupo 6", color: "#B4A7D6", emoji: "🟣" },
  { id: 7, name: "Grupo 7", color: "#F9C74F", emoji: "🟠" },
  { id: 8, name: "Grupo 8", color: "#90BE6D", emoji: "💚" },
];

const GRID_SIZE = 14;
const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const ADMIN_PASSWORD = "admin123";

// ── WORD PLACEMENT ───────────────────────────────────────────────────────────
function buildGrid(words, seed) {
  // Simple seeded random so all players get the same grid when seed matches
  let s = seed || Date.now();
  const rand = () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0xffffffff; };

  const grid = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(null));
  const placed = [];
  const directions = [[0,1],[1,0],[1,1],[0,-1],[-1,0],[-1,-1],[1,-1],[-1,1]];

  for (const word of words) {
    let success = false;
    for (let attempt = 0; attempt < 300 && !success; attempt++) {
      const [dr, dc] = directions[Math.floor(rand() * directions.length)];
      const startR = Math.floor(rand() * GRID_SIZE);
      const startC = Math.floor(rand() * GRID_SIZE);
      const endR = startR + dr * (word.length - 1);
      const endC = startC + dc * (word.length - 1);
      if (endR < 0 || endR >= GRID_SIZE || endC < 0 || endC >= GRID_SIZE) continue;
      let fits = true;
      for (let i = 0; i < word.length; i++) {
        const cell = grid[startR + dr * i][startC + dc * i];
        if (cell && cell.letter !== word[i]) { fits = false; break; }
      }
      if (!fits) continue;
      const cells = [];
      for (let i = 0; i < word.length; i++) {
        const r = startR + dr * i, c = startC + dc * i;
        grid[r][c] = { letter: word[i] };
        cells.push([r, c]);
      }
      placed.push({ word, cells });
      success = true;
    }
  }
  for (let r = 0; r < GRID_SIZE; r++)
    for (let c = 0; c < GRID_SIZE; c++)
      if (!grid[r][c])
        grid[r][c] = { letter: LETTERS[Math.floor(rand() * 26)] };

  return { grid, placed };
}

// ── LOCAL STORAGE (for group selection only) ─────────────────────────────────
const getMyGroup = () => {
  try { return JSON.parse(localStorage.getItem("wh_mygroup")); } catch { return null; }
};
const setMyGroupLS = (g) => {
  try { localStorage.setItem("wh_mygroup", JSON.stringify(g)); } catch {}
};

// ── GROUP SELECT ─────────────────────────────────────────────────────────────
function GroupSelect({ groups, onSelect, groupCounts }) {
  const [hovered, setHovered] = useState(null);
  return (
    <div style={{
      minHeight: "100dvh", background: "#080808",
      fontFamily: "'Courier New', monospace", display: "flex", flexDirection: "column",
    }}>
      <div style={{ padding: "44px 24px 24px", textAlign: "center" }}>
        <div style={{ fontSize: "clamp(30px,9vw,52px)", fontWeight: "bold", letterSpacing: 6, color: "#fff", marginBottom: 6 }}>
          WORDHUNT
        </div>
        <div style={{ fontSize: 11, color: "#333", letterSpacing: 4, marginBottom: 32 }}>SOPA DE LETRAS · 8 GRUPOS</div>
        <div style={{
          fontSize: 13, color: "#666", letterSpacing: 2, padding: "12px 20px",
          background: "#0f0f0f", borderRadius: 8, border: "1px solid #1a1a1a", display: "inline-block",
        }}>Seleccioná tu grupo para jugar</div>
      </div>
      <div style={{
        padding: "0 18px 48px", display: "grid", gridTemplateColumns: "1fr 1fr",
        gap: 12, maxWidth: 480, margin: "0 auto", width: "100%",
      }}>
        {groups.map(g => (
          <button key={g.id} onClick={() => onSelect(g)}
            onPointerEnter={() => setHovered(g.id)}
            onPointerLeave={() => setHovered(null)}
            style={{
              background: hovered === g.id ? g.color + "18" : "#0d0d0d",
              border: `2px solid ${hovered === g.id ? g.color : "#1a1a1a"}`,
              borderRadius: 14, padding: "22px 16px", cursor: "pointer", color: "#fff",
              transition: "all 0.18s", transform: hovered === g.id ? "scale(1.04)" : "scale(1)",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
              boxShadow: hovered === g.id ? `0 0 28px ${g.color}33` : "none",
            }}>
            <div style={{ fontSize: 34 }}>{g.emoji}</div>
            <div style={{ fontSize: 12, fontWeight: "bold", letterSpacing: 3, color: hovered === g.id ? g.color : "#bbb", transition: "color 0.18s" }}>
              {g.name}
            </div>
            {(groupCounts[g.id] ?? 0) > 0 && (
              <div style={{ fontSize: 10, color: "#444", background: "#111", borderRadius: 10, padding: "2px 9px", letterSpacing: 1 }}>
                {groupCounts[g.id]} jugador{groupCounts[g.id] !== 1 ? "es" : ""}
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── ADMIN PANEL ──────────────────────────────────────────────────────────────
function AdminPanel({ gameStarted, onToggle, onShuffle, groups, firstFinder, words, onClose, onResetGame }) {
  const firstFinds = {};
  groups.forEach(g => { firstFinds[g.id] = 0; });
  Object.values(firstFinder).forEach(gid => { if (firstFinds[gid] !== undefined) firstFinds[gid]++; });

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.93)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 1000, fontFamily: "'Courier New', monospace", overflowY: "auto", padding: "20px 0",
    }}>
      <div style={{
        background: "#080808", border: "1px solid #222", borderRadius: 14,
        padding: "28px 22px", width: "min(92vw, 460px)", color: "#fff",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 17, letterSpacing: 4, color: "#ddd", fontWeight: "bold" }}>⚙ ADMIN</div>
            <div style={{ fontSize: 10, color: "#333", letterSpacing: 2, marginTop: 2 }}>PANEL DE CONTROL</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "1px solid #222", color: "#555", borderRadius: 6, padding: "5px 12px", cursor: "pointer", fontSize: 13 }}>✕</button>
        </div>

        {/* Toggle */}
        <div style={{
          background: gameStarted ? "#061506" : "#150606",
          border: `1px solid ${gameStarted ? "#1a3d1a" : "#3d1a1a"}`,
          borderRadius: 10, padding: 20, marginBottom: 14, textAlign: "center",
        }}>
          <div style={{ fontSize: 9, color: "#444", letterSpacing: 3, marginBottom: 8 }}>ESTADO DEL JUEGO</div>
          <div style={{ fontSize: 18, fontWeight: "bold", color: gameStarted ? "#4CAF50" : "#f44336", marginBottom: 16, animation: gameStarted ? "none" : "pulse 1.5s infinite" }}>
            {gameStarted ? "● EN CURSO" : "● ESPERANDO INICIO"}
          </div>
          <button onClick={onToggle} style={{
            background: gameStarted ? "#c0392b" : "#27ae60", border: "none", color: "#fff",
            padding: "13px 0", borderRadius: 8, cursor: "pointer", fontSize: 14,
            fontWeight: "bold", letterSpacing: 2, width: "100%",
          }}>
            {gameStarted ? "⏹  DETENER JUEGO" : "▶  INICIAR JUEGO"}
          </button>
        </div>

        {/* Shuffle */}
        <button onClick={onShuffle} style={{
          width: "100%", background: "#0f0f0f", border: "1px solid #2a2a2a",
          color: "#888", padding: "11px 0", borderRadius: 8, cursor: "pointer",
          fontSize: 13, letterSpacing: 2, marginBottom: 22,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        }}>
          🔀 MEZCLAR SOPA DE LETRAS
        </button>

        {/* Scoreboard */}
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontSize: 9, color: "#333", letterSpacing: 3, marginBottom: 14 }}>🏆 PRIMEROS EN ENCONTRAR</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[...groups].sort((a, b) => (firstFinds[b.id] ?? 0) - (firstFinds[a.id] ?? 0)).map((g, idx) => {
              const score = firstFinds[g.id] ?? 0;
              const pct = words.length > 0 ? (score / words.length) * 100 : 0;
              return (
                <div key={g.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ fontSize: 11, width: 16, textAlign: "right" }}>{idx === 0 && score > 0 ? "🥇" : ""}</div>
                  <span style={{ fontSize: 14 }}>{g.emoji}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                      <span style={{ fontSize: 10, color: "#aaa", letterSpacing: 1 }}>{g.name}</span>
                      <span style={{ fontSize: 10, color: score > 0 ? g.color : "#333" }}>{score} primera{score !== 1 ? "s" : ""}</span>
                    </div>
                    <div style={{ background: "#111", borderRadius: 3, height: 4, overflow: "hidden" }}>
                      <div style={{ height: "100%", background: g.color, width: `${pct}%`, transition: "width 0.5s", boxShadow: pct > 0 ? `0 0 6px ${g.color}66` : "none" }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Word status */}
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontSize: 9, color: "#333", letterSpacing: 3, marginBottom: 12 }}>ESTADO DE PALABRAS</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {words.map(w => {
              const gid = firstFinder[w];
              const g = gid ? groups.find(x => x.id === gid) : null;
              return (
                <div key={w} style={{
                  fontSize: 10, padding: "4px 10px", borderRadius: 4,
                  background: g ? g.color + "22" : "#0f0f0f",
                  border: `1px solid ${g ? g.color + "55" : "#1a1a1a"}`,
                  color: g ? g.color : "#333", letterSpacing: 1,
                  display: "flex", alignItems: "center", gap: 5,
                }}>
                  {g && <span style={{ fontSize: 12 }}>{g.emoji}</span>}
                  {w}
                </div>
              );
            })}
          </div>
        </div>

        <button onClick={onResetGame} style={{
          width: "100%", background: "none", border: "1px solid #1e1e1e",
          color: "#333", padding: 10, borderRadius: 8, cursor: "pointer", fontSize: 11, letterSpacing: 2,
        }}>🔄 REINICIAR TODO</button>
      </div>
    </div>
  );
}

// ── CELL ─────────────────────────────────────────────────────────────────────
function Cell({ data, isSelected, foundColor, onStart, onEnter }) {
  return (
    <div onPointerDown={onStart} onPointerEnter={onEnter} style={{
      display: "flex", alignItems: "center", justifyContent: "center",
      aspectRatio: "1", borderRadius: 4,
      fontSize: "clamp(10px,2.8vw,16px)", fontWeight: "bold",
      fontFamily: "'Courier New', monospace", cursor: "pointer",
      userSelect: "none", WebkitUserSelect: "none", touchAction: "none",
      transition: "background 0.1s, transform 0.1s",
      transform: isSelected ? "scale(1.18)" : "scale(1)",
      background: foundColor ? foundColor + "cc" : isSelected ? "#ffffff2e" : "#ffffff08",
      color: foundColor ? "#fff" : isSelected ? "#fff" : "#aaa",
      border: isSelected ? "1px solid #ffffff55" : "1px solid transparent",
      boxShadow: foundColor ? `0 0 10px ${foundColor}55` : "none",
    }}>{data.letter}</div>
  );
}

// ── GAME ─────────────────────────────────────────────────────────────────────
function Game({ myGroup, groups, onLeaveGroup }) {
  const [gameState, setGameState] = useState({
    started: false,
    seed: null,
    groupFoundWords: {},  // { groupId: [word, ...] }
    firstFinder: {},       // { word: groupId }
    groupCounts: {},
  });

  const [gridData, setGridData] = useState(null); // { grid, placed }
  const [showAdmin, setShowAdmin] = useState(false);
  const [showPwDialog, setShowPwDialog] = useState(false);
  const [pwInput, setPwInput] = useState("");
  const [pwError, setPwError] = useState(false);
  const [selecting, setSelecting] = useState([]);
  const [isSelecting, setIsSelecting] = useState(false);
  const [flash, setFlash] = useState(null);
  const flashTimeout = useRef(null);

  const { started, seed, groupFoundWords, firstFinder, groupCounts } = gameState;
  const myFound = groupFoundWords[myGroup.id] ?? [];

  // ── Firebase realtime listener ──
  useEffect(() => {
    const gameRef = ref(db, "game");
    const unsub = onValue(gameRef, (snap) => {
      const data = snap.val();
      if (!data) return;
      setGameState({
        started: data.started ?? false,
        seed: data.seed ?? null,
        groupFoundWords: data.groupFoundWords ?? {},
        firstFinder: data.firstFinder ?? {},
        groupCounts: data.groupCounts ?? {},
      });
    });
    return () => unsub();
  }, []);

  // ── Rebuild grid when seed changes ──
  useEffect(() => {
    if (seed !== null) {
      setGridData(buildGrid(WORDS, seed));
    }
  }, [seed]);

  // ── Admin actions ──
  const toggleGame = async () => {
    const snap = await get(ref(db, "game"));
    const cur = snap.val() ?? {};
    const newSeed = cur.seed ?? Date.now();
    await update(ref(db, "game"), {
      started: !cur.started,
      seed: newSeed,
    });
  };

  const shuffleGrid = async () => {
    const newSeed = Date.now();
    await update(ref(db, "game"), {
      seed: newSeed,
      groupFoundWords: {},
      firstFinder: {},
    });
  };

  const resetGame = async () => {
    await set(ref(db, "game"), {
      started: false,
      seed: Date.now(),
      groupFoundWords: {},
      firstFinder: {},
      groupCounts: gameState.groupCounts,
    });
  };

  // ── Selection logic ──
  const foundCellColors = {};
  if (gridData) {
    for (const pw of gridData.placed) {
      const firstGid = firstFinder[pw.word];
      if (firstGid) {
        const g = groups.find(x => x.id === firstGid);
        if (g) pw.cells.forEach(([r, c]) => { foundCellColors[`${r},${c}`] = g.color; });
      }
    }
  }

  const selectedSet = new Set(selecting.map(([r, c]) => `${r},${c}`));

  const checkSelection = useCallback(async (sel) => {
    if (!gridData || sel.length < 2) return;
    const selKey = sel.map(([r, c]) => `${r},${c}`).join("|");

    for (const pw of gridData.placed) {
      if ((groupFoundWords[myGroup.id] ?? []).includes(pw.word)) continue;
      const fwd = pw.cells.map(([r, c]) => `${r},${c}`).join("|");
      const bwd = [...pw.cells].reverse().map(([r, c]) => `${r},${c}`).join("|");
      if (selKey !== fwd && selKey !== bwd) continue;

      const isFirst = !firstFinder[pw.word];
      const updates = {};
      updates[`game/groupFoundWords/${myGroup.id}`] = [...(groupFoundWords[myGroup.id] ?? []), pw.word];
      if (isFirst) updates[`game/firstFinder/${pw.word}`] = myGroup.id;
      await update(ref(db), updates);

      clearTimeout(flashTimeout.current);
      setFlash({ word: pw.word, color: myGroup.color, isFirst });
      flashTimeout.current = setTimeout(() => setFlash(null), 1500);
      return;
    }
  }, [gridData, groupFoundWords, firstFinder, myGroup]);

  const handleStart = (r, c) => { if (!started) return; setIsSelecting(true); setSelecting([[r, c]]); };
  const handleEnter = (r, c) => {
    if (!isSelecting) return;
    const first = selecting[0];
    if (!first) return;
    const dr = r - first[0], dc = c - first[1];
    const len = Math.max(Math.abs(dr), Math.abs(dc));
    if (len === 0) return;
    if (dr !== 0 && dc !== 0 && Math.abs(dr) !== Math.abs(dc)) return;
    const udr = dr / len, udc = dc / len;
    const newSel = [];
    for (let i = 0; i <= len; i++)
      newSel.push([first[0] + Math.round(udr * i), first[1] + Math.round(udc * i)]);
    setSelecting(newSel);
  };
  const handleEnd = () => {
    if (!isSelecting) return;
    setIsSelecting(false);
    checkSelection(selecting);
    setSelecting([]);
  };

  const submitPw = () => {
    if (pwInput === ADMIN_PASSWORD) {
      setShowAdmin(true); setShowPwDialog(false); setPwInput(""); setPwError(false);
    } else { setPwError(true); setPwInput(""); }
  };

  const firstFinds = {};
  groups.forEach(g => { firstFinds[g.id] = 0; });
  Object.values(firstFinder).forEach(gid => { if (firstFinds[gid] !== undefined) firstFinds[gid]++; });

  const myFirstFinds = firstFinds[myGroup.id] ?? 0;
  const allFound = myFound.length === WORDS.length;

  return (
    <div onPointerUp={handleEnd} onPointerLeave={handleEnd} style={{
      minHeight: "100dvh", background: "#080808", color: "#e0e0e0",
      fontFamily: "'Courier New', monospace", touchAction: "none", overflowX: "hidden",
    }}>
      {/* Header */}
      <div style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "#080808", borderBottom: "1px solid #111",
        padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            background: myGroup.color + "18", border: `1px solid ${myGroup.color}55`,
            borderRadius: 20, padding: "5px 13px", display: "flex", alignItems: "center", gap: 6,
          }}>
            <span style={{ fontSize: 16 }}>{myGroup.emoji}</span>
            <span style={{ fontSize: 11, color: myGroup.color, letterSpacing: 2, fontWeight: "bold" }}>{myGroup.name}</span>
          </div>
          <button onClick={onLeaveGroup} style={{ background: "none", border: "none", color: "#333", cursor: "pointer", fontSize: 10, letterSpacing: 1, padding: "4px" }}>cambiar</button>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {!started && <div style={{ fontSize: 9, color: "#f44336", letterSpacing: 2, padding: "3px 8px", border: "1px solid #f4433622", borderRadius: 4, animation: "pulse 1.5s infinite" }}>● ESPERANDO</div>}
          <button onClick={() => setShowPwDialog(true)} style={{ background: "#0f0f0f", border: "1px solid #1a1a1a", color: "#444", borderRadius: 6, padding: "5px 10px", cursor: "pointer", fontSize: 13 }}>⚙</button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ padding: "8px 14px", display: "flex", gap: 8, alignItems: "center" }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ fontSize: 9, color: "#333", letterSpacing: 2 }}>ENCONTRADAS</span>
            <span style={{ fontSize: 9, color: myGroup.color }}>{myFound.length}/{WORDS.length}</span>
          </div>
          <div style={{ background: "#111", borderRadius: 3, height: 4, overflow: "hidden" }}>
            <div style={{ height: "100%", background: myGroup.color, width: `${(myFound.length / WORDS.length) * 100}%`, transition: "width 0.5s", boxShadow: `0 0 8px ${myGroup.color}66` }} />
          </div>
        </div>
        <div style={{
          background: myFirstFinds > 0 ? myGroup.color + "22" : "#0f0f0f",
          border: `1px solid ${myFirstFinds > 0 ? myGroup.color + "55" : "#1a1a1a"}`,
          borderRadius: 8, padding: "5px 11px",
          display: "flex", flexDirection: "column", alignItems: "center", minWidth: 54,
        }}>
          <span style={{ fontSize: 9, color: "#444", letterSpacing: 1 }}>1ros</span>
          <span style={{ fontSize: 16, fontWeight: "bold", color: myFirstFinds > 0 ? myGroup.color : "#222", lineHeight: 1.2 }}>{myFirstFinds}</span>
        </div>
      </div>

      {allFound && started && (
        <div style={{ margin: "6px 14px", padding: "12px", background: myGroup.color + "18", border: `1px solid ${myGroup.color}55`, borderRadius: 10, textAlign: "center" }}>
          <span style={{ fontSize: 20 }}>🎉 </span>
          <span style={{ fontSize: 12, color: myGroup.color, letterSpacing: 2, fontWeight: "bold" }}>¡COMPLETASTE TODAS!</span>
          {myFirstFinds > 0 && <div style={{ fontSize: 10, color: "#666", marginTop: 4 }}>Encontraste {myFirstFinds} palabra{myFirstFinds !== 1 ? "s" : ""} primero 🏆</div>}
        </div>
      )}

      {/* Flash */}
      {flash && (
        <div style={{
          position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
          background: flash.isFirst ? flash.color : "#222", color: "#fff",
          fontSize: flash.isFirst ? 22 : 18, fontWeight: "bold",
          padding: flash.isFirst ? "20px 38px" : "16px 30px",
          borderRadius: 12, letterSpacing: 3, zIndex: 500,
          border: flash.isFirst ? "none" : `2px solid ${flash.color}`,
          boxShadow: flash.isFirst ? `0 0 60px ${flash.color}` : `0 0 20px ${flash.color}44`,
          animation: "fadeInOut 1.5s ease", pointerEvents: "none", textAlign: "center",
        }}>
          {flash.isFirst ? `⚡ ${flash.word}` : `✓ ${flash.word}`}
          <div style={{ fontSize: 11, marginTop: 4, opacity: 0.8, letterSpacing: 2 }}>
            {flash.isFirst ? "¡PRIMERO!" : "ya encontrada"}
          </div>
        </div>
      )}

      {/* Grid */}
      <div style={{ padding: "6px 10px", position: "relative" }}>
        {!started && (
          <div style={{
            position: "absolute", inset: 0, zIndex: 10,
            backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)",
            display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 6,
          }}>
            <div style={{ textAlign: "center", color: "#fff", background: "#000000bb", padding: "26px 34px", borderRadius: 12, border: "1px solid #1a1a1a" }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>🔒</div>
              <div style={{ fontSize: 14, fontWeight: "bold", letterSpacing: 3, marginBottom: 6 }}>JUEGO NO INICIADO</div>
              <div style={{ fontSize: 10, color: "#555", letterSpacing: 1 }}>El admin arrancará el juego...</div>
            </div>
          </div>
        )}
        {gridData ? (
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`, gap: 2 }}>
            {gridData.grid.map((row, r) =>
              row.map((cell, c) => (
                <Cell key={`${r}-${c}`} data={cell}
                  isSelected={selectedSet.has(`${r},${c}`)}
                  foundColor={foundCellColors[`${r},${c}`] || null}
                  onStart={() => handleStart(r, c)}
                  onEnter={() => handleEnter(r, c)}
                />
              ))
            )}
          </div>
        ) : (
          <div style={{ height: 300, display: "flex", alignItems: "center", justifyContent: "center", color: "#222", fontSize: 11, letterSpacing: 3 }}>
            CARGANDO GRILLA...
          </div>
        )}
      </div>

      {/* Words */}
      <div style={{ padding: "12px 14px 44px" }}>
        <div style={{ fontSize: 9, color: "#2a2a2a", letterSpacing: 3, marginBottom: 10 }}>PALABRAS A ENCONTRAR</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {WORDS.map(w => {
            const iMyFound = myFound.includes(w);
            const firstGid = firstFinder[w];
            const firstG = firstGid ? groups.find(x => x.id === firstGid) : null;
            const iWasFirst = firstGid === myGroup.id;
            return (
              <div key={w} style={{
                fontSize: 11, padding: "5px 11px", borderRadius: 4,
                background: iMyFound ? myGroup.color + "20" : "#0d0d0d",
                color: iMyFound ? myGroup.color : "#444",
                border: `1px solid ${iWasFirst ? myGroup.color + "99" : iMyFound ? myGroup.color + "44" : "#151515"}`,
                textDecoration: iMyFound ? "line-through" : "none",
                letterSpacing: 1, fontWeight: iWasFirst ? "bold" : "normal",
                transition: "all 0.3s", display: "flex", alignItems: "center", gap: 5,
              }}>
                {firstG && !iWasFirst && <span style={{ fontSize: 12 }}>{firstG.emoji}</span>}
                {iWasFirst && <span style={{ fontSize: 10 }}>⚡</span>}
                {w}
              </div>
            );
          })}
        </div>
        <div style={{ marginTop: 12, display: "flex", gap: 14, flexWrap: "wrap" }}>
          <span style={{ fontSize: 9, color: "#2a2a2a", letterSpacing: 1 }}>⚡ = encontraste primero</span>
          <span style={{ fontSize: 9, color: "#2a2a2a", letterSpacing: 1 }}>emoji = quién llegó primero</span>
        </div>
      </div>

      {/* PW Dialog */}
      {showPwDialog && (
        <div style={{ position: "fixed", inset: 0, background: "#000000cc", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 900 }}>
          <div style={{ background: "#080808", border: "1px solid #1e1e1e", borderRadius: 12, padding: 28, width: "min(86vw,320px)" }}>
            <div style={{ fontSize: 12, letterSpacing: 3, marginBottom: 16, color: "#888" }}>ACCESO ADMIN</div>
            <input type="password" value={pwInput}
              onChange={e => { setPwInput(e.target.value); setPwError(false); }}
              onKeyDown={e => e.key === "Enter" && submitPw()}
              placeholder="Contraseña..." autoFocus
              style={{ width: "100%", background: "#0f0f0f", border: `1px solid ${pwError ? "#f44336" : "#1e1e1e"}`, color: "#fff", padding: "10px 14px", borderRadius: 6, fontSize: 16, outline: "none", boxSizing: "border-box", marginBottom: 4 }}
            />
            {pwError && <div style={{ fontSize: 10, color: "#f44336", marginBottom: 10, letterSpacing: 1 }}>Contraseña incorrecta</div>}
            {!pwError && <div style={{ marginBottom: 10 }} />}
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => { setShowPwDialog(false); setPwInput(""); setPwError(false); }} style={{ flex: 1, background: "#0f0f0f", border: "1px solid #1e1e1e", color: "#555", padding: 10, borderRadius: 6, cursor: "pointer", fontSize: 12 }}>Cancelar</button>
              <button onClick={submitPw} style={{ flex: 1, background: "#27ae60", border: "none", color: "#fff", padding: 10, borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: "bold" }}>Entrar</button>
            </div>
          </div>
        </div>
      )}

      {showAdmin && (
        <AdminPanel
          gameStarted={started} onToggle={toggleGame} onShuffle={shuffleGrid}
          groups={groups} firstFinder={firstFinder} words={WORDS}
          onClose={() => setShowAdmin(false)} onResetGame={resetGame}
        />
      )}

      <style>{`
        * { box-sizing: border-box; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes fadeInOut {
          0%{opacity:0;transform:translate(-50%,-50%) scale(0.6)}
          20%{opacity:1;transform:translate(-50%,-50%) scale(1.08)}
          70%{opacity:1;transform:translate(-50%,-50%) scale(1)}
          100%{opacity:0;transform:translate(-50%,-50%) scale(0.88)}
        }
      `}</style>
    </div>
  );
}

// ── ROOT ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [myGroup, setMyGroup] = useState(null);
  const [groupCounts, setGroupCounts] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = getMyGroup();
    if (saved) setMyGroup(saved);

    const countsRef = ref(db, "game/groupCounts");
    const unsub = onValue(countsRef, snap => {
      setGroupCounts(snap.val() ?? {});
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleSelectGroup = async (group) => {
    setMyGroupLS(group);
    setMyGroup(group);
    const snap = await get(ref(db, `game/groupCounts/${group.id}`));
    const cur = snap.val() ?? 0;
    await update(ref(db, "game/groupCounts"), { [group.id]: cur + 1 });
  };

  const handleLeaveGroup = async () => {
    if (myGroup) {
      const snap = await get(ref(db, `game/groupCounts/${myGroup.id}`));
      const cur = snap.val() ?? 1;
      await update(ref(db, "game/groupCounts"), { [myGroup.id]: Math.max(0, cur - 1) });
    }
    setMyGroupLS(null);
    setMyGroup(null);
  };

  if (loading) return (
    <div style={{ minHeight: "100dvh", background: "#080808", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Courier New', monospace", color: "#222", letterSpacing: 4, fontSize: 12 }}>
      CARGANDO...
    </div>
  );

  if (!myGroup) return <GroupSelect groups={GROUPS} onSelect={handleSelectGroup} groupCounts={groupCounts} />;
  return <Game myGroup={myGroup} groups={GROUPS} onLeaveGroup={handleLeaveGroup} />;
}
