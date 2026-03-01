import { useState } from "react";
import { Cell } from "./Cell";
import { AdminPanel } from "./AdminPanel";
import { useGameState } from "../hooks/useGameState";
import { useGridSelection } from "../hooks/useGridSelection";
import { WORDS, WORD_LABELS, GROUPS, GRID_SIZE, ADMIN_PASSWORD } from "../config";
import "./Game.css";

export function Game({ myGroup, onLeaveGroup }) {
  const {
    gameState, gridData, myFound, flash,
    toggleGame, shuffleGrid, resetGame, checkSelection,
  } = useGameState(myGroup);

  const { started, firstFinder } = gameState;

  const [showAdmin, setShowAdmin]       = useState(false);
  const [showPwDialog, setShowPwDialog] = useState(false);
  const [pwInput, setPwInput]           = useState("");
  const [pwError, setPwError]           = useState(false);

  const { selectedSet, handlePointerDown, handlePointerMove, handlePointerUp } = useGridSelection({
    started,
    onSelectionEnd: checkSelection,
  });

  // Colores de celdas ya encontradas
  const foundCellColors = {};
  if (gridData) {
    for (const pw of gridData.placed) {
      const firstGid = firstFinder[pw.word];
      if (firstGid) {
        const g = GROUPS.find((x) => x.id === firstGid);
        if (g) pw.cells.forEach(([r, c]) => { foundCellColors[`${r},${c}`] = g.color; });
      }
    }
  }

  // Conteo de primeras por grupo
  const firstFinds = {};
  GROUPS.forEach((g) => { firstFinds[g.id] = 0; });
  Object.values(firstFinder).forEach((gid) => {
    if (firstFinds[gid] !== undefined) firstFinds[gid]++;
  });
  const myFirstFinds = firstFinds[myGroup.id] ?? 0;
  const allFound     = myFound.length === WORDS.length;

  const submitPw = () => {
    if (pwInput === ADMIN_PASSWORD) {
      setShowAdmin(true); setShowPwDialog(false); setPwInput(""); setPwError(false);
    } else { setPwError(true); setPwInput(""); }
  };

  return (
    <div className="game">

      {/* ── Header ── */}
      <header className="game-header">
        <div className="game-header__left">
          <div className="game-header__group-badge"
            style={{ background: myGroup.color + "22", border: `1px solid ${myGroup.color}55` }}>
            <span className="game-header__group-emoji">{myGroup.emoji}</span>
            <span className="game-header__group-name" style={{ color: myGroup.color }}>
              {myGroup.name}
            </span>
          </div>
          <button className="game-header__change-btn" onClick={onLeaveGroup}>cambiar</button>
        </div>
        <div className="game-header__right">
          {!started && <div className="game-header__waiting">● ESPERANDO</div>}
          <button className="game-header__admin-btn" onClick={() => setShowPwDialog(true)}>⚙</button>
        </div>
      </header>

      {/* ══ Cuerpo: grilla + sidebar ══════════════════════════════════════ */}
      <div className="game-body">

        {/* ── Grilla ── */}
        <div className="game-grid-wrap">
          {!started && (
            <div className="game-grid-blur">
              <div className="game-grid-blur__box">
                <div className="game-grid-blur__icon">🔒</div>
                <div className="game-grid-blur__title">JUEGO NO INICIADO</div>
                <div className="game-grid-blur__sub">El admin arrancará el juego...</div>
              </div>
            </div>
          )}
          {gridData ? (
            <div className="game-grid"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
              onPointerCancel={handlePointerUp}
            >
              {gridData.grid.map((row, r) =>
                row.map((cell, c) => (
                  <Cell key={`${r}-${c}`} data={cell} row={r} col={c}
                    isSelected={selectedSet.has(`${r},${c}`)}
                    foundColor={foundCellColors[`${r},${c}`] || null}
                  />
                ))
              )}
            </div>
          ) : (
            <div className="game-grid-loading">CARGANDO GRILLA...</div>
          )}
        </div>

        {/* ── Sidebar ── */}
        <div className="game-sidebar">

          {/* Stats */}
          <div className="game-stats">
            <div className="game-stats__progress">
              <div className="game-stats__progress-labels">
                <span className="game-stats__progress-label">ENCONTRADAS</span>
                <span className="game-stats__progress-count" style={{ color: myGroup.color }}>
                  {myFound.length}/{WORDS.length}
                </span>
              </div>
              <div className="game-stats__progress-track">
                <div className="game-stats__progress-fill"
                  style={{ width: `${(myFound.length / WORDS.length) * 100}%`, background: myGroup.color, boxShadow: `0 0 8px ${myGroup.color}66` }}
                />
              </div>
            </div>
            <div className="game-stats__firsts"
              style={{
                background: myFirstFinds > 0 ? myGroup.color + "22" : "var(--bg-raised)",
                border: `1px solid ${myFirstFinds > 0 ? myGroup.color + "55" : "var(--border-dim)"}`,
              }}>
              <span className="game-stats__firsts-label">1ros</span>
              <span className="game-stats__firsts-count"
                style={{ color: myFirstFinds > 0 ? myGroup.color : "var(--text-muted)" }}>
                {myFirstFinds}
              </span>
            </div>
          </div>

          {/* Banner completado */}
          {allFound && started && (
            <div className="game-completed"
              style={{ background: myGroup.color + "18", border: `1px solid ${myGroup.color}55` }}>
              <span style={{ fontSize: 20 }}>🎉 </span>
              <span className="game-completed__title" style={{ color: myGroup.color }}>¡COMPLETASTE TODAS!</span>
              {myFirstFinds > 0 && (
                <div className="game-completed__sub">
                  Encontraste {myFirstFinds} palabra{myFirstFinds !== 1 ? "s" : ""} primero 🏆
                </div>
              )}
            </div>
          )}

          {/* Lista de palabras */}
          <div className="game-words">
            <div className="game-words__title">PALABRAS A ENCONTRAR</div>
            <div className="game-words__list">
              {WORDS.map((w) => {
                const iMyFound  = myFound.includes(w);
                const firstGid  = firstFinder[w];
                const firstG    = firstGid ? GROUPS.find((x) => x.id === firstGid) : null;
                const iWasFirst = firstGid === myGroup.id;
                return (
                  <div key={w} className="game-word-chip"
                    style={{
                      background:     iMyFound ? myGroup.color + "20" : "var(--bg-surface)",
                      color:          iMyFound ? myGroup.color : "var(--text-dim)",
                      border:         `1px solid ${iWasFirst ? myGroup.color + "99" : iMyFound ? myGroup.color + "44" : "var(--border-dim)"}`,
                      textDecoration: iMyFound ? "line-through" : "none",
                      fontWeight:     iWasFirst ? "bold" : "normal",
                    }}>
                    {firstG && !iWasFirst && <span style={{ fontSize: 12 }}>{firstG.emoji}</span>}
                    {iWasFirst && <span style={{ fontSize: 10 }}>⚡</span>}
                    {WORD_LABELS[w] ?? w}
                  </div>
                );
              })}
            </div>
            <div className="game-words__legend">
              <span>⚡ = encontraste primero</span>
            </div>
          </div>

        </div>{/* /sidebar */}
      </div>{/* /body */}

      {/* ── Flash ── */}
      {flash && (
        <div className={`game-flash ${flash.isFirst ? "game-flash--first" : "game-flash--late"}`}
          style={flash.isFirst
            ? { background: flash.color, boxShadow: `0 0 60px ${flash.color}` }
            : { border: `2px solid ${flash.color}`, boxShadow: `0 0 20px ${flash.color}44` }}>
          {flash.isFirst ? `⚡ ${flash.label}` : `✓ ${flash.label}`}
          <div className="game-flash__sub">{flash.isFirst ? "¡PRIMERO!" : "ya encontrada"}</div>
        </div>
      )}

      {/* ── Password dialog ── */}
      {showPwDialog && (
        <div className="pw-overlay">
          <div className="pw-dialog">
            <div className="pw-dialog__title">ACCESO ADMIN</div>
            <input type="password" value={pwInput} autoFocus
              onChange={(e) => { setPwInput(e.target.value); setPwError(false); }}
              onKeyDown={(e) => e.key === "Enter" && submitPw()}
              placeholder="Contraseña..."
              className={`pw-dialog__input ${pwError ? "pw-dialog__input--error" : "pw-dialog__input--normal"}`}
            />
            {pwError
              ? <div className="pw-dialog__error">Contraseña incorrecta</div>
              : <div className="pw-dialog__spacer" />}
            <div className="pw-dialog__buttons">
              <button className="pw-dialog__cancel"
                onClick={() => { setShowPwDialog(false); setPwInput(""); setPwError(false); }}>
                Cancelar
              </button>
              <button className="pw-dialog__submit" onClick={submitPw}>Entrar</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Admin panel ── */}
      {showAdmin && (
        <AdminPanel
          gameStarted={started} onToggle={toggleGame} onShuffle={shuffleGrid}
          groups={GROUPS} firstFinder={firstFinder} words={WORDS}
          onClose={() => setShowAdmin(false)} onResetGame={resetGame}
        />
      )}
    </div>
  );
}
