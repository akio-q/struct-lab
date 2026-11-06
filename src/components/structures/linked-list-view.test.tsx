import { fireEvent, render, screen, within } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { LinkedListView } from "@/components/structures/linked-list-view"

function finishTrace() {
  for (let step = 0; step < 30; step += 1) {
    const stepForward = screen.getByRole("button", { name: "Step forward" })

    if (stepForward.hasAttribute("disabled")) {
      return
    }

    fireEvent.click(stepForward)
  }

  throw new Error("Trace did not reach its final frame.")
}

function cardValues(): string[] {
  return screen
    .getAllByTestId(/^linked-list-card-/)
    .map((card) => card.getAttribute("data-testid") ?? "")
    .map((testId) => {
      const card = screen.getByTestId(testId)
      const value = card.querySelector("[data-testid^='linked-list-value-']")

      return value?.textContent ?? ""
    })
}

describe("LinkedListView", () => {
  it("renders the stage, operations, and inspector", () => {
    render(<LinkedListView />)

    expect(screen.getByRole("heading", { name: "Doubly Linked List" })).toBeVisible()
    expect(screen.getByTestId("linked-list-size")).toHaveTextContent("3")
    expect(screen.getByTestId("linked-list-status")).toHaveTextContent("linked")
    expect(screen.getByLabelText("Value")).toHaveValue(42)
    expect(screen.getByLabelText("Target node")).toHaveValue("linked-list-node-1")

    for (const name of [
      "Prepend",
      "Append",
      "Insert before",
      "Insert after",
      "Remove",
      "Traverse",
    ]) {
      expect(screen.getByRole("button", { name })).toBeEnabled()
    }

    expect(screen.getByText("Idle")).toBeInTheDocument()
    expect(screen.getByText(/Prepend and append are O\(1\)/)).toBeInTheDocument()

    const inspector = screen.getByRole("complementary", { name: "Linked list inspector" })

    for (const label of [
      "head",
      "head address",
      "tail",
      "tail address",
      "size",
      "integrity",
      "next address",
    ]) {
      expect(within(inspector).getByText(label)).toBeInTheDocument()
    }

    expect(within(inspector).getByText("12")).toBeInTheDocument()
    expect(within(inspector).getByText("24")).toBeInTheDocument()
    expect(within(inspector).getAllByText("0x1000").length).toBeGreaterThanOrEqual(1)
    expect(within(inspector).getAllByText("0x1020").length).toBeGreaterThanOrEqual(1)
    expect(within(inspector).getAllByText("0x1030")).toHaveLength(2)
    expect(within(inspector).getByText("ok")).toBeInTheDocument()

    expect(screen.getByText(/No steps yet/)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Play" })).toBeDisabled()
  })

  it("shows an address on every node card", () => {
    render(<LinkedListView />)

    expect(screen.getByTestId("linked-list-address-linked-list-node-1")).toHaveTextContent("0x1000")
    expect(screen.getByTestId("linked-list-address-linked-list-node-2")).toHaveTextContent("0x1010")
    expect(screen.getByTestId("linked-list-address-linked-list-node-3")).toHaveTextContent("0x1020")
  })

  it("prepends a value, assigns the next address, and records trace frames", () => {
    render(<LinkedListView />)

    fireEvent.change(screen.getByLabelText("Value"), { target: { value: "99" } })
    fireEvent.click(screen.getByRole("button", { name: "Prepend" }))

    expect(screen.getByTestId("linked-list-size")).toHaveTextContent("4")
    expect(screen.getByTestId("linked-list-value-linked-list-node-4")).toHaveTextContent("99")
    expect(screen.getByTestId("linked-list-address-linked-list-node-4")).toHaveTextContent("0x1030")
    expect(cardValues()).toEqual(["99", "12", "7", "24"])
    expect(screen.getByText("prepend · link")).toBeInTheDocument()
    expect(
      within(screen.getByRole("list")).getByText("Link 99 before 12 and update the head."),
    ).toBeInTheDocument()
    expect(screen.getByText("Step 1 of 2")).toBeInTheDocument()

    const inspector = screen.getByRole("complementary", { name: "Linked list inspector" })

    expect(within(inspector).getByText("99")).toBeInTheDocument()
    expect(within(inspector).getAllByText("0x1030").length).toBeGreaterThanOrEqual(1)
  })

  it("appends a value at the tail", () => {
    render(<LinkedListView />)

    fireEvent.change(screen.getByLabelText("Value"), { target: { value: "5" } })
    fireEvent.click(screen.getByRole("button", { name: "Append" }))
    finishTrace()

    expect(screen.getByTestId("linked-list-size")).toHaveTextContent("4")
    expect(cardValues()).toEqual(["12", "7", "24", "5"])
    expect(
      within(screen.getByRole("list")).getByText("Appended 5; tail is 5, size 4."),
    ).toBeInTheDocument()
  })

  it("inserts a value after the selected target node", () => {
    render(<LinkedListView />)

    fireEvent.change(screen.getByLabelText("Target node"), {
      target: { value: "linked-list-node-2" },
    })
    fireEvent.change(screen.getByLabelText("Value"), { target: { value: "99" } })
    fireEvent.click(screen.getByRole("button", { name: "Insert after" }))
    finishTrace()

    expect(screen.getByTestId("linked-list-size")).toHaveTextContent("4")
    expect(cardValues()).toEqual(["12", "7", "99", "24"])
    expect(
      within(screen.getByRole("list")).getByText("Inserted 99 after 7; size 4."),
    ).toBeInTheDocument()
  })

  it("inserts a value before the selected target node", () => {
    render(<LinkedListView />)

    fireEvent.change(screen.getByLabelText("Target node"), {
      target: { value: "linked-list-node-2" },
    })
    fireEvent.change(screen.getByLabelText("Value"), { target: { value: "99" } })
    fireEvent.click(screen.getByRole("button", { name: "Insert before" }))
    finishTrace()

    expect(screen.getByTestId("linked-list-size")).toHaveTextContent("4")
    expect(cardValues()).toEqual(["12", "99", "7", "24"])
    expect(
      within(screen.getByRole("list")).getByText("Inserted 99 before 7; size 4."),
    ).toBeInTheDocument()
  })

  it("removes the selected target node", () => {
    render(<LinkedListView />)

    fireEvent.change(screen.getByLabelText("Target node"), {
      target: { value: "linked-list-node-2" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Remove" }))
    finishTrace()

    expect(screen.getByTestId("linked-list-size")).toHaveTextContent("2")
    expect(screen.getByTestId("linked-list-link-count")).toHaveTextContent("2 links")
    expect(
      within(screen.getByRole("list")).getByText("Removed 7; 2 nodes remain."),
    ).toBeInTheDocument()

    const inspector = screen.getByRole("complementary", { name: "Linked list inspector" })

    expect(within(inspector).queryByText("node 7")).not.toBeInTheDocument()
    expect(within(inspector).getByText("node 12")).toBeInTheDocument()
    expect(within(inspector).getByText("node 24")).toBeInTheDocument()
  })

  it("traverses from head to tail", () => {
    render(<LinkedListView />)

    fireEvent.click(screen.getByRole("button", { name: "Traverse" }))

    expect(screen.getByText("traverse · start")).toBeInTheDocument()
    expect(screen.getByText("Step 1 of 4")).toBeInTheDocument()

    finishTrace()

    expect(
      within(screen.getByRole("list")).getByText(
        "Traversal visited all 3 nodes and reached the tail.",
      ),
    ).toBeInTheDocument()
  })

  it("steps forward and resets playback", () => {
    render(<LinkedListView />)

    fireEvent.click(screen.getByRole("button", { name: "Prepend" }))

    expect(screen.getByText("Step 1 of 2")).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Step forward" }))

    expect(screen.getByText("Step 2 of 2")).toBeInTheDocument()
    expect(screen.getByText("prepend · complete")).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Reset trace" }))

    expect(screen.getByText("Step 1 of 2")).toBeInTheDocument()
    expect(screen.getByText("prepend · link")).toBeInTheDocument()
  })

  it("relinks a pointer and repairs the resulting integrity issues", () => {
    render(<LinkedListView />)

    fireEvent.click(screen.getByRole("button", { name: "next pointer of 12 to 7" }))

    const inspector = screen.getByRole("complementary", { name: "Linked list inspector" })

    expect(within(inspector).getByText("12.next → 7")).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Relink selected pointer to 24" }))
    finishTrace()

    expect(screen.getByTestId("linked-list-status")).toHaveTextContent("broken")
    expect(screen.getByTestId("linked-list-integrity-warning")).toHaveTextContent("Broken links")
    expect(
      within(screen.getByRole("list")).getByText(
        "Relinked 12.next to 24; 1 pointer issue still remains.",
      ),
    ).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Repair links" }))
    finishTrace()

    expect(screen.getByTestId("linked-list-status")).toHaveTextContent("linked")
    expect(screen.queryByTestId("linked-list-integrity-warning")).not.toBeInTheDocument()
  })

  it("clears a selected pointer without relinking", () => {
    render(<LinkedListView />)

    fireEvent.click(screen.getByRole("button", { name: "prev pointer of 7 to 12" }))

    const inspector = screen.getByRole("complementary", { name: "Linked list inspector" })

    expect(within(inspector).getByText("7.prev → 12")).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Clear selection" }))

    expect(screen.queryByRole("button", { name: "Clear selection" })).not.toBeInTheDocument()
    expect(screen.getByTestId("linked-list-hint")).toHaveTextContent(
      "Next pointers run above the nodes; prev pointers run below.",
    )
  })

  it("shows an empty state after removing every node", () => {
    render(<LinkedListView />)

    for (let removal = 0; removal < 3; removal += 1) {
      fireEvent.click(screen.getByRole("button", { name: "Remove" }))
      finishTrace()
    }

    expect(screen.getByText("The linked list is empty.")).toBeInTheDocument()
    expect(screen.getByTestId("linked-list-size")).toHaveTextContent("0")
    expect(screen.getByTestId("linked-list-status")).toHaveTextContent("empty")
    expect(screen.getByLabelText("Target node")).toBeDisabled()

    for (const name of ["Insert before", "Insert after", "Remove"]) {
      expect(screen.getByRole("button", { name })).toBeDisabled()
    }

    const inspector = screen.getByRole("complementary", { name: "Linked list inspector" })

    expect(within(inspector).getByText(/No nodes to address yet/)).toBeInTheDocument()
    expect(within(inspector).getAllByText("null").length).toBeGreaterThanOrEqual(2)
  })

  it("validates empty numeric input before inserting", () => {
    render(<LinkedListView />)

    fireEvent.change(screen.getByLabelText("Value"), { target: { value: "" } })
    fireEvent.click(screen.getByRole("button", { name: "Prepend" }))

    expect(screen.getByRole("alert")).toHaveTextContent("Enter a finite number for the value.")
    expect(screen.getByLabelText("Value")).toHaveAttribute("aria-invalid", "true")
    expect(screen.getByLabelText("Value")).toHaveFocus()
    expect(screen.getByText(/No steps yet/)).toBeInTheDocument()
  })

  it("changes playback speed with the bracket shortcut", () => {
    render(<LinkedListView />)

    fireEvent.keyDown(window, { code: "BracketRight", key: "]" })

    expect(screen.getByRole("button", { name: "1.5×" })).toHaveAttribute("aria-pressed", "true")
  })
})
