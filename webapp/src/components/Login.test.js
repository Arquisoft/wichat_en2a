import React from 'react';
import { render, fireEvent, screen, waitFor, act } from '@testing-library/react';
import Login from './Login';
import { MemoryRouter } from 'react-router-dom';
import MockAdapter from "axios-mock-adapter";
import axios from "axios";
import {AuthProvider} from "./AuthContext";

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
}));
jest.setTimeout(20000);

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

  const renderLoginComponent = () => {
    render(
        <AuthProvider>
          <MemoryRouter>
            <Login />
          </MemoryRouter>
        </AuthProvider>
    );
  };

  it('Renders all components', async () => {
    mockAxios.onPost('http://localhost:8000/login').reply(200, {createdAt: '2024-01-01T12:34:56Z'});

    renderLoginComponent();
    expect(await screen.findByText('Challenge your knowledge!')).toBeInTheDocument();
    expect(await screen.getByText(/Login 🧠/i)).toBeInTheDocument();
    expect(await screen.getByLabelText(/Username/i)).toBeInTheDocument();
    expect(await screen.getByLabelText(/Password/i)).toBeInTheDocument();
    expect(await screen.getByAltText(/Question Mark/i)).toBeInTheDocument();
    expect(await screen.findByText('HappySW-RTVE')).toBeInTheDocument();
  })

  it('should log in successfully', async () => {
    mockAxios.onPost('http://localhost:8000/login').reply(200, { createdAt: '2024-01-01T12:34:56Z' });

    renderLoginComponent();

    await fillLoginFormAndSubmit();

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/home');
    });
  });

  it('should apply the spinning animation to the image', async () => {
    mockAxios.onPost('http://localhost:8000/login').reply(200, {createdAt: '2024-01-01T12:34:56Z'});

    renderLoginComponent();

    const image = screen.getByAltText(/Question Mark/i);
    const style = window.getComputedStyle(image);
    expect(style.animation).toContain('spin 6s linear infinite');
  });

  it('closes the success snackbar when handleCloseSnackbar is called', async () => {
    mockAxios.onPost('http://localhost:8000/login').reply(200, {
      userId: '123', username: 'testUser', token: 'abc', createdAt: '2024-01-01T12:34:56Z'
    });

    renderLoginComponent();

    await fillLoginFormAndSubmit();

    expect(screen.getByText(/Login successful/i)).toBeInTheDocument();
    //Wait until the snack bar is automatically closed
    await waitFor(() => {
      expect(screen.queryByText(/Login successful/i)).not.toBeInTheDocument();
    }, { timeout: 7000}
    );
  });

  it('should show error message when an error happens', async () => {
    // Simulate error response without "error" field
    mockAxios.onPost('http://localhost:8000/login').reply(500, {});

    renderLoginComponent();

    await fillLoginFormAndSubmit();

    expect(await screen.findByText(/Login failed/i)).toBeInTheDocument();
  });

  it('should display and close the error Snackbar when an error occurs', async () => {
    mockAxios.onPost('http://localhost:8000/login').reply(500, { error: 'Invalid credentials' });

    renderLoginComponent();

    await fillLoginFormAndSubmit();

    const snackbar = await screen.findByText(/Error: Invalid credentials/i);
    expect(snackbar).toBeInTheDocument();

    fireEvent.click(snackbar);

    await waitFor(() => {
      expect(screen.queryByText(/Error: Invalid credentials/i)).not.toBeInTheDocument();
    }, { timeout: 7000 });
  });

  it('should disable login button if username or password is missing', async () => {
    renderLoginComponent();
  
    const usernameInput = screen.getByLabelText(/Username/i);
    const passwordInput = screen.getByLabelText(/Password/i);
    const loginButton = screen.getByRole('button', { name: /Login/i });
  
    fireEvent.change(usernameInput, { target: { value: 'testUser' } });
    expect(loginButton).toBeDisabled();
  
    fireEvent.change(usernameInput, { target: { value: '' } });
    fireEvent.change(passwordInput, { target: { value: 'testPassword' } });
    expect(loginButton).toBeDisabled();

    fireEvent.change(passwordInput, { target: { value: '' } });
    expect(loginButton).toBeDisabled();
  });

  it('should navigate to /admin if user is an admin', async () => {
    mockAxios.onPost('http://localhost:8000/login').reply(200, {
      userId: 'adminId',
      username: 'adminUser',
      token: 'adminToken',
      isAdmin: true,
    });
    renderLoginComponent();
    await fillLoginFormAndSubmit();
  
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/admin');
    });
  });

  it('should send login request to the correct API endpoint', async () => {
    const spy = jest.spyOn(axios, 'post');
    mockAxios.onPost('http://localhost:8000/login').reply(200, {
      userId: 'userId',
      username: 'testUser',
      token: 'token123'
    });
    
    renderLoginComponent();
    await fillLoginFormAndSubmit();

    await waitFor(() => {
      expect(spy).toHaveBeenCalledWith(
        'http://localhost:8000/login',
        expect.objectContaining({
          username: 'testUser',
          password: 'testPassword' //NOSONAR
        })
      );
    });
  });  
  
});
