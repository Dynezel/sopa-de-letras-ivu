import { useState } from "react";
import "./GroupSelect.css";

export function GroupSelect({ groups, onSelect, groupCounts }) {
  const [hovered, setHovered] = useState(null);

  return (
    <div className="group-select">
      <div className="group-select__header">
        <div className="group-select__title">WORDHUNT</div>
        <div className="group-select__subtitle">SOPA DE LETRAS · 8 GRUPOS</div>
        <div className="group-select__prompt">Seleccioná tu grupo para jugar</div>
      </div>

      <div className="group-select__grid">
        {groups.map((g) => {
          const isHovered = hovered === g.id;
          return (
            <button
              key={g.id}
              className="group-card"
              onClick={() => onSelect(g)}
              onPointerEnter={() => setHovered(g.id)}
              onPointerLeave={() => setHovered(null)}
              style={{
                background: isHovered ? g.color + "18" : undefined,
                borderColor: isHovered ? g.color : undefined,
                boxShadow: isHovered ? `0 0 28px ${g.color}33` : undefined,
              }}
            >
              <div className="group-card__emoji">{g.emoji}</div>
              <div
                className="group-card__name"
                style={{ color: isHovered ? g.color : undefined }}
              >
                {g.name}
              </div>
              {(groupCounts[g.id] ?? 0) > 0 && (
                <div className="group-card__count">
                  {groupCounts[g.id]} jugador{groupCounts[g.id] !== 1 ? "es" : ""}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
