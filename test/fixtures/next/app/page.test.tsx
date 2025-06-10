/// <reference types="vitest/globals" />
import React from "react";
import { render, screen } from "@testing-library/react";
import Page from "./page";

describe("Page", () => {
  it("renders the theme and button with Tailwind classes", () => {
    render(<Page />);
    // Check for the initial theme value
    expect(document.body).toHaveAttribute("data-theme", "light");

    const button = screen.getByRole("button", { name: /toggle theme/i });
    button.click();
    // Check for the updated theme value
    expect(document.body).toHaveAttribute("data-theme", "dark");
  });
});
