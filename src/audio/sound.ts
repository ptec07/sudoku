import type { GameEvent } from "../game/types";

const frequencies: Partial<Record<GameEvent, number>> = {
  cellSelected: 240,
  numberPlaced: 360,
  noteToggled: 300,
  mistake: 130,
  unitCompleted: 520,
  puzzleCompleted: 660,
  undo: 220,
};

let audioContext: AudioContext | null = null;

export function playGameEvents(events: GameEvent[], muted: boolean): void {
  if (muted || events.length === 0) return;

  const event = pickAudibleEvent(events);
  if (!event) return;

  try {
    const context = getAudioContext();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const now = context.currentTime;

    oscillator.frequency.value = frequencies[event] ?? 260;
    oscillator.type = event === "mistake" ? "triangle" : "sine";
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(event === "mistake" ? 0.035 : 0.045, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + getDuration(event));

    oscillator.connect(gain).connect(context.destination);
    oscillator.start(now);
    oscillator.stop(now + getDuration(event) + 0.02);
  } catch {
    // Browsers can block audio until a user gesture. Visual feedback still carries the interaction.
  }
}

function pickAudibleEvent(events: GameEvent[]): GameEvent | undefined {
  return (
    events.find((event) => event === "puzzleCompleted") ??
    events.find((event) => event === "unitCompleted") ??
    events.find((event) => event === "mistake") ??
    events.find((event) => event !== "ignored")
  );
}

function getDuration(event: GameEvent): number {
  if (event === "puzzleCompleted") return 0.7;
  if (event === "unitCompleted") return 0.32;
  if (event === "mistake") return 0.18;
  return 0.12;
}

function getAudioContext(): AudioContext {
  audioContext ??= new AudioContext();
  return audioContext;
}
