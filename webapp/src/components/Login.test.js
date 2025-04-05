import React from 'react';
import { render, fireEvent, screen, waitFor, act } from '@testing-library/react';
import Login from './Login';
import { MemoryRouter } from 'react-router-dom';
import MockAdapter from "axios-mock-adapter";
import axios from "axios";

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
}));

describe('Login component', () => {
  const mockNavigate = jest.fn();
  const mockAxios = new MockAdapter(axios);

  const fillLoginFormAndSubmit = async () => {
    const usernameInput = screen.getByLabelText(/Username/i);
    const passwordInput = screen.getByLabelText(/Password/i);
    const loginButton = screen.getByRole('button', { name: /Login/i });

    await act(async () => {
      fireEvent.change(usernameInput, { target: { value: 'testUser' } });
      fireEvent.change(passwordInput, { target: { value: 'testPassword' } });
      fireEvent.click(loginButton);
    });
  };

  beforeEach(() => {
    mockNavigate.mockClear(); // Clear mock before the start of each test
    jest.spyOn(require('react-router-dom'), 'useNavigate').mockReturnValue(mockNavigate);
  });

  afterEach(() => {
    mockAxios.reset();
  });

  it('Renders all components', async () => {
    mockAxios.onPost('http://localhost:8000/login').reply(200, {createdAt: '2024-01-01T12:34:56Z'});

    render(
        <MemoryRouter>
          <Login/>
        </MemoryRouter>
    );
    expect(await screen.findByText('Challenge your knowledge!')).toBeInTheDocument();
    expect(await screen.getByText(/Login 🧠/i)).toBeInTheDocument();
    expect(await screen.getByLabelText(/Username/i)).toBeInTheDocument();
    expect(await screen.getByLabelText(/Password/i)).toBeInTheDocument();
    expect(await screen.getByAltText(/Question Mark/i)).toBeInTheDocument();
    expect(await screen.findByText('HappySW-RTVE')).toBeInTheDocument();
  })

  it('should log in successfully', async () => {
    mockAxios.onPost('http://localhost:8000/login').reply(200, { createdAt: '2024-01-01T12:34:56Z' });

    render(
        <MemoryRouter>
        <Login />
        </MemoryRouter>
    );

    await fillLoginFormAndSubmit();

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/home');
    });
  });

  it('should handle error when logging in', async () => {
    mockAxios.onPost('http://localhost:8000/login').reply(401, { error: 'Unauthorized' });

    render(
        <MemoryRouter>
          <Login onLoginSuccess={() => {}}/>
        </MemoryRouter>
    );

    await fillLoginFormAndSubmit();

    await waitFor(() => {
      expect(screen.getByText(/Error: Unauthorized/i)).toBeInTheDocument();
    });
  });

  it('should apply the spinning animation to the image', async () => {
    mockAxios.onPost('http://localhost:8000/login').reply(200, {createdAt: '2024-01-01T12:34:56Z'});

    render(
        <MemoryRouter>
          <Login/>
        </MemoryRouter>
    );

    const image = screen.getByAltText(/Question Mark/i);
    const style = window.getComputedStyle(image);
    expect(style.animation).toContain('spin 6s linear infinite');
  });
});
