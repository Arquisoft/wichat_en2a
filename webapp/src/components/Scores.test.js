import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import Scores from "./Scores";
import { MemoryRouter } from "react-router-dom";

// Mock fetch
global.fetch = jest.fn();
const mockScores = [
    { score: 80, createdAt: "2025-03-28T12:34:56Z", isVictory: true },
    { score: 60, createdAt: "2025-03-27T10:20:30Z", isVictory: false },
];

describe("Scores Component", () => {
    beforeEach(() => {
        localStorage.setItem("token", "mockToken");
        fetch.mockClear();
    });

    test("displays loading spinner initially", () => {
        fetch.mockImplementation(() => new Promise(() => {}));
        render(
            <MemoryRouter>
                <Scores />
            </MemoryRouter>
        );
        expect(screen.getByRole("progressbar")).toBeInTheDocument();
    });

    test("fetches and displays scores", async () => {
        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockScores,
        });
        render(
            <MemoryRouter>
                <Scores />
            </MemoryRouter>
        );
        await waitFor(() => {
            // Check for the correct heading based on actual component
            expect(screen.getByText("📊 Your Game History")).toBeInTheDocument();
            
            // Check for scores
            expect(screen.getByText("80")).toBeInTheDocument();
            expect(screen.getByText("60")).toBeInTheDocument();
            
            // Check for victory indicators
            expect(screen.getByText("✅")).toBeInTheDocument();
            expect(screen.getByText("❌")).toBeInTheDocument();
        });
    });

    test("displays an error message if fetch fails", async () => {
        fetch.mockRejectedValueOnce(new Error("Failed to fetch"));
        render(
            <MemoryRouter>
                <Scores />
            </MemoryRouter>
        );
        await waitFor(() => {
            expect(screen.getByText("Failed to fetch")).toBeInTheDocument();
        });
    });

    test("displays message when no scores are available", async () => {
        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => [],
        });
        render(
            <MemoryRouter>
                <Scores />
            </MemoryRouter>
        );
        await waitFor(() => {
            expect(screen.getByText("No scores available")).toBeInTheDocument();
        });
    });

    test("displays error when no token is found", async () => {
        localStorage.removeItem("token");
        render(
            <MemoryRouter>
                <Scores />
            </MemoryRouter>
        );
        await waitFor(() => {
            expect(screen.getByText("No token found. Please log in.")).toBeInTheDocument();
        });
    });
});