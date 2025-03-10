import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import Home from './Home';

describe('Home component', () => {
  const mockOnNavigate = jest.fn();

  beforeEach(() => {
    mockOnNavigate.mockClear(); // Clear mock before the start of each test
  });

  it('renders the Home title', () => {
    render(<Home onNavigate={mockOnNavigate} />);
    expect(screen.getByText(/Home page/i)).toBeInTheDocument();
  });

  it('navigates to "scores" when "My Scores" button is clicked', () => {
    render(<Home onNavigate={mockOnNavigate} />);
    fireEvent.click(screen.getByRole('button', { name: /My Scores/i }));
    expect(mockOnNavigate).toHaveBeenCalledWith('scores');
  });

  it('navigates to "game" when "Play Game" button is clicked', () => {
    render(<Home onNavigate={mockOnNavigate} />);
    fireEvent.click(screen.getByRole('button', { name: /Play Game/i }));
    expect(mockOnNavigate).toHaveBeenCalledWith('game');
  });

  it('navigates to "leaderboard" when "Leaderboard" button is clicked', () => {
    render(<Home onNavigate={mockOnNavigate} />);
    fireEvent.click(screen.getByRole('button', { name: /Global Leaderboard/i }));
    expect(mockOnNavigate).toHaveBeenCalledWith('leaderboard');
  });

  it('navigates to "login" when "Logout" button is clicked', () => {
    render(<Home onNavigate={mockOnNavigate} />);
    fireEvent.click(screen.getByRole('button', { name: /Logout/i }));
    expect(mockOnNavigate).toHaveBeenCalledWith('login');
  });

  it('renders all buttons', () => {
    render(<Home onNavigate={mockOnNavigate} />);
    expect(screen.getByRole('button', { name: /My Scores/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Play Game/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Global Leaderboard/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Logout/i })).toBeInTheDocument();
  });
});