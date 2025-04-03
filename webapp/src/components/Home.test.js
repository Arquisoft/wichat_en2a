import React from 'react';
import {render, fireEvent, screen} from '@testing-library/react';
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
        expect(screen.getByText(/Welcome back/i)).toBeInTheDocument();
    });

    it('navigates to "game" when "Play" button is clicked', () => {
        render(
            <MemoryRouter>
              <Home />
            </MemoryRouter>
    );
    fireEvent.click(screen.getByRole('button', { name: /Play/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/game');
    });

    it('renders all buttons', () => {
        render(
            <MemoryRouter>
              <Home />
            </MemoryRouter>
        );
        expect(screen.getByRole('button', { name: /Play/i })).toBeInTheDocument();
    });
});