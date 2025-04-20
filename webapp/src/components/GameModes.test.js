import React from 'react';
import {render, screen, fireEvent, waitFor} from '@testing-library/react';
import GameModes from './GameModes';
import {MemoryRouter} from 'react-router-dom';
import {AuthProvider} from "./AuthContext";

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockNavigate
}));

// Mock global fetch
global.fetch = jest.fn(() =>
    Promise.resolve({
        ok: true,
        json: () => Promise.resolve([]),
    })
);

beforeEach(() => {
    fetch.mockClear();
    mockNavigate.mockClear();
});

describe('GameModes component', () => {
    const renderGameModesComponent = () => {
        render(
            <AuthProvider>
                <MemoryRouter>
                    <GameModes/>
                </MemoryRouter>
            </AuthProvider>
        );
    };
    describe('Initial render', () => {
        it('Show title and principal buttons', () => {
            renderGameModesComponent();

            expect(screen.getByText(/Choose your Game Mode/i)).toBeInTheDocument();
            expect(screen.getByText('Flags')).toBeInTheDocument();
            expect(screen.getByText('Custom Game')).toBeInTheDocument();
        });
    });

    describe('Navigation', () => {
        it('navigates to CustomGameMode when click in "Custom Game"', async () => {
            renderGameModesComponent();

            const customButton = screen.getByText('Custom Game');
            fireEvent.click(customButton);

            await waitFor(() => {
                expect(mockNavigate).toHaveBeenCalledWith('/gamemodes/custom');
            });
        });

        it('calls API and goes to /game when clicking a normal mode', async () => {
            renderGameModesComponent();

            const flagsButton = screen.getByText('Flags');
            fireEvent.click(flagsButton);

            await waitFor(() => {
                expect(fetch).toHaveBeenCalledWith(
                    expect.stringContaining('/clear-questions'),
                    expect.objectContaining({method: 'POST'})
                );

                expect(fetch).toHaveBeenCalledWith(
                    expect.stringContaining('/fetch-question-data'),
                    expect.objectContaining({
                        method: 'POST',
                        body: expect.stringContaining('"questionType":"flag"')
                    })
                );
            });

            expect(mockNavigate).toHaveBeenCalledWith('/game');
        });
    });
});
