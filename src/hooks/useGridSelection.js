import { useState, useRef, useCallback } from "react";

/**
 * Selección de celdas compatible con mobile.
 *
 * El problema: en touch, onPointerEnter/onMouseEnter NO se dispara
 * mientras el dedo está apoyado. La solución es escuchar onPointerMove
 * en el contenedor de la grilla y usar elementFromPoint para detectar
 * sobre qué celda está el dedo en cada momento.
 *
 * Cada celda debe tener data-row y data-col en el DOM.
 */
export function useGridSelection({ started, onSelectionEnd }) {
  const [selecting, setSelecting] = useState([]);
  const isSelectingRef = useRef(false);
  const firstCellRef   = useRef(null);
  const selectingRef   = useRef([]);   // ref espejo para leer en callbacks sin stale closure

  const selectedSet = new Set(selecting.map(([r, c]) => `${r},${c}`));

  // Calcula la línea recta desde firstCell hasta (r,c)
  const buildLine = (first, r, c) => {
    const dr  = r - first[0];
    const dc  = c - first[1];
    const len = Math.max(Math.abs(dr), Math.abs(dc));
    if (len === 0) return [first];
    // Solo horizontales, verticales y diagonales exactas
    if (dr !== 0 && dc !== 0 && Math.abs(dr) !== Math.abs(dc)) return null;
    const udr = dr / len;
    const udc = dc / len;
    const line = [];
    for (let i = 0; i <= len; i++)
      line.push([first[0] + Math.round(udr * i), first[1] + Math.round(udc * i)]);
    return line;
  };

  // Obtiene [row, col] de un elemento del DOM
  const getCellCoords = (el) => {
    if (!el) return null;
    const cell = el.closest("[data-row]");
    if (!cell) return null;
    return [parseInt(cell.dataset.row, 10), parseInt(cell.dataset.col, 10)];
  };

  // ── Inicio del arrastre ──────────────────────────────────────────────────
  const handlePointerDown = useCallback((e) => {
    if (!started) return;
    const coords = getCellCoords(e.target);
    if (!coords) return;

    e.currentTarget.setPointerCapture(e.pointerId);   // captura todos los eventos aunque salga del elemento
    isSelectingRef.current = true;
    firstCellRef.current   = coords;
    selectingRef.current   = [coords];
    setSelecting([coords]);
  }, [started]);

  // ── Movimiento del dedo / mouse ──────────────────────────────────────────
  const handlePointerMove = useCallback((e) => {
    if (!isSelectingRef.current) return;

    // elementFromPoint necesita coordenadas de cliente
    const el     = document.elementFromPoint(e.clientX, e.clientY);
    const coords = getCellCoords(el);
    if (!coords) return;

    const line = buildLine(firstCellRef.current, coords[0], coords[1]);
    if (!line) return;

    // Solo actualizar el estado si la selección cambió (evita renders innecesarios)
    const newKey = line.map(([r, c]) => `${r},${c}`).join("|");
    const oldKey = selectingRef.current.map(([r, c]) => `${r},${c}`).join("|");
    if (newKey === oldKey) return;

    selectingRef.current = line;
    setSelecting(line);
  }, []);

  // ── Fin del arrastre ─────────────────────────────────────────────────────
  const handlePointerUp = useCallback((e) => {
    if (!isSelectingRef.current) return;
    isSelectingRef.current = false;
    onSelectionEnd(selectingRef.current);
    selectingRef.current = [];
    setSelecting([]);
  }, [onSelectionEnd]);

  return {
    selectedSet,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
  };
}
