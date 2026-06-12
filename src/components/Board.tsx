import type { BoardCellView, CellIndex } from "../game/types";

type BoardProps = {
  cells: BoardCellView[];
  onSelect: (index: CellIndex) => void;
};

const noteSlots = [1, 2, 3, 4, 5, 6, 7, 8, 9];

export function Board({ cells, onSelect }: BoardProps) {
  return (
    <section className="board" aria-label="Sudoku board" role="grid">
      {cells.map((cell) => (
        <button
          aria-label={cell.ariaLabel}
          aria-selected={cell.selected}
          className={[
            "cell",
            cell.given ? "cell-given" : "",
            cell.selected ? "cell-selected" : "",
            cell.related ? "cell-related" : "",
            cell.sameNumber ? "cell-same-number" : "",
            cell.mistake ? "cell-mistake" : "",
            cell.complete ? "cell-complete" : "",
          ]
            .filter(Boolean)
            .join(" ")}
          data-testid={`cell-${cell.index}`}
          key={cell.index}
          onClick={() => onSelect(cell.index)}
          role="gridcell"
          type="button"
        >
          {cell.value ?? <Notes notes={cell.notes} />}
        </button>
      ))}
    </section>
  );
}

function Notes({ notes }: { notes: number[] }) {
  if (notes.length === 0) return null;

  return (
    <span className="notes" aria-hidden="true">
      {noteSlots.map((note) => (
        <span key={note}>{notes.includes(note) ? note : ""}</span>
      ))}
    </span>
  );
}
