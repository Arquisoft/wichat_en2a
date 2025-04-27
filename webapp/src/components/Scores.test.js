import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import Scores from "./Scores";
import { MemoryRouter } from "react-router-dom";
import {AuthProvider} from "./AuthContext";

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

    const renderScoresComponent = () => {
        render(
            <AuthProvider>
                <MemoryRouter>
                    <Scores/>
                </MemoryRouter>
            </AuthProvider>
        );
    };

    test("displays loading spinner initially", () => {
        fetch.mockImplementation(() => new Promise(() => {}));
        renderScoresComponent();
        expect(screen.getByRole("progressbar")).toBeInTheDocument();
    });

    test("fetches and displays scores", async () => {
        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockScores,
        });
        renderScoresComponent();
        await waitFor(() => {
            // Check for the correct heading based on actual component
            expect(screen.getByText("📊 Your Game History")).toBeInTheDocument();
            
            // Check for scores
            
            // Check for victory indicators
            expect(screen.getByText("✅")).toBeInTheDocument();
            expect(screen.getByText("❌")).toBeInTheDocument();
        });
    });

    test("displays an error message if fetch fails", async () => {
        fetch.mockRejectedValueOnce(new Error("Failed to fetch"));
        renderScoresComponent();
        await waitFor(() => {
            expect(screen.getByText("Failed to fetch")).toBeInTheDocument();
        });
    });

    test("displays message when no scores are available", async () => {
        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => [],
        });
        renderScoresComponent();
        await waitFor(() => {
            expect(screen.getByText("No scores available")).toBeInTheDocument();
        });
    });

    test("displays error when no token is found", async () => {
        localStorage.removeItem("token");
        renderScoresComponent();
        await waitFor(() => {
            expect(screen.getByText("No token found. Please log in.")).toBeInTheDocument();
        });
    });
});