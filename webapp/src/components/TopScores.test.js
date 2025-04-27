import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import TopScores from './TopScores';
import { MemoryRouter } from 'react-router-dom';
import {AuthProvider} from "./AuthContext";

global.fetch = jest.fn();

const mockScores = [
    { _id: '1', username: 'Alice', score: 100, isVictory: true, createdAt: new Date().toISOString() },
    { _id: '2', username: 'Bob', score: 80, isVictory: false, createdAt: new Date().toISOString() },
    { _id: '3', username: 'Charlie', score: 90, isVictory: true, createdAt: new Date().toISOString() }
];

describe('TopScores Component', () => {
    beforeEach(() => {
        fetch.mockClear();
        localStorage.setItem('username', 'Alice');
        localStorage.setItem('token', 'mock-token');
    });

    const renderTopScoresComponent = () => {
        render(
            <AuthProvider>
                <MemoryRouter>
                    <TopScores/>
                </MemoryRouter>
            </AuthProvider>
        );
    };

    test('renders loading state initially', async () => {
        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockScores
        });

        renderTopScoresComponent();
        expect(screen.getByText(/Loading Top Scores/i)).toBeInTheDocument();
    });

    test('renders error state on fetch failure', async () => {
        fetch.mockRejectedValueOnce(new Error('Fetch failed'));

        renderTopScoresComponent();
        await waitFor(() => {
            expect(screen.getByText(/Failed to load scores/i)).toBeInTheDocument();
        });
    });

    test('displays top scores after fetching', async () => {
        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockScores
        });

        renderTopScoresComponent();
        await waitFor(() => {
            expect(screen.getByText(/Top 25 Scores/i)).toBeInTheDocument();
            expect(screen.getByText(/Alice/)).toBeInTheDocument();
            expect(screen.getByText(/Bob/)).toBeInTheDocument();
            expect(screen.getByText(/Charlie/)).toBeInTheDocument();
        });
    });

    test('shows "You" next to current user', async () => {
        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockScores
        });

        renderTopScoresComponent();
        await waitFor(() => {
            expect(screen.getByText(/Alice \(You\)/)).toBeInTheDocument();
        });
    });
    
    test('sorts by score on column click', async () => {
        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockScores
        });

        renderTopScoresComponent();
        await waitFor(() => screen.getByText('Score'));

        const buttons = screen.getAllByRole('button', { name: /score/i });
        const scoreButton = buttons[0]; //El primero que tenga esos atributos
        fireEvent.click(scoreButton);

        
    });
});
