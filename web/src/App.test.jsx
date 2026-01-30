import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import App from "./App.jsx";

describe("App", () => {
  it("shows the initial instruction message", () => {
    render(<App />);

    expect(
      screen.getByText("Type a player name to check Hall of Fame status.")
    ).toBeInTheDocument();
  });

  it("matches a Hall of Famer (normalizes case and punctuation)", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.type(
      screen.getByPlaceholderText("e.g. Jerry Rice"),
      "JERRY   RICE."
    );
    await user.click(screen.getByRole("button", { name: "Check" }));

    expect(screen.getByText("Jerry Rice is in the Hall of Fame.")).toBeInTheDocument();
  });

  it("shows a miss + hint for non-matches", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByPlaceholderText("e.g. Jerry Rice"), "John Doe");
    await user.click(screen.getByRole("button", { name: "Check" }));

    expect(
      screen.getByText("John Doe is not in the Hall of Fame list yet.")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Make sure spelling is correct. Try first and last name.")
    ).toBeInTheDocument();
  });
});

