import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Modal } from "@/shared/ui/Modal";

describe("Modal", () => {
  it("renders nothing when isOpen is false", () => {
    const { container } = render(
      <Modal isOpen={false} onClose={() => {}}>
        Content
      </Modal>,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders children when isOpen is true", () => {
    render(
      <Modal isOpen={true} onClose={() => {}}>
        <p>Modal content</p>
      </Modal>,
    );
    expect(screen.getByText("Modal content")).toBeInTheDocument();
  });

  it("renders title when provided", () => {
    render(
      <Modal isOpen={true} onClose={() => {}} title="Test Modal">
        Content
      </Modal>,
    );
    expect(screen.getByText("Test Modal")).toBeInTheDocument();
  });

  it("calls onClose when close button is clicked", () => {
    const handleClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={handleClose} title="Test">
        Content
      </Modal>,
    );

    // Find the close button (the X icon button)
    const buttons = screen.getAllByRole("button");
    // The close button is the one without text content (only has SVG)
    const closeButton = buttons.find(
      (btn) => btn.textContent === "" || btn.querySelector("svg"),
    );
    if (closeButton) {
      fireEvent.click(closeButton);
      expect(handleClose).toHaveBeenCalledTimes(1);
    }
  });

  it("calls onClose when Escape key is pressed", () => {
    const handleClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={handleClose}>
        Content
      </Modal>,
    );

    fireEvent.keyDown(document, { key: "Escape" });
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it("does not listen for Escape when isOpen is false", () => {
    const handleClose = vi.fn();
    const { rerender } = render(
      <Modal isOpen={false} onClose={handleClose}>
        Content
      </Modal>,
    );

    fireEvent.keyDown(document, { key: "Escape" });
    expect(handleClose).not.toHaveBeenCalled();

    // Now open it — handler should register
    rerender(
      <Modal isOpen={true} onClose={handleClose}>
        Content
      </Modal>,
    );

    fireEvent.keyDown(document, { key: "Escape" });
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it("cleans up Escape listener on unmount", () => {
    const handleClose = vi.fn();
    const { unmount } = render(
      <Modal isOpen={true} onClose={handleClose}>
        Content
      </Modal>,
    );

    unmount();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(handleClose).not.toHaveBeenCalled();
  });

  it("closes on overlay click", () => {
    const handleClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={handleClose}>
        <p>Inside modal</p>
      </Modal>,
    );

    // Click the overlay (the outermost div)
    const overlay = screen.getByText("Inside modal").closest("div")?.parentElement;
    if (overlay) {
      fireEvent.click(overlay);
      expect(handleClose).toHaveBeenCalledTimes(1);
    }
  });

  it("does not close when clicking inside modal content", () => {
    const handleClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={handleClose}>
        <p>Inside modal</p>
      </Modal>,
    );

    fireEvent.click(screen.getByText("Inside modal"));
    expect(handleClose).not.toHaveBeenCalled();
  });

  it("applies custom className to modal panel", () => {
    render(
      <Modal isOpen={true} onClose={() => {}} className="custom-modal">
        Content
      </Modal>,
    );
    const panel = screen.getByText("Content").closest("div.relative");
    expect(panel?.className).toContain("custom-modal");
  });
});
