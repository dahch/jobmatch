import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Badge } from "@/shared/ui/Badge";

describe("Badge", () => {
  it("renders children text", () => {
    render(<Badge>Active</Badge>);
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("applies default variant styles", () => {
    render(<Badge>Default</Badge>);
    const badge = screen.getByText("Default");
    expect(badge.className).toContain("bg-surface-100");
  });

  it("applies success variant styles", () => {
    render(<Badge variant="success">Success</Badge>);
    const badge = screen.getByText("Success");
    expect(badge.className).toContain("bg-emerald-50");
  });

  it("applies warning variant styles", () => {
    render(<Badge variant="warning">Warning</Badge>);
    const badge = screen.getByText("Warning");
    expect(badge.className).toContain("bg-amber-50");
  });

  it("applies danger variant styles", () => {
    render(<Badge variant="danger">Danger</Badge>);
    const badge = screen.getByText("Danger");
    expect(badge.className).toContain("bg-red-50");
  });

  it("applies info variant styles", () => {
    render(<Badge variant="info">Info</Badge>);
    const badge = screen.getByText("Info");
    expect(badge.className).toContain("bg-sky-50");
  });

  it("applies brand variant styles", () => {
    render(<Badge variant="brand">Brand</Badge>);
    const badge = screen.getByText("Brand");
    expect(badge.className).toContain("bg-brand-50");
  });

  it("merges custom className", () => {
    render(<Badge className="my-badge">Custom</Badge>);
    const badge = screen.getByText("Custom");
    expect(badge.className).toContain("my-badge");
  });

  it("renders as a span element", () => {
    render(<Badge>Tag</Badge>);
    const badge = screen.getByText("Tag");
    expect(badge.tagName).toBe("SPAN");
  });
});
