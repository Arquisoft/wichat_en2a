import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import GameOver from "./GameOver";
import {AuthProvider} from "./AuthContext";

const mockNavigate = jest.fn();

jest.mock("react-router-dom", () => ({
    ...jest.requireActual("react-router-dom"),
    useNavigate: () => mockNavigate,
}));

describe("GameOver Screen", () => {
    const renderGameOverScreen = () => {
        render(
            <AuthProvider>
                <MemoryRouter>
                    <GameOver />
                </MemoryRouter>
            </AuthProvider>
        );
    };

    it("Shows the game over message.", () => {
        renderGameOverScreen();
        expect(screen.getByText("Game Over!")).toBeInTheDocument();
        expect(screen.getByText("You answered 10 questions.")).toBeInTheDocument();
    });

    test.each([
        ["Back to Home", "/home"],
        ["See leaderboard", "/leaderboard"],
        ["See my scores", "/scores"],
    ])('Navigates correctly when clicking "%s" button',
        async (buttonText, expectedPath) => {
            renderGameOverScreen();

            const button = screen.getByText(buttonText);
            await userEvent.click(button);

            expect(mockNavigate).toHaveBeenCalledWith(expectedPath);
        });
});
