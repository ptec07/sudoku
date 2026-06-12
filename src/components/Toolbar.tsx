type ToolbarProps = {
  canUndo: boolean;
  disabled?: boolean;
  muted: boolean;
  notesMode: boolean;
  onMuteToggle: () => void;
  onNewGame: () => void;
  onNotesToggle: () => void;
  onUndo: () => void;
};

export function Toolbar({
  canUndo,
  disabled = false,
  muted,
  notesMode,
  onMuteToggle,
  onNewGame,
  onNotesToggle,
  onUndo,
}: ToolbarProps) {
  return (
    <div className="toolbar" aria-label="Game tools">
      <button
        aria-label="Undo last move"
        className="tool-button icon-button"
        data-testid="undo-button"
        disabled={!canUndo}
        onClick={onUndo}
        title="Undo"
        type="button"
      >
        <UndoIcon />
      </button>
      <button
        aria-label="Start a new puzzle"
        className="tool-button"
        data-testid="new-game-button"
        onClick={onNewGame}
        type="button"
      >
        New
      </button>
      <button
        aria-label="Toggle notes mode"
        aria-pressed={notesMode}
        className="tool-button"
        data-testid="notes-button"
        disabled={disabled}
        onClick={onNotesToggle}
        type="button"
      >
        Notes
      </button>
      <button
        aria-label="Toggle sound"
        aria-pressed={muted}
        className="tool-button"
        data-testid="mute-button"
        onClick={onMuteToggle}
        type="button"
      >
        {muted ? "Muted" : "Mute"}
      </button>
    </div>
  );
}

function UndoIcon() {
  return (
    <svg aria-hidden="true" className="undo-icon" fill="none" viewBox="0 0 24 24">
      <path
        d="M8 8H5V5M5.4 8A7 7 0 1 1 5 16"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.9"
      />
    </svg>
  );
}
