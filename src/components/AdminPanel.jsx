import { WORD_LABELS } from "../config";
import "./AdminPanel.css";

export function AdminPanel({
  gameStarted,
  onToggle,
  onShuffle,
  groups,
  firstFinder,
  words,
  onClose,
  onResetGame,
}) {
  // Contar cuántas palabras encontró primero cada grupo
  const firstFinds = {};
  groups.forEach((g) => { firstFinds[g.id] = 0; });
  Object.values(firstFinder).forEach((gid) => {
    if (firstFinds[gid] !== undefined) firstFinds[gid]++;
  });

  const sorted = [...groups].sort(
    (a, b) => (firstFinds[b.id] ?? 0) - (firstFinds[a.id] ?? 0)
  );

  return (
    <div className="admin-overlay">
      <div className="admin-panel">

        {/* Header */}
        <div className="admin-panel__header">
          <div>
            <div className="admin-panel__title">⚙ ADMIN</div>
            <div className="admin-panel__subtitle">PANEL DE CONTROL</div>
          </div>
          <button className="admin-panel__close" onClick={onClose}>✕</button>
        </div>

        {/* Estado del juego */}
        <div className={`admin-status ${gameStarted ? "admin-status--running" : "admin-status--waiting"}`}>
          <div className="admin-status__label">ESTADO DEL JUEGO</div>
          <div className={`admin-status__indicator ${gameStarted ? "admin-status__indicator--running" : "admin-status__indicator--waiting"}`}>
            {gameStarted ? "● EN CURSO" : "● ESPERANDO INICIO"}
          </div>
          <button
            className={`admin-status__btn ${gameStarted ? "admin-status__btn--stop" : "admin-status__btn--start"}`}
            onClick={onToggle}
          >
            {gameStarted ? "⏹  DETENER JUEGO" : "▶  INICIAR JUEGO"}
          </button>
        </div>

        {/* Mezclar */}
        <button className="admin-shuffle-btn" onClick={onShuffle}>
          🔀 MEZCLAR SOPA DE LETRAS
        </button>

        {/* Scoreboard */}
        <div className="admin-section-title">🏆 PRIMEROS EN ENCONTRAR</div>
        <div className="admin-scoreboard">
          {sorted.map((g, idx) => {
            const score = firstFinds[g.id] ?? 0;
            const pct = words.length > 0 ? (score / words.length) * 100 : 0;
            return (
              <div key={g.id} className="admin-score-row">
                <div className="admin-score-medal">
                  {idx === 0 && score > 0 ? "🥇" : ""}
                </div>
                <span className="admin-score-emoji">{g.emoji}</span>
                <div className="admin-score-bar-wrap">
                  <div className="admin-score-bar-label">
                    <span className="admin-score-bar-name">{g.name}</span>
                    <span className="admin-score-bar-value" style={{ color: score > 0 ? g.color : "#333" }}>
                      {score} primera{score !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="admin-score-bar-track">
                    <div
                      className="admin-score-bar-fill"
                      style={{
                        width: `${pct}%`,
                        background: g.color,
                        boxShadow: pct > 0 ? `0 0 6px ${g.color}66` : "none",
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Estado de palabras */}
        <div className="admin-section-title">ESTADO DE PALABRAS</div>
        <div className="admin-words">
          {words.map((w) => {
            const gid = firstFinder[w];
            const g = gid ? groups.find((x) => x.id === gid) : null;
            return (
              <div
                key={w}
                className="admin-word-chip"
                style={{
                  background: g ? g.color + "22" : "#0f0f0f",
                  border: `1px solid ${g ? g.color + "55" : "#1a1a1a"}`,
                  color: g ? g.color : "#333",
                }}
              >
                {g && <span style={{ fontSize: 12 }}>{g.emoji}</span>}
                {WORD_LABELS[w] ?? w}
              </div>
            );
          })}
        </div>

        {/* Reiniciar */}
        <button className="admin-reset-btn" onClick={onResetGame}>
          🔄 REINICIAR TODO
        </button>

      </div>
    </div>
  );
}
