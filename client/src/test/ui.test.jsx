import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Field, ProgressBar, RichText } from "../components/ui.jsx";
import { ago, minutes, plural } from "../lib/format.js";

describe("ui", () => {
  it("clamps and announces progress", () => {
    render(<ProgressBar value={140} label="Course progress" />);
    const bar = screen.getByRole("progressbar", { name: "Course progress" });
    expect(bar).toHaveAttribute("aria-valuenow", "100");
  });

  it("links field errors to their input", () => {
    render(<Field label="Email" name="email" error="Enter a valid email" />);
    const input = screen.getByLabelText("Email");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription("Enter a valid email");
  });

  it("renders paragraphs and inline code in lesson text", () => {
    const { container } = render(<RichText text={"First `useState` para.\n\nSecond para."} />);
    expect(container.querySelectorAll("p")).toHaveLength(2);
    expect(container.querySelector("code")).toHaveTextContent("useState");
  });
});

describe("format", () => {
  it("formats durations and counts", () => {
    expect(minutes(45)).toBe("45 min");
    expect(minutes(125)).toBe("2 h 5 min");
    expect(plural(1, "lesson")).toBe("1 lesson");
    expect(plural(3, "reply", "replies")).toBe("3 replies");
    expect(ago(new Date(Date.now() - 2 * 86400000))).toBe("2 days ago");
  });
});
