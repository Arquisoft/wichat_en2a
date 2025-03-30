import React from "react";
import { render, screen, act } from "@testing-library/react";
import Timer from "./Timer";

jest.useFakeTimers(); // Simula el temporizador

describe("Timer Component", () => {
    test("initial time shown correctly", () => {
        render(<Timer duration={40} onTimeUp={jest.fn()} answerSelected={false} />);
        expect(screen.getByText("40 sec")).toBeInTheDocument();
    });

    test("Timer goes down", () => {
        render(<Timer duration={40} onTimeUp={jest.fn()} answerSelected={false} />);

        act(() => {
            jest.advanceTimersByTime(1000); // Simula 1 segundo
        });

        expect(screen.getByText("39 sec")).toBeInTheDocument();
    });

    test("calls function when time reaches 0", () => {
        const onTimeUpMock = jest.fn();
        render(<Timer duration={3} onTimeUp={onTimeUpMock} answerSelected={false} />);

        act(() => {
            jest.advanceTimersByTime(3000); // Simula 3 segundos
        });

        expect(onTimeUpMock).toHaveBeenCalled(); // Debe haberse llamado
    });

    test("timer stops if an answer has been selected", () => {
        render(<Timer duration={40} onTimeUp={jest.fn()} answerSelected={true} />);

        act(() => {
            jest.advanceTimersByTime(5000); // Simula 5 segundos
        });

        expect(screen.getByText("40 sec")).toBeInTheDocument(); // No cambió
    });

    test("re-starts timer when duration changes (new question)", () => {
        const { rerender } = render(
            <Timer duration={30} onTimeUp={jest.fn()} answerSelected={false} />
        );

        act(() => {
            jest.advanceTimersByTime(5000); // Baja a 25
        });

        rerender(<Timer duration={50} onTimeUp={jest.fn()} answerSelected={false} />);

        expect(screen.getByText("50 sec")).toBeInTheDocument(); // Se reinició a 50
    });
});
