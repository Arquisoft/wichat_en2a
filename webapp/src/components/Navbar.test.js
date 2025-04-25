import { render, fireEvent, screen } from '@testing-library/react';
import Navbar from './Navbar';
import { MemoryRouter } from 'react-router-dom';

//useNavigate Mock
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
}));

describe('Navbar component', () => {
  const mockNavigate = jest.fn();

  beforeEach(() => {
    mockNavigate.mockClear(); // Reset the mock before each test
    jest.spyOn(require('react-router-dom'), 'useNavigate').mockReturnValue(mockNavigate);
  });

  it('renders all navigation buttons', () => {
    render(
        <MemoryRouter>
          <Navbar />
        </MemoryRouter>
    );
    expect(screen.getByRole('button', { name: /Home/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Game/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /My Scores/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Top Scores/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Leaderboards/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Log Out/i })).toBeInTheDocument();
  });

  it('navigates to "Home" when the Home button is clicked', () => {
    render(
        <MemoryRouter>
          <Navbar />
        </MemoryRouter>
    );
    fireEvent.click(screen.getByRole('button', { name: /Home/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/home');
  });

  it('navigates to "User Scores" when the User Scores button is clicked', () => {
    render(
        <MemoryRouter>
          <Navbar />
        </MemoryRouter>
    );
    fireEvent.click(screen.getByRole('button', { name: /My Scores/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/scores');
  });

  it('navigates to "Top Scores" when the User Scores button is clicked', () => {
    render(
        <MemoryRouter>
          <Navbar />
        </MemoryRouter>
    );
    fireEvent.click(screen.getByRole('button', { name: /Top Scores/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/allScores');
  });

  it('navigates to "Leaderboard" when the Leaderboard button is clicked', () => {
    render(
        <MemoryRouter>
          <Navbar />
        </MemoryRouter>
    );
    fireEvent.click(screen.getByRole('button', { name: /Leaderboards/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/leaderboard');
  });

  it('navigates to "Login" when the Logout button is clicked', () => {
    render(
        <MemoryRouter>
          <Navbar onNavigate={mockNavigate} />
        </MemoryRouter>
    );
    fireEvent.click(screen.getByRole('button', { name: /Log Out/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

    it('navigates to "Game" when the Game button is clicked', () => {
        render(
            <MemoryRouter>
                <Navbar onNavigate={mockNavigate} />
            </MemoryRouter>
        );
        fireEvent.click(screen.getByRole('button', { name: /Game/i }));
        expect(mockNavigate).toHaveBeenCalledWith('/gamemodes');
    });
});
