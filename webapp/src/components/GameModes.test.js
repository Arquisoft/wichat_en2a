import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import GameModes from './GameModes';
import { MemoryRouter } from 'react-router-dom';

// Mock de useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

// Mock global fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve([]),
  })
);

beforeEach(() => {
  fetch.mockClear();
  mockNavigate.mockClear();
});

describe('GameModes component', () => {
  test('renders title and buttons', () => {
    render(
      <MemoryRouter>
        <GameModes />
      </MemoryRouter>
    );

    expect(screen.getByText(/Choose your Game Mode/i)).toBeInTheDocument();
    expect(screen.getByText('Flags')).toBeInTheDocument();
    expect(screen.getByText('Custom Game')).toBeInTheDocument();
  });

  test('navigates to custom game mode', () => {
    render(
      <MemoryRouter>
        <GameModes />
      </MemoryRouter>
    );

    const customButton = screen.getByText('Custom Game');
    fireEvent.click(customButton);

    expect(mockNavigate).toHaveBeenCalledWith('/gamemodes/custom');
  });

  test('calls backend and navigates to /game on regular mode', async () => {
    render(
      <MemoryRouter>
        <GameModes />
      </MemoryRouter>
    );

    const flagsButton = screen.getByText('Flags');
    fireEvent.click(flagsButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/clear-questions'),
        expect.objectContaining({ method: 'POST' })
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
