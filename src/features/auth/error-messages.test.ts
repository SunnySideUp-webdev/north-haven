import { describe, expect, it } from "vitest";

import { getCreateAccountErrorMessage } from "./error-messages";

describe("authentication error messages", () => {
  it("explains when the hosted email allowance is temporarily exhausted", () => {
    expect(getCreateAccountErrorMessage("over_email_send_rate_limit")).toBe(
      "North Haven has temporarily reached its email limit. Please wait up to one hour and try again.",
    );
  });

  it("keeps unexpected account errors generic", () => {
    expect(getCreateAccountErrorMessage("unexpected_error")).toBe(
      "We couldn't create the account. Review the details and try again.",
    );
  });
});
