import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import { Login } from "../pages/Auth.jsx";
import { AuthProvider } from "../lib/auth.jsx";

const json = (status, body) => Promise.resolve(new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } }));

function renderLogin() {
  return render(
    <MemoryRouter initialEntries={["/login"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<p>Dashboard page</p>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe("login", () => {
  it("signs in, stores the session and goes to the dashboard", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(() =>
      json(200, { token: "t0k3n", user: { id: "1", name: "Priya Nair", role: "learner" } }),
    );
    renderLogin();
    await userEvent.type(screen.getByLabelText("Email"), "priya@skillport.dev");
    await userEvent.type(screen.getByLabelText("Password"), "skillport-demo");
    await userEvent.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByText("Dashboard page")).toBeInTheDocument();
    expect(localStorage.getItem("skillport.token")).toBe("t0k3n");
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/auth/login");
    expect(JSON.parse(init.body)).toEqual({ email: "priya@skillport.dev", password: "skillport-demo" });
  });

  it("shows the server's message when sign-in fails", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(() => json(401, { error: "Email or password is incorrect" }));
    renderLogin();
    await userEvent.type(screen.getByLabelText("Email"), "priya@skillport.dev");
    await userEvent.type(screen.getByLabelText("Password"), "wrong");
    await userEvent.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Email or password is incorrect");
    expect(localStorage.getItem("skillport.token")).toBeNull();
  });

  it("puts validation messages next to the right fields", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(() =>
      json(400, { error: "Some fields need attention", details: [{ field: "email", message: "Enter a valid email" }] }),
    );
    renderLogin();
    await userEvent.type(screen.getByLabelText("Password"), "x");
    await userEvent.click(screen.getByRole("button", { name: "Sign in" }));
    expect(await screen.findByText("Enter a valid email")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toHaveAttribute("aria-invalid", "true");
  });
});
