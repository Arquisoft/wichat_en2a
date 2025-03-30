import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import Game from './Game';
import { MemoryRouter } from 'react-router-dom';

const mockAxios = new MockAdapter(axios);
const apiEndpoint = 'http://localhost:8000';

describe('Game Component', () => {
    const mockOnNavigate = jest.fn();

    beforeEach(() => {
        mockAxios.reset();
    });

    test('renders loading state initially', () => {
        render(
            <MemoryRouter>
                <Game onNavigate={mockOnNavigate} />
            </MemoryRouter>
        );
        expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    test('fetches and displays question and options', async () => {
        const mockQuestion = {
            correctAnswer: 'Spain',
            imageUrl: 'https://via.placeholder.com/300',
            options: ['Spain', 'France', 'Germany', 'Italy']
        };

        mockAxios.onGet(`${apiEndpoint}/question`).reply(200, mockQuestion);

        render(
            <MemoryRouter>
                <Game onNavigate={mockOnNavigate} />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByText(/Which country is this flag from?/i)).toBeInTheDocument();
        });

        // Check that all answer buttons are displayed
        mockQuestion.options.forEach(option => {
            expect(screen.getByRole('button', { name: option })).toBeInTheDocument();
        });

        // Check if the image is displayed
        expect(screen.getByRole('img', { name: /question related/i })).toBeInTheDocument();
    });

    test('shows an error message if fetching fails', async () => {
        mockAxios.onGet(`${apiEndpoint}/question`).reply(500);

        render(
            <MemoryRouter>
                <Game onNavigate={mockOnNavigate} />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByText(/Failed to load question/i)).toBeInTheDocument();
        });
    });

    test('fetches and displays a hint when "?" button is clicked', async () => {
        const mockQuestion = {
            correctAnswer: 'Spain',
            imageUrl: 'https://via.placeholder.com/300',
            options: ['Spain', 'France', 'Germany', 'Italy']
        };

        const mockHint = { answer: 'This country has bullfighting as a tradition.' };

        mockAxios.onGet(`${apiEndpoint}/question`).reply(200, mockQuestion);
        mockAxios.onPost(`${apiEndpoint}/askllm`).reply(200, mockHint);

        render(
            <MemoryRouter>
                <Game onNavigate={mockOnNavigate} />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByText(/Which country is this flag from?/i)).toBeInTheDocument();
        });

        // Click the hint button
        fireEvent.click(screen.getByRole('button', { name: '?' }));

        await waitFor(() => {
            expect(screen.getByText(mockHint.answer)).toBeInTheDocument();
        });
    });

    test('allows selecting an answer and enables "Next Question" button', async () => {
        const mockQuestion = {
            correctAnswer: 'Spain',
            imageUrl: 'https://via.placeholder.com/300',
            options: ['Spain', 'France', 'Germany', 'Italy']
        };

        mockAxios.onGet(`${apiEndpoint}/question`).reply(200, mockQuestion);

        render(
            <MemoryRouter>
                <Game onNavigate={mockOnNavigate} />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByText(/Which country is this flag from?/i)).toBeInTheDocument();
        });

        const answerButton = screen.getByRole('button', { name: 'Spain' });

        fireEvent.click(answerButton);

        const nextQuestionButton = screen.getByRole('button', { name: /Next Question/i });

        expect(nextQuestionButton).toBeEnabled();
    });

    // tests for second deliverable:

    test('disables all buttons after selecting an answer', async () => {
        const mockQuestion = {
            correctAnswer: 'Spain',
            imageUrl: 'https://via.placeholder.com/300',
            options: ['Spain', 'France', 'Germany', 'Italy']
        };
        mockAxios.onGet(`${apiEndpoint}/question`).reply(200, mockQuestion);

        render(
            <MemoryRouter>
                <Game onNavigate={mockOnNavigate} />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByText(/Which country is this flag from?/i)).toBeInTheDocument();
        });
        const answerButton = screen.getByRole('button', { name: 'Spain' });
        fireEvent.click(answerButton); // Click an answer

        // All buttons are disabled
        mockQuestion.options.forEach(option => {
            expect(screen.getByRole('button', { name: option })).toBeDisabled();
        });
    });

    test('changes button color when selecting an incorrect answer', async () => {
        const mockQuestion = {
            correctAnswer: 'Spain',
            imageUrl: 'https://via.placeholder.com/300',
            options: ['Spain', 'France', 'Germany', 'Italy']
        };

        mockAxios.onGet(`${apiEndpoint}/question`).reply(200, mockQuestion);

        // Simulamos que la API responde que la respuesta seleccionada es incorrecta
        mockAxios.onPost(`${apiEndpoint}/check-answer`).reply(200, { isCorrect: false });

        render(
            <MemoryRouter>
                <Game onNavigate={mockOnNavigate} />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByText(/Which country is this flag from?/i)).toBeInTheDocument();
        });

        // Click en la respuesta incorrecta
        const wrongAnswerButton = screen.getByRole('button', { name: 'France' });
        fireEvent.click(wrongAnswerButton);

        // Esperar a que el estado se actualice antes de verificar los colores
        await waitFor(() => {
            expect(wrongAnswerButton).toHaveStyle('background-color: #F44336'); // Incorrecto = rojo
        });

        const correctAnswerButton = screen.getByRole('button', { name: 'Spain' });

        await waitFor(() => {
            expect(correctAnswerButton).toHaveStyle('background-color: #4CAF50'); // Correcto = verde
        });
    });


    test('change color when choosing correct one', async () => {
        const mockQuestion = {
            correctAnswer: 'Spain',
            imageUrl: 'https://via.placeholder.com/300',
            options: ['Spain', 'France', 'Germany', 'Italy']
        };

        mockAxios.onGet(`${apiEndpoint}/question`).reply(200, mockQuestion);

        // Simula la API de validación de respuesta
        mockAxios.onPost(`${apiEndpoint}/check-answer`).reply(200, { isCorrect: true });

        render(
            <MemoryRouter>
                <Game onNavigate={mockOnNavigate} />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByText(/Which country is this flag from?/i)).toBeInTheDocument();
        });

        // Click en la respuesta correcta
        const correctAnswerButton = screen.getByRole('button', { name: 'Spain' });
        fireEvent.click(correctAnswerButton);

        // Esperar a que el estado se actualice antes de verificar el color
        await waitFor(() => {
            expect(correctAnswerButton).toHaveStyle('background-color: #4CAF50');
        });
    });
});
