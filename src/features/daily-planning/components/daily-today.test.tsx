import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DailyToday } from "@/features/daily-planning/components/daily-today";

const refresh = vi.fn();
const saveDayNote = vi.fn().mockResolvedValue({
  message: "Day note saved.",
  ok: true,
});
const setPlanItemDone = vi.fn().mockResolvedValue({ ok: true });

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

vi.mock("@/features/daily-planning/actions", () => ({
  saveDayNoteAction: (...args: unknown[]) => saveDayNote(...args),
  setPlanItemDoneAction: (...args: unknown[]) => setPlanItemDone(...args),
}));

const todayData = {
  calendar: {
    connection: null,
    isOutOfOffice: false,
    meetings: [],
  },
  dayNote: {
    body: "Call Vision payloads looked stable.",
    is_important: true,
  },
  dueFollowUps: 2,
  items: [
    {
      id: "item-1",
      kind: "ticket",
      planItem: { execution_status: "planned", id: "plan-item-1", position: 0 },
      system_priority: "normal",
      ticket_number: "1909",
      title: "Update customer address",
      tracking_state: "active",
    },
  ],
  plan: {
    id: "plan-1",
    intention: "Finish the oldest tickets first.",
    status: "active",
  },
  timeZone: "America/Guatemala",
} as unknown as Parameters<typeof DailyToday>[0]["data"];

describe("DailyToday", () => {
  beforeEach(() => {
    refresh.mockClear();
    saveDayNote.mockClear();
    setPlanItemDone.mockClear();
  });
  afterEach(cleanup);

  it("saves the day note from the Today sidebar", async () => {
    render(<DailyToday data={todayData} workDate="2026-08-03" />);

    const note = screen.getByLabelText("Day note");
    expect(note).toHaveValue("Call Vision payloads looked stable.");
    expect(screen.getByLabelText("Important note")).toBeChecked();

    fireEvent.change(note, {
      target: { value: "Reviewed report exports before EOD." },
    });
    fireEvent.click(screen.getByLabelText("Important note"));
    fireEvent.click(screen.getByRole("button", { name: "Save note" }));

    await waitFor(() =>
      expect(saveDayNote).toHaveBeenCalledWith({
        body: "Reviewed report exports before EOD.",
        important: false,
        workDate: "2026-08-03",
      }),
    );
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Day note saved.",
    );
    expect(refresh).toHaveBeenCalled();
  });
});
