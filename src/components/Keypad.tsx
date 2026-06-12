import type { Digit } from "../game/types";

type KeypadProps = {
  blockedDigits?: Digit[];
  disabled?: boolean;
  onClear: () => void;
  onDigit: (digit: Digit) => void;
};

const digits: Digit[] = [1, 2, 3, 4, 5, 6, 7, 8, 9];

export function Keypad({
  blockedDigits = [],
  disabled = false,
  onClear,
  onDigit,
}: KeypadProps) {
  return (
    <section className="keypad" aria-label="Number input">
      {digits.map((digit) => (
        <button
          className="key"
          data-testid={`key-${digit}`}
          disabled={disabled || blockedDigits.includes(digit)}
          key={digit}
          onClick={() => onDigit(digit)}
          type="button"
        >
          {digit}
        </button>
      ))}
      <button
        className="key key-erase"
        data-testid="erase-button"
        disabled={disabled}
        onClick={onClear}
        type="button"
      >
        Erase
      </button>
    </section>
  );
}
