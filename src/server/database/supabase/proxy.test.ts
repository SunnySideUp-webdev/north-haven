import { describe, expect, it } from "vitest";

import {
  createCanonicalRedirectDocument,
  getLoopbackCanonicalRedirect,
  isGuestOnlyPath,
  isProtectedPath,
} from "./proxy";

describe("authentication route boundaries", () => {
  it("protects every workspace destination and setup", () => {
    expect(isProtectedPath("/today")).toBe(true);
    expect(isProtectedPath("/work/tickets/123")).toBe(true);
    expect(isProtectedPath("/setup")).toBe(true);
  });

  it("keeps authentication entry pages guest-only", () => {
    expect(isGuestOnlyPath("/sign-in")).toBe(true);
    expect(isGuestOnlyPath("/forgot-password")).toBe(true);
    expect(isGuestOnlyPath("/today")).toBe(false);
  });
});

describe("local canonical origin", () => {
  it("moves localhost requests to the configured loopback origin", () => {
    const redirect = getLoopbackCanonicalRedirect(
      new URL("http://localhost:3000/settings?calendar=connected"),
      "http://127.0.0.1:3000",
    );

    expect(redirect?.toString()).toBe(
      "http://127.0.0.1:3000/settings?calendar=connected",
    );
  });

  it("does nothing when the request already uses the canonical origin", () => {
    expect(
      getLoopbackCanonicalRedirect(
        new URL("http://127.0.0.1:3000/today"),
        "http://127.0.0.1:3000",
      ),
    ).toBeNull();
  });

  it("uses the real request host when Next.js normalizes the URL internally", () => {
    expect(
      getLoopbackCanonicalRedirect(
        new URL("http://localhost:3000/sign-in"),
        "http://127.0.0.1:3000",
        "127.0.0.1:3000",
      ),
    ).toBeNull();
  });

  it("does not force canonical redirects for deployed origins", () => {
    expect(
      getLoopbackCanonicalRedirect(
        new URL("https://north-haven-preview.example.com/today"),
        "https://north-haven.example.com",
      ),
    ).toBeNull();
  });

  it("creates a safe browser transition document", () => {
    const document = createCanonicalRedirectDocument(
      new URL("http://127.0.0.1:3000/settings?one=1&two=2"),
    );

    expect(document).toContain(
      "http://127.0.0.1:3000/settings?one=1&amp;two=2",
    );
    expect(document).not.toContain("?one=1&two=2");
  });
});
