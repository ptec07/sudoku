import { expect, test } from "@playwright/test";

const solution = [
  5, 3, 4, 6, 7, 8, 9, 1, 2,
  6, 7, 2, 1, 9, 5, 3, 4, 8,
  1, 9, 8, 3, 4, 2, 5, 6, 7,
  8, 5, 9, 7, 6, 1, 4, 2, 3,
  4, 2, 6, 8, 5, 3, 7, 9, 1,
  7, 1, 3, 9, 2, 4, 8, 5, 6,
  9, 6, 1, 5, 3, 7, 2, 8, 4,
  2, 8, 7, 4, 1, 9, 6, 3, 5,
  3, 4, 5, 2, 8, 6, 1, 7, 9,
];

const emptyCells = [
  2, 3, 5, 6, 7, 8,
  10, 11, 15, 16, 17,
  18, 21, 22, 23, 24, 26,
  28, 29, 30, 32, 33, 34,
  37, 38, 40, 42, 43,
  46, 47, 48, 50, 51, 52,
  54, 56, 57, 58, 59, 62,
  63, 64, 65, 69, 70,
  72, 73, 74, 75, 77, 78,
];

test("plays the Quiet Core interaction path", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Quiet Core" })).toBeVisible();
  await expect(page.getByRole("gridcell")).toHaveCount(81);

  await page.getByTestId("cell-2").click();
  await expect(page.getByTestId("cell-2")).toHaveAttribute("aria-selected", "true");

  await page.keyboard.press("4");
  await expect(page.getByTestId("cell-2")).toHaveText("4");

  await page.getByTestId("undo-button").click();
  await expect(page.getByTestId("cell-2")).toBeEmpty();

  await page.getByTestId("notes-button").click();
  await expect(page.getByTestId("notes-button")).toHaveAttribute("aria-pressed", "true");
  await page.getByTestId("key-4").click();
  await expect(page.getByTestId("cell-2")).toContainText("4");

  await page.getByTestId("undo-button").click();
  await expect(page.getByTestId("cell-2")).toBeEmpty();

  await page.getByTestId("notes-button").click();
  await expect(page.getByTestId("notes-button")).toHaveAttribute("aria-pressed", "false");

  await page.getByTestId("key-5").click();
  await expect(page.getByTestId("cell-2")).toHaveClass(/cell-mistake/);
  await expect(page.getByText("Mistakes: 1/3")).toBeVisible();

  await page.getByTestId("undo-button").click();
  await expect(page.getByTestId("cell-2")).toBeEmpty();

  await page.getByTestId("mute-button").click();
  await expect(page.getByTestId("mute-button")).toHaveAttribute("aria-pressed", "true");

  for (const index of emptyCells) {
    await page.getByTestId(`cell-${index}`).click();
    await page.getByTestId(`key-${solution[index]}`).click();
  }

  await expect(page.getByTestId("completion-note")).toContainText("Puzzle complete");
  await expect(page.getByText("Mistakes: 0/3")).toBeVisible();
});
