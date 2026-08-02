import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PageHeader } from "./page-header";

describe("PageHeader", () => {
  it("provides calm navigation away from a long detail title", () => {
    render(
      <PageHeader
        action={<button type="button">Edit</button>}
        backLink={{ href: "/work", label: "Work inventory" }}
        description="Ticket · Active"
        title="A very long ticket title that needs its own wrapping space"
        titleSize="compact"
      />,
    );

    expect(
      screen.getByRole("link", { name: /work inventory/i }),
    ).toHaveAttribute("href", "/work");
    expect(screen.getByRole("heading", { level: 1 })).toHaveClass(
      "text-[34px]",
      "break-words",
    );
    expect(screen.getByRole("button", { name: "Edit" })).toBeInTheDocument();
  });
});
