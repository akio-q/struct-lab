import { expect, test } from "@playwright/test"
import { openPlayground, structurePanel, structureTab, traceSteps } from "./helpers"

test("array operations update the canvas and trace", async ({ page }) => {
  await openPlayground(page)

  const panel = structurePanel(page, "Array")
  const trace = traceSteps(page)

  await expect(panel.getByTestId("array-length")).toHaveText("length 3 / 4")

  await panel.getByRole("spinbutton", { name: "Value", exact: true }).fill("42")
  await panel.getByRole("button", { name: "Append", exact: true }).click()

  await expect(panel.getByTestId("array-length")).toHaveText("length 4 / 4")
  await expect(
    panel.getByRole("img", { name: /Dynamic array with 4 of 4 slots used: 12, 7, 24, 42\./ }),
  ).toBeVisible()
  await expect(trace.getByText("Appended 42; length 4 of 4.")).toBeVisible()

  await panel.getByRole("spinbutton", { name: "Value", exact: true }).fill("99")
  await panel.getByRole("spinbutton", { name: "Index", exact: true }).fill("1")
  await panel.getByRole("button", { name: "Insert", exact: true }).click()

  await expect(panel.getByTestId("array-length")).toHaveText("length 5 / 8")
  await expect(
    panel.getByRole("img", { name: /Dynamic array with 5 of 8 slots used: 12, 99, 7, 24, 42\./ }),
  ).toBeVisible()
  await expect(trace.getByText("Inserted 99 at index 1; length 5 of 8.")).toBeVisible()

  await panel.getByRole("spinbutton", { name: "Index", exact: true }).fill("2")
  await panel.getByRole("button", { name: "Access", exact: true }).click()

  await expect(panel.getByText("access · read")).toBeVisible()
  await expect(trace.getByText("items[2] = 7.")).toBeVisible()

  await panel.getByRole("spinbutton", { name: "Index", exact: true }).fill("0")
  await panel.getByRole("button", { name: "Remove", exact: true }).click()

  await expect(panel.getByTestId("array-length")).toHaveText("length 4 / 8")
  await expect(
    panel.getByRole("img", { name: /Dynamic array with 4 of 8 slots used: 99, 7, 24, 42\./ }),
  ).toBeVisible()
  await expect(trace.getByText("Removed 12; length 4 of 8.")).toBeVisible()

  await panel.getByRole("button", { name: "Pop", exact: true }).click()

  await expect(panel.getByTestId("array-length")).toHaveText("length 3 / 8")
  await expect(
    panel.getByRole("img", { name: /Dynamic array with 3 of 8 slots used: 99, 7, 24\./ }),
  ).toBeVisible()
  await expect(trace.getByText("Removed 42; length 3 of 8.")).toBeVisible()

  await panel.getByRole("button", { name: "Clear", exact: true }).click()

  await expect(panel.getByTestId("array-length")).toHaveText("length 0 / 8")
  await expect(panel.getByRole("img", { name: /Dynamic array with 8 empty slots\./ })).toBeVisible()
  await expect(trace.getByText("Cleared the array; capacity 8 is unchanged.")).toBeVisible()
  await expect(panel.getByText("The array is empty.")).toBeVisible()
})

test("stack operations update the top pointer and trace", async ({ page }) => {
  await openPlayground(page)
  await structureTab(page, "Stack").click()

  const panel = structurePanel(page, "Stack")
  const trace = traceSteps(page)

  await expect(panel.getByTestId("stack-depth")).toHaveText("depth 3 / 6")

  await panel.getByRole("spinbutton", { name: "Value", exact: true }).fill("42")
  await panel.getByRole("button", { name: "Push", exact: true }).click()

  await expect(panel.getByTestId("stack-depth")).toHaveText("depth 4 / 6")
  await expect(panel.getByTestId("stack-top")).toHaveAttribute("data-top-index", "3")
  await expect(
    panel.getByRole("img", {
      name: /Stack with 4 of 6 slots used; top is 42 at index 3\./,
    }),
  ).toBeVisible()
  await expect(trace.getByText("Pushed 42; top is index 3, depth 4 of 6.")).toBeVisible()

  await panel.getByRole("button", { name: "Peek", exact: true }).click()

  await expect(panel.getByText("peek · peek")).toBeVisible()
  await expect(trace.getByText("Top is index 3: 42.")).toBeVisible()

  await panel.getByRole("button", { name: "Pop", exact: true }).click()

  await expect(panel.getByTestId("stack-depth")).toHaveText("depth 3 / 6")
  await expect(panel.getByTestId("stack-top")).toHaveAttribute("data-top-index", "2")
  await expect(
    panel.getByRole("img", {
      name: /Stack with 3 of 6 slots used; top is 24 at index 2\./,
    }),
  ).toBeVisible()
  await expect(trace.getByText("Popped 42; top is index 2, depth 3 of 6.")).toBeVisible()
})

test("queue operations update the head and tail pointers", async ({ page }) => {
  await openPlayground(page)
  await structureTab(page, "Queue").click()

  const panel = structurePanel(page, "Queue")
  const trace = traceSteps(page)

  await expect(panel.getByTestId("queue-size")).toHaveText("size 3 / 6")

  await panel.getByRole("spinbutton", { name: "Value", exact: true }).fill("42")
  await panel.getByRole("button", { name: "Enqueue", exact: true }).click()

  await expect(panel.getByTestId("queue-size")).toHaveText("size 4 / 6")
  await expect(panel.getByTestId("queue-tail")).toHaveAttribute("data-tail-index", "3")
  await expect(
    panel.getByRole("img", {
      name: /Queue with 4 of 6 slots used; head is 12 at index 0, tail is 42 at index 3\./,
    }),
  ).toBeVisible()
  await expect(
    trace.getByText("Enqueued 42; head is index 0, tail is index 3, size 4 of 6."),
  ).toBeVisible()

  await panel.getByRole("button", { name: "Dequeue", exact: true }).click()

  await expect(panel.getByTestId("queue-size")).toHaveText("size 3 / 6")
  await expect(panel.getByTestId("queue-head")).toHaveAttribute("data-head-index", "0")
  await expect(panel.getByTestId("queue-tail")).toHaveAttribute("data-tail-index", "2")
  await expect(
    panel.getByRole("img", {
      name: /Queue with 3 of 6 slots used; head is 7 at index 0, tail is 42 at index 2\./,
    }),
  ).toBeVisible()
  await expect(
    trace.getByText("Dequeued 12; head is index 0, tail is index 2, size 3 of 6."),
  ).toBeVisible()

  await panel.getByRole("button", { name: "Peek", exact: true }).click()

  await expect(panel.getByText("peek · peek")).toBeVisible()
  await expect(trace.getByText("Head is index 0: 7.")).toBeVisible()
})
