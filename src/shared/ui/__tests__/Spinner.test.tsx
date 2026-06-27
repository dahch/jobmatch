import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Spinner } from "@/shared/ui/Spinner";

describe("Spinner", () => {
  it("renders an SVG element", () => {
    const { container } = render(<Spinner />);
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
  });

  it("applies md size by default", () => {
    const { container } = render(<Spinner />);
    const svg = container.querySelector("svg");
    expect(svg?.getAttribute("class")).toContain("h-6");
    expect(svg?.getAttribute("class")).toContain("w-6");
  });

  it("applies sm size", () => {
    const { container } = render(<Spinner size="sm" />);
    const svg = container.querySelector("svg");
    expect(svg?.getAttribute("class")).toContain("h-4");
    expect(svg?.getAttribute("class")).toContain("w-4");
  });

  it("applies lg size", () => {
    const { container } = render(<Spinner size="lg" />);
    const svg = container.querySelector("svg");
    expect(svg?.getAttribute("class")).toContain("h-8");
    expect(svg?.getAttribute("class")).toContain("w-8");
  });

  it("has animate-spin class", () => {
    const { container } = render(<Spinner />);
    const svg = container.querySelector("svg");
    expect(svg?.getAttribute("class")).toContain("animate-spin");
  });

  it("merges custom className", () => {
    const { container } = render(<Spinner className="my-spinner" />);
    const svg = container.querySelector("svg");
    expect(svg?.getAttribute("class")).toContain("my-spinner");
  });
});
