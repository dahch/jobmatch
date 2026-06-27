import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Button } from "@/shared/ui/Button";

describe("Button", () => {
  it("renders children text", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole("button", { name: /click me/i })).toBeInTheDocument();
  });

  it("applies primary variant by default", () => {
    render(<Button>Primary</Button>);
    const btn = screen.getByRole("button");
    expect(btn.className).toContain("bg-brand-600");
  });

  it("applies secondary variant styles", () => {
    render(<Button variant="secondary">Secondary</Button>);
    const btn = screen.getByRole("button");
    expect(btn.className).toContain("bg-surface-100");
  });

  it("applies ghost variant styles", () => {
    render(<Button variant="ghost">Ghost</Button>);
    const btn = screen.getByRole("button");
    expect(btn.className).toContain("text-surface-600");
    expect(btn.className).toContain("hover:bg-surface-100");
  });

  it("applies danger variant styles", () => {
    render(<Button variant="danger">Danger</Button>);
    const btn = screen.getByRole("button");
    expect(btn.className).toContain("bg-red-600");
  });

  it("applies outline variant styles", () => {
    render(<Button variant="outline">Outline</Button>);
    const btn = screen.getByRole("button");
    expect(btn.className).toContain("border");
  });

  it("applies small size styles", () => {
    render(<Button size="sm">Small</Button>);
    const btn = screen.getByRole("button");
    expect(btn.className).toContain("px-3");
    expect(btn.className).toContain("text-xs");
  });

  it("applies large size styles", () => {
    render(<Button size="lg">Large</Button>);
    const btn = screen.getByRole("button");
    expect(btn.className).toContain("px-5");
    expect(btn.className).toContain("text-sm");
    expect(btn.className).toContain("rounded-xl");
  });

  it("shows loading spinner when isLoading is true", () => {
    render(<Button isLoading>Loading</Button>);
    const btn = screen.getByRole("button");
    expect(btn).toBeDisabled();
    // The SVG spinner should be present
    const svg = btn.querySelector("svg.animate-spin");
    expect(svg).toBeInTheDocument();
  });

  it("is disabled when disabled prop is true", () => {
    render(<Button disabled>Disabled</Button>);
    const btn = screen.getByRole("button");
    expect(btn).toBeDisabled();
  });

  it("is disabled when isLoading is true", () => {
    render(<Button isLoading>Loading</Button>);
    const btn = screen.getByRole("button");
    expect(btn).toBeDisabled();
  });

  it("calls onClick handler when clicked", () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Clickable</Button>);
    fireEvent.click(screen.getByRole("button"));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("does not call onClick when disabled", () => {
    const handleClick = vi.fn();
    render(
      <Button disabled onClick={handleClick}>
        Disabled
      </Button>,
    );
    fireEvent.click(screen.getByRole("button"));
    expect(handleClick).not.toHaveBeenCalled();
  });

  it("merges custom className", () => {
    render(<Button className="my-custom">Custom</Button>);
    const btn = screen.getByRole("button");
    expect(btn.className).toContain("my-custom");
  });

  it("forwards additional HTML button attributes", () => {
    render(<Button type="submit" aria-label="Submit form">Submit</Button>);
    const btn = screen.getByRole("button");
    expect(btn).toHaveAttribute("type", "submit");
    expect(btn).toHaveAttribute("aria-label", "Submit form");
  });
});
