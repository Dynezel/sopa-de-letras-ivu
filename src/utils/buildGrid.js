import { GRID_SIZE } from "../config";

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const DIRECTIONS = [[0,1],[1,0],[1,1],[0,-1],[-1,0],[-1,-1],[1,-1],[-1,1]];

/**
 * Construye la sopa de letras con un seed fijo para que
 * todos los jugadores vean la misma grilla.
 */
export function buildGrid(words, seed) {
  let s = seed || Date.now();
  const rand = () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };

  const grid = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(null));
  const placed = [];

  for (const word of words) {
    let success = false;
    for (let attempt = 0; attempt < 300 && !success; attempt++) {
      const [dr, dc] = DIRECTIONS[Math.floor(rand() * DIRECTIONS.length)];
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

  // Rellenar celdas vacías con letras al azar
  for (let r = 0; r < GRID_SIZE; r++)
    for (let c = 0; c < GRID_SIZE; c++)
      if (!grid[r][c])
        grid[r][c] = { letter: LETTERS[Math.floor(rand() * 26)] };

  return { grid, placed };
}
