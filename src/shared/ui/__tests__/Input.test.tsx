import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Input } from "@/shared/ui/Input";

describe("Input", () => {
  it("renders an input element", () => {
    render(<Input />);
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  it("renders label when provided", () => {
    render(<Input label="Email" />);
    expect(screen.getByText("Email")).toBeInTheDocument();
    // Label should be associated with input via htmlFor
    const input = screen.getByLabelText("Email");
    expect(input).toBeInTheDocument();
  });

  it("generates id from label when not provided", () => {
    render(<Input label="First Name" />);
    const input = screen.getByLabelText("First Name");
    // id should be "first-name" (lowercase, spaces replaced with hyphens)
    expect(input).toHaveAttribute("id", "first-name");
  });

  it("uses provided id over generated one", () => {
    render(<Input label="Email" id="custom-id" />);
    const input = screen.getByLabelText("Email");
    expect(input).toHaveAttribute("id", "custom-id");
  });

  it("shows error message when error prop is set", () => {
    render(<Input error="This field is required" />);
    expect(screen.getByText("This field is required")).toBeInTheDocument();
  });

  it("shows hint text when hint prop is set and no error", () => {
    render(<Input hint="Enter your full name" />);
    expect(screen.getByText("Enter your full name")).toBeInTheDocument();
  });

  it("does not show hint when error is also set", () => {
    render(<Input error="Invalid" hint="This is a hint" />);
    expect(screen.getByText("Invalid")).toBeInTheDocument();
    expect(screen.queryByText("This is a hint")).not.toBeInTheDocument();
  });

  it("applies error border styles when error is set", () => {
    render(<Input error="Required" />);
    const input = screen.getByRole("textbox");
    expect(input.className).toContain("border-red-300");
  });

  it("applies normal border when no error", () => {
    render(<Input />);
    const input = screen.getByRole("textbox");
    expect(input.className).toContain("border-surface-200");
  });

  it("applies disabled styles when disabled", () => {
    render(<Input disabled />);
    const input = screen.getByRole("textbox");
    expect(input).toBeDisabled();
    expect(input.className).toContain("disabled:bg-surface-50");
  });

  it("forwards value and onChange", () => {
    const handleChange = vi.fn();
    render(<Input value="" onChange={handleChange} />);
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "hello" } });
    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  it("supports placeholder text", () => {
    render(<Input placeholder="Type here..." />);
    expect(screen.getByPlaceholderText("Type here...")).toBeInTheDocument();
  });

  it("supports different input types", () => {
    const { container } = render(<Input type="password" />);
    const input = container.querySelector('input[type="password"]');
    expect(input).toBeInTheDocument();
  });

  it("merges custom className", () => {
    render(<Input className="my-input" />);
    const input = screen.getByRole("textbox");
    expect(input.className).toContain("my-input");
  });
});
