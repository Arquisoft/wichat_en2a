import { render, fireEvent, screen } from '@testing-library/react';
import Navbar from './Navbar';

describe('Navbar component', () => {
  const mockOnNavigate = jest.fn();

  beforeEach(() => {
    mockOnNavigate.mockClear(); // Reset the mock before each test
  });

  it('renders all navigation buttons', () => {
    render(<Navbar onNavigate={mockOnNavigate} />);
    expect(screen.getByRole('button', { name: /Home/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /User Scores/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Leaderboards/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Log Out/i })).toBeInTheDocument();
  });

  it('navigates to "Home" when the Home button is clicked', () => {
    render(<Navbar onNavigate={mockOnNavigate} />);
    fireEvent.click(screen.getByRole('button', { name: /Home/i }));
    expect(mockOnNavigate).toHaveBeenCalledWith('home');
  });

  it('navigates to "User Scores" when the User Scores button is clicked', () => {
    render(<Navbar onNavigate={mockOnNavigate} />);
    fireEvent.click(screen.getByRole('button', { name: /User Scores/i }));
    expect(mockOnNavigate).toHaveBeenCalledWith('scores');
  });

  it('navigates to "Leaderboard" when the Leaderboard button is clicked', () => {
    render(<Navbar onNavigate={mockOnNavigate} />);
    fireEvent.click(screen.getByRole('button', { name: /Leaderboards/i }));
    expect(mockOnNavigate).toHaveBeenCalledWith('leaderboard');
  });

  it('navigates to "Login" when the Logout button is clicked', () => {
    render(<Navbar onNavigate={mockOnNavigate} />);
    fireEvent.click(screen.getByRole('button', { name: /Log Out/i }));
    expect(mockOnNavigate).toHaveBeenCalledWith('login');
  });
});
