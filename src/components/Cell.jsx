import "./Cell.css";

export function Cell({ data, row, col, isSelected, foundColor }) {
  return (
    <div
      className={[
        "cell",
        isSelected ? "cell--selected" : "",
        foundColor  ? "cell--found"    : "",
      ].filter(Boolean).join(" ")}
      data-row={row}
      data-col={col}
      style={
        foundColor
          ? { background: foundColor + "cc", boxShadow: `0 0 10px ${foundColor}55` }
          : undefined
      }
    >
      {data.letter}
    </div>
  );
}
