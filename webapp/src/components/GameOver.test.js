import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import GameOver from "./GameOver";

const mockNavigate = jest.fn(); // Simula la navegación
jest.mock("react-router-dom", () => ({
    ...jest.requireActual("react-router-dom"),
    useNavigate: () => mockNavigate,
}));

describe("GameOver Screen", () => {
    it("Shows the game over message.", () => {
        render(
            <MemoryRouter>
                <GameOver />
            </MemoryRouter>
        );

        expect(screen.getByText("Game Over!")).toBeInTheDocument();
        expect(screen.getByText("You answered 10 questions.")).toBeInTheDocument();
    });

    it("Go back home button", async () => {
        render(
            <MemoryRouter>
                <GameOver />
            </MemoryRouter>
        );

        const button = screen.getByText("Back to Home");
        await userEvent.click(button);

        expect(mockNavigate).toHaveBeenCalledWith("/home");
    });

    it("Go to Leaderboard button", async () => {
        render(
            <MemoryRouter>
                <GameOver />
            </MemoryRouter>
        );

        const button = screen.getByText("See leaderboard");
        await userEvent.click(button);

        expect(mockNavigate).toHaveBeenCalledWith("/leaderboard");
    });

    it("Go to my scores button", async () => {
        render(
            <MemoryRouter>
                <GameOver />
            </MemoryRouter>
        );

        const button = screen.getByText("See my scores");
        await userEvent.click(button);

        expect(mockNavigate).toHaveBeenCalledWith("/scoresByUser/");
    });
});
