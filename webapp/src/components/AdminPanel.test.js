import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import AdminPanel from "./AdminPanel";
import { MemoryRouter } from "react-router-dom";

// Mock Navbar to avoid rendering its internals
jest.mock("./Navbar", () => () => <div data-testid="navbar-mock">Navbar</div>);

const mockUsers = [
  { _id: "1", username: "alice", isAdmin: true },
  { _id: "2", username: "bob", isAdmin: false },
];

describe("AdminPanel", () => {
  beforeEach(() => {
    // Mock localStorage token
    Storage.prototype.getItem = jest.fn((key) =>
      key === "token" ? "mock-token" : null
    );
    // Reset fetch
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  function renderComponent() {
    render(
      <MemoryRouter>
        <AdminPanel />
      </MemoryRouter>
    );
  }

  it("renders Navbar and table headers", async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockUsers,
    });
  
    renderComponent();
  
    expect(await screen.findByTestId("navbar-mock")).toBeInTheDocument();
    expect(await screen.findByText(/Admin User Management/i)).toBeInTheDocument();
    expect(screen.getByText(/Username/i)).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /^Admin$/i })).toBeInTheDocument();
    expect(screen.getByText(/Actions/i)).toBeInTheDocument();
  });

  it("renders users and admin status", async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockUsers,
    });

    renderComponent();

    expect(await screen.findByText("alice")).toBeInTheDocument();
    expect(screen.getByText("bob")).toBeInTheDocument();
    expect(screen.getAllByText("Yes")[0]).toBeInTheDocument();
    expect(screen.getAllByText("No")[0]).toBeInTheDocument();
  });

  it("shows error if fetch fails", async () => {
    fetch.mockRejectedValueOnce(new Error("fail"));
    renderComponent();
    expect(await screen.findByText(/Error: Failed to load users/i)).toBeInTheDocument();
  });

  it("opens edit dialog and updates user", async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockUsers,
    });
    // For PUT
    fetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) });
    // For refresh after edit
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockUsers,
    });

    renderComponent();

    // Open edit dialog
    const editButton = await screen.findAllByRole("button", { name: /Edit/i });
    fireEvent.click(editButton[0]);

    expect(screen.getByText(/Edit User/i)).toBeInTheDocument();
    const usernameInput = screen.getByLabelText(/Username/i);
    fireEvent.change(usernameInput, { target: { value: "alice2" } });

    const saveButton = screen.getByRole("button", { name: /Save/i });
    fireEvent.click(saveButton);

    await waitFor(() =>
      expect(screen.getByText(/User updated/i)).toBeInTheDocument()
    );
  });

  it("shows error if update fails", async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockUsers,
    });
    fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "Update failed" }),
    });

    renderComponent();

    const editButton = await screen.findAllByRole("button", { name: /Edit/i });
    fireEvent.click(editButton[0]);
    fireEvent.click(screen.getByRole("button", { name: /Save/i }));

    expect(await screen.findByText(/Error: Update failed/i)).toBeInTheDocument();
  });

  it("closes edit dialog on cancel", async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockUsers,
    });

    renderComponent();

    const editButton = await screen.findAllByRole("button", { name: /Edit/i });
    fireEvent.click(editButton[0]);
    fireEvent.click(screen.getByRole("button", { name: /Cancel/i }));

    await waitFor(() =>
      expect(screen.queryByText(/Edit User/i)).not.toBeInTheDocument()
    );
  });

  it("deletes user after confirmation", async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockUsers,
    });
    fetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) });

    window.confirm = jest.fn(() => true);

    renderComponent();

    const deleteButton = await screen.findAllByRole("button", { name: /Delete/i });
    fireEvent.click(deleteButton[1]);

    await waitFor(() =>
      expect(screen.getByText(/User deleted/i)).toBeInTheDocument()
    );
  });

  it("does not delete user if confirmation is cancelled", async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockUsers,
    });

    window.confirm = jest.fn(() => false);

    renderComponent();

    const deleteButton = await screen.findAllByRole("button", { name: /Delete/i });
    fireEvent.click(deleteButton[1]);

    expect(screen.queryByText(/User deleted/i)).not.toBeInTheDocument();
  });

  it("shows error if delete fails", async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockUsers,
    });
    fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "Delete failed" }),
    });

    window.confirm = jest.fn(() => true);

    renderComponent();

    const deleteButton = await screen.findAllByRole("button", { name: /Delete/i });
    fireEvent.click(deleteButton[1]);

    expect(await screen.findByText(/Error: Delete failed/i)).toBeInTheDocument();
  });
});