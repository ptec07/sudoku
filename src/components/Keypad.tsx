import type { Digit } from "../game/types";

type KeypadProps = {
  onDigit: (digit: Digit) => void;
};

const digits: Digit[] = [1, 2, 3, 4, 5, 6, 7, 8, 9];

export function Keypad({ onDigit }: KeypadProps) {
  return (
    <section className="keypad" aria-label="Number input">
      {digits.map((digit) => (
        <button
          className="key"
          data-testid={`key-${digit}`}
          key={digit}
          onClick={() => onDigit(digit)}
          type="button"
        >
          {digit}
        </button>
      ))}
    </section>
  );
}
