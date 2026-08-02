import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { TicketWorkflowControls } from "./ticket-workflow-controls";

const { refreshMock, updateMock } = vi.hoisted(() => ({
  refreshMock: vi.fn(),
  updateMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock }),
}));

vi.mock("@/features/work-items/actions", () => ({
  updateTicketWorkflowAction: updateMock,
}));

describe("TicketWorkflowControls", () => {
  beforeEach(() => {
    refreshMock.mockReset();
    updateMock.mockReset();
    updateMock.mockResolvedValue({ ok: true, message: "Changes saved." });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("saves a priority change with the complete workflow state", async () => {
    render(
      <TicketWorkflowControls
        operationalStatus="pending"
        systemPriority="medium"
        trackingState="active"
        workItemId="91ddc257-9ed6-4178-bd22-ccb20453cb90"
      />,
    );

    fireEvent.change(screen.getByLabelText("Quick priority"), {
      target: { value: "urgent" },
    });

    await waitFor(() =>
      expect(updateMock).toHaveBeenCalledWith({
        operationalStatus: "pending",
        systemPriority: "urgent",
        trackingState: "active",
        workItemId: "91ddc257-9ed6-4178-bd22-ccb20453cb90",
      }),
    );
    expect(await screen.findByText("Changes saved.")).toBeVisible();
    expect(refreshMock).toHaveBeenCalledOnce();
  });

  it("does not close a ticket when confirmation is declined", () => {
    vi.spyOn(window, "confirm").mockReturnValueOnce(false);
    render(
      <TicketWorkflowControls
        operationalStatus="resolved"
        systemPriority="medium"
        trackingState="active"
        workItemId="91ddc257-9ed6-4178-bd22-ccb20453cb90"
      />,
    );

    fireEvent.change(screen.getByLabelText("Quick tracking"), {
      target: { value: "closed" },
    });

    expect(updateMock).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Quick tracking")).toHaveValue("active");
  });
});
