import { useState, useEffect, useCallback, useRef } from "react";
import { ref, onValue, set, update, get } from "firebase/database";
import { db } from "../firebase";
import { buildGrid } from "../utils/buildGrid";
import { WORDS, WORD_LABELS } from "../config";

/**
 * Centraliza todo el estado del juego sincronizado con Firebase.
 * Devuelve el estado y las acciones disponibles.
 */
export function useGameState(myGroup) {
  const [gameState, setGameState] = useState({
    started: false,
    seed: null,
    groupFoundWords: {},
    firstFinder: {},
    groupCounts: {},
  });
  const [gridData, setGridData] = useState(null);
  const [flash, setFlash] = useState(null);
  const flashTimeout = useRef(null);

  const { started, seed, groupFoundWords, firstFinder } = gameState;
  const myFound = groupFoundWords[myGroup?.id] ?? [];

  // Escuchar cambios en Firebase en tiempo real
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

  // Reconstruir la grilla cuando cambia el seed
  useEffect(() => {
    if (seed !== null) setGridData(buildGrid(WORDS, seed));
  }, [seed]);

  // ── Acciones del admin ────────────────────────────────────────────────────
  const toggleGame = async () => {
    const snap = await get(ref(db, "game"));
    const cur = snap.val() ?? {};
    await update(ref(db, "game"), {
      started: !cur.started,
      seed: cur.seed ?? Date.now(),
    });
  };

  const shuffleGrid = async () => {
    await update(ref(db, "game"), {
      seed: Date.now(),
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

  // ── Verificar selección del jugador ──────────────────────────────────────
  const checkSelection = useCallback(async (sel) => {
    if (!gridData || !myGroup || sel.length < 2) return;
    const selKey = sel.map(([r, c]) => `${r},${c}`).join("|");

    for (const pw of gridData.placed) {
      if ((groupFoundWords[myGroup.id] ?? []).includes(pw.word)) continue;

      const fwd = pw.cells.map(([r, c]) => `${r},${c}`).join("|");
      const bwd = [...pw.cells].reverse().map(([r, c]) => `${r},${c}`).join("|");
      if (selKey !== fwd && selKey !== bwd) continue;

      const isFirst = !firstFinder[pw.word];
      const updates = {
        [`game/groupFoundWords/${myGroup.id}`]: [
          ...(groupFoundWords[myGroup.id] ?? []),
          pw.word,
        ],
      };
      if (isFirst) updates[`game/firstFinder/${pw.word}`] = myGroup.id;
      await update(ref(db), updates);

      clearTimeout(flashTimeout.current);
      setFlash({ word: pw.word, label: WORD_LABELS[pw.word] ?? pw.word, color: myGroup.color, isFirst });
      flashTimeout.current = setTimeout(() => setFlash(null), 1500);
      return;
    }
  }, [gridData, groupFoundWords, firstFinder, myGroup]);

  return {
    gameState,
    gridData,
    myFound,
    flash,
    // Acciones
    toggleGame,
    shuffleGrid,
    resetGame,
    checkSelection,
  };
}
