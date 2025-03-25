import React from 'react';
import { render, fireEvent, screen, waitFor, act } from '@testing-library/react';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import Login from './Login';

const mockAxios = new MockAdapter(axios);

describe('Login component', () => {
  beforeEach(() => {
    mockAxios.reset();
  });

  it('should log in successfully', async () => {
    const mockOnLoginSuccess = jest.fn();
    render(<Login onLoginSuccess={mockOnLoginSuccess} />);

    const usernameInput = screen.getByLabelText(/Username/i);
    const passwordInput = screen.getByLabelText(/Password/i);
    const loginButton = screen.getByRole('button', { name: /Login/i });

    mockAxios.onPost('http://localhost:8000/login').reply(200, { createdAt: '2024-01-01T12:34:56Z' });

    await act(async () => {
      fireEvent.change(usernameInput, { target: { value: 'testUser' } });
      fireEvent.change(passwordInput, { target: { value: 'testPassword' } });
      fireEvent.click(loginButton);
    });

    await waitFor(() => {
      expect(mockOnLoginSuccess).toHaveBeenCalled();
    });
  });

  it('should handle error when logging in', async () => {
    render(<Login onLoginSuccess={() => {}} />);

    const usernameInput = screen.getByLabelText(/Username/i);
    const passwordInput = screen.getByLabelText(/Password/i);
    const loginButton = screen.getByRole('button', { name: /Login/i });

    mockAxios.onPost('http://localhost:8000/login').reply(401, { error: 'Unauthorized' });

    await act(async () => {
      fireEvent.change(usernameInput, { target: { value: 'testUser' } });
      fireEvent.change(passwordInput, { target: { value: 'testPassword' } });
      fireEvent.click(loginButton);
    });

    await waitFor(() => {
      expect(screen.getByText(/Error: Unauthorized/i)).toBeInTheDocument();
    });
  });
});
