import { useState } from "react";

/**
 * Maneja la lógica de selección de celdas con el dedo/mouse.
 * Devuelve el set de celdas seleccionadas y los handlers de eventos.
 */
export function useGridSelection({ started, onSelectionEnd }) {
  const [selecting, setSelecting] = useState([]);
  const [isSelecting, setIsSelecting] = useState(false);

  const selectedSet = new Set(selecting.map(([r, c]) => `${r},${c}`));

  const handleStart = (r, c) => {
    if (!started) return;
    setIsSelecting(true);
    setSelecting([[r, c]]);
  };

  const handleEnter = (r, c) => {
    if (!isSelecting) return;
    const first = selecting[0];
    if (!first) return;

    const dr = r - first[0];
    const dc = c - first[1];
    const len = Math.max(Math.abs(dr), Math.abs(dc));
    if (len === 0) return;

    // Solo líneas rectas (horizontal, vertical, diagonal)
    if (dr !== 0 && dc !== 0 && Math.abs(dr) !== Math.abs(dc)) return;

    const udr = dr / len;
    const udc = dc / len;
    const newSel = [];
    for (let i = 0; i <= len; i++)
      newSel.push([first[0] + Math.round(udr * i), first[1] + Math.round(udc * i)]);

    setSelecting(newSel);
  };

  const handleEnd = () => {
    if (!isSelecting) return;
    setIsSelecting(false);
    onSelectionEnd(selecting);
    setSelecting([]);
  };

  return { selectedSet, handleStart, handleEnter, handleEnd };
}
