import "./Cell.css";

export function Cell({ data, isSelected, foundColor, onStart, onEnter }) {
  return (
    <div
      className={[
        "cell",
        isSelected ? "cell--selected" : "",
        foundColor ? "cell--found" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={
        foundColor
          ? {
              background: foundColor + "cc",
              boxShadow: `0 0 10px ${foundColor}55`,
            }
          : undefined
      }
      onPointerDown={onStart}
      onPointerEnter={onEnter}
    >
      {data.letter}
    </div>
  );
}
