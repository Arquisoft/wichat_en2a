import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import Home from './Home';
import { MemoryRouter } from 'react-router-dom';

//useNavigate Mock
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
}));

describe('Home component', () => {
  const mockNavigate = jest.fn();

  beforeEach(() => {
    mockNavigate.mockClear(); // Clear mock before the start of each test
    jest.spyOn(require('react-router-dom'), 'useNavigate').mockReturnValue(mockNavigate);
  });

  it('renders the Home title', () => {
    render(
        <MemoryRouter>
          <Home onNavigate={mockNavigate} />
        </MemoryRouter>
    );
    expect(screen.getByText(/Home page/i)).toBeInTheDocument();
  });

  it('navigates to "scores" when "My Scores" button is clicked', () => {
    render(
        <MemoryRouter>
          <Home />
        </MemoryRouter>
    );
    fireEvent.click(screen.getByRole('button', { name: /My Scores/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/scores');
  });

  it('navigates to "game" when "Play Game" button is clicked', () => {
    render(
        <MemoryRouter>
          <Home />
        </MemoryRouter>
    );
    fireEvent.click(screen.getByRole('button', { name: /Play Game/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/game');
  });

  it('navigates to "leaderboard" when "Leaderboard" button is clicked', () => {
    render(
        <MemoryRouter>
          <Home />
        </MemoryRouter>
    );
    fireEvent.click(screen.getByRole('button', { name: /Global Leaderboard/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/leaderboard');
  });

  it('navigates to "login" when "Logout" button is clicked', () => {
    render(
        <MemoryRouter>
          <Home  />
        </MemoryRouter>
    );
    fireEvent.click(screen.getByRole('button', { name: /Logout/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('renders all buttons', () => {
    render(
        <MemoryRouter>
          <Home />
        </MemoryRouter>
    );
    expect(screen.getByRole('button', { name: /My Scores/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Play Game/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Global Leaderboard/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Logout/i })).toBeInTheDocument();
  });
});