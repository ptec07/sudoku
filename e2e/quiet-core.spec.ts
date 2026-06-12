import { expect, type Page, test } from "@playwright/test";

test("plays the Quiet Core interaction path", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Quiet Core" })).toBeVisible();
  await expect(page.getByRole("gridcell")).toHaveCount(81);
  await expect(page.getByTestId("difficulty-easy")).toHaveAttribute("aria-pressed", "true");

  const easyBoard = await boardText(page);
  await page.getByTestId("difficulty-hard").click();
  await expect(page.getByTestId("difficulty-hard")).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByTestId("difficulty-hard")).toHaveClass(/difficulty-button-active/);
  await expect(page.getByTestId("difficulty-easy")).not.toHaveClass(/difficulty-button-active/);
  await expect(page.getByLabel("Puzzle status")).toContainText("Hard puzzle");
  await expect.poll(() => boardText(page)).not.toBe(easyBoard);

  const { editableIndex, playableDigit, wrongDigit } = await findEditableCellWithWrongDigit(page);
  const editableCell = page.getByTestId(`cell-${editableIndex}`);

  await editableCell.click();
  await expect(editableCell).toHaveAttribute("aria-selected", "true");
  await expect(page.getByTestId(`key-${wrongDigit}`)).toBeDisabled();

  await page.getByTestId(`key-${playableDigit}`).click();
  await expect(editableCell).toHaveText(String(playableDigit));

  await page.getByTestId("erase-button").click();
  await expect(editableCell).toBeEmpty();

  await page.getByTestId("notes-button").click();
  await expect(page.getByTestId("notes-button")).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByTestId(`key-${wrongDigit}`)).toBeEnabled();
  await page.getByTestId("key-4").click();
  await expect(editableCell).toContainText("4");

  await page.getByTestId("erase-button").click();
  await expect(editableCell).toBeEmpty();

  await page.getByTestId("key-4").click();
  await expect(editableCell).toContainText("4");

  await page.getByTestId("undo-button").click();
  await expect(editableCell).toBeEmpty();

  await page.getByTestId("notes-button").click();
  await expect(page.getByTestId("notes-button")).toHaveAttribute("aria-pressed", "false");
  await expect(page.getByTestId(`key-${wrongDigit}`)).toBeDisabled();

  await page.keyboard.press(String(wrongDigit));
  await expect(editableCell).toHaveClass(/cell-mistake/);
  await expect(editableCell).toBeEmpty();
  await expect(page.getByText("Mistakes: 1/3")).toBeVisible();

  await page.getByTestId("undo-button").click();
  await expect(editableCell).toBeEmpty();

  await page.getByTestId("mute-button").click();
  await expect(page.getByTestId("mute-button")).toHaveAttribute("aria-pressed", "true");

  const beforeNewPuzzle = await boardText(page);
  await page.getByTestId("new-game-button").click();
  await expect(page.getByText("Mistakes: 0/3")).toBeVisible();
  await expect.poll(() => boardText(page)).not.toBe(beforeNewPuzzle);
});

async function findEditableCellWithWrongDigit(page: Page): Promise<{
  editableIndex: number;
  playableDigit: number;
  wrongDigit: number;
}> {
  return page.evaluate(() => {
    const cells = Array.from(
      window.document.querySelectorAll<HTMLButtonElement>('[data-testid^="cell-"]'),
    ).map((cell, index) => ({ index, text: cell.innerText.trim() }));

    for (const cell of cells) {
      if (cell.text !== "") continue;

      const rowStart = Math.floor(cell.index / 9) * 9;
      const wrongDigit = cells
        .slice(rowStart, rowStart + 9)
        .map((rowCell) => Number(rowCell.text))
        .find((digit) => Number.isInteger(digit) && digit >= 1 && digit <= 9);

      const blockedDigits = new Set(
        cells
          .filter((other) => other.index !== cell.index && other.text !== "" && areRelated(cell.index, other.index))
          .map((other) => Number(other.text)),
      );
      const playableDigit = [1, 2, 3, 4, 5, 6, 7, 8, 9].find((digit) => !blockedDigits.has(digit));

      if (wrongDigit && playableDigit) {
        return { editableIndex: cell.index, playableDigit, wrongDigit };
      }
    }

    throw new Error("Could not find an editable cell with a row-based wrong digit.");

    function areRelated(firstIndex: number, secondIndex: number): boolean {
      const firstRow = Math.floor(firstIndex / 9);
      const firstCol = firstIndex % 9;
      const secondRow = Math.floor(secondIndex / 9);
      const secondCol = secondIndex % 9;

      return (
        firstRow === secondRow ||
        firstCol === secondCol ||
        (Math.floor(firstRow / 3) === Math.floor(secondRow / 3) &&
          Math.floor(firstCol / 3) === Math.floor(secondCol / 3))
      );
    }
  });
}

async function boardText(page: Page): Promise<string> {
  return page.evaluate(() =>
    Array.from(window.document.querySelectorAll<HTMLButtonElement>('[data-testid^="cell-"]'))
      .map((cell) => cell.innerText.trim() || ".")
      .join(""),
  );
}
