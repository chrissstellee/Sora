import { existsSync } from "node:fs";

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SidebarProvider } from "@repo/ui/components/ui/sidebar";

import { AUTH_LINKS } from "../auth/constants/auth";
import { Topbar } from "./components/topbar";
import { NAV_SECTIONS } from "./constants/nav-links";

vi.mock("@/core/config/env", () => ({
  publicStellarConfig: {
    network: "testnet",
    networkPassphrase: "Test SDF Network ; September 2015",
    horizonUrl: "https://horizon-testnet.stellar.org",
    explorerUrl: "https://stellar.expert/explorer/testnet",
    uiLabel: "Stellar Testnet",
  },
}));

describe("Testnet UI safety", () => {
  it("discloses the network and simulated product data", () => {
    render(
      <SidebarProvider>
        <Topbar />
      </SidebarProvider>,
    );
    expect(screen.getByText("Stellar Testnet")).toBeInTheDocument();
    expect(screen.getByText("Demo Data")).toBeInTheDocument();
  });

  it("does not navigate to removed or absent routes", () => {
    const hrefs = NAV_SECTIONS.flatMap((section) => section.links.map((link) => link.href));
    expect(hrefs).not.toContain("/api-keys");
    expect(hrefs).not.toContain("/template");
    expect(AUTH_LINKS).toEqual([]);
    expect(existsSync(new URL("../../app/template/page.tsx", import.meta.url))).toBe(false);
    expect(existsSync(new URL("../../app/(pages)/api-keys/page.tsx", import.meta.url))).toBe(false);
    expect(
      existsSync(new URL("../api-keys/hooks/use-generate-api-key-dialog.ts", import.meta.url)),
    ).toBe(false);
  });
});
