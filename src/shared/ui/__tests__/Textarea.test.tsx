import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Textarea } from "@/shared/ui/Textarea";

describe("Textarea", () => {
  it("renders a textarea element", () => {
    render(<Textarea />);
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  it("renders label when provided", () => {
    render(<Textarea label="Description" />);
    expect(screen.getByText("Description")).toBeInTheDocument();
    const textarea = screen.getByLabelText("Description");
    expect(textarea.tagName).toBe("TEXTAREA");
  });

  it("generates id from label", () => {
    render(<Textarea label="My Textarea" />);
    const textarea = screen.getByLabelText("My Textarea");
    expect(textarea).toHaveAttribute("id", "my-textarea");
  });

  it("uses provided id over generated one", () => {
    render(<Textarea label="Notes" id="notes-id" />);
    const textarea = screen.getByLabelText("Notes");
    expect(textarea).toHaveAttribute("id", "notes-id");
  });

  it("shows error message", () => {
    render(<Textarea error="Too long" />);
    expect(screen.getByText("Too long")).toBeInTheDocument();
  });

  it("shows hint text when no error", () => {
    render(<Textarea hint="Max 500 chars" />);
    expect(screen.getByText("Max 500 chars")).toBeInTheDocument();
  });

  it("hides hint when error is present", () => {
    render(<Textarea error="Required" hint="Hint text" />);
    expect(screen.getByText("Required")).toBeInTheDocument();
    expect(screen.queryByText("Hint text")).not.toBeInTheDocument();
  });

  it("applies error border styles", () => {
    render(<Textarea error="Required" />);
    const textarea = screen.getByRole("textbox");
    expect(textarea.className).toContain("border-red-300");
  });

  it("applies disabled styles", () => {
    render(<Textarea disabled />);
    const textarea = screen.getByRole("textbox");
    expect(textarea).toBeDisabled();
    expect(textarea.className).toContain("disabled:bg-surface-50");
  });

  it("handles user input", () => {
    const handleChange = vi.fn();
    render(<Textarea onChange={handleChange} />);
    const textarea = screen.getByRole("textbox");
    fireEvent.change(textarea, { target: { value: "Hello" } });
    expect(handleChange).toHaveBeenCalled();
  });

  it("supports placeholder text", () => {
    render(<Textarea placeholder="Write here..." />);
    expect(screen.getByPlaceholderText("Write here...")).toBeInTheDocument();
  });

  it("merges custom className", () => {
    render(<Textarea className="custom-textarea" />);
    const textarea = screen.getByRole("textbox");
    expect(textarea.className).toContain("custom-textarea");
  });
});
