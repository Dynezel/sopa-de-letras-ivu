// ── Palabras del juego ────────────────────────────────────────────────────────
// Las palabras con espacios/tildes se escriben sin ellos para la sopa de letras.
// Lo que ponés acá es exactamente lo que aparece en la grilla.
export const WORDS = [
  "FRANCESAS",
  "PASSO",
  "MEDICINA",
  "CECILIAGRIERSON",
  "ELVIRALOPEZ",
  "PERSEVERANCIA",
  "PARLAMENTO",
  "MATERNAL",
  "NOSOTRAS",
  "INFERIORIDAD",
  "IGUALDAD",
  "UNIVERSIDAD",
  "DERECHOS",
  "ASOCIACION",
  "MODERNIDAD",
  "MUJERES",
  "TRABAJO",
  "ESCUELAS",
  "LEY",
];

// ── Etiquetas para mostrar (con espacios y tildes, para la lista de palabras) ─
// Deben estar en el mismo orden que WORDS arriba.
export const WORD_LABELS = {
  FRANCESAS:        "Francesas",
  PASSO:            "Passo",
  MEDICINA:         "Medicina",
  CECILIAGRIERSON:  "Cecilia Grierson",
  ELVIRALOPEZ:      "Elvira López",
  PERSEVERANCIA:    "Perseverancia",
  PARLAMENTO:       "Parlamento",
  MATERNAL:         "Maternal",
  NOSOTRAS:         "Nosotras",
  INFERIORIDAD:     "Inferioridad",
  IGUALDAD:         "Igualdad",
  UNIVERSIDAD:      "Universidad",
  DERECHOS:         "Derechos",
  ASOCIACION:       "Asociación",
  MODERNIDAD:       "Modernidad",
  MUJERES:          "Mujeres",
  TRABAJO:          "Trabajo",
  ESCUELAS:         "Escuelas",
  LEY:              "Ley",
};

// ── Grupos ────────────────────────────────────────────────────────────────────
export const GROUPS = [
  { id: 1, name: "Grupo 1", color: "#FF6B6B", emoji: "🔴" },
  { id: 2, name: "Grupo 2", color: "#4ECDC4", emoji: "🩵" },
  { id: 3, name: "Grupo 3", color: "#FFE66D", emoji: "🟡" },
  { id: 4, name: "Grupo 4", color: "#A8E6CF", emoji: "🟢" },
  { id: 5, name: "Grupo 5", color: "#FF8B94", emoji: "🌸" },
  { id: 6, name: "Grupo 6", color: "#B4A7D6", emoji: "🟣" },
  { id: 7, name: "Grupo 7", color: "#F9C74F", emoji: "🟠" },
  { id: 8, name: "Grupo 8", color: "#90BE6D", emoji: "💚" },
];

// ── Ajustes generales ─────────────────────────────────────────────────────────
// Grilla de 20×20 para que entren palabras largas como CECILIAGRIERSON (15 letras)
export const GRID_SIZE = 20;
export const ADMIN_PASSWORD = "admin123";
